// Build My Card catalogues: every list a customer can pick from, plus the ten
// launch song presets. THIS FILE IS THE SOURCE OF TRUTH (owner decision,
// 2026-11-08). It began from these early drafts in reference-materials/Build My
// Card, which are no longer maintained and are out of date as of 2026-11-08
// (see OUT-OF-DATE.md there); never re-sync from them:
// - Asset Generation Map and Image and Message Prompts PDFs (styles, vibes,
//   Decorate menus, borders, colours, wearables)
// - Souvenote Song Prompt Library.docx (preset IDs, BPM, word budgets,
//   production prompts, suggested uses)
// Bump CATALOG_VERSION when anything here changes; it is logged on every
// generation snapshot.

export const CATALOG_VERSION = "bmc-catalog-2026-11-08a";

/** Every option list that offers Custom uses this id; Custom is always styled in terracotta (owner, 2026-11-08). */
export const CUSTOM_ID = "custom";

export type Option = { id: string; label: string };

/**
 * Popular greeting-card occasions (owner request 2026-11-07, drawn from the
 * occasion list in the Image and Message Prompts reference), most popular
 * first, then Custom.
 */
export const OCCASIONS: Option[] = [
  "Birthday", "Anniversary", "Thank You", "Mother's Day", "Father's Day", "Valentine's Day", "Christmas",
  "Wedding", "Engagement", "New Baby", "Baby Shower", "Graduation", "Congrats", "Just Because",
  "Thinking of You", "Get Well", "Sympathy", "Retirement", "New Home", "New Job", "Friendship", "Miss You",
  "Apology", "Good Luck", "Bridal Shower", "Easter", "Halloween", "Thanksgiving", "Hanukkah", "New Year",
  "Teacher Appreciation", "Pet Birthday", "Custom",
].map((label) => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), label }));

/** Occasions that call for a gentle default (no party symbols, gentle music). */
export const GENTLE_OCCASIONS = new Set(["Sympathy", "Get Well", "Thinking of You", "Apology"]);

export type ImageMode = "transform" | "enhance" | "decorate";

export const IMAGE_MODES: { id: ImageMode; label: string; sub: string; needsPhoto: boolean; popular?: boolean }[] = [
  { id: "transform", label: "Transform Scene and Style", sub: "Reimagine a photo, or build your idea from scratch.", needsPhoto: false, popular: true },
  { id: "enhance", label: "Enhance Style", sub: "Keep your photo’s layout and repaint it in a new artistic style.", needsPhoto: true },
  { id: "decorate", label: "Decorate My Photo", sub: "Keep your photo as it is and add accents, a border or a caption.", needsPhoto: true },
];

export const VISUAL_STYLES: (Option & { swatch: string })[] = [
  { id: "realistic", label: "Realistic", swatch: "linear-gradient(135deg,#b7a48e,#6e5d4c)" },
  { id: "cinematic", label: "Cinematic", swatch: "linear-gradient(135deg,#9a6a45,#3b2a1e)" },
  { id: "comic", label: "Comic", swatch: "linear-gradient(135deg,#e2826f,#f1cf6a)" },
  { id: "cartoon", label: "Cartoon / Animated", swatch: "linear-gradient(135deg,#9ec2e6,#f2c6dc)" },
  { id: "artistic", label: "Artistic / Painted", swatch: "linear-gradient(135deg,#d0aa62,#93583a)" },
  { id: "fantasy", label: "Fantasy / Magical", swatch: "linear-gradient(135deg,#8c74c4,#45366e)" },
  { id: "anime", label: "Anime-inspired", swatch: "linear-gradient(135deg,#f8c4ad,#b4d5f6)" },
  { id: "minimal", label: "Minimal / Clean", swatch: "linear-gradient(135deg,#f2ece3,#b9b0a4)" },
  { id: "vintage", label: "Vintage / Retro", swatch: "linear-gradient(135deg,#d6b48a,#7c5634)" },
  { id: "watercolor", label: "Watercolor", swatch: "linear-gradient(135deg,#c9e5ea,#efc5cd)" },
  { id: "dreamy", label: "Dreamy / Ethereal", swatch: "linear-gradient(135deg,#d9c8fb,#f3d2e4)" },
  { id: "storybook", label: "Storybook", swatch: "linear-gradient(135deg,#f4d9a8,#c9876f)" },
  { id: "pop-art", label: "Pop Art", swatch: "linear-gradient(135deg,#f25c54,#f7d046)" },
  { id: "pencil", label: "Pencil Sketch", swatch: "linear-gradient(135deg,#e6e1d8,#8d867c)" },
  { id: "oil", label: "Oil Painting", swatch: "linear-gradient(135deg,#b07a3f,#4f3a2a)" },
  { id: "3d", label: "3D / Claymation", swatch: "linear-gradient(135deg,#9fd3c7,#f2a57f)" },
  { id: "custom", label: "Custom", swatch: "linear-gradient(135deg,#efe6da,#d8c9b6)" },
];

