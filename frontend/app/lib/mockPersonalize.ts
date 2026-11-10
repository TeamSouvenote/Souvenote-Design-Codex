/**
 * Mock data mode stand-in for the Personalize a Template text models (Haiku
 * 5.5 on Bedrock in production): the adaptive interviewer, the card-specific
 * suggestion sets, On This Day's story research, the comic storyboard, and the
 * "Suggest a template" box. Deterministic rules, the same contracts and the
 * same limits, so every card works with no backend.
 *
 * On This Day: real research needs a web-search tool on the backend. The mock
 * returns clearly labelled sample stories; nothing here claims a real event.
 */
import type { PtOption, StoryboardPanel } from "../components/personalize/ptBrief";
import type { PtInterviewProposal, PtInterviewTurnInput } from "../components/personalize/ptEngine";
import type { PtSuggestTask } from "../components/personalize/types";
import { extractShared } from "./mockInterview";
import { mockId, nowIso, updateMockDb } from "./mockDb";
import { mockDelay } from "./mockMode";

// ---- Interviewer -------------------------------------------------------------

export async function mockProposePersonalizeTurn(input: PtInterviewTurnInput): Promise<PtInterviewProposal> {
  await mockDelay(420);
  const allowed = new Set(input.allowed_fields.map((field) => field.path));
  const updates = input.latest_answer.text.trim() ? extractShared(input.latest_answer.text, input.latest_answer.id, allowed) : [];
  const upcoming = input.open_questions.find((question) => question.id !== input.latest_answer.question_id) || null;
  return { updates, conflicts: [], next: upcoming ? { question_id: upcoming.id, text: upcoming.default_text } : null };
}

// ---- Suggestion sets ---------------------------------------------------------------

export type PtSuggestContext = {
  templateId: string;
  recipientName: string | null;
  occasion: string | null;
  sign: { name: string; symbol: string; themes: string[]; element: string } | null;
  fields: Record<string, string>;
  facts: string[];
  mood: string | null;
};

const option = (label: string, sub?: string): PtOption => ({ id: mockId("opt"), label, sub });

