"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckoutModal } from "./Checkout";
import type { CheckoutPack } from "./Checkout";
import { CardArt } from "./CardArt";
import { AuthGatePrompt } from "./AuthGatePrompt";
import { useAuth } from "./AuthProvider";
import { createLocalIdempotencyKey, fetchCreditBalance, grantCredits } from "../lib/api";
import { publishCreditBalance } from "../lib/creditBalance";
import { lookupPromo, promoDiscount, PROMO_INVALID_MESSAGE } from "../lib/promo";
import type { AppliedPromo } from "../lib/promo";
import {
  PRINT_AND_SEND_CART_ID,
  makeBigSenderCartItem,
  makePrintAndSendCartItem,
} from "./pricingCatalog";
import { usePriceCountry } from "./pricing/usePriceCountry";
import { COUNTRY_NAMES, PRICE_LISTS, formatAmount, toCurrency, type Currency } from "../lib/priceLists";
import { TAX_NOTE, orderTotals } from "../lib/taxEstimate";
import { PrintSendReadyModal } from "./pricing/PrintSendReadyModal";
import type { PurchaseReadyKind } from "./pricing/PrintSendReadyModal";
import { addDemoBalance, getCartTopUpDelta } from "./DemoBalance";
import { consumePricingReturn } from "./PricingReturn";
import { CREATE_OPTIONS } from "./createOptions";
import { CART_CHANGED_EVENT, SOUV_CART_KEY, notifyCartChanged } from "./cartStorage";

type CartItem = {
  id: string;
  type: string;
  name: string;
  meta?: string;
  sub?: string;
  qty: number;
  price: number;
  unitNote?: string;
  palette?: string;
  glyph?: string;
  glowIdx?: number;
  lockedQuantity?: boolean;
  cardCount?: number;
  creditsPerCard?: unknown;
  replaceGroup?: string;
  cards?: unknown;
  tokens?: unknown;
  /** The price list the item was priced from; older carts have none (CAD). */
  currency?: Currency;
};

type CartThumbProps = {
  item: CartItem;
};

type CartItemKind = "card" | "pack" | "credits" | "item";

type CartItemPresentation = {
  kind: CartItemKind;
  label: string;
  icon: CartIconName;
};

type CartIconName = "minus" | "plus" | "close" | "trash" | "lock" | "arrow" | "cart" | "tag" | "truck" | "card" | "cards" | "coin";

type CartIcoProps = {
  name: CartIconName;
  w?: number;
};

type CartLineProps = {
  item: CartItem;
  onQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
};

/** Create flows that save the card before a top-up: paying returns there instead of stopping on the cart. */
const CREATE_FLOW_RETURNS = [CREATE_OPTIONS.build.href, CREATE_OPTIONS.template.href];

const CART_SEED: CartItem[] = [];
// The one cart key (cartStorage.ts), not a second copy of the string (audit P5).
const CART_KEY = SOUV_CART_KEY;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

/**
 * Rebuilds catalog items (Print and Send, Big Sender, credit top-ups) from the
 * price list for `currency`, so a stored price can't drift and a cart built
 * in the other currency (e.g. before signing in) is re-priced.
 */
function normalizeCartItems(raw: unknown, currency: Currency): CartItem[] {
  if (!Array.isArray(raw)) return CART_SEED;
  const list = PRICE_LISTS[currency];
  const next: CartItem[] = [];

  raw.forEach((item, index) => {
    if (!isRecord(item)) return;

    const source = item as Partial<CartItem>;
    const isBigSender = source.id === "pack-bigsender" || source.replaceGroup === "pack-bigsender";
    const isPrintAndSend = source.id === PRINT_AND_SEND_CART_ID || source.replaceGroup === PRINT_AND_SEND_CART_ID;
    const creditPack = typeof source.id === "string" && source.id.startsWith("credit-")
      ? list.creditPacks.find((pack) => `credit-${pack.id}` === source.id)
      : undefined;
    const normalized: CartItem = isBigSender
      ? makeBigSenderCartItem(source.cardCount || parseInt(String(source.meta || ""), 10) || source.qty || 2, list.bigSender, currency)
      : isPrintAndSend
        ? makePrintAndSendCartItem(currency)
      : creditPack
        ? { ...source, id: source.id as string, type: "credits", name: source.name || "Credits", qty: Math.max(1, Math.floor(Number(source.qty) || 1)), price: creditPack.price, currency }
        : {
          ...source,
          id: source.id || `cart-item-${index}`,
          type: source.type || "cart",
          name: source.name || "Cart item",
          qty: Math.max(1, Math.floor(Number(source.qty) || 1)),
          price: Number(source.price) || 0,
          currency: toCurrency(source.currency) || currency,
        };

    const existing = next.find((candidate) => candidate.id === normalized.id);
    if (existing) {
      if (normalized.id === "pack-bigsender" || normalized.id === PRINT_AND_SEND_CART_ID) {
        Object.assign(existing, normalized);
      } else {
        existing.qty += normalized.qty;
      }
    } else {
      next.push(normalized);
    }
  });

  return next;
}

