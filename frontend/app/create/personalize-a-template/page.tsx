import type { Metadata } from "next";
import { PersonalizeTemplateClient } from "../../components/PersonalizeTemplateClient";
import { DemoNavbar } from "../../components/DemoNavbar";
import { Footer } from "../../components/Footer";
import { COMMUNITY_CARDS_HREF, FOOTER_LEDE } from "../../components/landing/content";
import { brandFontVariables } from "../../lib/brandFonts";
import "../../styles/landing.css";
import "../../styles/bmc-questionnaire.css";
import "../../styles/bmc-dialogs.css";
import "../../styles/bmc-polish.css";
import "../../styles/personalize.css";

// Signed-in creation screen: noindex comes from create/layout.tsx. Visitors who
// aren't signed in see the Most popular row and a sign-up prompt (the full
// gallery needs an account).
export const metadata: Metadata = {
  title: "Personalize a Template | Souvenote",
  description: "Choose a card template, answer a few questions about the person it's for, and we'll create the front, the inside message and an optional song.",
};

export default function PersonalizeTemplatePage() {
  return (
    <div className={`souv-route-page souv-landing souv-bmcq souv-pt ${brandFontVariables}`}>
      <a className="l-skip" href="#main">Skip to content</a>
      <div className="l-backdrop" aria-hidden="true" />
      <DemoNavbar navVariant="landing" />
      <main id="main" className="bmcq-main">
        <PersonalizeTemplateClient />
      </main>
      <Footer variant="landing" communityCardsHref={COMMUNITY_CARDS_HREF} lede={FOOTER_LEDE} />
    </div>
  );
}
