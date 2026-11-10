// The application side of the adaptive interview: builds the canonical
// per-turn input, validates the interviewer's structured proposal, applies only
// supported updates, and decides the next question. Haiku (or the mock rule
// engine) proposes; this file decides.

import type { Answer, Brief, Conflict, Stage } from "./brief";
import { STAGES } from "./brief";
import { CATALOG_VERSION } from "./catalog";
import { lookDetail } from "./lookDetails";
import type { Question } from "./questionBank";
import { QUESTION_BANK, isOpen, nextOpenQuestion } from "./questionBank";

// ---- Canonical contract (Image and Message Prompts PDF) ---------------------

export type InterviewUpdate = { field: string; value_json: string; source_answer_id: string; evidence_quote: string };
export type InterviewConflict = { field: string; explanation: string; source_answer_ids: string[] };
export type InterviewProposal = {
  updates: InterviewUpdate[];
  conflicts: InterviewConflict[];
  question: { text: string; target_step: Stage; control_ids: string[] };
  suggested_action: "ask" | "advance" | "review";
};

export type InterviewTurnInput = {
  current_step: Stage;
  brief_snapshot: Brief;
  latest_answer: { id: string; question_id: string; text: string; controls: Record<string, unknown> };
  missing_fields: string[];
  conflicts: Conflict[];
  allowed_fields: { path: string; type: "string" | "fact" }[];
  allowed_controls: { id: string }[];
  skipped_optional_fields: string[];
  task: "extract_supported_updates_and_propose_next_question";
  catalog_version: string;
};

/** JSON Schema for Converse outputConfig.textFormat (every object closed, every key required). */
export const INTERVIEW_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["updates", "conflicts", "question", "suggested_action"],
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
    question: {
      type: "object", additionalProperties: false,
      required: ["text", "target_step", "control_ids"],
      properties: { text: { type: "string" }, target_step: { type: "string", enum: STAGES }, control_ids: { type: "array", items: { type: "string" } } },
    },
    suggested_action: { type: "string", enum: ["ask", "advance", "review"] },
  },
} as const;

/** Context for the caption, inside-message and lyric writers: explicit facts only. */
export type TextContext = {
  occasion: string | null;
  relationship: string | null;
  recipientName: string | null;
  senderName: string | null;
  facts: string[];
  motif: string | null;
  intendedFeeling: string;
  conceptMeaning: string | null;
  approvedCaption: string | null;
  insideMessage: string | null;
  sensitive: boolean;
  /** Fills {{language}} in the writer templates. */
  language: string;
  /** The customer's sign-off choice for the AI inside message. */
  signoff: SignoffStyle;
  /** Fills {{signoff_policy}} in the inside-message template. */
  signoffPolicy: string;
  /**
   * Personalize only (2026-11-08): each card detail labelled by how true it is
   * (fact, public-event, framing, staging), the words printed on the front, and
   * the card's short writing guidance. All are data, like the rest of the context.
   */
  labelledDetails?: { kind: "fact" | "public-event" | "framing" | "staging"; text: string }[];
  frontText?: string[];
  cardGuidance?: string | null;
};

export type SignoffStyle = "auto" | "love" | "from" | "none";

// ---- Field allow-list --------------------------------------------------------

type FieldRule = { type: "string" | "fact"; max: number; get: (b: Brief) => unknown; set: (b: Brief, value: string, answerId: string) => void };