function readStoredCart(): unknown {
  if (typeof window === "undefined") return CART_SEED;
  try {
    return JSON.parse(window.localStorage.getItem(CART_KEY) || "null") || CART_SEED;
  } catch {
    return CART_SEED;
  }
}

/** True when a stored item was priced in another currency than `currency`. */
function pricedInOtherCurrency(raw: unknown, currency: Currency) {
  return Array.isArray(raw) && raw.some((item) => isRecord(item) && (toCurrency(item.currency) || "CAD") !== currency);
}

function loadCart(currency: Currency): CartItem[] {
  return normalizeCartItems(readStoredCart(), currency);
}

function getCartItemPresentation(item: CartItem): CartItemPresentation {
  const type = String(item.type || "").toLowerCase();
  const name = String(item.name || "").toLowerCase();

  if (type === "credits" || name.includes("credit") || item.tokens != null) {
    return { kind: "credits", label: "Creation credits", icon: "coin" };
  }

  if (type === "card") {
    return { kind: "card", label: "Saved card", icon: "card" };
  }

  if (type === "pack" || item.cardCount != null || item.cards != null) {
    return { kind: "pack", label: "Card pack", icon: "cards" };
  }

  return { kind: "item", label: "Cart item", icon: "cart" };
}

// Our small gold "S" logo (same artwork as the nav) on the card pack, Print and
// Send and credit thumbnails (owner, 2026-11-06). Decorative: the badge carries the label.
function CartThumbLogo({ className }: { className: string }) {
  return <Image className={className} src="/assets/logomark-gold-silver.png" alt="" width={400} height={600} sizes="40px" />;
}

function CartThumb({ item }: CartThumbProps) {
  const presentation = getCartItemPresentation(item);
  const badge = (
    <span className="ct-thumb-badge" role="img" aria-label={presentation.label}>
      <CartIco name={presentation.icon} w={14} />
    </span>
  );

  if (presentation.kind === "card") {
    return (
      <div className="ct-thumb ct-thumb-card">
        <CardArt palette={item.palette} glyph={item.glyph} glowIdx={item.glowIdx} corners figure />
        {badge}
      </div>
    );
  }

  if (presentation.kind === "pack") {
    return (
      <div className="ct-thumb ct-thumb-pack">
        <span className="ct-pack-card c3" aria-hidden="true" />
        <span className="ct-pack-card c2" aria-hidden="true" />
        <span className="ct-pack-card c1" aria-hidden="true"><CartThumbLogo className="ct-thumb-logo" /></span>
        {badge}
      </div>
    );
  }

  return (
    <div className={`ct-thumb ct-thumb-token ct-thumb-${presentation.kind}`}>
      {presentation.kind === "credits" ? (
        <span className="ct-token ct-token-logo" aria-hidden="true">
          <CartThumbLogo className="ct-thumb-logo" />
        </span>
      ) : (
        <span className="ct-token" aria-hidden="true">
          <CartIco name={presentation.icon} w={28} />
        </span>
      )}
      {badge}
    </div>
  );
}

