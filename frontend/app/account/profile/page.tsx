import type { Metadata } from "next";
import { AccountRouteClient } from "../../components/AccountRouteClient";
import { ProfilePage } from "../../components/AccountPages";
import { ContentPageShell } from "../../components/content/ContentPageShell";

// Signed-in screen: noindex comes from account/layout.tsx.
export const metadata: Metadata = { title: "Profile | Souvenote" };

export default function ProfileRoutePage() {
  return (
    <ContentPageShell className="souv-account">
      <AccountRouteClient><ProfilePage /></AccountRouteClient>
    </ContentPageShell>
  );
}
