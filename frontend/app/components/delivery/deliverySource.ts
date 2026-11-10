"use client";

import * as React from "react";

// Which screen sent the customer to Delivery, so "Back to review" returns there
// (build-fixes item 18, 2026-11-06). Kept for the browser tab only.
//
// Personalize a Template reopens the card that was sent to Delivery (#review,
// read from the mock flow state), like Build My Card.

export type DeliverySource = "build" | "personalize" | "saved" | "community";

const KEY = "souv_delivery_source";

const BACK_HREF: Record<DeliverySource, string> = {
  build: "/create/build-my-card#review",
  personalize: "/create/personalize-a-template#review",
  saved: "/create/my-cards-and-songs",
  // Community Cards: back to the gallery (the message is edited in its Send pop-up).
  community: "/community-cards",
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

/** Which screen sent the customer here (null until read, or when unknown). */
export function useDeliverySource(): DeliverySource | null {
  const [source, setSource] = React.useState<DeliverySource | null>(null);
  React.useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(KEY) as DeliverySource | null;
      setSource(stored && stored in BACK_HREF ? stored : null);
    } catch {
      setSource(null);
    }
  }, []);
  return source;
}
