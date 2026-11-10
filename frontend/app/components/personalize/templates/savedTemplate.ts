// For saved drafts of templates that are no longer in the gallery (the 12
// removed on 2026-11-08, and any old pop-up draft without a template id). They
// still open and finish (owner, 2026-11-08) with the questions the old
// pop-up asked: names, photo or description, birthday, front words, inside
// message and song. Never shown in the gallery.

import type { PtBrief } from "../ptBrief";
import { field, usesPhoto } from "../ptBrief";
import {
  photoSummary, captionQuestion, generateQuestion, lookDescription, lookQuestions, lyricsQuestion, messageQuestion, namesQuestion, photoModeQuestion, photoQuestion, genreQuestion, songModeQuestion, songUseQuestion,
} from "../sharedQuestions";
import { cardFormat } from "../ptPrompts";
import type { PtTemplate } from "../types";

import { SAVED_TEMPLATE_ID } from "./ids";

export { SAVED_TEMPLATE_ID };

const cardName = (b: PtBrief) => b.personalize.templateName || "saved";

export const savedTemplate: PtTemplate = {
  id: SAVED_TEMPLATE_ID,
  name: "Saved template",
  version: "saved-template-2026-11-08c",
  occasion: null,
  defaultOrientation: "portrait",
  photoTreatment: "transform",
  keepOriginal: true,
  photoModeCopy: (b) => ({
    none: b.image.subjectDescription ? `We use your description: ${b.image.subjectDescription}` : "Tell us how they look and we’ll draw them in the template’s style.",
    transform: "Reimagine your photo in the template’s style.",
    decorate: "Your original photo, framed with the template’s artwork.",
  }),
  questions: [
    namesQuestion(),
    photoModeQuestion(),
    photoQuestion(),
    ...lookQuestions(),
    {
      id: "L_birthday", stage: "Details", kind: "date", field: "birthDate", yearRequired: false, heading: ["Their", "birthday"],
      prompt: "When is their birthday? Optional, and only used to shape this card.",
      optional: true, applies: (b) => b.shared.occasion === "Birthday", filled: (b) => Boolean(field(b, "birthDate")) || b.control.answered.includes("L_birthday"),
    },
    captionQuestion("L_caption", ["Words on", "the front"], "Should the front say something?", "cover-line"),
    messageQuestion(),
    songModeQuestion(),
    genreQuestion(),
    songUseQuestion("the card’s theme"),
    lyricsQuestion(),
    generateQuestion(),
  ],
  detail: (b) => b.image.subjectDescription || null,
  detailLabel: "the card’s theme",
  // Saved templates are older cards whose files were retired: only the theme and the front words are known.
  songPreset: () => "bright-pop",
  writerBrief: (b) => ({
    details: b.image.subjectDescription ? [{ kind: "staging", text: `The card's theme: ${b.image.subjectDescription}`, aboutDetail: true }] : [],
    frontText: b.image.caption.choice !== "none" && b.image.caption.text.trim() ? [{ text: b.image.caption.text.trim() }] : [],
    guidance: null,
    mood: null,
  }),
  sevenInputs: (b) => ({
    storyAndPurpose: `A ${b.shared.occasion || "greeting"} card in the style of the "${cardName(b)}" template${b.shared.recipientName ? ` for ${b.shared.recipientName}` : ""}.`,
    vibe: b.shared.intendedFeeling || "warm",
    subjectsAndReferences: usesPhoto(b) ? "The people in the supplied photo." : lookDescription(b) ? `The recipient, drawn as the sender describes them: ${lookDescription(b)}.` : b.image.subjectDescription || "Original subjects that suit the template.",
    sceneAndAction: b.image.subjectDescription || "suited to the template",
    settingAndComposition: "Clear focal placement with room for the cover words.",
    visualTreatment: b.personalize.photoMode === "decorate" ? "The original photo unchanged, framed with artwork." : `The "${cardName(b)}" template's look.`,
    captionAndFormat: `${b.image.caption.choice === "none" || !b.image.caption.text ? "No lettering" : `Exactly "${b.image.caption.text}"`}; ${cardFormat(b)}.`,
  }),
  coverInstructions: (b) => {
    const seven = savedTemplate.sevenInputs(b);
    return [
      `Create one finished, print-ready card front in ${cardFormat(b)}. ${seven.storyAndPurpose}`,
      `Feature ${seven.subjectsAndReferences} ${seven.visualTreatment}`,
      b.image.caption.choice === "none" || !b.image.caption.text ? "Leave the cover free of lettering." : `Add only these words: "${b.image.caption.text}". Keep them legible and away from faces.`,
    ].join("\n");
  },
  frontNotes: (b) => (b.image.caption.choice === "none" || !b.image.caption.text ? ["No words on the front"] : []),
  summary: (b) => [
    { label: "Template", value: cardName(b), questionId: "PT_photo_mode" },
    b.personalize.photoMode ? { label: "Photo", value: photoSummary(b.personalize.photoMode), questionId: "PT_photo_mode" } : null,
  ].filter((row): row is { label: string; value: string; questionId: string } => row !== null),
  songPrompt: null,
};
