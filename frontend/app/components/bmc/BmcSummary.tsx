"use client";

// "Your card so far": the live summary beside the questions (a collapsible
// panel on tablets, a bottom sheet on phones), plus the six-stage progress
// rail. Every answer has a Change button that jumps back to its question.

import * as React from "react";
import type { Brief, Stage } from "./brief";
import { STAGES, describedSubject, hasPhoto, printedMessage } from "./brief";
import { genreById } from "./catalog";
import { imageSummary } from "./compile";
import { QUESTION_BANK } from "./questionBank";
import { FlowDialog } from "../flow/FlowDialog";
import { Icon, useIsPhone } from "./ui";

type Row = { label: string; value: string; questionId: string };

function rowsFor(brief: Brief): { stage: Stage; rows: Row[] }[] {
  const basics: Row[] = [];
  if (brief.shared.occasion) basics.push({ label: "Occasion", value: brief.shared.occasion, questionId: "B1_occasion" });
  const forWho = [brief.shared.recipientName, brief.shared.relationship ? `(${brief.shared.relationship})` : ""].filter(Boolean).join(" ");
  if (forWho) basics.push({ label: "For", value: forWho, questionId: "B2_people" });
  if (brief.shared.senderName) basics.push({ label: "From", value: brief.shared.senderName, questionId: "B2_people" });
  if (brief.shared.userFacts.length) basics.push({ label: "Your story", value: brief.shared.userFacts[0].text, questionId: "B0_story" });

  const photo: Row[] = [];
  if (brief.control.photoSkipped) photo.push({ label: "Photo", value: describedSubject(brief) ? `Described: ${describedSubject(brief)}` : "No photo", questionId: "P1_photo" });
  else if (brief.image.references.length) photo.push({ label: "Photos", value: `${brief.image.references.length} added`, questionId: "P1_photo" });

  const image = brief.image.mode ? imageSummary(brief) : [];

  const message: Row[] = [];
  if (brief.control.answered.includes("M1_inside")) {
    const text = printedMessage(brief);
    message.push({
      label: "Inside",
      value: brief.message.mode === "blank" ? "Left blank" : text ? `${text.length > 90 ? `${text.slice(0, 90)}…` : text} (${brief.message.printedChoice === "ai" && brief.message.aiVersion ? "AI version" : "your message"})` : "Not written yet",
      questionId: "M1_inside",
    });
  }

  const song: Row[] = [];
  if (brief.song.mode) {
    const preset = genreById(brief.song.genrePresetId);
    song.push({ label: "Song", value: brief.song.mode === "none" ? "No song" : `${brief.song.mode === "vocal" ? "Sung" : "Instrumental"}${preset ? ` · ${preset.label}` : ""}`, questionId: brief.song.genrePresetId ? "S2_genre" : "S1_song" });
    if (brief.song.mode === "vocal" && brief.song.lyrics) {
      song.push({ label: "Lyrics", value: brief.song.approvedLyricsVersion === brief.song.lyricsVersion ? "Approved" : "Waiting for your approval", questionId: "S4_lyrics" });
    }
  }

  return [
    { stage: "Photo", rows: photo },
    { stage: "Basics", rows: basics },
    { stage: "Image", rows: image },
    { stage: "Message", rows: message },
    { stage: "Song", rows: song },
  ];
}

/**
 * The summary's contents: a small card preview, then answers by stage, each with
 * Change. With `current` (desktop), it's an accordion so it always fits beside
 * the question without scrolling (owner QA, 2026-11-07): the current stage is
 * open, the others fold to one line, and any stage opens on click.
 */
function SummaryBody({ brief, frontUrl, onEdit, current, stages = STAGES, labels = {} }: { brief: Brief; frontUrl?: string | null; onEdit: (questionId: string) => void; current?: Stage; stages?: Stage[]; labels?: Partial<Record<Stage, string>> }) {
  // `stages`: Community cards leave out Song (bmc/community.ts COMMUNITY_STAGES); `labels` renames Photo to "Front".
  const label = (stage: Stage) => labels[stage] || stage;
  const groups = rowsFor(brief).filter((group) => group.rows.length && stages.includes(group.stage));
  const [picked, setPicked] = React.useState<Stage | null>(null);
  React.useEffect(() => { setPicked(null); }, [current]);
  const accordion = Boolean(current);
  // The current stage opens; before it has answers, everything stays folded so the panel stays short.
  const openStage = picked || (groups.some((group) => group.stage === current) ? current : null);
  const primary = brief.image.references.find((ref) => ref.id === brief.image.primaryReferenceId) || brief.image.references[0];
  const preview = frontUrl || (hasPhoto(brief) ? primary?.thumbnail : null);
  const landscape = brief.image.orientation === "landscape";
  return (
    <>
      <div className={`bmcq-mini-card${landscape ? " is-landscape" : ""}`} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- a photo preview or generated front from storage, not a static asset */}
        {preview ? <img src={preview} alt="" /> : (
          <span className="bmcq-mini-card-empty">{brief.shared.occasion || "Your card"}</span>
        )}
        {brief.image.caption.choice !== "none" && brief.image.caption.text && <span className="bmcq-mini-caption">{brief.image.caption.text}</span>}
      </div>
      {groups.length === 0 && <p className="bmcq-hint">Your answers will gather here as you go.</p>}
      {groups.map((group) => {
        const open = !accordion || group.stage === openStage;
        const bodyId = `bmcq-summary-${group.stage.toLowerCase()}`;
        return (
        <section key={group.stage} className={`bmcq-summary-group${open ? " is-open" : " is-folded"}${group.rows.length > 5 ? " is-dense" : ""}`} data-stage={group.stage.toLowerCase()} aria-label={label(group.stage)}>
          {accordion ? (
            <h3 className="bmcq-summary-stage">
              <button type="button" className="bmcq-summary-fold" aria-expanded={open} aria-controls={bodyId} onClick={() => setPicked(group.stage)}>
                <span className="bmcq-summary-fold-name">{label(group.stage)}</span>
                {!open && <span className="bmcq-summary-fold-text">{group.rows.map((row) => row.value).join(" · ")}</span>}
                {!open && <Icon name="plus" size={12} />}
              </button>
            </h3>
          ) : <h3 className="bmcq-summary-stage">{label(group.stage)}</h3>}
          {open && <dl id={bodyId}>
            {group.rows.map((row) => (
              <div key={`${row.label}-${row.questionId}`} className="bmcq-summary-row">
                <dt>{row.label}</dt>
                <dd title={row.value}>{row.value}</dd>
                <button type="button" className="bmcq-link is-inline" onClick={() => onEdit(row.questionId)} aria-label={`Change ${row.label.toLowerCase()}`}>
                  Change
                </button>
              </div>
            ))}
          </dl>}
        </section>
        );
      })}
    </>
  );
}

