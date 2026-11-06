import * as React from "react";
import { CART_CHANGED_EVENT, SOUV_CART_KEY } from "./cartStorage";

// The nav's cart badge: the number of items in the saved cart, counted the
// same way as the cart page itself (the sum of each line's quantity; a pack
// is one line with quantity 1).

export function readCartCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(SOUV_CART_KEY) || "[]");
    if (!Array.isArray(raw)) return 0;
    return raw.reduce<number>((sum, item) => {
      if (!item || typeof item !== "object") return sum;
      const qty = Math.floor(Number((item as { qty?: unknown }).qty) || 1);
      return sum + Math.max(1, qty);
    }, 0);
  } catch {
    return 0;
  }
}

/** Live cart count. 0 on the server and until the browser has read the cart. */
export function useCartCount(): number {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    const update = () => setCount(readCartCount());
    const onStorage = (e: StorageEvent) => { if (e.key === null || e.key === SOUV_CART_KEY) update(); };
    update();
    window.addEventListener(CART_CHANGED_EVENT, update);
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", update); // back/forward cache
    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, update);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", update);
    };
  }, []);
  return count;
}