function CartIco({ name, w = 16 }: CartIcoProps) {
  const path = {
    minus: <path d="M5 12h14" />,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    trash: <><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7" /><path d="M10 11v6M14 11v6" /></>,
    lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    cart: <><path d="M3 5h2.4l2.3 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.96-1.6L21 9H6" /><circle cx="10" cy="21" r="1.2" /><circle cx="17" cy="21" r="1.2" /></>,
    tag: <><path d="M3 11.5V4a1 1 0 0 1 1-1h7.5L21 12.5 12.5 21 3 11.5z" /><circle cx="7.5" cy="7.5" r="1.3" /></>,
    truck: <><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></>,
    card: <><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M8.5 7.5h7M8.5 11h7M8.5 14.5h4" /></>,
    cards: <><rect x="7" y="4" width="12" height="16" rx="2" /><path d="M5 7.5h-.5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2H13" /><path d="M10 8h6M10 11.5h6M10 15h3.5" /></>,
    coin: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v9M8.75 10.25c0-1.5 1.45-2.35 3.25-2.35s3.25.85 3.25 2.35c0 3-6.5 1.35-6.5 4.15 0 1.45 1.45 2.2 3.25 2.2s3.25-.75 3.25-2.2" /></>,
  }[name];

  return (
    <svg viewBox="0 0 24 24" width={w} height={w} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{path}</svg>
  );
}

function CartLine({ item, onQty, onRemove }: CartLineProps) {
  const lockedQuantity = item.lockedQuantity;
  const lockedLabel = item.cardCount
    ? `${item.cardCount} ${item.cardCount === 1 ? "card" : "cards"}`
    : `${item.qty} ${item.qty === 1 ? "item" : "items"}`;

  return (
    <li className="ct-line">
      <CartThumb item={item} />
      <div className="ct-line-main">
        <h3 className="ct-line-name">{item.name}</h3>
        {item.meta && <p className="ct-line-meta">{item.meta}</p>}
        {item.sub && <p className="ct-line-sub">{item.sub}</p>}
        <button type="button" className="ct-line-remove" onClick={() => onRemove(item.id)}>
          <CartIco name="trash" w={15} /> Remove<span className="l-sr-only"> {item.name}</span>
        </button>
      </div>
      <div className="ct-line-right">
        {lockedQuantity ? (
          <p className="ct-qty-locked">
            <span className="ct-qty-num" aria-hidden="true">{item.cardCount || item.qty}</span>
            <span className="ct-qty-label" aria-hidden="true">{item.cardCount ? (item.cardCount === 1 ? "card" : "cards") : "item"}</span>
            <span className="l-sr-only">{`${lockedLabel} selected`}</span>
          </p>
        ) : (
          <div className="ct-stepper" role="group" aria-label={`Quantity of ${item.name}`}>
            {/* At 1 it stays focusable (aria-disabled): a disabled button would drop focus to <body>. */}
            <button type="button" onClick={() => { if (item.qty > 1) onQty(item.id, -1); }} aria-disabled={item.qty <= 1 || undefined} aria-label="Decrease quantity">
              <CartIco name="minus" w={16} />
            </button>
            <span className="ct-qty-num" aria-live="polite">{item.qty}</span>
            <button type="button" onClick={() => onQty(item.id, 1)} aria-label="Increase quantity">
              <CartIco name="plus" w={16} />
            </button>
          </div>
        )}
        <p className="ct-line-price">{formatAmount(item.price * item.qty)}</p>
        <p className="ct-line-unit">{formatAmount(item.price)} {"·"} {item.unitNote}</p>
      </div>
    </li>
  );
}

function CartEmpty() {
  return (
    <section className="ct-state" aria-labelledby="ct-empty-title">
      <span className="ct-state-ico" aria-hidden="true"><CartIco name="cart" w={34} /></span>
      <h2 id="ct-empty-title" className="ct-state-title">Your cart is empty</h2>
      <p className="ct-state-text">Nothing waiting to send just yet. Start a card or browse a template, and it&apos;ll land here.</p>
      <div className="ct-state-actions">
        <Link href="/create/personalize-a-template" className="l-btn l-btn-primary">Browse templates <CartIco name="arrow" w={16} /></Link>
        <Link href="/create/build-my-card" className="l-btn l-btn-secondary">Build my card</Link>
      </div>
    </section>
  );
}

