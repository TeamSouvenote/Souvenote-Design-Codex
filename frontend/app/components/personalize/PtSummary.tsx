"use client";

// "Your card so far" for a Personalize card (a collapsible panel on tablets, a
// bottom sheet on phones) and its progress rail. Same look as Build My Card's
// (bmcq-* styles); the rows come from the card file.

import * as React from "react";
import { hasSong, printedMessage } from "../bmc/brief";
import { genreById } from "../bmc/catalog";
import { FlowDialog } from "../flow/FlowDialog";
import { CardPlaceholder, Icon, useIsPhone } from "../bmc/ui";
import type { PtBrief, PtStage } from "./ptBrief";
import { stagesFor } from "./ptEngine";
import type { PtTemplate } from "./types";

type Row = { label: string; value: string; questionId: string };
type Group = { stage: PtStage; rows: Row[] };

function rowsFor(template: PtTemplate, brief: PtBrief): Row[] {
  const rows: Row[] = [];
  const relationship = brief.shared.relationship ? ` (${brief.shared.relationship})` : "";
  if (brief.shared.recipientName) rows.push({ label: "For", value: `${brief.shared.recipientName}${relationship}`, questionId: "PT_names" });
  else if (brief.shared.relationship) rows.push({ label: "For", value: `Your ${brief.shared.relationship}`, questionId: "PT_names" });
  if (brief.shared.senderName) rows.push({ label: "From", value: brief.shared.senderName, questionId: "PT_names" });
  rows.push(...template.summary(brief));
  if (brief.image.caption.choice) {
    rows.push({ label: "Front words", value: brief.image.caption.choice === "none" ? "None" : brief.image.caption.text, questionId: template.questions.find((q) => q.kind === "caption")?.id || "PT_message" });
  }
  if (brief.control.answered.includes("PT_message")) {
    const text = printedMessage(brief);
    rows.push({ label: "Inside", value: brief.message.mode === "blank" ? "Left blank" : text ? (text.length > 90 ? `${text.slice(0, 90)}…` : text) : "Not written yet", questionId: "PT_message" });
  }
  if (brief.song.mode) rows.push({ label: "Song", value: !hasSong(brief) ? "No song" : brief.song.mode === "vocal" ? "Sung song" : "Instrumental", questionId: "PT_song" });
  const genre = hasSong(brief) ? genreById(brief.song.genrePresetId) : null;
  if (genre && brief.control.answered.includes("PT_genre")) rows.push({ label: "Sound", value: genre.label, questionId: "PT_genre" });
  return rows;
}

/** Answers grouped by the stage they were asked in, in the card's stage order. */
function groupsFor(template: PtTemplate, brief: PtBrief): Group[] {
  const stageOf = (questionId: string): PtStage => {
    if (questionId === "PT_names") return "Details";
    return template.questions.find((q) => q.id === questionId)?.stage || "Details";
  };
  const groups = new Map<PtStage, Row[]>();
  for (const row of rowsFor(template, brief)) {
    const stage = stageOf(row.questionId);
    groups.set(stage, [...(groups.get(stage) || []), row]);
  }
  return stagesFor(template, brief).filter((stage) => groups.has(stage)).map((stage) => ({ stage, rows: groups.get(stage) || [] }));
}

/**
 * Same accordion as Build My Card's (owner, 2026-11-08): the current stage is
 * open with its answers; the others fold to one line in their stage colour.
 */
