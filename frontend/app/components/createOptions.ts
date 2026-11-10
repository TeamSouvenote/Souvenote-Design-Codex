import type * as React from "react";
import { COMMUNITY_CARDS_HREF } from "./landing/content";
import { BuildSketch, CommunitySketch, SavedSketch, TemplateSketch } from "./WelcomeSketches";

// The create options, shared by the Welcome modal (three of them) and the
// Create Options page /create (all four), so titles, routes and the
// handwritten explanations can't drift apart. All copy is owner-approved.
// /create shows Template and Build as the main two, Community and Saved second.
// No option checks credits on the way in: Personalize a Template and Build My
// Card ask for a top-up only when Create (or a paid redo) is pressed without
// enough credits (owner, 2026-11-07 for Build, 2026-11-08 for Personalize).

export type CreateOptionKey = "template" | "build" | "community" | "saved";

export type CreateOption = {
  key: CreateOptionKey;
  href: string;
  title: string;
  sub: string;
  /** One-line "what this does", for the "Your cards are waiting" pop-up after a purchase (owner, 2026-11-08). */
  short: string;
  popular: boolean;
  /** Can come with a song (shows the round music-note badge, owner 2026-11-08). */
  song: boolean;
  Sketch: () => React.JSX.Element;
};

export const CREATE_OPTIONS: Record<CreateOptionKey, CreateOption> = {
  template: {
    key: "template",
    href: "/create/personalize-a-template",
    title: "Personalize a Template",
    sub: "Need inspiration? Personalize one of our pre-built cards like Horoscope or Comic cards!",
    short: "Start from one of our designs, like Horoscope or Comic Card, and make it yours.",
    popular: true,
    song: true,
    Sketch: TemplateSketch,
  },
  build: {
    key: "build",
    href: "/create/build-my-card",
    title: "Build My Card",
    sub: "Have your own idea? Answer a few questions and watch your card come to life.",
    short: "Answer a few questions and we'll create a card from your own idea.",
    popular: false,
    song: true,
    Sketch: BuildSketch,
  },
  community: {
    key: "community",
    href: COMMUNITY_CARDS_HREF,
    title: "Community Cards",
    sub: "Choose from our collection of ready to send cards, just add your personal message. No AI credits required.",
    short: "Pick a ready-made card and add your own message. No AI credits used.",
    popular: false,
    song: false,
    Sketch: CommunitySketch,
  },
  saved: {
    key: "saved",
    href: "/create/my-cards-and-songs",
    title: "Saved Cards & Songs",
    sub: "Resume a draft. Re-send a saved card. Queue another song.",
    short: "Finish a draft, or send a card you've already made.",
    popular: false,
    song: false,
    Sketch: SavedSketch,
  },
};

/** Welcome modal: Build, Template (larger, in the middle), Community. */
export const WELCOME_OPTION_ORDER: readonly CreateOption[] = [
  CREATE_OPTIONS.build,
  CREATE_OPTIONS.template,
  CREATE_OPTIONS.community,
];
