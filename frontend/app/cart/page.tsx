import type { Metadata } from "next";
import { CartPage } from "../components/CartPage";
import { FlowPageShell } from "../components/flow/FlowPageShell";

// Signed-in screen: noindex comes from cart/layout.tsx; no description or
// structured data, since the page shows the visitor's own cart.
export const metadata: Metadata = { title: "Cart | Souvenote" };

export default function CartRoutePage() {
  return (
    <FlowPageShell className="souv-cart">
      <CartPage />
    </FlowPageShell>
  );
}
