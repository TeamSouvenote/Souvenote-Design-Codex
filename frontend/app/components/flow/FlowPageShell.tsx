import { DemoNavbar } from "../DemoNavbar";
import { Footer } from "../Footer";
import { COMMUNITY_CARDS_HREF, FOOTER_LEDE } from "../landing/content";
import { SignedOutRedirect } from "../landing/SignedOutRedirect";
import { SIGNED_OUT_REDIRECT_SCRIPT } from "../landing/signedInHold";
import { brandFontVariables, handFontVariable } from "../../lib/brandFonts";
import "../../styles/landing.css";
import "../../styles/checkout-flow.css";

// Page shell for Cart, Delivery and Delivery confirmation on the berry & ivory
// system: same nav, backdrop, skip link and footer as Pricing and /create.
// These are signed-in screens: noindex comes from each route's layout.tsx.
// signedInOnly (Delivery + Confirmation): signed-out visitors go to `/`, same as
// /create and /home. The cart stays open to everyone (it asks to log in at checkout).
export function FlowPageShell({ className, signedInOnly = false, children }: { className: string; signedInOnly?: boolean; children: React.ReactNode }) {
  return (
    <div className={`souv-route-page souv-landing souv-flow ${className} ${brandFontVariables} ${handFontVariable}`}>
      {signedInOnly && (
        <>
          {/* Runs before paint: no stored sign-in means straight to `/`. */}
          <script dangerouslySetInnerHTML={{ __html: SIGNED_OUT_REDIRECT_SCRIPT }} />
          <SignedOutRedirect />
        </>
      )}
      <a className="l-skip" href="#main">Skip to content</a>
      <div className="l-backdrop" aria-hidden="true" />
      <DemoNavbar navVariant="landing" />
      <main id="main" className="cf-main">{children}</main>
      <Footer variant="landing" communityCardsHref={COMMUNITY_CARDS_HREF} lede={FOOTER_LEDE} />
    </div>
  );
}
