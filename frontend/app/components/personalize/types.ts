// The shape of a Personalize card file: its questions in order (shared and
// card-specific), the photo modes it offers, and how its answers fill the seven
// cover inputs and the generation instructions. One file per card in
// ./templates, so a change to a card's question map lands in one place.

import type { PhotoMode, PtBrief, PtStage } from "./ptBrief";

export type PtQuestionKind =
  | "names" | "date" | "text" | "form" | "choice" | "suggest" | "candidates" | "storyboard"
  | "photo-mode" | "photo" | "caption" | "message" | "song-mode" | "genre" | "song-use" | "lyrics" | "generate";

export type PtChoice = { id: string; label: string; sub?: string };

/** AI tasks a question can ask for (Haiku 5.5; the mock layer on this branch). */
export type PtSuggestTask =
  | "cover-line" | "horoscope-transform" | "horoscope-symbol-scene" | "horoscope-cover-line"
  | "otd-research" | "otd-headlines"
  | "comic-character" | "comic-premise" | "comic-ending" | "comic-storyboard" | "comic-style";

export type PtFormInput = { key: string; label: string; placeholder?: string; optional?: boolean; maxLength?: number; initial?: (brief: PtBrief) => string };

type Text = string | ((brief: PtBrief) => string);

export type PtQuestion = {
  id: string;
  stage: PtStage;
  kind: PtQuestionKind;
  /** [plain words, script phrase]: one script phrase per heading. */
  heading: [string, string] | ((brief: PtBrief) => [string, string]);
  /** The default question; the interviewer may tailor its wording, never its purpose. */
  prompt: Text;
  helper?: Text;
  placeholder?: Text;
  optional: boolean;
  /** The personalize.fields key this answer fills ("date", "text", "choice", "suggest"). */
  field?: string;
  /** Field paths the interviewer may fill from a free-text answer to this question. */
  extract?: string[];
  choices?: (brief: PtBrief) => PtChoice[];
  task?: PtSuggestTask;
  /** "choice" / "suggest": the write-in option. */
  writeIn?: { label: string; placeholder: Text };
  /** "date": a note shown once a valid date is entered (Horoscope shows the sign). */
  dateNote?: (value: string) => string | null;
  /** "date": whether the year must be given. */
  yearRequired?: boolean;
  /** "form": its inputs. */
  inputs?: PtFormInput[];
  maxLength?: number;
  /** Runs inside the answer, after the control's own change (for example to save which detail a follow-up asked about). */
  onAnswer?: (brief: PtBrief) => void;
  /** Whether this question is relevant given the answers so far. */
  applies: (brief: PtBrief) => boolean;
  /** Whether it's resolved (an open question that applies is asked; optional ones can be skipped). */
  filled: (brief: PtBrief) => boolean;
};

/**
 * How true a detail is, so the writers never present invented or playful
 * material as something that really happened:
 * - fact: something the customer told us about the person or about the two of them
 * - public-event: a real, verified event (On This Day), not about the person
 * - framing: the card's playful idea (a star sign's traits, headline wordplay)
 * - staging: imagined artwork or plot (the comic's story, the scene on the front)
 */
export type DetailKind = "fact" | "public-event" | "framing" | "staging";

/**
 * `aboutDetail`: part of "the story / what you're celebrating / the comic", so the
 * lyrics get it only when the customer lets the song mention it. The inside
 * message always gets it.
 */
export type WriterDetail = { kind: DetailKind; text: string; aboutDetail?: boolean };

export type WriterBrief = {
  details: WriterDetail[];
  /** Every word printed on the front, so the writers don't repeat it verbatim. */
  frontText: { text: string; aboutDetail?: boolean }[];
  /** One or two sentences per writer on how to use the card's idea. Sent as data with the context. */
  guidance: { message: string; lyrics: string } | null;
  /** The card's own mood answer; the intended feeling unless the customer wrote one. */
  mood: string | null;
};

/** The seven cover inputs from "Personalize a Template - Prompting.pdf". */
export type SevenInputs = {
  storyAndPurpose: string;
  vibe: string;
  subjectsAndReferences: string;
  sceneAndAction: string;
  settingAndComposition: string;
  visualTreatment: string;
  captionAndFormat: string;
};

export type PtTemplate = {
  id: string;
  name: string;
  /** Bumped whenever the card's questions or instructions change; logged on every asset. */
  version: string;
  occasion: string | null;
  defaultOrientation: "portrait" | "landscape";
  /**
   * One photo treatment per card (owner, 2026-11-08): the photo is reimagined
   * in the card's own style, the way its example image shows. No menu of modes.
   */
  photoTreatment: "transform";
  /** Also offer "keep my photo as it is" (the original photo framed with artwork) as a quiet link. */
  keepOriginal: boolean;
  /** Mark "Continue without a photo" as recommended (On This Day: the story leads). */
  recommendNoPhoto?: boolean;
  /** This card's description of each photo choice. */
  photoModeCopy: (brief: PtBrief) => Partial<Record<PhotoMode, string>>;
  questions: PtQuestion[];
  /** What the inside message and the song may call back to, in the customer's words. */
  detail: (brief: PtBrief) => string | null;
  /** How the song step names that detail ("the story", "the comic"). */
  detailLabel: string;
  /**
   * What this card gives the inside-message and lyric writers (owner, 2026-11-08).
   * Every card must fill it in, so a new template can't leave its writers guessing.
   */
  writerBrief: (brief: PtBrief) => WriterBrief;
  /**
   * The genre preset (components/bmc/catalog.ts) this card suggests, pre-selected on
   * "Choose the sound" (owner approved PT-SONG-GENRES-PROPOSAL.md, 2026-11-08).
   */
  songPreset: (brief: PtBrief) => string;
  sevenInputs: (brief: PtBrief) => SevenInputs;
  /** The card's cover instructions, filled from the answers. The production instructions are added after. */
  coverInstructions: (brief: PtBrief) => string;
  /** Lines shown under the front on Review (exact words the image model will draw). */
  /** Short notes under the front on Ready to create and Review. The words printed on the front aren't
   *  listed here: they show in "Check the spelling (N)", from writerBrief().frontText (owner, 2026-11-09). */
  frontNotes: (brief: PtBrief) => string[];
  summary: (brief: PtBrief) => { label: string; value: string; questionId: string }[];
  /**
   * This card's own song theme, added to the genre preset's production prompt (owner,
   * 2026-11-08). Each card gets one later; null until then.
   */
  songPrompt: string | null;
};
