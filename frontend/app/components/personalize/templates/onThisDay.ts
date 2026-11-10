// On This Day (Completed Prompts card 02, DRAFT). A vintage newspaper birthday
// edition built on one real, verified story from the day they were born
// (birthday only for now, owner 2026-11-08). Research runs on the backend with
// a search tool; mock data mode returns canned verified stories with sources.
// The image model draws all the front text (owner, 2026-11-08), so Review asks
// the customer to check it.

import type { PtBrief } from "../ptBrief";
import { field, usesPhoto } from "../ptBrief";
import {
  photoSummary, generateQuestion, lyricsQuestion, messageQuestion, namesQuestion, photoModeQuestion, photoQuestion, genreQuestion, songModeQuestion, songUseQuestion,
} from "../sharedQuestions";
import { cardFormat } from "../ptPrompts";
import type { PtTemplate } from "../types";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "March 4, 1992" from "1992-03-04". */
export function longDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  return `${MONTHS[Number(match[2]) - 1]} ${Number(match[3])}, ${match[1]}`;
}

const story = (b: PtBrief) => field(b, "storyHeadline");
const mode = (b: PtBrief) => b.personalize.photoMode;

export function defaultMasthead(b: PtBrief) {
  return b.shared.recipientName ? `The ${b.shared.recipientName} Gazette` : "The Birthday Gazette";
}

