// The Personalize a Template gallery, from "Personalize a Template ideas.pdf"
// (owner, 2026-11-08). Rows follow the PDF's headings in its order; the
// occasion chips and search filter across every template. Only templates with
// a card file in ./templates open the questionnaire ("draft"); every other idea
// is a "Coming soon" tile. Tile images are placeholders (the logo on forest):
// the tiles are general examples of each template, not a customer's result.

export const CATALOGUE_VERSION = "pt-catalogue-2026-11-08a";

export type CatalogueHeading = { id: string; label: string };

export const HEADINGS: CatalogueHeading[] = [
  { id: "popular", label: "Most popular" },
  { id: "photo", label: "Photo-driven templates" },
  { id: "time", label: "Time-based templates" },
  { id: "emotional", label: "Emotional / occasion templates" },
  { id: "pop", label: "Pop-culture / entertainment templates" },
  { id: "character", label: "Character & style transformations" },
  { id: "portrait", label: "Visual style & portrait cards" },
  { id: "keepsake", label: "Original keepsake & celebration concepts" },
  { id: "interactive", label: "Interactive & narrative keepsake concepts" },
  { id: "additional", label: "Additional original concepts" },
  { id: "pets", label: "Pet-centered concepts" },
];

export const OCCASION_FILTERS = [
  "Birthday", "Anniversary", "Wedding", "Valentine's Day", "Mother's Day", "Father's Day", "Thank You",
  "Graduation", "New Baby", "Congratulations", "Holiday", "Get Well", "Sympathy", "Just Because",
] as const;

export type OccasionFilter = typeof OCCASION_FILTERS[number];

export type CatalogueEntry = {
  id: string;
  name: string;
  heading: string;
  /** The idea's one line from the PDF (used by search; not shown on Coming soon tiles). */
  idea: string;
  occasions: OccasionFilter[];
  status: "draft" | "coming-soon";
};

const B: OccasionFilter = "Birthday";
const A: OccasionFilter = "Anniversary";
const W: OccasionFilter = "Wedding";
const V: OccasionFilter = "Valentine's Day";
const M: OccasionFilter = "Mother's Day";
const F: OccasionFilter = "Father's Day";
const T: OccasionFilter = "Thank You";
const G: OccasionFilter = "Graduation";
const N: OccasionFilter = "New Baby";
const C: OccasionFilter = "Congratulations";
const H: OccasionFilter = "Holiday";
const GW: OccasionFilter = "Get Well";
const S: OccasionFilter = "Sympathy";
const J: OccasionFilter = "Just Because";

type Row = [id: string, name: string, idea: string, occasions: OccasionFilter[]];

