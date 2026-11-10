// The Build My Card shared brief: one validated source of truth for the
// questionnaire, saved inside card_drafts.creative_brief (schema 2).
// Field names follow the Asset Generation Map: shared / image / message /
// song / control. Facts keep their source answer so an imagined scene never
// becomes a claimed memory.

import type { ImageMode, SongMode } from "./catalog";
import { GENRE_IDS } from "./catalog";
import type { SignoffStyle } from "./engine";
import { PROMPT_TEMPLATE_VERSION, USER_DIRECTION_MAX_CHARS } from "./prompts";

export const BRIEF_SCHEMA = 2;

export type Stage = "Photo" | "Basics" | "Image" | "Message" | "Song" | "Review";
export const STAGES: Stage[] = ["Photo", "Basics", "Image", "Message", "Song", "Review"];

export type ReferenceImage = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  /** Small JPEG data URL so the summary can show the photo after a reload. */
  thumbnail?: string;
  role: "primary" | "identity";
};

export type SourcedFact = { text: string; sourceAnswerId: string };

export type Answer = {
  id: string;
  questionId: string;
  text: string;
  controls: Record<string, unknown>;
  at: string;
};

export type Conflict = { field: string; explanation: string; sourceAnswerIds: string[]; offer?: "switch_to_transform" };

/** A chosen accessory. Custom ones (id "custom") carry the customer's own wording in `label`. */
export type Wearable = { id: string; target: string; label?: string };

export type TextVersion = { text: string; version: number };

export type Brief = {
  shared: {
    occasion: string | null;
    recipientName: string | null;
    senderName: string | null;
    relationship: string | null;
    vibes: string[];
    customVibe: string | null;
    userFacts: SourcedFact[];
    intendedFeeling: string | null;
    motif: string | null;
    contentLanguage: "en";
  };
  image: {
    mode: ImageMode | null;
    orientation: "portrait" | "landscape" | null;
    style: string | null;
    customStyle: string | null;
    /** Who or what is on the front, when the customer describes them instead of uploading. */
    subjectDescription: string | null;
    /** No photo: answers to the "describe how they look" follow-ups (owner, 2026-11-08; see lookDetails.ts). */
    lookDetails: { hair: string | null; style: string | null; signature: string | null };
    vision: string | null;
    sceneDetail: string | null;
    options: string | null;
    keep: string | null;
    refinement: string | null;
    references: ReferenceImage[];
    primaryReferenceId: string | null;
    sameSubject: "same" | "different" | "mix" | null;
    decorations: {
      wants: string[];
      accents: string[];
      wearables: Wearable[];
      border: { style: string | null; colour: string | null; customColour: string | null; customStyle: string | null };
      customText: string | null;
      /** Wording for a Custom accent chip. */
      customAccent: string | null;
      /** Decorate extras (owner, 2026-11-08). */
      stickers: string[];
      customSticker: string | null;
      pattern: string | null;
      customPattern: string | null;
      sparkle: string | null;
      customSparkle: string | null;
      /** A name, date or short phrase lettered onto the photo (separate from the caption). */
      lettering: string | null;
    };
    caption: { choice: "exact" | "none" | "generator" | null; text: string; origin: "user" | "generated" | null; drafts: string[]; successfulRegenerations: number };
    briefConfirmed: boolean;
  };
  message: {
    mode: "text" | "blank" | null;
    userVersion: TextVersion | null;
    /** `direction`: the redraft note that produced this draft, kept for support (never a card fact). */
    aiVersion: (TextVersion & { sourceSharedVersion: number; successfulRegenerations: number; drafts: string[]; direction?: string | null }) | null;
    aiAlternateEnabled: boolean;
    printedChoice: "user" | "ai";
    /** How the AI writer signs off (the customer's own text is printed as typed). */
    signoff: SignoffStyle;
  };
  song: {
    mode: SongMode | null;
    recommendedGenreIds: { id: string; reason: string }[];
    genrePresetId: string | null;
    legacyGenre: string | null;
    pronunciation: string | null;
    lyrics: string;
    lyricsVersion: number;
    lyricsSourceVersion: number;
    /** Every lyric draft so far, so a rewrite never repeats one. */
    lyricDrafts: string[];
    /** The inside message the lyrics were written from ("" for none); null on drafts saved before this was tracked. */
    lyricsMessage: string | null;
    /** The redraft note that produced the current lyrics, kept for support (never a card fact). */
    lyricsDirection: string | null;
    regenerationCount: number;
    approvedLyricsVersion: number | null;
    /** Lyrics version the current audio was made from (vocal songs). */
    audioLyricsVersion: number | null;
    targetSeconds: 45;
  };
  control: {
    schema: typeof BRIEF_SCHEMA;
    photoSkipped: boolean | null;
    /** Each new batch of photos must be attested again (owner decision 2026-11-07). */
    attestedBatches: number;
    currentStage: Stage;
    answers: Answer[];
    answered: string[];
    skippedOptionalFields: string[];
    briefVersion: number;
    /** Bumped only when shared meaning changes, so text drafts can be marked stale. */
    sharedVersion: number;
    promptTemplateVersion: string;
    conflicts: Conflict[];
    generation: GenerationSnapshot | null;
    /**
     * Review approvals, saved with the draft so Delivery's "Back to review", a reload or Saved Cards
     * keep them (owner, 2026-11-09, audit §8 D8). Each holds the exact version approved (the front's asset
     * id, the printed message's key, the song asset and lyrics version), so any later change un-approves it.
     */
    approvals: { front: string | null; message: string | null; song: string | null };
  };
};

