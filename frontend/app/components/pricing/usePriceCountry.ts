"use client";

import * as React from "react";
import { useAuth } from "../AuthProvider";
import { CURRENCY_BY_COUNTRY, PRICE_LISTS, toCountry, type Country, type Currency, type PriceList } from "../../lib/priceLists";

// Which price list a visitor sees (owner decision 2026-11-08):
// - signed in: the account's country (set at sign-up; read-only in Settings);
// - signed out: the "Prices for: Canada | United States" switch, remembered in
//   souv_price_country, defaulting from the browser's region.
// The server render uses Canada, so both lists' public HTML stays stable.

export const PRICE_COUNTRY_KEY = "souv_price_country";
const PRICE_COUNTRY_EVENT = "souv-price-country-changed";

/** Best guess from the browser: a US locale or a US time zone means the US. */
export function guessCountry(): Country {
  if (typeof window === "undefined") return "CA";
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  if (languages.some((language) => /-US$/i.test(language))) return "US";
  if (languages.some((language) => /-CA$/i.test(language))) return "CA";
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const canadianZones = /Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Montreal|Moncton|Whitehorse|Yellowknife|Iqaluit|Glace_Bay|Goose_Bay|Dawson|Inuvik|Rankin|Resolute|Cambridge_Bay|Atikokan|Blanc-Sablon|Creston|Fort_Nelson|Swift_Current/;
  if (zone.startsWith("America/") && !canadianZones.test(zone)) return "US";
  return "CA";
}

/** The Cookie Policy says the visitor's choice is kept 12 months (audit I11, 2026-11-08). */
const GUEST_COUNTRY_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

function writeGuestCountry(country: Country) {
  window.localStorage.setItem(PRICE_COUNTRY_KEY, JSON.stringify({ country, savedAt: Date.now() }));
}

function readGuestCountry(): Country | null {
  try {
    const raw = window.localStorage.getItem(PRICE_COUNTRY_KEY);
    if (!raw) return null;
    // Before 2026-11-08 the key held just "CA" or "US": keep it, now with a date.
    const legacy = toCountry(raw);
    if (legacy) { writeGuestCountry(legacy); return legacy; }
    const saved = JSON.parse(raw) as { country?: unknown; savedAt?: unknown };
    const country = toCountry(typeof saved.country === "string" ? saved.country : null);
    const savedAt = typeof saved.savedAt === "number" ? saved.savedAt : 0;
    if (!country || Date.now() - savedAt > GUEST_COUNTRY_MAX_AGE_MS) {
      window.localStorage.removeItem(PRICE_COUNTRY_KEY);
      return null;
    }
    return country;
  } catch {
    return null;
  }
}

export function setGuestPriceCountry(country: Country) {
  try {
    writeGuestCountry(country);
  } catch {
    // Private mode: the switch still works for this page view.
  }
  window.dispatchEvent(new CustomEvent(PRICE_COUNTRY_EVENT, { detail: country }));
}

export type PriceCountry = {
  country: Country;
  currency: Currency;
  list: PriceList;
  /** True when the account's country decides (no switch shown). */
  fromAccount: boolean;
};

export function usePriceCountry(): PriceCountry {
  const auth = useAuth();
  const accountCountry = auth.status === "authenticated" ? toCountry(auth.user?.country) : null;
  const [guest, setGuest] = React.useState<Country>("CA");

  React.useEffect(() => {
    setGuest(readGuestCountry() || guessCountry());
    const onChange = (event: Event) => setGuest(toCountry((event as CustomEvent).detail) || "CA");
    window.addEventListener(PRICE_COUNTRY_EVENT, onChange);
    return () => window.removeEventListener(PRICE_COUNTRY_EVENT, onChange);
  }, []);

  const country = accountCountry || guest;
  const currency = CURRENCY_BY_COUNTRY[country];
  return { country, currency, list: PRICE_LISTS[currency], fromAccount: Boolean(accountCountry) };
}
