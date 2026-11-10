"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlowDialog } from "../flow/FlowDialog";
import { FlowField, focusFirstInvalid } from "../flow/FlowField";
import { createCommunityCardDraft, fetchCardDraftAssets, fetchCardDraftById, updateCardDraft, type CardDraftAsset } from "../../lib/api";
import { rememberSelectedAsset } from "../../lib/mockMvpFlow";
import { rememberDeliverySource } from "../delivery/deliverySource";
import { COMMUNITY_MESSAGE_LIMIT, COMMUNITY_MESSAGE_MAX_LINES, type CommunityCard } from "./catalog";
import { ShareIcon } from "./ShareIcon";

// "Send this card" pop-up: the card's front, the inside message (written by the
// customer, saved exactly as typed, no AI, no gold), or a blank inside. Send
// this card saves a community_card draft (it then shows in Saved Cards & Songs)
// and goes to Delivery. Nothing here uses credits.
//
// Sending the same card again in this tab (for example Back from Delivery, then
// Send) reopens the message you wrote and updates that draft instead of saving
// a second copy (audit C7, 2026-11-09). A new draft is made only when the inside
// switches between written and blank, because the draft's assets differ, or when
// the old draft is gone.

const LAST_SENT_KEY = "souv_cc_last_sent";

type LastSent = { draftId: string; message: string | null };

function readLastSent(cardId: string): LastSent | null {
  try {
    const all = JSON.parse(window.sessionStorage.getItem(LAST_SENT_KEY) || "{}") as Record<string, LastSent>;
    return all[cardId] || null;
  } catch {
    return null;
  }
}

function writeLastSent(cardId: string, value: LastSent) {
  try {
    const all = JSON.parse(window.sessionStorage.getItem(LAST_SENT_KEY) || "{}") as Record<string, LastSent>;
    all[cardId] = value;
    window.sessionStorage.setItem(LAST_SENT_KEY, JSON.stringify(all));
  } catch {
    // Storage unavailable: the next Send just saves a new draft.
  }
}

function lineCount(text: string) {
  return text ? text.split(/\r?\n/).length : 0;
}

function assetType(asset: CardDraftAsset) {
  return (asset.assetType || asset.asset_type || "").toLowerCase();
}

/** The earlier draft for this card, updated with the new message, or null when a new draft is needed. */
async function reuseDraft(last: LastSent | null, message: string | null) {
  if (!last || (last.message === null) !== (message === null)) return null;
  try {
    const draft = await fetchCardDraftById(last.draftId);
    if (draft.status === "deleted") return null;
    const brief = (draft.creative_brief || {}) as Record<string, unknown>;
    const cardDraft = last.message === message ? draft : await updateCardDraft(draft.id, {
      creativeBrief: { ...brief, message: { mode: message === null ? "blank" : "text", text: message } },
    });
    return { cardDraft, assets: await fetchCardDraftAssets(draft.id) };
  } catch {
    return null;
  }
}

