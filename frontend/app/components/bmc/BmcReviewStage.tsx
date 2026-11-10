"use client";

// Review: the step after generation. Three cards side by side (front, inside
// message, song), each with its own small decision buttons underneath. Approval
// belongs to an exact version, so any edit clears it. Approving the last piece
// opens "Approve all three and continue to delivery?" (owner, 2026-11-08); there
// is no separate approve-all bar.

import * as React from "react";
import type { CardDraftAsset } from "../../lib/api";
import { FlowDialog } from "../flow/FlowDialog";
import type { Brief } from "./brief";
import { hasSong, lyricsStaleReason, photoKey, printedVersion, printedVersionKey, validateLyrics, validateMessage } from "./brief";
import { assetImageUrl, latestAsset } from "./assets";
import { LIMITS, genreById } from "./catalog";
import { compileImagePrompt, imageSummary } from "./compile";
import { QrSongCode } from "./QrSongCode";
import { BusyAnnounce, Counter, FrontWords, Icon, LyricBlocks, TextField, Thinking, useSections } from "./ui";
import type { IconName } from "./ui";

export type Approvals = { front: string | null; message: string | null; song: string | null };

type Props = {
  brief: Brief;
  assets: CardDraftAsset[];
  approvals: Approvals;
  setApprovals: (next: Approvals) => void;
  update: (change: (brief: Brief) => void) => void;
  regenerate: (parts: { image: boolean; song: boolean }) => Promise<void>;
  editAnswers: (questionId: string) => void;
  toDelivery: (imageAssetId: string) => void;
  /** Writes a fresh AI inside message (shares the five tries with the message step). */
  writeAi: () => Promise<void>;
  working: "image" | "song" | null;
  /** Personalize a Template: the front prompt to compare for staleness (default: Build My Card's). */
  frontPrompt?: string;
  /** Personalize a Template: lines shown under the front (default: the caption). */
  frontNotes?: string[];
  /** Personalize: the words printed on the front, shown in "Check the spelling (N)". */
  frontWords?: string[];
  /** The question "Change answers" opens for the front (default: the image summary). */
  frontEditQuestionId?: string;
  /** Label for the song panel (default: the chosen genre). */
  songLabel?: string;
  /** Focus lands on the Review heading when Review opens. */
  headingRef?: React.Ref<HTMLHeadingElement>;
};

/** Approval belongs to one exact version of the message that prints. */
function messageKey(brief: Brief) {
  if (brief.message.mode === "blank") return "blank";
  const key = printedVersionKey(brief);
  const chosen = printedVersion(brief);
  return key && chosen ? `${key}:${chosen.version}:${chosen.text.length}` : "none";
}

const PANEL_TITLE_IDS = ["bmcq-front-title", "bmcq-message-title", "bmcq-song-title"];

/**
 * A small decision button with its words on two lines ("Try again" over "1 credit").
 * `busy` (something is being made) keeps it focusable with aria-disabled and ignores presses,
 * so focus never falls to <body> (design system 2.28); `disabled` is only for "can’t yet".
 */
const StackButton = React.forwardRef<HTMLButtonElement, {
  top: string; bottom?: string; icon?: IconName; tone?: "primary" | "secondary" | "ai" | "done";
  onClick: () => void; disabled?: boolean; busy?: boolean; label: string; pressed?: boolean;
}>(function StackButton({ top, bottom, icon, tone = "secondary", onClick, disabled, busy, label, pressed }, ref) {
  return (
    <button ref={ref} type="button" className={`bmcq-stack-btn is-${tone}`} onClick={busy ? undefined : onClick} disabled={disabled && !busy}
      aria-disabled={busy || undefined} aria-label={label} aria-pressed={pressed}>
      {icon && <Icon name={icon} size={14} />}
      <span className="bmcq-stack-top">{top}</span>
      {bottom && <span className="bmcq-stack-bottom">{bottom}</span>}
    </button>
  );
});

