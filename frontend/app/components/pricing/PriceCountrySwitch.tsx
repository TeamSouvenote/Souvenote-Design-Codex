"use client";

import * as React from "react";
import { COUNTRY_NAMES, type Country } from "../../lib/priceLists";
import { setGuestPriceCountry, usePriceCountry } from "./usePriceCountry";

// "Prices for: Canada | United States" for signed-out visitors (owner decision
// 2026-11-08). Signed in, the account's country decides and a short note says so.
export function PriceCountrySwitch({ className = "" }: { className?: string }) {
  const { country, fromAccount, currency } = usePriceCountry();

  if (fromAccount) {
    return <p className={`pc-switch-note ${className}`.trim()}>Prices for {COUNTRY_NAMES[country]}, in {currency}.</p>;
  }

  return (
    <div className={`pc-switch ${className}`.trim()} role="group" aria-label="Show prices for">
      <span className="pc-switch-label" aria-hidden="true">Prices for:</span>
      {(Object.keys(COUNTRY_NAMES) as Country[]).map((option) => (
        <button
          key={option}
          type="button"
          className={`pc-switch-btn ${country === option ? "is-on" : ""}`}
          aria-pressed={country === option}
          onClick={() => setGuestPriceCountry(option)}
        >
          {COUNTRY_NAMES[option]}
        </button>
      ))}
    </div>
  );
}
