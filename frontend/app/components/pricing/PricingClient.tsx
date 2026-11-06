"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchPricingOffers, type PricingOffer } from "../../lib/api";
import { useAuth } from "../AuthProvider";
import { notifyCartChanged } from "../cartStorage";
import {
  type BigSenderTier,
  MIN_BIG_SENDER_CARDS,
  PRINT_AND_SEND_PRICE,
  SOUV_CART_KEY,
  clampBigSenderQuantity,
  getBigSenderPricing,
  makeBigSenderCartItem,
  makePrintAndSendCartItem,
} from "../pricingCatalog";
import { CREDIT_PACKS, type CreditPack } from "./pricingContent";

// The Pricing page's interactive parts (/pricing, also /account/top-up), on the
// berry & ivory system. Styles: styles/pricing.css.
//
// Behaviour kept from the old page (components/Options.tsx):
// - Big Sender tiers come from the PostgreSQL pricing endpoint (GET /pricing).
// - Buying while signed out goes to /signup?returnTo=/pricing; signed in, the
//   item is added to the cart (localStorage "souv_cart") and the cart opens.
// Changed (owner decisions 2026-11-04):
// - Print and Send ($9.99) replaces Try Risk-Free. Its price comes from the catalog
//   (migration 006), falling back to PRINT_AND_SEND_PRICE in pricingCatalog.ts.
// - Big Sender has no maximum quantity (the last tier is open-ended).

type CartItem = {
  id: string;
  type: "credits" | "pack";
  name: string;
  meta: string;
  sub: string;
  price: number;
  qty: number;
  unitNote: string;
  replaceGroup?: string;
  cardCount?: number;
  creditsPerCard?: number;
  tokens?: string;
  lockedQuantity?: boolean;
};

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

// Same cart rules as before: catalog packs replace an earlier copy of
// themselves, other items stack.
function addToCart(item: CartItem) {
  try {
    let current = JSON.parse(window.localStorage.getItem(SOUV_CART_KEY) || "[]") as CartItem[];
    if (!Array.isArray(current)) current = [];
    if (item.replaceGroup) {
      current = current.filter((candidate) => candidate?.replaceGroup !== item.replaceGroup && candidate?.id !== item.id);
    }
    const existing = item.replaceGroup ? null : current.find((candidate) => candidate?.id === item.id);
    if (existing) existing.qty += item.qty || 1;
    else current.push(item);
    window.localStorage.setItem(SOUV_CART_KEY, JSON.stringify(current));
    notifyCartChanged();
  } catch {
    // Storage may be unavailable; the cart still opens.
  }
}

