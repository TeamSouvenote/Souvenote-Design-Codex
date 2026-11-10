// The Personalize a Template brief. It is Build My Card's brief (shared /
// image / message / song / control, so the shared writers, controls and
// Review work unchanged) plus one `personalize` section: the template, the
// photo mode, the card's own answers, AI suggestion sets, the comic
// storyboard and where the song may use the name and the card's detail.
// Saved in card_drafts.creative_brief with flow "personalize_template".

import type { Brief } from "../bmc/brief";
import { briefFromCreative, emptyBrief } from "../bmc/brief";

export const PT_SCHEMA = 1;

export type PtStage = "Details" | "Photo" | "Design" | "Words" | "Song" | "Review";
export const PT_STAGES: PtStage[] = ["Details", "Photo", "Design", "Words", "Song", "Review"];

/** Personalize: the card's own treatment ("transform"), the photo kept as it is ("decorate"), or no photo. */
export type PhotoMode = "none" | "transform" | "decorate";

/** One AI suggestion (or a verified story candidate on On This Day). */
export type PtOption = {
  id: string;
  label: string;
  sub?: string;
  /** On This Day: where the story was verified. */
  source?: { name: string; url: string; eventDate: string };
  tone?: "positive" | "lighter" | "neutral";
  recommended?: boolean;
};

/** A set of suggestions for one question: the initial draft plus up to five more. */
export type PtSuggestionSet = { options: PtOption[]; drafts: number; sourceVersion: number };

export type StoryboardPanel = { action: string; lettering: string[] };

export type PtState = {
  schema: typeof PT_SCHEMA;
  templateId: string;
  templateName: string;
  templateVersion: string;
  photoMode: PhotoMode | null;
  /** The card's own answers, by the field names in its card file. */
  fields: Record<string, string>;
  suggestions: Record<string, PtSuggestionSet>;
  storyboard: { panels: StoryboardPanel[]; version: number; drafts: number; approvedVersion: number | null } | null;
  /** A name being given doesn't mean it goes in the song: each use is asked separately. */
  songUse: { name: boolean | null; detail: boolean | null };
};

export type PtBrief = Brief & { personalize: PtState };

export function emptyPtBrief(template: { id: string; name: string; version: string; occasion: string | null; orientation: "portrait" | "landscape" }): PtBrief {
  const base = emptyBrief();
  base.shared.occasion = template.occasion;
  base.image.orientation = template.orientation;
  return {
    ...base,
    personalize: {
      schema: PT_SCHEMA, templateId: template.id, templateName: template.name, templateVersion: template.version,
      photoMode: null, fields: {}, suggestions: {}, storyboard: null, songUse: { name: null, detail: null },
    },
  };
}

