"use client";

import * as React from "react";
import { BmcIcon } from "./BmcShared";
import { FlowDialog } from "./flow/FlowDialog";
import { lookupPromo, promoDiscount, PROMO_INVALID_MESSAGE } from "../lib/promo";
import type { AppliedPromo } from "../lib/promo";
import { TAX_NOTE, orderTotals } from "../lib/taxEstimate";
import { formatAmount, type Country, type Currency } from "../lib/priceLists";

// Payment pop-up opened from the cart (berry & ivory, 2026-11-06). Payment is
// still simulated here: "Pay" checks the card fields are filled, waits briefly
// and calls onPaid. Stripe is not connected yet (see DEVELOPER_HANDOFF.md). The unused
// "Choose a pack" picker that used to live in this file was removed; Pricing
// is where packs are chosen.

export type CheckoutPack = {
  kind: "cards" | "credits" | "cart";
  name: string;
  price: number;
  cards?: number | string;
  tokens?: number | string;
  bonus?: number;
  lineCount?: number;
  cardCount?: number;
};

type CheckoutModalProps = {
  open: boolean;
  pack?: CheckoutPack | null;
  /** The account's country and currency (Canada pays CAD, the US pays USD). */
  country?: Country;
  currency?: Currency;
  /** Promo already applied in the cart; the pop-up starts with it. */
  promo?: AppliedPromo | null;
  onClose: () => void;
  onPaid?: (pack: CheckoutPack) => void | Promise<void>;
  onBack?: () => void;
};

type CardDetails = {
  number: string;
  exp: string;
  cvc: string;
  postal: string;
};

type CardErrors = Partial<Record<keyof CardDetails, string>>;

const CARD_FIELD_MESSAGES: Record<keyof CardDetails, string> = {
  number: "Enter your card number.",
  exp: "Enter the expiry date.",
  cvc: "Enter the CVC.",
  postal: "Enter your postal code.",
};

const CARD_FIELD_IDS: Record<keyof CardDetails, string> = {
  number: "co-card-number",
  exp: "co-card-exp",
  cvc: "co-card-cvc",
  postal: "co-card-postal",
};

// Only checks the fields are complete. Real card checks will happen in Stripe.
function checkCard(card: CardDetails): CardErrors {
  const errors: CardErrors = {};
  if (card.number.replace(/\D/g, "").length < 15) errors.number = CARD_FIELD_MESSAGES.number;
  if (card.exp.replace(/\D/g, "").length !== 4) errors.exp = CARD_FIELD_MESSAGES.exp;
  if (card.cvc.length < 3) errors.cvc = CARD_FIELD_MESSAGES.cvc;
  if (card.postal.trim().length < 3) errors.postal = CARD_FIELD_MESSAGES.postal;
  return errors;
}

const GRANT_FAILED_MESSAGE = "Your payment went through, but we couldn't add it to your account yet. Press “Add it to my account” to try again. You won't be charged again.";

