"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "../AuthProvider";
import { PtScrollRow } from "../personalize/PtScrollRow";
import { OCCASION_FILTERS, type OccasionFilter } from "../personalize/catalogue";
import { ContentPageHead } from "../content/ContentPageShell";
import { COMMUNITY_CARDS, communityCard, matchesCommunitySearch, type CommunityCard } from "./catalog";
import { COMMUNITY_BUILD_HREF, CommunityPublishBand, MyCommunitySubmissions, useMyCommunitySubmissions } from "./CommunityBand";
import { ShareIcon } from "./ShareIcon";

// Community Cards (/community-cards): ready-made cards, a free inside message,
// no AI credits. Everyone, signed in or not, browses the full catalog by
// occasion, with search and occasion chips (the Personalize scroll rows); the
// server-rendered HTML has it too (owner, 2026-11-09: no login needed to see
// the cards, replacing the PRD §3 sign-in rule). Sending a card still needs an
// account: guests get a pop-up with the card and Log In / Sign Up, which return
// to the same card.
// - ?card=id (shared links, and each card's own page, /community-cards/{id})
//   opens that card's Send pop-up, or the guest pop-up. Renamed ids still work
//   (catalog.ts aliases); an unknown id says so (audit C9).
// - ?submit=draftId (from a community card's Review) opens "Share a card I
//   made" with that card chosen (audit C1).
// - At the top, "Build a card for the Community" opens Build My Card with
//   ?for=community (CommunityBand.tsx). Every card has a Share link button
//   under Send (CommunityShare.tsx).
// The pop-ups load only when opened (audit C19).

const CommunitySendDialog = dynamic(() => import("./CommunitySendDialog").then((m) => m.CommunitySendDialog), { ssr: false });
const CommunitySignInDialog = dynamic(() => import("./CommunitySendDialog").then((m) => m.CommunitySignInDialog), { ssr: false });
const CommunityShareDialog = dynamic(() => import("./CommunityShare").then((m) => m.CommunityShareDialog), { ssr: false });
const CommunityGuidelinesDialog = dynamic(() => import("./CommunitySubmit").then((m) => m.CommunityGuidelinesDialog), { ssr: false });
const CommunitySubmitDialog = dynamic(() => import("./CommunitySubmit").then((m) => m.CommunitySubmitDialog), { ssr: false });

