// The Build My Card question bank. The application owns this list: which
// questions exist, which fields and controls each may touch, when each
// applies and when it counts as answered. The interviewer (Haiku, or the mock
// rule engine on this branch) may only tailor the wording of the question it
// proposes, and its proposal is accepted only if that question applies and is
// still open. Order here is the canonical order: photo first, then basics,
// then the chosen mode and its prerequisite, direct selections, vision or
// refinement, caption, and finally message and song.

import type { Brief, Stage } from "./brief";
import { hasPhoto, hasPurpose } from "./brief";
import type { LookDetail } from "./lookDetails";
import { LOOK_DETAILS, MAX_LOOK_FOLLOW_UPS, describesAPerson } from "./lookDetails";

export type QuestionKind =
  | "photo" | "primary" | "same-subject" | "story" | "occasion" | "people" | "orientation" | "purpose"
  | "mode" | "style" | "text" | "refine" | "decorate-what" | "accents" | "wearables" | "wearer" | "border" | "border-colour"
  | "vibes" | "caption" | "image-summary" | "message" | "song-mode" | "genre" | "lyrics" | "generate"
  | "stickers" | "pattern" | "sparkle";

export type Question = {
  id: string;
  stage: Stage;
  kind: QuestionKind;
  /** Heading as [plain words, script phrase]: one script phrase per heading. */
  heading: [string, string];
  /** Default question sentence; the interviewer may tailor it. */
  prompt: string;
  helper?: string;
  placeholder?: string;
  optional: boolean;
  /** Field paths the interviewer may update from this answer. */
  fields: string[];
  controlIds: string[];
  applies: (brief: Brief) => boolean;
  filled: (brief: Brief) => boolean;
};

const always = () => true;
const isMode = (brief: Brief, mode: string) => brief.image.mode === mode;
const wants = (brief: Brief, what: string) => brief.image.decorations.wants.includes(what);

const SHARED_FROM_TEXT = [
  "shared.occasion", "shared.recipientName", "shared.relationship", "shared.senderName",
  "shared.intendedFeeling", "shared.motif", "shared.userFacts",
];

/** The look follow-up question for each detail (declared before the bank, which uses it). */
export const LOOK_QUESTION_IDS: Record<LookDetail["id"], string> = { hair: "P4_look_hair", style: "P4_look_style", signature: "P4_look_signature" };

