// "Last updated" dates for the documents a user accepts at sign-up. The legal
// pages (components/LegalData.tsx) display these, and sign-up records them as
// the accepted version, so the two can never drift apart.
export const LEGAL_LAST_UPDATED = {
  terms: "June 1, 2026",
  privacy: "June 1, 2026",
} as const;

/** Stored as `users.terms_version` when someone accepts the Terms and Privacy Policy. */
export const TERMS_VERSION = `terms:${LEGAL_LAST_UPDATED.terms}|privacy:${LEGAL_LAST_UPDATED.privacy}`;
