import { BIG_SENDER_TIERS, PRINT_AND_SEND_PRICE } from "../pricingCatalog";

// Pricing page content shared by the page (server) and its client parts.
// Credit packs: names, prices, credits and blurbs unchanged from the old page
// (components/Options.tsx AI_PACKS). Prices are CAD.

export type CreditPack = {
  id: string;
  name: string;
  price: number;
  tokens: number;
  blurb: string;
  featured?: boolean;
  badge?: string;
};

export const CREDIT_PACKS: CreditPack[] = [
  { id: "starter", name: "Starter", price: 2, tokens: 10, blurb: "Top off a short session." },
  { id: "creator", name: "Creator", price: 10, tokens: 80, blurb: "A full evening of iteration.", featured: true, badge: "Most popular" },
  { id: "power", name: "Power", price: 25, tokens: 250, blurb: "For repeat senders and remixers." },
];

/** Page title and description (approved 2026-11-04). */
export const PRICING_TITLE = "Pricing | Souvenote";
export const PRICING_DESCRIPTION =
  "Print and send a card for $9.99 with shipping and 10 AI credits included, save with Big Sender from $6.99 a card, or top up creation credits from $2. All prices in CAD.";

/**
 * Structured data (schema.org) for search and AI answer engines. Big Sender
 * uses the frontend fallback tiers (the same values as the backend seed); if
 * the catalog changes, update BIG_SENDER_TIERS in pricingCatalog.ts too.
 */
export function pricingStructuredData(siteUrl: string) {
  const url = `${siteUrl}/pricing`;
  const offer = (name: string, price: number, description: string) => ({
    "@type": "Offer",
    name,
    description,
    price: price.toFixed(2),
    priceCurrency: "CAD",
    availability: "https://schema.org/InStock",
    eligibleRegion: { "@type": "Country", name: "CA" },
    url,
  });
  const tierPrices = BIG_SENDER_TIERS.map((tier) => tier.pricePerCard);

  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "Souvenote pricing",
    url,
    itemListElement: [
      offer("Print and Send", PRINT_AND_SEND_PRICE, "Print and send one card. Includes shipping Canada-wide and 10 AI creation credits."),
      {
        "@type": "AggregateOffer",
        name: "Big Sender",
        description: "Send multiple different cards. Includes shipping and 10 AI creation credits per card.",
        lowPrice: Math.min(...tierPrices).toFixed(2),
        highPrice: Math.max(...tierPrices).toFixed(2),
        priceCurrency: "CAD",
        url,
      },
      ...CREDIT_PACKS.map((pack) => offer(`${pack.name} credits`, pack.price, `${pack.tokens} AI creation credits.`)),
    ],
  };
}
