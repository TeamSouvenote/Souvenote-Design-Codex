import type { Metadata } from "next";
import Link from "next/link";
import { CreateOptionsClient } from "../components/CreateOptionsClient";
import { DemoNavbar } from "../components/DemoNavbar";
import { Footer } from "../components/Footer";
import { COMMUNITY_CARDS_HREF, FOOTER_LEDE } from "../components/landing/content";
import { CreditsLine } from "../components/landing/CreditsLine";
import { SignedOutRedirect } from "../components/landing/SignedOutRedirect";
import { SIGNED_OUT_REDIRECT_SCRIPT } from "../components/landing/signedInHold";
import { brandFontVariables, handFontVariable } from "../lib/brandFonts";
import "../styles/opened-card.css";
import "../styles/landing.css";
import "../styles/create-options.css";

// Signed-in screen: noindex comes from create/layout.tsx, and there is
// deliberately no description, canonical or structured data.
export const metadata: Metadata = { title: "Create a Card | Souvenote" };

// Create Options: the four ways to start a card, drawn as opened 5x7 cards
// like the Welcome modal (2x2 on desktop, a carousel below 1100px).
// Same shell as the signed-in Home: berry & ivory nav and footer.
export default function CreateOptionsPage() {
  return (
    <div className={`souv-route-page souv-landing souv-create ${brandFontVariables} ${handFontVariable}`}>
      {/* Signed-in users only. Runs before paint: no stored sign-in means straight to `/`. */}
      <script dangerouslySetInnerHTML={{ __html: SIGNED_OUT_REDIRECT_SCRIPT }} />
      <SignedOutRedirect />
      <a className="l-skip" href="#main">Skip to content</a>
      <div className="l-backdrop" aria-hidden="true" />
      <DemoNavbar navVariant="landing" alwaysSignedIn />
      <main id="main" className="cr-main">
        <header className="cr-head">
          <h1 className="cr-title">
            Choose how to <span className="l-script">create your card</span>
          </h1>
          <p className="cr-sub">Pick a card to get started.</p>
          <CreditsLine />
        </header>
        <CreateOptionsClient />
        <div className="cr-back-row">
          <Link className="l-btn l-btn-secondary cr-back" href="/home">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M15 5l-7 7 7 7" />
            </svg>
            <span>Back to home</span>
          </Link>
        </div>
      </main>
      <Footer variant="landing" communityCardsHref={COMMUNITY_CARDS_HREF} lede={FOOTER_LEDE} />
    </div>
  );
}
