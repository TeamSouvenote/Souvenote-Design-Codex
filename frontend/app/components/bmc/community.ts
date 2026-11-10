"use client";

import * as React from "react";
import { STAGES, type Stage } from "./brief";
import type { Question } from "./questionBank";

// Build My Card opened from Community Cards ("Build a card for the Community",
// /create/build-my-card?for=community; owner, 2026-11-09). Community cards
// can't show real, recognizable people (communityGuidelines.ts), so:
// - the Photo step (labelled "Front") only offers "describe it", with no hair
//   or clothes follow-ups, and the later "Add a photo" link is hidden;
// - there's no song;
// - "Who it's from and to" is skipped, and the story and inside-message steps
//   are worded for a card anyone could send (Community Cards audit C12, owner:
//   only the front becomes public; the inside message is the creator's own copy).
// The draft is saved with `audience: "community"`, so it reopens in this mode
// (audit C2). Everything else is the normal Build My Card flow.

export const BUILD_MY_CARD_PATH = "/create/build-my-card";

/** Community cards have no song (owner, 2026-11-09), so the progress rail and summary skip the Song stage. */
export const COMMUNITY_STAGES: Stage[] = STAGES.filter((stage) => stage !== "Song");

/** The Photo stage is describe-only for community cards, so the rail and summary call it "Front" (audit C21). */
export const COMMUNITY_STAGE_LABELS: Partial<Record<Stage, string>> = { Photo: "Front" };

/** Questions closed up front for a community card (marked answered when the front is described). */
export const COMMUNITY_SKIPPED_QUESTIONS = ["B2_people"];

export const BmcCommunityContext = React.createContext(false);

/** Fired when a saved community draft opens, so the page title (outside the client's context) follows. */
export const BMC_COMMUNITY_EVENT = "souv-bmc-community";

export function useBmcCommunity() {
  return React.useContext(BmcCommunityContext);
}

/** Build My Card's own address, keeping ?for=community, plus any extra query (e.g. draftId). */
export function buildMyCardPath(community: boolean, extra?: Record<string, string>) {
  const params = new URLSearchParams();
  if (community) params.set("for", "community");
  for (const [key, value] of Object.entries(extra || {})) params.set(key, value);
  const query = params.toString();
  return query ? `${BUILD_MY_CARD_PATH}?${query}` : BUILD_MY_CARD_PATH;
}

/** Community wording for some questions (heading, prompt, helper, placeholder), by question id. */
export const COMMUNITY_QUESTION_COPY: Record<string, Partial<Pick<Question, "heading" | "prompt" | "helper" | "placeholder">>> = {
  P1_photo: {
    heading: ["What's on the", "front?"],
    prompt: "Describe the picture you'd like on the front of your card.",
    helper: "Community Cards can't show real, recognizable people, so this card is made from your words, not photos.",
  },
  B0_story: {
    prompt: "What's the moment this card is for?",
    helper: "Keep it general: anyone should be able to send it. A sentence or two about the feeling you want is plenty.",
    placeholder: "A cozy autumn birthday card for anyone who loves the outdoors.",
  },
  M1_inside: {
    helper: "This inside message is for your own copy. When other people send your card from Community Cards, they write their own. Up to 4 short lines and 500 characters.",
  },
};

/**
 * Review's "Share to Community Cards": the Community Cards page with "Share a card I made"
 * open on this card (audit C1). Kept here, not imported from community/catalog.ts, so Build
 * My Card doesn't load the Community and Personalize catalogues (about 14 kB).
 */
export function communitySubmitHref(cardDraftId: string) {
  return `/community-cards?submit=${encodeURIComponent(cardDraftId)}`;
}

export function isCommunitySearch(search: string) {
  return new URLSearchParams(search).get("for") === "community";
}