export function BmcReviewStage({
  brief, assets, approvals, setApprovals, update, regenerate, editAnswers, toDelivery, writeAi, working, headingRef,
  frontPrompt, frontNotes, frontWords, frontEditQuestionId = "I5_summary", songLabel,
}: Props) {
  const image = latestAsset(assets, "image");
  const song = latestAsset(assets, "song");
  const songOn = hasSong(brief);
  const blank = brief.message.mode === "blank";
  const imageUrl = assetImageUrl(image);
  // Out of date when the front's answers or its photos changed since it was made.
  const generation = brief.control.generation;
  const frontStale = Boolean(generation && ((frontPrompt ?? compileImagePrompt(brief)) !== generation.compiledImagePrompt
    || (generation.photoKey !== undefined && generation.photoKey !== photoKey(brief))));
  // The audio was made from one lyrics version; editing the lyrics afterwards needs new audio.
  const songStale = brief.song.mode === "vocal" && Boolean(song) && brief.song.audioLyricsVersion !== brief.song.lyricsVersion;
  const msgKey = messageKey(brief);
  const songKey = song ? `${song.id}:${brief.song.lyricsVersion}` : null;

  const isDone = (next: Approvals) => ({
    front: Boolean(image) && next.front === image?.id && !frontStale,
    message: blank || next.message === msgKey,
    song: !songOn || (Boolean(song) && next.song === songKey && !songStale),
  });
  const ok = isDone(approvals);
  const required = 1 + (blank ? 0 : 1) + (songOn ? 1 : 0);
  const allDone = ok.front && ok.message && ok.song;

  const [editingMessage, setEditingMessage] = React.useState(false);
  const [editingLyrics, setEditingLyrics] = React.useState(false);
  const [lyricsDraft, setLyricsDraft] = React.useState(brief.song.lyrics);
  const lyricsDraftError = validateLyrics(lyricsDraft);
  const [aiBusy, setAiBusy] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const aiUsed = brief.message.aiVersion?.drafts.length || 0;
  const aiLeft = Math.max(0, LIMITS.aiMessageDrafts - aiUsed);
  const messageApproveRef = React.useRef<HTMLButtonElement>(null);

  // Approving the last piece asks once to approve everything and move on.
  const approve = (next: Approvals) => {
    setApprovals(next);
    const after = isDone(next);
    if (after.front && after.message && after.song) setConfirmOpen(true);
  };

  const messageError = blank ? null : validateMessage(chosenText(brief));
  const lyricsError = brief.song.mode === "vocal" ? validateLyrics(brief.song.lyrics) : null;

  // Edit opens the lyrics as saved; Done saves a valid change (and keeps them approved).
  const toggleLyrics = () => {
    if (!editingLyrics) { setLyricsDraft(brief.song.lyrics); setEditingLyrics(true); return; }
    if (lyricsDraftError) return;
    if (lyricsDraft !== brief.song.lyrics) {
      setApprovals({ ...approvals, song: null });
      update((b) => { b.song.lyrics = lyricsDraft; b.song.lyricsVersion += 1; b.song.approvedLyricsVersion = b.song.lyricsVersion; });
    }
    setEditingLyrics(false);
  };

  const runAiWriter = async () => {
    setAiBusy(true);
    setAiError(null);
    try {
      await writeAi();
      // A fresh AI message becomes the one that prints; it needs its own approval.
      update((b) => { b.message.printedChoice = "ai"; });
      setEditingMessage(false);
      // The AI writer button goes once the last try is used; keep focus on the message's decisions.
      if (aiUsed + 1 >= LIMITS.aiMessageDrafts) requestAnimationFrame(() => messageApproveRef.current?.focus());
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "The message couldn’t be written. Try again.");
    } finally {
      setAiBusy(false);
    }
  };

  // Phones: one card per screen (Front, Inside message, Song), with Previous/Next.
  const panelNames = ["Front", "Inside message", ...(songOn ? [brief.song.mode === "vocal" ? "Song" : "Instrumental"] : [])];
  const sections = useSections(panelNames.length);
  // Phones: Previous and Next can disappear or dim at the ends, so focus moves to the new card’s heading (2.28).
  const shownPanel = React.useRef(sections.index);
  React.useEffect(() => {
    if (!sections.phone || shownPanel.current === sections.index) return;
    shownPanel.current = sections.index;
    document.getElementById(PANEL_TITLE_IDS[sections.index])?.focus({ preventScroll: false });
  }, [sections.index, sections.phone]);
  const caption = frontNotes ? null : imageSummary(brief).find((row) => row.label === "Caption")?.value;

  return (
    <div className="bmcq-review">
      <header className="bmcq-review-head">
        <h1 className="bmcq-title" ref={headingRef} tabIndex={-1}>Look it <span className="l-script">over</span></h1>
        <p className="bmcq-lede">Approve each piece. Nothing is printed until you send it.</p>
        <BusyAnnounce busy={working === "image"} busyText="Making a new front…" doneText={image ? "New front ready." : ""} />
        <BusyAnnounce busy={working === "song"} busyText="Making a new song…" doneText={song ? "New song ready." : ""} />
        {allDone && image && (
          <button type="button" className="bmcq-btn is-primary is-small bmcq-review-go" onClick={() => toDelivery(image.id)}>
            Continue to delivery <Icon name="arrow" size={14} />
          </button>
        )}
      </header>
      <div className="bmcq-review-grid">
        {/* Front: the whole 5x7 card, its decisions underneath. */}
        {sections.shows(0) && (
          <div className="bmcq-review-col is-front">
            <section className="bmcq-panel is-front" aria-labelledby="bmcq-front-title">
              <header className="bmcq-panel-head">
                <h2 id="bmcq-front-title" tabIndex={-1}>Front</h2>
                <Status ready={Boolean(image)} approved={ok.front} working={working === "image"} stale={frontStale} />
              </header>
              <div className="bmcq-panel-body">
                <div className="bmcq-front-stage">
                  <div className={`bmcq-front${brief.image.orientation === "landscape" ? " is-landscape" : ""}`}>
                    {working === "image" ? <Thinking label="Making a new front…" announce={false} /> : imageUrl
                      // eslint-disable-next-line @next/next/no-img-element -- a generated front from asset storage, not a static asset
                      ? <img src={imageUrl} alt="Your card front" />
                      : <span className="bmcq-front-empty">{image ? "Your front is ready. A preview appears once real artwork is connected." : "No front yet."}</span>}
                  </div>
                </div>
                {caption && caption !== "No caption" && <p className="bmcq-panel-note">Caption: {caption}</p>}
                {frontNotes?.map((note) => <p key={note} className="bmcq-panel-note">{note}</p>)}
                {frontWords && <FrontWords words={frontWords} />}
                {frontStale && <p className="bmcq-stale" role="status">You changed your front’s answers since this was made. Try again to use them.</p>}
              </div>
            </section>
            <div className="bmcq-review-actions" role="group" aria-label="Front decisions">
              <StackButton top="Change" bottom="answers" icon="edit" label="Change answers" onClick={() => editAnswers(frontEditQuestionId)} />
              <StackButton top="Try again" bottom="1 credit" icon="refresh" tone="ai" label="Try again, 1 credit" busy={working !== null}
                onClick={() => { void regenerate({ image: true, song: false }); }} />
              <StackButton top="Approve" icon="check" tone={ok.front ? "done" : "primary"} label="Approve front"
                pressed={ok.front} disabled={!image || frontStale} busy={working === "image"}
                onClick={() => approve({ ...approvals, front: ok.front ? null : image?.id || null })} />
            </div>
          </div>
        )}

        {/* Inside message */}
        {sections.shows(1) && (
          <div className="bmcq-review-col is-message">
            <MessagePanel brief={brief} update={update} approved={ok.message} editing={editingMessage} busy={aiBusy} error={aiError}
              onEdit={() => setApprovals({ ...approvals, message: null })}
              onPrintChoice={() => window.setTimeout(() => messageApproveRef.current?.focus(), 0)} />
            <div className="bmcq-review-actions" role="group" aria-label="Inside message decisions">
              <StackButton top={editingMessage ? "Done" : "Edit"} bottom={editingMessage ? "editing" : "free"} icon={editingMessage ? "check" : "edit"}
                label="Edit the message, free" pressed={editingMessage} disabled={blank}
                onClick={() => setEditingMessage(!editingMessage)} />
              {aiLeft > 0 && !blank && (
                <StackButton top="AI" bottom="writer" icon="sparkle" tone="ai" label={`AI writer, ${aiLeft} of ${LIMITS.aiMessageDrafts} tries left`}
                  busy={aiBusy} onClick={() => { void runAiWriter(); }} />
              )}
              <StackButton top={blank ? "Blank" : "Approve"} icon="check" tone={ok.message ? "done" : "primary"}
                ref={messageApproveRef} label={blank ? "Nothing to approve" : "Approve message"} pressed={blank ? undefined : ok.message}
                disabled={blank || Boolean(messageError)} busy={aiBusy}
                onClick={() => approve({ ...approvals, message: ok.message ? null : msgKey })} />
            </div>
          </div>
        )}

        {/* Song: the lyrics are shown in full. */}
        {songOn && sections.shows(2) && (
          <div className="bmcq-review-col is-song">
            <section className="bmcq-panel is-song" aria-labelledby="bmcq-song-title">
              <header className="bmcq-panel-head">
                <h2 id="bmcq-song-title" tabIndex={-1}>{brief.song.mode === "vocal" ? "Song" : "Instrumental"}</h2>
                <Status ready={Boolean(song)} approved={ok.song} working={working === "song"} stale={songStale} />
              </header>
              <div className="bmcq-panel-body">
                <div className="bmcq-song-review">
                  <QrSongCode size={sections.phone ? 150 : 84} />
                  <div className="bmcq-song-meta">
                    <p className="bmcq-song-genre"><Icon name="note" size={14} /> {songLabel || genreById(brief.song.genrePresetId)?.label || "Song"} · about {LIMITS.songTargetSeconds} seconds</p>
                    <p className="bmcq-hint">{song ? "A player appears here once real audio is connected." : "No song yet."}</p>
                  </div>
                </div>
                {brief.song.mode === "vocal" && (
                  <LyricsEditor brief={brief} editing={editingLyrics} draft={lyricsDraft} setDraft={setLyricsDraft}
                    onCancel={() => { setLyricsDraft(brief.song.lyrics); setEditingLyrics(false); }} />
                )}
                {songStale && <p className="bmcq-stale" role="status">The current song uses earlier lyrics. Try again to make new audio with your edits.</p>}
              </div>
            </section>
            <div className="bmcq-review-actions" role="group" aria-label="Song decisions">
              {brief.song.mode === "vocal" && (
                <StackButton top={editingLyrics ? "Done" : "Edit"} bottom={editingLyrics ? "editing" : "lyrics"} icon={editingLyrics ? "check" : "edit"}
                  label="Edit lyrics" pressed={editingLyrics}
                  disabled={editingLyrics && Boolean(lyricsDraftError)} onClick={toggleLyrics} />
              )}
              <StackButton top="Try again" bottom="1 credit" icon="refresh" tone="ai" label="Try again, 1 credit"
                disabled={editingLyrics || Boolean(lyricsError)} busy={working !== null}
                onClick={() => { void regenerate({ image: false, song: true }); }} />
              <StackButton top="Approve" icon="check" tone={ok.song ? "done" : "primary"} label="Approve song"
                pressed={ok.song} disabled={!song || songStale || editingLyrics} busy={working === "song"}
                onClick={() => approve({ ...approvals, song: ok.song ? null : songKey })} />
            </div>
          </div>
        )}
      </div>

      {sections.phone && (
        <div className="bmcq-review-pager">
          <button type="button" className="bmcq-btn is-quiet" onClick={sections.prev} disabled={sections.first}><Icon name="back" size={16} /> Previous</button>
          {!sections.isLast && <button type="button" className="bmcq-btn is-secondary" onClick={sections.next}>Next: {panelNames[sections.index + 1]} <Icon name="arrow" size={16} /></button>}
        </div>
      )}

      {confirmOpen && image && (
        <FlowDialog onClose={() => setConfirmOpen(false)} labelledBy="bmcq-approve-title" describedBy="bmcq-approve-body" tone="forest"
          className="fd-narrow fd-center bmcq-dialog" role="alertdialog" screenLabel="Modal · Approve and continue">
          <h2 id="bmcq-approve-title" className="fd-title">
            {required === 3 ? "Approve all three and continue to " : required === 2 ? "Approve both and continue to " : "Approve and continue to "}
            <span className="l-script">delivery?</span>
          </h2>
          <p id="bmcq-approve-body" className="fd-lede">Next you’ll choose how to send it. Nothing is printed until you confirm there.</p>
          <div className="fd-actions">
            <button type="button" className="l-btn l-btn-secondary" onClick={() => setConfirmOpen(false)}>Not yet</button>
            <button type="button" className="l-btn l-btn-primary" onClick={() => { setConfirmOpen(false); toDelivery(image.id); }}>
              Continue to delivery <Icon name="arrow" size={16} />
            </button>
          </div>
        </FlowDialog>
      )}
    </div>
  );
}