export type GenerationSnapshot = {
  actionKey: string;
  at: string;
  briefVersion: number;
  promptTemplateVersion: string;
  catalogVersion: string;
  includeSong: boolean;
  compiledImagePrompt: string;
  compiledMusicPrompt: string | null;
  printedMessage: string | null;
  /** Which photos (and which main photo) the front was made from; older snapshots don't have it. */
  photoKey?: string;
};

export function emptyBrief(): Brief {
  return {
    shared: {
      occasion: null, recipientName: null, senderName: null, relationship: null, vibes: [], customVibe: null,
      userFacts: [], intendedFeeling: null, motif: null, contentLanguage: "en",
    },
    image: {
      mode: null, orientation: null, style: null, customStyle: null, subjectDescription: null, lookDetails: { hair: null, style: null, signature: null }, vision: null, sceneDetail: null,
      options: null, keep: null, refinement: null, references: [], primaryReferenceId: null, sameSubject: null,
      decorations: { wants: [], accents: [], wearables: [], border: { style: null, colour: null, customColour: null, customStyle: null }, customText: null, customAccent: null, stickers: [], customSticker: null, pattern: null, customPattern: null, sparkle: null, customSparkle: null, lettering: null },
      caption: { choice: null, text: "", origin: null, drafts: [], successfulRegenerations: 0 },
      briefConfirmed: false,
    },
    message: { mode: null, userVersion: null, aiVersion: null, aiAlternateEnabled: false, printedChoice: "user", signoff: "auto" },
    song: {
      mode: null, recommendedGenreIds: [], genrePresetId: null, legacyGenre: null, pronunciation: null, lyrics: "",
      lyricsVersion: 0, lyricsSourceVersion: 0, lyricDrafts: [], lyricsMessage: null, lyricsDirection: null, regenerationCount: 0, approvedLyricsVersion: null, audioLyricsVersion: null, targetSeconds: 45,
    },
    control: {
      schema: BRIEF_SCHEMA, photoSkipped: null, attestedBatches: 0, currentStage: "Photo", answers: [], answered: [],
      skippedOptionalFields: [], briefVersion: 0, sharedVersion: 0, promptTemplateVersion: PROMPT_TEMPLATE_VERSION,
      conflicts: [], generation: null, approvals: { front: null, message: null, song: null },
    },
  };
}

// ---- Reading saved drafts ---------------------------------------------------

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Deep-merges a saved value over a default of the same shape, keeping only known keys. */
function mergeKnown<T>(base: T, saved: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(saved) ? saved : base) as T;
  if (base === null || typeof base !== "object") {
    if (saved === undefined) return base;
    if (base === null) return saved as T;
    return (typeof saved === typeof base ? saved : base) as T;
  }
  const source = record(saved);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(base as Record<string, unknown>)) {
    out[key] = key in source ? mergeKnown(value, source[key]) : value;
  }
  return out as T;
}

