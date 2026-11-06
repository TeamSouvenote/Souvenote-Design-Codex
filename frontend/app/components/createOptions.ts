import type * as React from "react";
import { COMMUNITY_CARDS_HREF } from "./landing/content";
import { BuildSketch, CommunitySketch, SavedSketch, TemplateSketch } from "./WelcomeSketches";

// The create options, shared by the Welcome modal (three of them) and the
// Create Options page /create (all four), so titles, routes and the
// handwritten explanations can't drift apart. All copy is owner-approved.
// /create shows Template and Build as the main two, Community and Saved second.

export type CreateOptionKey = "template" | "build" | "community" | "saved";

export type CreateOption = {
  key: CreateOptionKey;
  href: string;
  title: string;
  sub: string;
  popular: boolean;
  /** Needs at least one AI credit; /create checks the balance with the backend first. */
  requiresCredits: boolean;
  Sketch: () => React.JSX.Element;
};

export const CREATE_OPTIONS: Record<CreateOptionKey, CreateOption> = {
  template: {
    key: "template",
    href: "/create/personalize-a-template",
    title: "Personalize a Template",
    sub: "Need inspiration? Personalize one of our pre-built cards like Horoscope or Comic cards!",
    popular: true,
    requiresCredits: true,
    Sketch: TemplateSketch,
  },
  build: {
    key: "build",
    href: "/create/build-my-card",
    title: "Build My Card",
    sub: "Have your own idea? Answer a few questions and watch your card come to life.",
    popular: false,
    requiresCredits: true,
    Sketch: BuildSketch,
  },
  community: {
    key: "community",
    href: COMMUNITY_CARDS_HREF,
    title: "Community Cards",
    sub: "Choose from our collection of ready to send cards, just add your personal message. No AI credits required.",
    popular: false,
    requiresCredits: false,
    Sketch: CommunitySketch,
  },
  saved: {
    key: "saved",
    href: "/create/my-cards-and-songs",
    title: "Saved Cards & Songs",
    sub: "Resume a draft. Re-send a saved card. Queue another song.",
    popular: false,
    requiresCredits: false,
    Sketch: SavedSketch,
  },
};

/** Welcome modal: Build, Template (larger, in the middle), Community. */
export const WELCOME_OPTION_ORDER: readonly CreateOption[] = [
  CREATE_OPTIONS.build,
  CREATE_OPTIONS.template,
  CREATE_OPTIONS.community,
];
