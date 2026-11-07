import type { Metadata } from "next";
import { DemoNavbar } from "../components/DemoNavbar";
import { Footer } from "../components/Footer";
import { Engraving } from "../components/landing/Engraving";
import { COMMUNITY_CARDS_HREF, FOOTER_LEDE } from "../components/landing/content";
import { PricingBackLink, PricingCardPacks, PricingCreditPacks } from "../components/pricing/PricingClient";
import { PRICING_DESCRIPTION, PRICING_TITLE, pricingStructuredData } from "../components/pricing/pricingContent";
import { brandFontVariables } from "../lib/brandFonts";
import { SITE_URL, openGraphFor } from "../lib/site";
import "../styles/landing.css";
import "../styles/pricing.css";

// Public page (signed in or out). /account/top-up shows this same page; there
// the account layout adds noindex and the canonical points back here.
export const metadata: Metadata = {
  title: PRICING_TITLE,
  description: PRICING_DESCRIPTION,
  alternates: { canonical: "/pricing" },
  openGraph: openGraphFor("/pricing", PRICING_TITLE, PRICING_DESCRIPTION),
};

// Pricing on the berry & ivory system. Same sections and order as the old
// page (reference 21-Pricing): card offers (Print and Send + Big Sender), the
// send-window note, then the three credit top-ups and a back link.
export default function PricingPage() {
  return (
    <div className={`souv-route-page souv-landing souv-pricing ${brandFontVariables}`}>
      <a className="l-skip" href="#main">Skip to content</a>
      <div className="l-backdrop" aria-hidden="true" />
      <DemoNavbar navVariant="landing" />
      <main id="main" className="pr-main">
        <section className="pr-cards" aria-labelledby="pr-title">
          <div className="l-wrap pr-wrap">
            <Engraving name="envelope" className="l-eng pr-eng pr-eng-left" />
            <Engraving name="stamp" className="l-eng pr-eng pr-eng-right" />
            <header className="pr-head">
              <p className="pr-eyebrow">Pricing · Card packs</p>
              <h1 id="pr-title" className="pr-title">
                Physical cards, <span className="l-script">printed and posted</span>
              </h1>
              <p className="pr-lede">
                Every card includes shipping + <span className="pr-lede-mark">10 AI credits</span>. Buy just one or stock
                up on more to save.
              </p>
            </header>
            <PricingCardPacks />
            <p className="pr-note">
              Each card has a 15-month send window and is saved in Saved Cards &amp; Songs, so you can send it when
              the time is right.
            </p>
          </div>
        </section>

        {/* Forest band (owner, 2026-11-05): the page's one green section, so top-ups stand out. */}
        <section id="credit-top-ups" className="pr-credits" aria-labelledby="pr-credits-title">
          {/* Tab on the colour split (owner, 2026-11-05) so it's clear there's more below the card packs. */}
          <a className="pr-more-tab" href="#credit-top-ups">
            <span>More below: top up credits</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
          </a>
          <div className="l-wrap">
            <header className="pr-head">
              <p className="pr-eyebrow">Pricing · AI credits</p>
              <h2 id="pr-credits-title" className="l-h2">
                Top up <span className="l-script">credits</span>
              </h2>
              <p className="pr-lede">
                Bring your card to life.
                <br />
                1 credit = 1 action for design generation, image editing, or optional QR-song creation.
              </p>
            </header>
            <PricingCreditPacks />
          </div>
        </section>
        <PricingBackLink />
      </main>
      <Footer variant="landing" communityCardsHref={COMMUNITY_CARDS_HREF} lede={FOOTER_LEDE} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingStructuredData(SITE_URL)).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
