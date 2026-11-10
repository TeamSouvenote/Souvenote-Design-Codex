// The application side of a Personalize card's adaptive interview. The card
// file says which questions exist, when each applies and when it's resolved;
// Haiku 5.5 (the mock rule engine on this branch) may only pull supported
// facts out of a free-text answer and tailor the next question's wording.
// This file validates every proposal and decides what to ask next.

import type { Answer, Conflict } from "../bmc/brief";
import type { InterviewUpdate } from "../bmc/engine";
import type { PtBrief, PtStage } from "./ptBrief";
import { PT_STAGES } from "./ptBrief";
import type { PtQuestion, PtTemplate } from "./types";

// ---- Contract (hand-off: PERSONALIZE-BEDROCK-HANDOFF.md) ---------------------

export type PtInterviewProposal = {
  updates: InterviewUpdate[];
  conflicts: { field: string; explanation: string; source_answer_ids: string[] }[];
  next: { question_id: string; text: string } | null;
};

export type PtInterviewTurnInput = {
  task: "extract_supported_updates_and_tailor_next_question";
  template: { id: string; version: string; name: string };
  current_stage: PtStage;
  brief_snapshot: {
    shared: PtBrief["shared"];
    fields: Record<string, string>;
    photo_mode: PtBrief["personalize"]["photoMode"];
    song_mode: PtBrief["song"]["mode"];
  };
  latest_answer: { id: string; question_id: string; text: string };
  allowed_fields: { path: string; type: "string" | "fact" }[];
  /** Open questions in the app's order; the next one is the first. Wording only may change. */
  open_questions: { id: string; default_text: string }[];
  skipped_optional_questions: string[];
};

/** JSON Schema for Converse outputConfig.textFormat (every object closed, every key required). */
export const PT_INTERVIEW_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["updates", "conflicts", "next"],
  properties: {
    updates: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        required: ["field", "value_json", "source_answer_id", "evidence_quote"],
        properties: { field: { type: "string" }, value_json: { type: "string" }, source_answer_id: { type: "string" }, evidence_quote: { type: "string" } },
      },
    },
    conflicts: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        required: ["field", "explanation", "source_answer_ids"],
        properties: { field: { type: "string" }, explanation: { type: "string" }, source_answer_ids: { type: "array", items: { type: "string" } } },
      },
    },
    next: {
      anyOf: [
        { type: "null" },
        { type: "object", additionalProperties: false, required: ["question_id", "text"], properties: { question_id: { type: "string" }, text: { type: "string" } } },
      ],
    },
  },
} as const;

// ---- Questions ---------------------------------------------------------------------

export function resolve<T>(value: T | ((brief: PtBrief) => T), brief: PtBrief): T {
  return typeof value === "function" ? (value as (brief: PtBrief) => T)(brief) : value;
}

export function isOpen(question: PtQuestion, brief: PtBrief) {
  if (!question.applies(brief) || question.filled(brief)) return false;
  return !(question.optional && brief.control.skippedOptionalFields.includes(question.id));
}

export function nextOpen(template: PtTemplate, brief: PtBrief) {
  return template.questions.find((question) => isOpen(question, brief)) || null;
}

export function questionIn(template: PtTemplate, id: string | null | undefined) {
  return template.questions.find((question) => question.id === id) || null;
}

/** Stages this card actually uses, in rail order. */
export function stagesFor(template: PtTemplate, brief: PtBrief): PtStage[] {
  const used = new Set(template.questions.filter((question) => question.applies(brief)).map((question) => question.stage));
  return PT_STAGES.filter((stage) => used.has(stage));
}

// ---- Field allow-list -----------------------------------------------------------------

type FieldRule = { type: "string" | "fact"; max: number; get: (b: PtBrief) => string | null; set: (b: PtBrief, value: string, answerId: string) => void };

