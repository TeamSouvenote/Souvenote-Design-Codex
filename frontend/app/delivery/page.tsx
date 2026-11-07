import type { Metadata } from "next";
import { DeliveryApp } from "../components/Delivery";
import { FlowPageShell } from "../components/flow/FlowPageShell";

// Signed-in screen: noindex comes from delivery/layout.tsx; no description or
// structured data, since the page holds the visitor's card and addresses.
export const metadata: Metadata = { title: "Delivery | Souvenote" };

export default function DeliveryPage() {
  return (
    <FlowPageShell className="souv-delivery" signedInOnly>
      <DeliveryApp />
    </FlowPageShell>
  );
}
