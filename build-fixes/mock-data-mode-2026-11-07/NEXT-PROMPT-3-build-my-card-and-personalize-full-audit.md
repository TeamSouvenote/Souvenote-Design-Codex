# Prompt 3: full audit of Build My Card and Personalize a Template

> **SUPERSEDED (owner, 2026-11-09): don't run this.** Its work is split between `NEXT-PROMPT-1B-build-my-card-and-personalize.md` (Prompt 1's checks on the two flows) and `NEXT-PROMPT-2-accessibility-phones-address-launch-performance.md` (now covering the two flows too). Run 1B, then 2, one after the other. Kept for reference only.

Copy everything below the line into a new chat. It applies everything from the site audit, Prompt 1 and Prompt 2 to the two create flows, which the owner has since changed.

---

You're auditing **Build My Card** (`/create/build-my-card`) and **Personalize a Template** (`/create/personalize-a-template`) in the Souvenote web app (Next.js 15 App Router, React 19, TypeScript, mock-data mode), branch `mock-data-mode`, in `C:\Users\wilso\Desktop\Souvenote AWS DESIGN\frontend`.
- Every other screen was audited and fixed on 2026-11-08 and 09; the site audit, Prompt 1 and two follow-up rounds are done.
- These two flows were left out on purpose. Since then the owner has changed their UX and added questions.
- Your job: check every step, state and dialog of both flows against the standards the rest of the app now meets. Report a ranked list, then fix what I approve.
- **This time the two flows are in scope.**

## Read first (don't skip)
- **The rest of the site's audit:** `build-fixes/mock-data-mode-2026-11-07/SITE-AUDIT-2026-11-08.md`, including §7 from Prompt 1 and its follow-ups. Use it for the standards, the method and what "done" looks like elsewhere.
- **The changelog**, `build-fixes/mock-data-mode-2026-11-07/CHANGELOG.md`:
  - **§1–13:** how the two flows were built, QA'd and cleaned up: one screen per step, phone sections, the Custom-is-terracotta rule, the AI writer, the logo QR code, idempotent Create, the CSS cleanup proof.
  - **Everything from "Site audit against the BMC / Personalize standard" to the end:** what changed site-wide.
  - **Especially the new flow work since 2026-11-08 evening:**
    - "No eyebrow above a page heading", plus its follow-up sweep;
    - "Build My Card: better inside-message and lyric writers": sign-off chips, lyric history, front details, vibes in the writer's feeling, out-of-date lyrics notices;
    - "Build My Card #1: steering an AI redraft": the "What should change?" row;
    - "The code is the source of truth for prompts and catalogues";
    - "Personalize: better inside-message and lyric writers": `writerBrief` per card, the "They're your…" relationship field;
    - "Personalize: 'Choose the sound' and a real song setup": the `PT_genre` step, a `songPreset` per card, and the instrumental-preset fix in `compileMusicPrompt`;
    - "Audit follow-up" (both rounds) and "Scroll-row arrows keep focus at the edge": busy buttons use `aria-disabled`, `RouteFocus` after a page change, and steppers at their limit.
- **The previous prompts:** `NEXT-PROMPT-1-unopened-screens-build-cookie-debug.md` and `NEXT-PROMPT-2-accessibility-phones-address-launch-performance.md` in the same folder. Their "Standards", "Tools and method" and "Rules" apply here, except the BMC/PT exclusion.
- **The design system:**
  - `design-system/docs/01-foundations.md`, including the "no eyebrow above a page heading" rule in 1.2;
  - `02-components.md`: 2.13 (logo), 2.17–2.21 (questionnaire, dialogs, one-screen steps, Personalize, song badge) and 2.22–2.31 (the patterns the rest of the app now follows);
  - `06-governance.md` (version history to v1.22+, the "Retired files" list) and `design-system/tokens/tokens.css`.
