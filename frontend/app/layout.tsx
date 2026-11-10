import type { Metadata } from "next";
import "./styles/colors_and_type.css";
import "./styles/site.css";
// Route-only styles load from their components (audit E3, 2026-11-09): opened-card.css and
// auth.css from Auth.tsx (sign-in screens, Welcome modal) and /create, and cardart.css
// from CardArt.tsx (cart). bmc.css is retired: the error pop-up uses FlowDialog.
import "./styles/landing-chrome.css";
import "./styles/next-app.css";
import { AuthProvider } from "./components/AuthProvider";
import { MockDataBadge } from "./components/MockDataBadge";
import { CookieConsent } from "./components/content/CookieConsent";
import { RouteFocus } from "./components/RouteFocus";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./lib/site";
import { SESSION_HINT_SCRIPT } from "./components/landing/signedInHold";
import { brandFontVariables } from "./lib/brandFonts";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_CA",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // suppressHydrationWarning: browser extensions (password managers etc.) add
  // attributes to <html> before React loads. This ignores attribute differences
  // on this one tag only; mismatches inside the page are still reported.
  return (
    <html lang="en" className={brandFontVariables} data-scroll-behavior="smooth" suppressHydrationWarning>
      {/* Before first paint: mark a stored sign-in so the nav never flashes signed-out (audit I5). */}
      <head><script dangerouslySetInnerHTML={{ __html: SESSION_HINT_SCRIPT }} /></head>
      <body><AuthProvider>{children}<RouteFocus /><CookieConsent /><MockDataBadge /></AuthProvider></body>
    </html>
  );
}
