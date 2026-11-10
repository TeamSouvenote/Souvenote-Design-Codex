import { COUNTRY_NAMES, PRICE_LISTS, type Country, type Currency, type PriceList } from "../../lib/priceLists";

// Pricing page content shared by the page (server) and its client parts.
// Credit packs: names, credits and blurbs unchanged from the old page; the
// price comes from each country's list (Canada CAD, United States USD).

export type CreditPack = {
  id: "starter" | "creator" | "power";
  name: string;
  price: number;
  tokens: number;
  blurb: string;
  featured?: boolean;
  badge?: string;
};

const PACK_COPY: Record<CreditPack["id"], Omit<CreditPack, "id" | "price" | "tokens">> = {
  starter: { name: "Starter", blurb: "Top off a short session." },
  creator: { name: "Creator", blurb: "A full evening of iteration.", featured: true, badge: "Most popular" },
  power: { name: "Power", blurb: "For repeat senders and remixers." },
};

export function creditPacksFor(list: PriceList): CreditPack[] {
  return list.creditPacks.map((pack) => ({ ...PACK_COPY[pack.id], id: pack.id, price: pack.price, tokens: pack.tokens }));
}

/** Page title and description: both price lists, so search answers stay right for either country. */
export const PRICING_TITLE = "Pricing | Souvenote";
export const PRICING_DESCRIPTION =
  "Print and send a card for $9.99 CAD or $7.99 USD with postage and 10 AI credits included, save with Big Sender from $6.99 CAD or $4.99 USD a card, or top up creation credits from $2 CAD or $1.50 USD.";

/**
 * Structured data (schema.org) for search and AI answer engines, matching the
 * visible prices exactly (the frontend fallback lists, the same values as migration 008).
 *
 * The printed card is a `Product` with one offer per country (audit E8, 2026-11-09):
 * Google ignores offers that aren't inside a Product. The credit packs aren't
 * physical products, so they stay in an OfferCatalog. Each card offer says postage is
 * free (it's included) to its own country. Not added yet (owner, 2026-11-09):
 * `hasMerchantReturnPolicy`, until the lawyer approves the Refund Policy.
 */
export function pricingStructuredData(siteUrl: string) {
  const url = `${siteUrl}/pricing`;
  const region = (country: Country) => ({ "@type": "Country", name: country });
  // Postage is included in every card price: free shipping to that country.
  const freeShipping = (country: Country, currency: Currency) => ({
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: "0", currency },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: country },
  });
  const cardOffers = (country: Country, currency: Currency) => {
    const list = PRICE_LISTS[currency];
    const tierPrices = list.bigSender.map((tier) => tier.pricePerCard);
    return [
      {
        "@type": "Offer",
        name: "Print and Send",
        description: "Print and send one card. Includes postage and 10 AI creation credits.",
        price: list.printAndSend.toFixed(2),
        priceCurrency: currency,
        availability: "https://schema.org/InStock",
        eligibleRegion: region(country),
        shippingDetails: freeShipping(country, currency),
        url,
      },
      {
        "@type": "AggregateOffer",
        name: "Big Sender",
        description: "Send 2 or more cards. Includes postage and 10 AI creation credits per card.",
        lowPrice: Math.min(...tierPrices).toFixed(2),
        highPrice: Math.max(...tierPrices).toFixed(2),
        priceCurrency: currency,
        availability: "https://schema.org/InStock",
        eligibleRegion: region(country),
        shippingDetails: freeShipping(country, currency),
        url,
      },
    ];
  };
  const creditCatalog = (country: Country, currency: Currency) => ({
    "@type": "OfferCatalog",
    name: `Souvenote creation credits, ${COUNTRY_NAMES[country]}`,
    url,
    itemListElement: creditPacksFor(PRICE_LISTS[currency]).map((pack) => ({
      "@type": "Offer",
      name: `${pack.name} credits`,
      description: `${pack.tokens} AI creation credits.`,
      price: pack.price.toFixed(2),
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
      eligibleRegion: region(country),
      url,
    })),
  });

  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Souvenote printed greeting card",
      description: "A personalized greeting card, printed, folded and mailed to Canada or the US, with an optional original song linked by QR code. Postage and 10 AI creation credits included.",
      image: `${siteUrl}/assets/pt-comic-cover.jpg`,
      brand: { "@type": "Brand", name: "Souvenote" },
      url,
      offers: [...cardOffers("CA", "CAD"), ...cardOffers("US", "USD")],
    },
    {
      "@context": "https://schema.org",
      "@type": "OfferCatalog",
      name: "Souvenote creation credits",
      url,
      itemListElement: [creditCatalog("CA", "CAD"), creditCatalog("US", "USD")],
    },
  ];
}