const FIELD_RULES: Record<string, FieldRule> = {
  "shared.occasion": { type: "string", max: 60, get: (b) => b.shared.occasion, set: (b, v) => { b.shared.occasion = v; } },
  "shared.recipientName": { type: "string", max: 60, get: (b) => b.shared.recipientName, set: (b, v) => { b.shared.recipientName = v; } },
  "shared.relationship": { type: "string", max: 60, get: (b) => b.shared.relationship, set: (b, v) => { b.shared.relationship = v; } },
  "shared.senderName": { type: "string", max: 60, get: (b) => b.shared.senderName, set: (b, v) => { b.shared.senderName = v; } },
  "shared.intendedFeeling": { type: "string", max: 120, get: (b) => b.shared.intendedFeeling, set: (b, v) => { b.shared.intendedFeeling = v; } },
  "shared.motif": { type: "string", max: 120, get: (b) => b.shared.motif, set: (b, v) => { b.shared.motif = v; } },
  "shared.userFacts": {
    type: "fact", max: 600, get: () => null,
    set: (b, v, answerId) => { if (!b.shared.userFacts.some((f) => f.text === v)) b.shared.userFacts.push({ text: v, sourceAnswerId: answerId }); },
  },
  "image.vision": { type: "string", max: 1000, get: (b) => b.image.vision, set: (b, v) => { b.image.vision = v; } },
  "image.sceneDetail": { type: "string", max: 1000, get: (b) => b.image.sceneDetail, set: (b, v) => { b.image.sceneDetail = v; } },
  "image.options": { type: "string", max: 600, get: (b) => b.image.options, set: (b, v) => { b.image.options = v; } },
  "image.keep": { type: "string", max: 400, get: (b) => b.image.keep, set: (b, v) => { b.image.keep = v; } },
  "image.refinement": { type: "string", max: 200, get: (b) => b.image.refinement, set: (b, v) => { b.image.refinement = v; } },
  "image.decorations.customText": { type: "string", max: 600, get: (b) => b.image.decorations.customText, set: (b, v) => { b.image.decorations.customText = v; } },
  "image.decorations.lettering": { type: "string", max: 40, get: (b) => b.image.decorations.lettering, set: (b, v) => { b.image.decorations.lettering = v; } },
  "song.pronunciation": { type: "string", max: 80, get: (b) => b.song.pronunciation, set: (b, v) => { b.song.pronunciation = v; } },
};

/** The interviewer may never set these: they come only from direct controls. */
const CONTROL_ONLY_FIELDS = new Set(["image.mode", "image.orientation", "image.style", "image.caption", "song.genrePresetId", "song.mode"]);

export function allowedFieldsFor(question: Question) {
  return question.fields.filter((path) => FIELD_RULES[path] && !CONTROL_ONLY_FIELDS.has(path))
    .map((path) => ({ path, type: FIELD_RULES[path].type }));
}

// ---- Building a turn ----------------------------------------------------------

/** Compact snapshot: no answer history and no photo thumbnails. */
export function snapshotForModel(brief: Brief): Brief {
  return {
    ...brief,
    image: { ...brief.image, references: brief.image.references.map((ref) => ({ ...ref, thumbnail: undefined })) },
    control: { ...brief.control, answers: [] },
  };
}

export function missingFields(brief: Brief): string[] {
  return QUESTION_BANK.filter((question) => !question.optional && isOpen(question, brief)).map((question) => question.id);
}

export function buildTurnInput(brief: Brief, question: Question, answer: Answer): InterviewTurnInput {
  return {
    current_step: question.stage,
    brief_snapshot: snapshotForModel(brief),
    latest_answer: { id: answer.id, question_id: answer.questionId, text: answer.text, controls: answer.controls },
    missing_fields: missingFields(brief),
    conflicts: brief.control.conflicts,
    allowed_fields: allowedFieldsFor(question),
    allowed_controls: QUESTION_BANK.filter((q) => isOpen(q, brief)).flatMap((q) => q.controlIds).map((id) => ({ id })),
    skipped_optional_fields: brief.control.skippedOptionalFields,
    task: "extract_supported_updates_and_propose_next_question",
    catalog_version: CATALOG_VERSION,
  };
}

// ---- Applying a proposal ------------------------------------------------------

export type ApplyResult = { brief: Brief; accepted: InterviewUpdate[]; rejected: { update: InterviewUpdate; reason: string }[] };

function cloneBrief<T extends Brief>(brief: T): T {
  return JSON.parse(JSON.stringify(brief)) as T;
}