/**
 * Desktop: a sticky panel beside the questions. Tablet: a collapsible panel.
 * Phone: a button that opens the summary as a dialog sheet from the bottom
 * (focus kept inside, Escape closes, the page behind is inert).
 */
export function BmcSummary({ brief, onEdit, frontUrl, current, stages, labels }: { brief: Brief; onEdit: (questionId: string) => void; frontUrl?: string | null; current?: Stage; stages?: Stage[]; labels?: Partial<Record<Stage, string>> }) {
  const [open, setOpen] = React.useState(false);
  const phone = useIsPhone();
  const edit = (questionId: string) => { setOpen(false); onEdit(questionId); };

  if (phone) {
    return (
      <>
        <button type="button" className="bmcq-summary-launch" aria-haspopup="dialog" onClick={() => setOpen(true)}>
          <span>Your card <span className="l-script">so far</span></span>
          <Icon name="arrow" size={16} />
        </button>
        {open && (
          <FlowDialog onClose={() => setOpen(false)} labelledBy="bmcq-sheet-title" describedBy="bmcq-sheet-desc" tone="terracotta" className="bmcq-dialog bmcq-sheet" screenLabel="Sheet · Your card so far">
            <h2 id="bmcq-sheet-title" className="fd-title">Your card <span className="l-script">so far</span></h2>
            <p id="bmcq-sheet-desc" className="l-sr-only">Your answers so far, grouped by stage. Choose Change to edit one.</p>
            <div className="bmcq-sheet-body"><SummaryBody brief={brief} frontUrl={frontUrl} onEdit={edit} current={current} stages={stages} labels={labels} /></div>
          </FlowDialog>
        )}
      </>
    );
  }

  return (
    <aside className={`bmcq-summary${open ? " is-open" : ""}`} aria-labelledby="bmcq-summary-title">
      <h2 className="bmcq-summary-heading">
        <button type="button" className="bmcq-summary-toggle" aria-expanded={open} aria-controls="bmcq-summary-body" onClick={() => setOpen(!open)}>
          <span id="bmcq-summary-title">Your card <span className="l-script">so far</span></span>
          <Icon name={open ? "close" : "plus"} size={16} />
        </button>
      </h2>
      <div id="bmcq-summary-body" className="bmcq-summary-body">
        <SummaryBody brief={brief} frontUrl={frontUrl} onEdit={edit} current={current} stages={stages} labels={labels} />
      </div>
    </aside>
  );
}

export function StageRail({ brief, current, onJump, stages = STAGES, labels = {} }: { brief: Brief; current: Stage; onJump: (questionId: string) => void; stages?: Stage[]; labels?: Partial<Record<Stage, string>> }) {
  const currentIndex = stages.indexOf(current);
  return (
    <nav className="bmcq-rail" aria-label="Build My Card progress">
      <ol>
        {stages.map((stage, index) => {
          const questions = QUESTION_BANK.filter((question) => question.stage === stage && question.applies(brief));
          const done = index < currentIndex;
          const first = questions.find((question) => brief.control.answered.includes(question.id)) || questions[0];
          const state = stage === current ? "current" : done ? "done" : "upcoming";
          return (
            <li key={stage} className={`bmcq-rail-step is-${state}`} data-stage={stage.toLowerCase()}>
              {state === "done" && first ? (
                <button type="button" onClick={() => onJump(first.id)}>
                  <span className="bmcq-rail-dot" aria-hidden="true"><Icon name="check" size={12} /></span>
                  <span className="bmcq-rail-label">{labels[stage] || stage}</span>
                  <span className="l-sr-only">, done. Change your answers</span>
                </button>
              ) : (
                <span aria-current={state === "current" ? "step" : undefined}>
                  <span className="bmcq-rail-dot" aria-hidden="true">{index + 1}</span>
                  <span className="bmcq-rail-label">{labels[stage] || stage}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