const ROWS: Record<string, Row[]> = {
  popular: [
    ["horoscope", "Horoscope", "An astrology-inspired card built around the recipient's sign and traits.", [B]],
    ["on-this-day", "On This Day", "A vintage newspaper card that spotlights a real story from the day they were born.", [B]],
    ["comic-card", "Comic Card", "The recipient stars in a four-panel comic strip in a chosen comic style.", [B, J, F, C]],
    ["book-movie-cover", "Book / Movie Cover", "A photo becomes a parody book cover or biopic poster about the recipient.", [B, A, J]],
    ["mental-health", "Mental Health", "A thoughtful encouragement card for burnout, grief, anxiety or another difficult stretch.", [GW, J]],
    ["courtroom-case", "Courtroom Case", "A playful mock indictment for fictional offenses such as stealing the spotlight.", [B, J]],
  ],
  photo: [
    ["couples-cards", "Couples Cards", "A two-person photo leads an anniversary, first-home or other shared-milestone card.", [A, V, W]],
    ["wheres-waldo", "Where's Waldo", "The recipient's photo is hidden in a dense illustrated scene, with an optional clue.", [B, J]],
    ["stamp-look-alike", "Stamp Look-Alike", "A portrait reimagined as a vintage postage stamp, with country, denomination and postmark.", [B, J]],
    ["fairy-tale-for-kids", "Fairy Tale for Kids", "A personalized storybook card that makes a child the hero of the illustration.", [B]],
    ["animated-memories", "Animated Memories", "A photo gains a subtle moving-portrait effect for a digital-only card.", [A, J]],
  ],
  time: [
    ["time-capsule", "Time Capsule", "A sealed card with a QR reveal that unlocks on a future date.", [B, A, G]],
    ["subscription-cards", "Subscription Cards", "A recurring series of cards, such as daily affirmations or a countdown to an occasion.", [J]],
    ["goal-filler", "Goal Filler", "A goal-based recurring series with encouragement, check-ins and milestone celebrations.", [C, J]],
    ["invitations", "Invitations", "Custom invitations for birthdays, weddings, housewarmings and baby showers.", [B, W, N]],
    ["congrats-milestones", "Congrats Milestones", "Celebration cards for a new home, promotion, retirement, new baby, graduation or engagement.", [C, G, N, W]],
  ],
  emotional: [
    ["missing-you", "I'll Be Missing You", "A sympathy or memorial card with gentle cloud imagery and space for a tribute.", [S]],
    ["dark-holidays", "Dark Holidays", "Dark-humor takes on mainstream holidays, and anti-holiday cards.", [H]],
    ["mystery-donations", "Mystery Donations", "A reveal card that tells the recipient a donation has been made in their name.", [H, T, S]],
    ["fortune-cards", "Fortune Cards", "Fortune-cookie one-liners and tarot-style readings for past, present and future.", [B, J]],
  ],
  pop: [
    ["lyric-cards", "Songs / Lyric Cards", "Cards built around AI-original lyric-style verses for a chosen genre, era or vibe.", [B, A, V, J]],
    ["recipe-cards", "Recipe Cards", "A family recipe turned into a keepsake card, with room for its story and a dish photo.", [T, M, F, H]],
    ["restaurant-gift", "Restaurant Gift", "A greeting card that presents a restaurant or dining gift credit.", [B, T, A]],
    ["poems-generator", "Poems Generator", "A personalized poem for or about the recipient in a chosen poetic style.", [B, A, V, M, F, S, J]],
    ["chapter-cards", "Chapter Cards", "A card designed like a page from a novel, with a chapter heading and prose-style body.", [B, A, G]],
  ],
  character: [
    ["family-coloring-outline", "Family Coloring Outline", "A family photo turned into a clean black-and-white outline to print and color in.", [M, F, H, J]],
    ["seventies-trend-look", "1970s Trend Look", "A portrait regenerated with 1970s-inspired fashion, colour and mood.", [B, J]],
    ["astronaut-portrait", "Astronaut Portrait", "A portrait regenerated with the subject as an astronaut in a space scene.", [B, G, C]],
    ["greek-warrior", "Greek Warrior", "A portrait regenerated with the subject as a Greek warrior in a mythic setting.", [B, F, C]],
  ],
  portrait: [
    ["analog-realism", "Anti-AI Analog Realism & Heavy Grain", "A portrait styled like an authentic 35mm photograph, with grain and light leaks.", [B, A, J]],
    ["cinematic-movie-poster", "Generic Cinematic Movie Poster", "The user's likeness in an original genre movie-poster composition with bold type.", [B, A, C]],
    ["humanized-pet", "Humanized Pet & Dual Companion", "A pet becomes a human companion, or the user and pet pose in a retro portrait.", [B, J]],
    ["cultural-heritage", "Cultural Heritage & Festive Ceremonial", "A portrait in traditional festive attire with seasonal florals and historic backdrops.", [H, W]],
    ["acoustic-stage", "Intimate Acoustic Stage Performance", "The subject in a warm, intimate music-performance setting.", [B, C]],
    ["quiet-luxury", "Quiet Luxury & High-Fashion Studio", "A minimalist fashion-editorial portrait in neutral monochrome tones.", [B, C]],
    ["cottagecore", "Cottagecore & Pastoral Impressionism", "A pastoral portrait with wildflower meadows and painterly softness.", [B, M, J]],
    ["retro-sportswear", "Retro Heritage Sportswear", "A vintage-sports portrait with unbranded historic athletic knits.", [B, F]],
    ["time-travel-futurism", "Cinematic Time-Travel & Futurism", "An original futuristic portrait in a neon cityscape.", [B, J]],
    ["digital-scrapbook", "Digital Scrapbook & Multi-Frame Collage", "A keepsake assembled as a multi-frame scrapbook with layered captions.", [B, A, G]],
  ],
  keepsake: [
    ["then-and-now", "Then & Now", "A childhood photo paired with a current photo in one commemorative card.", [B, G, A]],
    ["family-tree-portrait", "Family Tree Portrait", "An illustrated tree with family names, dates and photo medallions.", [M, F, H]],
    ["pet-adoption-anniversary", "Pet Adoption Anniversary", "A pet's gotcha day, with a portrait, timeline or paw-print motif.", [A, J]],
    ["home-portrait", "Home Portrait", "A home photo turned into an architectural sketch, watercolour or blueprint.", [C, T, H]],
    ["star-map-moment", "Star Map Moment", "An original night-sky map for a meaningful date and place.", [A, W, N, B]],
    ["travel-postcard", "Travel Postcard Series", "A custom retro postcard from a real trip, dream destination or honeymoon.", [A, J]],
    ["garden-in-bloom", "Garden in Bloom", "Family members represented as flowers in a botanical arrangement.", [M, F, A]],
    ["memory-quilt", "Memory Quilt", "A collage designed as fabric squares, each with a photo, name or small memory.", [A, M, S]],
    ["birthday-timeline", "Birthday Timeline", "A \"chapters of your life\" card built from milestones you supply.", [B]],
    ["neighborhood-map", "Neighborhood Map", "A stylized map of meaningful places like a first date, home or favourite café.", [A, V]],
    ["award-ceremony", "Award Ceremony", "A playful award card, such as \"Best Dad Jokes\" or \"World's Most Reliable Friend\".", [F, M, T, J]],
    ["game-night-card", "Game Night Card", "A board-game or playing-card design built around inside jokes.", [B, J]],
    ["plant-parent-portrait", "Plant Parent Portrait", "A person and their plants in a botanical editorial portrait.", [B, J]],
    ["family-recipe-timeline", "Family Recipe Timeline", "A recipe card paired with the family line who passed it down.", [M, F, H]],
    ["letter-from-the-future", "Letter From the Future", "An optimistic fictional letter dated years ahead, from your details only.", [G, B, W]],
    ["seasonal-window-scene", "Seasonal Window Scene", "The family seen through an illustrated window in any season.", [H, J]],
    ["puzzle-reveal", "Puzzle Reveal", "An original jigsaw or rebus-style card that reveals the message.", [B, J]],
    ["pet-employee-of-the-month", "Pet Employee of the Month", "A humorous office-style pet portrait and achievement certificate.", [J, C]],
    ["zine-cover", "Zine Cover", "An indie mini-magazine cover celebrating a person, hobby or milestone.", [B, C]],
    ["constellation-of-us", "Constellation of Us", "Relationship milestones drawn as a custom constellation.", [A, V, W]],
  ],
  interactive: [
    ["voice-note-keepsake", "Voice Note Keepsake", "A card with a QR code linking to a short recorded message.", [B, J, S]],
    ["family-trivia-card", "Family Trivia Card", "A personalized quiz about the recipient or family.", [B, H]],
    ["year-in-numbers", "The Year in Numbers", "An infographic of birthdays, trips, milestones and funny stats.", [B, A, H]],
    ["secret-decoder", "Secret Decoder", "A custom cipher or decoder wheel that reveals the inside message.", [B, J]],
    ["mini-newspaper", "Mini Newspaper", "A fictional newspaper front page covering the recipient's milestone.", [B, G, C]],
    ["passport-to-adventure", "Passport to Adventure", "A passport-and-stamp card for trips, moves or shared adventures.", [A, C]],
    ["good-deeds-ledger", "Good Deeds Ledger", "A playful receipt or ledger that totals someone's kindnesses.", [T, M, F]],
    ["photo-booth-strip", "Photo Booth Strip", "A designed photo strip with several of your photos, captions and dates.", [A, V, B]],
    ["custom-calendar-page", "Custom Calendar Page", "One meaningful month filled with family dates and photos.", [H, A]],
    ["family-crest", "Family Crest", "An emblem built from chosen values, hobbies, colours and symbols.", [W, H, F]],
    ["message-in-a-bottle", "Message in a Bottle", "An illustrated found-letter or bottle-reveal card with a personal note.", [V, J]],
    ["dream-ticket", "Dream Ticket", "A concert, flight, train or event-ticket design for a real or imagined trip.", [B, A, V]],
    ["compliment-deck", "The Compliment Deck", "One card from a collectible set, each with a personalized compliment.", [J, T]],
    ["milestone-bingo", "Milestone Bingo", "A bingo card of future hopes, shared goals or funny predictions.", [B, W, G]],
    ["care-package-checklist", "Care Package Checklist", "A warm \"things I'd send you\" card for someone far away.", [GW, J]],
    ["pet-horoscope", "Pet Horoscope", "A playful zodiac reading based on a pet's traits and birthday.", [B]],
    ["family-superlatives", "Family Superlatives", "An award-show card with custom categories for relatives or friends.", [H, F, M]],
    ["soundtrack-of-us", "Soundtrack of Us", "A card with your song list and the memories behind it.", [A, V]],
    ["holiday-ornament-collection", "Holiday Ornament Collection", "Family members or milestones drawn as decorative ornaments.", [H]],
    ["open-when-series", "Open When... Series", "A bundle of cards like \"open when you need a laugh\".", [J, GW]],
  ],
  additional: [
    ["a-day-in-our-life", "A Day in Our Life", "A day-in-the-life card built from small moments, routines and photo vignettes.", [A, M, F]],
    ["birthday-forecast", "Birthday Forecast", "A playful weather forecast for their year ahead.", [B]],
    ["family-field-guide", "Family Field Guide", "A nature-guide card celebrating each person's habits and talents.", [H, M, F]],
    ["love-language-menu", "Love Language Menu", "A restaurant-menu card listing the care, joy and support they bring.", [V, A]],
    ["tiny-museum", "Tiny Museum", "A miniature museum exhibit of their favourite things and quirks.", [B, J]],
    ["postmarks-from-home", "Postmarks From Home", "A mail-and-postmark collage of places they have lived or loved.", [J, H]],
    ["through-the-years", "Through the Years", "Real photos from childhood to now, arranged as a visual timeline.", [B, G, A]],
    ["missing-person-poster", "Missing Person Poster", "A humorous vintage wanted poster with funny habits and a ridiculous reward.", [B, J]],
    ["treasure-map-of-memories", "Treasure Map of Memories", "An illustrated treasure map where each stop is a shared memory.", [A, V]],
    ["limited-edition-human", "Limited Edition Human", "A playful product ad presenting them as a one-of-a-kind collectible.", [B, J]],
    ["seeds-of-your-influence", "Seeds of Your Influence", "A seed-packet card celebrating what they've helped grow in others.", [T, M, F]],
    ["life-achievement-unlocked", "Life Achievement Unlocked", "A retro video-game card with achievements, abilities and a new level.", [B, G, C]],
  ],
  pets: [
    ["pet-paradise", "Pet Paradise", "A beloved pet reimagined in their ideal world of favourite things.", [B, J]],
  ],
};

