// Opening the nav's Top up pop-up from anywhere (owner, 2026-11-07).
//
// Out of credits mid-creation -> the "credits" view; out of cards on Delivery ->
// the "cards" view. The nav (NavRight in Navbar.tsx) listens and opens the pop-up
// on the current page. No imports, so any component can use it.
//
// `returnTo`: where to come back to after paying. It's saved only when a pack is
// actually chosen, so closing the pop-up never leaves a stale return page.

export type TopUpView = "cards" | "credits";

export const OPEN_TOP_UP_EVENT = "souv-open-top-up";

export type OpenTopUpDetail = {
  view: TopUpView;
  returnTo?: string;
  /** Set to true by the nav when it opens the pop-up. */
  handled: boolean;
};

/**
 * Asks the nav to open the Top up pop-up. Returns false when nothing opened it
 * (no signed-in nav on this page); callers then fall back to the Pricing page.
 */
export function openTopUp(view: TopUpView, returnTo?: string): boolean {
  if (typeof window === "undefined") return false;
  const detail: OpenTopUpDetail = { view, returnTo, handled: false };
  window.dispatchEvent(new CustomEvent<OpenTopUpDetail>(OPEN_TOP_UP_EVENT, { detail }));
  return detail.handled;
}
