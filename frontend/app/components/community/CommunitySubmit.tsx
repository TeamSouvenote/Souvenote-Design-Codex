"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { FlowDialog } from "../flow/FlowDialog";
import { FlowField, focusFirstInvalid } from "../flow/FlowField";
import { OCCASION_FILTERS } from "../personalize/catalogue";
import {
  CARD_DRAFTS_UPDATED_EVENT,
  fetchCardDraftAssets,
  fetchUserCardDrafts,
  submitCommunityCard,
  type CardDraft,
  type CardDraftAsset,
  type CommunitySubmission,
} from "../../lib/api";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "../../lib/support";
import { COMMUNITY_GUIDELINES, COMMUNITY_GUIDELINES_VERSION, COMMUNITY_REVIEW_STEPS } from "./communityGuidelines";

// The Community Cards pop-ups that load only when opened (audit C19): the
// guidelines ("What we can and can't post") and "Share a card I made", the
// submit pop-up. The band and "Your shared cards" are in CommunityBand.tsx.
// Every card is reviewed before it's posted (communityGuidelines.ts; Terms of
// Service §5). Mock mode stores submissions and never approves them.

export const COMMUNITY_NAME_LIMIT = 40;

// ---- Guidelines ----------------------------------------------------------------

/**
 * The guidelines groups and how review works, as disclosures: one open at a
 * time (`name` makes them an exclusive accordion where the browser supports it;
 * elsewhere each opens on its own). All start closed, so the pop-up opens as a short list. Used in the pop-up
 * and inside the submit form (audit C5).
 */
export function CommunityGuidelinesBody({ scope }: { scope: string }) {
  const name = `cc-guide-${scope}`;
  return (
    <div className="cc-guide">
      {COMMUNITY_GUIDELINES.map((group) => (
        <details key={group.id} className={`cc-guide-group is-${group.tone}`} name={name}>
          <summary className="cc-guide-summary"><h3 className="cc-guide-title">{group.title}</h3></summary>
          <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
        </details>
      ))}
      <details className="cc-guide-group is-review" name={name}>
        <summary className="cc-guide-summary"><h3 className="cc-guide-title">How review works</h3></summary>
        <ul>{COMMUNITY_REVIEW_STEPS.map((item) => <li key={item}>{item}</li>)}</ul>
        <p className="cc-guide-contact">Think a card uses your work? Email <a href={`${SUPPORT_MAILTO}?subject=${encodeURIComponent("Community Card report")}`}>{SUPPORT_EMAIL}</a> with the card&apos;s name and link.</p>
      </details>
    </div>
  );
}

export function CommunityGuidelinesDialog({ onClose }: { onClose: () => void }) {
  return (
    <FlowDialog onClose={onClose} labelledBy="cc-guide-dialog-title" describedBy="cc-guide-dialog-lede" tone="berry" className="fd-wide cc-guide-dialog">
      <h2 id="cc-guide-dialog-title" className="fd-title">What we can <span className="l-script">post</span></h2>
      <p id="cc-guide-dialog-lede" className="fd-lede">
        Community Cards can be sent by anyone, so every card is reviewed before it&apos;s posted. These rules keep cards original, kind and legal to print and sell.
      </p>
      <CommunityGuidelinesBody scope="dialog" />
      <p className="fd-fineprint">
        These guidelines are part of our <Link href="/legal/terms-of-service#your-content">Terms of Service</Link>. They&apos;re a plain-language guide, not legal advice, and we may decline any card.
      </p>
      <div className="fd-actions">
        <button type="button" className="l-btn l-btn-primary" onClick={onClose}>Got it</button>
      </div>
    </FlowDialog>
  );
}

// ---- Submit pop-up ------------------------------------------------------------------

type Eligible = { draft: CardDraft; image: CardDraftAsset; imageUrl: string | null; title: string };

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** A finished Build My Card design (it has a front) that wasn't made from the customer's own photos. */
function toEligible(draft: CardDraft, assets: CardDraftAsset[]): Eligible | null {
  const brief = record(draft.creative_brief);
  const flow = text(brief.flow) || "build_my_card";
  if (flow !== "build_my_card") return null;
  const photoMode = text(record(brief.photo).mode);
  if (photoMode && photoMode !== "describe") return null;
  const image = assets.filter((asset) => text(asset.assetType || asset.asset_type).toLowerCase() === "image").at(-1);
  if (!image) return null;
  const url = text(image.mockUrl);
  const basics = record(brief.basics);
  const occasion = text(draft.occasion) || text(basics.occasion);
  return { draft, image, imageUrl: /^(https?:\/\/|\/)/i.test(url) ? url : null, title: occasion ? `${occasion} card` : "Your card" };
}

function matchOccasion(value: string | null | undefined) {
  const lower = (value || "").trim().toLowerCase();
  return OCCASION_FILTERS.find((name) => name.toLowerCase() === lower) || "";
}