// ---- Reading saved drafts -----------------------------------------------------

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringRecord(value: unknown): Record<string, string> {
  return Object.fromEntries(Object.entries(record(value)).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

/** The default caption the old three-step pop-up pre-filled; it was never confirmed by the customer. */
const OLD_PREFILLED_CAPTION = "To the moon and back";

/** The template id a saved draft belongs to (new and old shapes). */
export function savedTemplateId(creative: unknown): string | null {
  const source = record(creative);
  return text(record(source.personalize).templateId) || text(record(source.template).id);
}

/**
 * Reads creative_brief into a PtBrief for `template`. Schema-1 drafts load
 * directly; drafts from the old three-step pop-up are migrated: their answers
 * are kept, an old "include song" becomes a sung song with lyrics not yet
 * approved, and the old pre-filled caption is treated as unconfirmed.
 */
export function ptBriefFromCreative(creative: unknown, template: Parameters<typeof emptyPtBrief>[0]): PtBrief {
  const source = record(creative);
  const fresh = emptyPtBrief(template);
  const saved = record(source.personalize);
  if (saved.schema === PT_SCHEMA) {
    const base = briefFromCreative(source);
    const songUse = record(saved.songUse);
    const storyboard = record(saved.storyboard);
    // Enhance was retired from Personalize (owner, 2026-11-08): those drafts move to the card's own treatment.
    const savedMode = text(saved.photoMode);
    const mode = savedMode === "enhance" ? "transform" : savedMode;
    if (base.image.mode === "enhance") base.image.mode = "transform";
    return {
      ...base,
      personalize: {
        ...fresh.personalize,
        // A saved template keeps its own name; the questions follow the current card file.
        templateName: text(saved.templateName) || fresh.personalize.templateName,
        photoMode: mode === "none" || mode === "transform" || mode === "decorate" ? mode : null,
        fields: stringRecord(saved.fields),
        suggestions: record(saved.suggestions) as PtState["suggestions"],
        storyboard: Array.isArray(storyboard.panels) ? saved.storyboard as PtState["storyboard"] : null,
        songUse: {
          name: typeof songUse.name === "boolean" ? songUse.name : null,
          detail: typeof songUse.detail === "boolean" ? songUse.detail : null,
        },
      },
    };
  }
  return migrateOldPersonalize(source, fresh);
}

function migrateOldPersonalize(source: Record<string, unknown>, brief: PtBrief): PtBrief {
  const oldTemplate = record(source.template);
  const photo = record(source.photo);
  brief.personalize.templateName = text(oldTemplate.name) || brief.personalize.templateName;
  brief.shared.occasion = text(source.occasion) || text(oldTemplate.occasion) || brief.shared.occasion;
  brief.shared.recipientName = text(source.recipient);
  brief.song.pronunciation = text(source.phonetic);
  const birthday = text(source.birthday);
  if (birthday) brief.personalize.fields.birthDate = birthday;

  const mode = text(photo.mode);
  if (mode === "description" || mode === "describe") {
    brief.control.photoSkipped = true;
    brief.personalize.photoMode = "none";
    brief.image.subjectDescription = text(photo.description);
    // The old pop-up's description becomes the answer to "How do they look?"; follow-ups ask only for what it leaves out.
    if (brief.image.subjectDescription) {
      brief.personalize.fields.character = brief.image.subjectDescription;
      brief.personalize.fields.look = brief.image.subjectDescription;
      brief.control.answered.push("PT_look");
    }
  } else if (mode === "upload") {
    const images = Array.isArray(photo.referenceImages) ? photo.referenceImages.map(record) : [];
    brief.image.references = images.map((image, index) => ({
      id: `legacy-${index}`, name: text(image.filename) || `Photo ${index + 1}`, mimeType: text(image.mimeType) || "image/jpeg",
      size: typeof image.size === "number" ? image.size : 0, role: index === 0 ? "primary" as const : "identity" as const,
    }));
    brief.image.primaryReferenceId = brief.image.references[0]?.id || null;
    brief.control.photoSkipped = brief.image.references.length ? false : null;
    brief.control.attestedBatches = photo.attested === true && brief.image.references.length ? 1 : 0;
  }

  const caption = text(source.caption);
  if (caption && caption !== OLD_PREFILLED_CAPTION) {
    brief.image.caption = { ...brief.image.caption, choice: "exact", text: caption, origin: "user" };
  }
  const inside = text(source.insideMessage);
  if (inside) {
    brief.message.mode = "text";
    brief.message.userVersion = { text: inside, version: 1 };
  }
  if (typeof source.includeSong === "boolean") {
    // An old "include song" is a sung song whose lyrics still need writing and approving.
    brief.song.mode = source.includeSong ? "vocal" : "none";
    brief.song.approvedLyricsVersion = null;
  }
  return brief;
}

/** The creative_brief written to the card draft. `flow` keeps My Cards routing. */
export function creativeFromPtBrief(brief: PtBrief): Record<string, unknown> {
  return {
    flow: "personalize_template",
    template: { id: brief.personalize.templateId, name: brief.personalize.templateName, version: brief.personalize.templateVersion },
    shared: brief.shared,
    image: brief.image,
    message: brief.message,
    song: brief.song,
    control: brief.control,
    personalize: brief.personalize,
  };
}

// ---- Small helpers ----------------------------------------------------------------

export function field(brief: PtBrief, key: string): string {
  return brief.personalize.fields[key]?.trim() || "";
}

export function usesPhoto(brief: PtBrief) {
  const mode = brief.personalize.photoMode;
  return mode === "transform" || mode === "decorate";
}

export function hasAttestedPhoto(brief: PtBrief) {
  return brief.image.references.length > 0 && brief.control.attestedBatches > 0;
}

export function possessive(name: string) {
  return name.endsWith("s") ? `${name}’` : `${name}’s`;
}

/** "Maya’s card" or "their card", for tailored wording. */
export function theirs(brief: PtBrief, noun = "card") {
  const name = brief.shared.recipientName;
  return name ? `${possessive(name)} ${noun}` : `their ${noun}`;
}
