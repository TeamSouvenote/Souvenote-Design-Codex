import { SOUV_CART_KEY, notifyCartChanged } from "./cartStorage";

export const MIN_BIG_SENDER_CARDS = 1;
/**
 * Where the last Big Sender tier's label stops ("21-30+ cards"). It is a
 * label only: Big Sender has no maximum quantity (owner decision 2026-11-04,
 * MVP PRD section 4), and every quantity in the last tier or above pays the
 * last tier's price. The backend seed still stores 30 as that tier's
 * card_count_max; see DEVELOPER_HANDOFF.md "Pricing".
 */
export const MAX_BIG_SENDER_CARDS = 30;

/** Print and Send: one card, shipping included, no AI credits. Fixed CAD price (owner decision 2026-11-04). */
export const PRINT_AND_SEND_PRICE = 9.99;
export const PRINT_AND_SEND_CART_ID = "pack-print-and-send";

export type BigSenderTier = {
  min: number;
  max: number;
  pricePerCard: number;
  label: string;
};

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
};

export type TryRiskFreeCartItemOptions = {
  name?: string;
  priceCents?: number;
  creditsPerCard?: number;
  holdDays?: number;
};

// The cart key lives in cartStorage.ts; re-exported here for existing imports.
export { SOUV_CART_KEY };

export type BigSenderPricing = {
  qty: number;
  tier: BigSenderTier;
  total: number;
  totalText: string;
};

export const BIG_SENDER_TIERS: BigSenderTier[] = [
  { min: 1, max: 10, pricePerCard: 8.99, label: "1-10 cards" },
  { min: 11, max: 20, pricePerCard: 7.99, label: "11-20 cards" },
  { min: 21, max: 30, pricePerCard: 6.99, label: "21-30+ cards" },
];

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
): PricingCartItem {
  const pricing = getBigSenderPricing(quantity, tiers);
  return {
    id: "pack-bigsender",
    type: "pack",
    name: "Big Sender",
    meta: `${pricing.qty} cards · shipping included`,
    sub: "Send multiple different cards, 10 AI credits per card.",
    price: pricing.total,
    qty: 1,
    cardCount: pricing.qty,
    creditsPerCard: 10,
    lockedQuantity: true,
    replaceGroup: "pack-bigsender",
    unitNote: `$${pricing.tier.pricePerCard.toFixed(2)} / card`,
  };
}

export function makeTryRiskFreeCartItem(
  options: TryRiskFreeCartItemOptions = {},
): PricingCartItem {
  const price = Number.isFinite(options.priceCents)
    ? Number(((options.priceCents ?? 999) / 100).toFixed(2))
    : 9.99;
  const credits = options.creditsPerCard ?? 10;
  const holdDays = options.holdDays ?? 5;

  return {
    id: "pack-try-risk-free",
    type: "pack",
    name: options.name ?? "Try Risk-Free",
    meta: "1 card · shipping included",
    sub: `Temporary ${holdDays}-day hold. Includes ${credits} AI credits and finalizes only if the card is sent.`,
    price,
    qty: 1,
    cardCount: 1,
    creditsPerCard: credits,
    lockedQuantity: true,
    replaceGroup: "pack-try-risk-free",
    unitNote: `$${price.toFixed(2)} hold`,
  };
}

/** Print and Send: one card to send from Saved Cards & Songs or Community Cards. No AI credits. */
export function makePrintAndSendCartItem(): PricingCartItem {
  return {
    id: PRINT_AND_SEND_CART_ID,
    type: "pack",
    name: "Print and Send",
    meta: "1 card · shipping included",
    sub: "One flat price to print and send your card.",
    price: PRINT_AND_SEND_PRICE,
    qty: 1,
    cardCount: 1,
    creditsPerCard: 0,
    lockedQuantity: true,
    replaceGroup: PRINT_AND_SEND_CART_ID,
    unitNote: `$${PRINT_AND_SEND_PRICE.toFixed(2)} / card`,
  };
}

export function addPricingCartItemToCart(item: PricingCartItem): void {
  if (typeof window === "undefined") return;

  try {
    const raw = JSON.parse(window.localStorage.getItem(SOUV_CART_KEY) || "[]");
    let current = Array.isArray(raw) ? raw : [];
    if (item.replaceGroup) {
      current = current.filter((candidate) => candidate?.replaceGroup !== item.replaceGroup && candidate?.id !== item.id);
    }
    const existing = item.replaceGroup ? null : current.find((candidate) => candidate?.id === item.id);
    if (existing) existing.qty += item.qty || 1;
    else current.push(item);
    window.localStorage.setItem(SOUV_CART_KEY, JSON.stringify(current));
    notifyCartChanged();
  } catch {
    // Cart storage is best-effort in the local prototype.
  }
}