export const VIBES: Option[] = [
  "Humorous", "Heartfelt", "Traditional", "Modern", "Cute", "Inspirational", "Real Talk",
  "Deadpan", "Meme Culture", "Elegant", "Throwbacks", "Situationship", "Milestone",
  "Romantic", "Playful", "Nostalgic", "Sweet", "Celebratory", "Whimsical", "Cheeky", "Calm", "Custom",
].map((label) => ({ id: label.toLowerCase().replace(/\s+/g, "-"), label }));

export const MAX_VIBES = 3;

export type AccentGroup = { id: string; label: string; items: Option[]; occasions: string[] };

function items(list: string): Option[] {
  return list.split(";").map((raw) => raw.trim()).filter(Boolean).map((label) => ({
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    label: label.charAt(0).toUpperCase() + label.slice(1),
  }));
}

export const ACCENT_GROUPS: AccentGroup[] = [
  { id: "party", label: "Party and celebration", items: items("balloons; confetti; streamers; bunting; wrapped gifts; birthday cake; cupcakes; candles; fireworks; party hats; disco ball; sparklers"), occasions: ["Birthday", "Graduation", "Congratulations", "New Year", "Retirement", "Pet Birthday"] },
  { id: "love", label: "Love and flowers", items: items("hearts; roses; flower clusters; flower petals; ribbons; decorative bows; love letters; doves"), occasions: ["Anniversary", "Wedding", "Engagement", "Valentine's Day", "Mother's Day", "Bridal Shower"] },
  { id: "playful", label: "Playful and magical", items: items("stars; sparkles; colourful dots; rainbow; clouds; musical notes; smiley faces; butterflies; unicorns; moons"), occasions: ["Just Because", "Thank You", "Friendship", "Miss You", "Good Luck"] },
  { id: "nature", label: "Nature and garden", items: items("sunflowers; daisies; leaves and vines; bees; ladybugs; mushrooms; birds"), occasions: ["Thinking of You", "New Home"] },
  { id: "baby", label: "Baby and family", items: items("baby feet; rattles; storks; teddy bears; building blocks; pacifiers"), occasions: ["New Baby", "Baby Shower"] },
  { id: "milestones", label: "Milestones and achievement", items: items("diploma scroll; trophy; medal; laurel wreath; graduation caps; gold stars"), occasions: ["Graduation", "New Job", "Teacher Appreciation"] },
  { id: "seasonal", label: "Seasonal and holiday", items: items("snowflakes; holly; pine sprigs; ornaments; string lights; autumn leaves; pumpkins; Easter eggs; lanterns; candy canes; menorah"), occasions: ["Christmas", "Halloween", "Thanksgiving", "Easter", "Hanukkah"] },
  { id: "hobbies", label: "Sports and hobbies", items: items("sports balls; golf flags; fishing rods; books; paint brushes; coffee cups; plane and suitcase"), occasions: ["Father's Day", "Retirement"] },
  { id: "pets", label: "Pets", items: items("paw prints; dog bones; fish shapes; toy balls; cat whiskers"), occasions: ["Pet Birthday"] },
  { id: "gentle", label: "Gentle and supportive", items: items("white flowers; leafy branches; small candlelight accents; feathers; soft clouds"), occasions: ["Sympathy", "Get Well", "Apology"] },
];