export function CommunitySendDialog({ card, onClose }: { card: CommunityCard; onClose: () => void }) {
  const router = useRouter();
  const [message, setMessage] = React.useState("");
  const [blank, setBlank] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const sendingRef = React.useRef(false);
  const remaining = COMMUNITY_MESSAGE_LIMIT - message.length;
  const lines = lineCount(message);

  // Bring back what was written for this card earlier in this tab.
  React.useEffect(() => {
    const last = readLastSent(card.id);
    if (!last) return;
    if (last.message === null) setBlank(true);
    else setMessage(last.message);
  }, [card.id]);

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!blank) {
      if (!message.trim()) { setError("Write your message, or choose to leave the inside blank."); focusFirstInvalid(form); return; }
      if (message.length > COMMUNITY_MESSAGE_LIMIT) { setError(`Keep it to ${COMMUNITY_MESSAGE_LIMIT} characters, including your sign-off.`); focusFirstInvalid(form); return; }
      if (lines > COMMUNITY_MESSAGE_MAX_LINES) { setError(`Keep it to ${COMMUNITY_MESSAGE_MAX_LINES} short lines so it fits inside the card.`); focusFirstInvalid(form); return; }
    }
    // A ref, not just state: a fast second press would otherwise save a second draft (audit B8).
    if (sendingRef.current) return;
    sendingRef.current = true;
    setError(null);
    setSending(true);
    try {
      const text = blank ? null : message;
      const saved = (await reuseDraft(readLastSent(card.id), text)) || await createCommunityCardDraft({
        cardId: card.id,
        cardVersion: card.version,
        cardName: card.name,
        occasion: card.occasion,
        message: text,
        artUrl: card.art,
      });
      const front = saved.assets.find((asset) => assetType(asset) === "image");
      if (front) rememberSelectedAsset(saved.cardDraft.id, front.id, saved.assets);
      writeLastSent(card.id, { draftId: saved.cardDraft.id, message: text });
      rememberDeliverySource("community");
      router.push("/delivery");
    } catch (unknownError) {
      setError(unknownError instanceof Error && unknownError.message ? unknownError.message : "Your card couldn't be saved. Please try again.");
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <FlowDialog onClose={sending ? () => undefined : onClose} labelledBy="cc-send-title" describedBy="cc-send-lede" tone="terracotta" className="fd-wide cc-send">
      <div className="cc-send-layout">
        <div className={`cc-send-art is-${card.orientation}`}>
          <Image src={card.art} alt={`${card.name}: card front (placeholder until the artwork is ready)`} fill sizes="200px" />
        </div>
        <div className="cc-send-body">
          <h2 id="cc-send-title" className="fd-title">Send <span className="l-script">{card.name}</span></h2>
          <p id="cc-send-lede" className="fd-lede">Write what you&apos;d like printed inside. It&apos;s free, and it uses no AI credits.</p>
          <form className="cc-send-form" onSubmit={send} noValidate aria-busy={sending}>
            <FlowField label="Inside message" error={!blank && error ? error : undefined}>
              {(control) => (
                <textarea
                  {...control}
                  className="cf-input cc-send-message"
                  rows={5}
                  value={message}
                  disabled={blank}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={"Happy birthday, Mom!\nLove, Jordan"}
                  aria-describedby={[control["aria-describedby"], "cc-send-count"].filter(Boolean).join(" ")}
                />
              )}
            </FlowField>
            <p id="cc-send-count" className={`cc-send-count ${remaining < 0 || lines > COMMUNITY_MESSAGE_MAX_LINES ? "is-over" : ""}`} aria-live="polite">
              {blank ? "The inside will be left blank." : `${Math.max(0, remaining)} characters left · ${lines} of ${COMMUNITY_MESSAGE_MAX_LINES} lines`}
            </p>
            <label className="cc-send-blank">
              <input type="checkbox" checked={blank} onChange={(event) => { setBlank(event.target.checked); setError(null); }} />
              <span>Leave the inside blank</span>
            </label>
            {blank && error && <p className="cf-err" role="alert">{error}</p>}
            <p className="cc-send-note">You&apos;ll add the address next, then pay with Print and Send or a card from your Big Sender pack. Community Cards don&apos;t include a song.</p>
            <div className="fd-actions">
              <button type="button" className="l-btn l-btn-secondary" onClick={onClose} disabled={sending}>Cancel</button>
              <button type="submit" className="l-btn l-btn-primary" aria-disabled={sending || undefined}>{sending ? "Saving…" : "Send this card"}</button>
            </div>
          </form>
        </div>
      </div>
    </FlowDialog>
  );
}

/**
 * Signed-out visitors (a tile's Send, or a shared ?card= link): the card itself,
 * then log in or sign up to send it, coming back to the same card. Share link
 * works without an account (audit C8, 2026-11-09).
 */
export function CommunitySignInDialog({ card, onClose, onShare }: { card: CommunityCard; onClose: () => void; onShare: () => void }) {
  const q = `?returnTo=${encodeURIComponent(`/community-cards?card=${encodeURIComponent(card.id)}`)}`;
  return (
    <FlowDialog onClose={onClose} labelledBy="cc-signin-title" describedBy="cc-signin-lede" tone="berry" className="fd-mid cc-signin">
      <div className="cc-signin-layout">
        <div className={`cc-send-art is-${card.orientation}`}>
          <Image src={card.art} alt={`${card.name}: card front (placeholder until the artwork is ready)`} fill sizes="160px" />
        </div>
        <div className="cc-signin-body">
          {/* Title and name placement: owner decision O5 (2026-11-09). */}
          <h2 id="cc-signin-title" className="fd-title">Log in to send <span className="l-script">this card</span></h2>
          <p id="cc-signin-lede" className="fd-lede">
            Sending &ldquo;{card.name}&rdquo; is for Souvenote accounts, so we can print and mail it for you. Signing up is free and includes 2 AI credits for your own designs.
          </p>
        </div>
      </div>
      <div className="fd-actions cc-signin-actions">
        <button type="button" className="l-btn l-btn-secondary cc-signin-share" onClick={onShare}><ShareIcon size={16} /> Share link</button>
        <Link className="l-btn l-btn-secondary" href={`/login${q}`}>Log In</Link>
        <Link className="l-btn l-btn-primary" href={`/signup${q}`}>Sign Up</Link>
      </div>
    </FlowDialog>
  );
}