/**
 * Applies only updates that are on this question's allow-list, decode to the
 * right type, quote the answer exactly, and don't overwrite a value the
 * customer already set. A proposal built on an older brief version is dropped.
 */
export function applyProposal(brief: Brief, proposal: InterviewProposal, answer: Answer, question: Question, sourceBriefVersion: number): ApplyResult {
  const next = cloneBrief(brief);
  const accepted: InterviewUpdate[] = [];
  const rejected: ApplyResult["rejected"] = [];
  if (sourceBriefVersion !== brief.control.briefVersion) {
    return { brief, accepted, rejected: proposal.updates.map((update) => ({ update, reason: "stale brief version" })) };
  }
  const allowed = new Set(allowedFieldsFor(question).map((field) => field.path));
  let sharedChanged = false;

  for (const update of proposal.updates) {
    const rule = FIELD_RULES[update.field];
    if (!rule || !allowed.has(update.field)) { rejected.push({ update, reason: "field not allowed here" }); continue; }
    if (update.source_answer_id !== answer.id) { rejected.push({ update, reason: "unknown answer" }); continue; }
    if (!update.evidence_quote || !answer.text.includes(update.evidence_quote)) { rejected.push({ update, reason: "evidence not in answer" }); continue; }
    let value: unknown;
    try { value = JSON.parse(update.value_json); } catch { rejected.push({ update, reason: "value_json does not decode" }); continue; }
    if (typeof value !== "string" || !value.trim() || value.length > rule.max) { rejected.push({ update, reason: "wrong type or length" }); continue; }
    if (rule.type === "string" && rule.get(next)) { rejected.push({ update, reason: "already set by the customer" }); continue; }
    rule.set(next, value.trim(), answer.id);
    if (update.field.startsWith("shared.")) sharedChanged = true;
    accepted.push(update);
  }

  for (const conflict of proposal.conflicts) {
    if (!conflict.field || !conflict.explanation) continue;
    next.control.conflicts = next.control.conflicts.filter((existing) => existing.field !== conflict.field);
    next.control.conflicts.push({
      field: conflict.field,
      explanation: conflict.explanation.slice(0, 280),
      sourceAnswerIds: conflict.source_answer_ids,
      offer: conflict.field === "image.mode" ? "switch_to_transform" : undefined,
    });
  }

  if (accepted.length || proposal.conflicts.length) next.control.briefVersion += 1;
  if (sharedChanged) next.control.sharedVersion += 1;
  return { brief: next, accepted, rejected };
}

// ---- Choosing what to ask next ------------------------------------------------

export type NextStep = { question: Question; text: string } | { question: null; text: "" };

/**
 * The app's next question. A proposal's tailored wording is used only when it
 * targets the question the app would ask anyway (same stage and a matching
 * control); otherwise the bank's default wording is used.
 */
export function decideNext(brief: Brief, proposal: InterviewProposal | null): NextStep {
  const question = nextOpenQuestion(brief);
  if (!question) return { question: null, text: "" };
  const proposed = proposal?.question;
  const matches = proposed && proposed.text.trim() && proposed.target_step === question.stage
    && proposed.control_ids.some((id) => question.controlIds.includes(id));
  return { question, text: matches ? proposed.text.trim().slice(0, 240) : tailorPrompt(question.id, brief) || question.prompt };
}

// ---- Tailored wording -----------------------------------------------------------

function possessive(name: string) {
  return name.endsWith("s") ? `${name}’` : `${name}’s`;
}

/** Named days keep their capitals (Father’s Day); everyday occasions read in lower case. */
function occasionPhrase(occasion: string | null) {
  if (!occasion) return null;
  return /(day|eve|year|hanukkah|diwali|eid|easter|christmas|halloween|thanksgiving|passover|kwanzaa)/i.test(occasion) ? occasion : occasion.toLowerCase();
}