export const SUGGESTED_ACCENT_TYPES = 3;

export const WEARABLES: Option[] = items("birthday hat; crown; tiara; graduation cap; Santa hat; flower crown; bow tie; playful glasses; sunglasses; cowboy hat; chef hat; bunny ears; superhero cape; party lei");

/** Wearables that sit in the same place on a person, so two of them conflict. */
export const WEARABLE_SPOT: Record<string, "head" | "neck" | "face" | "back"> = {
  "birthday-hat": "head", crown: "head", tiara: "head", "graduation-cap": "head", "santa-hat": "head", "flower-crown": "head",
  "cowboy-hat": "head", "chef-hat": "head", "bunny-ears": "head",
  "bow-tie": "neck", "party-lei": "neck", "superhero-cape": "back", "playful-glasses": "face", sunglasses: "face",
};

export const BORDER_STYLES: Option[] = items(
  "No border; thin line; double line; rounded frame; dotted; dashed; scalloped; ribbon frame; floral; leafy; confetti; balloon frame; metallic effect; soft gradient; corner accents; polaroid frame; stamp edge; lace; stars; hearts; torn paper",
);

/**
 * Decorate extras (owner, 2026-11-08): stickers and doodles (up to three), a
 * background pattern, and sparkle and glow (one each), each with Custom.
 */
export const STICKERS: Option[] = [
  ...items("hearts; stars; flowers; smiley faces; speech bubbles; arrows and squiggles; party poppers; music notes; rainbows; little suns"),
  { id: "custom", label: "Custom" },
];
export const PATTERNS: Option[] = [
  ...items("polka dots; florals; confetti; stripes; stars; hearts; soft colour wash; watercolour; gingham"),
  { id: "custom", label: "Custom" },
];
export const SPARKLES: Option[] = [
  ...items("sparkles; bokeh lights; soft glow; glitter; fairy lights; sunbeams"),
  { id: "custom", label: "Custom" },
];

export const BORDER_COLOURS: (Option & { swatch: string })[] = [
  ["Automatic", "conic-gradient(#d8b65a,#9e3d58,#2f3e3b,#d8b65a)"], ["White", "#ffffff"], ["Black", "#1d1a17"],
  ["Cream", "#f3e7cf"], ["Gold", "#d8b65a"], ["Silver", "#c7ccd3"], ["Rose gold", "#d9a092"], ["Blush pink", "#f2c3cc"],
  ["Red", "#c0392b"], ["Orange", "#e08a3a"], ["Yellow", "#f1cf4a"], ["Green", "#4f8a5b"], ["Teal", "#2f8a86"],
  ["Blue", "#3f6fb5"], ["Navy", "#22325a"], ["Purple", "#7a4fa3"], ["Multicolour", "linear-gradient(90deg,#e2826f,#f1cf6a,#4f8a5b,#3f6fb5,#7a4fa3)"],
  ["Custom colour", "#ffffff"],
].map(([label, swatch]) => ({ id: label.toLowerCase().replace(/\s+/g, "-"), label, swatch }));

// ---- Song ----------------------------------------------------------------

export type SongMode = "vocal" | "instrumental" | "none";

export type GenrePreset = {
  id: string;
  label: string;
  use: string;
  bpm: number;
  words: [number, number];
  vocalMode: "sung" | "rapped";
  vocalSummary: string;
  productionPrompt: string;
};

