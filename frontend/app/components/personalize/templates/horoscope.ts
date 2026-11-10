// Horoscope (Completed Prompts card 01, DRAFT: the owner is still refining it).
// Order (owner, 2026-11-08): names, then the birth month and day (year
// optional), then the photo choice, so every photo branch can be tailored to
// the sign. The app works out the sign; Haiku never does.

import type { PtBrief } from "../ptBrief";
import { field, possessive, usesPhoto } from "../ptBrief";
import {
  captionQuestion, generateQuestion, lyricsQuestion, messageQuestion, namesQuestion, photoModeQuestion, photoSummary, photoQuestion, genreQuestion, songModeQuestion, songUseQuestion,
} from "../sharedQuestions";
import { cardFormat } from "../ptPrompts";
import type { PtTemplate } from "../types";
import { signFor } from "../zodiac";

export function signOf(brief: PtBrief) {
  return signFor(field(brief, "birthDate"));
}

const signName = (b: PtBrief) => signOf(b)?.name || "their sign";
const mode = (b: PtBrief) => b.personalize.photoMode;

const CELEBRATE_LABELS: Record<string, string> = { trait: "A real trait of theirs", memory: "A shared memory or inside joke", wish: "A simple birthday wish" };

function celebration(b: PtBrief) {
  const choice = field(b, "celebrate");
  const detail = field(b, "celebrateDetail");
  if (choice === "wish") return `a simple ${signName(b)} birthday wish`;
  if (choice && detail) return `${choice === "memory" ? "a shared memory" : "a trait they're loved for"}: ${detail}`;
  return choice && !CELEBRATE_LABELS[choice] ? choice : null;
}

function treatment(b: PtBrief) {
  const sign = signName(b);
  switch (mode(b)) {
    case "decorate": return `Place the original photo unchanged inside a frame of ${sign}-inspired artwork. Keep all artwork outside the photo.`;
    case "transform": return `Use the photo as a likeness reference and reimagine the scene: ${field(b, "transformIdea") || `the recipient with the ${sign} symbol`}.`;
    default: return `An original illustration of the ${sign} symbol (${signOf(b)?.symbol || "the sign's symbol"}), ${field(b, "symbolScene") || "arranged as the focal point"}.`;
  }
}

