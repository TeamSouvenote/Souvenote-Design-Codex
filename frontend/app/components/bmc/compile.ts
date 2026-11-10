// Resolves the brief into what the customer sees before generating (the
// resolved image brief) and into the canonical image and music prompts saved
// on the generation snapshot. Empty optional clauses are left out entirely and
// no template braces survive.

import type { Brief, Wearable } from "./brief";
import { describedSubject, hasPhoto } from "./brief";
import {
  ACCENT_GROUPS, BORDER_COLOURS, BORDER_STYLES, CUSTOM_ID, GENTLE_OCCASIONS, IMAGE_MODES, LIMITS, PATTERNS, SPARKLES, STICKERS, VIBES, VISUAL_STYLES, WEARABLES, WEARABLE_SPOT, genreById, labelFor,
} from "./catalog";
import type { SignoffStyle, TextContext } from "./engine";
import { CAPTION_CLAUSES, IMAGE_BASE_PROMPT, IMAGE_MODE_CLAUSES, MUSIC_PROMPT_TEMPLATE } from "./prompts";

/** Provisional print profile: the existing 6% inset, pending the printer's bleed and safe-area spec. */
export const PRINT_PROFILE = {
  provisional: true,
  bleed: "a 6% margin",
  safeArea: "an inner safe zone at least 6% from every edge",
} as const;

const ACCENT_LABELS = new Map(ACCENT_GROUPS.flatMap((group) => group.items.map((item) => [item.id, item.label] as const)));

export function accentLabel(id: string) {
  return ACCENT_LABELS.get(id) || id;
}

export function wearableLabel(id: string) {
  return labelFor(WEARABLES, id) || id;
}

/** A chosen accessory's name: the customer's own wording for Custom. */
export function wearableName(wearable: Wearable) {
  return wearable.id === CUSTOM_ID ? wearable.label || "Custom accessory" : wearableLabel(wearable.id);
}

/** Written direction first, then vibes, then occasion; "warm neutral" only when nothing is given. */
export function intendedFeeling(brief: Brief) {
  if (brief.shared.intendedFeeling) return brief.shared.intendedFeeling;
  const vibes = brief.shared.vibes.map((id) => (id === "custom" ? brief.shared.customVibe || "" : labelFor(VIBES, id))).filter(Boolean);
  if (vibes.length) return vibes.join(", ").toLowerCase();
  if (brief.shared.occasion) return `suited to ${brief.shared.occasion.toLowerCase()}`;
  return "warm neutral";
}

export function styleDescriptor(brief: Brief) {
  if (brief.image.style === "custom") return brief.image.customStyle || "";
  const label = labelFor(VISUAL_STYLES, brief.image.style);
  return [label ? `${label.toLowerCase()} style` : "", brief.image.refinement || ""].filter(Boolean).join(", ");
}

// ---- Decorations ----------------------------------------------------------------

export type ResolvedDecorations = {
  accents: string[];
  removedAccents: string[];
  wearables: { label: string; target: string }[];
  border: string | null;
  borderColour: string | null;
  customText: string | null;
  conflicts: string[];
  stickers: string[];
  pattern: string | null;
  sparkle: string | null;
  lettering: string | null;
};

/** Written "no X" removes a clicked accent: written direction overrides chips. */
export function resolveDecorations(brief: Brief): ResolvedDecorations {
  const deco = brief.image.decorations;
  const custom = (deco.customText || "").toLowerCase();
  const removed: string[] = [];
  const accents: string[] = [];
  for (const id of deco.accents) {
    if (id === CUSTOM_ID) { if (deco.customAccent) accents.push(deco.customAccent); continue; }
    const label = accentLabel(id);
    const word = label.toLowerCase().replace(/s$/, "");
    if (custom && new RegExp(`\\b(no|without|skip)\\s+(the\\s+)?${word}`, "i").test(custom)) removed.push(label);
    else accents.push(label);
  }
  const borderStyle = !deco.border.style || deco.border.style === "no-border" ? null
    : deco.border.style === CUSTOM_ID ? deco.border.customStyle || "custom" : labelFor(BORDER_STYLES, deco.border.style);
  const borderColour = borderStyle
    ? deco.border.colour === "custom-colour" ? deco.border.customColour : labelFor(BORDER_COLOURS, deco.border.colour) || "Automatic"
    : null;
  const spots = new Map<string, string>();
  const conflicts: string[] = [];
  const wearables = deco.wearables.map((wearable) => {
    const key = `${wearable.target}`;
    const label = wearableName(wearable);
    const spot = wearable.id === CUSTOM_ID ? `custom-${label}` : WEARABLE_SPOT[wearable.id] || "head";
    const taken = spots.get(`${key}:${spot}`);
    if (taken) conflicts.push(`${taken} and ${label} would both sit on the same spot for ${wearable.target}.`);
    spots.set(`${key}:${spot}`, label);
    return { label, target: wearable.target };
  });
  const stickers = deco.stickers.map((id) => (id === CUSTOM_ID ? deco.customSticker || "" : labelFor(STICKERS, id) || id)).filter(Boolean);
  const pattern = !deco.pattern ? null : deco.pattern === CUSTOM_ID ? deco.customPattern || null : labelFor(PATTERNS, deco.pattern) || deco.pattern;
  const sparkle = !deco.sparkle ? null : deco.sparkle === CUSTOM_ID ? deco.customSparkle || null : labelFor(SPARKLES, deco.sparkle) || deco.sparkle;
  return {
    accents, removedAccents: removed, wearables, border: borderStyle, borderColour, customText: deco.customText, conflicts,
    stickers, pattern, sparkle, lettering: deco.lettering?.trim() || null,
  };
}