function CheckoutModal({ open, pack, country = "CA", currency = "CAD", promo: cartPromo = null, onClose, onPaid, onBack }: CheckoutModalProps) {
  const [promo, setPromo] = React.useState("");
  const [appliedPromo, setAppliedPromo] = React.useState<AppliedPromo | null>(cartPromo);
  const [promoError, setPromoError] = React.useState<string | null>(null);
  const [card, setCard] = React.useState<CardDetails>({ number: "", exp: "", cvc: "", postal: "" });
  const [cardErrors, setCardErrors] = React.useState<CardErrors>({});
  const [processing, setProcessing] = React.useState(false);
  const [paymentError, setPaymentError] = React.useState<string | null>(null);
  // Phones: the summary starts closed behind a bar with the total (audit Part B).
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  // Set once the payment itself has gone through. If adding the purchase to the
  // account then fails, the button only retries that step (the cart reuses the
  // same idempotency key), so the customer is never asked to pay twice (audit B4).
  const [paid, setPaid] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setProcessing(false);
      setPaid(false);
      setPaymentError(null);
      setCardErrors({});
      setPromoError(null);
      setAppliedPromo(cartPromo);
    }
  }, [open, pack, cartPromo]);

  if (!open || !pack) return null;

  const isCards = pack.kind === "cards";
  const isCart = pack.kind === "cart";
  const subtotal = pack.price;
  const discount = promoDiscount(subtotal, appliedPromo);
  const { tax, taxLabel, total } = orderTotals(subtotal, discount, country);

  function fmtCard(value: string) {
    return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }

  function fmtExp(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2 ? digits.slice(0, 2) + " / " + digits.slice(2) : digits;
  }

  function applyPromo() {
    const code = promo.trim();
    if (!code) return;
    const found = lookupPromo(code);
    setAppliedPromo(found);
    setPromoError(found ? null : PROMO_INVALID_MESSAGE);
  }

  function updateCard(field: keyof CardDetails, value: string) {
    setCard((current) => ({ ...current, [field]: value }));
    setCardErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function cardFieldProps(field: keyof CardDetails) {
    const error = cardErrors[field];
    return {
      "aria-invalid": error ? (true as const) : undefined,
      "aria-describedby": error ? `${CARD_FIELD_IDS[field]}-error` : undefined,
    };
  }

  function cardFieldError(field: keyof CardDetails) {
    const error = cardErrors[field];
    return error ? <span id={`${CARD_FIELD_IDS[field]}-error`} className="cf-err">{error}</span> : null;
  }

  // Apple Pay / Google Pay take their card details from the wallet, so they skip the card-field check.
  function pay(viaWallet = false) {
    if (!pack) return;
    if (processing) return;
    if (!onPaid) return;
    if (paid) {
      // Payment already taken: retry only adding the purchase to the account.
      setProcessing(true);
      setPaymentError(null);
      Promise.resolve(onPaid(pack)).catch(() => {
        setPaymentError(GRANT_FAILED_MESSAGE);
        setProcessing(false);
      });
      return;
    }
    if (!viaWallet) {
      const errors = checkCard(card);
      setCardErrors(errors);
      const first = (Object.keys(CARD_FIELD_IDS) as (keyof CardDetails)[]).find((field) => errors[field]);
      if (first) {
        document.getElementById(CARD_FIELD_IDS[first])?.focus();
        return;
      }
    }
    setProcessing(true);
    setPaymentError(null);
    window.setTimeout(() => {
      // Mock: the payment is simulated, so it succeeds here. With Stripe this is
      // where the confirmed payment comes back, before anything is added.
      setPaid(true);
      Promise.resolve(onPaid?.(pack))
        .catch(() => {
          setPaymentError(GRANT_FAILED_MESSAGE);
          setProcessing(false);
        });
    }, 1300);
  }

  return (
    <FlowDialog
      onClose={onClose}
      labelledBy="co-title"
      describedBy="co-desc"
      className="fd-wide fd-checkout"
      tone="forest"
      screenLabel="07 Checkout · Payment"
    >
      <div className="co-grid">
        <div className="co-pay">
          <h2 id="co-title" className="fd-title">Complete your <span className="l-script">purchase</span></h2>
          {/* Read with the dialog's name (audit I8); the total is also on the Pay button. */}
          <p id="co-desc" className="l-sr-only">You pay {formatAmount(total)} {currency}. It&apos;s added to your account as soon as the payment goes through.</p>

          <div className="co-express">
            <button type="button" className="co-paybtn is-apple" onClick={() => pay(true)} aria-label="Pay with Apple Pay" aria-disabled={processing || undefined}>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.05 12.5c0-2.1 1.7-3.1 1.78-3.16-0.97-1.42-2.48-1.62-3.02-1.64-1.28-0.13-2.5 0.76-3.15 0.76-0.65 0-1.65-0.74-2.72-0.72-1.4 0.02-2.69 0.81-3.41 2.07-1.45 2.52-0.37 6.25 1.04 8.3 0.69 1 1.51 2.13 2.58 2.09 1.04-0.04 1.43-0.67 2.69-0.67 1.25 0 1.61 0.67 2.71 0.65 1.12-0.02 1.83-1.02 2.51-2.03 0.79-1.16 1.12-2.29 1.13-2.35-0.02-0.01-2.17-0.83-2.19-3.29zM15.0 6.6c0.57-0.69 0.96-1.65 0.85-2.6-0.82 0.03-1.82 0.55-2.41 1.24-0.53 0.61-0.99 1.59-0.87 2.52 0.92 0.07 1.85-0.47 2.43-1.16z" /></svg>
              Pay
            </button>
            <button type="button" className="co-paybtn is-google" onClick={() => pay(true)} aria-label="Pay with Google Pay" aria-disabled={processing || undefined}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="#4285F4" d="M21.6 12.2c0-.6-.05-1.2-.16-1.8H12v3.4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.1z" /><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" /><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9z" /><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 6.1 12 6.1z" /></svg>
              Pay
            </button>
          </div>

          <p className="co-or"><span>or pay with card</span></p>

          <div className="co-card-el">
            <div className="cf-field">
              <label className="cf-label" htmlFor="co-card-number">Card number</label>
              <div className="co-input-wrap">
                <input id="co-card-number" className="cf-input" inputMode="numeric" autoComplete="cc-number" value={card.number} onChange={(event) => updateCard("number", fmtCard(event.target.value))} placeholder="1234 1234 1234 1234" {...cardFieldProps("number")} />
                <span className="co-card-brands" aria-hidden="true">
                  <span className="co-brand">VISA</span>
                  <span className="co-brand">MC</span>
                  <span className="co-brand">AMEX</span>
                </span>
              </div>
              {cardFieldError("number")}
            </div>
            <div className="co-card-split">
              <div className="cf-field">
                <label className="cf-label" htmlFor="co-card-exp">Expiry</label>
                <input id="co-card-exp" className="cf-input" inputMode="numeric" autoComplete="cc-exp" value={card.exp} onChange={(event) => updateCard("exp", fmtExp(event.target.value))} placeholder="MM / YY" {...cardFieldProps("exp")} />
                {cardFieldError("exp")}
              </div>
              <div className="cf-field">
                <label className="cf-label" htmlFor="co-card-cvc">CVC</label>
                <input id="co-card-cvc" className="cf-input" inputMode="numeric" autoComplete="cc-csc" value={card.cvc} onChange={(event) => updateCard("cvc", event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="CVC" {...cardFieldProps("cvc")} />
                {cardFieldError("cvc")}
              </div>
            </div>
            <div className="cf-field">
              <label className="cf-label" htmlFor="co-card-postal">Billing postal code</label>
              <input id="co-card-postal" className="cf-input" autoComplete="postal-code" value={card.postal} onChange={(event) => updateCard("postal", event.target.value)} placeholder="V6B 1A1" {...cardFieldProps("postal")} />
              {cardFieldError("postal")}
            </div>
          </div>

          <div className="cf-field co-promo">
            {appliedPromo ? (
              <>
                <p className="cf-label">Promo code</p>
                <p className="co-promo-ok" role="status"><BmcIcon name="check" w={14} /> Code <b>{appliedPromo.code}</b> applied, {appliedPromo.percentOff}% off</p>
              </>
            ) : (
              <>
                <label className="cf-label" htmlFor="co-promo-input">Promo code</label>
                <div className="co-promo-row">
                  <input
                    id="co-promo-input"
                    className="cf-input"
                    autoComplete="off"
                    value={promo}
                    onChange={(event) => { setPromo(event.target.value.toUpperCase()); setPromoError(null); }}
                    onKeyDown={(event) => { if (event.key === "Enter") applyPromo(); }}
                    placeholder="Add a code"
                    aria-invalid={promoError ? true : undefined}
                    aria-describedby={promoError ? "co-promo-error" : undefined}
                  />
                  <button type="button" className="l-btn l-btn-secondary co-promo-apply" onClick={applyPromo}>Apply</button>
                </div>
                <p className="l-sr-only" role="status">{promoError ?? ""}</p>
                {promoError && <span id="co-promo-error" className="cf-err">{promoError}</span>}
              </>
            )}
          </div>

          <button
            type="button"
            className={`l-btn l-btn-primary co-pay-cta ${processing ? "is-processing" : ""}`}
            onClick={() => pay()}
            aria-disabled={processing || undefined}
          >
            {processing ? <><span className="cf-spin" aria-hidden="true" /> Processing…</> : paid ? <>Add it to my account <BmcIcon name="arrow" w={15} /></> : <>Pay {formatAmount(total)} {currency} <BmcIcon name="arrow" w={15} /></>}
          </button>
          <p className="l-sr-only" role="status">{processing ? "Processing…" : ""}</p>
          {paymentError && (
            <p className="cf-alert" role="alert">{paymentError}</p>
          )}
          <p className="co-secure"><BmcIcon name="lock" w={13} /> Payments secured by <b>Stripe</b></p>
          {onBack && <button type="button" className="cf-text-link co-back" onClick={onBack}>{"← Back to cart"}</button>}
        </div>

        <section className="co-summary" aria-labelledby="co-summary-title">
          <h3 id="co-summary-title" className="co-summary-title">
            {/* Phones only (hidden from 700px, where the summary sits beside the form). */}
            <button type="button" className="co-summary-toggle" aria-expanded={summaryOpen} aria-controls="co-summary-body" onClick={() => setSummaryOpen((open) => !open)}>
              <span>Order summary</span>
              <span className="co-summary-toggle-total">{formatAmount(total)} {currency}</span>
            </button>
            <span className="co-summary-title-text">Order summary</span>
          </h3>
          <div id="co-summary-body" className={`co-summary-body ${summaryOpen ? "is-open" : ""}`}>
          <div className="co-pack">
            <p className="co-pack-name">{pack.name}</p>
            <p className="co-pack-tag">
              {isCart
                ? <><b>{pack.lineCount} {pack.lineCount === 1 ? "item" : "items"}</b> · cards, packs &amp; credits</>
                : isCards
                  ? <><b>{pack.cards} {pack.cards === 1 ? "card" : "cards"}</b> · {pack.cards === 1 ? "one physical send" : "physical sends"} · postage included</>
                  : <><b>{pack.tokens} credits</b> · AI image, edit, or optional QR-song generations</>}
            </p>
          </div>

          <dl className="cf-rows co-lines">
            <div><dt>Subtotal</dt><dd>{formatAmount(subtotal)}</dd></div>
            {(isCards || isCart) && <div><dt>Postage</dt><dd className="is-included">Included</dd></div>}
            {appliedPromo && <div><dt>Promo · {appliedPromo.code}</dt><dd className="is-discount">{"−"}{formatAmount(discount)}</dd></div>}
            {tax > 0 && <div><dt>{taxLabel}</dt><dd>{formatAmount(tax)}</dd></div>}
          </dl>

          <p className="co-total">
            <span className="co-total-label">Total</span>
            <span><span className="co-total-val">{formatAmount(total)}</span><span className="co-total-cur">{currency}</span></span>
          </p>

          {isCards && Number(pack.bonus) > 0 && (
            <p className="co-bonus"><BmcIcon name="spark2" w={16} /> Includes {pack.tokens} AI credits, plus {pack.bonus} bonus on your first send</p>
          )}
          {/* Placeholder tax until Stripe Tax is connected (lib/taxEstimate.ts). */}
          <p className="co-fx">{TAX_NOTE} Each card has a 12-month send window.</p>
          </div>
        </section>
      </div>
    </FlowDialog>
  );
}

export { CheckoutModal };