export const QUESTION_BANK: Question[] = [
  // ---- Photo ----------------------------------------------------------------
  {
    id: "P1_photo", stage: "Photo", kind: "photo", heading: ["Start with a", "photo"],
    prompt: "Add a photo of who the card is about, or describe them instead.",
    helper: "JPEG, PNG or WEBP, up to 16 photos. Photos are private and only used for this card.",
    optional: false, fields: [], controlIds: ["photo_upload", "describe_instead"],
    applies: always,
    filled: (b) => b.control.answered.includes("P1_photo")
      && (b.control.photoSkipped === true || (b.image.references.length > 0 && b.control.attestedBatches > 0)),
  },
  {
    id: "P2_primary", stage: "Photo", kind: "primary", heading: ["Which one is the", "main photo?"],
    prompt: "Which photo should we build the front from? The others help us keep everyone recognisable.",
    optional: false, fields: [], controlIds: ["primary_photo"],
    applies: (b) => hasPhoto(b) && b.image.references.length > 1,
    filled: (b) => b.control.answered.includes("P2_primary") && Boolean(b.image.primaryReferenceId),
  },
  {
    id: "P3_subjects", stage: "Photo", kind: "same-subject", heading: ["Who's in", "these photos?"],
    prompt: "Do these photos show the same person or pet, or different ones?",
    optional: false, fields: [], controlIds: ["same_subject"],
    applies: (b) => hasPhoto(b) && b.image.references.length > 1,
    filled: (b) => Boolean(b.image.sameSubject),
  },

  // ---- No photo: describe how they look (owner, 2026-11-08) ----------------
  // Up to two follow-ups after "Describe them instead", each only for a detail
  // the description leaves out (hair, then clothes, then anything they're known
  // for). Only when the description is about a person; skipping one ends them.
  ...LOOK_DETAILS.map((detail): Question => ({
    id: LOOK_QUESTION_IDS[detail.id], stage: "Photo", kind: "text", heading: detail.heading,
    prompt: detail.prompt(null), placeholder: detail.placeholder,
    helper: "Optional. Skip it if you’d rather leave it to us.",
    optional: true, fields: [], controlIds: [`look_${detail.id}`],
    applies: (b) => lookFollowUpApplies(b, detail.id),
    filled: (b) => b.control.answered.includes(LOOK_QUESTION_IDS[detail.id]),
  })),

  // ---- Basics ---------------------------------------------------------------
  {
    id: "B0_story", stage: "Basics", kind: "story", heading: ["Tell us about", "the moment"],
    prompt: "Who's this card for, and what's the moment?",
    helper: "A sentence or two is plenty. Share a memory, an inside joke or what you want them to feel, if you like.",
    placeholder: "It's my sister Maya's birthday. She loves gardening and we're always teasing each other.",
    optional: true, fields: SHARED_FROM_TEXT, controlIds: ["story_text"],
    applies: always, filled: () => false,
  },
  {
    id: "B1_occasion", stage: "Basics", kind: "occasion", heading: ["What's the", "occasion?"],
    prompt: "What's the occasion?", optional: true, fields: ["shared.occasion"], controlIds: ["occasion"],
    applies: always, filled: (b) => Boolean(b.shared.occasion),
  },
  {
    id: "B2_people", stage: "Basics", kind: "people", heading: ["Who it's", "from and to"],
    prompt: "Who's it for, and who's it from?",
    helper: "All optional. We use names in the inside message and song, never on the front unless you ask.",
    optional: true, fields: ["shared.recipientName", "shared.relationship", "shared.senderName", "song.pronunciation"],
    controlIds: ["recipient_name", "relationship", "sender_name", "pronunciation"],
    applies: always,
    // Always shown once, pre-filled from the story, so names can be confirmed and a pronunciation added.
    filled: () => false,
  },
  {
    id: "B6_orientation", stage: "Basics", kind: "orientation", heading: ["Pick the card's", "shape"],
    prompt: "Should the card stand tall or lie wide?", optional: false, fields: ["image.orientation"], controlIds: ["orientation"],
    applies: always, filled: (b) => Boolean(b.image.orientation),
  },
  {
    id: "B7_purpose", stage: "Basics", kind: "purpose", heading: ["What should it", "say to them?"],
    prompt: "What should this card say to them?",
    helper: "For example: happy birthday, thank you for everything, or thinking of you.",
    optional: false, fields: SHARED_FROM_TEXT, controlIds: ["purpose_text"],
    applies: (b) => !hasPurpose(b), filled: hasPurpose,
  },

  // ---- Image ------------------------------------------------------------------
  {
    id: "I1_mode", stage: "Image", kind: "mode", heading: ["Choose a", "blueprint"],
    prompt: "How should we use your photo?", optional: false, fields: ["image.mode"], controlIds: ["image_mode"],
    applies: always, filled: (b) => Boolean(b.image.mode),
  },
  {
    id: "I2_style", stage: "Image", kind: "style", heading: ["Choose a", "visual style"],
    prompt: "Which visual style fits the idea?", optional: false, fields: ["image.style", "image.customStyle"], controlIds: ["style", "custom_style"],
    applies: (b) => isMode(b, "transform") || isMode(b, "enhance"),
    filled: (b) => Boolean(b.image.style && (b.image.style !== "custom" || b.image.customStyle)),
  },
  {
    id: "T1_scene", stage: "Image", kind: "text", heading: ["Picture the", "front"],
    prompt: "What should we create for the front? Who or what is in it, and where are they?",
    placeholder: "Maya riding a giant carrot through a sunny vegetable garden.",
    optional: false, fields: ["image.vision", ...SHARED_FROM_TEXT], controlIds: ["vision_text"],
    applies: (b) => isMode(b, "transform"), filled: (b) => Boolean(b.image.vision),
  },
  {
    id: "T2_detail", stage: "Image", kind: "text", heading: ["A little more", "detail"],
    prompt: "What's happening in the scene, and where does it take place?",
    placeholder: "She's waving a trowel like a sword, with sunflowers towering behind her.",
    optional: true, fields: ["image.sceneDetail"], controlIds: ["detail_text"],
    applies: (b) => isMode(b, "transform") && !hasPhoto(b) && Boolean(b.image.vision) && wordTotal(b.image.vision) < 8,
    filled: (b) => Boolean(b.image.sceneDetail),
  },
  {
    id: "T4_keep", stage: "Image", kind: "text", heading: ["Who should we", "keep recognisable?"],
    prompt: "Which people and pets from your photo should stay recognisable?",
    placeholder: "Both of us and our dog, Biscuit.",
    optional: true, fields: ["image.keep"], controlIds: ["keep_text"],
    applies: (b) => isMode(b, "transform") && hasPhoto(b), filled: (b) => Boolean(b.image.keep),
  },
  {
    id: "T3_options", stage: "Image", kind: "text", heading: ["Anything to", "add or avoid?"],
    prompt: "Any era, props, outfits or things to leave out?",
    placeholder: "1970s colours, a straw hat on Maya, no other people.",
    optional: true, fields: ["image.options"], controlIds: ["options_text"],
    applies: (b) => isMode(b, "transform"), filled: (b) => Boolean(b.image.options),
  },
  {
    id: "E2_refine", stage: "Image", kind: "refine", heading: ["Set the", "finish"],
    prompt: "Would you like warm nostalgic light, cool dramatic light, or leave the finish to us?",
    optional: true, fields: ["image.refinement"], controlIds: ["refinement"],
    applies: (b) => isMode(b, "enhance") && ["cinematic", "realistic", "artistic", "vintage"].includes(b.image.style || ""),
    filled: (b) => Boolean(b.image.refinement),
  },
  {
    id: "D1_what", stage: "Image", kind: "decorate-what", heading: ["How should we", "decorate it?"],
    prompt: "What would you like to add to your photo?",
    helper: "Pick any. Your photo stays a photo; we only add what you choose.",
    optional: false, fields: [], controlIds: ["decorate_what"],
    applies: (b) => isMode(b, "decorate"), filled: (b) => b.image.decorations.wants.length > 0,
  },
  {
    id: "D2_accents", stage: "Image", kind: "accents", heading: ["Choose your", "accents"],
    prompt: "Which accents should we add around the photo?",
    helper: "Two or three kinds usually look cleanest.",
    optional: false, fields: [], controlIds: ["accents"],
    applies: (b) => isMode(b, "decorate") && wants(b, "accents"), filled: (b) => b.image.decorations.accents.length > 0,
  },
  {
    id: "D3_wearables", stage: "Image", kind: "wearables", heading: ["Add a little", "something to wear"],
    prompt: "Which accessory should we add?", optional: false, fields: [], controlIds: ["wearables"],
    applies: (b) => isMode(b, "decorate") && wants(b, "wearables"), filled: (b) => b.image.decorations.wearables.length > 0,
  },
  {
    id: "D3a_wearer", stage: "Image", kind: "wearer", heading: ["Who's", "wearing it?"],
    prompt: "Who should wear each accessory?", helper: "We never guess, so faces and outfits stay as they are.",
    optional: false, fields: [], controlIds: ["wearer"],
    applies: (b) => isMode(b, "decorate") && b.image.decorations.wearables.length > 0,
    filled: (b) => b.image.decorations.wearables.every((w) => Boolean(w.target)),
  },
  {
    id: "D4_border", stage: "Image", kind: "border", heading: ["Frame it with a", "border"],
    prompt: "Which border suits it?", optional: false, fields: [], controlIds: ["border_style"],
    applies: (b) => isMode(b, "decorate") && wants(b, "border"), filled: (b) => Boolean(b.image.decorations.border.style),
  },
  {
    id: "D5_colour", stage: "Image", kind: "border-colour", heading: ["Pick a border", "colour"],
    prompt: "What colour should the border be?", optional: false, fields: [], controlIds: ["border_colour", "custom_colour"],
    applies: (b) => isMode(b, "decorate") && Boolean(b.image.decorations.border.style) && b.image.decorations.border.style !== "no-border",
    filled: (b) => Boolean(b.image.decorations.border.colour && (b.image.decorations.border.colour !== "custom-colour" || b.image.decorations.border.customColour)),
  },
  {
    id: "D7_stickers", stage: "Image", kind: "stickers", heading: ["Add some", "stickers"],
    prompt: "Which stickers and doodles should we add? Choose up to three.", helper: "We place them in open space, never over faces.",
    optional: false, fields: [], controlIds: ["stickers", "custom_sticker"],
    applies: (b) => isMode(b, "decorate") && wants(b, "stickers"),
    filled: (b) => b.image.decorations.stickers.length > 0 && (!b.image.decorations.stickers.includes("custom") || Boolean(b.image.decorations.customSticker)),
  },
  {
    id: "D8_pattern", stage: "Image", kind: "pattern", heading: ["Pick a", "background pattern"],
    prompt: "Which pattern should go behind everyone?", helper: "Only the background changes. People and pets stay exactly as they are.",
    optional: false, fields: [], controlIds: ["pattern", "custom_pattern"],
    applies: (b) => isMode(b, "decorate") && wants(b, "pattern"),
    filled: (b) => Boolean(b.image.decorations.pattern && (b.image.decorations.pattern !== "custom" || b.image.decorations.customPattern)),
  },
  {
    id: "D9_sparkle", stage: "Image", kind: "sparkle", heading: ["Add some", "sparkle"],
    prompt: "Which light effect should we add?", helper: "Kept soft so faces stay clear.",
    optional: false, fields: [], controlIds: ["sparkle", "custom_sparkle"],
    applies: (b) => isMode(b, "decorate") && wants(b, "sparkle"),
    filled: (b) => Boolean(b.image.decorations.sparkle && (b.image.decorations.sparkle !== "custom" || b.image.decorations.customSparkle)),
  },
  {
    id: "D10_lettering", stage: "Image", kind: "text", heading: ["Names and", "dates"],
    prompt: "What should we letter onto the photo?", helper: "A name, a date or a few words. This is separate from the caption.",
    placeholder: "Linda · 12 May 2026",
    optional: false, fields: [], controlIds: ["lettering"],
    applies: (b) => isMode(b, "decorate") && wants(b, "lettering"), filled: (b) => Boolean(b.image.decorations.lettering),
  },
  {
    id: "D6_own_words", stage: "Image", kind: "text", heading: ["Describe your", "decorations"],
    prompt: "Describe your decorations",
    placeholder: "Gold confetti in the corners, a thin navy border, and one birthday hat on the person on the left. Keep faces clear.",
    optional: false, fields: ["image.decorations.customText"], controlIds: ["decorations_text"],
    applies: (b) => isMode(b, "decorate") && wants(b, "own-words"), filled: (b) => Boolean(b.image.decorations.customText),
  },
  {
    id: "I3_vibes", stage: "Image", kind: "vibes", heading: ["Set the", "vibe"],
    prompt: "How should it feel? Choose up to three.", optional: true, fields: ["shared.vibes", "shared.customVibe"], controlIds: ["vibes", "custom_vibe"],
    applies: always, filled: (b) => b.shared.vibes.length > 0 || Boolean(b.shared.intendedFeeling),
  },
  {
    id: "I4_caption", stage: "Image", kind: "caption", heading: ["Words on", "the front"],
    prompt: "Should the front have a caption?",
    helper: "We print exactly what you approve, placed clear of faces.",
    optional: false, fields: [], controlIds: ["caption_choice", "caption_text"],
    applies: always,
    filled: (b) => b.image.caption.choice === "none" || (b.image.caption.choice !== null && Boolean(b.image.caption.text.trim())),
  },
  {
    id: "I5_summary", stage: "Image", kind: "image-summary", heading: ["Your front,", "at a glance"],
    prompt: "Here's what we'll create. Change anything, or carry on.",
    optional: false, fields: [], controlIds: ["confirm_image"],
    applies: always, filled: (b) => b.image.briefConfirmed,
  },

  // ---- Message ----------------------------------------------------------------
  {
    id: "M1_inside", stage: "Message", kind: "message", heading: ["What goes", "inside"],
    prompt: "Write your inside message, let us draft one, or leave the inside blank.",
    helper: "Up to 4 short lines and 500 characters, including your sign-off.",
    optional: false, fields: [], controlIds: ["inside_message", "ai_alternate", "leave_blank"],
    applies: always,
    filled: (b) => b.control.answered.includes("M1_inside")
      && (b.message.mode === "blank" || Boolean(b.message.userVersion?.text.trim() || b.message.aiVersion?.text.trim())),
  },

  // ---- Song ---------------------------------------------------------------------
  {
    id: "S1_song", stage: "Song", kind: "song-mode", heading: ["Add a", "song"],
    prompt: "Would you like a song inside? It plays when they scan the QR code.",
    optional: false, fields: [], controlIds: ["song_mode"],
    applies: always, filled: (b) => Boolean(b.song.mode),
  },
  {
    id: "S2_genre", stage: "Song", kind: "genre", heading: ["Choose the", "sound"],
    prompt: "Which style of music should it be?", optional: false, fields: [], controlIds: ["genre"],
    applies: (b) => b.song.mode === "vocal" || b.song.mode === "instrumental", filled: (b) => Boolean(b.song.genrePresetId),
  },
  {
    id: "S4_lyrics", stage: "Song", kind: "lyrics", heading: ["Your", "lyrics"],
    prompt: "Here are the words we'll sing. Edit anything, then approve them.",
    optional: false, fields: [], controlIds: ["lyrics"],
    applies: (b) => b.song.mode === "vocal",
    filled: (b) => b.song.approvedLyricsVersion !== null && b.song.approvedLyricsVersion === b.song.lyricsVersion,
  },
  {
    id: "G1_generate", stage: "Song", kind: "generate", heading: ["Ready to", "make it"],
    prompt: "Everything's set. We'll create your card now.",
    optional: false, fields: [], controlIds: ["generate"],
    applies: always, filled: (b) => Boolean(b.control.generation),
  },
];