/** The ten US and Canada launch presets, in display order (Song Prompt Library). */
export const GENRE_PRESETS: GenrePreset[] = [
  {
    id: "bright-pop", label: "Pop", use: "Birthdays, congratulations, celebrations", bpm: 112, words: [55, 70], vocalMode: "sung",
    vocalSummary: "One clear, buoyant midrange lead vocal with restrained backing harmonies",
    productionPrompt: "Contemporary pop at 112 BPM in 4/4, bright, welcoming and celebratory. Use crisp drums, rounded bass, rhythmic acoustic guitar, light synth chords and a short melodic hook. One clear, buoyant midrange lead vocal with an easy sing-along chorus and restrained backing harmonies. Establish the groove immediately and lift the chorus with fuller chords, not louder competing lead parts. Make the greeting joyful and personal, with clean diction and a polished, spacious mix. Finish with a decisive melodic resolution. No long buildup or solo.",
  },
  {
    id: "country-pop", label: "Country", use: "Family stories, friendship, milestones", bpm: 104, words: [50, 65], vocalMode: "sung",
    vocalSummary: "One warm lead vocal with natural, clearly articulated phrasing",
    productionPrompt: "Country pop at 104 BPM in 4/4, down-to-earth, affectionate and lightly upbeat. Use acoustic guitar, clean electric guitar fills, rounded bass, steady drums and a small amount of pedal-steel color. One warm lead vocal with natural, clearly articulated phrasing and no exaggerated accent. Let the verse feel conversational and the chorus open into a simple, memorable melody. Keep instrumental fills short and between sung lines. Make the mix clean and personal, then finish on a complete cadence. No long guitar solo.",
  },
  {
    id: "warm-rnb", label: "R&B", use: "Affection, appreciation, anniversaries", bpm: 84, words: [40, 55], vocalMode: "sung",
    vocalSummary: "One smooth, expressive midrange lead vocal with restrained melodic runs",
    productionPrompt: "Contemporary R&B ballad at 84 BPM in 4/4, warm, affectionate and unhurried. Use mellow electric piano, rounded bass, soft kick and snare, subtle hi-hats and a light atmospheric pad. One smooth, expressive midrange lead vocal with short phrases, clear consonants and restrained melodic runs. Add soft stacked harmony beneath the chorus while keeping the lead prominent. Make the emotional delivery sincere and intimate without a sensual performance. Use a compact arrangement and a gentle resolved cadence. Avoid long melismas and extended instrumental passages.",
  },
  {
    id: "pop-rock", label: "Pop Rock", use: "Graduation, achievement, encouragement, birthdays", bpm: 120, words: [55, 70], vocalMode: "sung",
    vocalSummary: "One energetic, clear lead vocalist with light group harmony on the chorus",
    productionPrompt: "Melodic pop rock at 120 BPM in 4/4, confident, encouraging and celebratory. Use bright rhythm guitars, melodic bass, punchy controlled drums and a simple piano layer. One energetic, clear lead vocalist with comfortable midrange delivery; use light group harmony on the chorus. Begin with the core groove, then broaden the chorus without aggressive distortion or shouted words. Keep the melody easy to remember and the lyrics prominent. End with a short full-band resolution. No guitar solo, crowd chant or extended build.",
  },
  {
    id: "warm-acoustic-folk", label: "Acoustic", use: "Gratitude, friendship, family, gentle love", bpm: 96, words: [45, 60], vocalMode: "sung",
    vocalSummary: "One clear, warm midrange lead vocal, close and conversational",
    productionPrompt: "Indie folk with a warm acoustic singer-songwriter feel at 96 BPM in 4/4. Use fingerpicked acoustic guitar, rounded acoustic bass, soft shaker and restrained brushed percussion. One clear, warm midrange lead vocal, close and conversational, with natural diction and minimal ornament. Begin simply; add light backing harmony only in the chorus. Keep the feeling tender and reassuring, with enough rhythmic motion for a concise greeting. Keep the arrangement small, the lyric audible and the ending gently resolved. No instrumental solo.",
  },
  {
    id: "gentle-piano", label: "Piano Ballad", use: "Sympathy, support, remembrance, heartfelt thanks", bpm: 76, words: [35, 50], vocalMode: "sung",
    vocalSummary: "One clear, warm solo vocal with natural breathing and modest dynamics",
    productionPrompt: "Gentle piano ballad at 76 BPM in 4/4, compassionate, calm and quietly hopeful. Use soft acoustic piano, a restrained cello line and very light sustained strings; percussion should be absent or barely perceptible. One clear, warm solo vocal with natural breathing, modest dynamics and no theatrical belting. Keep the accompaniment sparse so each word is easy to understand. Let the chorus widen slightly without becoming triumphant. End with a short, complete piano cadence. No dramatic climax, long introduction or instrumental solo.",
  },
  {
    id: "boom-bap-rap", label: "Rap", use: "Inside jokes, birthdays, playful tributes, encouragement", bpm: 94, words: [70, 90], vocalMode: "rapped",
    vocalSummary: "One articulate rapper delivering verse and hook rhythmically",
    productionPrompt: "Boom-bap rap at 94 BPM in 4/4, confident, witty and warm. Use a punchy kick and snare, restrained hi-hats, rounded bass and a short original piano motif. One articulate rapper delivers the verse and hook rhythmically, with clear consonants, natural stresses and space around names. Use a catchy rapped hook, not a sung chorus. Keep the groove steady and the personal words prominent. Follow the supplied emotional tone without inventing insults. End with a concise beat resolution. No sung passages, double-time rush, spoken introduction or unapproved ad-libs.",
  },
  {
    id: "disco-funk", label: "Disco & Funk", use: "Playful birthdays, parties, congratulations", bpm: 116, words: [50, 65], vocalMode: "sung",
    vocalSummary: "One lively, clearly articulated lead singer with simple chorus harmonies",
    productionPrompt: "Disco funk at 116 BPM in 4/4, playful, joyful and danceable. Use a tight four-on-the-floor kick, crisp hi-hats, syncopated electric bass, clean muted rhythm guitar and short bright keyboard chords. One lively, clearly articulated lead singer with simple chorus harmonies. Establish the groove immediately and keep the hook compact. Make room for the personalized words rather than filling gaps with ad-libs. Finish with a crisp full-band cadence. No spoken party introduction, crowd noise, breakdown or extended dance outro.",
  },
  {
    id: "latin-pop", label: "Latin Pop", use: "Celebrations, romance, warm family greetings", bpm: 108, words: [50, 65], vocalMode: "sung",
    vocalSummary: "One expressive lead singer with clearly articulated words",
    productionPrompt: "Acoustic Latin pop at 108 BPM in 4/4, warm, rhythmic and inviting. Use nylon-string guitar, a rounded electric bass, light hand percussion, a crisp drum groove and sparse piano accents. One expressive lead singer performs a melodic verse and an open, memorable chorus with clearly articulated words. Keep the requested lyric language unchanged and avoid exaggerated accents. Add modest chorus harmonies and short fills only between phrases. Finish on a clean full-band cadence. No language switching, extra vocal exclamations or extended instrumental dance section.",
  },
  {
    id: "jazz-swing", label: "Jazz Swing", use: "Elegant birthdays, retirement, lighthearted thanks", bpm: 120, words: [45, 60], vocalMode: "sung",
    vocalSummary: "One clear conversational lead vocal with a relaxed swing feel",
    productionPrompt: "Small-band vocal jazz swing at 120 BPM in 4/4, charming, warm and lightly playful. Use upright bass, brushed swing drums, piano and brief muted-trumpet answers between sung lines. One clear conversational lead vocal uses a relaxed swing feel without rushing names or important words. Keep the ensemble intimate and the chorus melodic, with instrumental responses kept short. Make the arrangement polished and easy to follow. Finish with a compact resolving chord. No scat syllables, improvised lyrics, audience sounds or extended jazz solo.",
  },
];

export const GENRE_IDS = new Set(GENRE_PRESETS.map((preset) => preset.id));

export function genreById(id: string | null | undefined) {
  return GENRE_PRESETS.find((preset) => preset.id === id) || null;
}

export function labelFor(list: Option[], id: string | null | undefined) {
  return list.find((option) => option.id === id)?.label || "";
}

// ---- Limits (confirmed or provisional configuration) ----------------------

export const LIMITS = {
  /** fal-ai/gpt-image-2.5-flare/edit accepts at most 16 image_urls (OpenAPI schema, checked 2026-11-07). */
  maxReferenceImages: 16,
  acceptedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  messageMaxChars: 500,
  messageMaxLines: 4,
  captionTargetWords: [2, 8] as [number, number],
  lyricMaxChars: 750,
  /** Initial draft plus five successful regenerations, per text type. */
  textRegenerations: 5,
  /** The AI writer for the inside message: five drafts in total, the first included (owner, 2026-11-08). */
  aiMessageDrafts: 5,
  songTargetSeconds: 45,
  songToleranceSeconds: 3,
} as const;
