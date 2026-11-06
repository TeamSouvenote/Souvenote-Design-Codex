// The saved cart lives in localStorage under SOUV_CART_KEY. Anything that
// writes or clears it calls notifyCartChanged() so the nav's cart badge
// (useCartCount in cartCount.ts) updates in the same tab; other tabs update
// through the browser's "storage" event. No imports, so any module can use it.

export const SOUV_CART_KEY = "souv_cart";
export const CART_CHANGED_EVENT = "souv-cart-changed";

/** Call after writing or clearing the saved cart. */
export function notifyCartChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}
