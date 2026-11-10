import type { Metadata } from "next";
import { ContentPageShell } from "../components/content/ContentPageShell";
import { CommunityGallery } from "../components/community/CommunityGallery";
import { COMMUNITY_CARDS, communityCardPath } from "../components/community/catalog";
import { SITE_URL, openGraphFor } from "../lib/site";
import "../styles/community-cards.css";

// Public page: indexed and in the sitemap. Everyone sees the full catalog,
// signed in or not, and so does the server-rendered HTML (owner, 2026-11-09);
// only sending a card needs an account. Each card also has its own page,
// /community-cards/{id} (audit C11); ?card= addresses canonicalise here.
export const metadata: Metadata = {
  title: "Community Cards | Souvenote",
  description: "Ready-made greeting cards for birthdays, anniversaries, holidays and more. Write your own message inside for free, with no AI credits, and we print and mail it to Canada or the US.",
  alternates: { canonical: "/community-cards" },
  openGraph: openGraphFor("/community-cards", "Community Cards | Souvenote", "Ready-made greeting cards for every occasion. Write your own message inside for free, and we print and mail it to Canada or the US."),
};

// Structured data (audit C18): the collection as an ItemList of the cards' own pages.
const structuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Community Cards",
  url: `${SITE_URL}/community-cards`,
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: COMMUNITY_CARDS.length,
    itemListElement: COMMUNITY_CARDS.map((card, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: card.name,
      url: `${SITE_URL}${communityCardPath(card)}`,
    })),
  },
};

export default function CommunityCardsPage() {
  return (
    <ContentPageShell className="souv-cc">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <CommunityGallery />
    </ContentPageShell>
  );
}
