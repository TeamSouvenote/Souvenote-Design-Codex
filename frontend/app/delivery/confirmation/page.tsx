import type { Metadata } from "next";
import { DeliveryConfirmationApp } from "../../components/DeliveryConfirmation";
import { FlowPageShell } from "../../components/flow/FlowPageShell";

// Signed-in screen: noindex comes from delivery/layout.tsx.
export const metadata: Metadata = { title: "Order confirmation | Souvenote" };

export default function DeliveryConfirmationPage() {
  return (
    <FlowPageShell className="souv-delivery-confirmation" signedInOnly>
      <DeliveryConfirmationApp />
    </FlowPageShell>
  );
}
