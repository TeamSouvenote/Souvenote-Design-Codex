"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchPricingOffers, type PricingOffer } from "../../lib/api";
import { offersIn, printAndSendPriceFrom } from "./printAndSendPrice";
import { usePriceCountry } from "./usePriceCountry";
import { PRICE_LISTS, formatAmount, formatMoney, type Currency } from "../../lib/priceLists";
import { useAuth } from "../AuthProvider";
import { addItemToCart } from "../cartStorage";
import {
  type BigSenderTier,
  MIN_BIG_SENDER_CARDS,
  clampBigSenderQuantity,
  getBigSenderPricing,
  makeBigSenderCartItem,
  makePrintAndSendCartItem,
} from "../pricingCatalog";
import { creditPacksFor, type CreditPack } from "./pricingContent";

// The Pricing page's interactive parts (/pricing, also /account/top-up), on the
// berry & ivory system. Styles: styles/pricing.css.
//
// Behaviour kept from the old page (components/Options.tsx):
// - Big Sender tiers come from the PostgreSQL pricing endpoint (GET /pricing).
// - Buying while signed out goes to /signup?returnTo=/pricing; signed in, the
//   item is added to the cart (localStorage "souv_cart") and the cart opens.
// Changed (owner decisions 2026-11-04 and 2026-11-08):
// - Print and Send replaces Try Risk-Free; Big Sender has no maximum quantity
//   (the last tier is open-ended) and starts at 2 cards.
// - Canada and the US: every price comes from the visitor's list (usePriceCountry:
//   the account's country, or the "Prices for" switch when signed out), from the
//   catalog rows in that currency, falling back to lib/priceLists.ts.

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
  currency: Currency;
};

