"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchMyCommunitySubmissions, type CommunitySubmission } from "../../lib/api";

// "Have a card the public would love?" at the top of /community-cards, and
// "Your shared cards" under it (owner, 2026-11-09). Kept apart from the pop-ups
// (CommunitySubmit.tsx), which load only when opened (audit C19).
//
// The flow (audit C1, owner: the recommended set): build the card in Build My
// Card with ?for=community, then "Share to Community Cards" at Review (or
// "Share a card I made" here) opens the submit pop-up. The card is then "In
// review" under Your shared cards until our team approves it. Mock mode stores
// submissions and never approves them; the review queue is backend work
// (DEVELOPER_HANDOFF.md).

/** Build My Card for a community card: the describe-only, no-song flow (bmc/community.ts). */
export const COMMUNITY_BUILD_HREF = "/create/build-my-card?for=community";

export function CommunityPublishBand({ signedIn, onSubmit, onGuidelines }: { signedIn: boolean; onSubmit: () => void; onGuidelines: () => void }) {
  return (
    <section className="cc-publish" aria-labelledby="cc-publish-title">
      <div className="cc-publish-copy">
        <h2 id="cc-publish-title" className="cc-publish-title">Have a card the public would <span className="l-script">love?</span></h2>
        <p className="cc-publish-lede">
          Use your credits to build a card for the Community, then share it here. Once it&apos;s approved, anyone can send it with their own message inside, and you can share it to your socials to get the word out.
        </p>
        <p className="cc-publish-review">
          <span className="cc-publish-badge">Reviewed first</span>
          Every card is checked by our team before it&apos;s posted.{" "}
          <button type="button" className="cf-text-link" onClick={onGuidelines}>What we can and can&apos;t post</button>
        </p>
      </div>
      <div className="cc-publish-actions">
        <Link className="l-btn l-btn-primary" href={COMMUNITY_BUILD_HREF}>Build a card for the Community</Link>
        {signedIn && <button type="button" className="l-btn l-btn-secondary" onClick={onSubmit}>Share a card I made</button>}
      </div>
    </section>
  );
}

const STATUS_LABEL: Record<CommunitySubmission["status"], string> = {
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Posted",
  declined: "Not approved",
};

export function useMyCommunitySubmissions(signedIn: boolean) {
  const [submissions, setSubmissions] = React.useState<CommunitySubmission[]>([]);
  const load = React.useCallback(async () => {
    if (!signedIn) { setSubmissions([]); return; }
    try { setSubmissions(await fetchMyCommunitySubmissions()); } catch { setSubmissions([]); }
  }, [signedIn]);
  React.useEffect(() => { void load(); }, [load]);
  return { submissions, reload: load };
}

export function MyCommunitySubmissions({ submissions }: { submissions: CommunitySubmission[] }) {
  if (!submissions.length) return null;
  return (
    <section className="cc-section cc-mine" aria-labelledby="cc-mine-title">
      <div className="cc-row-head">
        <h2 id="cc-mine-title" className="cc-row-title">Your shared cards</h2>
        <span className="cc-row-count">Only you can see cards that are in review.</span>
      </div>
      <ul className="cc-mine-list">
        {submissions.map((item) => (
          <li key={item.id} className="cc-mine-item">
            {/* unoptimized: a saved card's front is a stored asset URL (mock: an absolute localhost
                address), which next/image's loader doesn't allow; same as Saved Cards & Songs. */}
            <span className="cc-mine-art">{item.artUrl ? <Image src={item.artUrl} alt="" fill sizes="56px" unoptimized /> : null}</span>
            <span className="cc-mine-text">
              <span className="cc-mine-name">{item.name}</span>
              <span className="cc-tile-occasion">{item.occasion}</span>
              {item.reviewNote && <span className="cc-mine-note">{item.reviewNote}</span>}
            </span>
            <span className={`cc-mine-status is-${item.status}`}>{STATUS_LABEL[item.status]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