export function decorationDirectives(brief: Brief) {
  const resolved = resolveDecorations(brief);
  const parts: string[] = [];
  if (resolved.accents.length) parts.push(`Add ${resolved.accents.join(", ").toLowerCase()} as decorative accents in open space.`);
  for (const wearable of resolved.wearables) parts.push(`Add a ${wearable.label.toLowerCase()} on ${wearable.target}, changing nothing else about them.`);
  if (resolved.border) {
    const colour = resolved.borderColour && resolved.borderColour !== "Automatic" ? `${resolved.borderColour.toLowerCase()} ` : "";
    parts.push(`Add one ${colour}${resolved.border.toLowerCase()} border as part of the artwork${resolved.borderColour === "Automatic" ? " in a readable colour from the photo's palette" : ""}.`);
  }
  if (resolved.stickers.length) parts.push(`Add playful ${resolved.stickers.join(", ").toLowerCase()} stickers and doodles in open space, never over faces.`);
  if (resolved.pattern) parts.push(`Replace only the background behind the people with a ${resolved.pattern.toLowerCase()} pattern; keep every person and pet exactly as they are.`);
  if (resolved.sparkle) parts.push(`Add a soft ${resolved.sparkle.toLowerCase()} light effect around the photo, keeping faces clear.`);
  if (resolved.lettering) parts.push(`Letter exactly "${resolved.lettering}" onto the photo in open space, clear of faces, separate from any caption.`);
  if (resolved.customText) parts.push(`Customer decoration direction: ${resolved.customText}`);
  if (!parts.length) return "Do not add decorative accents or a border.";
  return `${parts.join(" ")} Add no other decorative elements.`;
}

// ---- Resolved image brief (shown before leaving Image) --------------------------

export type SummaryRow = { label: string; value: string; questionId: string };

export function imageSummary(brief: Brief): SummaryRow[] {
  const rows: SummaryRow[] = [];
  const mode = IMAGE_MODES.find((m) => m.id === brief.image.mode);
  if (mode) rows.push({ label: "Blueprint", value: `${mode.label}${hasPhoto(brief) ? " · from your photo" : " · from your description"}`, questionId: "I1_mode" });
  if (brief.image.orientation) rows.push({ label: "Shape", value: brief.image.orientation === "portrait" ? "Portrait 5×7" : "Landscape 7×5", questionId: "B6_orientation" });
  if (brief.image.mode !== "decorate" && brief.image.style) rows.push({ label: "Style", value: styleDescriptor(brief), questionId: "I2_style" });
  if (brief.shared.vibes.length) rows.push({ label: "Vibe", value: brief.shared.vibes.map((id) => (id === "custom" ? brief.shared.customVibe || "Custom" : labelFor(VIBES, id))).join(", "), questionId: "I3_vibes" });
  if (brief.image.mode === "transform") {
    const scene = [describedSubject(brief), brief.image.vision, brief.image.sceneDetail].filter(Boolean).join(" ");
    if (scene) rows.push({ label: "Scene", value: scene, questionId: "T1_scene" });
    if (brief.image.keep) rows.push({ label: "Keep recognisable", value: brief.image.keep, questionId: "T4_keep" });
    if (brief.image.options) rows.push({ label: "Add or avoid", value: brief.image.options, questionId: "T3_options" });
  }
  if (brief.image.mode === "enhance") {
    rows.push({ label: "Keeps", value: "Everyone, their poses and the layout of your photo", questionId: "I1_mode" });
    if (brief.image.refinement) rows.push({ label: "Finish", value: brief.image.refinement, questionId: "E2_refine" });
  }
  if (brief.image.mode === "decorate") {
    const resolved = resolveDecorations(brief);
    const list = [
      ...resolved.accents,
      ...resolved.wearables.map((w) => `${w.label} on ${w.target}`),
      resolved.border ? `${resolved.border} border${resolved.borderColour ? ` (${resolved.borderColour})` : ""}` : "",
      resolved.stickers.length ? `${resolved.stickers.join(", ")} stickers` : "",
      resolved.pattern ? `${resolved.pattern} background` : "",
      resolved.sparkle ? `${resolved.sparkle}` : "",
      resolved.lettering ? `Lettering “${resolved.lettering}”` : "",
    ].filter(Boolean);
    rows.push({ label: "Decorations", value: list.length ? list.join(", ") : "No accents or border", questionId: "D1_what" });
    if (resolved.removedAccents.length) rows.push({ label: "Left out (your words)", value: resolved.removedAccents.join(", "), questionId: "D6_own_words" });
    if (resolved.customText) rows.push({ label: "Your words", value: resolved.customText, questionId: "D6_own_words" });
  }
  const caption = brief.image.caption;
  rows.push({ label: "Caption", value: caption.choice === "none" ? "No caption" : caption.text ? `“${caption.text}”` : "Not chosen yet", questionId: "I4_caption" });
  return rows;
}