/** The small currency code after a big price ("$9.99 CAD"). */
function PriceWithCode({ value, currency, className }: { value: number; currency: Currency; className: string }) {
  return <p className={className}>{formatAmount(value)}<span className="pr-cur"> {currency}</span></p>;
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
    addItemToCart(item);
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

/**
 * Numbered steps under each offer. `collapsed` (the Top up pop-up, owner
 * 2026-11-08, audit I4) puts them behind a closed "How it works" toggle so the
 * pop-up fits one screen; the Pricing page shows them open.
 */
function HowItWorks({ id, items, collapsed = false }: { id: string; items: HowItem[]; collapsed?: boolean }) {
  const list = (
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
  );
  if (collapsed) {
    return (
      <details className="pr-how is-collapsible">
        <summary id={id} className="pr-how-title pr-how-toggle">How it works</summary>
        {list}
      </details>
    );
  }
  return (
    <div className="pr-how">
      <h3 id={id} className="pr-how-title">How it works</h3>
      {list}
    </div>
  );
}

// ============================================================
// Print and Send (condensed copy approved 2026-11-04: shorter intro, and the
// card-bank explanation is now step 1 of How it works)
// ============================================================

/**
 * Shared by the Pricing page and the nav's Top up pop-up (owner, 2026-11-07).
 * idPrefix keeps element ids unique when the pop-up opens over the Pricing page
 * ("pr" on the page, "tu" in the pop-up). onChosen runs before the cart opens.
 */
type PackOptions = { idPrefix?: string; returnTo?: string; onChosen?: () => void; /** Top up pop-up: "How it works" starts closed. */ compactHow?: boolean };

function PrintAndSendCard({ price, currency, idPrefix = "pr", returnTo, onChosen, compactHow }: { price: number; currency: Currency } & PackOptions) {
  const buy = useBuy(returnTo);

  return (
    <article className="pr-offer" aria-labelledby={`${idPrefix}-ps-name`}>
      <div className="pr-offer-top">
        <header className="pr-offer-head">
          <h2 id={`${idPrefix}-ps-name`} className="pr-offer-name">Print and Send</h2>
          <MetaLine rows={[["Send 1 card", "Postage and 10 AI creation credits included"]]} />
        </header>
        <PriceWithCode className="pr-price" value={price} currency={currency} />
      </div>
      <p className="pr-offer-text">One flat price, postage included to Canada and the US. Prices in {currency}; tax is extra.</p>

      <HowItWorks
        id={`${idPrefix}-ps-how`}
        collapsed={compactHow}
        items={[
          { title: "Buy your card + credits", body: "It waits in your card bank, shown as Credits and Cards at the top of the page and in the menu." },
          { title: "Choose a card", body: "Choose from four different creation options." },
          { title: "Add the details", body: "Write your message and their address, add a saved song if you like, and we’ll print and ship it." },
        ]}
      />

      <button type="button" className="l-btn l-btn-primary pr-cta" onClick={() => { onChosen?.(); buy(makePrintAndSendCartItem(currency, price)); }}>
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
  currency: Currency;
};

function formatTierLabel(min: number, max: number, isLast: boolean) {
  // The last tier is open-ended ("21-30+ cards").
  if (isLast) return `${min}-${max}+ cards`;
  if (min === max) return `${min} ${min === 1 ? "card" : "cards"}`;
  return `${min}-${max} cards`;
}

function buildBigSender(offers: PricingOffer[], currency: Currency): BigSenderData {
  const sorted = offersIn(offers, currency)
    .filter((offer) => offer.type === "big_sender")
    .sort((a, b) => a.cardCountMin - b.cardCountMin);
  // No catalog rows for this currency (or the backend is down): use the price list.
  if (sorted.length === 0) {
    const tiers = PRICE_LISTS[currency].bigSender;
    return { tiers, minCards: tiers[0]?.min ?? MIN_BIG_SENDER_CARDS, creditsPerCard: 10, currency };
  }
  return {
    tiers: sorted.map((offer, index) => ({
      min: offer.cardCountMin,
      max: offer.cardCountMax,
      pricePerCard: Number(((offer.priceCents ?? 0) / 100).toFixed(2)),
      label: formatTierLabel(offer.cardCountMin, offer.cardCountMax, index === sorted.length - 1),
    })),
    minCards: Math.max(MIN_BIG_SENDER_CARDS, sorted[0].cardCountMin ?? MIN_BIG_SENDER_CARDS),
    creditsPerCard: sorted[0].creditsPerCard ?? 10,
    currency,
  };
}

function BigSenderCard({ data, idPrefix = "pr", returnTo, onChosen, compactHow }: { data: BigSenderData } & PackOptions) {
  const buy = useBuy(returnTo);
  const qtyId = `${idPrefix}-bs-qty`;
  const { tiers, minCards, creditsPerCard, currency } = data;
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
    <article className="pr-offer" aria-labelledby={`${idPrefix}-bs-name`}>
      <div className="pr-offer-top">
        <header className="pr-offer-head">
          <h2 id={`${idPrefix}-bs-name`} className="pr-offer-name">Big Sender</h2>
          <MetaLine rows={[[`Send ${minCards} or more cards`, `Postage and ${creditsPerCard} AI creation credits included per card`]]} />
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
              <span className="pr-tier-price">{formatAmount(tier.pricePerCard)}</span>
              <span className="pr-tier-unit">/ card</span>
            </button>
          );
        })}
      </div>

      <div className="pr-qty">
        <label className="pr-qty-label" htmlFor={qtyId}>How many cards?</label>
        <div className="pr-stepper">
          <button type="button" aria-label="Decrease" onClick={() => { if (qty > minCards) setQtyClamped(qty - 1); }} aria-disabled={qty <= minCards || undefined}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="M6 12h12" /></svg>
          </button>
          <input
            id={qtyId}
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
        <output className="pr-qty-total" htmlFor={qtyId} aria-live="polite">{formatMoney(pricing.total, currency)}</output>
      </div>

      <HowItWorks
        id={`${idPrefix}-bs-how`}
        collapsed={compactHow}
        items={[
          { title: "Share the Love", body: "Send a completed card to each of your loved ones." },
          { title: "Flexible Sending Options", body: "Send the same card to everyone, or a unique card to each." },
          { title: "Always saved", body: "Design now, send later. Your designs are saved in Saved Cards & Songs for 12 months from your last edit." },
        ]}
      />

      <button type="button" className="l-btn l-btn-primary pr-cta" onClick={() => { onChosen?.(); buy(makeBigSenderCartItem(pricing.qty, tiers, currency)); }}>
        <span>Reserve {pricing.qty} cards · {formatMoney(pricing.total, currency)}</span>
        <IconArrow />
      </button>
    </article>
  );
}

