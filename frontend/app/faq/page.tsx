import type * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageHead, ContentPageShell } from "../components/content/ContentPageShell";
import { FaqAccordion } from "../components/faq/FaqAccordion";
import { FAQ_ALL, FAQ_GROUPS, faqStructuredData } from "../components/faq/faqData";
import { SUPPORT_EMAIL, SUPPORT_MAILTO, SUPPORT_REPLY_LINE } from "../lib/support";
import { openGraphFor } from "../lib/site";

// Public page: indexed, in the sitemap. One FAQ list for the whole site
// (components/faq/faqData.ts); the structured data is built from the same
// data, so it always matches the visible answers.
export const metadata: Metadata = {
  title: "FAQ | Souvenote",
  description: "Answers about Souvenote: free credits, Print and Send and Big Sender prices in CAD and USD, delivery to Canada and the US, songs and QR codes, saved cards and your account.",
  alternates: { canonical: "/faq" },
  openGraph: openGraphFor("/faq", "FAQ | Souvenote", "Answers about Souvenote: free credits, Print and Send and Big Sender prices, delivery to Canada and the US, songs and QR codes."),
};

export default function FaqRoutePage() {
  return (
    <ContentPageShell className="souv-faq-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData(FAQ_ALL)).replace(/</g, "\\u003c") }} />
      <div className="cf-wrap faq-wrap">
        <ContentPageHead
          title={<>Questions, <span className="l-script">answered</span></>}
          lede="Everything you need to know about creating and sending a Souvenote."
        />

        <nav className="faq-jump" aria-label="FAQ topics" style={{ "--faq-topics": FAQ_GROUPS.length } as React.CSSProperties}>
          <ul>
            {FAQ_GROUPS.map((group) => (
              <li key={group.id}><a href={`#${group.id}`}>{group.title}</a></li>
            ))}
          </ul>
        </nav>

        {FAQ_GROUPS.map((group) => (
          <section key={group.id} id={group.id} className="faq-group" aria-labelledby={`${group.id}-title`}>
            <h2 id={`${group.id}-title`} className="faq-group-title">{group.title}</h2>
            <FaqAccordion items={group.items} firstOpen={false} />
          </section>
        ))}

        <section className="faq-help" aria-labelledby="faq-help-title">
          <h2 id="faq-help-title" className="faq-help-title">Still need help?</h2>
          <p>{SUPPORT_REPLY_LINE} Email <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a> or send us a note.</p>
          <Link className="l-btn l-btn-primary" href="/contact">Contact us</Link>
        </section>
      </div>
    </ContentPageShell>
  );
}
