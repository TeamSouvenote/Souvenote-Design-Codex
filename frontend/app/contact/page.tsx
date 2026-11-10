import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageHead, ContentPageShell } from "../components/content/ContentPageShell";
import { ContactForm } from "../components/content/ContactForm";
import { SOCIAL } from "../components/Footer";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "../lib/support";
import { openGraphFor } from "../lib/site";

// Public page: indexed, in the sitemap. Cancellations, refunds and reprints all
// go through support (PRD §4), so this page asks for the order reference.
export const metadata: Metadata = {
  title: "Contact | Souvenote",
  description: `Questions about a card, a song, an order or your account? Email ${SUPPORT_EMAIL} or send the Souvenote team a message.`,
  alternates: { canonical: "/contact" },
  openGraph: openGraphFor("/contact", "Contact | Souvenote", "Questions about a card, a song, an order or your account? Send the Souvenote team a message."),
};

const SOCIAL_SHOWN = SOCIAL.filter((social) => social.label === "Instagram" || social.label === "TikTok" || social.label === "Facebook");

export default function ContactRoutePage() {
  return (
    <ContentPageShell className="souv-contact">
      <div className="cf-wrap ct2-wrap">
        <ContentPageHead
          title={<>Get in <span className="l-script">touch</span></>}
          lede="Have a question about a card, a song or an order? Send us a note."
        />
        <div className="ct2-layout">
          <aside className="ct2-aside" aria-label="Other ways to reach us">
            <div className="ct2-card">
              <h2 className="ct2-card-title">Email us</h2>
              <p><a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a></p>
            </div>
            <div className="ct2-card">
              <h2 className="ct2-card-title">About an order</h2>
              <p>Cancellations, refunds and reprints go through us. Include the order reference from your confirmation email. Our <Link href="/legal/refund-policy">Refund Policy</Link> explains what we can do.</p>
            </div>
            <div className="ct2-card">
              <h2 className="ct2-card-title">Quick answers</h2>
              <p>Prices, delivery, songs and your account are covered in the <Link href="/faq">FAQ</Link>.</p>
            </div>
            <div className="ct2-card">
              <h2 className="ct2-card-title">Follow us</h2>
              <ul className="ct2-social">
                {SOCIAL_SHOWN.map((social) => (
                  <li key={social.label}><a href={social.url} target="_blank" rel="noopener noreferrer">{social.label}<span className="l-sr-only"> (opens in a new tab)</span></a></li>
                ))}
              </ul>
            </div>
          </aside>
          <ContactForm />
        </div>
      </div>
    </ContentPageShell>
  );
}
