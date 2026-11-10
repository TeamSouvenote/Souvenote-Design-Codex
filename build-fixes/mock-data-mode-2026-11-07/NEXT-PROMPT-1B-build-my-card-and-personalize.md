# Prompt 1B: Prompt 1's checks for Build My Card and Personalize a Template

Run this before Prompt 2. Copy everything below the line into a new chat.

---

You're continuing the site audit of the Souvenote web app (Next.js 15 App Router, React 19, TypeScript, mock-data mode) on the branch `mock-data-mode`, in `C:\Users\wilso\Desktop\Souvenote AWS DESIGN\frontend`.
- Prompt 1 (`build-fixes/mock-data-mode-2026-11-07/NEXT-PROMPT-1-unopened-screens-build-cookie-debug.md`) has already been run on every other screen.
- It left out **Build My Card** (`/create/build-my-card`) and **Personalize a Template** (`/create/personalize-a-template`) on purpose. Since then the owner has changed their UX and added questions.
- This prompt runs Prompt 1's checks on those two flows. **They're in scope now.** Fix clear bugs in scope straight away, and ask before anything bigger.

## Read first (don't skip)
- **Prompt 1:** `NEXT-PROMPT-1-unopened-screens-build-cookie-debug.md`. Its "Standards", "Tools and method" and "Rules" apply word for word, except the BMC/PT exclusion.
- **The audit:** `SITE-AUDIT-2026-11-08.md`, including §7 (Prompt 1's findings and decisions).
- **The changelog** (`CHANGELOG.md`):
  - §1–13: how the two flows were built and QA'd: one screen per step, phone sections, Custom is terracotta, the AI writer, the logo QR code, idempotent Create, the CSS cleanup proof.
  - Everything from "No eyebrow above a page heading" to the end, especially:
    - the Build My Card writers (sign-off chips, lyric history, out-of-date lyrics);
    - "steering an AI redraft" (the "What should change?" row);
    - "the code is the source of truth";
    - the Personalize writers (`writerBrief`, the "They're your…" field);
    - "Choose the sound" (`PT_genre`, `songPreset`);
    - Prompt 1's two follow-up rounds: busy buttons use `aria-disabled`, `RouteFocus` after a page change, steppers and arrows at their limit.
- **The design system:** `design-system/docs/01-foundations.md` (including "no eyebrow above a page heading"), `02-components.md` 2.13 and 2.17–2.31, `06-governance.md`, `tokens/tokens.css`.
- **Handoff notes:** `BMC-BEDROCK-HANDOFF.md`, `PERSONALIZE-BEDROCK-HANDOFF.md`.
- **My memory notes** in `C:\Users\wilso\.claude\projects\C--Users-wilso-Desktop-Souvenote-AWS-DESIGN\memory\`, especially `crlf-and-shared-dev-server.md` and `prompts-code-is-source-of-truth.md`.

## Task 0: find what changed
- **List the changes:** use `git status`, `git diff --stat HEAD`, and the file modification times since 2026-11-08 21:50 under `components/bmc/`, `components/personalize/`, `styles/bmc-*.css`, `styles/personalize.css`, both `create/*/page.tsx`, `lib/mockInterview.ts`, `lib/mockPersonalize.ts` and `lib/api.ts`. Read the diffs, because not all of the owner's changes are in the changelog.
- **Make an inventory** with a one-line purpose each:
  - every question in `bmc/questionBank.ts`, `personalize/sharedQuestions.ts` and each card file in `personalize/templates/`, marking the **new or changed** ones;
  - every stage, every dialog, and Review with its decision buttons;
  - any new or changed Personalize cards in `catalogue.ts`.

## Task 1 (Prompt 1's task 1): open and measure every step, state and dialog
Measure each at 1280×720, 1024×768, 768×1024 and 375×812, to the standards in Prompt 1 and design system 2.17–2.21:
- desktop steps exactly one screen tall with normal answers;
- no box that scrolls on its own;
- no sideways scroll;
- nothing clipped or spilling;
- Continue always on screen;
- phones: one section per screen with "Part N of M".

Press only real action-bar buttons. **New and changed questions first.**
- **Build My Card:**
  - the photo path (2+ photos: the rights pop-up and the main-photo step) through Decorate with all nine options and Custom opened wherever it exists;
  - Transform; Enhance; "Describe them instead" with the hair, style and signature follow-ups;
  - vibes with Custom;
  - **the message step:** own words, AI writer, the sign-off chips, the "What should change?" redraft row, "Leave the inside blank";
  - sung, instrumental and no song; the genre with "Suggested"; lyrics, a rewrite and the out-of-date notice;
  - **Create at 0 credits** (the cards-or-credits choice, then pay and return to the draft) and with credits; a double press; a reload during Create;
  - **Review:** every decision button, a paid "Try again" at 0 credits, "Approve all three", Delivery and "Back to review".
- **Personalize:**
  - **The gallery:** signed in and signed out, search, occasion chips, row arrows, "Suggest a card" and the band, no-results, Coming soon. Check that **no credits pop-up appears on opening**: it was removed on 2026-11-08.
  - **Horoscope, On This Day, Comic Card,** and a saved template opened from Saved Cards & Songs, each to Review:
    - names and "They're your…";
    - the photo choices and the look follow-ups;
    - every card question;
    - front words; the message step (sign-off and redraft rows);
    - "Add a song?" and **"Choose the sound"** (the default pre-selected with its reason, and changing it);
    - song use, lyrics, Create, Review;
    - "Choose a different template".
  - On This Day, Comic Card, Personalize's message rows and the genre step on a phone have **never been clicked through**. Do them all.
- **For every dialog:** it's labelled and described by elements that exist on every screen; Tab stays inside; Escape closes it (except mid-payment); focus returns; script word in the title.
- **For every view change:** focus goes to the new question heading but not on first load, never to `<body>`, and doesn't clash with `RouteFocus`.
- **Busy buttons** use `aria-disabled`, not `disabled` (2.28): Continue, Create, AI writer, "Suggest more", redrafts, Send idea, Approve.
- Take a screenshot of each distinct state.

## Task 4 (Prompt 1's task 4): production build
Build in a separate fresh temp copy, never in `frontend/`. Report errors, warnings and first-load JS for the two routes. They were Personalize 259 kB and Build My Card 230 kB, the largest in the app; note any change. Fix build errors in `frontend/` and rebuild until it's clean. (Reducing the size is Prompt 2's job.)

## Task 9 (Prompt 1's task 9): debug hooks
Prompt 1 searched outside these flows only.
- Search `components/bmc/`, `components/personalize/`, `lib/mockInterview.ts` and `lib/mockPersonalize.ts` for `window.__…` assignments and other test-only globals.
- Remove the ones nothing uses, keep the ones a QA script uses only in mock mode, and report each one.

(Prompt 1's task 6, "Cookie settings" on the sign-in screens, doesn't apply to these flows.)

## Shared with the rest of the app: tell me before changing
- `flow/FlowDialog.tsx`, `flow/FlowField.tsx`, `flow/TopUpChoiceDialog.tsx`;
- `personalize/PtScrollRow.tsx` (Community Cards uses it);
- `CartPage.tsx`, `lib/api.ts`, `lib/mockApi.ts`, `landing.css`, `layout.tsx`, `RouteFocus.tsx`.

## Deliver
1. The inventory (Task 0).
2. A ranked findings list: severity, flow, step or dialog, size, what's wrong against which standard, the fix. Note what you fixed and what needs my decision.
3. The build result.
4. The debug-hook result.
5. A recap: what changed, what was verified, what wasn't (real Bedrock, fal and Lyria; a printed QR scan; a screen reader; real devices).

Log everything in `CHANGELOG.md`, add a §8 to `SITE-AUDIT-2026-11-08.md`, and update the design-system docs with a governance version entry when a UI pattern changes. Don't commit or push.
