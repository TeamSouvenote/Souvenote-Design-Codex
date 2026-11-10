"use client";

// Build My Card's other dialogs, all on the shared berry & ivory dialog shell
// (FlowDialog: rendered into <body>, page behind inert, Tab kept inside,
// Escape closes, focus returned on close).
// - BmcSignUpDialog: signed-out visitors, at the first save, upload or AI call.
// - BmcGeneratingDialog: "Creating your card", each piece's own status.
// - BmcSpendDialog: confirms a paid regeneration on Review before credits move.
// The cards-or-credits choice lives in ../flow/TopUpChoiceDialog.tsx (shared with Personalize).

import * as React from "react";
import Link from "next/link";
import { FlowDialog } from "../flow/FlowDialog";
import { Icon } from "./ui";
import type { IconName } from "./ui";

function authHref(path: "/login" | "/signup", returnTo: string) {
  return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
}

const SIGN_UP_BODY = "Build My Card lets you preview the first step, but saving drafts, purchasing cards, and spending generation credits require a Souvenote account.";

/** `heading` and `body` let Personalize a Template use its own words (default: Build My Card's). */
export function BmcSignUpDialog({ returnTo, onClose, heading = ["Save your card before", "step two"], body = SIGN_UP_BODY }: {
  returnTo: string; onClose: () => void; heading?: [string, string]; body?: string;
}) {
  return (
    <FlowDialog onClose={onClose} labelledBy="bmcq-signup-title" describedBy="bmcq-signup-body" tone="forest" className="fd-narrow fd-center bmcq-dialog" screenLabel="Modal · Sign up to continue">
      <h2 id="bmcq-signup-title" className="fd-title">{heading[0]} <span className="l-script">{heading[1]}</span></h2>
      <p id="bmcq-signup-body" className="fd-lede">
        {body}
      </p>
      <p className="bmcq-dialog-credits"><Icon name="sparkle" size={16} /> Includes 2 free credits to create a complete card</p>
      <div className="fd-actions">
        <Link className="l-btn l-btn-secondary" href={authHref("/login", returnTo)}>Log in</Link>
        <Link className="l-btn l-btn-primary" href={authHref("/signup", returnTo)}>Sign up and continue</Link>
      </div>
      <p className="bmcq-dialog-foot"><Link href="/pricing">View card and credit pricing</Link></p>
    </FlowDialog>
  );
}

export type PieceStatus = "working" | "ready" | "failed" | "off";

export type GenerationProgress = {
  front: PieceStatus;
  song: PieceStatus;
  songLabel: string;
  message: "ready" | "blank";
  error: string | null;
};

const STATUS_TEXT: Record<PieceStatus, string> = { working: "Working…", ready: "Ready", failed: "Didn’t work", off: "Not included" };

function Row({ icon, label, status, detail }: { icon: IconName; label: string; status: PieceStatus; detail?: string }) {
  return (
    <li className={`bmcq-gen-row is-${status}`}>
      <span className="bmcq-gen-icon" aria-hidden="true"><Icon name={icon} size={18} /></span>
      <span className="bmcq-gen-label">{label}{detail && <small>{detail}</small>}</span>
      <span className="bmcq-gen-status">
        {status === "working" && <span className="bmcq-gen-dots" aria-hidden="true"><i /><i /><i /></span>}
        {status === "ready" && <Icon name="check" size={16} />}
        {STATUS_TEXT[status]}
      </span>
    </li>
  );
}

/** Stays open while pieces are made; it can't be dismissed until something finishes or fails. */
export function BmcGeneratingDialog({ progress, onClose }: { progress: GenerationProgress; onClose: () => void }) {
  const busy = progress.front === "working" || progress.song === "working";
  const summary = progress.error
    ? progress.error
    : busy ? "Making your card. This usually takes under a minute." : "Everything’s ready. Taking you to review.";
  return (
    <FlowDialog onClose={busy ? () => undefined : onClose} hideClose={busy} labelledBy="bmcq-gen-title" describedBy="bmcq-gen-status" tone="gold" className="fd-mid bmcq-dialog bmcq-gen" screenLabel="Modal · Creating your card">
      <h2 id="bmcq-gen-title" className="fd-title">Making your <span className="l-script">card</span></h2>
      <p id="bmcq-gen-status" className="fd-lede" role="status" aria-live="polite">{summary}</p>
      <ul className="bmcq-gen-list">
        <Row icon="image" label="Front artwork" status={progress.front} />
        <Row icon="note" label={progress.songLabel} status={progress.song} />
        <Row icon="message" label="Inside message" status="ready" detail={progress.message === "blank" ? "Left blank" : "Written and saved"} />
      </ul>
      {!busy && progress.error && (
        <div className="fd-actions">
          <button type="button" className="l-btn l-btn-primary" onClick={onClose}>Back to my card</button>
        </div>
      )}
    </FlowDialog>
  );
}

export function BmcSpendDialog({ part, credits, onCancel, onConfirm }: { part: "front" | "song"; credits: number; onCancel: () => void; onConfirm: () => void }) {
  const what = part === "front" ? "front" : "song";
  return (
    <FlowDialog onClose={onCancel} labelledBy="bmcq-spend-title" describedBy="bmcq-spend-body" tone="gold" className="fd-narrow bmcq-dialog" role="alertdialog" screenLabel="Modal · Confirm credit">
      <h2 id="bmcq-spend-title" className="fd-title">Make a new <span className="l-script">{what}?</span></h2>
      <p id="bmcq-spend-body" className="fd-lede">
        {part === "front"
          ? "We’ll create a fresh front from your current answers. Your current front stays until the new one is ready."
          : "We’ll record the song again using your approved lyrics. Your current song stays until the new one is ready."}
      </p>
      <p className="bmcq-dialog-credits">You have {credits} credit{credits === 1 ? "" : "s"}. This uses 1.</p>
      <div className="fd-actions">
        <button type="button" className="l-btn l-btn-secondary" onClick={onCancel}>Not now</button>
        <button type="button" className="l-btn l-btn-primary" onClick={onConfirm}>Use 1 credit</button>
      </div>
    </FlowDialog>
  );
}
