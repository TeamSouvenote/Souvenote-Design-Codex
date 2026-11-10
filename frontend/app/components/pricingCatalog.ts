import { AI_CREDITS_PER_CARD, MIN_BIG_SENDER_CARDS, PRICE_LISTS, formatMoney, type Currency, type PriceTier } from "../lib/priceLists";

// Cart items for the card offers, in either currency (Canada and the US,
// owner decisions 2026-11-08). Prices come from lib/priceLists.ts (the
// fallback for the PostgreSQL catalog). Each item records its currency, so the
// cart can re-price it if the visitor's country changes (e.g. on sign-in).

export { MIN_BIG_SENDER_CARDS };

/**
 * Where the last Big Sender tier's label stops ("21-30+ cards"). It is a
 * label only: Big Sender has no maximum quantity (owner decision 2026-11-04,
 * MVP PRD section 4), and every quantity in the last tier or above pays the
 * last tier's price. The catalog still stores 30 as that tier's card_count_max.
 */
export const MAX_BIG_SENDER_CARDS = 30;

/** Canadian Print and Send price (the cart's default list). */
export const PRINT_AND_SEND_PRICE = PRICE_LISTS.CAD.printAndSend;
export const PRINT_AND_SEND_CART_ID = "pack-print-and-send";

export type BigSenderTier = PriceTier;

export type PricingCartItem = {
  id: string;
  type: "pack";
  name: string;
  meta: string;
  sub: string;
  price: number;
  qty: number;
  cardCount: number;
  creditsPerCard: number;
  lockedQuantity: boolean;
  replaceGroup: string;
  unitNote: string;
  currency: Currency;
};

export type BigSenderPricing = {
  qty: number;
  tier: BigSenderTier;
  total: number;
  totalText: string;
};

/** Canadian Big Sender tiers (the default list). */
export const BIG_SENDER_TIERS: BigSenderTier[] = PRICE_LISTS.CAD.bigSender;

/** Whole-number quantity of at least `min`. No upper limit unless `max` is given. */
export function clampBigSenderQuantity(
  nextRaw: unknown,
  min = MIN_BIG_SENDER_CARDS,
  max = Number.MAX_SAFE_INTEGER,
): number {
  const parsed = Math.floor(Number(nextRaw) || min);
  return Math.max(min, Math.min(max, Number.isFinite(parsed) ? parsed : min));
}

export function getBigSenderTier(
  quantity: unknown,
  tiers: BigSenderTier[] = BIG_SENDER_TIERS,
): BigSenderTier {
  const min = tiers[0]?.min ?? MIN_BIG_SENDER_CARDS;
  const qty = clampBigSenderQuantity(quantity, min);
  // The last tier is open-ended: anything above its range pays its price.
  return tiers.find((tier) => qty >= tier.min && qty <= tier.max) || tiers[tiers.length - 1] || BIG_SENDER_TIERS[BIG_SENDER_TIERS.length - 1];
}

export function getBigSenderPricing(
  quantity: unknown,
  tiers: BigSenderTier[] = BIG_SENDER_TIERS,
): BigSenderPricing {
  const min = tiers[0]?.min ?? MIN_BIG_SENDER_CARDS;
  const qty = clampBigSenderQuantity(quantity, min);
  const tier = getBigSenderTier(qty, tiers);
  const total = +(qty * tier.pricePerCard).toFixed(2);
  return {
    qty,
    tier,
    total,
    totalText: total.toFixed(2),
  };
}

export function makeBigSenderCartItem(
  quantity: unknown,
  tiers: BigSenderTier[] = BIG_SENDER_TIERS,
  currency: Currency = "CAD",
): PricingCartItem {
  const pricing = getBigSenderPricing(quantity, tiers);
  return {
    id: "pack-bigsender",
    type: "pack",
    name: "Big Sender",
    meta: `${pricing.qty} cards · postage included`,
    sub: `Send multiple different cards, ${AI_CREDITS_PER_CARD} AI credits per card.`,
    price: pricing.total,
    qty: 1,
    cardCount: pricing.qty,
    creditsPerCard: AI_CREDITS_PER_CARD,
    lockedQuantity: true,
    replaceGroup: "pack-bigsender",
    unitNote: `${formatMoney(pricing.tier.pricePerCard, currency)} / card`,
    currency,
  };
}

/** Print and Send: one card to send from Saved Cards & Songs or Community Cards, with 10 AI credits. */
export function makePrintAndSendCartItem(currency: Currency = "CAD", price = PRICE_LISTS[currency].printAndSend): PricingCartItem {
  return {
    id: PRINT_AND_SEND_CART_ID,
    type: "pack",
    name: "Print and Send",
    meta: "1 card · postage included",
    sub: "One flat price to print and send your card.",
    price,
    qty: 1,
    cardCount: 1,
    // 10 AI creation credits included (owner, 2026-11-06), same as each Big Sender card.
    creditsPerCard: AI_CREDITS_PER_CARD,
    lockedQuantity: true,
    replaceGroup: PRINT_AND_SEND_CART_ID,
    unitNote: `${formatMoney(price, currency)} / card`,
    currency,
  };
}