function variants(task: PtSuggestTask, ctx: PtSuggestContext): PtOption[][] {
  const name = ctx.recipientName || "them";
  const sign = ctx.sign;
  const signName = sign?.name || "their sign";
  const [themeA, themeB, themeC] = sign?.themes || ["wonder", "the night sky", "little joys"];
  switch (task) {
    case "horoscope-transform": return [
      [option(`${name} alongside ${sign?.symbol || "the sign's symbol"}`, "They interact with the symbol."),
        option(`${name} posing beside a glowing ${signName} constellation`, "Posing beside the symbol."),
        option(`${name} as a ${signName}-inspired character in a world of ${themeB}`, "They become a character inspired by the sign.")],
      [option(`${name} reaching up to touch the ${signName} stars`, "A quiet, magical moment."),
        option(`${name} sharing a laugh with ${sign?.symbol || "the symbol"}`, "Playful and warm."),
        option(`${name} as the hero of a ${signName} legend`, "Mythic and bold.")],
    ];
    case "horoscope-symbol-scene": return [
      [option(`${sign?.symbol || "The symbol"} circling a full moon`), option(`${sign?.symbol || "The symbol"} rising from ${themeB}`), option(`The ${signName} constellation drawn in gold over ${themeB}`)],
      [option(`${sign?.symbol || "The symbol"} framed by a ring of stars`), option(`${sign?.symbol || "The symbol"} in a field of ${themeC}`), option(`A ${signName} crest with tiny stars`)],
    ];
    case "horoscope-cover-line": return [
      [option(`Happy birthday, ${signName}. Here’s to ${themeC}.`)], [option(`Written in the stars: happy birthday`)], [option(`Happy birthday to our favourite ${signName}`)],
      [option(`${themeA[0].toUpperCase()}${themeA.slice(1)}, and a very happy birthday`)], [option("The stars aligned for you")], [option(`Born a ${signName}, loved always`)],
    ];
    case "cover-line": return [[option("Happy Birthday")], [option("For You")], [option("With Love")], [option("Thinking of You")], [option("Here’s to You")], [option("Cheers to You")]];
    case "otd-headlines": {
      const story = ctx.fields.storyHeadline || "the big news";
      return [
        [option(`Extra! Extra! ${name} Arrives the Same Day as ${shortStory(story)}`, "Playful"),
          option(`The Day the World Got Two Good Things`, "Warm"),
          option(`${name} Born; Same Edition Reports ${shortStory(story)}`, "Classic newspaper")],
        [option(`Breaking: Birthday Outshines ${shortStory(story)}`, "Playful"),
          option(`A Day Worth Remembering, Twice Over`, "Warm"),
          option(`Special Birthday Edition: ${shortStory(story)}`, "Classic newspaper")],
      ];
    }
    case "comic-character": return [
      [option(`${name} with a bright cape and a big grin`, "Classic hero."), option(`${name} in a trusty jacket with a sidekick sparrow`, "Friendly and fun."), option(`${name} as a mild-mannered hero with a secret`, "A playful twist.")],
      [option(`${name} in sneakers and a superhero mask`), option(`${name} with a lucky scarf that blows in every panel`), option(`${name} with a determined squint and a coffee in hand`)],
    ];
    case "comic-premise": return [
      [option(`${name} saves the ${ctx.occasion?.toLowerCase() || "big"} party from a runaway cake`), option(`${name} goes on a quest for the perfect parking spot`), option(`${name} discovers a secret superpower: finding lost socks`)],
      [option(`${name} races across town to deliver one perfect gift`), option(`${name} teaches a grumpy robot to dance`), option(`${name} outwits a mischievous squirrel gang`)],
    ];
    case "comic-ending": return [
      [option("Everyone bursts out laughing"), option("A big group hug"), option("They wink at the reader: “Same time next year?”")],
      [option("The hero takes a well-earned nap"), option("Cake for everyone"), option("A surprise twist reveals it was all planned")],
    ];
    case "comic-style": return [
      [option("Bold superhero inks", "Strong lines, dramatic colour."), option("Expressive manga", "Big emotion, dynamic panels."), option("Bright Sunday comic strip", "Cheerful colour and gentle humour.")],
      [option("Retro pop-art halftone", "Dots and punchy colour."), option("Moody noir", "Black, white and shadow."), option("Soft graphic-novel watercolour", "Warm and painterly.")],
    ];
    default: return [[]];
  }
}

function shortStory(headline: string) {
  return headline.replace(/[.!]$/, "").split(/\s+/).slice(0, 5).join(" ");
}

/** One suggestion set; `previous` holds the labels already shown, so each draft is fresh. */
export async function mockSuggestOptions(task: PtSuggestTask, ctx: PtSuggestContext, previous: string[]): Promise<{ options: PtOption[] }> {
  await mockDelay(520);
  const sets = variants(task, ctx);
  const fresh = sets.find((set) => set.length && set.every((candidate) => !previous.includes(candidate.label))) || sets[previous.length % sets.length];
  return { options: fresh.map((candidate, index) => ({ ...candidate, recommended: index === 0 })) };
}

// ---- On This Day research (mock) -------------------------------------------------------

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Sample stories only: the production version searches the web for the full
 * date (location first if given), verifies each event happened on that day and
 * returns a source per story. These are labelled as sample data and link to the
 * date's general reference page.
 */
