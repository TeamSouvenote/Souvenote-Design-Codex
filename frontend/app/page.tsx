import type { Metadata } from "next";
import { Lato, Lobster_Two } from "next/font/google";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { COMMUNITY_CARDS_HREF, FAQ_ITEMS, FOOTER_LEDE, HERO_COPY } from "./components/landing/content";
import { LandingComparison } from "./components/landing/LandingComparison";
import { LandingFaq } from "./components/landing/LandingFaq";
import { LandingGallery } from "./components/landing/LandingGallery";
import { LandingHero } from "./components/landing/LandingHero";
import { LandingSteps } from "./components/landing/LandingSteps";
import "./styles/landing.css";

// Landing-only fonts, matched to the typography reference:
// Lato (light headlines, regular body, bold spaced labels) + thin Lobster Two accents.
const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-lato",
  display: "swap",
});

const lobsterTwo = Lobster_Two({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal"],
  variable: "--font-lobster-two",
  display: "swap",
});

const DESCRIPTION =
  "Create personalized greeting cards with AI-designed artwork and an optional original song linked by QR code. Printed and delivered to their door.";

// TODO: add canonical URL, Open Graph image and logo once the production
// domain is set via metadataBase (they must be absolute URLs).
export const metadata: Metadata = {
  title: "Souvenote | Personalized greeting cards with an original song",
  description: DESCRIPTION,
  openGraph: {
    title: "Souvenote | A card worth keeping",
    description: DESCRIPTION,
    type: "website",
    siteName: "Souvenote",
  },
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Souvenote",
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
    <div className={`souv-route-page souv-landing ${lato.variable} ${lobsterTwo.variable}`}>
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