- **Backend and prompt notes:** `BMC-BEDROCK-HANDOFF.md` and `PERSONALIZE-BEDROCK-HANDOFF.md` (same folder), `REDRAFT-STEERING-PROPOSAL.md`, `PT-SONG-GENRES-PROPOSAL.md`, `reference-materials/Build My Card/OUT-OF-DATE.md`.
- **My memory notes** in `C:\Users\wilso\.claude\projects\C--Users-wilso-Desktop-Souvenote-AWS-DESIGN\memory\`, especially `crlf-and-shared-dev-server.md` (temp copies, CRLF, the `$$` replace trap, fingerprinting) and `prompts-code-is-source-of-truth.md`.

## Step 0: find everything that changed
The owner made UX changes and added questions that may not all be in the changelog.
- **List the changes:** use `git status`, `git diff --stat` against `HEAD`, and the file modification times since 2026-11-08 21:50 under `components/bmc/`, `components/personalize/`, `styles/bmc-*.css`, `styles/personalize.css`, `create/build-my-card/`, `create/personalize-a-template/`, `lib/mockInterview.ts`, `lib/mockPersonalize.ts` and `lib/api.ts`. Then read the diffs.
- **Make an inventory** with a one-line purpose for each item, so coverage is clear:
  - every question in `bmc/questionBank.ts` and in each Personalize card file (`personalize/templates/*.ts` plus `sharedQuestions.ts`), marking the **new or changed** ones;
  - every stage, every dialog (rights attestation, sign-up, creating, spend, top-up choice, approve-all, "Your card so far" sheet);
  - Review and its decision buttons.
- **Check the cards from the ideas PDF:** if the owner added new Personalize cards or changed the catalogue, list them too.

## Step 1: walk both flows in the browser
Use a **fresh temp copy** of `frontend/` on its own port, with its own `.claude/launch.json` entry (local only). Old copies on ports 3100–3180 are stale: never trust them, and never run `next build` in `frontend/`.
- **Sizes:** walk each path at 1280×720, 1024×768, 768×1024 and 375×812.
- **Build My Card paths:**
  - photo (with 2+ photos, so the rights dialog and the main-photo step appear) → Decorate with all nine options, and Custom opened wherever it exists;
  - Transform;
  - Enhance;
  - "No photo? Describe them instead", with the hair, style and signature follow-ups;
  - vibes with Custom;
  - the message step: own words, AI writer, sign-off chips, "What should change?" redraft, "Leave the inside blank";
  - a song that's sung, an instrumental and no song; the genre with "Suggested"; lyrics, a rewrite and the out-of-date notice;
  - Create at 0 credits (the top-up choice) and with credits;
  - Review: every decision button, a paid "Try again" at 0 credits, "Approve all three", then Delivery and "Back to review".
- **Personalize paths:**
  - **Gallery:** signed in and signed out (the sign-up band), search, occasion chips, row arrows, "Suggest a card" and the suggestion band, a no-results search, Coming soon tiles.
  - **Each open card** (Horoscope, On This Day, Comic Card, plus a saved template from Saved Cards & Songs):
    - names with "They're your…";
    - the photo step (Use my photo, keep as it is, no photo with the look follow-ups where the card allows them);
    - every card-specific question;
    - front words; the message step (same checks as Build My Card);
    - "Add a song?" and "Choose the sound" (default pre-selected with its reason, and changing it);
    - song use, lyrics, Create, Review;
    - "Choose a different template".
  - **Previously never clicked through:** On This Day and Comic Card to the end; Personalize's message sign-off and redraft rows; the genre step on a phone.
- **Measure every step and dialog** with the measuring script (see "Tools"):
  - desktop pages at least one screen tall, and exactly one when the answers are normal;
  - no box that scrolls on its own (the only exception: none now, since the rights reader's scroll gate was removed; check that);
  - no sideways scroll; nothing clipped or spilling past its card; Continue always on screen;
  - phones show one section per screen with "Part N of M" markers.
- **Use only real action-bar buttons**, never option labels that happen to start with "Continue".
- Take a screenshot of each distinct state.

## Step 2: check against every standard

### Colour (design system v1.3+)
- **Tokens only:** no raw hex in `bmc-*.css` and `personalize.css` (grep). The `--l-field-line` and `--l-graphite` tokens now exist.
- **Gold means AI only:** AI buttons, the AI box, "Suggested" badges, the song step, the genre suggestion. It's never decoration: the chip dots never use gold. Text on gold is espresso.
- **Berry:** one script word per heading, labels, hovers, errors.
- **Forest:** actions, selected chips and options, and the review band, with ivory text, oat muted text and gold accents on it (never berry).
- **Terracotta:** decoration, plus "yours" (your photos, your message version, every Custom and "Describe in my own words" option). It's never text; text on a terracotta fill is deep espresso.
- **Stage colours:** as in 2.17 and 2.20. Template tones as in 2.20.
- **New controls:** check the sign-off chips, the "What should change?" row, the relationship field, the genre step and any new question controls against these rules.

### Logo
The gold logo only on forest, using the pre-tinted image files. The card placeholders use `CardPlaceholder`. The retired `hero-souvenote-card-face.png` and `logomark-gold.png` aren't used anywhere.

### Layout and fit
- **Even grids:** on phones, two columns of rounded rectangles, with a lone last item spanning the row. From 600px, groups of three sit three across and groups of four sit two by two.
- **Tiles and buttons:** tile titles share a top line, badges sit on the tile edge, action buttons are equal and on one line with labels that don't wrap.
- **The site's newer standards:** equal-width action buttons (2.31), compact pop-ups that fit one screen (2.29, 2.31).
- **No eyebrow above a page heading** (Foundations 1.2). Personalize's "Personalizing" label stays, because it names the template.

### Credits and payment
- No credit or card prompt before Create or a paid redo. **Check Personalize's gallery no longer shows a "Before you start" pop-up:** it was removed on 2026-11-08.
- When credits are short, the cards-or-credits choice appears ("Your card is saved"), and paying returns to the same draft (`CartPage.tsx` `CREATE_FLOW_RETURNS`).
- **Create and every paid redo are idempotent:** a double press or a retry never charges twice, and a failure never says "no credits were used" after a charge. Test a double press, and a reload during Create.

### Accessibility
- **Toggles and radios:** toggles use `aria-pressed` with one accessible name; a radio group always has a checked item. Check the new chips and rows.
- **Dialogs:**
  - every dialog uses `FlowDialog`;
  - labelled and described by elements that exist on every screen;
  - Tab stays inside, Escape closes (except while a paid action runs), focus returns;
  - title script words.
- **Focus:**
  - moves to the new question heading on a step change, but not on first load;
  - `RouteFocus` mustn't fight the questionnaire's own focus;
  - a button that disappears never leaves focus on `<body>`;
  - **busy buttons use `aria-disabled`, not `disabled`** (2.28), including Continue, Create, the AI writer, "Suggest more", redrafts, Send idea and Approve.
- **Fields:**
  - every field has a label; a label that repeats the heading is kept for screen readers only;
  - field errors are announced and focus the first invalid field (`focusFirstInvalid` in `flow/FlowField.tsx` is the shared helper);
  - counters (names and dates, the comic bubbles, the redraft note at 120 characters) are announced sensibly.
- **Targets:** at least 44px for main controls, never under 24px. Steppers and arrows at their limit use `aria-disabled` and keep focus.
- **Keyboard only:** run through one full path of each flow with the keyboard, plus the arrow keys in radio groups.
- **Reduced motion:** emulate `prefers-reduced-motion`. The thinking dots and the spinning comic card stop, and transitions go.
- **High contrast:** emulate `forced-colors: active`. Selected options stay outlined, and the logo and focus rings stay visible.
- **Hover and focus:** check the computed styles of the main controls in their `:hover` and `:focus-visible` states.
- **Screen reader:** a real NVDA or VoiceOver pass can't be done here. Write me a short checklist for these flows, and say so.

### Text and prompts
- **Wording:** named days keep their capitals (Mother's Day, Christmas); drafts are in the second person ("your garden"). Grep the source for control characters (`\x00-\x08`, `\x0B`, `\x0C`, `\x0E-\x1F`); one shell edit once left a literal backspace in a regex.
- **The code is the source of truth:** `bmc/prompts.ts`, `bmc/catalog.ts`, `personalize/ptPrompts.ts` and the card files are the masters. Check that any changed wording bumped the version constants (`PROMPT_TEMPLATE_VERSION`, the catalog version, `PT_PROMPT_VERSION`, each card's version).
- **New questions:** each one feeds the brief, the compiled image and music prompts and the text-writer context where it should, and "Your card so far". Old saved drafts still load (`mergeKnown` and the migrations).
- **The mock writers** (`lib/mockInterview.ts`, `lib/mockPersonalize.ts`) handle the new questions without errors.

### Next.js and React code
- **Images:** `next/image` for static assets; `<img>` only for blob, data or remote URLs, with a reasoned eslint-disable. ESLint is at 0 problems app-wide; keep it there.
- **Unused things:** no unused state, exports, props or imports; no dead CSS selectors. The site's dead-CSS script `%TEMP%\souv-audit-20261108\deadcss.js` handles built class names like `is-${…}`; report only first.
- **eslint-disable:** none for react-hooks, except the documented run-once effects.
- **Shared code:** shared helpers instead of duplicates (with `formatAmount`, `orderTotals` and `addItemToCart` now shared, the flows shouldn't format money or write the cart themselves).
- **Correctness:** client/server boundaries are correct; no refs written during render.
- **Route size:** in the last production build Personalize was 259 kB and Build My Card 230 kB of first-load JS, the two largest routes. Find out why (a bundle analysis in a temp copy) and propose reductions, such as lazy-loading the QR library, the dialogs and the card files.

## Step 3: report, then fix after approval
1. **A ranked list:** severity (bug, inconsistency, polish), flow, step or dialog, size, what's wrong against which standard, and the proposed fix. Put new and changed questions first. Also list what's fine.
2. **Ask which to apply.** Then apply them:
   - keep each flow's CSS in its own stylesheet (`bmc-questionnaire.css`, `bmc-dialogs.css`, `bmc-polish.css`, `personalize.css`);
   - use tokens or `--l-*` variables only;
   - re-measure at the four sizes;
   - prove any CSS cleanup changes nothing on screen with the computed-style fingerprint.
3. **Shared with the rest of the app, so tell me before changing them:**
   - `flow/FlowDialog.tsx`, `flow/FlowField.tsx`, `flow/TopUpChoiceDialog.tsx`;
   - `personalize/PtScrollRow.tsx` (Community Cards uses it);
   - `CartPage.tsx`, `lib/api.ts`, `lib/mockApi.ts`, `landing.css`, `layout.tsx`, `RouteFocus.tsx`.

## Tools and method
- **Temp copy:**
  - Copy `frontend/` (excluding `node_modules` and `.next`) into a fresh, uniquely named `%TEMP%` folder, add a `node_modules` junction (PowerShell `New-Item -ItemType Junction`), add a launch config and start it with `preview_start`.
  - Re-sync changed files before each check.
  - Use a separate copy for `next build`.
- **Measuring script:** `%TEMP%\souv-audit-20261108\install.js`. Copy it into the copy's `public/`, then load it with `fetch('/__audit-install.js').then(r => r.text()).then(eval)`. It gives `window.__run(urls, sizes, wait, actScript)` and `window.__wait()`.
- **Fingerprint:** `__audit-fp2.js`, from the old copy `%TEMP%\souv-audit2-copy-190833\public\` (don't edit that copy; copy the script). Run a baseline twice to measure noise.
- **The preview pane:**
  - When the window is hidden, `requestAnimationFrame` may not fire, and screenshots may catch animations mid-way. For focus checks, swap `requestAnimationFrame` for a 16ms timer in the test page only, and say so.
  - The pane may also scale viewports: measure in fixed-size iframes.
- **Mock data:**
  - Demo login `demo@souvenote.com` / `Souvenote123!`. The two-step code, if turned on, is `246810`.
  - Credits: `localStorage.souv_mock_db.balances["11111111-2222-4333-8444-555555555555"]`.
  - Reset with the Mock data badge.
- **Scripted edits:**
  - Many files are CRLF.
  - **JS `replace()` turns `$$` into `$`**: use `split/join`, a replacer function or the Edit tool.
  - Heredocs with apostrophes and inline `node -e` with backticks break: write script files.

## Rules
- **Never delete anything:**
  - Don't `rm` files; retire them in the docs (governance "Retired files").
  - Put screenshots and scratch files in a new, uniquely named temp folder outside the repo.
  - Back up every file before a scripted rewrite.
- **Other sessions may be working in this folder:**
  - Check file modification times before editing, and don't edit files changed in the last few minutes without asking.
  - Never run `next build` in `frontend/`.
- **Log every change** in `CHANGELOG.md`: request, what changed, files, verified, not covered. Add a §8 to `SITE-AUDIT-2026-11-08.md` for this audit. Update the design-system docs, with a governance version entry, whenever a UI pattern changes. Keep the code-is-source-of-truth headers and version bumps.
- **Don't commit or push** until I say so.
- **Report honestly:** say what you couldn't check (real Bedrock, fal and Lyria; a printed QR scan; a screen reader; real devices). Don't present a check as done if you only partly did it.
