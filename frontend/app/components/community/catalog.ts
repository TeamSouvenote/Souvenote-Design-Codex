import { OCCASION_FILTERS, type OccasionFilter } from "../personalize/catalogue";

// Community Cards seed catalog: REMAINING_SCREENS_BUILD_PROMPT.md Appendix A,
// approved by the owner on 2026-11-08. Ready-made physical cards: the customer
// writes the inside message for free, with no AI and no credits, and pays for
// the printed card with Print and Send or a Big Sender card (PRD §3, §6).
//
// Artwork: every tile uses the logo placeholder until approved, print-ready
// art exists (`approved: false`). The PRD says unapproved art isn't
// launch-ready; see DEVELOPER_HANDOFF.md.

// 2026-11-09 clean-up (owner asked to remove inconsistencies): "You Did It!" ->
// "You Did It" (no other name has punctuation at the end); "Just Because" ->
// "No Reason Needed" (a card shouldn't repeat its row's name); "Thinking of You
// Today" -> "You Crossed My Mind" (too close to Get Well's "Thinking of You").
// Their ids change with the names (slug), which is fine before launch.
export const COMMUNITY_CATALOG_VERSION = "community-2026-11-09";

export type CommunityCard = {
  id: string;
  /** Bumped when the card's art or wording changes; saved on every draft. */
  version: number;
  name: string;
  occasion: OccasionFilter;
  orientation: "portrait" | "landscape";
  /** Front shown on the tile and at Delivery (placeholder for now). */
  art: string;
  /** Print file for the fulfillment partner (placeholder for now). */
  printAsset: string;
  /** Approved, print-ready and cleared for use. */
  approved: boolean;
  /**
   * The original 8-card public selection. Since 2026-11-09 everyone can browse
   * every card, so nothing reads this today; it's kept for a future "featured"
   * row (audit C16, owner: the recommended set).
   */
  publicExample: boolean;
};

export const COMMUNITY_PLACEHOLDER_ART = "/assets/mock-card-front.png";
const PLACEHOLDER_PRINT = "placeholder://community-card";

// [name, landscape?, public example?]
type Seed = [string, boolean?, boolean?];

const SEEDS: Record<OccasionFilter, Seed[]> = {
  "Birthday": [["Another Lap Around the Sun", false, true], ["Make a Wish"], ["Cake First, Questions Later"], ["Confetti Morning", true], ["Golden Year"]],
  "Anniversary": [["Still My Favourite", false, true], ["Year After Year"], ["Two Coffees, One Table", true], ["Here's to Us"]],
  "Wedding": [["Happily Ever Starts Today", false, true], ["Two Hearts, One Home"], ["Something Borrowed, Something New"], ["The First Dance", true]],
  "Valentine's Day": [["Be Mine, Always", false, true], ["You Had Me at Hello"], ["Love Letters"], ["Sweet on You"]],
  "Mother's Day": [["For the Heart of Our Home", false, true], ["Mom, You're the Best"], ["Garden of Thanks"], ["Wisdom & Warmth"]],
  "Father's Day": [["Dad, the Original Hero"], ["Grill Master"], ["Gone Fishing", true], ["Thanks for Everything, Dad"]],
  "Thank You": [["With Heartfelt Thanks", false, true], ["You Made My Day"], ["Grateful for You"], ["A Little Thank-You Bouquet"]],
  "Graduation": [["The Tassel Was Worth the Hassle"], ["Onward & Upward"], ["Cap, Gown & Big Dreams"], ["Class Act"]],
  "New Baby": [["Welcome, Little One", false, true], ["Tiny Toes, Big Love"], ["Hello, World"], ["Brand New Bundle"]],
  "Congratulations": [["You Did It"], ["Cheers to You"], ["Big News, Bigger Smiles"], ["Well Deserved"]],
  "Holiday": [["Warmest Wishes of the Season", false, true], ["Snowy Pines", true], ["Merry & Bright"], ["Joy to Your Home"], ["Happy New Year"]],
  "Get Well": [["Get Well Soon, Friend"], ["Sending Sunshine"], ["Rest, Heal, Repeat"], ["Thinking of You"]],
  "Sympathy": [["With Deepest Sympathy"], ["Forever in Our Hearts"], ["Gentle Thoughts"], ["Remembering With Love"]],
  "Just Because": [["No Reason Needed"], ["You Crossed My Mind"], ["You're One of a Kind"], ["Hello From Me", true]],
};

function slug(occasion: string, name: string) {
  return `${occasion}-${name}`.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const COMMUNITY_CARDS: CommunityCard[] = OCCASION_FILTERS.flatMap((occasion) =>
  SEEDS[occasion].map(([name, landscape = false, publicExample = false]) => ({
    id: slug(occasion, name),
    version: 1,
    name,
    occasion,
    orientation: landscape ? "landscape" as const : "portrait" as const,
    art: COMMUNITY_PLACEHOLDER_ART,
    printAsset: PLACEHOLDER_PRINT,
    approved: false,
    publicExample,
  })),
);

/**
 * Old ids of renamed cards (the 2026-11-09 clean-up), so links shared before the
 * rename still open the card (audit C9). Add a line whenever a name changes.
 * ("You Did It!" → "You Did It" kept its id, so it needs none.)
 */
export const COMMUNITY_CARD_ALIASES: Record<string, string> = {
  "just-because-just-because": "just-because-no-reason-needed",
  "just-because-thinking-of-you-today": "just-because-you-crossed-my-mind",
};

/** A card's own page (audit C11): its link previews, canonical address and Send. */
export function communityCardPath(card: Pick<CommunityCard, "id">) {
  return `/community-cards/${encodeURIComponent(card.id)}`;
}

/** A card by id, following renamed ids. */
export function communityCard(id: string | null | undefined): CommunityCard | null {
  if (!id) return null;
  const current = COMMUNITY_CARD_ALIASES[id] || id;
  return COMMUNITY_CARDS.find((card) => card.id === current) || null;
}

export function matchesCommunitySearch(card: CommunityCard, query: string) {
  const q = query.trim().toLowerCase();
  return !q || `${card.name} ${card.occasion}`.toLowerCase().includes(q);
}

/** Inside message rules (same as the other flows): customer-written, 1–4 short lines, 500 characters including the sign-off. */
export const COMMUNITY_MESSAGE_LIMIT = 500;
export const COMMUNITY_MESSAGE_MAX_LINES = 4;
