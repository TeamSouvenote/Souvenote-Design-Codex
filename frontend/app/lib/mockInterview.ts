/**
 * Mock data mode stand-in for the Build My Card text models: the Haiku 5.5
 * interviewer and message writer, plus the caption, genre-recommendation and
 * lyric tasks. It follows the same canonical contracts and rules (exact
 * evidence quotes, no invented facts, gentle defaults for sensitive
 * occasions) with simple deterministic rules, so the whole questionnaire
 * works without Bedrock.
 */
import { GENRE_PRESETS, LIMITS, genreById } from "../components/bmc/catalog";
import type { GenrePreset } from "../components/bmc/catalog";
import type { InterviewProposal, InterviewTurnInput, InterviewUpdate, TextContext } from "../components/bmc/engine";
import { applyProposal, decideNext, newAnswer } from "../components/bmc/engine";
import { QUESTIONS_BY_ID } from "../components/bmc/questionBank";
import { mockDelay } from "./mockMode";


// ---- Extraction ---------------------------------------------------------------

const OCCASION_PATTERNS: [RegExp, string][] = [
  [/\b(mother'?s day)\b/i, "Mother's Day"], [/\b(father'?s day)\b/i, "Father's Day"], [/\b(valentine'?s?( day)?)\b/i, "Valentine's Day"],
  [/\b(baby shower)\b/i, "Baby Shower"], [/\b(bridal shower)\b/i, "Bridal Shower"], [/\b(teacher)\b/i, "Teacher Appreciation"],
  [/\b(birthday|bday)\b/i, "Birthday"], [/\b(anniversary)\b/i, "Anniversary"], [/\b(wedding)\b/i, "Wedding"],
  [/\b(engage(?:d|ment))\b/i, "Engagement"], [/\b(graduat(?:ion|ing|ed|es))\b/i, "Graduation"], [/\b(new baby|newborn)\b/i, "New Baby"],
  [/\b(thank(?:s| you))\b/i, "Thank You"], [/\b(sympathy|condolence|passed away|loss of)\b/i, "Sympathy"],
  [/\b(get well|recover(?:y|ing)|surgery)\b/i, "Get Well"], [/\b(christmas|xmas)\b/i, "Christmas"], [/\b(hanukkah|chanukah)\b/i, "Hanukkah"],
  [/\b(new year)\b/i, "New Year"], [/\b(easter)\b/i, "Easter"], [/\b(halloween)\b/i, "Halloween"], [/\b(thanksgiving)\b/i, "Thanksgiving"],
  [/\b(retire(?:ment|d|ing))\b/i, "Retirement"], [/\b(new home|housewarming|moved)\b/i, "New Home"], [/\b(new job|promotion)\b/i, "New Job"],
  [/\b(congrat\w*)\b/i, "Congrats"], [/\b(thinking of you)\b/i, "Thinking of You"], [/\b(miss you)\b/i, "Miss You"],
  [/\b(sorry|apolog\w*)\b/i, "Apology"], [/\b(good luck)\b/i, "Good Luck"], [/\b(just because)\b/i, "Just Because"],
];

const RELATIONSHIPS = "mom|mother|mum|dad|father|sister|brother|wife|husband|partner|girlfriend|boyfriend|fiancée|fiancee|fiancé|fiance|best friend|friend|grandma|grandmother|grandpa|grandfather|son|daughter|aunt|uncle|cousin|boss|colleague|coworker|teacher|niece|nephew|neighbour|neighbor";
const NOT_NAMES = new Set(["The", "My", "Her", "His", "Their", "Our", "Your", "She", "He", "They", "We", "It", "And", "But", "This", "That", "A", "An", "I", "Happy", "Mom", "Dad", "Mum"]);
const FEELINGS = "funny|playful|heartfelt|sweet|sentimental|emotional|silly|warm|elegant|cheeky|sarcastic|gentle|tender|proud|grateful|romantic|nostalgic|uplifting|cosy|cozy|loving|affectionate|dramatic|witty";

function update(field: string, value: string, answerId: string, evidence: string): InterviewUpdate {
  return { field, value_json: JSON.stringify(value), source_answer_id: answerId, evidence_quote: evidence };
}

