"use client";

import * as React from "react";
import { FAQ_ITEMS } from "./content";
import { Engraving } from "./Engraving";
import { SectionHeading } from "./SectionHeading";

export function LandingFaq() {
  const [open, setOpen] = React.useState<number>(0);
  const baseId = React.useId();

  return (
    <section className="l-section l-faq" aria-labelledby="faq-title">
      <div className="l-wrap">
        <Engraving name="flower" className="l-eng l-eng-faq l-eng-faq-left" />
        <Engraving name="gift" className="l-eng l-eng-faq l-eng-faq-right" />
        <SectionHeading id="faq-title" lead="Frequently asked" accent="questions" />
        <div className="l-faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = open === index;
            const buttonId = `${baseId}-q${index}`;
            const panelId = `${baseId}-a${index}`;
            return (
              <div key={item.q} className={`l-faq-item ${isOpen ? "is-open" : ""}`}>
                <h3 className="l-faq-q">
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? -1 : index)}
                  >
                    <span>{item.q}</span>
                    <span className="l-faq-icon" aria-hidden="true" />
                  </button>
                </h3>
                <div id={panelId} role="region" aria-labelledby={buttonId} className="l-faq-panel">
                  <div className="l-faq-panel-inner">
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