export async function mockResearchOnThisDay(input: { date: string; location: string | null; includeLighter: boolean }): Promise<{ candidates: PtOption[]; recommendedId: string | null; note: string }> {
  await mockDelay(900);
  const match = input.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { candidates: [], recommendedId: null, note: "A full date is needed to look up stories." };
  const month = MONTHS[Number(match[2]) - 1];
  const day = Number(match[3]);
  const url = `https://en.wikipedia.org/wiki/${month}_${day}`;
  const where = input.location || "the world";
  const source = { name: "Sample story (mock data)", url, eventDate: input.date };
  const positive: PtOption[] = [
    { id: "otd-1", label: `A new public library opens its doors in ${where}`, sub: "Hundreds line up for library cards on opening day.", source, tone: "positive" },
    { id: "otd-2", label: "Scientists celebrate a successful launch", sub: "A research satellite reaches orbit after years of work.", source, tone: "positive" },
    { id: "otd-3", label: "A record-breaking community bake sale", sub: "Neighbours raise funds for a new playground.", source, tone: "positive" },
  ];
  const lighter: PtOption[] = [
    { id: "otd-4", label: "A city sets a new record for umbrella sales", sub: "Rain all week keeps shops busy.", source, tone: "lighter" },
    { id: "otd-5", label: "A new bridge opens to traffic", sub: "Commuters try the new route for the first time.", source, tone: "neutral" },
  ];
  return {
    candidates: input.includeLighter ? [...positive, ...lighter] : positive,
    recommendedId: "otd-2",
    note: `Sample stories for ${month} ${day}, ${match[1]}. Live research replaces these once the backend search is connected.`,
  };
}

// ---- Comic storyboard ----------------------------------------------------------------------

export async function mockDraftStoryboard(input: { recipientName: string | null; story: string; ending: string | null; occasion: string | null }, previousDrafts: number): Promise<{ panels: StoryboardPanel[] }> {
  await mockDelay(800);
  const name = input.recipientName || "Our hero";
  const day = input.occasion ? input.occasion.toLowerCase() : "big day";
  const ending = input.ending || "everyone bursts out laughing";
  const drafts: StoryboardPanel[][] = [
    [
      { action: `Setup: ${name} starts an ordinary ${day}. ${input.story}`, lettering: ["Just another normal day…", "Right?"] },
      { action: "Escalation: things get bigger and sillier, fast.", lettering: ["Uh oh."] },
      { action: `Turn: ${name} strikes a heroic pose and takes charge.`, lettering: ["Leave this to me!"] },
      { action: `Payoff: ${ending}.`, lettering: [`Happy ${day}, ${name}!`] },
    ],
    [
      { action: `Setup: a quiet morning, until ${name} spots trouble. ${input.story}`, lettering: ["Is that…?"] },
      { action: "Escalation: the chaos spreads across the whole scene.", lettering: ["Not again!", "Hold on tight!"] },
      { action: `Turn: ${name}'s secret skill saves the moment.`, lettering: ["Nailed it."] },
      { action: `Payoff: ${ending}.`, lettering: ["Best day ever."] },
    ],
  ];
  return { panels: drafts[previousDrafts % drafts.length] };
}

// ---- "Suggest a template" box ------------------------------------------------------------



const SUGGESTION_WINDOW_MS = 60_000;
const SUGGESTIONS_PER_WINDOW = 3;

/** Stored in the mock database (no backend route yet; owner, 2026-11-08). Repeats are ignored; three a minute at most. */
export async function mockSubmitTemplateSuggestion(input: { idea: string; email: string; searchQuery?: string | null; occasionFilter?: string | null }): Promise<{ ok: true; duplicate: boolean }> {
  await mockDelay(450);
  return updateMockDb((db) => {
    const list = db.templateSuggestions || [];
    const idea = input.idea.trim();
    const email = input.email.trim().toLowerCase();
    if (list.some((item) => item.email === email && item.idea.toLowerCase() === idea.toLowerCase())) return { ok: true as const, duplicate: true };
    const recent = list.filter((item) => item.email === email && Date.now() - Date.parse(item.createdAt) < SUGGESTION_WINDOW_MS);
    if (recent.length >= SUGGESTIONS_PER_WINDOW) throw new Error("You’ve sent a few ideas just now. Please wait a minute and try again.");
    db.templateSuggestions = [...list, { id: mockId("suggestion"), idea, email, searchQuery: input.searchQuery || null, occasionFilter: input.occasionFilter || null, createdAt: nowIso() }];
    return { ok: true as const, duplicate: false };
  });
}