/** Decorate needs at least one addition or a caption. */
export function decorateHasSomething(brief: Brief) {
  const resolved = resolveDecorations(brief);
  return Boolean(resolved.accents.length || resolved.wearables.length || resolved.border || resolved.customText
    || resolved.stickers.length || resolved.pattern || resolved.sparkle || resolved.lettering
    || (brief.image.caption.choice !== "none" && brief.image.caption.text.trim()));
}

// ---- Prompts ------------------------------------------------------------------

function fill(template: string, values: Record<string, string>) {
  const out = template.replace(/\{\{([a-z_.]+)\}\}/g, (_match, key: string) => values[key] ?? "");
  return out.replace(/[ \t]+\n/g, "\n").replace(/\n{2,}/g, "\n").trim();
}

export function compileImagePrompt(brief: Brief): string {
  const portrait = brief.image.orientation !== "landscape";
  const withPhoto = hasPhoto(brief);
  const style = styleDescriptor(brief);
  let modeClause = "";
  if (brief.image.mode === "enhance") modeClause = IMAGE_MODE_CLAUSES.enhance.replace("{{style_descriptor}}", style);
  else if (brief.image.mode === "decorate") modeClause = IMAGE_MODE_CLAUSES.decorate.replace("{{decoration_directives}}", decorationDirectives(brief));
  else modeClause = (withPhoto ? IMAGE_MODE_CLAUSES.transformWithPhoto : IMAGE_MODE_CLAUSES.transformWithoutPhoto).replace("{{style_descriptor}}", style || "one cohesive style");

  const direction = brief.image.mode === "transform"
    ? [describedSubject(brief), brief.image.vision, brief.image.sceneDetail, brief.image.keep ? `Keep recognisable: ${brief.image.keep}` : "", brief.image.options].filter(Boolean).join(" ")
    : brief.image.mode === "enhance" ? `Repaint the photo${brief.image.refinement ? ` with ${brief.image.refinement}` : ""}` : "Keep the photo as it is and add only the listed decorations";

  const caption = brief.image.caption.choice === "none" || !brief.image.caption.text.trim()
    ? CAPTION_CLAUSES.off
    : CAPTION_CLAUSES.on
      .replace("{{caption_text_json}}", JSON.stringify(brief.image.caption.text))
      .replace("{{caption_layout_clause}}", "automatic, readable placement away from faces");

  return fill(IMAGE_BASE_PROMPT, {
    trim_size: portrait ? "5×7 inches" : "7×5 inches",
    orientation: portrait ? "portrait" : "landscape",
    aspect_ratio: portrait ? "5:7" : "7:5",
    occasion_clause: brief.shared.occasion ? `Occasion: ${brief.shared.occasion}.` : "",
    mode_validated_visual_direction: direction,
    intended_feeling: intendedFeeling(brief),
    mode_clause: modeClause,
    bleed_requirement: PRINT_PROFILE.bleed,
    printer_safe_area: PRINT_PROFILE.safeArea,
    caption_strategy_clause: caption,
  });
}

