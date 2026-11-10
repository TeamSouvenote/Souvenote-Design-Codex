// Photo-consent wording for the upload rights pop-up (bmc/BmcAttestationDialog.tsx),
// used by Build My Card and Personalize a Template.
//
// Owner decision 2026-11-08: a short summary with links to the full Terms of
// Service and Privacy Policy, and no scroll-to-read gate. Clickwrap is accepted
// in Canada and the US (Meyer v. Uber, 2d Cir. 2017; Berman v. Freedom
// Financial, 9th Cir. 2022; Rudder v. Microsoft, Ont. 1999). Because Quebec's
// Civil Code art. 1435 voids a separate-document term in a consumer contract
// unless it was expressly brought to the consumer's attention, the
// photo-consent promises themselves are shown in full in the pop-up.
// Draft for lawyer review (FAQ_AND_LEGAL_DRAFTS.md §8).

/** Recorded with each acceptance; change it whenever the wording below changes. */
export const ATTESTATION_VERSION = "photo-consent-2026-11-08-draft";

/** The promises shown in full in the pop-up. */
export const ATTG_PROMISES: string[] = [
  "You took the photo, or you own the rights to use it.",
  "Everyone who can be recognized in it has agreed to you uploading it and to us turning it into a card.",
  "Photos of children are only of your own children, or you have their parent's or guardian's permission.",
  "The photo isn't an intimate, sexual or degrading image of anyone, and you won't use the card to mislead or harm a real person.",
  "We use the photo only to make your card. Photos you upload but don't use are deleted after 24 hours, and the rest is kept as the Privacy Policy describes.",
];

/** The two confirmations, each its own unticked checkbox. */
export const ATTG_STATEMENTS = {
  consent: "I confirm the promises above are true for every photo I'm uploading.",
  terms: "I agree to the Terms of Service and Privacy Policy.",
} as const;