/** Templates with a card file (questions, branches and prompts). Everything else is Coming soon. */
const DRAFT_IDS = new Set(["horoscope", "on-this-day", "comic-card"]);

export const CATALOGUE: CatalogueEntry[] = HEADINGS.flatMap((heading) =>
  (ROWS[heading.id] || []).map(([id, name, idea, occasions]) => ({
    id, name, idea, occasions, heading: heading.id, status: DRAFT_IDS.has(id) ? "draft" as const : "coming-soon" as const,
  })),
);

export type TemplateTone = 1 | 2 | 3 | 4 | 5;

/**
 * Each template's card tone: the landing gallery's five gradients (gold, forest,
 * paper, terracotta, berry; `--l-tone-1`…`5`), in catalogue order so cards
 * side by side always differ. Templates outside the catalogue use forest.
 */
export function templateTone(id: string | null | undefined): TemplateTone {
  const index = CATALOGUE.findIndex((entry) => entry.id === id);
  return index < 0 ? 2 : ((index % 5) + 1) as TemplateTone;
}

export function catalogueEntry(id: string | null | undefined) {
  return CATALOGUE.find((entry) => entry.id === id) || null;
}

export function matchesSearch(entry: CatalogueEntry, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return `${entry.name} ${entry.idea} ${entry.occasions.join(" ")}`.toLowerCase().includes(q);
}
