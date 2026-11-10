import type { Metadata } from "next";
import { AccountRouteClient } from "../../components/AccountRouteClient";
import { SettingsPage } from "../../components/AccountForms";
import { ContentPageShell } from "../../components/content/ContentPageShell";

// Signed-in screen: noindex comes from account/layout.tsx.
export const metadata: Metadata = { title: "Account Settings | Souvenote" };

export default function SettingsRoutePage() {
  return (
    <ContentPageShell className="souv-account">
      <AccountRouteClient><SettingsPage /></AccountRouteClient>
    </ContentPageShell>
  );
}