export const onThisDay: PtTemplate = {
  id: "on-this-day",
  name: "On This Day",
  version: "on-this-day-draft-2026-11-08c",
  occasion: "Birthday",
  defaultOrientation: "portrait",
  photoTreatment: "transform",
  keepOriginal: true,
  recommendNoPhoto: true,
  photoModeCopy: () => ({
    none: "We illustrate the story in vintage newspaper style.",
    transform: "Your photo redrawn as a vintage newspaper picture on the front page. The story stays the focus.",
    decorate: "Your original photo, set into the front page.",
  }),
  questions: [
    namesQuestion(),
    {
      id: "O_birthdate", stage: "Details", kind: "date", field: "birthDate", yearRequired: true,
      heading: ["The day they were", "born"],
      prompt: (b) => `When was ${b.shared.recipientName || "the birthday person"} born? We need the full date, including the year.`,
      helper: "We look up real stories from that exact day.",
      optional: false, applies: () => true, filled: (b) => Boolean(longDate(field(b, "birthDate"))),
    },
    {
      id: "O_location", stage: "Details", kind: "text", field: "location", heading: ["Where were they", "born?"],
      prompt: "Which city or country were they born in? We’ll look for stories there first, then worldwide.",
      placeholder: "Halifax, Canada", optional: true, maxLength: 80,
      applies: () => true, filled: (b) => b.control.answered.includes("O_location"),
    },
    {
      id: "O_story", stage: "Design", kind: "candidates", task: "otd-research", heading: ["Pick the", "lead story"],
      prompt: (b) => `Here are real stories from ${longDate(field(b, "birthDate")) || "that day"}. Pick the one to build the front around.`,
      helper: "Each story was checked against its source. Positive stories come first.",
      optional: false, applies: (b) => Boolean(longDate(field(b, "birthDate"))), filled: (b) => Boolean(story(b)),
    },
    photoModeQuestion(() => "Would you like to add a photo to the front page?"),
    photoQuestion(),
    {
      id: "O_photo_role", stage: "Photo", kind: "text", field: "photoRole", heading: ["Who’s in", "the photo?"],
      prompt: "Who’s in the photo, and where should they appear on the front page?",
      placeholder: "My dad, as a small picture beside the headline.", optional: true, maxLength: 200,
      applies: (b) => usesPhoto(b) && b.image.references.length > 0, filled: (b) => b.control.answered.includes("O_photo_role"),
    },
    {
      id: "O_headline", stage: "Words", kind: "suggest", field: "headline", task: "otd-headlines", heading: ["Write the", "headline"],
      prompt: "Choose a birthday headline that links the story to their birthday, or write your own.",
      helper: "The birthday wordplay stays separate from the facts of the story.",
      writeIn: { label: "Write my own headline", placeholder: "Born the Same Day the World Looked Up" },
      optional: false, applies: (b) => Boolean(story(b)), filled: (b) => Boolean(field(b, "headline")),
    },
    {
      id: "O_front_copy", stage: "Words", kind: "form", heading: ["The rest of", "the front page"],
      prompt: "Confirm the paper’s name and add a short caption about the story if you like.",
      helper: "The full date is printed under the masthead. Avoid real newspaper names.",
      inputs: [
        { key: "masthead", label: "Newspaper name", placeholder: "The Birthday Gazette", maxLength: 40, initial: defaultMasthead },
        { key: "factCaption", label: "Short caption about the story (optional)", placeholder: "Pictured: an illustration of the launch", optional: true, maxLength: 80 },
      ],
      optional: false, applies: (b) => Boolean(field(b, "headline")), filled: (b) => Boolean(field(b, "masthead")),
    },
    messageQuestion(),
    songModeQuestion(),
    genreQuestion(),
    songUseQuestion("the story"),
    lyricsQuestion(),
    generateQuestion(),
  ],
  detail: (b) => (story(b) ? `the story from the day they were born: ${story(b)}` : null),
  detailLabel: "the story",
  songPreset: () => "jazz-swing",
  writerBrief: (b) => {
    const date = longDate(field(b, "birthDate"));
    const summary = field(b, "storySummary");
    const source = field(b, "storySource");
    return {
      details: [
        story(b) ? { kind: "public-event" as const, aboutDetail: true, text: `On ${date || "the day they were born"}: ${story(b)}${summary ? `. ${summary}` : ""}${source ? ` (source: ${source})` : ""}. A real event, not about them.` } : null,
        field(b, "headline") ? { kind: "framing" as const, aboutDetail: true, text: `The front-page headline "${field(b, "headline")}" is birthday wordplay, not a fact.` } : null,
        field(b, "location") ? { kind: "fact" as const, text: `They were born in ${field(b, "location")}.` } : null,
      ].filter((d): d is NonNullable<typeof d> => d !== null),
      frontText: [
        field(b, "masthead") ? { text: field(b, "masthead") } : null,
        date ? { text: date } : null,
        field(b, "headline") ? { text: field(b, "headline"), aboutDetail: true } : null,
        field(b, "factCaption") ? { text: field(b, "factCaption"), aboutDetail: true } : null,
      ].filter((t): t is NonNullable<typeof t> => t !== null),
      guidance: {
        message: "This is an On This Day birthday card: a vintage newspaper front page built on a real event from the day they were born. You may link their birth to that event. Keep the event's facts exactly as supplied and keep the headline's wordplay separate from them. Don't work out or state their age.",
        lyrics: "This is an On This Day birthday song about the day they were born. You may link their birth to the day's real event. Keep its facts exactly as supplied. Don't work out or state their age.",
      },
      mood: null,
    };
  },
  sevenInputs: (b) => ({
    storyAndPurpose: `A birthday card built on one verified story from ${longDate(field(b, "birthDate"))}: ${story(b)} (${field(b, "storySource")}). The birthday connection is a playful editorial line, separate from the facts.`,
    vibe: "the tone of the approved headline",
    subjectsAndReferences: usesPhoto(b) ? `The supplied photo${field(b, "photoRole") ? ` (${field(b, "photoRole")})` : ""}, with the story as the editorial focus.` : "The places, objects or symbols of the story. No likeness of any real public figure.",
    sceneAndAction: `A verified moment or a representative symbolic detail from the story: ${field(b, "storySummary")}`,
    settingAndComposition: "A vintage newspaper layout with a masthead, the exact date and one lead headline.",
    visualTreatment: `Vintage newspaper illustration with ink and paper texture${mode(b) && mode(b) !== "none" ? `; ${mode(b) === "decorate" ? "the supplied photo set in unchanged" : "the supplied photo redrawn as a newspaper picture"}` : ""}.`,
    captionAndFormat: `Masthead "${field(b, "masthead")}", date "${longDate(field(b, "birthDate"))}", headline "${field(b, "headline")}"${field(b, "factCaption") ? `, caption "${field(b, "factCaption")}"` : ""}; ${cardFormat(b)}.`,
  }),
  coverInstructions: (b) => {
    const seven = onThisDay.sevenInputs(b);
    const photo = mode(b) === "decorate"
      ? "Composite the original photo unchanged into a reserved picture area."
      : mode(b) === "transform" ? "Use the supplied photo as a likeness reference and redraw it as a vintage newspaper picture within the front page." : "";
    return [
      `Create a single flat, edge-to-edge birthday card front in ${cardFormat(b)}, styled as a vintage newspaper birthday edition.`,
      `Use this verified story as the sole story: ${story(b)}. ${field(b, "storySummary")}`,
      `Illustrate ${seven.sceneAndAction} as a vintage newspaper illustration. Present it as an illustration, not a photograph, and show no likeness of real public figures.`,
      photo,
      `Set only this text, exactly: the masthead "${field(b, "masthead")}", the date "${longDate(field(b, "birthDate"))}", the headline "${field(b, "headline")}"${field(b, "factCaption") ? `, and the caption "${field(b, "factCaption")}"` : ""}. Use a clear hierarchy that reads at card size. Add no other words, and never imitate a real newspaper's name or masthead.`,
    ].filter(Boolean).join("\n");
  },
  frontNotes: (b) => [
    `Lead story: ${story(b)}`,
  ],
  summary: (b) => [
    longDate(field(b, "birthDate")) ? { label: "Born", value: `${longDate(field(b, "birthDate"))}${field(b, "location") ? `, ${field(b, "location")}` : ""}`, questionId: "O_birthdate" } : null,
    story(b) ? { label: "Lead story", value: story(b), questionId: "O_story" } : null,
    b.personalize.photoMode ? { label: "Photo", value: photoSummary(b.personalize.photoMode), questionId: "PT_photo_mode" } : null,
    field(b, "headline") ? { label: "Headline", value: field(b, "headline"), questionId: "O_headline" } : null,
    field(b, "masthead") ? { label: "Newspaper", value: field(b, "masthead"), questionId: "O_front_copy" } : null,
  ].filter((row): row is { label: string; value: string; questionId: string } => row !== null),
  songPrompt: null,
};
