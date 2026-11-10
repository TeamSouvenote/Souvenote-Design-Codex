# Sign-up country default — 2026-11-09

## Change
- The Country picker on sign-up now always starts on **Canada**. Before, it
  switched to United States when the browser's language or time zone looked
  American.
- This covers both places a new account picks its country, in
  `frontend/app/components/Auth.tsx`:
  - the email sign-up form (`SignupView`)
  - the Terms + country step after a first Google/social sign-in (`TermsView`)
- Users can still choose United States from the dropdown.
- Not changed: the signed-out "Prices for: Canada | United States" switch on
  Pricing still guesses from the browser (`guessCountry` in
  `pricing/usePriceCountry.ts`).

## Verification
- `npx tsc --noEmit` clean.
