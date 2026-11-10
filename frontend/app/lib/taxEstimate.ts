import type { Country } from "./priceLists";

// Tax shown in the cart and the payment pop-up. Real tax comes from Stripe Tax
// at checkout (Canadian GST/HST/PST and US state and local sales tax, from the
// billing address) once Stripe is connected. Until then this is a placeholder
// estimate, labelled as one: these rates are illustrative, not real tax rates,
// and must not be used for real orders.
const PLACEHOLDER_RATE: Record<Country, number> = { CA: 0.05, US: 0.07 };

export function estimateTax(taxable: number, country: Country) {
  const amount = +(Math.max(0, taxable) * PLACEHOLDER_RATE[country]).toFixed(2);
  return { amount, label: "Estimated tax" };
}

export const TAX_NOTE = "Tax shown is an estimate. The exact amount is worked out at payment from your billing address.";

/**
 * The one total rule for the cart and the payment pop-up (audit P5): promo
 * off the subtotal, then the tax estimate on what's left, rounded to cents.
 */
export function orderTotals(subtotal: number, discount: number, country: Country) {
  const taxable = subtotal - discount;
  const taxLine = estimateTax(taxable, country);
  return { taxable, tax: taxLine.amount, taxLabel: taxLine.label, total: +(taxable + taxLine.amount).toFixed(2) };
}
