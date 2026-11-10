"use client";

import * as React from "react";
import type { FaqBlock, FaqItem } from "./faqData";

// Accordion (design system 2.11), shared by the landing / signed-in home FAQ
// and /faq. Each question is an h3 > button with aria-expanded and
// aria-controls; every answer is in the HTML while closed (only its height is
// collapsed), so search and answer engines can read it.

export function FaqAnswer({ blocks }: { blocks: FaqBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.kind === "p") return <p key={index}>{block.text}</p>;
        if (block.kind === "list") return <ul key={index} className="l-faq-ul">{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
        return (
          <table key={index} className="l-faq-table">
            <caption>{block.caption}</caption>
            <thead><tr>{block.head.map((cell) => <th key={cell} scope="col">{cell}</th>)}</tr></thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row[0]}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cell} scope="row">{cell}</th> : <td key={cell}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        );
      })}
    </>
  );
}

export function FaqAccordion({ items, firstOpen = true }: { items: FaqItem[]; firstOpen?: boolean }) {
  const [open, setOpen] = React.useState<string | null>(firstOpen ? items[0]?.id ?? null : null);
  const baseId = React.useId();

  return (
    <div className="l-faq-list">
      {items.map((item) => {
        const isOpen = open === item.id;
        const buttonId = `${baseId}-${item.id}-q`;
        const panelId = `${baseId}-${item.id}-a`;
        return (
          <div key={item.id} id={item.id} className={`l-faq-item ${isOpen ? "is-open" : ""}`}>
            <h3 className="l-faq-q">
              <button type="button" id={buttonId} aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpen(isOpen ? null : item.id)}>
                <span>{item.q}</span>
                <span className="l-faq-icon" aria-hidden="true" />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId} className="l-faq-panel">
              <div className="l-faq-panel-inner"><FaqAnswer blocks={item.a} /></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