/** Signed out: sign up, then come back to `returnTo`. Signed in: add to the cart and open it. */
function useBuy(returnTo = "/pricing") {
  const router = useRouter();
  const auth = useAuth();
  return React.useCallback((item: CartItem) => {
    if (auth.status !== "authenticated") {
      router.push(`/signup?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    addToCart(item);
    router.push("/cart");
  }, [auth.status, returnTo, router]);
}

function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/**
 * "Send 1 card • Shipping included": spaced-capital labels with dot separators.
 * `rows` are separate lines, so a dot never hangs at the end of a wrapped line;
 * on narrow phones a row's items stack without dots (pricing.css).
 */
function MetaLine({ rows }: { rows: string[][] }) {
  return (
    <p className="pr-meta">
      {rows.map((row) => (
        <span key={row.join()} className={`pr-meta-row ${row.join(" ").length > 32 ? "is-long" : ""}`}>
          {row.map((item, index) => (
            <React.Fragment key={item}>
              {index > 0 && <span className="pr-meta-dot" aria-hidden="true" />}
              <span>{item}</span>
            </React.Fragment>
          ))}
        </span>
      ))}
    </p>
  );
}

type HowItem = { title: string; body: React.ReactNode };

function HowItWorks({ id, items }: { id: string; items: HowItem[] }) {
  return (
    <div className="pr-how">
      <h3 id={id} className="pr-how-title">How it works</h3>
      <ol className="pr-how-list" aria-labelledby={id}>
        {items.map((item, index) => (
          <li key={item.title} className="pr-how-item">
            <span className="pr-how-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <p className="pr-how-item-title">{item.title}</p>
              <p className="pr-how-item-body">{item.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ============================================================
// Print and Send (condensed copy approved 2026-11-04: shorter intro, and the
// card-bank explanation is now step 1 of How it works)
// ============================================================
/**
 * Print and Send's price from the pricing catalog (`print_and_send`, migration 006), in dollars.
 * Falls back to PRINT_AND_SEND_PRICE while loading or if the backend is down, so the card never waits.
 * The cart and checkout still price it from PRINT_AND_SEND_PRICE (like Big Sender's tiers), so a
 * mismatch is logged in development; keep the two equal until checkout reads the catalog.
 */
function printAndSendPriceFrom(offers: PricingOffer[]): number {
  const offer = offers.find((candidate) => candidate.type === "print_and_send" || candidate.id === "print_and_send");
  const price = offer && Number.isFinite(offer.priceCents) && offer.priceCents > 0 ? offer.priceCents / 100 : null;
  if (price === null) return PRINT_AND_SEND_PRICE;
  if (price !== PRINT_AND_SEND_PRICE && process.env.NODE_ENV !== "production") {
    console.warn(`Print and Send: catalog says $${price.toFixed(2)} but the cart uses $${PRINT_AND_SEND_PRICE.toFixed(2)} (pricingCatalog.ts).`);
  }
  return price;
}

function PrintAndSendCard({ price: priceValue }: { price: number }) {
  const buy = useBuy();
  const price = money(priceValue);

  return (
    <article className="pr-offer" aria-labelledby="pr-ps-name">
      <div className="pr-offer-top">
        <header className="pr-offer-head">
          <h2 id="pr-ps-name" className="pr-offer-name">Print and Send</h2>
          <MetaLine rows={[["Send 1 card", "Shipping included"]]} />
        </header>
        <p className="pr-price">{price}</p>
      </div>
      <p className="pr-offer-text">One flat price, shipping included Canada-wide. Prices in CAD; tax is extra.</p>

      <HowItWorks
        id="pr-ps-how"
        items={[
          { title: "Buy your card", body: "It waits in your card bank, shown as Cards at the top of the page and in the menu." },
          { title: "Choose a card", body: "Pick a saved card or one from Community Cards." },
          { title: "Add the details", body: "Write your message and their address, add a saved song if you like, and we’ll print and ship it." },
        ]}
      />

      <button type="button" className="l-btn l-btn-primary pr-cta" onClick={() => buy(makePrintAndSendCartItem())}>
        <span>Buy Print and Send</span>
        <IconArrow />
      </button>
    </article>
  );
}

// ============================================================
// Big Sender (tiers from the backend pricing catalog)
// ============================================================
type BigSenderData = {
  tiers: BigSenderTier[];
  minCards: number;
  creditsPerCard: number;
};

function formatTierLabel(min: number, max: number, isLast: boolean) {
  // The last tier is open-ended ("21-30+ cards").
  if (isLast) return `${min}-${max}+ cards`;
  if (min === max) return `${min} ${min === 1 ? "card" : "cards"}`;
  return `${min}-${max} cards`;
}

function buildBigSender(offers: PricingOffer[]): BigSenderData | null {
  const sorted = offers
    .filter((offer) => offer.type === "big_sender")
    .sort((a, b) => a.cardCountMin - b.cardCountMin);
  if (sorted.length === 0) return null;
  return {
    tiers: sorted.map((offer, index) => ({
      min: offer.cardCountMin,
      max: offer.cardCountMax,
      pricePerCard: Number(((offer.priceCents ?? 0) / 100).toFixed(2)),
      label: formatTierLabel(offer.cardCountMin, offer.cardCountMax, index === sorted.length - 1),
    })),
    minCards: sorted[0].cardCountMin ?? MIN_BIG_SENDER_CARDS,
    creditsPerCard: sorted[0].creditsPerCard ?? 10,
  };
}

function BigSenderCard({ data }: { data: BigSenderData }) {
  const buy = useBuy();
  const { tiers, minCards, creditsPerCard } = data;
  const [qty, setQty] = React.useState(minCards);
  // What's in the box while typing (may be empty); `qty` is always valid.
  const [draft, setDraft] = React.useState(String(minCards));

  React.useEffect(() => {
    setQty((current) => clampBigSenderQuantity(current, minCards));
  }, [minCards]);
  React.useEffect(() => setDraft(String(qty)), [qty]);

  const setQtyClamped = (next: number | string) => setQty(clampBigSenderQuantity(next, minCards));
  const pricing = getBigSenderPricing(qty, tiers);
  const lastTier = tiers[tiers.length - 1];

  return (
    <article className="pr-offer" aria-labelledby="pr-bs-name">
      <div className="pr-offer-top">
        <header className="pr-offer-head">
          <h2 id="pr-bs-name" className="pr-offer-name">Big Sender</h2>
          <MetaLine rows={[["Send multiple different cards", "Includes shipping"], [`${creditsPerCard} AI creation credits per card`]]} />
        </header>
      </div>

      <div className="pr-tiers" role="group" aria-label="Volume tiers">
        {tiers.map((tier) => {
          const active = tier === lastTier ? qty >= tier.min : qty >= tier.min && qty <= tier.max;
          return (
            <button
              key={tier.label}
              type="button"
              className={`pr-tier ${active ? "is-active" : ""}`}
              aria-pressed={active}
              onClick={() => setQtyClamped(tier.min)}
            >
              <span className="pr-tier-range">{tier.label}</span>
              <span className="pr-tier-price">{money(tier.pricePerCard)}</span>
              <span className="pr-tier-unit">/ card</span>
            </button>
          );
        })}
      </div>

      <div className="pr-qty">
        <label className="pr-qty-label" htmlFor="pr-bs-qty">How many cards?</label>
        <div className="pr-stepper">
          <button type="button" aria-label="Decrease" onClick={() => setQtyClamped(qty - 1)} disabled={qty <= minCards}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="M6 12h12" /></svg>
          </button>
          <input
            id="pr-bs-qty"
            type="number"
            inputMode="numeric"
            min={minCards}
            step={1}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              if (event.target.value !== "") setQtyClamped(event.target.value);
            }}
            onBlur={() => setDraft(String(qty))}
          />
          <button type="button" aria-label="Increase" onClick={() => setQtyClamped(qty + 1)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="M6 12h12M12 6v12" /></svg>
          </button>
        </div>
        <output className="pr-qty-total" htmlFor="pr-bs-qty" aria-live="polite">${pricing.totalText}</output>
      </div>

      <HowItWorks
        id="pr-bs-how"
        items={[
          { title: "Share the Love", body: "Send a completed card to each of your loved ones." },
          { title: "Flexible Sending Options", body: "Send the same card to everyone, or a unique card to each." },
          { title: "Always saved", body: "Design now, send later. Your cards are saved in Saved Cards & Songs for 15 months." },
        ]}
      />

      <button type="button" className="l-btn l-btn-primary pr-cta" onClick={() => buy(makeBigSenderCartItem(pricing.qty, tiers))}>
        <span>Reserve {pricing.qty} cards · ${pricing.totalText}</span>
        <IconArrow />
      </button>
    </article>
  );
}

/** Stand-in for Big Sender while its tiers load from the backend, or if they can't. */
function BigSenderPlaceholder({ status }: { status: "loading" | "error" }) {
  return (
    <article className="pr-offer pr-offer-placeholder" aria-labelledby="pr-bs-name">
      <header className="pr-offer-head">
        <h2 id="pr-bs-name" className="pr-offer-name">Big Sender</h2>
      </header>
      <p className="pr-state" role="status">
        {status === "loading" ? "Loading prices…" : "We couldn't load prices right now. Please refresh the page or try again."}
      </p>
    </article>
  );
}

export function PricingCardPacks() {
  const [state, setState] = React.useState<
    { status: "loading" } | { status: "error" } | { status: "ready"; data: BigSenderData }
  >({ status: "loading" });
  const [printAndSendPrice, setPrintAndSendPrice] = React.useState(PRINT_AND_SEND_PRICE);

  React.useEffect(() => {
    let active = true;
    fetchPricingOffers()
      .then((offers) => {
        if (!active) return;
        setPrintAndSendPrice(printAndSendPriceFrom(offers));
        const data = buildBigSender(offers);
        setState(data ? { status: "ready", data } : { status: "error" });
      })
      .catch(() => {
        if (active) setState({ status: "error" });
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="pr-offers">
      <PrintAndSendCard price={printAndSendPrice} />
      {state.status === "ready"
        ? <BigSenderCard data={state.data} />
        : <BigSenderPlaceholder status={state.status} />}
    </div>
  );
}

// ============================================================
// Creation credits (Starter / Creator / Power; copy unchanged)
// ============================================================
type CreditPacksProps = {
  /** Where a signed-out visitor returns after signing up. */
  returnTo?: string;
  /** Called after a pack is chosen, before the cart opens (the top-up modal closes itself). */
  onChosen?: () => void;
};

function CreditPackCard({ pack, returnTo, onChosen }: CreditPacksProps & { pack: CreditPack }) {
  const buy = useBuy(returnTo);
  const titleId = `pr-credit-${pack.id}`;
  return (
    <li className={`pr-credit ${pack.featured ? "is-featured" : ""}`}>
      <article aria-labelledby={titleId}>
        {pack.featured && <p className="pr-badge">{pack.badge}</p>}
        <h3 id={titleId} className="pr-credit-name">{pack.name}</h3>
        <p className="pr-credit-price">{money(pack.price)}</p>
        <p className="pr-credit-count">
          <span className="pr-credit-count-label">Credits</span>
          <span className="pr-credit-count-num">{pack.tokens}</span>
        </p>
        <p className="pr-credit-blurb">{pack.blurb}</p>
        <button
          type="button"
          className={`l-btn ${pack.featured ? "l-btn-primary" : "l-btn-secondary"} pr-cta`}
          onClick={() => { onChosen?.(); buy({
            id: `credit-${pack.id}`,
            type: "credits",
            name: `${pack.name} credits`,
            meta: `${pack.tokens} AI credits · image, edit, or QR song actions`,
            sub: pack.blurb,
            price: pack.price,
            qty: 1,
            unitNote: "one-time top-up",
            tokens: String(pack.tokens),
          }); }}
        >
          <span>Choose {pack.name}</span>
          <IconArrow />
        </button>
      </article>
    </li>
  );
}

/** The three credit packs. Used by the Pricing page and the top-up modal (TopUpCreditsModal.tsx). */
export function PricingCreditPacks({ returnTo, onChosen }: CreditPacksProps = {}) {
  return (
    <ul className="pr-credits-grid">
      {CREDIT_PACKS.map((pack) => <CreditPackCard key={pack.id} pack={pack} returnTo={returnTo} onChosen={onChosen} />)}
    </ul>
  );
}

// ============================================================
// Back link: signed in -> Create Options, signed out -> home
// ============================================================
export function PricingBackLink() {
  const auth = useAuth();
  const signedIn = auth.status === "authenticated";
  return (
    <div className={`pr-back-row ${auth.status === "loading" ? "is-pending" : ""}`}>
      <Link className="l-btn l-btn-secondary pr-back" href={signedIn ? "/create" : "/"}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        <span>{signedIn ? "Back to options" : "Back to home"}</span>
      </Link>
    </div>
  );
}
