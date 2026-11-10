// Questions every Personalize card uses, from the owner's method (AGENTS.md,
// 2026-11-08): names first (with where each name may be used), the photo
// choice early, then the card's own questions, the inside message and the
// song. Each card file puts these in its own order around its questions.

import { hasSong } from "../bmc/brief";
import type { PhotoMode, PtBrief } from "./ptBrief";
import { field, hasAttestedPhoto, theirs, usesPhoto } from "./ptBrief";
import type { PtQuestion, PtSuggestTask } from "./types";
import { lookDetail, missingDetails } from "../bmc/lookDetails";

const answered = (brief: PtBrief, id: string) => brief.control.answered.includes(id);

export const PHOTO_MODE_LABELS: Record<PhotoMode, string> = {
  none: "Continue without a photo",
  transform: "Use my photo",
  decorate: "Use my photo as it is",
};

export const PHOTO_MODE_DEFAULT_COPY: Record<PhotoMode, string> = {
  none: "We create original artwork for the front.",
  transform: "Reimagine your photo: new scene, pose or world, the same people.",
  decorate: "Your original photo, framed with artwork.",
};

/** How Review and the summary name the photo choice. */
export function photoSummary(mode: PhotoMode) {
  return mode === "none" ? "No photo" : mode === "decorate" ? "Your photo, kept as it is" : "Your photo, reimagined";
}

export function namesQuestion(): PtQuestion {
  return {
    id: "PT_names", stage: "Details", kind: "names", heading: ["Who it’s", "from and to"],
    prompt: "Who’s the card from, and who’s it for?",
    helper: "All optional. Names are printed with their usual spelling. The phonetic spelling only helps the singer.",
    optional: true, applies: () => true, filled: (b) => answered(b, "PT_names"),
  };
}

export function photoModeQuestion(prompt?: (brief: PtBrief) => string): PtQuestion {
  return {
    id: "PT_photo_mode", stage: "Photo", kind: "photo-mode", heading: ["Add a", "photo?"],
    prompt: prompt || ((b) => `Would you like to use a photo on ${theirs(b)}?`),
    optional: false, applies: () => true, filled: (b) => b.personalize.photoMode !== null,
  };
}

export function photoQuestion(): PtQuestion {
  return {
    id: "PT_photo", stage: "Photo", kind: "photo", heading: ["Add your", "photo"],
    prompt: "Add the photo to use. You’ll confirm you have the right to use it as soon as you choose it.",
    helper: "JPEG, PNG or WEBP, up to 4 photos. Photos are private and only used for this card.",
    // Answered on Continue, so the customer sees their photos (and can add more) after agreeing.
    optional: false, applies: usesPhoto, filled: (b) => answered(b, "PT_photo") && hasAttestedPhoto(b),
  };
}

// ---- No photo: describe how they look (owner, 2026-11-08) ---------------------------
// For cards whose no-photo front shows the person: one open question, then at
// most two follow-ups, each only for a key detail the description leaves out.
// Every one can be skipped. The details and their wording live in
// ../bmc/lookDetails.ts, shared with Build My Card.

const LOOK_FIELDS = ["look", "lookMore1", "lookMore2"];

/** Everything the customer said about their look, in order. */
export function lookDescription(brief: PtBrief) {
  return LOOK_FIELDS.map((key) => brief.personalize.fields[key]?.trim()).filter(Boolean).join(". ");
}

/** Key details the description (and earlier follow-ups) still leave out. */
function missingLookDetails(brief: PtBrief, upTo: number) {
  const said = LOOK_FIELDS.slice(0, upTo).map((key) => brief.personalize.fields[key] || "").join(" ");
  const askedBefore = LOOK_FIELDS.slice(1, upTo).map((key) => brief.personalize.fields[`${key}Topic`]).filter(Boolean);
  return missingDetails(said, askedBefore);
}

const showsDescribedPerson = (brief: PtBrief) => brief.personalize.photoMode === "none";

/**
 * Follow-up `index` (1 or 2) asks about the first key detail still missing.
 * Its topic is saved when answered (or skipped), so it never changes
 * afterwards and the next follow-up never asks the same thing.
 */
function lookFollowUp(index: 1 | 2): PtQuestion {
  const id = `PT_look_more_${index}`;
  const key = `lookMore${index}`;
  const topicKey = `${key}Topic`;
  const previous = index === 1 ? "PT_look" : "PT_look_more_1";
  const detail = (b: PtBrief) => {
    const saved = b.personalize.fields[topicKey];
    return lookDetail(saved) || missingLookDetails(b, index)[0] || null;
  };
  return {
    id, stage: "Photo", kind: "text", field: key,
    heading: (b) => detail(b)?.heading || ["A little", "more"],
    prompt: (b) => {
      const d = detail(b);
      if (!d) return "";
      return d.prompt(b.shared.recipientName);
    },
    placeholder: (b) => detail(b)?.placeholder || "",
    helper: "Optional. Skip it if you’d rather leave it to us.",
    optional: true, maxLength: 240,
    // Only after they described them (skipping the description, or a follow-up, ends the follow-ups), and only for a detail still missing.
    applies: (b) => showsDescribedPerson(b) && Boolean(field(b, "look")) && answered(b, previous)
      && Boolean(detail(b)),
    filled: (b) => answered(b, id),
    onAnswer: (b) => { const d = detail(b); if (d) b.personalize.fields[topicKey] = d.id; },
  };
}

