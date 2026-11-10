// Canada and the United States (owner decisions 2026-11-08): each account's
// country picks its price list and currency. These are the frontend fallbacks;
// the PostgreSQL catalog (GET /pricing, migration 008) is the source of truth
// and returns rows for both currencies. Credit costs per action are the same
// in both countries. All amounts are before tax.

export type Country = "CA" | "US";
export type Currency = "CAD" | "USD";

export const CURRENCY_BY_COUNTRY: Record<Country, Currency> = { CA: "CAD", US: "USD" };
export const COUNTRY_NAMES: Record<Country, string> = { CA: "Canada", US: "United States" };

export function toCountry(value: unknown): Country | null {
  return value === "CA" || value === "US" ? value : null;
}

export function toCurrency(value: unknown): Currency | null {
  const upper = typeof value === "string" ? value.toUpperCase() : "";
  return upper === "CAD" || upper === "USD" ? upper : null;
}

export type PriceTier = { min: number; max: number; pricePerCard: number; label: string };
export type CreditPackPrice = { id: "starter" | "creator" | "power"; price: number; tokens: number };

export type PriceList = {
  currency: Currency;
  printAndSend: number;
  /** Big Sender tiers; the last one is open-ended (no maximum quantity). */
  bigSender: PriceTier[];
  creditPacks: CreditPackPrice[];
  /** One replacement per card when the customer approved a typo or wrong address. */
  replacement: number;
};

/** Big Sender starts at 2 cards; 1 card is always Print and Send (owner decision 2026-11-08). */
export const MIN_BIG_SENDER_CARDS = 2;
export const AI_CREDITS_PER_CARD = 10;

export const PRICE_LISTS: Record<Currency, PriceList> = {
  CAD: {
    currency: "CAD",
    printAndSend: 9.99,
    bigSender: [
      { min: 2, max: 10, pricePerCard: 8.99, label: "2-10 cards" },
      { min: 11, max: 20, pricePerCard: 7.99, label: "11-20 cards" },
      { min: 21, max: 30, pricePerCard: 6.99, label: "21-30+ cards" },
    ],
    creditPacks: [
      { id: "starter", price: 2, tokens: 10 },
      { id: "creator", price: 10, tokens: 80 },
      { id: "power", price: 25, tokens: 250 },
    ],
    replacement: 3.99,
  },
  USD: {
    currency: "USD",
    printAndSend: 7.99,
    bigSender: [
      { min: 2, max: 10, pricePerCard: 6.99, label: "2-10 cards" },
      { min: 11, max: 20, pricePerCard: 5.99, label: "11-20 cards" },
      { min: 21, max: 30, pricePerCard: 4.99, label: "21-30+ cards" },
    ],
    creditPacks: [
      { id: "starter", price: 1.5, tokens: 10 },
      { id: "creator", price: 8, tokens: 80 },
      { id: "power", price: 20, tokens: 250 },
    ],
    replacement: 2.99,
  },
};

/**
 * Cross-border postage, added at checkout when the sender's country and the
 * recipient's country differ. $0 until Scribeless confirms its rates (it prints
 * in both countries with domestic stamps, so the difference is expected to be
 * small or nothing). A $0 line is hidden; the code path stays live.
 */
export const CROSS_BORDER_POSTAGE: Record<Currency, Record<"CA->US" | "US->CA", number>> = {
  CAD: { "CA->US": 0, "US->CA": 0 },
  USD: { "CA->US": 0, "US->CA": 0 },
};

export function crossBorderPostage(currency: Currency, from: Country, to: string): number {
  const destination = toCountry(to);
  if (!destination || destination === from) return 0;
  return CROSS_BORDER_POSTAGE[currency][from === "CA" ? "CA->US" : "US->CA"];
}

/** "$9.99": the one dollar format (no currency code). Used for amounts inside a cart or checkout that already names its currency (audit P5). */
export function formatAmount(amount: number) {
  return "$" + amount.toFixed(2);
}

/** "$9.99" with its currency code ("$9.99 CAD") unless `code` is false. */
export function formatMoney(amount: number, currency: Currency, options: { code?: boolean } = {}) {
  const text = formatAmount(amount);
  return options.code === false ? text : `${text} ${currency}`;
}

/** Whole dollars without decimals ("$2", "$1.50"), for short copy. */
export function formatShortMoney(amount: number, currency: Currency) {
  return `$${Number.isInteger(amount) ? amount : amount.toFixed(2)} ${currency}`;
}