export const horoscope: PtTemplate = {
  id: "horoscope",
  name: "Horoscope",
  version: "horoscope-draft-2026-11-08c",
  occasion: "Birthday",
  defaultOrientation: "portrait",
  photoTreatment: "transform",
  keepOriginal: true,
  photoModeCopy: (b) => {
    const sign = signName(b);
    return {
      none: `We lead with an illustration of the ${sign} symbol.`,
      decorate: `Your original photo, framed with ${sign}-inspired artwork.`,
      transform: `Reimagine them with the ${sign} symbol: interact with it, pose beside it, or become a ${sign}-inspired character.`,
    };
  },
  questions: [
    namesQuestion(),
    {
      id: "H_birthdate", stage: "Details", kind: "date", field: "birthDate", yearRequired: false,
      dateNote: (value) => { const sign = signFor(value); return sign ? `That’s ${sign.name}.` : null; },
      heading: ["Their", "birthday"],
      prompt: (b) => (b.shared.recipientName ? `When is ${possessive(b.shared.recipientName)} birthday? We’ll work out their star sign.` : "When is their birthday? We’ll work out their star sign."),
      helper: "The month and day are enough. Add the year if you like.",
      optional: false, applies: () => true, filled: (b) => Boolean(signOf(b)),
    },
    photoModeQuestion((b) => `Would you like to use a photo on this ${signName(b)} card?`),
    photoQuestion(),
    {
      id: "H_feature", stage: "Photo", kind: "text", field: "feature", heading: ["Who should we", "feature?"],
      prompt: "If there’s more than one person or pet in the photo, who should the card feature?",
      placeholder: "Just Maya, on the left.", optional: true, maxLength: 200,
      applies: (b) => usesPhoto(b) && b.image.references.length > 0, filled: (b) => b.control.answered.includes("H_feature"),
    },
    {
      id: "H_transform", stage: "Design", kind: "suggest", field: "transformIdea", task: "horoscope-transform",
      heading: ["Choose the", "scene"],
      prompt: (b) => `How should they appear with the ${signName(b)} symbol?`,
      writeIn: { label: "Describe my own idea", placeholder: "Floating among the stars with the two fish." },
      optional: false, applies: (b) => mode(b) === "transform", filled: (b) => Boolean(field(b, "transformIdea")),
    },
    {
      id: "H_symbol", stage: "Design", kind: "suggest", field: "symbolScene", task: "horoscope-symbol-scene",
      heading: ["Picture the", "symbol"],
      prompt: (b) => `How should the ${signName(b)} symbol appear on the front?`,
      writeIn: { label: "Describe my own", placeholder: "The two fish circling a full moon." },
      optional: true, applies: (b) => mode(b) === "none", filled: (b) => Boolean(field(b, "symbolScene")),
    },
    {
      id: "H_celebrate", stage: "Design", kind: "choice", field: "celebrate", heading: ["What are we", "celebrating?"],
      prompt: (b) => `What would you like to celebrate about ${b.shared.recipientName || "them"}?`,
      choices: (b) => {
        const sign = signOf(b);
        return [
          { id: "trait", label: CELEBRATE_LABELS.trait, sub: sign ? `Like their ${sign.themes[0]}.` : "Something they’re loved for." },
          { id: "memory", label: CELEBRATE_LABELS.memory, sub: sign ? `Like a favourite day by ${sign.element === "water" ? "the water" : "your side"}.` : "A moment you both remember." },
          { id: "wish", label: CELEBRATE_LABELS.wish, sub: sign ? `A birthday full of ${sign.themes[2]}.` : "No story needed." },
        ];
      },
      writeIn: { label: "Something else", placeholder: "How they make ordinary days feel like an adventure." },
      optional: false, applies: () => true, filled: (b) => Boolean(field(b, "celebrate")),
    },
    {
      id: "H_celebrate_detail", stage: "Design", kind: "text", field: "celebrateDetail",
      heading: (b) => (field(b, "celebrate") === "memory" ? ["Tell us", "what happened"] : ["Tell us", "one thing"]),
      prompt: (b) => (field(b, "celebrate") === "memory" ? "What happened? A sentence or two is plenty." : "Which trait? Tell us one thing about them."),
      placeholder: (b) => (field(b, "celebrate") === "memory" ? "The day we got lost in Lisbon and found the best pastry shop." : "She makes ordinary days feel like an adventure."),
      extract: ["shared.userFacts", "shared.intendedFeeling", "shared.motif"], maxLength: 400,
      optional: false, applies: (b) => ["trait", "memory"].includes(field(b, "celebrate")), filled: (b) => Boolean(field(b, "celebrateDetail")),
    },
    {
      id: "H_mood", stage: "Design", kind: "choice", field: "mood", heading: ["How should it", "feel?"],
      prompt: "Choose the mood for the front and the song.",
      choices: () => [
        { id: "dreamy", label: "Dreamy", sub: "Soft starlight and calm colour." },
        { id: "playful", label: "Playful", sub: "Bright, fun and a little cheeky." },
        { id: "heartfelt", label: "Heartfelt", sub: "Warm, tender and close." },
      ],
      writeIn: { label: "Describe the mood", placeholder: "Mystical, deep blue and gold." },
      optional: true, applies: () => true, filled: (b) => Boolean(field(b, "mood")),
    },
    captionQuestion("H_cover", ["Words on", "the front"], (b) => `Should the front of this ${signName(b)} card say something?`, "horoscope-cover-line",
      "Printed exactly as approved, away from faces."),
    messageQuestion(),
    songModeQuestion(),
    genreQuestion(),
    songUseQuestion("what you’re celebrating"),
    lyricsQuestion(),
    generateQuestion(),
  ],
  detail: (b) => celebration(b),
  detailLabel: "what you’re celebrating",
  // Dreamy: Piano Ballad; Playful: Pop; Heartfelt: Acoustic; a written-in mood: Pop.
  songPreset: (b) => ({ dreamy: "gentle-piano", playful: "bright-pop", heartfelt: "warm-acoustic-folk" } as Record<string, string>)[field(b, "mood")] || "bright-pop",
  writerBrief: (b) => {
    const sign = signOf(b);
    const choice = field(b, "celebrate");
    const detail = field(b, "celebrateDetail");
    const celebrated = choice === "memory" && detail ? `A shared memory: ${detail}`
      : choice === "trait" && detail ? `A trait they're loved for: ${detail}`
      : choice && !CELEBRATE_LABELS[choice] ? `What the sender wants to celebrate about them: ${choice}` : null;
    const scene = mode(b) === "transform" ? field(b, "transformIdea") : mode(b) === "none" ? field(b, "symbolScene") : "";
    const caption = b.image.caption.choice !== "none" ? b.image.caption.text.trim() : "";
    return {
      details: [
        sign ? { kind: "framing" as const, text: `Their star sign is ${sign.name} (${sign.symbol}), worked out from their birthday. Sign themes for playful use only: ${sign.themes.join(", ")}.` } : null,
        celebrated ? { kind: "fact" as const, text: celebrated, aboutDetail: true } : null,
        choice === "wish" ? { kind: "framing" as const, text: "The sender wants a simple birthday wish, no story.", aboutDetail: true } : null,
        scene ? { kind: "staging" as const, text: `Front artwork: ${scene}` } : null,
      ].filter((d): d is NonNullable<typeof d> => d !== null),
      frontText: caption ? [{ text: caption }] : [],
      guidance: {
        message: "This is a Horoscope birthday card. You may mention their sign and its symbol playfully. Never claim astrology says anything true about them or predicts their future.",
        lyrics: "This is a Horoscope birthday song. You may mention their sign lightly; the song is about them, not astrology. Never claim astrology says anything true about them.",
      },
      // The mood question is asked "for the front and the song".
      mood: field(b, "mood") || null,
    };
  },
  sevenInputs: (b) => ({
    storyAndPurpose: `A birthday card for a ${signName(b)}${b.shared.recipientName ? ` (${b.shared.recipientName})` : ""}, celebrating ${celebration(b) || "their birthday"}.`,
    vibe: field(b, "mood") || "dreamy",
    subjectsAndReferences: usesPhoto(b) ? `The people in the supplied photo${field(b, "feature") ? `, featuring ${field(b, "feature")}` : ""}.` : `The ${signName(b)} symbol (${signOf(b)?.symbol || "the sign's symbol"}).`,
    sceneAndAction: mode(b) === "transform" ? field(b, "transformIdea") : mode(b) === "none" ? field(b, "symbolScene") || "the symbol as the focal point" : "inherited from the photo",
    settingAndComposition: mode(b) === "decorate" ? "the photo's layout, with room for the cover words" : "a celestial setting with clear focal placement and room for the cover words",
    visualTreatment: treatment(b),
    captionAndFormat: `${b.image.caption.choice === "none" || !b.image.caption.text ? "No lettering" : `Exactly "${b.image.caption.text}"`}, ${cardFormat(b)}.`,
  }),
  coverInstructions: (b) => {
    const seven = horoscope.sevenInputs(b);
    const words = b.image.caption.choice === "none" || !b.image.caption.text.trim()
      ? "Leave the cover free of lettering."
      : `Add only these words: "${b.image.caption.text.trim()}". Keep them legible and away from faces.`;
    return [
      `Create one finished, print-ready birthday card front in ${cardFormat(b)}. Celebrate ${signName(b)} through ${seven.storyAndPurpose} with a ${seven.vibe} mood.`,
      `Feature ${seven.subjectsAndReferences} Scene and action: ${seven.sceneAndAction}. Setting and composition: ${seven.settingAndComposition}.`,
      `Visual treatment: ${seven.visualTreatment}`,
      mode(b) === "decorate" ? "Generate the surrounding artwork and composite the original photo unchanged into its reserved area." : "",
      words,
    ].filter(Boolean).join("\n");
  },
  frontNotes: (b) => [
    `Sign: ${signName(b)}`,
    ...(b.image.caption.choice === "none" || !b.image.caption.text ? ["No words on the front"] : []),
  ],
  summary: (b) => [
    signOf(b) ? { label: "Sign", value: `${signName(b)} (${field(b, "birthDate").replace(/^--/, "")})`, questionId: "H_birthdate" } : null,
    b.personalize.photoMode ? { label: "Photo", value: photoSummary(b.personalize.photoMode), questionId: "PT_photo_mode" } : null,
    field(b, "transformIdea") ? { label: "Scene", value: field(b, "transformIdea"), questionId: "H_transform" } : null,
    field(b, "symbolScene") ? { label: "Symbol", value: field(b, "symbolScene"), questionId: "H_symbol" } : null,
    celebration(b) ? { label: "Celebrating", value: celebration(b) || "", questionId: "H_celebrate" } : null,
    field(b, "mood") ? { label: "Mood", value: field(b, "mood"), questionId: "H_mood" } : null,
  ].filter((row): row is { label: string; value: string; questionId: string } => row !== null),
  songPrompt: null,
};