function chosenText(brief: Brief) {
  return printedVersion(brief)?.text || "";
}

function Status({ ready, approved, working, stale }: { ready: boolean; approved: boolean; working: boolean; stale: boolean }) {
  const label = working ? "Working…" : stale ? "Needs update" : approved ? "Approved" : ready ? "Ready" : "Not ready";
  return <span className={`bmcq-status is-${working ? "working" : stale ? "stale" : approved ? "approved" : ready ? "ready" : "empty"}`}>{label}</span>;
}

function MessagePanel({ brief, update, approved, editing, busy, error: aiError, onEdit, onPrintChoice }: {
  brief: Brief; update: Props["update"]; approved: boolean; editing: boolean; busy: boolean; error: string | null; onEdit: () => void;
  /** After "Print this one", whose link goes away: focus moves on to Approve. */
  onPrintChoice: () => void;
}) {
  const message = brief.message;
  const blank = message.mode === "blank";
  const versions: { key: "user" | "ai"; title: string; text: string }[] = [];
  if (message.userVersion) versions.push({ key: "user", title: "Your message", text: message.userVersion.text });
  if (message.aiVersion) versions.push({ key: "ai", title: "AI version", text: message.aiVersion.text });
  const chosen = printedVersionKey(brief) || "user";
  const error = blank ? null : validateMessage(versions.find((v) => v.key === chosen)?.text || "");

  const edit = (key: "user" | "ai", text: string) => {
    onEdit();
    update((b) => {
      if (key === "user" && b.message.userVersion) b.message.userVersion = { text, version: b.message.userVersion.version + 1 };
      if (key === "ai" && b.message.aiVersion) b.message.aiVersion = { ...b.message.aiVersion, text, version: b.message.aiVersion.version + 1 };
    });
  };

  return (
    <section className="bmcq-panel is-message" aria-labelledby="bmcq-message-title" aria-busy={busy || undefined}>
      <header className="bmcq-panel-head">
        <h2 id="bmcq-message-title" tabIndex={-1}>Inside message</h2>
        {!blank && <Status ready={versions.length > 0} approved={approved} working={busy} stale={false} />}
      </header>
      <div className="bmcq-panel-body">
        {blank ? (
          <p className="bmcq-hint">You chose to leave the inside blank.{brief.song.mode && brief.song.mode !== "none" ? " Your song's QR code is still printed inside." : ""}</p>
        ) : busy ? <Thinking label="Writing a new message…" announce={false} /> : (
          <div className="bmcq-versions has-two">
            {versions.map((version) => {
              const isChosen = version.key === chosen;
              return (
                <div key={version.key} className={`bmcq-version${version.key === "ai" ? " is-ai" : ""}${isChosen ? " is-chosen" : " is-other"}`}>
                  <div className="bmcq-version-head">
                    <h3>{version.key === "ai" && <Icon name="sparkle" size={14} />} {version.title}</h3>
                    {isChosen
                      ? <span className="bmcq-chosen"><Icon name="check" size={14} /> Will print</span>
                      : <button type="button" className="bmcq-link is-inline" onClick={() => { onEdit(); update((b) => { b.message.printedChoice = version.key; }); onPrintChoice(); }}>Print this one</button>}
                  </div>
                  {editing && isChosen ? (
                    <TextField id={`bmcq-review-${version.key}`} label={`Edit ${version.title.toLowerCase()}`} hideLabel multiline rows={4} value={version.text}
                      onChange={(text) => edit(version.key, text)} maxLength={600} autoFocus
                      error={error} hint={<Counter value={version.text.length} max={LIMITS.messageMaxChars} label="characters" />} />
                  ) : (
                    <>
                      <p className="bmcq-version-text">{version.text}</p>
                      {isChosen && error && <div className="bmcq-error" role="alert">{error}</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <BusyAnnounce busy={busy} busyText="Writing a new message…" doneText={aiError ? "" : "New message ready."} />
        {aiError && <div className="bmcq-error" role="alert">{aiError}</div>}
      </div>
    </section>
  );
}

function LyricsEditor({ brief, editing, draft, setDraft, onCancel }: {
  brief: Brief; editing: boolean; draft: string; setDraft: (text: string) => void; onCancel: () => void;
}) {
  const error = validateLyrics(draft);
  const stale = lyricsStaleReason(brief);
  return (
    <div className="bmcq-review-lyrics">
      {editing ? (
        <>
          <TextField id="bmcq-review-lyrics" label="Lyrics" hideLabel multiline rows={Math.max(9, draft.split("\n").length + 1)} value={draft} onChange={setDraft} maxLength={900} error={error}
            hint={<Counter value={draft.length} max={LIMITS.lyricMaxChars} label="characters" />} autoFocus />
          {error && <button type="button" className="bmcq-link is-inline" onClick={onCancel}>Cancel changes</button>}
        </>
      ) : (
        <pre id="bmcq-review-lyrics-text" className="bmcq-lyrics is-compact" aria-label="Lyrics"><LyricBlocks text={brief.song.lyrics} /></pre>
      )}
      {stale && <p className="bmcq-hint">{stale === "message" ? "Your inside message changed since these lyrics were written." : "Your story changed since these lyrics were written."} Edit them if they no longer fit.</p>}
    </div>
  );
}