/** Also used by the Personalize a Template mock interviewer (mockPersonalize.ts). */
export function extractShared(text: string, answerId: string, allowed: Set<string>): InterviewUpdate[] {
  const updates: InterviewUpdate[] = [];
  const push = (field: string, value: string, evidence: string) => { if (allowed.has(field)) updates.push(update(field, value, answerId, evidence)); };

  for (const [pattern, occasion] of OCCASION_PATTERNS) {
    const match = text.match(pattern);
    if (match) { push("shared.occasion", occasion, match[0]); break; }
  }

  const relation = text.match(new RegExp(`\\bmy\\s+(${RELATIONSHIPS})\\b`, "i"));
  if (relation) push("shared.relationship", relation[1].toLowerCase(), relation[0]);

  const namePatterns = [
    // Names are capitalised words; a possessive ('s) is never part of the name.
    new RegExp(`\\b[Mm]y\\s+(?:${RELATIONSHIPS}),?\\s+([A-Z][a-zà-ÿ-]+)`),
    /\b([A-Z][a-zà-ÿ-]+)['’]s\s+(?:birthday|anniversary|wedding|graduation|retirement|big day)/,
    /\b(?:for|to)\s+([A-Z][a-zà-ÿ-]+)\b/,
  ];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && /^[A-Z]/.test(match[1]) && !NOT_NAMES.has(match[1])) { push("shared.recipientName", match[1], match[0]); break; }
  }

  const sender = text.match(/\b(?:[Ff]rom|[Ll]ove,?|[Ss]igned,?)\s+([A-Z][a-zà-ÿ-]+)\b/);
  if (sender && !NOT_NAMES.has(sender[1])) push("shared.senderName", sender[1], sender[0]);

  const feeling = text.match(new RegExp(`\\b(${FEELINGS})(?:\\s+(?:and|but)\\s+(${FEELINGS}))?\\b`, "i"));
  if (feeling) push("shared.intendedFeeling", feeling[0].toLowerCase(), feeling[0]);

  const motif = text.match(/\b(?:loves?|obsessed with|into|always)\s+([a-z][a-z' -]{2,40}?)(?=[.,;!]|$| and )/i);
  if (motif) push("shared.motif", motif[0].toLowerCase(), motif[0]);

  if (text.trim().length >= 15) push("shared.userFacts", text.trim(), text.trim());
  return updates;
}

const ENHANCE_CONFLICT = /\b(move|moving|background|new scene|different place|add (?:a|an|some|more)|put (?:him|her|them|us|me)|change (?:the )?(?:scene|setting|outfits?|clothes))\b/i;
const FACE_PLACEMENT = /\b(on|over|across) (?:her|his|their|my|our|the) faces?\b/i;

// ---- Interviewer --------------------------------------------------------------------

export async function mockProposeInterviewTurn(input: InterviewTurnInput): Promise<InterviewProposal> {
  await mockDelay(450);
  const brief = input.brief_snapshot;
  const answer = input.latest_answer;
  const allowed = new Set(input.allowed_fields.map((field) => field.path));
  const updates = answer.text.trim() ? extractShared(answer.text, answer.id, allowed) : [];

  const conflicts: InterviewProposal["conflicts"] = [];
  if (brief.image.mode === "enhance" && ENHANCE_CONFLICT.test(answer.text)) {
    conflicts.push({
      field: "image.mode",
      explanation: "Enhance keeps your photo's layout, so it can't move people, change the background or add new things. Transform can.",
      source_answer_ids: [answer.id],
    });
  }
  if (brief.image.mode === "decorate" && FACE_PLACEMENT.test(answer.text)) {
    conflicts.push({
      field: "image.decorations.customText",
      explanation: "Decorations over a face would hide it. We'll keep additions clear of faces unless it's a hat, crown or glasses you chose.",
      source_answer_ids: [answer.id],
    });
  }

  // Decide the next question the way the app will, after these updates.
  const question = QUESTIONS_BY_ID.get(answer.question_id) || null;
  const projected = question
    ? applyProposal(brief, { updates, conflicts: [], question: { text: "", target_step: "Photo", control_ids: [] }, suggested_action: "ask" },
      newAnswerLike(answer), question, brief.control.briefVersion).brief
    : brief;
  const next = decideNext(projected, null);
  if (!next.question) {
    return { updates, conflicts, question: { text: "", target_step: "Review", control_ids: [] }, suggested_action: "review" };
  }
  return {
    updates,
    conflicts,
    question: { text: next.text, target_step: next.question.stage, control_ids: next.question.controlIds },
    suggested_action: next.question.stage === input.current_step ? "ask" : "advance",
  };
}

function newAnswerLike(answer: InterviewTurnInput["latest_answer"]) {
  return { ...newAnswer(answer.question_id, answer.text, answer.controls), id: answer.id };
}

// ---- Inside message --------------------------------------------------------------

/** Named days keep their capitals ("Happy Mother's Day"); everyday occasions read in lower case. */
function occasionWords(occasion: string | null | undefined) {
  if (!occasion) return null;
  return /(day|eve|year|hanukkah|diwali|eid|easter|christmas|halloween|thanksgiving|passover|kwanzaa)/i.test(occasion) ? occasion : occasion.toLowerCase();
}

/** The motif is written about them ("her garden"); the card speaks to them ("your garden"). */
function motifToYou(motif: string | null | undefined) {
  if (!motif) return null;
  return motif.replace(/^(loves?|always|obsessed with|into)\s+/i, "").replace(/\b(her|his|their)\b/gi, "your");
}

/** Follows the customer's sign-off choice; "auto" picks one that suits the occasion. */
function signoff(ctx: TextContext) {
  const sender = ctx.senderName?.trim();
  if (!sender || ctx.signoff === "none") return "";
  if (ctx.signoff === "love") return `\nLove, ${sender}`;
  if (ctx.signoff === "from") return `\nFrom ${sender}`;
  return ctx.sensitive ? `\nWith love, ${sender}` : `\nLove, ${sender}`;
}

function messageVariants(ctx: TextContext): string[] {
  const to = ctx.recipientName ? `${ctx.recipientName}, ` : "";
  const occasion = ctx.occasion?.toLowerCase();
  const named = occasionWords(ctx.occasion);
  const feeling = ctx.intendedFeeling.toLowerCase();
  if (ctx.sensitive) {
    return [
      `${to}I'm thinking of you and holding you close.\nI'm here, whenever you need me.`,
      `${to}there are no right words, so I'll simply say I care.\nI'm only ever a call away.`,
      `${to}sending you quiet comfort and all my love.\nTake all the time you need.`,
      `${to}you're in my thoughts today and every day.\nLean on me whenever you need to.`,
      `${to}holding you in my heart.\nWith all my love and support.`,
    ];
  }
  const greeting = occasion === "birthday" ? "Happy birthday" : occasion === "anniversary" ? "Happy anniversary"
    : occasion === "thank you" ? "Thank you" : occasion === "graduation" ? "Congratulations" : named ? `Happy ${named}` : "Thinking of you";
  const motif = motifToYou(ctx.motif);
  if (/funny|playful|silly|cheeky|witty|humor/.test(feeling)) {
    return [
      `${greeting}, ${ctx.recipientName || "you"}!\n${motif ? `Here's to more ${motif} and fewer chores.` : "Another year wiser, or at least another year."}`,
      `${greeting}!\nYou're still my favourite person to tease, and to celebrate.`,
      `${greeting}, ${ctx.recipientName || "legend"}.\nI'd say act your age, but where's the fun in that?`,
      `${greeting}!\nYou make every day a little louder and a lot more fun.`,
      `${greeting}, ${ctx.recipientName || "you"}!\nNever change. Okay, maybe a little.`,
    ];
  }
  return [
    `${greeting}, ${ctx.recipientName || "my dear"}.\n${motif ? `Thank you for ${motif} and every small joy you share.` : "Thank you for every small moment that means so much."}`,
    `${to}${named && named !== occasion ? greeting : greeting.toLowerCase()}.\nYou make ordinary days feel like something to keep.`,
    `${greeting}!\nI'm so lucky to have you, today and every day.`,
    `${to}${named && named !== occasion ? greeting : greeting.toLowerCase()}.\nThank you for the love you give so freely.`,
    `${greeting}, ${ctx.recipientName || "my dear"}.\nHere's to you, and to all the moments still to come.`,
  ];
}

/**
 * The mock's reading of a redraft note: a tone (funnier or warmer) and whether to
 * keep it short. The real writer follows the note itself, within the template's rules.
 */
function readDirection(direction: string | null, sensitive: boolean) {
  const steer = (direction || "").toLowerCase();
  const tone = /funn|joke|cheek|playful|silly|upbeat/.test(steer) && !sensitive ? "playful"
    : /warm|heartfelt|sweet|tender|gentl/.test(steer) ? "warm" : null;
  return { tone, short: /short|brief|simpl/.test(steer) };
}

export async function mockDraftInsideMessage(ctx: TextContext, previousDrafts: string[], userDirection: string | null = null): Promise<{ message: string; needsClarification: string[] }> {
  await mockDelay(700);
  const steer = readDirection(userDirection, ctx.sensitive);
  const toned = steer.tone ? { ...ctx, intendedFeeling: steer.tone } : ctx;
  const options = messageVariants(toned).map((base) => `${steer.short ? base.split("\n")[0] : base}${signoff(ctx)}`);
  const fresh = options.find((option) => !previousDrafts.includes(option)) || options[previousDrafts.length % options.length];
  return { message: fresh.slice(0, LIMITS.messageMaxChars), needsClarification: [] };
}

// ---- Caption ----------------------------------------------------------------------

const CAPTIONS: Record<string, string[]> = {
  Birthday: ["Happy Birthday", "Make a Wish", "Here's to You", "Another Year of Wonderful", "Birthday Wishes", "Cheers to You"],
  Anniversary: ["Happy Anniversary", "Still My Favourite", "Here's to Us", "Every Year, More", "Always You", "Love, Always"],
  "Thank You": ["Thank You", "With Gratitude", "Thanks a Bunch", "So Very Grateful", "You're the Best", "Thank You, Truly"],
  Sympathy: ["Thinking of You", "With Deepest Sympathy", "Holding You Close", "In Loving Memory", "With Love", "You're Not Alone"],
  "Get Well": ["Get Well Soon", "Thinking of You", "Rest and Recover", "Sending Healing Hugs", "Feel Better Soon", "Here for You"],
  Graduation: ["Congratulations, Grad", "You Did It", "Onward and Upward", "Proud of You", "The Future Is Yours", "Caps Off to You"],
};

export async function mockDraftCaption(ctx: TextContext, previousDrafts: string[]): Promise<{ caption: string; needsClarification: string[] }> {
  await mockDelay(500);
  const list = CAPTIONS[ctx.occasion || ""] || ["For You", "With Love", "Just Because", "Thinking of You", "You're Wonderful", "Here's to You"];
  const caption = list.find((option) => !previousDrafts.includes(option)) || list[previousDrafts.length % list.length];
  return { caption, needsClarification: [] };
}

// ---- Genres ----------------------------------------------------------------------

export async function mockRecommendGenres(input: { occasion: string | null; vibes: string[]; intendedFeeling: string; userDirection: string | null }): Promise<{ recommendations: { presetId: string; reason: string }[] }> {
  await mockDelay(400);
  const occasion = input.occasion || "";
  const playful = input.vibes.some((v) => ["humorous", "meme-culture", "deadpan", "real-talk"].includes(v)) || /funny|playful|cheeky|witty/.test(input.intendedFeeling);
  let ids: [string, string][];
  if (["Sympathy", "Get Well"].includes(occasion)) {
    ids = [["gentle-piano", "Calm and gentle, so every word is easy to hear."], ["warm-acoustic-folk", "Soft and reassuring, like a quiet conversation."], ["warm-rnb", "Warm and unhurried, with a caring tone."]];
  } else if (["Anniversary", "Wedding", "Engagement", "Valentine's Day"].includes(occasion)) {
    ids = [["warm-rnb", "Smooth and affectionate, made for love songs."], ["latin-pop", "Warm and rhythmic, with a romantic glow."], ["warm-acoustic-folk", "Tender and personal, close and simple."]];
  } else if (occasion === "Graduation") {
    ids = [["pop-rock", "Confident and encouraging, for a big achievement."], ["bright-pop", "Bright and celebratory, easy to sing along to."], ["boom-bap-rap", "A playful tribute with a rhythmic hook."]];
  } else if (["Thank You", "Retirement"].includes(occasion)) {
    ids = [["warm-acoustic-folk", "Grateful and gentle, with a warm feel."], ["jazz-swing", "Charming and lighthearted, with a touch of class."], ["country-pop", "Down-to-earth and affectionate."]];
  } else if (occasion === "Birthday") {
    ids = playful
      ? [["boom-bap-rap", "Great for inside jokes and playful shout-outs."], ["disco-funk", "Fun and danceable for a party mood."], ["bright-pop", "Bright and celebratory, easy to sing along to."]]
      : [["bright-pop", "Bright and celebratory, easy to sing along to."], ["disco-funk", "Fun and danceable for a party mood."], ["jazz-swing", "Charming and warm, with a little sparkle."]];
  } else {
    ids = [["gentle-piano", "A gentle option: calm and heartfelt."], ["warm-rnb", "A soulful option: warm and sincere."], ["bright-pop", "An upbeat option: bright and joyful."]];
  }
  return { recommendations: ids.map(([presetId, reason]) => ({ presetId, reason })) };
}

// ---- Lyrics -------------------------------------------------------------------------

function lyricVariants(ctx: TextContext, preset: GenrePreset): string[][] {
  const name = ctx.recipientName || "you";
  const day = ctx.occasion ? `this ${occasionWords(ctx.occasion)}` : "today";
  const motif = motifToYou(ctx.motif) || "the little things";
  if (preset.vocalMode === "rapped") {
    return [
      [`Yo ${name}, it's ${day}, so the spotlight's on you,`, `All that ${motif}, yeah, we know it's true,`, `Laughing every time like we always do,`, `Another chapter now and it's brand new.`,
        `Turn it up, turn it up for ${name} tonight,`, `Every single moment, yeah, you got it right,`, `Raise it up, raise it up, let the people know,`, `${name} on the mic, let the good times flow.`,
        `Here's to you, ${name}, keep that glow.`],
      [`Check it, ${name}, it's time to celebrate,`, `Doing ${motif} like you never hesitate,`, `Real ones know that you're one of a kind,`, `Leaving all the ordinary days behind.`,
        `Hands up high for ${name} today,`, `Every word I say is coming your way,`, `Hands up high, can you feel that sound?`, `Best one in the room, best one around.`,
        `${name}, this one's for you, no doubt.`],
    ];
  }
  const verseA = [`${name}, ${day} is here at last,`, `Full of ${motif} and the best of our past,`, `Every little moment we have shared,`, `Shows how much you've always cared.`];
  const chorusA = [`So here's to you, ${name}, shining through,`, `Every day is better because of you,`, `Raise a song and let it play,`, `${capital(day)} is your day.`];
  const verseB = [`There's a light in the way you smile,`, `Making every moment worth the while,`, `${capital(motif)}, and a laugh so true,`, `Nobody shines quite like you.`];
  const chorusB = [`This song's for you, ${name}, can't you see,`, `You mean the whole wide world to me,`, `So sing along and let it ring,`, `For you, ${name}, I sing.`];
  const slow = preset.words[1] <= 55;
  return [
    [...verseA.slice(0, slow ? 3 : 4), ...chorusA.slice(0, slow ? 3 : 4), `${name}, this is for you.`],
    [...verseB.slice(0, slow ? 3 : 4), ...chorusB.slice(0, slow ? 3 : 4), `Always and forever, you.`],
  ];
}

function capital(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatLyrics(lines: string[]) {
  const verseCount = lines.length === 9 ? 4 : 3;
  const verse = lines.slice(0, verseCount);
  const chorus = lines.slice(verseCount, lines.length - 1);
  const final = lines[lines.length - 1];
  return `[00:02–00:17 Verse]\n${verse.join("\n")}\n\n[00:17–00:37 Chorus]\n${chorus.join("\n")}\n\n[00:37–00:43 Final]\n${final}`;
}

export async function mockDraftLyrics(ctx: TextContext, presetId: string, previousDrafts: string[], userDirection: string | null = null): Promise<{ lyrics: string; needsClarification: string[] }> {
  await mockDelay(800);
  const chosen = genreById(presetId) || GENRE_PRESETS[0];
  // "Simpler" or "gentler" uses the mock's shorter verse and chorus; the preset itself never changes.
  const steer = readDirection(userDirection, ctx.sensitive);
  const preset = steer.short || steer.tone === "warm" ? { ...chosen, words: [chosen.words[0], Math.min(chosen.words[1], 50)] as [number, number] } : chosen;
  const options = lyricVariants(ctx, preset).map(formatLyrics);
  const lyrics = options.find((option) => !previousDrafts.includes(option)) || options[previousDrafts.length % options.length];
  return { lyrics: lyrics.slice(0, LIMITS.lyricMaxChars), needsClarification: [] };
}
