import * as React from "react";
import { ContentPageHead } from "../content/ContentPageShell";
import type { LegalBlock, LegalDoc } from "./legalDocs";

// Long-form layout for the legal pages (server component). Desktop: a sticky
// table of contents beside the text. Phones: a collapsible contents list above
// it. Section headings are anchors; print styles drop the page chrome.

/** **bold** and [[missing fact]] inside a line of policy text. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g).filter(Boolean);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("[[")) return <mark key={index} className="lg-missing">[{part.slice(2, -2)}]</mark>;
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (block.kind === "p") return <p><Inline text={block.text} /></p>;
  if (block.kind === "list") {
    const items = block.items.map((item) => <li key={item}><Inline text={item} /></li>);
    return block.ordered ? <ol>{items}</ol> : <ul>{items}</ul>;
  }
  return (
    // A wide table scrolls sideways in its own box on phones (the accepted
    // exception). tabIndex and a named region let keyboard users scroll it (audit P1).
    <div className="lg-table-wrap" tabIndex={0} role="region" aria-label={`${block.caption} (scrolls sideways)`}>
      <table>
        <caption>{block.caption}</caption>
        <thead><tr>{block.head.map((cell) => <th key={cell} scope="col">{cell}</th>)}</tr></thead>
        <tbody>
          {block.rows.map((row) => (
            <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th key={index} scope="row"><Inline text={cell} /></th> : <td key={index}><Inline text={cell} /></td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Contents({ doc }: { doc: LegalDoc }) {
  return (
    <ol className="lg-toc-list">
      {doc.sections.map((section) => (
        <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>
      ))}
    </ol>
  );
}

export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <div className="cf-wrap lg-wrap">
      <ContentPageHead
        title={<>{doc.lead} <span className="l-script">{doc.accent}</span></>}
        lede={doc.intro}
      />
      {doc.status === "draft" && (
        <p className="lg-draft" role="note">
          <strong>Draft for review.</strong> This updated policy isn&apos;t in effect yet. The version in effect was last updated {doc.inEffectSince}.
        </p>
      )}
      <div className="lg-layout">
        <nav className="lg-toc" aria-label="On this page">
          <details className="lg-toc-phone">
            <summary>On this page</summary>
            <Contents doc={doc} />
          </details>
          <div className="lg-toc-desk">
            <p className="lg-toc-title">On this page</p>
            <Contents doc={doc} />
          </div>
        </nav>
        <article className="lg-article">
          {doc.sections.map((section) => (
            <section key={section.id} id={section.id} className="lg-section" aria-labelledby={`${section.id}-h`}>
              <h2 id={`${section.id}-h`}><a href={`#${section.id}`} className="lg-anchor">{section.title}</a></h2>
              {section.blocks.map((block, index) => <Block key={index} block={block} />)}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