/**
 * A look follow-up applies after a no-photo description of a person when its
 * detail is still missing from what was said before it, no earlier follow-up
 * was skipped, and fewer than two have been asked.
 */
function lookFollowUpApplies(brief: Brief, id: LookDetail["id"]) {
  if (brief.control.photoSkipped !== true || !describesAPerson(brief.image.subjectDescription)) return false;
  let said = brief.image.subjectDescription || "";
  let asked = 0;
  for (const detail of LOOK_DETAILS) {
    const questionId = LOOK_QUESTION_IDS[detail.id];
    if (detail.id === id) return asked < MAX_LOOK_FOLLOW_UPS && (brief.control.answered.includes(questionId) || !detail.covered.test(said));
    if (brief.control.skippedOptionalFields.includes(questionId)) return false;
    if (brief.control.answered.includes(questionId)) {
      asked += 1;
      said += ` ${brief.image.lookDetails[detail.id] || ""}`;
    }
  }
  return false;
}
export const QUESTIONS_BY_ID = new Map(QUESTION_BANK.map((question) => [question.id, question]));

function wordTotal(value: string | null) {
  return (value || "").split(/\s+/).filter(Boolean).length;
}

/** Whether a question is still open: it applies, isn't answered, filled or skipped. */
export function isOpen(question: Question, brief: Brief) {
  if (!question.applies(brief)) return false;
  if (question.filled(brief)) return false;
  if (brief.control.skippedOptionalFields.includes(question.id)) return false;
  // Free-text questions that can't be "filled" by a value close once answered.
  if (brief.control.answered.includes(question.id) && (question.kind === "story" || question.optional)) return false;
  return true;
}

/** Deterministic next question in canonical order, or null when intake is complete. */
export function nextOpenQuestion(brief: Brief): Question | null {
  return QUESTION_BANK.find((question) => isOpen(question, brief)) || null;
}