/**
 * Reads creative_brief into a Brief. Schema 2 drafts load directly; drafts from
 * the old six-form builder are migrated (their answers count as answered, and
 * an old genre name is kept aside so the customer is asked to choose again).
 */
export function briefFromCreative(creative: unknown): Brief {
  const source = record(creative);
  if (record(source.control).schema === BRIEF_SCHEMA) {
    const brief = mergeKnown(emptyBrief(), source);
    if (brief.song.genrePresetId && !GENRE_IDS.has(brief.song.genrePresetId)) {
      brief.song.legacyGenre = brief.song.genrePresetId;
      brief.song.genrePresetId = null;
    }
    return brief;
  }
  return migrateLegacy(source);
}

function migrateLegacy(source: Record<string, unknown>): Brief {
  const brief = emptyBrief();
  const answered: string[] = [];
  const photo = record(source.photo);
  const basics = record(source.basics);
  const image = record(source.image);
  const message = record(source.message);
  const song = record(source.song);

  if (Object.keys(photo).length) {
    const describe = photo.mode === "describe";
    brief.control.photoSkipped = describe;
    brief.image.subjectDescription = text(photo.description);
    if (describe) brief.image.mode = "transform";
    answered.push("P1_photo");
  }
  if (Object.keys(basics).length) {
    brief.shared.occasion = text(basics.occasion);
    brief.shared.recipientName = text(basics.recipient);
    brief.shared.relationship = text(basics.relationship);
    brief.shared.senderName = text(basics.sender);
    brief.song.pronunciation = text(basics.phonetic);
    answered.push("B0_story", "B1_occasion", "B2_people");
  }
  if (Object.keys(image).length) {
    const blueprint = text(image.blueprint);
    if (blueprint === "transform" || blueprint === "enhance" || blueprint === "decorate") brief.image.mode = blueprint;
    brief.image.style = text(image.visualStyle);
    brief.image.vision = text(image.vision) || text(image.description);
    if (Array.isArray(image.vibes)) brief.shared.vibes = image.vibes.filter((v): v is string => typeof v === "string").map((v) => v.toLowerCase().replace(/\s+/g, "-"));
    const coverText = text(image.coverText);
    if (coverText) brief.image.caption = { ...brief.image.caption, choice: "exact", text: coverText, origin: "user" };
  }
  const inside = text(message.insideMessage);
  if (inside) {
    brief.message.mode = "text";
    brief.message.userVersion = { text: inside, version: 1 };
    answered.push("M1_inside");
  }
  if (Object.keys(song).length) {
    brief.song.mode = song.includeSong === false ? "none" : "vocal";
    const legacy = text(song.genre);
    if (legacy) brief.song.legacyGenre = GENRE_IDS.has(legacy) ? null : legacy;
    if (legacy && GENRE_IDS.has(legacy)) brief.song.genrePresetId = legacy;
    answered.push("S1_song");
  }
  brief.control.answered = answered;
  return brief;
}

/** The creative_brief written to the card draft. `flow` keeps My Cards routing. */
export function creativeFromBrief(brief: Brief): Record<string, unknown> {
  return {
    flow: "build_my_card",
    shared: brief.shared,
    image: brief.image,
    message: brief.message,
    song: brief.song,
    control: brief.control,
  };
}

// ---- Small helpers used across the questionnaire ---------------------------

/** The no-photo description plus any look follow-up answers, in the customer's own words. */
export function describedSubject(brief: Brief): string | null {
  const { hair, style, signature } = brief.image.lookDetails;
  const parts = [brief.image.subjectDescription, hair, style, signature].map((part) => part?.trim()).filter(Boolean);
  return parts.length ? parts.join(". ") : null;
}

export function hasPhoto(brief: Brief) {
  return brief.control.photoSkipped === false && brief.image.references.length > 0;
}

/**
 * The one rule for which inside message prints (shared by the message step,
 * Review and generation): the chosen version if it exists, otherwise whichever
 * one does. A blank inside prints nothing.
 */
