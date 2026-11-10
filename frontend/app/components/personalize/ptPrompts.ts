// Prompt assembly for Personalize a Template. Every cover prompt is the card's
// own generation instructions (filled from the answers) followed by the
// production instructions every card shares (AGENTS.md, owner 2026-11-08).
// The song uses the card's own song prompt once it exists; until then a
// generic placeholder (owner, 2026-11-08). No template braces survive.

import { hasSong, printedMessage } from "../bmc/brief";
import type { TextContext } from "../bmc/engine";
import { compileMusicPrompt, textContext } from "../bmc/compile";
import type { PtBrief } from "./ptBrief";
import type { PtTemplate } from "./types";

/**
 * Bumped 2026-11-08c: the song request uses Build My Card's music prompt with the
 * card's genre preset (the placeholder is retired), and the writers get each card's
 * writer brief (labelled details, guidance, front text).
 */
export const PT_PROMPT_VERSION = "pt-prompts-2026-11-08c";

/** From AGENTS.md, "Include these production instructions in every generation prompt". */
export const PRODUCTION_INSTRUCTIONS = [
  "Create one finished, print-ready, flat greeting-card front for the selected occasion and orientation. Make the result feel personal and polished. Use one cohesive medium, visual language, and finish across one unified, straight-on image. Fill the entire rectangular canvas edge to edge with the artwork. Exclude photographs of cards, folded, angled, or floating cards, product mockups, envelopes, tabletop scenes, hands holding the card, and external shadows.",
  "Keep all important content at least 6% in from every edge. This includes faces, heads, hands, bodies, pets, cover text, meaningful props, key decorative details, and focal objects. Keep them clear of the trim with room to breathe and no clipping. Let the background extend to the edges. Apply any additional bleed and safe-area dimensions supplied by the app.",
].join("\n\n");

/** Shared rights and safety rules from the Personalize reference template (Image and Message Prompts PDF). */
export const ORIGINALITY_RULES = "Do not include trademarked logos, brand names, copyrighted characters, franchise references, celebrity likenesses, public figures, named studio references, designer-branded apparel, official seals, private identifiers, QR codes, barcodes, watermarks or signatures. If children appear, they wear age-appropriate modest clothing in wholesome settings. Preserve the number of people in a group photo unless asked otherwise.";

export function cardFormat(brief: PtBrief) {
  return brief.image.orientation === "landscape" ? "landscape 7 × 5" : "portrait 5 × 7";
}

/** Drops empty clauses and any brace left by a missing value, so no placeholder reaches the model. */
export function clean(text: string) {
  return text.replace(/\{\{[^}]*\}\}/g, "").replace(/[ \t]+([.,;:])/g, "$1").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function compileCoverPrompt(template: PtTemplate, brief: PtBrief) {
  return clean([template.coverInstructions(brief), ORIGINALITY_RULES, PRODUCTION_INSTRUCTIONS].join("\n\n"));
}

/**
 * The song request. Null for No song. Uses Build My Card's music prompt with the
 * chosen genre preset (or the card's suggested one), the card's mood as the
 * emotion, and the pronunciation only when the song may use the name (owner
 * approved PT-SONG-GENRES-PROPOSAL.md, 2026-11-08). A card's own song theme, once
 * written, is added right after the preset's production prompt.
 */
export function compileSongPrompt(template: PtTemplate, brief: PtBrief): string | null {
  if (!hasSong(brief)) return null;
  const vocal = brief.song.mode === "vocal";
  const useName = vocal && brief.personalize.songUse.name === true && Boolean(brief.shared.recipientName);
  const music = compileMusicPrompt({
    ...brief,
    shared: { ...brief.shared, intendedFeeling: songFeeling(template, brief) },
    song: { ...brief.song, genrePresetId: brief.song.genrePresetId || template.songPreset(brief), pronunciation: useName ? brief.song.pronunciation : null },
  });
  if (!music) return null;
  const [production, ...rest] = music.split("\n");
  return clean([
    production,
    template.songPrompt ? `Card theme: ${template.songPrompt}` : "",
    ...rest,
  ].filter(Boolean).join("\n"));
}

/**
 * Context for the inside-message and lyric writers, from the card's writer brief
 * (owner, 2026-11-08): every card detail labelled by how true it is, the words on
 * the front, and the card's writing guidance. Only "fact" details join `facts`;
 * public events, playful framing and imagined staging stay labelled. The song
 * gets the name and the card's detail only when the customer said yes.
 */
export function ptTextContext(template: PtTemplate, brief: PtBrief, purpose: "message" | "lyrics"): TextContext {
  const base = textContext(brief, purpose === "lyrics" ? printedMessage(brief) : null);
  const writer = template.writerBrief(brief);
  const allowDetail = purpose === "message" || brief.personalize.songUse.detail === true;
  const allowName = purpose === "message" || brief.personalize.songUse.name === true;
  // With the name turned off for the song, nothing passed to it may carry the name either.
  const name = brief.shared.recipientName?.trim().toLowerCase();
  const nameFree = (text: string | null) => (text && !allowName && name && text.toLowerCase().includes(name) ? null : text);
  const allowed = (item: { text: string; aboutDetail?: boolean }) => (!item.aboutDetail || allowDetail) && Boolean(nameFree(item.text));
  const details = writer.details.filter(allowed).map(({ kind, text }) => ({ kind, text }));
  return {
    ...base,
    recipientName: allowName ? base.recipientName : null,
    // The customer's own stated facts (from free-text answers) also belong to "the detail" for the song.
    facts: [...(allowDetail ? base.facts.filter((fact) => nameFree(fact)) : []), ...details.filter((d) => d.kind === "fact").map((d) => d.text)],
    motif: allowDetail ? base.motif : null,
    intendedFeeling: songFeeling(template, brief) || base.intendedFeeling,
    conceptMeaning: `${template.name} card`,
    approvedCaption: nameFree(base.approvedCaption),
    labelledDetails: details,
    frontText: writer.frontText.filter(allowed).map((item) => item.text),
    cardGuidance: writer.guidance ? writer.guidance[purpose] : null,
  };
}

/** The customer's written feeling first, then the card's own mood answer; null leaves the shared fallback. */
export function songFeeling(template: PtTemplate, brief: PtBrief) {
  return brief.shared.intendedFeeling || template.writerBrief(brief).mood || null;
}
