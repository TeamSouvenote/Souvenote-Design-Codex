"use client";

import * as React from "react";
import { fetchPricingOffers, type PricingOffer } from "../../lib/api";
import { PRICE_LISTS, type Currency } from "../../lib/priceLists";
import { usePriceCountry } from "./usePriceCountry";

/** The catalog rows for one currency (GET /pricing returns both price lists). */
export function offersIn(offers: PricingOffer[], currency: Currency): PricingOffer[] {
  return offers.filter((offer) => (offer.currency || "cad").toUpperCase() === currency);
}

/**
 * Print and Send's catalog price for `currency`, in dollars. Falls back to the
 * price list (lib/priceLists.ts) while loading or if the backend is down. The
 * cart prices from the same list, so a mismatch is logged in development.
 */
export function printAndSendPriceFrom(offers: PricingOffer[], currency: Currency = "CAD"): number {
  const fallback = PRICE_LISTS[currency].printAndSend;
  const offer = offersIn(offers, currency).find((candidate) => candidate.type === "print_and_send");
  const price = offer && Number.isFinite(offer.priceCents) && offer.priceCents > 0 ? offer.priceCents / 100 : null;
  if (price === null) return fallback;
  if (price !== fallback && process.env.NODE_ENV !== "production") {
    console.warn(`Print and Send (${currency}): catalog says $${price.toFixed(2)} but the cart uses $${fallback.toFixed(2)} (lib/priceLists.ts).`);
  }
  return price;
}

/** The catalog's Print and Send price and currency for this visitor (screens outside Pricing). */
export function usePrintAndSendPrice(): { price: number; currency: Currency } {
  const { currency } = usePriceCountry();
  const [offers, setOffers] = React.useState<PricingOffer[]>([]);
  React.useEffect(() => {
    let active = true;
    fetchPricingOffers()
      .then((rows) => { if (active) setOffers(rows); })
      .catch(() => { /* keep the fallback price */ });
    return () => { active = false; };
  }, []);
  return { price: printAndSendPriceFrom(offers, currency), currency };
}
