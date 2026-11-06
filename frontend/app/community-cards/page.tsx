import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "../components/Pages";
import { StaticPageChrome } from "../components/StaticPageChrome";

// Placeholder until the Community Cards experience is built.
export const metadata: Metadata = {
  title: "Community Cards | Souvenote",
  description: "Ready-to-send cards from the Souvenote collection. Coming soon.",
  robots: { index: false, follow: true },
};

export default function CommunityCardsPage() {
  return (
    <StaticPageChrome>
      <div className="bmc-shell pg-faq-wrap">
        <PageHero
          crumbs={["Create", "Community Cards"]}
          title={<>Community <span className="pg-italic text-metallic-rose-gold">Cards</span></>}
          lede="Choose from our collection of ready to send cards, just add your personal message. No AI credits required."
        />
        <div className="pg-faq-contact">
          <h3>Coming soon</h3>
          <p>We’re putting the collection together. In the meantime, you can create your own card.</p>
          <Link href="/create" className="btn-matte">Create a Card</Link>
        </div>
      </div>
    </StaticPageChrome>
  );
}