function CartPaid() {
  return (
    <section className="ct-state is-paid" aria-labelledby="ct-paid-title">
      <span className="ct-state-ico" aria-hidden="true"><CartIco name="lock" w={30} /></span>
      <h2 id="ct-paid-title" className="ct-state-title">Payment confirmed</h2>
      <p className="ct-state-text">
        Thank you. Your order is in. A receipt is on its way to your inbox,
        and your cards, packs, and credits are now on your account.
      </p>
      <div className="ct-state-actions">
        <Link href="/create/my-cards-and-songs" className="l-btn l-btn-primary">Go to Saved Cards &amp; Songs <CartIco name="arrow" w={16} /></Link>
        <Link href="/create/personalize-a-template" className="l-btn l-btn-secondary">Keep browsing</Link>
      </div>
    </section>
  );
}

function CartPage() {
  const router = useRouter();
  const auth = useAuth();
  const [items, setItems] = React.useState<CartItem[]>(CART_SEED);
  const [hydrated, setHydrated] = React.useState(false);
  const [promo, setPromo] = React.useState("");
  const [appliedPromo, setAppliedPromo] = React.useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = React.useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const grantKeyRef = React.useRef<string | null>(null);
  const [authPromptOpen, setAuthPromptOpen] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState(false);
  // "Your card is waiting" pop-up after paying for Print and Send, Big Sender or credits.
  const [purchaseReadyOpen, setPurchaseReadyOpen] = React.useState(false);
  const [purchaseReadyKind, setPurchaseReadyKind] = React.useState<PurchaseReadyKind>("cards");
  const isAuthenticated = auth.status === "authenticated" && Boolean(auth.user?.id);
  const { country, currency } = usePriceCountry();
  // Shown when the cart had to be re-priced into this account's currency.
  const [repricedTo, setRepricedTo] = React.useState<Currency | null>(null);

  // Load (and re-price) whenever the currency is known or changes, e.g. on sign-in.
  React.useEffect(() => {
    const stored = readStoredCart();
    if (pricedInOtherCurrency(stored, currency)) setRepricedTo(currency);
    setItems(normalizeCartItems(stored, currency));
    setHydrated(true);
  }, [currency]);

  React.useEffect(() => {

    // Stay in step with the saved cart when something else changes it while this
    // page is open (e.g. choosing a pack in the nav's Top up credits pop-up, or
    // another tab). Without this the page kept its old lines, charged the old
    // total, and its next save dropped the new item. Only replaces the lines if
    // they really differ, so this page's own saves don't loop.
    const sync = () => {
      const stored = loadCart(currency);
      setItems((current) => (
        JSON.stringify(normalizeCartItems(current, currency)) === JSON.stringify(stored) ? current : stored
      ));
    };
    const onStorage = (event: StorageEvent) => { if (event.key === null || event.key === CART_KEY) sync(); };
    window.addEventListener(CART_CHANGED_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, [currency]);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(normalizeCartItems(items, currency)));
      notifyCartChanged();
    } catch {}
  }, [items, hydrated, currency]);

  function onQty(id: string, delta: number) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  }

  function onRemove(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function applyPromo() {
    const code = promo.trim();
    if (!code) return;
    const found = lookupPromo(code);
    setAppliedPromo(found);
    setPromoError(found ? null : PROMO_INVALID_MESSAGE);
  }

  async function handlePaid() {
    const topUpDelta = getCartTopUpDelta(items);
    // One key per checkout: a retry after a failed grant reuses it, so the
    // credits can't be added twice (audit B4, 2026-11-08).
    grantKeyRef.current ??= createLocalIdempotencyKey(`cart-credit-grant-${topUpDelta.credits}`);
    const userId = auth.user?.id;

    if (topUpDelta.credits > 0) {
      if (!userId) {
        setCheckoutOpen(false);
        setAuthPromptOpen(true);
        return;
      }

      const grant = await grantCredits({
        userId,
        amount: topUpDelta.credits,
        source: "mock_checkout_purchase",
        idempotencyKey: grantKeyRef.current,
      });

      if (grant.balance) {
        publishCreditBalance(grant.balance);
      } else {
        publishCreditBalance(await fetchCreditBalance(userId));
      }
    }

    const boughtPrintAndSend = items.some((item) => item.id === PRINT_AND_SEND_CART_ID);
    // Owner, 2026-11-07: the same pop-up follows Big Sender and credit top-ups too.
    const boughtBigSender = items.some((item) => item.id === "pack-bigsender" || item.replaceGroup === "pack-bigsender");
    const boughtCredits = items.some((item) => item.type === "credits");
    if (topUpDelta.cards > 0) addDemoBalance({ cards: topUpDelta.cards });
    setCheckoutOpen(false);
    setItems([]);
    try {
      window.localStorage.removeItem(CART_KEY);
      notifyCartChanged();
    } catch {}

    const returnTo = consumePricingReturn();
    // Print and Send: stay on the payment confirmation and open the pop-up (owner
    // decision 2026-11-04), even if a return page was saved. Except when it was bought
    // from Delivery's out-of-cards pop-up: the card is already made, so go straight
    // back to send it (owner, 2026-11-07).
    // Title: "Your cards are waiting" if any cards were bought, "Your credits are waiting" for credits only.
    setPurchaseReadyKind(boughtPrintAndSend || boughtBigSender ? "cards" : "credits");
    // The same for a card bought from a create flow's top-up (Build My Card or
    // Personalize a Template, owner 2026-11-08): its saved card is waiting.
    const backToWork = returnTo === "/delivery" || CREATE_FLOW_RETURNS.some((path) => Boolean(returnTo?.startsWith(path)));
    if (boughtPrintAndSend && !backToWork) {
      setConfirmed(true);
      setPurchaseReadyOpen(true);
      return;
    }
    // Sent here from another page (e.g. ran out of credits in Build My Card, or
    // "Reserve cards" on Delivery): go straight back, no pop-up (owner, 2026-11-07).
    if (returnTo) {
      router.push(returnTo);
      return;
    }

    setConfirmed(true);
    if (boughtBigSender || boughtCredits) setPurchaseReadyOpen(true);
  }

  function handleCheckoutClick() {
    if (!isAuthenticated) {
      setAuthPromptOpen(true);
      return;
    }
    grantKeyRef.current = null; // a new checkout gets a new key
    setCheckoutOpen(true);
  }

  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const cardCount = items.reduce((sum, item) => sum + (item.cardCount || 0), 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const lockedCartItem = items.length === 1 && items[0].lockedQuantity && items[0].cardCount ? items[0] : null;
  const lockedCardCount = lockedCartItem?.cardCount ?? 0;
  // Print and Send and Big Sender both carry 10 credits per card; a missing value falls back to 10.
  const storedCreditsPerCard = Number(lockedCartItem?.creditsPerCard);
  const lockedCreditsPerCard = Number.isFinite(storedCreditsPerCard) ? storedCreditsPerCard : 10;
  const checkoutPack: CheckoutPack = lockedCartItem
    ? { kind: "cards", name: lockedCartItem.name, price: subtotal, cards: lockedCardCount, tokens: lockedCardCount * lockedCreditsPerCard, bonus: 0 }
    : { kind: "cart", name: "Your cart", price: subtotal, lineCount: count, cardCount };
  const discount = promoDiscount(subtotal, appliedPromo);
  const { tax, taxLabel, total } = orderTotals(subtotal, discount, country);

  return (
    <>
      <div className="cf-wrap ct-wrap" data-screen-label="Cart">
        <header className="cf-head">
          <h1 className="cf-title">
            Your <span className="l-script">cart</span>
          </h1>
          {!confirmed && repricedTo && items.length > 0 && (
            <p className="cf-alert ct-repriced" role="status">Prices are shown in {repricedTo} for {COUNTRY_NAMES[country]}, your account&apos;s country.</p>
          )}
          {!confirmed && items.length > 0 && (
            <p className="cf-lede">
              {count} {count === 1 ? "item" : "items"} ready to check out: cards, packs, and credits all in one go.
            </p>
          )}
        </header>

        {confirmed ? <CartPaid /> : items.length === 0 ? <CartEmpty /> : (
          <div className="ct-grid">
            <section className="ct-items" aria-labelledby="ct-items-title">
              <h2 id="ct-items-title" className="l-sr-only">Items in your cart</h2>
              <div className="ct-items-head" aria-hidden="true">
                <span>Item</span>
                <span>Qty {"·"} Price</span>
              </div>
              <ul className="ct-lines">
                {items.map((item) => (
                  <CartLine key={item.id} item={item} onQty={onQty} onRemove={onRemove} />
                ))}
              </ul>
              <Link href="/pricing" className="ct-continue">
                {"← Add more cards"}
              </Link>
            </section>

            <aside className="ct-summary-wrap" aria-labelledby="ct-summary-title">
              <div className="ct-summary">
                <h2 id="ct-summary-title" className="ct-summary-title">Order summary</h2>

                <dl className="cf-rows ct-sum-rows">
                  <div>
                    <dt>Subtotal</dt>
                    <dd>{formatAmount(subtotal)}</dd>
                  </div>
                  <div>
                    <dt><CartIco name="truck" w={15} /> Postage</dt>
                    <dd className="is-included">Included</dd>
                  </div>
                  {appliedPromo && (
                    <div>
                      <dt>Promo {"·"} {appliedPromo.code}</dt>
                      <dd className="is-discount">{"−"}{formatAmount(discount)}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{taxLabel}</dt>
                    <dd>{formatAmount(tax)}</dd>
                  </div>
                </dl>

                <div className="ct-promo">
                  {appliedPromo ? (
                    <p className="ct-promo-ok" role="status"><CartIco name="tag" w={14} /> Code <b>{appliedPromo.code}</b> applied {"·"} {appliedPromo.percentOff}% off</p>
                  ) : (
                    <>
                    <div className="ct-promo-row">
                      <label className="l-sr-only" htmlFor="ct-promo-input">Promo code</label>
                      <input
                        id="ct-promo-input"
                        className="cf-input"
                        value={promo}
                        onChange={(event) => { setPromo(event.target.value.toUpperCase()); setPromoError(null); }}
                        placeholder="Promo code"
                        aria-invalid={promoError ? true : undefined}
                        aria-describedby={promoError ? "ct-promo-error" : undefined}
                        autoComplete="off"
                        onKeyDown={(event) => { if (event.key === "Enter") applyPromo(); }}
                      />
                      <button type="button" className="l-btn l-btn-secondary ct-promo-apply" onClick={applyPromo}>Apply</button>
                    </div>
                    <p className="l-sr-only" role="status">{promoError ?? ""}</p>
                    {promoError && <span id="ct-promo-error" className="cf-err">{promoError}</span>}
                    </>
                  )}
                </div>

                <p className="ct-total">
                  <span className="ct-total-label">Total</span>
                  <span className="ct-total-val">{formatAmount(total)}<span className="cur">{currency}</span></span>
                </p>

                <button type="button" className="l-btn l-btn-primary ct-checkout" onClick={handleCheckoutClick}>
                  Proceed to checkout <CartIco name="arrow" w={16} />
                </button>
                <p className="ct-secure"><CartIco name="lock" w={14} /> Secure checkout {"·"} payments by <b>Stripe</b></p>
              </div>

              <p className="ct-foot">Postage is always included. {TAX_NOTE}</p>
            </aside>
          </div>
        )}
      </div>
      <CheckoutModal
        open={checkoutOpen}
        pack={checkoutPack}
        country={country}
        currency={currency}
        promo={appliedPromo}
        onClose={() => setCheckoutOpen(false)}
        onBack={() => setCheckoutOpen(false)}
        onPaid={handlePaid}
      />
      <AuthGatePrompt
        open={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
        returnTo="/cart"
        title="Log in before"
        script="checkout"
        body="Sign up or log in to purchase cards and credits so everything is added to your account, not a temporary demo profile."
        primaryLabel="Sign up"
        secondaryLabel="Log in"
      />
      {purchaseReadyOpen && <PrintSendReadyModal kind={purchaseReadyKind} onClose={() => setPurchaseReadyOpen(false)} />}
    </>
  );
}

export { CartPage };
