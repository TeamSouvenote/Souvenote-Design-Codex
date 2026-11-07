// Promo codes for the cart and the payment pop-up.
//
// Codes will come from Stripe (promotion codes set up in the Stripe dashboard,
// checked server-side). Stripe isn't connected yet, so there are no valid codes
// and every code is rejected. There is deliberately no hard-coded code here
// (owner rule 2026-11-06: no dummy data). See DEVELOPER_HANDOFF.md.

export type AppliedPromo = {
  code: string;
  /** Percentage off the subtotal, e.g. 10 for 10% off. */
  percentOff: number;
};

export const PROMO_INVALID_MESSAGE = "That code isn't valid.";

/** Looks up a code. Returns null until codes are checked against Stripe. */
export function lookupPromo(code: string): AppliedPromo | null {
  void code;
  return null;
}

export function promoDiscount(subtotal: number, promo: AppliedPromo | null | undefined): number {
  if (!promo) return 0;
  return +(subtotal * (promo.percentOff / 100)).toFixed(2);
}
