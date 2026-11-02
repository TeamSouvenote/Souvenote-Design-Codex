import Link from "next/link";
import { HERO_COPY } from "./content";
import { Engraving } from "./Engraving";
import { HeroCard } from "./HeroCard";

export function LandingHero() {
  return (
    <section className="l-hero" aria-labelledby="landing-title">
      <div className="l-hero-glow" aria-hidden="true" />
      <div className="l-wrap l-hero-inner">
        <div className="l-hero-copy">
          <h1 id="landing-title" className="l-h1">
            <span className="l-h1-line">{HERO_COPY.titleLead}</span>
            <span className="l-h1-line l-script">{HERO_COPY.titleAccent}</span>
          </h1>
          <p className="l-hero-lede">{HERO_COPY.lede}</p>
          <div className="l-hero-ctas">
            <Link className="l-btn l-btn-primary" href="/signup">Start for Free</Link>
            <Link className="l-btn l-btn-secondary" href="/login">Log In</Link>
          </div>
          <p className="l-hero-trial">{HERO_COPY.trial}</p>
          <Engraving name="envelope" className="l-eng l-eng-hero" />
        </div>
        <HeroCard />
      </div>
    </section>
  );
}