/** Stand-in for Big Sender while its tiers load from the backend, or if they can't. */
function BigSenderPlaceholder({ status, idPrefix = "pr" }: { status: "loading" | "error"; idPrefix?: string }) {
  return (
    <article className="pr-offer pr-offer-placeholder" aria-labelledby={`${idPrefix}-bs-name`}>
      <header className="pr-offer-head">
        <h2 id={`${idPrefix}-bs-name`} className="pr-offer-name">Big Sender</h2>
      </header>
      <p className="pr-state" role="status">
        {status === "loading" ? "Loading prices…" : "We couldn't load prices right now. Please refresh the page or try again."}
      </p>
    </article>
  );
}

export function PricingCardPacks(options: PackOptions = {}) {
  const { currency } = usePriceCountry();
  const [state, setState] = React.useState<
    { status: "loading" } | { status: "error" } | { status: "ready"; offers: PricingOffer[] }
  >({ status: "loading" });

  React.useEffect(() => {
    let active = true;
    fetchPricingOffers()
      .then((offers) => { if (active) setState({ status: "ready", offers }); })
      .catch(() => { if (active) setState({ status: "error" }); });
    return () => { active = false; };
  }, []);

  const offers = state.status === "ready" ? state.offers : [];
  return (
    <div className="pr-offers">
      <PrintAndSendCard price={printAndSendPriceFrom(offers, currency)} currency={currency} {...options} />
      {state.status === "ready"
        ? <BigSenderCard key={currency} data={buildBigSender(offers, currency)} {...options} />
        : <BigSenderPlaceholder status={state.status} idPrefix={options.idPrefix} />}
    </div>
  );
}

// ============================================================
// Creation credits (Starter / Creator / Power; copy unchanged)
// ============================================================
type CreditPacksProps = {
  /** "pr" on the Pricing page, "tu" in the Top up pop-up (keeps ids unique). */
  idPrefix?: string;
  /** Where a signed-out visitor returns after signing up. */
  returnTo?: string;
  /** Called after a pack is chosen, before the cart opens (the top-up modal closes itself). */
  onChosen?: () => void;
};

function CreditPackCard({ pack, currency, idPrefix = "pr", returnTo, onChosen }: CreditPacksProps & { pack: CreditPack; currency: Currency }) {
  const buy = useBuy(returnTo);
  const titleId = `${idPrefix}-credit-${pack.id}`;
  return (
    <li className={`pr-credit ${pack.featured ? "is-featured" : ""}`}>
      <article aria-labelledby={titleId}>
        {pack.featured && <p className="pr-badge">{pack.badge}</p>}
        <h3 id={titleId} className="pr-credit-name">{pack.name}</h3>
        <PriceWithCode className="pr-credit-price" value={pack.price} currency={currency} />
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
            currency,
          }); }}
        >
          <span>Choose {pack.name}</span>
          <IconArrow />
        </button>
      </article>
    </li>
  );
}

/** The three credit packs. Used by the Pricing page and the Top up pop-up (TopUpModal.tsx). */
export function PricingCreditPacks({ idPrefix, returnTo, onChosen }: CreditPacksProps = {}) {
  const { list, currency } = usePriceCountry();
  return (
    <ul className="pr-credits-grid">
      {creditPacksFor(list).map((pack) => <CreditPackCard key={pack.id} pack={pack} currency={currency} idPrefix={idPrefix} returnTo={returnTo} onChosen={onChosen} />)}
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
