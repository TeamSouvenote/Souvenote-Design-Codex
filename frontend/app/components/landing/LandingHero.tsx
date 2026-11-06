import type { ReactNode } from "react";
import Link from "next/link";
import { HERO_COPY } from "./content";
import { Engraving } from "./Engraving";
import { HeroCard } from "./HeroCard";

type LandingHeroProps = {
  /** Id of the h1, which also labels the section. */
  titleId?: string;
  /** Hero buttons. Defaults to the signed-out pair: Start for Free (with the free-credits line centred under it) and Log In. */
  actions?: ReactNode;
};

const { ledeParts } = HERO_COPY;

/** Hero for the public landing page (`/`) and, with its own actions and note, the signed-in home (`/home`). */
export function LandingHero({ titleId = "landing-title", actions }: LandingHeroProps) {
  return (
    <section className="l-hero" aria-labelledby={titleId}>
      <div className="l-hero-glow" aria-hidden="true" />
      <div className="l-wrap l-hero-inner">
        <div className="l-hero-copy">
          <h1 id={titleId} className="l-h1">
            <span className="l-h1-line">{HERO_COPY.titleLead}</span>
            <span className="l-h1-line l-script">{HERO_COPY.titleAccent}</span>
          </h1>
          <p className="l-hero-lede">
            {ledeParts.leadBefore}
            <span className="l-hero-accent">{ledeParts.leadAccent}</span>
            {ledeParts.leadAfter}{" "}
            <span className="l-hero-lede-close">
              {ledeParts.closeBefore}
              <span className="l-hero-mark">
                {ledeParts.closeMark}
                {/* Hand-drawn pen stroke under the phrase (design system 2.9a). */}
                <svg className="l-hero-mark-line" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                  <path d="M3 8.5 C 38 4.5, 70 10.5, 104 6.5 S 168 4, 197 7" />
                </svg>
              </span>
              {ledeParts.closeAfter}
            </span>
          </p>
          <div className="l-hero-ctas">
            {actions ?? (
              <>
                <div className="l-hero-cta-stack">
                  <Link className="l-btn l-btn-primary" href="/signup">Start for Free</Link>
                  <p className="l-hero-trial l-hero-note">{HERO_COPY.trial}</p>
                </div>
                <Link className="l-btn l-btn-secondary" href="/login">Log In</Link>
              </>
            )}
          </div>
          <Engraving name="envelope" className="l-eng l-eng-hero" />
        </div>
        <HeroCard />
      </div>
    </section>
  );
}
