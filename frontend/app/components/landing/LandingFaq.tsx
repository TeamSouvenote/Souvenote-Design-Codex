import Link from "next/link";
import { FAQ_LANDING } from "../faq/faqData";
import { FaqAccordion } from "../faq/FaqAccordion";
import { Engraving } from "./Engraving";
import { SectionHeading } from "./SectionHeading";

// The landing page's (and signed-in home's) six questions, from the one shared
// FAQ list (components/faq/faqData.ts). The full list is on /faq.
export function LandingFaq() {
  return (
    <section className="l-section l-faq" aria-labelledby="faq-title">
      <div className="l-wrap">
        <Engraving name="flower" className="l-eng l-eng-faq l-eng-faq-left" />
        <Engraving name="gift" className="l-eng l-eng-faq l-eng-faq-right" />
        <SectionHeading id="faq-title" lead="Frequently asked" accent="questions" />
        <FaqAccordion items={FAQ_LANDING} />
        <p className="l-faq-more"><Link href="/faq">See all questions</Link></p>
      </div>
    </section>
  );
}
