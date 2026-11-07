"use client";

import * as React from "react";

// Which screen sent the customer to Delivery, so "Back to review" returns there
// (build-fixes item 18, 2026-11-06). Kept for the browser tab only.
//
// Personalize a Template's review isn't reachable by link (it's a view inside
// the page), so "personalize" goes back to the Personalize a Template page.

export type DeliverySource = "build" | "personalize" | "saved";

const KEY = "souv_delivery_source";

const BACK_HREF: Record<DeliverySource, string> = {
  build: "/create/build-my-card#review",
  personalize: "/create/personalize-a-template",
  saved: "/create/my-cards-and-songs",
};

const DEFAULT_BACK_HREF = BACK_HREF.build;

export function rememberDeliverySource(source: DeliverySource) {
  try {
    window.sessionStorage.setItem(KEY, source);
  } catch {}
}

function readBackHref() {
  try {
    const source = window.sessionStorage.getItem(KEY) as DeliverySource | null;
    return (source && BACK_HREF[source]) || DEFAULT_BACK_HREF;
  } catch {
    return DEFAULT_BACK_HREF;
  }
}

/** Where "Back to review" on Delivery should go. Build My Card until the stored source is read. */
export function useDeliveryBackHref() {
  const [href, setHref] = React.useState(DEFAULT_BACK_HREF);
  React.useEffect(() => setHref(readBackHref()), []);
  return href;
}
