import type { Metadata } from "next";
import { MyCardsApp } from "../../components/MyCards";
import { ContentPageShell } from "../../components/content/ContentPageShell";

// Signed-in screen: noindex comes from create/layout.tsx. Signed-out visitors
// see a log-in prompt here instead of their library.
export const metadata: Metadata = { title: "Saved Cards & Songs | Souvenote" };

export default function MyCardsAndSongsPage() {
  return (
    <ContentPageShell className="souv-library">
      <MyCardsApp />
    </ContentPageShell>
  );
}
