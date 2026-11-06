import type { Metadata } from "next";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { COMMUNITY_CARDS_HREF, FAQ_ITEMS, FOOTER_LEDE, HERO_COPY } from "./components/landing/content";
import { LandingComparison } from "./components/landing/LandingComparison";
import { LandingFaq } from "./components/landing/LandingFaq";
import { LandingGallery } from "./components/landing/LandingGallery";
import { LandingHero } from "./components/landing/LandingHero";
import { LandingSteps } from "./components/landing/LandingSteps";
import { SignedInRedirect } from "./components/landing/SignedInRedirect";
import { SIGNED_IN_HOLD_SCRIPT } from "./components/landing/signedInHold";
import { brandFontVariables } from "./lib/brandFonts";
import { SITE_DESCRIPTION, SITE_URL, openGraphFor } from "./lib/site";
import "./styles/landing.css";

// The share image comes from app/opengraph-image.tsx; metadataBase (root
// layout) turns these paths into absolute URLs.
export const metadata: Metadata = {
  title: "Souvenote | Personalized greeting cards with an original song",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: openGraphFor("/", "Souvenote | A card worth keeping", SITE_DESCRIPTION),
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Souvenote",
    url: SITE_URL,
    logo: `${SITE_URL}/assets/LogoMark.png`,
    description: HERO_COPY.lede,
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  },
];

export default function LandingPage() {
  return (
    <div className={`souv-route-page souv-landing souv-landing-public ${brandFontVariables}`}>
      {/* Runs before the page paints; see signedInHold.ts. */}
      <script dangerouslySetInnerHTML={{ __html: SIGNED_IN_HOLD_SCRIPT }} />
      <SignedInRedirect />
      <a className="l-skip" href="#main">Skip to content</a>
      <div className="l-backdrop" aria-hidden="true" />
      <Navbar followUserOnScroll navVariant="landing" />
      <main id="main">
        <LandingHero />
        <LandingGallery />
        <LandingSteps />
        <LandingComparison />
        <LandingFaq />
      </main>
      <Footer variant="landing" communityCardsHref={COMMUNITY_CARDS_HREF} lede={FOOTER_LEDE} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