export function CommunitySubmitDialog({ submissions, preselectId = null, onClose, onSubmitted }: { submissions: CommunitySubmission[]; preselectId?: string | null; onClose: () => void; onSubmitted: (submission: CommunitySubmission) => void }) {
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [cards, setCards] = React.useState<Eligible[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [occasion, setOccasion] = React.useState("");
  const [original, setOriginal] = React.useState(false);
  const [licence, setLicence] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const [done, setDone] = React.useState<CommunitySubmission | null>(null);
  const sendingRef = React.useRef(false);

  // Cards already in review or posted can't be submitted again.
  const taken = React.useMemo(() => new Set(submissions.filter((item) => item.status === "in_review" || item.status === "approved").map((item) => item.cardDraftId)), [submissions]);

  const load = React.useCallback(async () => {
    try {
      const drafts = await fetchUserCardDrafts();
      const withAssets = await Promise.all(drafts.map(async (draft) => toEligible(draft, await fetchCardDraftAssets(draft.id))));
      const eligible = withAssets.filter((item): item is Eligible => Boolean(item));
      setCards(eligible);
      // Opened from a card's Review ("Share to Community Cards"): that card starts chosen.
      const chosen = preselectId ? eligible.find((item) => item.draft.id === preselectId) : null;
      if (chosen) { setSelected(chosen.draft.id); setOccasion((current) => current || matchOccasion(chosen.draft.occasion)); }
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [preselectId]);

  React.useEffect(() => {
    void load();
    window.addEventListener(CARD_DRAFTS_UPDATED_EVENT, load);
    return () => window.removeEventListener(CARD_DRAFTS_UPDATED_EVENT, load);
  }, [load]);

  const available = cards.filter((card) => !taken.has(card.draft.id));

  function choose(card: Eligible) {
    setSelected(card.draft.id);
    setOccasion((current) => current || matchOccasion(card.draft.occasion || text(record(record(card.draft.creative_brief).basics).occasion)));
  }

  const nameError = submitted && !name.trim() ? "Give your card a name." : submitted && name.length > COMMUNITY_NAME_LIMIT ? `Keep the name to ${COMMUNITY_NAME_LIMIT} characters.` : undefined;
  const occasionError = submitted && !occasion ? "Choose an occasion." : undefined;
  const pickError = submitted && !selected ? "Choose the card you'd like to share." : undefined;
  const agreeError = submitted && (!original || !licence) ? "Tick both boxes to submit your card." : undefined;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitted(true);
    setError(null);
    if (!selected || !name.trim() || name.length > COMMUNITY_NAME_LIMIT || !occasion || !original || !licence) {
      // Radios cannot carry aria-invalid, so an unchosen card is focused directly.
      if (!selected) requestAnimationFrame(() => form.querySelector<HTMLInputElement>("input[name=cc-submit-card]")?.focus());
      else requestAnimationFrame(() => focusFirstInvalid(form));
      return;
    }
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    try {
      const { submission } = await submitCommunityCard({ cardDraftId: selected, name: name.trim(), occasion, guidelinesVersion: COMMUNITY_GUIDELINES_VERSION });
      setDone(submission);
      onSubmitted(submission);
    } catch (unknownError) {
      setError(unknownError instanceof Error && unknownError.message ? unknownError.message : "Your card couldn't be submitted. Please try again.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  if (done) {
    return (
      <FlowDialog onClose={onClose} labelledBy="cc-submit-title" describedBy="cc-submit-lede" tone="forest" className="fd-narrow fd-center">
        <h2 id="cc-submit-title" className="fd-title">Thanks, it&apos;s in <span className="l-script">review</span></h2>
        <p id="cc-submit-lede" className="fd-lede">
          Our team will check &ldquo;{done.name}&rdquo; against the Community Cards guidelines and email you when it&apos;s posted, or if it needs a change. Until then, only you can see it.
        </p>
        <div className="fd-actions">
          <button type="button" className="l-btn l-btn-primary" onClick={onClose}>Done</button>
        </div>
      </FlowDialog>
    );
  }

  return (
    <FlowDialog onClose={sending ? () => undefined : onClose} labelledBy="cc-submit-title" describedBy="cc-submit-lede" tone="forest" className="fd-wide cc-submit">
      <h2 id="cc-submit-title" className="fd-title">Share a card you <span className="l-script">made</span></h2>
      <p id="cc-submit-lede" className="fd-lede">
        Choose one of your finished Build My Card designs. Once our team approves it, it joins Community Cards for anyone to send. Sharing doesn&apos;t use any credits.
      </p>

      {status === "loading" && <p className="cc-submit-loading" role="status">Loading your cards…</p>}
      {status === "error" && (
        <p className="cf-alert" role="alert">
          We couldn&apos;t load your saved cards.{" "}
          <button type="button" className="cf-text-link" onClick={() => { setStatus("loading"); void load(); }}>Try again</button>
        </p>
      )}

      {status === "ready" && !available.length && (
        <div className="cc-submit-empty">
          <p>{cards.length ? "You've already shared all of your finished designs." : "You don't have a finished Build My Card design to share yet."} Design one with your credits, then come back here.</p>
          <p className="cc-submit-hint">Cards made from your own photos, Personalize a Template cards and Community Cards stay private, so they aren&apos;t listed.</p>
          <div className="fd-actions">
            <button type="button" className="l-btn l-btn-secondary" onClick={onClose}>Close</button>
            <Link className="l-btn l-btn-primary" href="/create/build-my-card">Build a card</Link>
          </div>
        </div>
      )}

      {status === "ready" && available.length > 0 && (
        <form className="cc-submit-form" onSubmit={submit} noValidate aria-busy={sending}>
          <fieldset className="cc-submit-pick" aria-describedby={pickError ? "cc-submit-pick-error" : undefined}>
            <legend className="cf-label">Your card</legend>
            <ul className="cc-submit-cards">
              {available.map((card) => (
                <li key={card.draft.id}>
                  <label className={`cc-submit-card${selected === card.draft.id ? " is-selected" : ""}`}>
                    <input type="radio" name="cc-submit-card" value={card.draft.id} checked={selected === card.draft.id} onChange={() => choose(card)} />
                    {/* unoptimized: a saved card's front is a stored asset URL (mock: absolute localhost), as in Saved Cards & Songs. */}
                    <span className="cc-submit-card-art">{card.imageUrl ? <Image src={card.imageUrl} alt="" fill sizes="120px" unoptimized /> : null}</span>
                    <span className="cc-submit-card-name">{card.title}</span>
                  </label>
                </li>
              ))}
            </ul>
            {pickError && <span id="cc-submit-pick-error" className="cf-err">{pickError}</span>}
            <p className="cc-submit-hint">Only Build My Card designs that weren&apos;t made from your own photos can be shared.</p>
          </fieldset>

          <div className="cc-submit-fields">
            <FlowField label="Card name" error={nameError}>
              {(control) => (
                <input {...control} className="cf-input" value={name} maxLength={COMMUNITY_NAME_LIMIT + 10} placeholder="e.g. Sunflower Morning"
                  aria-describedby={[control["aria-describedby"], "cc-submit-name-count"].filter(Boolean).join(" ")}
                  onChange={(event) => setName(event.target.value)} />
              )}
            </FlowField>
            <p id="cc-submit-name-count" className="cc-submit-hint">Shown on the card&apos;s tile. No names of real people, please. {Math.max(0, COMMUNITY_NAME_LIMIT - name.length)} characters left.</p>
            <FlowField label="Occasion" error={occasionError}>
              {(control) => (
                <select {...control} className="cf-select" value={occasion} onChange={(event) => setOccasion(event.target.value)}>
                  <option value="">Choose an occasion</option>
                  {OCCASION_FILTERS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              )}
            </FlowField>
          </div>

          <div className="cc-submit-rules">
            <p className="cc-submit-rules-title">Before you share</p>
            <ul>
              <li>No real, recognizable people, including celebrities and family.</li>
              <li>No characters, logos, brands, artwork or lyrics that belong to someone else.</li>
              <li>No names, addresses or other personal details on the front.</li>
            </ul>
            <details className="cc-submit-more">
              <summary>Read the full guidelines and the grey areas</summary>
              <CommunityGuidelinesBody scope="submit" />
            </details>
          </div>

          <fieldset className="cc-submit-agree" aria-describedby={agreeError ? "cc-submit-agree-error" : undefined}>
            <legend className="l-sr-only">Agreement</legend>
            <label className="cc-send-blank">
              <input type="checkbox" checked={original} aria-invalid={submitted && !original ? true : undefined} onChange={(event) => setOriginal(event.target.checked)} />
              <span>I designed this card in Souvenote, and it follows the Community Cards guidelines.</span>
            </label>
            <label className="cc-send-blank">
              <input type="checkbox" checked={licence} aria-invalid={submitted && !licence ? true : undefined} onChange={(event) => setLicence(event.target.checked)} />
              <span>
                If it&apos;s approved, I let Souvenote show, print and sell it to other customers and let people share it, as the{" "}
                <Link href="/legal/terms-of-service#your-content" target="_blank" rel="noopener">Terms of Service<span className="l-sr-only"> (opens in a new tab)</span></Link>{" "}
                describe. It&apos;s posted without my name and isn&apos;t paid. I can ask for it to be taken down at any time.
              </span>
            </label>
            {agreeError && <span id="cc-submit-agree-error" className="cf-err">{agreeError}</span>}
          </fieldset>

          {error && <p className="cf-err" role="alert">{error}</p>}
          <div className="fd-actions">
            <button type="button" className="l-btn l-btn-secondary" onClick={onClose} disabled={sending}>Cancel</button>
            <button type="submit" className="l-btn l-btn-primary" aria-disabled={sending || undefined}>{sending ? "Submitting…" : "Submit for review"}</button>
          </div>
        </form>
      )}
    </FlowDialog>
  );
}
