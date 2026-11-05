import type { Metadata } from "next";
import "./styles/colors_and_type.css";
import "./styles/site.css";
import "./styles/opened-card.css";
import "./styles/auth.css";
import "./styles/options.css";
import "./styles/bmc.css";
import "./styles/cardart.css";
import "./styles/pt.css";
import "./styles/mycards.css";
import "./styles/cart.css";
import "./styles/delivery.css";
import "./styles/account.css";
import "./styles/pages.css";
import "./styles/landing-chrome.css";
import "./styles/next-app.css";
import { AuthProvider } from "./components/AuthProvider";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./lib/site";

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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