/**
 * The no-photo look questions. Add them right after the photo questions in a
 * card whose no-photo front shows the person.
 */
export function lookQuestions(): PtQuestion[] {
  return [
    {
      id: "PT_look", stage: "Photo", kind: "text", field: "look", heading: ["How do they", "look?"],
      prompt: (b) => (b.shared.recipientName ? `Without a photo, tell us how ${b.shared.recipientName} looks so we can draw them.` : "Without a photo, tell us how they look so we can draw them."),
      helper: "Hair, skin tone, glasses, what they usually wear: whatever you’d like drawn. We never guess from a name.",
      placeholder: "Tall, warm brown skin, short grey curls, always in a cardigan.",
      optional: true, maxLength: 400,
      applies: showsDescribedPerson, filled: (b) => answered(b, "PT_look"),
    },
    lookFollowUp(1),
    lookFollowUp(2),
  ];
}

/** The words on the front: a suggested line (from `task`), the customer's own, or none. */
export function captionQuestion(id: string, heading: [string, string], prompt: PtQuestion["prompt"], task: PtSuggestTask, helper?: string): PtQuestion {
  return {
    id, stage: "Words", kind: "caption", heading, prompt, helper, task,
    optional: false, applies: () => true, filled: (b) => answered(b, id) && b.image.caption.choice !== null,
  };
}

export function messageQuestion(): PtQuestion {
  return {
    id: "PT_message", stage: "Words", kind: "message", heading: ["Write the", "inside"],
    prompt: (b) => (b.shared.recipientName ? `What would you like to tell ${b.shared.recipientName} inside?` : "What should the inside say?"),
    helper: "Write your own, let the AI writer draft one from your answers, or leave it blank. English, up to 4 short lines.",
    optional: false, applies: () => true, filled: (b) => answered(b, "PT_message") && b.message.mode !== null,
  };
}

export function songModeQuestion(): PtQuestion {
  return {
    id: "PT_song", stage: "Song", kind: "song-mode", heading: ["Add a", "song?"],
    prompt: (b) => `Should ${theirs(b)} play a song when they scan it?`,
    optional: false, applies: () => true, filled: (b) => b.song.mode !== null && answered(b, "PT_song"),
  };
}

/** "Choose the sound": the card's suggested genre is pre-selected; all ten are offered. */
export function genreQuestion(): PtQuestion {
  return {
    id: "PT_genre", stage: "Song", kind: "genre", heading: ["Choose the", "sound"],
    prompt: "Which style of music should it be?",
    optional: false, applies: (b) => b.song.mode === "vocal" || b.song.mode === "instrumental",
    filled: (b) => Boolean(b.song.genrePresetId) && answered(b, "PT_genre"),
  };
}

export function songUseQuestion(detailLabel: string): PtQuestion {
  return {
    id: "PT_song_use", stage: "Song", kind: "song-use", heading: ["What goes in", "the song?"],
    prompt: `Should the song use their name, and mention ${detailLabel}?`,
    helper: "The song is written from your answers. Choose what it may use.",
    optional: false, applies: (b) => b.song.mode === "vocal",
    filled: (b) => b.personalize.songUse.detail !== null && (b.personalize.songUse.name !== null || !b.shared.recipientName),
  };
}

export function lyricsQuestion(): PtQuestion {
  return {
    id: "PT_lyrics", stage: "Song", kind: "lyrics", heading: ["Your", "lyrics"],
    prompt: "Here are lyrics written from your answers. Edit anything, then approve them.",
    optional: false, applies: (b) => b.song.mode === "vocal",
    filled: (b) => Boolean(b.song.lyrics) && b.song.approvedLyricsVersion === b.song.lyricsVersion,
  };
}

export function generateQuestion(): PtQuestion {
  return {
    id: "PT_generate", stage: "Review", kind: "generate", heading: ["Ready to", "create"],
    prompt: (b) => `Everything’s ready for ${theirs(b)}. Check the shape, then create it.`,
    optional: false, applies: () => true, filled: (b) => Boolean(b.control.generation),
  };
}

/** True once the song choice is made and, for a sung song, its lyrics are approved. */
export function songReady(brief: PtBrief) {
  if (brief.song.mode === null) return false;
  if (!hasSong(brief) || brief.song.mode === "instrumental") return true;
  return Boolean(brief.song.lyrics) && brief.song.approvedLyricsVersion === brief.song.lyricsVersion;
}
