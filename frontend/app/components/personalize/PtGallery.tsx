"use client";

// The Personalize a Template gallery. Rows follow the ideas PDF's headings;
// the occasion chips and search filter across all of them. Tile images are
// placeholders for now (the logo on forest). Only templates with a card file
// open; the rest are "Coming soon" tiles with their name only (owner,
// 2026-11-08). Signed-out visitors see the Most popular row and a sign-up band
// (the full gallery needs an account, PRD).

import * as React from "react";
import Image from "next/image";
import { Icon } from "../bmc/ui";
import type { CatalogueEntry, OccasionFilter } from "./catalogue";
import { CATALOGUE, HEADINGS, OCCASION_FILTERS, matchesSearch, templateTone } from "./catalogue";
import { PtScrollRow } from "./PtScrollRow";
import { PtSuggestBox } from "./PtSuggestBox";

type Props = {
  signedIn: boolean;
  email: string;
  onOpen: (templateId: string) => void;
  onSignUp: () => void;
};

/**
 * A tile's card picture: the template's tone with its name in script, like the
 * landing gallery's fronts (the gold logo only goes on forest, so it isn't used here).
 */
function ToneCard({ entry }: { entry: CatalogueEntry }) {
  return (
    <span className={`pt-tone-card is-tone-${templateTone(entry.id)}`} aria-hidden="true">
      <span className="pt-tone-card-name">{entry.name}</span>
    </span>
  );
}

function Tile({ entry, onOpen }: { entry: CatalogueEntry; onOpen: (id: string) => void }) {
  if (entry.status === "coming-soon") {
    return (
      <li className="pt-tile is-soon">
        <span className="pt-tile-art"><ToneCard entry={entry} /></span>
        <span className="pt-tile-name">{entry.name}</span>
        <span className="pt-tile-soon">Coming soon</span>
      </li>
    );
  }
  return (
    <li className="pt-tile">
      <button type="button" className="pt-tile-open" onClick={() => onOpen(entry.id)}>
        <span className="pt-tile-art"><ToneCard entry={entry} /></span>
        <span className="pt-tile-name">{entry.name}</span>
        <span className="pt-tile-go">Personalize <Icon name="arrow" size={14} /></span>
      </button>
    </li>
  );
}

function Rail({ id, label, entries, onOpen }: { id: string; label: string; entries: CatalogueEntry[]; onOpen: (id: string) => void }) {
  return (
    <section className="pt-row" aria-labelledby={`pt-row-${id}`}>
      <div className="pt-row-head">
        <h2 id={`pt-row-${id}`} className="pt-row-title">{label}</h2>
      </div>
      <PtScrollRow label={label} className="pt-rail">
        {entries.map((entry) => <Tile key={entry.id} entry={entry} onOpen={onOpen} />)}
      </PtScrollRow>
    </section>
  );
}

export function PtGallery({ signedIn, email, onOpen, onSignUp }: Props) {
  const [query, setQuery] = React.useState("");
  const [occasion, setOccasion] = React.useState<OccasionFilter | null>(null);
  const [seed, setSeed] = React.useState<{ idea: string; key: number } | null>(null);
  const filtering = Boolean(query.trim() || occasion);
  const results = CATALOGUE.filter((entry) => matchesSearch(entry, query) && (!occasion || entry.occasions.includes(occasion)));
  const guardSignedIn = (action: () => void) => (signedIn ? action() : onSignUp());

  return (
    <div className="pt-gallery">
      <header className="pt-head">
        <div className="pt-head-copy">
          <h1 className="pt-title">Personalize a <span className="l-script">template</span></h1>
          <p className="pt-lede">Our designs, your personal touch. Choose a template, answer a few questions, and we’ll make the card your own.</p>
        </div>
        <div className="pt-headcard" aria-hidden="true">
          <div className="pt-headcard-spin">
            {/* 150px wide and hidden on phones, so no priority preload (phones fetched it for nothing)
                and a 150px size instead of the 640px file (Prompt 2 flows E-F6, 2026-11-09). */}
            <Image className="pt-headcard-face" src="/assets/pt-comic-cover.jpg" alt="" width={300} height={420} sizes="150px" />
            <Image className="pt-headcard-face is-back" src="/assets/pt-comic-back.jpg" alt="" width={300} height={420} sizes="150px" />
          </div>
        </div>
      </header>

      {/* Search leads; the idea form waits at the end of the gallery, one tap away (owner, 2026-11-08). */}
      <div className="pt-toolbar">
        <div className="pt-search">
          <label htmlFor="pt-search-input" className="l-sr-only">Search templates</label>
          <Icon name="search" size={18} />
          <input id="pt-search-input" type="search" className="pt-search-input" placeholder="Search templates…" value={query}
            onChange={(event) => guardSignedIn(() => setQuery(event.target.value))} />
        </div>
        <button type="button" className="pt-idea-jump" aria-controls="pt-idea"
          onClick={() => setSeed({ idea: query.trim(), key: Date.now() })}>
          Can’t find it? <span>Suggest a card</span>
        </button>
      </div>

      <PtScrollRow as="div" role="group" label="occasions" listLabel="Filter by occasion" className="pt-chips">
        <button type="button" className={`bmcq-chip${!occasion ? " is-selected" : ""}`} aria-pressed={!occasion} onClick={() => setOccasion(null)}>All</button>
        {OCCASION_FILTERS.map((name) => (
          <button key={name} type="button" className={`bmcq-chip${occasion === name ? " is-selected" : ""}`} aria-pressed={occasion === name}
            onClick={() => guardSignedIn(() => setOccasion(occasion === name ? null : name))}>{name}</button>
        ))}
      </PtScrollRow>

      {filtering ? (
        <section className="pt-results" aria-labelledby="pt-results-title">
          <div className="pt-row-head">
            <h2 id="pt-results-title" className="pt-row-title">{occasion && !query.trim() ? occasion : "Search results"}</h2>
            <span className="pt-row-count" role="status">{results.length} template{results.length === 1 ? "" : "s"}</span>
            <button type="button" className="bmcq-link" onClick={() => { setQuery(""); setOccasion(null); }}>Show all templates</button>
          </div>
          {results.length ? (
            <ul className="pt-grid">{results.map((entry) => <Tile key={entry.id} entry={entry} onOpen={onOpen} />)}</ul>
          ) : (
            <div className="pt-empty">
              <p>No templates match {query.trim() ? `“${query.trim()}”` : "that occasion"} yet.</p>
              {query.trim() && (
                <button type="button" className="bmcq-btn is-secondary is-small" onClick={() => setSeed({ idea: query.trim(), key: Date.now() })}>
                  Suggest “{query.trim()}” to our team
                </button>
              )}
            </div>
          )}
        </section>
      ) : (
        <>
          {HEADINGS.filter((heading) => signedIn || heading.id === "popular").map((heading) => (
            <Rail key={heading.id} id={heading.id} label={heading.label} entries={CATALOGUE.filter((entry) => entry.heading === heading.id)} onOpen={onOpen} />
          ))}
          {!signedIn && (
            <section className="pt-signup-band" aria-labelledby="pt-signup-title">
              <h2 id="pt-signup-title" className="pt-row-title">See every <span className="l-script">template</span></h2>
              <p>Sign up to browse the full gallery, plus 2 free credits to create your first card.</p>
              <button type="button" className="bmcq-btn is-primary" onClick={onSignUp}>Sign up free</button>
            </section>
          )}
        </>
      )}

      <PtSuggestBox defaultEmail={email} seed={seed} searchQuery={query} occasionFilter={occasion} />
    </div>
  );
}