/** An id-safe form of an occasion ("Valentine's Day" → "valentines-day"): ids can't hold spaces (audit C22). */
function rowId(name: string) {
  return `cc-row-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

// `priority`: the first row's first cards are the page's largest image, so they load
// eagerly instead of lazily (audit E6).
// Every tile has the same shape (2026-11-09 clean-up): a 5x7 frame (landscape fronts sit in it as a
// 7x5 card), a two-line name, then the buttons. Occasion rows don't repeat the occasion on each card;
// the search and chip results, which mix occasions, show it (`showOccasion`).
// `sizes`: rail tiles are 200px wide at every size; grid tiles follow the grid's columns (audit C20).
const RAIL_SIZES = "200px";
const GRID_SIZES = "(min-width: 1024px) 25vw, (min-width: 720px) 33vw, 50vw";

function Tile({ card, onSend, onShare, priority = false, showOccasion = false, sizes = RAIL_SIZES }: { card: CommunityCard; onSend: (card: CommunityCard) => void; onShare: (card: CommunityCard) => void; priority?: boolean; showOccasion?: boolean; sizes?: string }) {
  return (
    <li className="cc-tile">
      <span className={`cc-tile-art is-${card.orientation}`}>
        <span className="cc-tile-face">
          <Image src={card.art} alt="" fill sizes={sizes} priority={priority} />
        </span>
      </span>
      <span className="cc-tile-text">
        <span className="cc-tile-name" title={card.name}>{card.name}</span>
        {showOccasion && <span className="cc-tile-occasion">{card.occasion}</span>}
        {card.orientation === "landscape" && <span className="l-sr-only">Landscape card</span>}
      </span>
      <span className="cc-tile-actions">
        <button type="button" className="l-btn l-btn-primary cc-tile-send" onClick={() => onSend(card)}>
          Send this card<span className="l-sr-only">: {card.name}</span>
        </button>
        <button type="button" className="l-btn l-btn-secondary cc-tile-share" onClick={() => onShare(card)}>
          <ShareIcon size={16} /> Share link<span className="l-sr-only">: {card.name}</span>
        </button>
      </span>
    </li>
  );
}

type Linked = { card: string | null; submit: string | null };

/**
 * Reads ?card= and ?submit=. Kept in its own Suspense boundary so the gallery
 * itself is still rendered on the server (the catalog stays in the HTML).
 */
function LinkedParams({ onLinked }: { onLinked: (linked: Linked) => void }) {
  const params = useSearchParams();
  const card = params.get("card");
  const submit = params.get("submit");
  React.useEffect(() => { if (card || submit) onLinked({ card, submit }); }, [card, submit, onLinked]);
  return null;
}

export function CommunityGallery() {
  const auth = useAuth();
  const signedIn = auth.status === "authenticated";
  const [linked, setLinked] = React.useState<Linked | null>(null);
  const [query, setQuery] = React.useState("");
  const [occasion, setOccasion] = React.useState<OccasionFilter | null>(null);
  const [sending, setSending] = React.useState<CommunityCard | null>(null);
  const [gate, setGate] = React.useState<CommunityCard | null>(null);
  const [sharing, setSharing] = React.useState<CommunityCard | null>(null);
  const [guidelines, setGuidelines] = React.useState(false);
  const [submitting, setSubmitting] = React.useState<{ preselectId: string | null } | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const mine = useMyCommunitySubmissions(signedIn);

  // A shared link to one card, or a card to share: open it once we know who's signed in.
  React.useEffect(() => {
    if (!linked || auth.status === "loading") return;
    // Handle the link once: clear it (and the query in the address), so a later
    // auth refresh can't reopen a pop-up the customer already closed (audit B9).
    setLinked(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has("card") || url.searchParams.has("submit")) {
      url.searchParams.delete("card");
      url.searchParams.delete("submit");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
    if (linked.submit) {
      if (signedIn) setSubmitting({ preselectId: linked.submit });
      return;
    }
    const card = communityCard(linked.card);
    if (!card) {
      setNotice("That card isn't available any more. Here are all our Community Cards.");
      return;
    }
    if (signedIn) setSending(card);
    else setGate(card);
  }, [auth.status, linked, signedIn]);

  function send(card: CommunityCard) {
    if (signedIn) setSending(card);
    else setGate(card);
  }

  const filtering = Boolean(query.trim() || occasion);
  const results = COMMUNITY_CARDS.filter((card) => matchesCommunitySearch(card, query) && (!occasion || card.occasion === occasion));

  return (
    <div className="cf-wrap cc-wrap">
      <ContentPageHead
        title={<>Community <span className="l-script">Cards</span></>}
        lede="Choose from our collection of ready to send cards, just add your personal message. No AI credits required."
      />

      <p className="cc-notice" role="status">{notice}</p>

      <ul className="cc-facts" aria-label="How Community Cards work">
        <li>Write your own message inside, free</li>
        <li>No AI credits used</li>
        <li>Printed and mailed to Canada or the US</li>
      </ul>

      <CommunityPublishBand signedIn={signedIn} onSubmit={() => setSubmitting({ preselectId: null })} onGuidelines={() => setGuidelines(true)} />
      {signedIn && <MyCommunitySubmissions submissions={mine.submissions} />}

      <div className="cc-toolbar">
        <label htmlFor="cc-search" className="l-sr-only">Search Community Cards</label>
        <input id="cc-search" type="search" className="cf-input cc-search" placeholder="Search cards…" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <PtScrollRow as="div" role="group" label="occasions" listLabel="Filter by occasion" className="cc-chips">
        <button type="button" className={`cc-chip${!occasion ? " is-selected" : ""}`} aria-pressed={!occasion} onClick={() => setOccasion(null)}>All</button>
        {OCCASION_FILTERS.map((name) => (
          <button key={name} type="button" className={`cc-chip${occasion === name ? " is-selected" : ""}`} aria-pressed={occasion === name} onClick={() => setOccasion(occasion === name ? null : name)}>{name}</button>
        ))}
      </PtScrollRow>

      {filtering ? (
        <section className="cc-section" aria-labelledby="cc-results-title">
          <div className="cc-row-head">
            <h2 id="cc-results-title" className="cc-row-title">{occasion && !query.trim() ? occasion : "Search results"}</h2>
            <span className="cc-row-count" role="status">{results.length} card{results.length === 1 ? "" : "s"}</span>
            <button type="button" className="cf-text-link" onClick={() => { setQuery(""); setOccasion(null); }}>Show all cards</button>
          </div>
          {results.length
            ? <ul className="cc-grid">{results.map((card) => <Tile key={card.id} card={card} onSend={send} onShare={setSharing} showOccasion={!occasion} sizes={GRID_SIZES} />)}</ul>
            : <p className="cc-empty">No cards match {query.trim() ? `“${query.trim()}”` : "that occasion"} yet. Try another word, or <Link href={COMMUNITY_BUILD_HREF}>build one for the Community</Link>.</p>}
        </section>
      ) : (
        OCCASION_FILTERS.map((name, rowIndex) => (
          <section key={name} className="cc-section" aria-labelledby={rowId(name)}>
            <div className="cc-row-head">
              <h2 id={rowId(name)} className="cc-row-title">{name}</h2>
            </div>
            <PtScrollRow label={name} className="cc-rail">
              {COMMUNITY_CARDS.filter((card) => card.occasion === name).map((card, index) => <Tile key={card.id} card={card} onSend={send} onShare={setSharing} priority={rowIndex === 0 && index < 4} />)}
            </PtScrollRow>
          </section>
        ))
      )}

      <Suspense fallback={null}><LinkedParams onLinked={setLinked} /></Suspense>
      {sending && <CommunitySendDialog card={sending} onClose={() => setSending(null)} />}
      {sharing && <CommunityShareDialog card={sharing} onClose={() => setSharing(null)} />}
      {guidelines && <CommunityGuidelinesDialog onClose={() => setGuidelines(false)} />}
      {submitting && <CommunitySubmitDialog submissions={mine.submissions} preselectId={submitting.preselectId} onClose={() => setSubmitting(null)} onSubmitted={() => void mine.reload()} />}
      {gate && <CommunitySignInDialog card={gate} onClose={() => setGate(null)} onShare={() => { setSharing(gate); setGate(null); }} />}
    </div>
  );
}