export function compileMusicPrompt(brief: Brief): string | null {
  const preset = genreById(brief.song.genrePresetId);
  if (!preset || brief.song.mode === "none" || !brief.song.mode) return null;
  const pronunciation = brief.song.mode === "vocal" && brief.song.pronunciation && brief.shared.recipientName
    ? `Pronunciation guidance, not performed text: ${brief.shared.recipientName} = ${brief.song.pronunciation}`
    : "";
  const template = brief.song.mode === "instrumental"
    ? MUSIC_PROMPT_TEMPLATE
      .replace("Create one complete original vocal greeting", "Create one complete original instrumental greeting with no vocals")
      .replace(/Perform only the approved words[^\n]*\n/, "")
      .replace("Lyrics:{{approved_lyrics}}", "")
    : MUSIC_PROMPT_TEMPLATE;
  // Instrumental never requests vocals: drop the preset's voice sentences. The first
  // sentence sets the genre, BPM and metre, so it stays, minus the word "vocal"
  // (Jazz Swing's is "Small-band vocal jazz swing at 120 BPM…"; fixed 2026-11-08).
  const production = brief.song.mode === "instrumental"
    ? preset.productionPrompt.split(/(?<=\.)\s+/)
      .map((sentence, index) => (index === 0 ? sentence.replace(/\bvocal\s+/i, "") : sentence))
      .filter((sentence, index) => index === 0 || !/vocal|sing|singer|rapper|rapped|harmon|diction|lyric|words/i.test(sentence)).join(" ")
    : preset.productionPrompt;
  return fill(template, {
    "preset.production_prompt": production,
    music_mood_clause: intendedFeeling(brief),
    language: "English",
    duration_tolerance_seconds: String(LIMITS.songToleranceSeconds),
    pronunciation_clause: pronunciation,
    approved_lyrics: brief.song.lyrics,
  });
}

// ---- Text-writer context ----------------------------------------------------

/**
 * Only explicit facts go to the caption, message and lyric writers: names,
 * relationship, occasion, the customer's own words, the resolved feeling and
 * a short concept meaning. A fantasy scene is labelled as staging.
 */
export function textContext(brief: Brief, insideMessage: string | null = null): TextContext {
  const signoff = SIGNOFF_STYLES.includes(brief.message.signoff) ? brief.message.signoff : "auto";
  return {
    occasion: brief.shared.occasion,
    relationship: brief.shared.relationship,
    recipientName: brief.shared.recipientName,
    senderName: brief.shared.senderName,
    facts: brief.shared.userFacts.map((fact) => fact.text),
    motif: brief.shared.motif,
    intendedFeeling: writerFeeling(brief),
    conceptMeaning: conceptMeaning(brief),
    approvedCaption: brief.image.caption.choice !== "none" && brief.image.caption.text.trim() ? brief.image.caption.text : null,
    insideMessage,
    sensitive: isGentleOccasion(brief.shared.occasion),
    language: "English",
    signoff,
    signoffPolicy: signoffPolicy(signoff, brief.shared.senderName),
  };
}

const SIGNOFF_STYLES: SignoffStyle[] = ["auto", "love", "from", "none"];

/** The sign-off line itself, or "" for none ("auto" is left to the writer). */
export function signoffLine(style: SignoffStyle, sender: string | null) {
  const name = sender?.trim();
  if (!name || style === "none" || style === "auto") return "";
  return style === "love" ? `Love, ${name}` : `From ${name}`;
}

/** Fills {{signoff_policy}}: the customer's choice, and never a made-up sender. */
export function signoffPolicy(style: SignoffStyle, sender: string | null) {
  const name = sender?.trim();
  if (!name) return "No sender name was supplied: add no sign-off and no placeholder name.";
  if (style === "none") return "Add no sign-off.";
  if (style === "auto") return `End with a short sign-off from ${name} that suits the relationship and feeling, on its own line.`;
  return `End with exactly "${signoffLine(style, name)}" on its own line.`;
}

/** The writers' feeling: written direction first, with any vibes the customer also chose. */
export function writerFeeling(brief: Brief) {
  const vibes = vibeLabels(brief).join(", ").toLowerCase();
  if (brief.shared.intendedFeeling && vibes) return `${brief.shared.intendedFeeling}; ${vibes}`;
  return intendedFeeling(brief);
}

function vibeLabels(brief: Brief) {
  return brief.shared.vibes.map((id) => (id === "custom" ? brief.shared.customVibe || "" : labelFor(VIBES, id))).filter(Boolean);
}

/**
 * What's on the front, for the writers. A Transform scene is imagined staging;
 * Decorate keeps the customer's real photo and adds their accessories and lettering.
 */
function conceptMeaning(brief: Brief): string | null {
  if (brief.image.mode === "decorate") {
    const resolved = resolveDecorations(brief);
    const additions = [
      ...resolved.wearables.filter((wearable) => wearable.target).map((wearable) => `a ${wearable.label.toLowerCase()} on ${wearable.target}`),
      resolved.lettering ? `the lettering "${resolved.lettering}"` : "",
    ].filter(Boolean);
    return additions.length ? `Front: the customer's own photo, kept as it is, with ${additions.join(" and ")}` : null;
  }
  const scene = [describedSubject(brief), brief.image.vision, brief.image.sceneDetail].filter(Boolean).join(" ");
  return scene ? `Front artwork (imagined staging, not a real event): ${scene}` : null;
}

function isGentleOccasion(occasion: string | null) {
  return Boolean(occasion && GENTLE_OCCASIONS.has(occasion));
}
