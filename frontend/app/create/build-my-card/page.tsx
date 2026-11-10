import type { Metadata } from "next";
import { Suspense } from "react";
import { BuildMyCardClient } from "../../components/BuildMyCardClient";
import { BmcPageHeading, BmcPageHeadingStatic } from "../../components/bmc/BmcPageHeading";
import { CREATE_OPTIONS } from "../../components/createOptions";
import { DemoNavbar } from "../../components/DemoNavbar";
import { Footer } from "../../components/Footer";
import { COMMUNITY_CARDS_HREF, FOOTER_LEDE } from "../../components/landing/content";
import { brandFontVariables } from "../../lib/brandFonts";
import "../../styles/landing.css";
import "../../styles/bmc-questionnaire.css";
import "../../styles/bmc-dialogs.css";
import "../../styles/bmc-polish.css";

// Signed-in creation screen: noindex comes from create/layout.tsx. Visitors
// who aren't signed in can see the first question, then are asked to sign up.
export const metadata: Metadata = {
  title: "Build My Card | Souvenote",
  description: "Answer a few questions and we'll design your card's front, write the inside and compose an optional song.",
};

// The title words, from createOptions.ts on the server (so it isn't in the browser bundle):
// "Build" + "My Card", the same as the Welcome modal and Create Options.
const [titleFirst, ...titleRest] = CREATE_OPTIONS.build.title.split(" ");
const TITLE = { first: titleFirst, rest: titleRest.join(" ") };

// ?for=community (from Community Cards' "Build a card for the Community") is read in the
// browser (BmcPageHeading, BuildMyCardClient), so this page stays static and its metadata
// is in the server HTML (Community Cards audit C4).
export default function BuildMyCardPage() {
  return (
    <div className={`souv-route-page souv-landing souv-bmcq ${brandFontVariables}`}>
      <a className="l-skip" href="#main">Skip to content</a>
      <div className="l-backdrop" aria-hidden="true" />
      <DemoNavbar navVariant="landing" />
      <main id="main" className="bmcq-main">
        <Suspense fallback={<BmcPageHeadingStatic {...TITLE} />}><BmcPageHeading {...TITLE} /></Suspense>
        <BuildMyCardClient />
      </main>
      <Footer variant="landing" communityCardsHref={COMMUNITY_CARDS_HREF} lede={FOOTER_LEDE} />
    </div>
  );
}
