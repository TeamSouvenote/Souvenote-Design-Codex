// Comic Card (Completed Prompts card 03, DRAFT). The recipient stars in a
// four-panel comic strip (2 × 2 grid). A photo is only a likeness reference
// (Transform); without one, the customer describes them or approves an
// original character. The storyboard allows at most 2 short bubbles or
// captions per panel, about 8 words each (owner, 2026-11-08), and the image
// model draws them, so Review asks for a spelling check.

import type { PtBrief } from "../ptBrief";
import { field } from "../ptBrief";
import {
  generateQuestion, lookDescription, lookQuestions, lyricsQuestion, messageQuestion, namesQuestion, photoModeQuestion, photoQuestion, genreQuestion, songModeQuestion, songUseQuestion,
} from "../sharedQuestions";
import { cardFormat } from "../ptPrompts";
import type { PtTemplate } from "../types";

export const COMIC_LIMITS = { panels: 4, letteringPerPanel: 2, wordsPerLettering: 8 } as const;

const STORY_TYPES: Record<string, string> = { memory: "A shared memory or inside joke", habit: "An exaggerated everyday habit", adventure: "An invented adventure" };

function storyLine(b: PtBrief) {
  const type = field(b, "storyType");
  if (type === "adventure") return field(b, "premise") ? `an invented adventure: ${field(b, "premise")}` : "an invented adventure";
  if (type === "memory" || type === "habit") return field(b, "storyDetail") ? `${type === "memory" ? "a shared memory" : "an everyday habit, exaggerated"}: ${field(b, "storyDetail")}` : STORY_TYPES[type].toLowerCase();
  return type || null;
}

function storyboardText(b: PtBrief) {
  const panels = b.personalize.storyboard?.panels || [];
  return panels.map((panel, index) => {
    const words = panel.lettering.filter((line) => line.trim());
    return `Panel ${index + 1}: ${panel.action}${words.length ? ` Lettering: ${words.map((line) => `"${line.trim()}"`).join(" / ")}.` : " No lettering."}`;
  }).join("\n");
}

function character(b: PtBrief) {
  if (b.personalize.photoMode === "transform") return "the recipient, drawn from the supplied photo as a recognizable comic character";
  const look = lookDescription(b);
  if (look) return `the recipient as a comic character who looks like this (as described by the sender): ${look}`;
  return field(b, "character") || "an original comic character";
}