export function printedVersionKey(brief: Brief): "user" | "ai" | null {
  if (brief.message.mode === "blank") return null;
  const exists = (key: "user" | "ai") => Boolean(key === "ai" ? brief.message.aiVersion : brief.message.userVersion);
  if (exists(brief.message.printedChoice)) return brief.message.printedChoice;
  return exists("user") ? "user" : exists("ai") ? "ai" : null;
}

export function printedVersion(brief: Brief) {
  const key = printedVersionKey(brief);
  return key === "ai" ? brief.message.aiVersion : key === "user" ? brief.message.userVersion : null;
}

export function printedMessage(brief: Brief): string | null {
  return printedVersion(brief)?.text.trim() || null;
}

/** A sung or instrumental song is on. */
export function hasSong(brief: Brief) {
  return brief.song.mode === "vocal" || brief.song.mode === "instrumental";
}

/** Credits that Create spends: one for the front, one more with a song. */
export function generationCost(brief: Brief) {
  return 1 + (hasSong(brief) ? 1 : 0);
}

/** Identifies the photos a front is made from, so changing them marks the front out of date. */
export function photoKey(brief: Brief) {
  if (!hasPhoto(brief)) return "no-photo";
  return `${brief.image.references.map((ref) => ref.id).join(",")}|${brief.image.primaryReferenceId || ""}`;
}

export function isAiMessageStale(brief: Brief) {
  return Boolean(brief.message.aiVersion && brief.message.aiVersion.sourceSharedVersion < brief.control.sharedVersion);
}

export function isLyricsStale(brief: Brief) {
  return lyricsStaleReason(brief) !== null;
}

/** Why the lyrics may no longer fit: the story changed, or the inside message they echo changed. */
export function lyricsStaleReason(brief: Brief): "story" | "message" | null {
  if (!brief.song.lyrics) return null;
  if (brief.song.lyricsSourceVersion < brief.control.sharedVersion) return "story";
  if (brief.song.lyricsMessage !== null && brief.song.lyricsMessage !== (printedMessage(brief) || "")) return "message";
  return null;
}

/** A usable greeting purpose exists (occasion, a story, a stated feeling or a scene idea). */
export function hasPurpose(brief: Brief) {
  return Boolean(
    brief.shared.occasion || brief.shared.userFacts.length || brief.shared.intendedFeeling || brief.shared.motif
    || brief.image.vision,
  );
}

export function validateMessage(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Add a message, or choose to leave the inside blank.";
  if (value.length > 500) return `That's ${value.length} characters. The inside fits 500, including the sign-off.`;
  const lines = value.split(/\r?\n/).filter((line) => line.trim()).length;
  if (lines > 4) return `That's ${lines} lines. The inside fits up to 4 short lines.`;
  return null;
}

export function validateLyrics(value: string): string | null {
  if (!value.trim()) return "Add lyrics before approving.";
  if (value.length > 750) return `That's ${value.length} characters. Lyrics fit 750, including labels.`;
  const order = ["Verse", "Chorus", "Final"];
  const found = Array.from(value.matchAll(/\[(\d\d:\d\d)\s*[–-]\s*(\d\d:\d\d)\s+(Verse|Chorus|Final)\]/g)).map((m) => m[3]);
  if (found.join(",") !== order.join(",")) return "Keep the three sections in order: [Verse], [Chorus], then [Final].";
  return null;
}

export function wordCount(value: string) {
  return value.replace(/\[[^\]]*\]/g, " ").split(/\s+/).filter(Boolean).length;
}

/** Earlier lyric drafts for the writer to avoid, including the current lyrics (older drafts and hand edits). */
export function lyricHistory(brief: Brief): string[] {
  const drafts = brief.song.lyricDrafts || [];
  const current = brief.song.lyrics.trim();
  return current && !drafts.includes(brief.song.lyrics) ? [...drafts, brief.song.lyrics] : [...drafts];
}

/** A redraft note as sent to the writers: one line, no control characters, at most USER_DIRECTION_MAX_CHARS; null when empty. */
export function cleanDirection(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, USER_DIRECTION_MAX_CHARS).trim();
  return text || null;
}
