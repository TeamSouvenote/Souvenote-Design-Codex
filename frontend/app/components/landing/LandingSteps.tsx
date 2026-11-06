import { STEPS } from "./content";
import { Engraving } from "./Engraving";
import { SectionHeading } from "./SectionHeading";

export function LandingSteps() {
  return (
    <section className="l-section l-steps" id="how-it-works" aria-labelledby="steps-title">
      <div className="l-wrap">
        <Engraving name="heart" className="l-eng l-eng-steps l-eng-steps-left" />
        <Engraving name="notes" className="l-eng l-eng-steps l-eng-steps-right" />
        <SectionHeading id="steps-title" lead="Three steps," accent="one keepsake" />
        <ol className="l-steps-list">
          {STEPS.map((step) => (
            <li key={step.n} className="l-step">
              <span className="l-step-num" aria-hidden="true">{step.n}</span>
              <h3 className="l-step-title">{step.title}</h3>
              <p className="l-step-body">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
