import { readCookieConsent } from "./consent";

// Product analytics gate (PostHog, provisional; PRD tech table). Analytics may
// run only when BOTH are true:
//   1. the visitor accepted analytics cookies in the banner (lib/consent.ts), and
//   2. an analytics key is configured (NEXT_PUBLIC_POSTHOG_KEY).
// The PostHog package isn't installed yet (owner decision 2026-11-08: add it
// once there's an account). Setup steps are in DEVELOPER_HANDOFF.md: install
// posthog-js, initialise it only where analyticsAllowed() is true, never send
// card text, messages, recipients, photos or songs, and call
// posthog.opt_out_capturing() when the consent changes to "declined".

export const ANALYTICS_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || "";

export function analyticsAllowed(): boolean {
  return Boolean(ANALYTICS_KEY) && readCookieConsent()?.choice === "accepted";
}