export const comicCard: PtTemplate = {
  id: "comic-card",
  name: "Comic Card",
  version: "comic-card-draft-2026-11-08c",
  occasion: null,
  defaultOrientation: "portrait",
  photoTreatment: "transform",
  keepOriginal: false,
  photoModeCopy: () => ({
    none: "Tell us how they look, or we’ll suggest an original character for you to approve.",
    transform: "Use a photo so their comic character looks like them.",
  }),
  questions: [
    namesQuestion(),
    photoModeQuestion((b) => `Should we draw ${b.shared.recipientName || "them"} from a photo?`),
    photoQuestion(),
    ...lookQuestions(),
    {
      // Skipped the description: offer an original character concept to approve (Comic Card map).
      id: "C_character", stage: "Photo", kind: "suggest", field: "character", task: "comic-character",
      heading: ["Meet the", "hero"],
      prompt: (b) => `Pick an original comic character for ${b.shared.recipientName || "them"}, or describe one.`,
      helper: "We never guess what someone looks like from their name.",
      writeIn: { label: "Describe a character myself", placeholder: "A caped hero in a yellow raincoat with a trusty umbrella." },
      optional: false,
      applies: (b) => b.personalize.photoMode === "none" && !lookDescription(b)
        && (b.control.answered.includes("PT_look") || b.control.skippedOptionalFields.includes("PT_look")),
      filled: (b) => Boolean(field(b, "character")),
    },
    {
      id: "C_occasion", stage: "Design", kind: "choice", field: "occasion", heading: ["What’s the", "occasion?"],
      prompt: "What’s the comic for?",
      choices: () => ["Birthday", "Just Because", "Congratulations", "Thank You", "Father's Day", "Mother's Day", "Anniversary"].map((label) => ({ id: label, label })),
      writeIn: { label: "Another occasion", placeholder: "Retirement" },
      optional: false, applies: () => true, filled: (b) => Boolean(b.shared.occasion),
    },
    {
      id: "C_story_type", stage: "Design", kind: "choice", field: "storyType", heading: ["What’s the", "story?"],
      prompt: "What should the strip be about?",
      choices: () => Object.entries(STORY_TYPES).map(([id, label]) => ({ id, label })),
      writeIn: { label: "Something else", placeholder: "Dad's legendary battle with the barbecue." },
      optional: false, applies: () => true, filled: (b) => Boolean(field(b, "storyType")),
    },
    {
      id: "C_story_detail", stage: "Design", kind: "text", field: "storyDetail",
      heading: (b) => (field(b, "storyType") === "habit" ? ["The", "habit"] : ["What", "happened?"]),
      prompt: (b) => (field(b, "storyType") === "habit"
        ? "What do they do, and what happens when it’s exaggerated?"
        : "What happened, and what made it funny or memorable?"),
      placeholder: (b) => (field(b, "storyType") === "habit"
        ? "He reads every manual cover to cover, so in the comic he reads one to a confused robot."
        : "The camping trip where the tent blew away and we slept in the car."),
      extract: ["shared.userFacts", "shared.intendedFeeling", "shared.motif"], maxLength: 500,
      optional: false, applies: (b) => ["memory", "habit"].includes(field(b, "storyType")), filled: (b) => Boolean(field(b, "storyDetail")),
    },
    {
      id: "C_premise", stage: "Design", kind: "suggest", field: "premise", task: "comic-premise", heading: ["Choose the", "adventure"],
      prompt: "Pick a premise for the adventure, or write your own.",
      writeIn: { label: "Write my own premise", placeholder: "She saves the town bake sale from a runaway cake." },
      optional: false, applies: (b) => field(b, "storyType") === "adventure", filled: (b) => Boolean(field(b, "premise")),
    },
    {
      id: "C_ending", stage: "Design", kind: "suggest", field: "ending", task: "comic-ending", heading: ["How does it", "end?"],
      prompt: "How should the last panel land? Skip this if your story already has an ending.",
      writeIn: { label: "Write my own ending", placeholder: "Everyone ends up laughing in the car." },
      optional: true, applies: (b) => Boolean(storyLine(b)), filled: (b) => Boolean(field(b, "ending")),
    },
    {
      id: "C_storyboard", stage: "Design", kind: "storyboard", task: "comic-storyboard", heading: ["Your", "storyboard"],
      prompt: "Here’s your strip in four panels. Edit any panel, then approve it.",
      helper: `Setup, escalation, turn and payoff. Up to ${COMIC_LIMITS.letteringPerPanel} short bubbles or captions per panel, about ${COMIC_LIMITS.wordsPerLettering} words each.`,
      optional: false, applies: (b) => Boolean(storyLine(b)),
      filled: (b) => Boolean(b.personalize.storyboard && b.personalize.storyboard.approvedVersion === b.personalize.storyboard.version),
    },
    {
      id: "C_style", stage: "Design", kind: "suggest", field: "style", task: "comic-style", heading: ["Choose a", "comic style"],
      prompt: "Which comic style fits the story?",
      writeIn: { label: "Describe another comic style", placeholder: "Moody black-and-white noir." },
      optional: false, applies: (b) => Boolean(b.personalize.storyboard), filled: (b) => Boolean(field(b, "style")),
    },
    messageQuestion(),
    songModeQuestion(),
    genreQuestion(),
    songUseQuestion("the comic"),
    lyricsQuestion(),
    generateQuestion(),
  ],
  detail: (b) => (storyLine(b) ? `the comic about ${storyLine(b)}` : null),
  detailLabel: "the comic",
  songPreset: () => "pop-rock",
  writerBrief: (b) => {
    const type = field(b, "storyType");
    const detail = field(b, "storyDetail");
    const lettering = (b.personalize.storyboard?.panels || []).flatMap((panel) => panel.lettering.map((line) => line.trim()).filter(Boolean));
    return {
      details: [
        type === "memory" && detail ? { kind: "fact" as const, aboutDetail: true, text: `A shared memory the comic is based on: ${detail}` } : null,
        type === "habit" && detail ? { kind: "fact" as const, aboutDetail: true, text: `An everyday habit of theirs: ${detail}` } : null,
        type === "habit" ? { kind: "staging" as const, aboutDetail: true, text: "In the comic the habit is exaggerated for fun." } : null,
        type === "adventure" && field(b, "premise") ? { kind: "staging" as const, aboutDetail: true, text: `An invented comic adventure: ${field(b, "premise")}` } : null,
        // A write-in story idea may be real or invented, so it's treated as staging.
        type && !STORY_TYPES[type] ? { kind: "staging" as const, aboutDetail: true, text: `The comic's story idea: ${type}` } : null,
        field(b, "ending") ? { kind: "staging" as const, aboutDetail: true, text: `How the comic ends: ${field(b, "ending")}` } : null,
      ].filter((d): d is NonNullable<typeof d> => d !== null),
      frontText: lettering.map((text) => ({ text, aboutDetail: true })),
      guidance: {
        message: "This is a four-panel Comic Card. You may call back to the comic's story or punchline. The comic's plot and ending are invented staging; only details marked as facts really happened.",
        lyrics: "This is a song for a four-panel Comic Card. You may call back to the comic's story or punchline. The comic's plot and ending are invented; only details marked as facts really happened.",
      },
      mood: null,
    };
  },
  sevenInputs: (b) => ({
    storyAndPurpose: `A ${b.shared.occasion || "greeting"} card: a four-panel comic about ${storyLine(b) || "the recipient"}${field(b, "ending") ? `, ending with ${field(b, "ending")}` : ""}.`,
    vibe: b.shared.intendedFeeling || "the tone of the approved storyboard",
    subjectsAndReferences: `${character(b)}, the same in every panel.`,
    sceneAndAction: storyboardText(b),
    settingAndComposition: "A 2 × 2 grid with clear gutters: panels 1 and 2 across the top, 3 and 4 across the bottom.",
    visualTreatment: `${field(b, "style") || "one comic style"}, consistent across all four panels.`,
    captionAndFormat: `Only the approved panel lettering; ${cardFormat(b)}.`,
  }),
  coverInstructions: (b) => [
    `Create one print-ready greeting-card front in ${cardFormat(b)} for ${b.shared.occasion || "a greeting card"}.`,
    "Render this approved storyboard as four distinct panels in a 2 × 2 grid, read left to right, top to bottom:",
    storyboardText(b),
    `Use ${field(b, "style") || "one consistent comic style"} and the tone of the story. Feature ${character(b)} in every panel, keeping their features and wardrobe consistent unless the storyboard changes them.`,
    "Draw only the approved lettering, in the right panel and reading order, in clear speech bubbles or caption boxes. Keep lettering clear of faces and important action. Add no other words.",
  ].join("\n"),
  frontNotes: (b) => [
    `Style: ${field(b, "style")}`,
  ],
  summary: (b) => [
    b.personalize.photoMode ? { label: "Hero", value: b.personalize.photoMode === "transform" ? "Drawn from your photo" : lookDescription(b) || field(b, "character") || "Original character", questionId: b.personalize.photoMode === "transform" ? "PT_photo_mode" : lookDescription(b) ? "PT_look" : "C_character" } : null,
    b.shared.occasion ? { label: "Occasion", value: b.shared.occasion, questionId: "C_occasion" } : null,
    storyLine(b) ? { label: "Story", value: storyLine(b) || "", questionId: "C_story_type" } : null,
    b.personalize.storyboard ? { label: "Storyboard", value: b.personalize.storyboard.approvedVersion === b.personalize.storyboard.version ? "Approved" : "Not approved yet", questionId: "C_storyboard" } : null,
    field(b, "style") ? { label: "Style", value: field(b, "style"), questionId: "C_style" } : null,
  ].filter((row): row is { label: string; value: string; questionId: string } => row !== null),
  songPrompt: null,
};
