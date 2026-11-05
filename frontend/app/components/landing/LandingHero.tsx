import type { ReactNode } from "react";
import Link from "next/link";
import { HERO_COPY } from "./content";
import { Engraving } from "./Engraving";
import { HeroCard } from "./HeroCard";

type LandingHeroProps = {
  /** Id of the h1, which also labels the section. */
  titleId?: string;
  /** Hero buttons. Defaults to the signed-out pair (Start for Free, Log In). */
  actions?: ReactNode;
  /** Line under the buttons. Defaults to the free-credits line. */
  note?: ReactNode;
};

/** Hero for the public landing page (`/`) and, with its own actions and note, the signed-in home (`/home`). */
export function LandingHero({ titleId = "landing-title", actions, note }: LandingHeroProps) {
  return (
    <section className="l-hero" aria-labelledby={titleId}>
      <div className="l-hero-glow" aria-hidden="true" />
      <div className="l-wrap l-hero-inner">
        <div className="l-hero-copy">
          <h1 id={titleId} className="l-h1">
            <span className="l-h1-line">{HERO_COPY.titleLead}</span>
            <span className="l-h1-line l-script">{HERO_COPY.titleAccent}</span>
          </h1>
          <p className="l-hero-lede">{HERO_COPY.lede}</p>
          <div className="l-hero-ctas">
            {actions ?? (
              <>
                <Link className="l-btn l-btn-primary" href="/signup">Start for Free</Link>
                <Link className="l-btn l-btn-secondary" href="/login">Log In</Link>
              </>
            )}
          </div>
          {note ?? <p className="l-hero-trial">{HERO_COPY.trial}</p>}
          <Engraving name="envelope" className="l-eng l-eng-hero" />
        </div>
        <HeroCard />
      </div>
    </section>
  );
}