function SummaryBody({ template, brief, onEdit, current }: { template: PtTemplate; brief: PtBrief; onEdit: (id: string) => void; current?: PtStage }) {
  const groups = groupsFor(template, brief);
  const [picked, setPicked] = React.useState<PtStage | null>(null);
  React.useEffect(() => { setPicked(null); }, [current]);
  const openStage = picked || (groups.some((group) => group.stage === current) ? current : null);
  return (
    <>
      <div className="pt-summary-card">
        <CardPlaceholder shape={brief.image.orientation === "landscape" ? "landscape" : "portrait"} />
        <p className="pt-summary-name">{template.id === "saved-template" ? brief.personalize.templateName : template.name}</p>
      </div>
      {groups.length === 0 && <p className="bmcq-hint">Your answers appear here as you go.</p>}
      {groups.map((group) => {
        const open = group.stage === openStage;
        const bodyId = `pt-summary-${group.stage.toLowerCase()}`;
        return (
          <section key={group.stage} className={`bmcq-summary-group${open ? " is-open" : " is-folded"}${group.rows.length > 5 ? " is-dense" : ""}`}
            data-stage={group.stage.toLowerCase()} aria-label={group.stage}>
            <h3 className="bmcq-summary-stage">
              <button type="button" className="bmcq-summary-fold" aria-expanded={open} aria-controls={bodyId} onClick={() => setPicked(group.stage)}>
                <span className="bmcq-summary-fold-name">{group.stage}</span>
                {!open && <span className="bmcq-summary-fold-text">{group.rows.map((row) => row.value).join(" · ")}</span>}
                {!open && <Icon name="plus" size={12} />}
              </button>
            </h3>
            {open && (
              <dl id={bodyId}>
                {group.rows.map((row) => (
                  <div key={`${row.label}-${row.questionId}`} className="bmcq-summary-row">
                    <dt>{row.label}</dt>
                    <dd title={row.value}>{row.value}</dd>
                    <button type="button" className="bmcq-link is-inline" onClick={() => onEdit(row.questionId)} aria-label={`Change ${row.label.toLowerCase()}`}>Change</button>
                  </div>
                ))}
              </dl>
            )}
          </section>
        );
      })}
    </>
  );
}

export function PtSummary({ template, brief, onEdit, current }: { template: PtTemplate; brief: PtBrief; onEdit: (id: string) => void; current?: PtStage }) {
  const [open, setOpen] = React.useState(false);
  const phone = useIsPhone();
  const edit = (id: string) => { setOpen(false); onEdit(id); };
  if (phone) {
    return (
      <>
        <button type="button" className="bmcq-summary-launch" aria-haspopup="dialog" onClick={() => setOpen(true)}>
          <span>Your card <span className="l-script">so far</span></span>
          <Icon name="arrow" size={16} />
        </button>
        {open && (
          <FlowDialog onClose={() => setOpen(false)} labelledBy="pt-sheet-title" describedBy="pt-sheet-desc" tone="terracotta" className="bmcq-dialog bmcq-sheet" screenLabel="Sheet · Your card so far">
            <h2 id="pt-sheet-title" className="fd-title">Your card <span className="l-script">so far</span></h2>
            <p id="pt-sheet-desc" className="l-sr-only">Your answers so far, grouped by stage. Choose Change to edit one.</p>
            <div className="bmcq-sheet-body"><SummaryBody template={template} brief={brief} onEdit={edit} current={current} /></div>
          </FlowDialog>
        )}
      </>
    );
  }
  return (
    <aside className={`bmcq-summary${open ? " is-open" : ""}`} aria-labelledby="pt-summary-title">
      <h2 className="bmcq-summary-heading">
        <button type="button" className="bmcq-summary-toggle" aria-expanded={open} aria-controls="pt-summary-body" onClick={() => setOpen(!open)}>
          <span id="pt-summary-title">Your card <span className="l-script">so far</span></span>
          <Icon name={open ? "close" : "plus"} size={16} />
        </button>
      </h2>
      <div id="pt-summary-body" className="bmcq-summary-body"><SummaryBody template={template} brief={brief} onEdit={edit} current={current} /></div>
    </aside>
  );
}

export function PtStageRail({ template, brief, current, onJump }: { template: PtTemplate; brief: PtBrief; current: PtStage; onJump: (id: string) => void }) {
  const stages = stagesFor(template, brief);
  const currentIndex = Math.max(0, stages.indexOf(current));
  return (
    <nav className="bmcq-rail" aria-label={`${template.name} progress`}>
      <ol>
        {stages.map((stage, index) => {
          const first = template.questions.find((q) => q.stage === stage && q.applies(brief) && brief.control.answered.includes(q.id));
          const state = index === currentIndex ? "current" : index < currentIndex ? "done" : "upcoming";
          return (
            <li key={stage} className={`bmcq-rail-step is-${state}`} data-stage={stage.toLowerCase()}>
              {state === "done" && first ? (
                <button type="button" onClick={() => onJump(first.id)}>
                  <span className="bmcq-rail-dot" aria-hidden="true"><Icon name="check" size={12} /></span>
                  <span className="bmcq-rail-label">{stage}</span>
                  <span className="l-sr-only">, done. Change your answers</span>
                </button>
              ) : (
                <span aria-current={state === "current" ? "step" : undefined}>
                  <span className="bmcq-rail-dot" aria-hidden="true">{index + 1}</span>
                  <span className="bmcq-rail-label">{stage}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
