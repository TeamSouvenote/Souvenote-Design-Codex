import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPageShell } from "../../components/content/ContentPageShell";
import { CommunityCardFeature } from "../../components/community/CommunityCardFeature";
import { COMMUNITY_CARDS, COMMUNITY_CARD_ALIASES, communityCard, communityCardPath } from "../../components/community/catalog";
import { SITE_URL, openGraphFor } from "../../lib/site";
import "../../styles/community-cards.css";

// One page per Community Card (audit C11, owner: the recommended set): the
// address Share links point to, with the card's own title, description,
// canonical and preview image. Built statically for the 58 cards and the
// renamed cards' old ids (which show the card under its new canonical address);
// any other id is a 404. The gallery's ?card= links keep working.

export const dynamicParams = false;

export function generateStaticParams() {
  return [...COMMUNITY_CARDS.map((card) => card.id), ...Object.keys(COMMUNITY_CARD_ALIASES)].map((id) => ({ id }));
}

type Props = { params: Promise<{ id: string }> };

function describe(name: string, occasion: string) {
  return `“${name}”, a ready-made ${occasion} card from Souvenote. Write your own message inside for free, with no AI credits, and we print and mail it to Canada or the US.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = communityCard((await params).id);
  if (!card) return {};
  const path = communityCardPath(card);
  const title = `${card.name} | Community Cards | Souvenote`;
  const description = describe(card.name, card.occasion);
  const image = { url: card.art, width: 1000, height: 1400, alt: `${card.name}: card front` };
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...openGraphFor(path, title, description), images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default async function CommunityCardPage({ params }: Props) {
  const card = communityCard((await params).id);
  if (!card) notFound();
  // Structured data: the card as a CreativeWork in the Community Cards collection (audit C18).
  const structured = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: card.name,
    genre: card.occasion,
    url: `${SITE_URL}${communityCardPath(card)}`,
    image: `${SITE_URL}${card.art}`,
    isPartOf: { "@type": "CollectionPage", name: "Community Cards", url: `${SITE_URL}/community-cards` },
  };
  return (
    <ContentPageShell className="souv-cc">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }} />
      <CommunityCardFeature cardId={card.id} />
    </ContentPageShell>
  );
}
