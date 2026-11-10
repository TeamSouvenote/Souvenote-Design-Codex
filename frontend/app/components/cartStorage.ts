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

/**
 * Adds an item to the saved cart (one shared rule, audit P5, 2026-11-08):
 * an item with a replaceGroup replaces any earlier item in that group (catalog
 * packs); anything else with the same id stacks its quantity.
 */
export function addItemToCart<T extends { id: string; qty: number; replaceGroup?: string }>(item: T): void {
  if (typeof window === "undefined") return;
  try {
    let current = JSON.parse(window.localStorage.getItem(SOUV_CART_KEY) || "[]") as T[];
    if (!Array.isArray(current)) current = [];
    if (item.replaceGroup) {
      current = current.filter((candidate) => candidate?.replaceGroup !== item.replaceGroup && candidate?.id !== item.id);
    }
    const existing = item.replaceGroup ? null : current.find((candidate) => candidate?.id === item.id);
    if (existing) existing.qty += item.qty || 1;
    else current.push(item);
    window.localStorage.setItem(SOUV_CART_KEY, JSON.stringify(current));
    notifyCartChanged();
  } catch {
    // Storage may be unavailable; the cart still opens.
  }
}
