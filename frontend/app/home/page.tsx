import type { Metadata } from "next";
import Link from "next/link";
import { WelcomeModal } from "../components/Auth";
import { DemoNavbar } from "../components/DemoNavbar";
import { Footer } from "../components/Footer";
import { COMMUNITY_CARDS_HREF, FOOTER_LEDE } from "../components/landing/content";
import { CreditsLine } from "../components/landing/CreditsLine";
import { LandingComparison } from "../components/landing/LandingComparison";
import { LandingFaq } from "../components/landing/LandingFaq";
import { LandingGallery } from "../components/landing/LandingGallery";
import { LandingHero } from "../components/landing/LandingHero";
import { LandingSteps } from "../components/landing/LandingSteps";
import { SignedOutRedirect } from "../components/landing/SignedOutRedirect";
import { SIGNED_OUT_REDIRECT_SCRIPT } from "../components/landing/signedInHold";
import { brandFontVariables } from "../lib/brandFonts";
import "../styles/landing.css";

// Signed-in screen: noindex comes from home/layout.tsx, and there is
// deliberately no canonical or structured data, so nothing user-specific
// is offered to search engines or AI answer engines.
export const metadata: Metadata = { title: "Home | Souvenote" };

type HomeSearchParams = Promise<Record<string, string | string[] | undefined>>;

// The signed-in landing: the public landing page's layout and copy, with
// signed-in hero actions and the live credit balance.
// /home?welcome=1 (where /welcome and new sign-ups land) opens the Welcome
// modal over this page; closing it drops the query and leaves the user here.
export default async function SignedInHomePage({ searchParams }: { searchParams: HomeSearchParams }) {
  const { welcome } = await searchParams;
  const showWelcome = (Array.isArray(welcome) ? welcome[0] : welcome) === "1";

  return (
    <div className={`souv-route-page souv-landing ${brandFontVariables}`}>
      {/* Signed-in users only. Runs before paint: no stored sign-in means straight to `/`. */}
      <script dangerouslySetInnerHTML={{ __html: SIGNED_OUT_REDIRECT_SCRIPT }} />
      <SignedOutRedirect />
      <a className="l-skip" href="#main">Skip to content</a>
      <div className="l-backdrop" aria-hidden="true" />
      <DemoNavbar followUserOnScroll navVariant="landing" alwaysSignedIn />
      <main id="main">
        <LandingHero
          titleId="home-title"
          actions={(
            <>
              <Link className="l-btn l-btn-primary" href="/create">Create a Card</Link>
              <Link className="l-btn l-btn-secondary" href="/create/my-cards-and-songs">Saved Cards &amp; Songs</Link>
            </>
          )}
          note={<CreditsLine />}
        />
        <LandingGallery />
        <LandingSteps />
        <LandingComparison />
        <LandingFaq />
      </main>
      <Footer variant="landing" communityCardsHref={COMMUNITY_CARDS_HREF} lede={FOOTER_LEDE} />
      {showWelcome && <WelcomeModal />}
    </div>
  );
}