/** App-owned wording that reflects earlier answers (names, occasion). No model call. */
export function tailorPrompt(questionId: string, brief: Brief): string | null {
  const name = brief.shared.recipientName;
  const occasion = occasionPhrase(brief.shared.occasion);
  const card = name ? `${possessive(name)}${occasion ? ` ${occasion}` : ""} card` : occasion ? `this ${occasion} card` : "this card";
  const photo = brief.control.photoSkipped === false;
  switch (questionId) {
    case "B2_people":
      if (name && !brief.shared.senderName) return `Who's ${card} from${brief.shared.relationship ? "" : `, and who is ${name} to you`}?`;
      return null;
    case "B6_orientation": return `Should ${card} stand tall or lie wide?`;
    case "I1_mode": return photo ? `How should we use your photo for ${card}?` : null;
    case "I2_style": return `Which visual style fits ${card}?`;
    case "T1_scene":
      if (photo) return `Where should we take ${name || "everyone in your photo"}? Describe the new scene for the front.`;
      if (brief.image.subjectDescription) return `Where are they, and what's happening on the front of ${card}?`;
      return `What should we create for ${card}? Who or what is in it, and where are they?`;
    case "T2_detail": return "What's happening in that scene, and where does it take place?";
    case "P4_look_hair": return lookDetail("hair")?.prompt(name) || null;
    case "P4_look_style": return lookDetail("style")?.prompt(name) || null;
    case "P4_look_signature": return lookDetail("signature")?.prompt(name) || null;
    case "E2_refine": {
      const style = brief.image.style;
      if (style === "cinematic") return "Should Cinematic feel warm and nostalgic, cool and dramatic, or leave the finish to us?";
      if (style === "vintage") return "Faded film warmth, bold retro colour, or leave the finish to us?";
      return null;
    }
    case "D2_accents": return occasion ? `Which accents suit a ${occasion} card?` : null;
    case "D3a_wearer": {
      const first = brief.image.decorations.wearables.find((w) => !w.target);
      return first ? `Who should wear the ${first.id.replace(/-/g, " ")}?` : null;
    }
    case "I3_vibes": return `How should ${card} feel? Choose up to three.`;
    case "I4_caption": return `Should the front of ${card} say something?`;
    case "M1_inside": return name ? `What would you like to tell ${name} inside?` : null;
    case "S2_genre": return name ? `Which style of music suits ${possessive(name)} song?` : null;
    default: return null;
  }
}

// ---- Recording answers ----------------------------------------------------------

let answerCounter = 0;

export function newAnswer(questionId: string, text: string, controls: Record<string, unknown> = {}): Answer {
  answerCounter += 1;
  return { id: `a${Date.now().toString(36)}${answerCounter}`, questionId, text, controls, at: new Date().toISOString() };
}

/**
 * Saves the customer's direct answer: marks the question answered, keeps the
 * answer (last 40 only), and bumps the versions. `sharedChanged` marks text
 * drafts that depend on the shared meaning as stale.
 */
export function recordAnswer<T extends Brief>(brief: T, answer: Answer, change: (draft: T) => void, sharedChanged = false): T {
  const next = cloneBrief(brief);
  change(next);
  if (!next.control.answered.includes(answer.questionId)) next.control.answered.push(answer.questionId);
  next.control.skippedOptionalFields = next.control.skippedOptionalFields.filter((id) => id !== answer.questionId);
  next.control.answers = [...next.control.answers, answer].slice(-40);
  next.control.briefVersion += 1;
  if (sharedChanged) next.control.sharedVersion += 1;
  return next;
}

export function skipQuestion<T extends Brief>(brief: T, questionId: string): T {
  const next = cloneBrief(brief);
  if (!next.control.skippedOptionalFields.includes(questionId)) next.control.skippedOptionalFields.push(questionId);
  next.control.briefVersion += 1;
  return next;
}

export function updateBrief<T extends Brief>(brief: T, change: (draft: T) => void, sharedChanged = false): T {
  const next = cloneBrief(brief);
  change(next);
  next.control.briefVersion += 1;
  if (sharedChanged) next.control.sharedVersion += 1;
  return next;
}
