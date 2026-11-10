// Shared by the public landing page (`/`) and the signed-in home (`/home`).

export const COMMUNITY_CARDS_HREF = "/community-cards";

/** Slogan under the logo in the landing footer. */
export const FOOTER_LEDE = "Because the card you give should be as unique as they are.";

// Owner copy, 2026-11-05. "different" is berry; the second sentence is on its own line and
// `closeMark` gets the hand-drawn berry pen stroke.
const HERO_LEDE = {
  leadBefore: "Everyone is ",
  leadAccent: "different",
  leadAfter: ", and their card should be too.",
  closeBefore: "Introducing the first greeting card with ",
  closeMark: "its own personalized song",
  closeAfter: ".",
};

export const HERO_COPY = {
  titleLead: "A card worth",
  titleAccent: "keeping",
  ledeParts: HERO_LEDE,
  /** Plain-text lede, also the landing page's meta description. */
  lede: `${HERO_LEDE.leadBefore}${HERO_LEDE.leadAccent}${HERO_LEDE.leadAfter} ${HERO_LEDE.closeBefore}${HERO_LEDE.closeMark}${HERO_LEDE.closeAfter}`,
  trial: "Includes 2 free credits",
};

// The song that comes with the hero comic card (spelling matches the comic).
export const HERO_SONG: { label: string; title: string; audioSrc: string | null } = {
  label: "Original song",
  title: "Jude Mister to the Rescue",
  // MP3 for the hero player. To enable it, add the file to `public/audio/`
  // and set e.g. "/audio/jude-mister-to-the-rescue.mp3".
  // While null, the play button is clickable but does nothing yet (see SongPlayer.tsx).
  audioSrc: null,
};

/** Palette-agnostic tone slots; colours are assigned in landing.css. */
export type GalleryTone = 1 | 2 | 3 | 4 | 5;

type CardImage = { src: string; alt: string };

export type GalleryTemplate = {
  id: number;
  name: string;
  occasion: string;
  tone: GalleryTone;
  /** Front artwork. Without it, the front shows the occasion name. */
  front?: CardImage;
  /** Back artwork. Without it, the back shows the small Souvenote logo on blue. */
  back?: CardImage;
};

export const GALLERY_TEMPLATES: GalleryTemplate[] = [
  {
    id: 1,
    name: "Your Life As A Hero",
    occasion: "Comic Strip",
    tone: 1,
    front: {
      src: "/assets/pt-comic-cover.jpg",
      alt: "Comic-book style card cover starring a smiling mom as a superhero",
    },
    back: {
      src: "/assets/pt-comic-back.jpg",
      alt: "Four comic panels inside the card, ending with a thank-you from her sons",
    },
  },
  { id: 2, name: "Stars Aligned For You", occasion: "Horoscope", tone: 2 },
  { id: 3, name: "A Day In History", occasion: "On This Day", tone: 3 },
  { id: 4, name: "Once Upon A Card", occasion: "Fairy Tale", tone: 4 },
  { id: 5, name: "Find The Birthday", occasion: "Where's Waldo", tone: 1 },
  { id: 6, name: "Cards For The Strange", occasion: "Dark Holidays", tone: 5 },
];

export type Step = { n: string; title: string; body: string };

// Owner copy, 2026-11-05 (exact wording, including the unspaced dashes).
export const STEPS: Step[] = [
  {
    n: "01",
    title: "Choose your moment",
    body: "Pick an occasion and share a memory—or select a ready-made template to help guide your story.",
  },
  {
    n: "02",
    title: "Let AI bring it to life",
    body: "Souvenote automatically composes a custom song, designs original cover art, and writes a heartfelt inside message tailored to your story.",
  },
  {
    n: "03",
    title: "Print, send, or keep",
    // Big Sender's lowest per-card price (21+ cards) in each country: $6.99 CAD (owner, 2026-11-01), $4.99 USD (owner, 2026-11-08).
    body: "Send a premium physical card directly to their mailbox from $6.99 CAD or $4.99 USD—or keep it as a digital keepsake for a rainy day.",
  },
];

// Competitor claims checked against each company's own website/app on 2026-11-01.
// "×" means the feature was not found there, not that the company denies it.
// Notes: Moonpig has AI stickers + AI message text (no full AI card design) and
// printed QR cards for your own video/voice note (no song). Re-check before launch
// (no on-page legend; keep this note current when re-checking).
export const COMPARISON = {
  features: [
    "Full card art from your prompt",
    "Original song made for them",
    "Create, print & deliver a song card",
  ],
  rows: [
    { service: "Souvenote", values: [true, true, true], highlight: true },
    { service: "Moonpig", values: [false, false, false] },
    { service: "TouchNote", values: [false, false, false] },
    // Was "Hallmark Sign & Send"; that name no longer appears on hallmark.com
    // (now "Custom Greeting Cards" / "Hallmark Cards Now" app).
    { service: "Hallmark", values: [false, false, false] },
  ] as { service: string; values: boolean[]; highlight?: boolean }[],
};

// The FAQ list moved to components/faq/faqData.ts (one list for / , /home and /faq).