const SHARED_RULES: Record<string, FieldRule> = {
  "shared.recipientName": { type: "string", max: 60, get: (b) => b.shared.recipientName, set: (b, v) => { b.shared.recipientName = v; } },
  "shared.senderName": { type: "string", max: 60, get: (b) => b.shared.senderName, set: (b, v) => { b.shared.senderName = v; } },
  "shared.relationship": { type: "string", max: 60, get: (b) => b.shared.relationship, set: (b, v) => { b.shared.relationship = v; } },
  "shared.intendedFeeling": { type: "string", max: 120, get: (b) => b.shared.intendedFeeling, set: (b, v) => { b.shared.intendedFeeling = v; } },
  "shared.motif": { type: "string", max: 120, get: (b) => b.shared.motif, set: (b, v) => { b.shared.motif = v; } },
  "shared.userFacts": {
    type: "fact", max: 600, get: () => null,
    set: (b, v, answerId) => { if (!b.shared.userFacts.some((f) => f.text === v)) b.shared.userFacts.push({ text: v, sourceAnswerId: answerId }); },
  },
};

function ruleFor(path: string): FieldRule | null {
  if (SHARED_RULES[path]) return SHARED_RULES[path];
  const key = path.match(/^personalize\.fields\.([a-zA-Z][\w]*)$/)?.[1];
  if (!key) return null;
  return { type: "string", max: 400, get: (b) => b.personalize.fields[key] || null, set: (b, v) => { b.personalize.fields[key] = v; } };
}

export function allowedFieldsFor(question: PtQuestion) {
  return (question.extract || []).filter((path) => ruleFor(path)).map((path) => ({ path, type: ruleFor(path)?.type || "string" }));
}

// ---- Turns ------------------------------------------------------------------------------

export function buildPtTurnInput(template: PtTemplate, brief: PtBrief, question: PtQuestion, answer: Answer): PtInterviewTurnInput {
  return {
    task: "extract_supported_updates_and_tailor_next_question",
    template: { id: template.id, version: template.version, name: template.name },
    current_stage: question.stage,
    brief_snapshot: { shared: brief.shared, fields: brief.personalize.fields, photo_mode: brief.personalize.photoMode, song_mode: brief.song.mode },
    latest_answer: { id: answer.id, question_id: answer.questionId, text: answer.text },
    allowed_fields: allowedFieldsFor(question),
    open_questions: template.questions.filter((q) => isOpen(q, brief)).map((q) => ({ id: q.id, default_text: resolve(q.prompt, brief) })),
    skipped_optional_questions: brief.control.skippedOptionalFields,
  };
}

/**
 * Applies only updates on this question's allow-list that quote the answer
 * exactly and don't overwrite a value the customer set. A proposal built on an
 * older brief version is dropped.
 */
export function applyPtProposal(brief: PtBrief, proposal: PtInterviewProposal, answer: Answer, question: PtQuestion, sourceBriefVersion: number): PtBrief {
  if (sourceBriefVersion !== brief.control.briefVersion) return brief;
  const next = JSON.parse(JSON.stringify(brief)) as PtBrief;
  const allowed = new Set(allowedFieldsFor(question).map((field) => field.path));
  let accepted = 0;
  let sharedChanged = false;
  for (const update of proposal.updates) {
    const rule = ruleFor(update.field);
    if (!rule || !allowed.has(update.field) || update.source_answer_id !== answer.id) continue;
    if (!update.evidence_quote || !answer.text.includes(update.evidence_quote)) continue;
    let value: unknown;
    try { value = JSON.parse(update.value_json); } catch { continue; }
    if (typeof value !== "string" || !value.trim() || value.length > rule.max) continue;
    if (rule.type === "string" && rule.get(next)) continue;
    rule.set(next, value.trim(), answer.id);
    accepted += 1;
    if (update.field.startsWith("shared.")) sharedChanged = true;
  }
  const conflicts: Conflict[] = proposal.conflicts
    .filter((conflict) => conflict.field && conflict.explanation)
    .map((conflict) => ({ field: conflict.field, explanation: conflict.explanation.slice(0, 280), sourceAnswerIds: conflict.source_answer_ids }));
  if (conflicts.length) next.control.conflicts = [...next.control.conflicts.filter((c) => !conflicts.some((n) => n.field === c.field)), ...conflicts];
  if (accepted || conflicts.length) next.control.briefVersion += 1;
  if (sharedChanged) next.control.sharedVersion += 1;
  return next;
}

/** Tailored wording is used only when it targets the question the app would ask anyway. */
export function tailoredNext(template: PtTemplate, brief: PtBrief, proposal: PtInterviewProposal | null) {
  const question = nextOpen(template, brief);
  if (!question || !proposal?.next) return null;
  const text = proposal.next.text.trim();
  return proposal.next.question_id === question.id && text ? { id: question.id, text: text.slice(0, 240) } : null;
}
