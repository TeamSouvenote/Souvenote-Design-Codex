# Mock data mode — session change log

Branch: `mock-data-mode` (from `landing-page-redesign` @ 9160c51)
Started: 2026-11-07
Status: **uncommitted** — everything below gets committed and pushed together at the end of the session.

## Do not commit
- `.claude/launch.json` (local preview config)
- `.npm-cache/` (repo root, created by the preview run)
- Pre-existing untracked files not from this session: `CREATE_OPTIONS_BUILD_PROMPT.md`, `build-fixes/cart-delivery-2026-11-06/screenshots/`, `frontend/public/assets/logomark-gold.png` (ask before including)

---

## 1. Mock data layer for the whole app

**Goal:** every page works on mock data so the full flow can be walked without backend, Postgres or Cognito.

### New files
| File | What it does |
| --- | --- |
| `frontend/app/lib/mockMode.ts` | `MOCK_MODE` switch (on by default; `NEXT_PUBLIC_MOCK_MODE=0` turns it off), demo login, code hint, `mockDelay` |
| `frontend/app/lib/mockDb.ts` | localStorage database (`souv_mock_db`) + seed: demo account, 20 credits, saved Visa 4242, one sent card, one in-progress draft; reset helper |
| `frontend/app/lib/mockApi.ts` | Mock versions of all 20 backend endpoints (pricing, auth/me, profile, payment methods, credits, drafts, assets, uploads, generation, orders, checkout, fulfillment), matching NestJS mock behaviour |
| `frontend/app/lib/mockCognito.ts` | Mock sign-up / confirm / sign-in / reset / resend / global sign-out / social sign-in, with Cognito error codes |
| `frontend/app/components/MockDataBadge.tsx` | Bottom-right "Mock data" button: logins, +20 credits, Reset all mock data |

### Changed files
| File | Change |
| --- | --- |
| `frontend/app/lib/api.ts` | Each endpoint function returns its mock twin when `MOCK_MODE` is on |
| `frontend/app/lib/cognitoAuth.ts` | Mock branches for all Cognito calls + social sign-in start/complete; mock module loaded lazily so the Node unit test still runs |
| `frontend/app/layout.tsx` | Renders `<MockDataBadge />` |
| `frontend/README.md` | "Mock data mode" section |

### Verified
- `tsc` clean, lint 0 errors (14 existing `<img>` warnings), unit tests 5/5
- Browser: sign-up → code → login → build card → generate (−2 credits) → delivery → checkout → payment → sent to print → confirmation
- Pricing → cart → pay → +80 credits; demo login library; Google sign-in → Terms → Create; forgot/reset password; 13 signed-in pages load
- Not hand-tested: Account Settings add/edit payment method, Personalize-a-Template wizard

### Notes
- Mock mode is **on by default** on this branch — flip it off before any merge to `main`.

---

## 2. Build My Card: adaptive questionnaire (2026-11-07)

**Goal:** replace the six full-page forms with one adaptive, one-question-at-a-time questionnaire (Haiku 5.5 interviewer, mocked on this branch) covering every image and music prompt field, plus four changes: Back to welcome/options, attestation on upload, an optional AI version of the inside message, and the custom song QR code. Scope: Build My Card only (Personalize a Template and Community Cards not changed).

**Owner decisions used:** photo first, with "describe them instead"; re-attest on every new batch of photos; `qrcode` library allowed, logo on a forest tile; image-only costs 1 credit; up to 16 photos (fal `gpt-image-2.5-flare/edit` limit); the customer's message prints by default; signed-out visitors see the first question, and sign-up is asked at the first save, upload or AI call.

### New files
| File | What it does |
| --- | --- |
| `frontend/app/components/bmc/catalog.ts` | Occasions, modes, 12 styles, 14 vibes, full Decorate menus (7 accent groups, wearables, 15 borders, 18 colours), the 10 genre presets with IDs, BPM, word ranges and production prompts, and limits |
| `frontend/app/components/bmc/prompts.ts` | Canonical interviewer and message-writer system instructions, caption, inside-message, recommendation, lyric, image and music templates (versioned) |
| `frontend/app/components/bmc/brief.ts` | Shared brief type (shared / image / message / song / control), migration from the old builder's drafts, validators |
| `frontend/app/components/bmc/questionBank.ts` | 31 questions with stage, fields, controls, when each applies and when it's answered; canonical order |
| `frontend/app/components/bmc/engine.ts` | Canonical turn input and response schema; validates and applies proposals (allow-list, exact evidence, no overwrites, stale drop); name-aware wording |
| `frontend/app/components/bmc/compile.ts` | Resolved decorations (written words override chips), resolved image brief, compiled image and music prompts, text-writer context |
| `frontend/app/components/bmc/BmcQuestionnaire.tsx` | Orchestrator: saving, interviewer turns, attestation on upload, writers, generation snapshot and idempotency, Review and Delivery hand-off |
| `frontend/app/components/bmc/BmcQuestion.tsx` | Controls for every question type, including the two-version inside message and the lyric editor |
| `frontend/app/components/bmc/BmcSummary.tsx` | "Your card so far" panel and bottom sheet; six-stage progress rail |
| `frontend/app/components/bmc/BmcReviewStage.tsx` | Review on the card's real data: front, both message versions (editable, choose which prints), song and lyrics, approvals per version |
| `frontend/app/components/bmc/QrSongCode.tsx` | Custom QR: "Scan me" / mini logo / "To Play Song" |
| `frontend/app/components/bmc/BmcBackLink.tsx`, `createOrigin.ts` | Back to welcome / options / home (later removed and deleted, see section 4) |
| `frontend/app/components/bmc/ui.tsx`, `photos.ts` | Radio and toggle chips, fields, action bar, thinking state; photo thumbnails |
| `frontend/app/lib/mockInterview.ts` | Mock interviewer, message, caption, genre and lyric writers |
| `frontend/app/styles/bmc-questionnaire.css` | Berry & ivory styles, phone, tablet and desktop, reduced motion |
| `build-fixes/mock-data-mode-2026-11-07/BMC-BEDROCK-HANDOFF.md` | Backend contracts for Bedrock and the `parts` generation change |

### Changed files
| File | Change |
| --- | --- |
| `frontend/app/create/build-my-card/page.tsx` | Berry & ivory page shell (landing nav and footer), back link, metadata |
| `frontend/app/components/BuildMyCardClient.tsx` | Mounts the questionnaire; resumes from `?draftId=` or Delivery's `#review` |
| `frontend/app/lib/api.ts` | Five Build My Card text calls (mocked); `parts` on `startGeneration` (mock only until the backend accepts it) |
| `frontend/app/lib/mockApi.ts` | Generation charges and creates only the requested parts |
| `frontend/app/components/MyCards.tsx` | Title and resume link read the new brief |
| `frontend/app/components/CreateOptionsClient.tsx`, `Auth.tsx` | Record where the customer came from (`/create` or `/welcome`) |
| `frontend/package.json`, `package-lock.json` | Added `qrcode` and `@types/qrcode` |
| `design-system/docs/02-components.md`, `06-governance.md`, `reference/index.html`, `reference/styleguide.css` | Components 2.17 Questionnaire, version 1.3, example section |

### Deleted (owner approved, 2026-11-07)
- `frontend/app/components/BmcWizard.tsx` and `BmcSteps.tsx`, the old six-form builder (deletion staged with `git rm`).
- `BmcReview.tsx` (still used by Personalize a Template) imported its legacy genre list from `BmcSteps.tsx`; that list now lives in `BmcReview.tsx`, unchanged. `BmcShared.tsx` stays (used by Personalize and Delivery).
- Re-checked after deleting: `tsc` clean, lint 0 errors (16 warnings), tests 5/5, Personalize loads with no errors.

### Verified
- `tsc` clean; lint 0 errors (18 warnings: 14 existing plus 4 `<img>` thumbnails); unit tests 5/5; `next build` succeeds.
- Browser (mock data), at 1280px and 375px:
  - Rich story filled occasion, name, relationship, sender, feeling and motif, and skipped those questions.
  - Decorate: Party accents shown first for a birthday; wearer asked for a two-person photo; "no balloons" removed the Balloons chip.
  - Caption generator count; message auto-draft; the customer's version selected by default with both versions on Review.
  - Song: Vocal, ten genres, three suggestions, selection required, pronunciation, lyrics approval.
  - Generation 2 credits (front and song); image-only 1 credit; triple-click charged once.
  - Approvals reset on edit; Delivery and back to the same Review.
  - No-photo Transform with the detail follow-up; Enhance conflict offered and switched to Transform.
  - Attestation opens on upload and is scroll-gated; signed out sees the sign-up prompt.
  - Back to welcome / options / home; old-format draft migrated and resumed; Personalize, Delivery and My Cards still load.
- Not covered: real Bedrock, fal and Lyria calls (mocked); printed QR scan test; screen reader pass.

---

## 3. Build My Card dialogs redesigned (2026-11-07)

**Goal:** every modal Build My Card can show, on berry & ivory and with proper dialog behaviour. All use the shared `FlowDialog` shell (rendered into `<body>`, page behind inert, Tab kept inside, Escape closes, focus returned, scroll locked). Personalize a Template keeps its current attestation and sign-up prompt (out of scope).

| Dialog | Before | Now |
| --- | --- | --- |
| Image-rights attestation | Old dark gold modal; no focus trap, no Escape, no accessible name; hidden checkbox inputs | `bmc/BmcAttestationDialog.tsx`: berry stripe, the photos waiting, Terms then Privacy steps with read ticks, a keyboard-scrollable reader, an announced progress bar, real checkboxes that unlock after both documents are read. Same legal words; Cancel or Escape discards the batch |
| Sign-up prompt (signed out) | `AuthGatePrompt`, old dark buttons, no focus handling | `BmcSignUpDialog`: same copy and links, forest stripe, "Includes 2 free credits to create a complete card" |
| Creating your card | Inline "thinking" line | `BmcGeneratingDialog`: front and song each show Working / Ready / Didn't work / Not included; the inside message shows as saved or blank; can't be dismissed while working; failures stay in the dialog |
| Paid regenerate on Review | Spent the credit straight away and cleared the approval first | `BmcSpendDialog`: "Make a new front?" with the balance; Not now spends nothing and keeps the approval. The approval clears only once the new version exists |
| "Your card so far" on phones | Fixed panel with no focus handling | A launch button opens a bottom dialog sheet; Change closes it and opens that question |
| Top up credits | Already berry & ivory with proper behaviour | Unchanged; still opened when credits run out |

### Files
- New: `frontend/app/components/attestationContent.ts` (legal text and statements shared by both attestation versions), `bmc/BmcAttestationDialog.tsx`, `bmc/BmcDialogs.tsx`, `frontend/app/styles/bmc-dialogs.css`.
- Changed: `AttestationGate.tsx` (now reads the shared text; looks the same), `BuildMyCardClient.tsx`, `bmc/BmcQuestionnaire.tsx`, `bmc/BmcReviewStage.tsx`, `bmc/BmcSummary.tsx`, `bmc/BmcQuestion.tsx` (inline creating line removed), `styles/bmc-questionnaire.css` (old phone sheet replaced), `create/build-my-card/page.tsx`.
- Design system: `docs/02-components.md` section 2.18 Dialogs.

### Verified
- `tsc` clean, lint 0 errors (17 warnings), tests 5/5, `next build` compiles.
- Browser, desktop and 375px:
  - Attestation opens on pick with focus inside and the page inert; the Terms tick appears halfway through and the checks unlock at the end; Agree adds the photos; a new batch reopens it; Escape discards the batch and returns focus.
  - Sign-up opens when signed out, with focus inside and the right links.
  - The creating dialog shows separate rows, ignores Escape while working, then goes to Review with focus on its heading.
  - The spend dialog shows the balance; Not now and Escape keep the approval and return focus; Use 1 credit spends exactly 1.
  - The phone sheet is flush to the bottom and full width; Change works.
  - The attestation fits a phone with no sideways scrolling.
- Not covered: a screen reader pass; real generation timing (the mock finishes in about a second).

---

## 4. One screen per step on desktop, one section per screen on phones (2026-11-07)

**Owner requests:** replace the back button with the Build My Card heading and explanation from the Welcome modal; every step (1–6) and every dialog fits one desktop screen; on phones each section of a step has its own screen.

### Heading
- `bmc/BmcPageHeading.tsx` shows "Build *My Card*" and "Have your own idea? Answer a few questions and watch your card come to life.", read from `createOptions.ts`, so they always match the Welcome modal.
- The back button is removed in every case (it previously said "Back to welcome" or "Back to options"). The origin recording added earlier to `Auth.tsx` and `CreateOptionsClient.tsx` is reverted; both files are back to their original state.
- `bmc/BmcBackLink.tsx` and `bmc/createOrigin.ts` were deleted (owner approved, 2026-11-07). Nothing referenced them, and they had never been committed. Re-checked afterwards: `tsc` clean, lint 0 errors, tests 5/5, page loads.

### Desktop (1024px and up)
- The page is exactly one screen tall. The title and progress rail share the top row; the question card and summary fill the rest. Each card keeps its question at the top and the action bar at the bottom. If a window is shorter than designed for, only the controls scroll, so the question and Continue stay on screen.
- Compact layouts per step:
  - Photo: a low drop zone, with "No photo? Describe them instead" moved into the action bar.
  - Style: six tiles across.
  - Accents: group tabs in a row.
  - Who's wearing it: a drop-down per accessory.
  - Border colour: the custom picker on one line; the Automatic hint is hidden while custom is chosen.
  - Message: the write/blank choice and AI switch on one row; versions side by side; the AI count in the button; the helper line hidden on desktop.
  - Genre: five tiles across; suggested tiles have a gold edge and show their reason.
  - Lyrics: two columns, with actions in the header.
  - Review: "Look it over" in the top row; front, message and song panels side by side; the front's buttons beside the image; message versions as text with Edit; lyrics behind "View lyrics".
- 1024–1279px: a narrower summary column, numbered rail steps, and the step eyebrow only when changing an answer (beside the title).
- Attestation: photos and steps on one row, statements side by side, and the reader fills the remaining height.

### Phones (under 600px): one section per screen
- Inside message: Your message, then AI version with "Which should we print?".
- Song: choose the song, then Your QR code (skipped for no song).
- Who's wearing it: one accessory per screen.
- Review: Front, then Inside message, then Song, with Previous/Next; the bar's buttons on their own row.
- Attestation: what's needed, Terms, Privacy Policy, confirm. Next on each reading screen unlocks only at the end of that document.
- "Part 1 of 2 · …" markers announce the section.

### Files
- New: `bmc/BmcPageHeading.tsx`.
- Changed: `create/build-my-card/page.tsx`, `bmc/ui.tsx` (`useIsPhone`, `useSections`, `SectionMark`, `TextField hideLabel`), `bmc/BmcQuestion.tsx`, `bmc/BmcQuestionnaire.tsx`, `bmc/BmcReviewStage.tsx`, `bmc/BmcSummary.tsx`, `bmc/BmcAttestationDialog.tsx`, `styles/bmc-questionnaire.css`, `styles/bmc-dialogs.css`.

### Verified
- Measured every step's controls area and every dialog at 1280×720 and 1024×768: no overflow, Continue always on screen. Steps checked:
  - Photo (empty and with 4 photos), main photo, subjects, story.
  - Shape, blueprint, style with Custom, vibes with Custom, scene.
  - Decorate options, accents, accessories (3), wearers, border, custom colour, own words.
  - Caption with the generator, summary.
  - Message (AI only, and both versions), song, genre, pronunciation, lyrics (viewing and editing), generate.
  - Review (all three panels).
  - Dialogs: attestation, creating, spend.
- Phone at 375px: each split screen appears in order with its Part marker; the attestation reading gates work; no sideways scrolling.
- `tsc` clean, lint 0 errors (17 warnings), tests 5/5, `next build` compiles.
- Not covered: tablets (600–1023px) keep the normal scrolling layout; a screen reader pass.

---

## 5. Round 3: colour, more options, Custom everywhere, AI writer, logo QR, review fit

Owner requests 2026-11-07 (round 3), with these follow-up answers:
- Pronunciation goes in Basics with the names.
- The QR code is logo-styled.
- Genres get no Custom option.
- The printed message is the one on screen at Continue.

### Headings and copy
- Removed the step eyebrow ("01 · Photo · changing an answer") on all six steps.
- Removed the subtext under the "Build My Card" heading.
- Removed "You can add a song later".
- "No song" now reads "No QR code inside."

### Colour (new `styles/bmc-polish.css`, loaded after `bmc-questionnaire.css`)
- Each stage has its own accent, used only as decoration:
  - Photo: terracotta.
  - Basics: berry.
  - Image: gold.
  - Message: berry.
  - Song: gold.
  - Review: forest.
- The stage accent appears in these places:
  - The card's top stripe and a faint top tint.
  - The current step's dot on the rail.
  - The group borders in "Your card so far".
- Occasion, vibe and accessory chips each carry a small dot, rotating through terracotta, berry, gold, sage and mauve.
- Custom is always forest: outlined on a forest tint, and solid forest when chosen.

### More options (`bmc/catalog.ts`, version `bmc-catalog-2026-11-07b`)
- Occasions: 33, including the following, with Custom last:
  - Mother's Day, Father's Day and Valentine's Day.
  - Baby Shower, Bridal Shower and Engagement.
  - Christmas, Hanukkah, New Year, Easter, Halloween and Thanksgiving.
  - Teacher Appreciation, Pet Birthday, Apology, Good Luck, Miss You and Thinking of You.
- The mock interviewer recognises the new occasions (`lib/mockInterview.ts`). Its patterns now use proper word boundaries.
- Styles: added Storybook, Pop art, Pencil sketch, Oil painting and 3D.
- Vibes: now 22, plus Custom.
- Accents: 10 groups, including new Nature, Baby and Hobbies groups.
- Accessories: now 14, with a new "back" placement.
- Borders: added Polaroid, Stamp, Lace, Stars, Hearts and Torn paper.
- Thinking of You and Apology count as gentle occasions.

### A Custom option wherever there are option buttons
- Each of these now has a Custom option that opens a text field:
  - Occasion.
  - Style.
  - Vibes.
  - Finish (9 options).
  - Accents (a Custom chip in the group-tab row).
  - Accessories ("Describe the accessory").
  - Border ("Describe the border").
- The custom values flow into the brief (`border.customStyle`, `customAccent`, a custom `Wearable.label`) and into the compiled image prompt (`bmc/compile.ts`).
- Genres stay as the ten fixed PRD genres, with no Custom option.

### Pronunciation
- Added an optional "How to say their name" field beside the names in Basics.
- Its hint reads "Only used to help the singer in your song. Never printed."
- The separate pronunciation question (S3) was removed.

### Step one spacing
- The drop zone is centred and fills the left-hand card.
- The gaps between its parts are larger.

### "Suggest another" (caption)
- The button is now a small button in an inline row with a hint ("First suggestion, then up to 5 more").
- The spacing around it is fixed.

### AI writer (inside message)
- Removed the "AI version" toggle. The customer's box now fills the open space.
- A gold "AI writer" button temporarily hides the customer's box and shows the AI draft, drafting it the first time.
- "Write Message" brings back exactly what the customer wrote.
- Whichever version is on screen at Continue is the one that prints. A note under the box says which.

### Logo QR code (`bmc/QrSongCode.tsx`)
- The whole code is styled as the logo:
  - Round forest dots.
  - Rounded corner markers.
  - A forest tile with the gold S in the middle, about 30% of the width.
- Settings that keep it scannable:
  - Error correction H.
  - Version 5 or larger.
  - Touching dots (radius 0.5).
  - A logo tile 11 of 37 modules wide (about 9% of the area).
  - A 4-module quiet zone.
- Checked by rendering with sharp and decoding with jsQR. The first logo version (dots r 0.43, tile 11 of 33) decoded only at 110px. The final version decodes at 800, 600, 400, 300, 200, 160 and 120px.
- Still needs a test print and a scan on real phones before launch.

### Review (`bmc/BmcReviewStage.tsx`)
- Three equal panels: Front, Inside message and Song.
- Front shows the whole 5×7 card (188×263 at 1280×720, 223×313 at 1024×768).
- Each panel's content scrolls on its own, so all three action rows sit on one line:
  - All six buttons are the same size (155×52 at 1280×720, 123×52 at 1024).
  - Visible labels are shortened to "Approve", "New · 1 credit" and "Edit".
  - Accessible names stay in full, such as "Make a new front, 1 credit".
- "Approve all" and "Continue to delivery" are now one button: "Approve all & continue to delivery". It's disabled while something is blocking, and the reason is shown.
- The message versions' header wraps, so there's no sideways scrollbar.

### Desktop fit fixes found while verifying
- Occasion with Custom open was 57px over. Fixed with:
  - 38px chips in a six-column grid.
  - The "Your occasion" label made screen-reader only.
- Accents with Custom open was 49px over at 1280×720. Fixed with compact 36px group tabs and chips.

### Files
- New: `styles/bmc-polish.css`.
- Changed:
  - `bmc/catalog.ts`, `bmc/brief.ts`, `bmc/questionBank.ts`, `bmc/engine.ts` and `bmc/compile.ts`.
  - `bmc/ui.tsx` (`CUSTOM_OPTION_IDS`).
  - `bmc/BmcQuestion.tsx`, `bmc/BmcQuestionnaire.tsx`, `bmc/BmcReviewStage.tsx`, `bmc/BmcSummary.tsx`, `bmc/BmcPageHeading.tsx` and `bmc/QrSongCode.tsx`.
  - `lib/mockInterview.ts` and `create/build-my-card/page.tsx`.
  - `design-system/docs/02-components.md` (sections 2.17 and 2.19).

### Verified
- Measured at 1280×720, with no overflow and Continue on screen:
  - Photo, people, shape, blueprint, decorate options.
  - Accents (with and without Custom), accessories (with and without Custom), wearer, border (with Custom), colour.
  - Caption, summary, message (own and AI writer), song mode, genre, lyrics, generate, occasion (with Custom).
  - Review.
- Also measured at 1024×768: occasion, accents and Review.
- Phone at 375px: Review shows one panel per screen with Previous/Next, with no sideways scrolling.
- `tsc` clean, lint 0 errors (18 warnings, all existing `<img>` notices), tests 5/5, and `next build` compiles.
- Not covered:
  - Phone checks of the AI writer and the people step.
  - Tablets (600–1023px).
  - A screen-reader pass.
  - A physical scan of a printed QR.

---

## 6. No credit check until Create; "Top up to create" choice dialog

Owner request 2026-11-07:
- Opening Build My Card with no credits or cards popped up the credits modal straight away.
- Customers should reach the Create button without any top-up prompt.
- When they are asked, the prompt should let them choose cards or credits.
- It should explain that cards come with AI credits and that they come back to their finished work after paying.

### Removed the early gates
- Opening Build My Card no longer checks credits. The entry check in `BuildMyCardClient.tsx` is removed.
- The Create options page no longer checks credits before opening Build My Card (`createOptions.ts`: `requiresCredits: false`).
- Personalize a Template keeps its checks; it's not part of this change.
- At 0 credits, the Generate step still shows "Create my card · 2 credits". Its hint now explains that they can top up with a card (which comes with AI credits) or credits alone, then come straight back.
- On Review, "New · 1 credit" is no longer disabled at 0 credits. It opens the same choice.

### New "Top up to create your card" dialog (`bmc/BmcDialogs.tsx`: `BmcTopUpChoiceDialog`)
- It opens only when a paid action is pressed without enough credits:
  - Create on the Generate step.
  - A new front or new audio on Review.
  - A server "insufficient credits" reply.
- Gold stripe, "Almost there" eyebrow, and the lede "This uses N credits and you have M."
- Two choices:
  - **Top up cards** ("Best value"): every card includes printing, shipping and 10 AI credits, so they can create this card now and then send it.
  - **Top up credits only**: credits for creating and editing; the printed card can be bought later, when they send it.
- It also shows "Your card is saved. After you pay, you'll come straight back here to finish it", and a "Not now" button.
- Choosing an option does three things:
  - Saves the latest answers.
  - Opens the existing Top up pop-up on the matching view.
  - Sets the return address to `/create/build-my-card?draftId=…` (with `#review` when it came from Review).
- Styles are in `styles/bmc-dialogs.css`: two side-by-side options, stacked on phones. Cards is forest-edged with a forest button; credits is plain.

### Returning after payment (`CartPage.tsx`)
- Print and Send used to stay on the payment confirmation pop-up unless the purchase came from Delivery.
- It now also returns straight to Build My Card when bought from Build My Card's top-up, so the saved card is waiting. Other Print and Send purchases are unchanged.

### Tidy
- `BmcReviewStage` no longer takes a `credits` prop, which was unused once the buttons stopped disabling.

### Verified (mock mode, demo account set to 0 credits)
- Create options, then Build My Card: no pop-up. Every question up to "Ready to make it" with no prompt.
- "Create my card · 2 credits" opened the choice dialog ("This uses 2 credits and you have 0 credits"). It fits at 1280×720, and focus moves into the dialog.
- Top up cards took me through Print and Send, the cart and checkout ($10.49). Payment returned to the same draft's "Ready to make it" with 10 credits. The card was then created and opened Review.
- At 0 credits on Review, "New · 1 credit" opened the choice ("This uses 1 credit"), and "Choose credits" opened the credits packs.
- `tsc` clean, lint 0 errors (18 warnings), tests 5/5.
- Not covered: a production build (the dev server is running), and the dialog at phone width.
- The demo account is left at 0 credits for testing.

---

## 7. QA pass: everything lines up, no box scrolls on its own

Owner request 2026-11-07:
- Things didn't line up well when clicking through the steps.
- Do a QA of Build My Card so that everything is clear and lined up properly.
- There shouldn't be any scrolling inside the boxes.

Method: walked every step and dialog with a photo, Decorate (accents, accessory, border, colour), vibes, a suggested caption, both message versions, a sung song and Review, at three sizes:
- 1280×720 and 1024×768: measured the page height and every box that scrolls.
- 375px phone: checked for boxes that scroll and for sideways scrolling.

### Problems found and fixed
1. **"Your card so far" scrolled on every step from Basics on** (up to 890px of hidden content). It is now an accordion (`bmc/BmcSummary.tsx`):
   - The current stage is open. The other stages fold to one line, showing the stage name, its answers and a + to open.
   - Values wrap to at most two lines; the full text is in the tooltip.
   - The card preview is smaller.
   - The phone sheet uses the same accordion. Its styles had been missing because the sheet renders outside the page's style scope.
2. **On Review, the message and song panels scrolled.**
   - The version that won't print shows two lines.
   - "Message edits are always free" moved into the button ("Edit · free").
   - The song code is 100px.
   - The 5×7 front is sized to the screen height.
   - All six action buttons stay on one line.
3. **The song step's Back and Continue floated mid-card.** They're now pinned to the bottom like every other step.
4. **Names:** "Their name" was stretched beside the pronunciation field. Both fields now start on the same line, and the hint is shortened to one line ("For the singer only. Never printed.").
5. **Tile titles at different heights:**
   - The "Most popular" badge now sits on the tile's top edge.
   - Portrait and Landscape drawings share one height.
6. **Ragged chip rows.** Vibes, accessories, border, border colour and decorate options are now even grids:
   - Four columns at 1280px, five for vibes.
   - Four at 1024px.
   - Border labels shortened to "Corner accents" and "Stamp edge" (catalog `bmc-catalog-2026-11-07c`).
7. **Custom read as grey.** It's now a sage-green tint with a forest edge (solid forest when chosen).
8. **Accent category tabs looked like the accent items.** The chosen group's items now sit in their own tinted panel.
9. **Lyrics split the chorus from its heading** across the two columns. Each section now stays together (`LyricBlocks` in `bmc/ui.tsx`).
10. **Main-photo step:** the thumbnails were tiny, leaving an empty card. They're now 150px.
11. **Wording:**
    - Prompts printed "mother's day" in lower case. An earlier shell edit had put a literal backspace character in the named-day check in `bmc/engine.ts`; removed. I checked every file and no other copies were found.
    - The mock AI message said "Thank you for her garden". It now speaks to the recipient ("your garden") and keeps capitals on named days (`lib/mockInterview.ts`).
12. **Labels that repeated the heading:**
    - The story box label.
    - The Custom fields (occasion, style, finish, accents, accessory, border, vibe). These now use a descriptive placeholder; the label is kept for screen readers.
13. **"Will print" note:** it sat squeezed beside Back. It's now a "This one will print" badge on the message box.
14. **Rights dialog:** it said "Read both documents to the end…" twice. It's now one line with a lock icon, which also makes the reader taller.
15. **Phone progress rail scrolled sideways.** Only the current step shows its name; done steps show a tick, and upcoming steps a number.

### Layout rule change
- On desktop the page is now *at least* one screen tall (`min-height: 100dvh`) rather than exactly one.
- Normal answers still fit one screen. Unusually long content (for example a 500-character message, or lyrics opened on Review) makes the page longer instead of adding a scrollbar inside a box.
- The legal documents in the rights dialog still scroll, as before: you asked for them to be scrolled through before agreeing.

### Files
- Changed:
  - `bmc/BmcSummary.tsx`, `bmc/BmcQuestionnaire.tsx`, `bmc/BmcQuestion.tsx`, `bmc/BmcReviewStage.tsx`, `bmc/BmcAttestationDialog.tsx`.
  - `bmc/ui.tsx`, `bmc/engine.ts`, `bmc/catalog.ts`.
  - `lib/mockInterview.ts`, `styles/bmc-polish.css`.

### Verified
- Page height at 1280×720 is exactly 720px (nothing over) on every step:
  - Photo, main photo, who's in the photos, story, names, shape, blueprint.
  - Decorate options, accents (± Custom), accessories (± Custom), wearer, border (± Custom), border colour, vibes (± Custom).
  - Caption (choice and suggestion), front summary.
  - Message (own and AI writer), song, genre, lyrics, generate, Review.
- No box scrolls on its own on any of those steps.
- Also at 1024×768: occasion (± Custom), names, decorate, vibes (± Custom), caption, shape, blueprint, song, lyrics, photo, accents/accessories/border (± Custom), Review. All are exactly 768px with no inner scrolling.
- Phone 375px:
  - Rail fits (335/335px).
  - The summary sheet has no inner scroll.
  - Message, and Review's three panels: no inner scroll, no sideways scroll.
- `tsc` clean, lint 0 errors (18 warnings), tests 5/5, `next build` compiles.
- Not covered: tablets (600–1023px), the Transform and Enhance paths beyond their first question, and a screen-reader pass.

---

## 8. Round 4: Congrats, terracotta Custom, card pictures, more decorations, AI writer, new Review

Owner requests 2026-11-08, with these follow-up answers:
- Add all four new decorate options.
- Keep the old logo file but mark it retired.
- Review's AI writer writes a new AI version.

### Questions
- **Occasion:** "Congratulations" is now "Congrats" so it fits its bubble. The mock interviewer maps "congrat…" to it.
- **Custom and "Describe in my own words"** are terracotta everywhere (edge, tint, espresso text; solid terracotta when chosen). This replaces the green. The accent items panel moved to a neutral tone so it doesn't look like Custom.
- **Card shape:** two large tiles, each with a real-size card picture: 5×7 at 157×220 and 7×5 at 280×200.
- **Blueprint:** each option ends with a 5×7 example card (170px tall).
  - Both of these use a placeholder for now: the current logo on forest (`CardPlaceholder`, `bmc/ui.tsx`).
  - On these tiles, selection is a forest outline so the card stays visible.
- **Decorate:** nine options in a 3×3 grid, with "Describe in my own words" in the bottom-right cell. Four new options, each with its own follow-up question:
  - Stickers and doodles (up to three + Custom).
  - Background pattern (one + Custom).
  - Sparkle and glow (one + Custom).
  - Names and dates (a 40-character text field).
  - All four go into the brief, the front summary and the image prompt. The prompt keeps people unchanged, faces clear, and lettering separate from the caption.
  - Catalog `bmc-catalog-2026-11-08a`.
- **AI writer (message step):**
  - Every press writes a fresh AI message, five in total including the first (`LIMITS.aiMessageDrafts`).
  - The button stays "AI writer" with "N left".
  - "Write a message" (top left) brings back your own words.
  - The "Write another" link is gone.

### Review
- **Heading:** smaller, in the top-right corner. Card headings use the design-system Label style. All fonts were already Lato and Lobster Two; the large light sizes are what didn't match a design-system style.
- **Buttons:** they moved out of the cards to a row underneath each card, as small two-line buttons:
  - Front: Change / answers · Try again / 1 credit · Approve.
  - Message: Edit / free · AI / writer (only while tries are left) · Approve.
  - Song: Edit / lyrics · Try again / 1 credit · Approve.
- **Song card:** shows the full lyrics. Edit lyrics edits them in place and saves when you press Done.
- **Message AI writer:** writes a new version, selects it to print and clears that approval. It shares the five tries with the message step.
- **Approving:** the long "Approve all & continue to delivery" bar is gone. Approving the last piece opens "Approve all three and continue to delivery?" (Not yet / Continue to delivery). After "Not yet", a small "Continue to delivery" button stays in the heading. Approve buttons toggle back to un-approved.

### Logo
- The black card with the yellow S (`hero-souvenote-card-face.png`) is retired. The file is kept (no deletes) and marked retired in design-system 2.13.
- Mock generations now use the new `frontend/public/assets/mock-card-front.png` (current two-tone logo on forest, thin gold frame, 1000×1400). Saved mock cards switch over on read.

### Files
- New: `public/assets/mock-card-front.png`.
- Changed:
  - `bmc/catalog.ts`, `bmc/brief.ts`, `bmc/questionBank.ts`, `bmc/engine.ts`, `bmc/compile.ts`.
  - `bmc/ui.tsx`, `bmc/BmcQuestion.tsx`, `bmc/BmcQuestionnaire.tsx`, `bmc/BmcReviewStage.tsx` (rewritten).
  - `lib/mockDb.ts`, `lib/mockInterview.ts`, `styles/bmc-polish.css`.
  - `design-system/docs/02-components.md` (2.13 and 2.17).

### Verified
- 1280×720: occasion, shape, blueprint, decorate, stickers, pattern, sparkle, names and dates, front summary, message and Review all exactly 720px, with no boxes scrolling on their own.
  - Review: all nine buttons on one line, and the front card 335px tall.
- 1024×768: Review exactly 768px, nine buttons on one line.
- Phone 375px: Review's three cards one per screen, no inner or sideways scroll.
- Approval flow: no dialog after the first or second Approve; the third opens "Approve all three and continue to delivery?".
- Review AI writer: writes a new AI version, sets it to print, clears that approval, and the tries go from 4 left to 3.
- Message step: each AI writer press writes a new draft (3 → 2 → 1 left); "Write a message" restores your own text.
- `tsc` clean, lint 0 errors (18 warnings), tests 5/5, `next build` compiles.
- Not covered: tablets, Transform and Enhance beyond their first question, and a screen-reader pass.

---

## 9. Full QA and code cleanup (desktop, tablet, phone; all image paths)

Owner request 2026-11-08: a full QA of Build My Card on desktop and mobile, and clean Next.js code.

### How it was checked
- **Walker:** a scripted walker answered every question the same way each time. On every step and dialog it measured:
  - page height against the screen;
  - any box that scrolls on its own;
  - sideways scrolling, clipped text, and anything spilling past the card's edge.
- **Paths:**
  - Decorate, with all nine options (Custom opened wherever it exists).
  - Transform.
  - Enhance.
  - "Describe instead of a photo".
- **Sizes:**
  - 1280×720 and 1024×768: every step of every path.
  - 375×812 phone: every step of every path, with screenshots of each Decorate step.
  - 768×1024 tablet: the Decorate path through to Review.
- **Code review:** an independent review of the Build My Card components found 30 issues. The fixes are below; the few left open are listed at the end.

### CSS cleanup (no visual change)
- A script removed what can never apply:
  - 169 overridden declarations (a later rule with the same selector and the same or no media condition sets the same property);
  - 46 selectors for `bmcq-` classes no code uses (for example the old approve-all bar, "View lyrics" and the old shape drawings);
  - 58 rules left empty.
- That's about 160 lines across `bmc-questionnaire.css`, `bmc-dialogs.css` and `bmc-polish.css`.
- **Proof of no change:** I took a computed-style fingerprint of every element on seven screens at 1280 and 375 (Review, front summary, occasion, decorate, shape, message, song) before and after. Result: 0 differences. A repeat capture before the change also showed 0, so the method is reliable.
- Backups of the three files are in a temp folder outside the repo.

### Layout fixes found by the QA
- **Phone:**
  - Shape tiles stack; Landscape used to run off the right edge.
  - Main-photo thumbnails sit three across.
  - Option chips (decorate, occasion, vibes, accessories, border, colour, stickers, pattern, sparkle, wearer) are even grids instead of ragged rows. They're two across with rounded-rectangle shapes, and "Describe in my own words" spans the bottom row.
  - The "at a glance" table puts each label above its answer.
  - Review's front is 230px wide, so its buttons are on screen without scrolling.
  - Lyrics no longer scroll inside their box.
- **Tablet:** any group of three option cards (blueprint, caption, who's in the photos) sits three across instead of 2 + 1.
- **Review on every size:** the compact lyrics had a hidden 200px height cap that pushed sections into a sideways column. Removed.
- **Desktop "Your card so far":**
  - When the current stage has no answers yet, every stage folds.
  - A stage with more than five answers shows each on one line.
  - Slimmer Change links, and a smaller card preview from 1280px.
  - This fixed the Transform and "describe" paths, which ran 17–58px over.
- **Desktop "at a glance" table:** a 150px label column, so labels like "Keep recognisable" stay on one line, and slimmer rows.
- **Text questions:** the field label no longer repeats the heading (kept for screen readers). The helper shows once, not twice.

### Code fixes from the review
- **Create can't charge twice.**
  - A retry of an unchanged request reuses its action key. The key is kept until Create succeeds, and survives a reload during Create.
  - Once the server has accepted the request, a failure to load the result no longer clears the card or says "no credits were used". The card goes on to Review with a notice.
  - Verified in mock mode: an interrupted Create offered Create again after reload, and the retry didn't charge (5 credits before and after).
- **Failed "Try again"** puts the previous snapshot back, so a front or song that was out of date still shows "Needs update".
- **Photos count towards "out of date".**
  - Changing or removing photos, or the main photo, marks the front "Needs update". The generation snapshot now records `photoKey`.
  - Photo, main photo, who's in the photos, occasion and shape changes reopen "Your front, at a glance".
  - Verified: removing a photo after creating reopened the summary and showed "Needs update".
- **One rule for which message prints** (`printedVersionKey`, `printedVersion`, `printedMessage` in `brief.ts`), shared by the message step, Review and generation.
  - Clearing the message while editing on Review keeps the editor open with "Add a message, or choose to leave the inside blank." and Approve disabled. Verified.
- **AI writer (message step):** going back from "Write a message" to an AI draft you already have keeps it and your edits, with no try used. Pressing AI writer while its box is open writes a new one. Verified: 4 → 4 when switching back, then 4 → 3.
- **AI writer (Review):** hidden when the inside is blank. After the last try, focus moves to Approve.
- **Saves run in order:** the debounced autosave and the top-up save go through one queue, so an older save can't overwrite a newer one.
- **Accessibility:**
  - Focus moves to the Review heading when Review opens (verified), and no longer jumps on first page load.
  - Review toggle buttons keep one accessible name; the pressed state says whether it's approved.
  - "Write a message" and "Leave the inside blank" are toggle buttons, not a radio group that had nothing checked while the AI writer was open.
  - The phone rights dialog keeps its title and intro on every screen (hidden visually after the first), so its name and description never point at missing elements. Verified on all four screens.
- **Names and dates:** a 40-character field with a counter; it used to allow 1000 and silently cut to 40. It no longer makes a pointless interviewer call.
- **Mock AI writer:** five different drafts per tone, so all five tries are different.
- **Photo roles** are re-set when the main photo is removed.
- **Next.js and React hygiene:**
  - Removed the unused `draftId` state.
  - Replaced the lyrics editor's effect (and its eslint-disable) with a Done handler.
  - The card placeholder uses `next/image`.
  - The remaining `<img>` tags (photo previews from blob or data URLs, and generated fronts from asset storage, which `next/image` can't optimise) each carry a reasoned eslint note.
  - Removed unused `questionById`, `reopenQuestion`, `isGentle`, `useSections().go`, and `ToggleChips`' `ai`/`reason`.
  - Shared helpers replace duplicates: `hasSong`, `generationCost`, `photoKey`, `draftPayload`, and `bmc/assets.ts` (`latestAsset`, `assetImageUrl`).
  - `PROMPT_TEMPLATE_VERSION` bumped to `bmc-prompts-2026-11-08` for the new Decorate directives.

### Left as they are (and why)
- `INTERVIEW_RESPONSE_SCHEMA` has no code caller, but it's the interviewer contract the backend hand-off (`BMC-BEDROCK-HANDOFF.md`) builds on.
- **Brief fields that nothing writes or reads yet** (`control.currentStage`, `message.aiAlternateEnabled`, the `successfulRegenerations` counters): they're in saved drafts. Removing them is a separate decision for the backend schema.
- **Pressing Skip on a re-opened optional question keeps its earlier answer.** Changing that needs a decision on what Skip means after an answer exists.
- **Mock-only:** an occasion can't be cleared once set (`mockUpdateCardDraft`).
- **Two run-once effects** (genre suggestions, the first lyrics draft) keep their documented eslint notes.

### Files
- New:
  - `bmc/assets.ts`.
- Changed:
  - `bmc/brief.ts`, `bmc/BmcQuestionnaire.tsx`, `bmc/BmcReviewStage.tsx`, `bmc/BmcQuestion.tsx`.
  - `bmc/BmcSummary.tsx`, `bmc/BmcAttestationDialog.tsx`, `bmc/ui.tsx`.
  - `bmc/engine.ts`, `bmc/questionBank.ts`, `bmc/prompts.ts`.
  - `lib/mockInterview.ts`.
  - `styles/bmc-questionnaire.css`, `styles/bmc-dialogs.css`, `styles/bmc-polish.css`.

### Verified (final)
- 1280×720 and 1024×768: every step on Decorate (with Custom open), Transform, Enhance and "describe" is exactly one screen tall, with no box scrolling on its own.
- Phone and tablet: no inner scrolling, no sideways scrolling, nothing clipped or spilling, on every step of every path.
- `tsc` clean. Lint: 0 errors and 0 warnings in Build My Card (12 `<img>` warnings remain on other pages). Tests 5/5. `next build` compiles.
- **Not covered:** a real screen-reader pass, and real devices (all checks used browser emulation).

---

## 10. Chip dots use design-system colours only

Owner request 2026-11-08: swap the two off-palette dot colours for design-system colours.

### What I found
Every colour on the landing page is a design-system token:
- the 12 named colours in `design-system/docs/01-foundations.md`;
- 7 lighter or hover shades that have tokens but no friendly names: `--sv-gold-300`, `--sv-forest-500`, `--sv-ivory-50`, `--sv-terracotta-300`, `--sv-berry-400`, `--sv-forest-600` and `--sv-white`.

The only colours outside the system were two I had added to the Build My Card chip dots in round 3: sage `#6F8F7E` and mauve `#B7869B`.

### What changed
- The dots now use only system colours, through the landing variables (`--l-stripe`, `--l-script-color`, `--l-ai`, `--l-btn-bg`, `--l-text-2`): terracotta, berry, gold, forest and cocoa.
- They run in a seven-slot rotation (terracotta, berry, gold, forest, cocoa, gold, berry), so the colours never line up into stripes in the 2-, 4-, 5- or 6-column grids. The old five-slot rotation lined up into stripes in the five-column vibes grid.
- A forest dot on a selected (forest) chip stays visible thanks to the existing ivory ring.
- The Build My Card styles now contain no colours outside the design system.
- Updated design-system 2.17.

### Files
- `styles/bmc-polish.css` and `design-system/docs/02-components.md`.

### Verified
- The vibes step at 1280×720 shows the computed dot colours #C98A76, #9E3D58, #D8B65A, #2F3E3B, #655250 and so on, with no stripes.
- A search of the three Build My Card stylesheets finds no sage or mauve left.

---

## 11. Song badge on the Build My Card and Personalize a Template option cards

Owner request 2026-11-08: add the circled music symbol to the Build My Card and Personalize a Template cards in the Welcome modal and on the Create page. Follow-up answer: a music note in a circle.

### What changed
- `createOptions.ts`: a new `song` flag, `true` for Personalize a Template and Build My Card, `false` for Community Cards and Saved Cards & Songs.
- `WelcomeSketches.tsx`: a new `SongMark` badge, a round antique-gold badge with an espresso music note, labelled "Can include a song".
- `Auth.tsx` (Welcome modal) and `CreateOptionsClient.tsx` (`/create`): the inside right's bottom row is now `span.sv-ocard-foot`. It holds the song badge (bottom left, when the option has a song) and the round arrow (bottom right).
- `opened-card.css`: the bottom-row and badge styles.
- `auth.css` and `create-options.css`: the badge takes the arrow's size at every breakpoint (34, 30 or 28px in the modal; 28–38px on `/create`).
- The closed cards on phones and tablets only show Community Cards and Saved Cards & Songs, so they're unchanged.
- Design system: new section 2.21.

### Verified
- `/create`: the badge is on Personalize a Template (31×32 beside a 32×33 arrow) and Build My Card (28×28 beside 29×29), and not on the other two options.
- Welcome modal (`/home?welcome=1`): the badge is on Personalize a Template and Build My Card, the same size as the arrow and on the same line, and not on Community Cards.
- `tsc` clean. Lint has no new warnings: the two in `Auth.tsx` are older `<img>` notices.

---

## 12. Personalize a Template: search first, suggestion form at the end

Owner request 2026-11-08: the placement of the search bar and the email input didn't look right; make it nicer.

### Before
The search bar and the "Looking for something else?" box (idea field, email field, Send idea) sat side by side under the heading. Two inputs competed for attention before the customer had seen a single template.

### After
- **Search leads.** It's the one control under the heading (up to 720px wide), with the occasion chips right below it.
- **A quiet link beside it:** "Can't find it? **Suggest a card**" (berry, underlined). On phones it sits under the search. It scrolls smoothly (instantly with reduced motion) to the suggestion band and puts the cursor in the idea field. Any search words come along, but an idea already typed is never wiped.
- **The suggestion form is now a full-width band at the end of the gallery,** after the template rows or search results and before the footer:
  - a paper tile with a terracotta top stripe;
  - on the left, the heading "Looking for something *else?*" and one sentence;
  - on the right, the idea field, then email + Send idea, then the privacy note;
  - on screens under 900px, these stack.
- The no-results "Suggest '{search}' to our team" button still fills the idea field and now also scrolls to the band.
- **Tidy:** removed the unused `compact` variant and the phone-only "Suggest an idea" toggle (at the end of the page the form shows straight away), along with the unused `useIsPhone` import.

### Files
- `components/personalize/PtGallery.tsx`, `components/personalize/PtSuggestBox.tsx`, `styles/personalize.css`.
- `design-system/docs/02-components.md` (2.20).

### Verified
- 1280px: search and link on one line, the band two-column above the footer, and "Suggest a card" scrolls there and focuses the idea field.
- 375px phone: search, then the link, then chips. The band is stacked with nothing scrolling sideways (page width 375).
- `tsc` clean; lint 0 warnings in `components/personalize`.
- Not changed: the occasion chips start slightly in from the search's left edge, because the scroll row keeps room for its left arrow. That was already the case before this change.

---

## 13. Personalize a Template: colour pass with the lesser-used colours

Owner request 2026-11-08: build every recommendation from the colour review of the Personalize flow.

### Built
1. **Stage colours.**
   - Details and Words berry, Design gold. Photo, Song and Review already matched Build My Card's stage names.
   - They show on the card stripe and tint, the current rail dot (the rail steps now carry `data-stage`) and the summary groups.
   - Verified: Details #9E3D58, Design #D8B65A, Words #9E3D58, Song #D8B65A.
2. **Gold AI suggestions, and the squeezed tiles fixed.**
   - The cause of the squeezed tiles was mine. The "Looking for something else?" band I restyled earlier today shared the class `pt-suggest` with the Design step's AI box, so the AI box picked up the band's terracotta stripe and two-column layout.
   - The band is now `pt-idea-*` (`PtSuggestBox.tsx`, `PtGallery.tsx`, `personalize.css`). The AI box gets the shared gold `bmcq-ai-block` look, and its cards sit in an even grid (316px each at 1280×800, two by two).
3. **Template tones.**
   - `templateTone(id)` in `catalogue.ts` gives each template one of the landing gallery's five tones in catalogue order, so neighbours always differ.
   - Tiles show the tone with the template's name in Lobster Two, like the landing gallery's fronts. The gold logo isn't used here, because it only goes on forest.
4. **"Your card so far" grouped by stage** (`PtSummary.tsx`):
   - Build My Card's accordion: the current stage is open, the others fold to one line with their stage colour on the left edge.
   - Stages with more than five answers are dense.
   - It works in the phone sheet too.
5. **Sign-up band (signed out)** is forest: ivory heading, gold script, oat body text, ivory "Sign up free" button. Verified: background #2F3E3B, text #D9CFC3, button #F7F0E8.
6. **Coming soon tiles** are raised ivory with a 3px terracotta top stripe, cocoa name and a paper "Coming soon" pill.
7. **Row headings** carry a short terracotta stripe.
8. **Occasion chips** carry the tone dots (terracotta, berry, gold, forest, cocoa in seven slots); "All" has none.
9. **The star sign** ("That's Pisces.") is a terracotta chip with deep-espresso text. Verified: #C98A76 with #2E2422.
10. **Song step.**
    - The logo QR preview shows straight away (unless "No song" is chosen).
    - On desktop it sits beside the choices, like Build My Card's song step, so the step fits one screen (821px → 800px at 1280×800).
11. **Header.**
    - A tone swatch sits beside the template name ("Personalizing ▮ Horoscope").
    - The same header now shows on Review, filling the empty top-left corner.
    - The name and "Choose a different template" stay on one line.
- **Also:**
  - The chosen On This Day story is raised ivory with a berry edge, with cocoa source links.
  - Four option cards ("How should we use a photo?") sit two by two from 600px, instead of 3 + 1.

### Working alongside the other session
- At 14:58 the other session added its own "Colour pass (design system v1.3)" to `bmc-polish.css`: done rail steps are forest outlines, the review header is a forest band, and terracotta marks what the sender made. Its rules only touch Build My Card's stylesheets. Mine are all in `personalize.css` and build on its versions of the shared Review and top-up dialog (their new front and song props).
- Two development servers appear to be running from this folder: ports 3100 and 3101 were taken, mine is on 3102. My server twice switched to a 404 for `/create/personalize-a-template` until it was restarted. I didn't run `next build` this time, so I wouldn't overwrite the shared `.next` build folder again.

### Files
- `components/personalize/catalogue.ts`, `PtGallery.tsx`, `PtQuestionnaire.tsx`, `PtSummary.tsx`, `PtQuestion.tsx`, `PtSuggestBox.tsx`.
- `styles/personalize.css`.
- `design-system/docs/02-components.md` (2.20).

### Verified
- **1280×800:** gallery (tones, dots, row stripes, Coming soon), Details, birthday (sign chip), photo choice (2 × 2), Design with AI suggestions, Words, Song (QR beside), Create, and Review (header back, nine buttons on one line).
  - Each question step is exactly 800px tall.
  - The signed-out gallery shows the forest band.
- **375px phone:** gallery, with no sideways scrolling.
- `tsc` clean, lint 0 warnings in `components/personalize` and `components/bmc`, tests 5/5.
- **Not run:** `next build` (see above).

---

<!-- Next changes are appended below as they happen. -->

## Personalize a Template build prompt (2026-11-08)

- New: `PERSONALIZE_TEMPLATE_BUILD_PROMPT.md` (repo root). The build prompt for rebuilding Personalize a Template as adaptive, Haiku-powered template cards, with the cards-or-credits choice on entry and the "Suggest a template" box beside the search. Prompt only; no app code changed.
- Prompt updated with owner decisions: no Back to options button on Personalize; padded filler tiles show the Souvenote logo as a placeholder and are not selectable; suggestions are stored in mock data only, with no backend route or emails.
- New: `build-fixes/mock-data-mode-2026-11-07/PERSONALIZE-TEMPLATE-CONFIG-PROPOSAL.md`, the proposed per-template configuration (concept, style, photo use, its own questions, music preset) and the templates proposed as not launch-ready. Waiting for owner approval before any code changes.
- Updated after the owner's review of their own process files (`Desktop\Personalize a Template\`): the config proposal now covers the catalogue and the three draft cards; the decisions are at the top of the build prompt.

## Personalize a Template rebuild (2026-11-08)

**Goal:** rebuild Personalize a Template from the owner's process (`Desktop\Personalize a Template\`: AGENTS.md, the ideas PDF, Completed Prompts and the three question maps). Each card has its own adaptive questions (Haiku 5.5, mocked on this branch). Also: the gallery follows the ideas PDF, the cards-or-credits pop-up shows on entry, and a "Suggest a template" box sits beside the search. All on berry & ivory.

### What changed
- **Gallery:**
  - Rows follow the PDF's 11 headings, 92 ideas in all. The last six PDF ideas are shown under "Additional original concepts" (they followed Pet Paradise in the PDF).
  - Occasion chips and search filter across every row.
  - Tiles use the logo placeholder. Horoscope, On This Day and Comic Card open; every other idea is "Coming soon" (name only, no click).
  - The 12 old templates that aren't in the list are gone from the gallery; their saved drafts still open as a "saved template".
  - Signed out: only Most popular, plus a sign-up band.
- **Suggestion box:**
  - "Looking for something else?" sits on the search row, with an idea field, an email field (pre-filled from the account) and "Send idea".
  - Ideas are validated, stored in mock data (`templateSuggestions`), deduplicated and rate-limited.
  - A search with no results offers to suggest the search.
- **Entry pop-up:** with no credits, the shared cards-or-credits dialog opens (new "entry" variant), once per visit. It doesn't open when resuming a draft or while the balance loads.
- **Questionnaire:**
  - One question at a time, from each card file: names first (with phonetic spelling), the photo modes the card allows, the card's own questions, front words, the inside message (with the AI version), the song (Vocal / Instrumental / No song, plus whether it uses the name and the card's detail), lyrics approval, then Create.
  - The rights check opens as soon as photos are picked; Cancel discards them. Up to 4 photos.
  - "Choose a different template" goes back to the gallery.
- **The three draft cards:**
  - **Horoscope:** the app works out the sign; sign-tailored photo modes, Transform ideas and Enhance styles; what to celebrate (trait, memory or wish, asking for detail when needed); mood; cover line.
  - **On This Day:** the full birth date and an optional place; mock verified stories with source links (labelled as sample data), with a lighter-stories option; three headline tones; masthead and an optional caption.
  - **Comic Card:** No photo or Transform; character concepts; occasion; story branch (memory, habit or adventure), with follow-ups; optional ending; a 4-panel storyboard (at most 2 bubbles per panel, about 8 words each, with counters); comic style.
- **Generation and Review:**
  - The snapshot logs the card version and the prompt version.
  - The cover prompt is the card's instructions, then the originality rules, then the production instructions from AGENTS.md.
  - The song prompt is a placeholder for each card.
  - Build My Card's Review is reused, with the card's front notes ("check the spelling on the front"). Delivery's "Back to review" returns to the card.
- **My Cards:** Personalize drafts resume at their next open question. Old pop-up drafts are migrated: an old include-song becomes a sung song with lyrics unapproved, and the old pre-filled "To the moon and back" caption counts as unconfirmed.

### Files
- **New:**
  - `components/personalize/`: `catalogue.ts`, `ptBrief.ts`, `types.ts`, `sharedQuestions.ts`, `ptEngine.ts`, `ptPrompts.ts`, `zodiac.ts`, `PtGallery.tsx`, `PtSuggestBox.tsx`, `PtQuestionnaire.tsx`, `PtQuestion.tsx`, `PtSummary.tsx`.
  - `components/personalize/templates/`: `horoscope.ts`, `onThisDay.ts`, `comicCard.ts`, `savedTemplate.ts`, `index.ts`.
  - `components/flow/TopUpChoiceDialog.tsx`, `lib/mockPersonalize.ts`, `styles/personalize.css`, `PERSONALIZE-BEDROCK-HANDOFF.md`.
- **Changed:**
  - `components/PersonalizeTemplateClient.tsx` (rewritten) and `create/personalize-a-template/page.tsx` (metadata, berry & ivory shell).
  - `components/MyCards.tsx` (resume target), `components/delivery/deliverySource.ts` (back to `#review`), `lib/api.ts` (five Personalize calls), `lib/mockDb.ts` (`templateSuggestions`), `lib/mockInterview.ts` (`extractShared` exported).
  - `layout.tsx`: no longer imports the old `pt.css`.
- **Build My Card files (additive; behaviour unchanged):**
  - `bmc/engine.ts`: `recordAnswer` / `skipQuestion` / `updateBrief` are generic.
  - `bmc/BmcQuestion.tsx`: Caption, Message and Lyrics controls are exported (`SharedQuestionProps`).
  - `bmc/BmcReviewStage.tsx`: optional `frontPrompt`, `frontNotes`, `frontEditQuestionId` and `songLabel`.
  - `bmc/BmcDialogs.tsx`: the top-up choice moved to `flow/TopUpChoiceDialog.tsx`; the sign-up dialog takes an optional heading and body.
  - `bmc/BmcQuestionnaire.tsx`: imports the shared dialog.
  - `bmc/ui.tsx`: a `search` icon.
- **Docs:** `design-system/docs/02-components.md` (2.18 updated, new 2.20), `docs/06-governance.md` (v1.4), `reference/index.html` and `reference/styleguide.css` (Personalize example), `PERSONALIZE_TEMPLATE_BUILD_PROMPT.md` (owner decisions), `PERSONALIZE-TEMPLATE-CONFIG-PROPOSAL.md` (updated).

### Deleted (owner approved, 2026-11-08; nothing used them)
`components/Personalize.tsx` (old gallery, pop-up and Nova chat), `components/AttestationGate.tsx`, `components/BmcReview.tsx` and `styles/pt.css`.

### Verified (mock data mode)
- `tsc` clean. Lint: 0 errors (12 existing `<img>` warnings elsewhere). Tests 5/5.
- `next build` compiles. It was built in a temp copy, so the other session's dev server on port 3100 wasn't disturbed.
- **1280px:**
  - Gallery rows and tiles.
  - Horoscope end to end: names; birthday, with the sign shown; Transform; rights check on drop, where Cancel discards and Agree adds the photo; sign-tailored ideas and "Suggest more"; memory and detail; mood; suggested cover line; own message and AI version; sung song; song use; lyrics approval; Create. A double click charged 2 credits once.
  - Review: both message versions, the song and QR code, the front notes. Approve all, then Delivery, then "Back to review" reopens the card.
  - On This Day to the inside message: year required; sample stories with sources; headlines; masthead.
  - Comic Card to the style step: an over-long bubble blocks Approve.
  - With 0 credits the entry pop-up opens; Cards and Credits open the right Top up view; it doesn't open again on reload.
  - Suggestion box: errors, sent state, stored record, the no-results pre-fill.
  - The old "Father's Day Comic" draft resumes as a saved template.
- **375px:** gallery and questionnaire with no sideways scrolling; the suggestion box collapses to a button.
- **Fixed during checks:**
  - The photo step closed straight after agreeing; it now waits for Continue.
  - Old drafts' `template=saved-template` link opened the gallery.
  - A doubled full stop in the song hint.
  - "Recommended" appeared twice on On This Day's photo option.
  - The storyboard repeated the card summary.
- **Not checked:** signed-out gallery gating, tablet width, keyboard-only and screen-reader runs, reduced motion, the Enhance and Decorate paths beyond their choice, real Bedrock and search calls.
- Re-checked after deleting: nothing imported them; `tsc` clean; lint 0 errors (8 warnings, down from 12, since three `<img>` warnings were in `Personalize.tsx`). The comment in `attestationContent.ts` now names only the shared dialog.

### Gallery polish (owner, 2026-11-08)
- Removed the "Templates" eyebrow above the heading.
- Suggestion box restaggered (tablet and up): the idea field has its own full row, with email and Send on the row beneath, so the email no longer sits level with the search. On desktop the search lines up with the statement at the top of the panel.
- Occasion chips are one line that scrolls sideways, with a soft fade on the right edge.
- Files: `components/personalize/PtGallery.tsx`, `styles/personalize.css`.
- Checked at 1280, 768 and 375px: chips stay on one line and scroll; no sideways page scrolling; the phone suggestion form stacks.

### Scroll rows: arrows either side, hover to glide (owner, 2026-11-08)
- New `components/personalize/PtScrollRow.tsx`, used by the occasion chips and every card row. It puts a forest arrow on the left and on the right of the row (the arrows in the row headings are gone).
- Hovering an arrow (mouse or pen) glides the row that way until the pointer leaves. Pressing it (mouse, touch or keyboard) jumps most of a screen. An arrow fades out when there's nothing more that way; a row that fits shows no arrows.
- No visible scrollbars anywhere (`scrollbar-width: none`, plus the WebKit rule). Swiping and trackpads still scroll. The scroll-snap and right-edge fade were removed, because snapping fought the glide.
- Phones (under 600px): no arrows; rows are swiped.
- Files: `PtScrollRow.tsx` (new), `PtGallery.tsx`, `styles/personalize.css`.
- Checked: no scrollbar on any row (0px); hovering glided the chips 336px in 0.8s and stopped on leave; clicking jumped Most popular to its end, then that arrow faded; at 375px the arrows are hidden with no sideways scrolling. `tsc` and lint clean.
- Removed the "N templates" count beside each row heading (owner, 2026-11-08). Search and occasion results still show their count. File: `PtGallery.tsx`. Checked: no counts on the 11 rows; `tsc` and lint clean.

---

## Design-system scope: which screens are redesigned (2026-11-08)
- `design-system/docs/06-governance.md` "Scope today" now has two tables. The first lists the screens on berry & ivory (Landing, auth, Welcome, Home, Create Options, Pricing/Top-Up, Cart/Delivery/Confirmation, Build My Card, Personalize a Template), with routes and live CSS files. The second lists the ones not redesigned yet (Saved Cards & Songs, Account Profile and Settings, Refer, Gift, Redeem, FAQ, Contact, the four legal pages, Community Cards placeholder, local test checkout).
- Built from mapping the 2026-10-25 screenshot set (`reference-materials/App Screenshots/2026-10-25 Full App`) against git history and this branch. The CSS file for each screen was checked against its imports. Docs only, no app change.

### No photo: describe how they look (owner, 2026-11-08)
- **Rule:** on a card whose no-photo front shows the person, choosing "Continue without a photo" asks "How do they look?", then at most two follow-ups. Each follow-up asks only about a key detail the answers so far leave out, in this order: hair, then what they usually wear, then anything they're known for (glasses, a hat, an accessory). Everything can be skipped, and a skip ends the follow-ups. We never guess anyone's look from their name.
- **Where it applies:** Comic Card, and saved templates (old drafts). Horoscope and On This Day keep their symbol and story fronts with no person (owner decision).
- **Comic Card:** the description becomes the hero in every panel. Skipping it offers original character concepts to approve, as in the question map.
- **Old pop-up drafts:** their written description counts as the look answer, so only missing details are asked.
- **Code:** `lookQuestions()`, `LOOK_DETAILS` and `lookDescription()` in `sharedQuestions.ts`; a new optional `onAnswer` on card questions (saves which detail a follow-up asked); `templates/comicCard.ts`, `templates/savedTemplate.ts`, `ptBrief.ts` (migration), `PtQuestionnaire.tsx`. In production, Haiku may tailor the follow-up wording only; the app picks the detail.
- **Checked in the browser:**
  - Hair described: asked about clothes, then about anything he's known for, and Skip ended it.
  - Full description: went straight to the occasion.
  - Description skipped: original character concepts offered.
  - `tsc` and lint clean.

## Remaining screens build prompt (2026-11-08)
- New `REMAINING_SCREENS_BUILD_PROMPT.md` (repo root): the redesign prompt for Saved Cards & Songs, Account Profile, Account Settings, FAQ, Contact, the four legal pages and Community Cards, plus removing Refer a Friend, Gift a Souvenote and Redeem Gift for v2.
- Based on the MVP PRD, the 2026-10-25 Task Breakdown and Change Notes, the design system (v1.4) and the current code.
- Owner decisions recorded in it:
  - Community Cards is built as the full catalog, with placeholder logo art.
  - Refer, Gift and Redeem code is deleted (no feature flag).
  - Every Account Settings control is first checked against Cognito; Cognito-backed controls are built for real, backend-backed ones on mock data, and the rest removed.
  - FAQ and legal text are updated to the PRD as drafts for approval.
  - Prices come from the pricing catalog (Print and Send $9.99 overrides the PRD's $7.99).
- Prompt only; no app code changed.

### Build My Card: no photo, describe how they look (owner, 2026-11-08)
- **Rule:** the same as Personalize. After "Describe them instead", up to two follow-ups ask only for key details the description leaves out: hair, then what they usually wear, then anything they're known for. All are optional, and a skip ends them. They only appear when the description is about a person; a pet or a thing gets none.
- **Shared code:** `bmc/lookDetails.ts` is new and holds the details, their wording, and the person-or-pet check. Personalize's `sharedQuestions.ts` now uses it too, so there is one list for both flows.
- **Build My Card changes:**
  - New questions `P4_look_hair`, `P4_look_style` and `P4_look_signature` in `questionBank.ts`.
  - `image.lookDetails` in `brief.ts`; older drafts default it to empty.
  - `describedSubject()` feeds the description plus the follow-up answers into the image prompt, the text context and the "Your card so far" panel (`compile.ts`, `BmcSummary.tsx`).
  - Name-aware wording in `engine.ts` (`tailorPrompt`).
  - Text controls in `BmcQuestion.tsx`.
  - The follow-ups reopen the front summary (`BmcQuestionnaire.tsx`), and uploading a photo afterwards clears them.
- **Checked in the browser:**
  - "My dad: tall, short grey curls": asked about clothes, then glasses and the like, then moved on to the story.
  - "Our golden retriever Biscuit": no follow-ups. The first try asked about hair; fixed by widening the pet word list.
  - Six sample descriptions classified correctly in a script.
  - `tsc` and lint clean.
- **Revised after owner questions (2026-11-08):**
  - Refer, Gift and Redeem leave no trace in the code. Wrong addresses, including old links, get one branded not-found page (`app/not-found.tsx`).
  - Account Settings was researched against the AWS Cognito docs. The decisions are now in §3.4 of the prompt, so the developer doesn't redo the research:
    - change password and "Sign out of all devices": kept, built for real;
    - optional authenticator-app (TOTP) two-factor: built for real, not for social accounts;
    - removed: the device count, Deactivate, the Notifications tab and the reminders toggle;
    - new: Delete account with the PRD explainer, and Saved recipients.
  - Support contact is `cameron@souvenote.com` (one constant). No reply-time promise.
  - Appendix A holds the draft Community Cards catalog, for the owner to approve.
- Appendix A (Community Cards catalog) approved by the owner, 2026-11-08.

## FAQ and legal drafts (2026-11-08)
- New `FAQ_AND_LEGAL_DRAFTS.md` (repo root). It contains:
  - a fact sheet with sources;
  - 10 conflicts for the owner to settle;
  - a 26-question grouped FAQ (one list for `/faq` and the landing page);
  - draft Privacy, Terms, Refund and Cookie policies, the Cookie policy built from an audit of every `souv_*` browser-storage key in the code;
  - lawyer, owner and provider checklists.
- Researched from the PRD, the owner decisions, the pricing catalog and the frontend code. Drafts only; not legal advice.
- `REMAINING_SCREENS_BUILD_PROMPT.md` decision 4 now points the developer at this file instead of asking them to write the text.
- **Marketing opt-in removed (owner, 2026-11-08):**
  - `FAQ_AND_LEGAL_DRAFTS.md`: conflict 3 is marked settled. The Privacy draft now says no marketing emails are sent. The lawyer item now only asks for confirmation that confirmations are transactional under CASL.
  - `REMAINING_SCREENS_BUILD_PROMPT.md`: new decision 9 removes the opt-in from Sign Up and `/signup/terms` and keeps the backend column. It also flags the old Settings toggle's default-on (`?? true`) and asks for new wording for the sign-up "birthday reminder" line.

## Owner decisions round, 2026-11-08 (drafts and prompt updated)
- **Canada and the US are both in MVP** (overrides the PRD). Cards can be mailed to either country, cross-border included.
  - **US prices (USD):** Print and Send $7.99; Big Sender $6.99 / $5.99 / $4.99; top-ups $1.50 / $8 / $20; typo replacement $2.99. 10 AI credits per card.
  - **Canadian prices (CAD):** unchanged.
  - **Currency and country:** the account country (CA or US, required at sign-up) sets the currency, and Settings shows it read-only. Signed-out visitors get a Canada / US price switch.
  - **Tax:** Stripe Tax for both countries.
  - **Cross-border postage:** a checkout line, $0 until Scribeless confirms. Scribeless prints in both countries with domestic stamps.
  - **Migration 008** (USD rows) is to be proposed, and added only once the owner approves it.
- **Storage** is 12 months (fix the Pricing "15 months" line). **Big Sender minimum** is 2.
- **Sign-up line:** "Set your login details."
- **Attestation:** a short summary with links to the final Terms and Privacy Policy. The only address is cameron@.
- **Analytics:** PostHog with cookies, off until the visitor accepts a consent banner (`souv_cookie_consent`, "Cookie settings" in the footer). No PostHog package yet.
- **Unused top-ups and packs:** refundable within 14 days if unused.
- **Privacy Officer:** Cameron. **Governing law:** British Columbia.
- **Files:**
  - `FAQ_AND_LEGAL_DRAFTS.md` rewritten for Canada and the US, now 28 FAQ questions, including "Does it cost more to mail across the border?" and "Can I change my country?";
  - `REMAINING_SCREENS_BUILD_PROMPT.md` gets decisions 10–16 and new §3.11 (Canada and US), §3.12 (attestation summary) and §3.13 (cookie banner).

## Pre-build follow-ups, 2026-11-08
- **Saved Cards & Songs:** gets a Delete action (confirmation pop-up; submitted orders and mailed songs aren't affected; `DELETE /card-drafts/:id` contract).
- **Attestation:** the scroll gate is removed after research. Clickwrap is enforceable in both countries (*Meyer v. Uber*, *Berman v. Freedom Financial*, *Rudder v. Microsoft*). The photo-consent promises are shown in full in the pop-up for Quebec CCQ art. 1435, each with an unticked checkbox, and the version and time of acceptance are recorded. The lawyer is to confirm.
- **Migration 008** (USD price list, Big Sender minimum 2) is approved as a file, not run.
- **Existing accounts:** no country handling needed (only the owner's). The mock demo account is seeded as CA.
- **Unused pack:** no card sent and no included credit spent.
- **PostHog** is added later. The consent banner and loader are built now.
- **Not incorporated yet:** the legal policies keep the entity placeholder and can't go live until the business is registered.
- The drafts' §2 is renumbered (settled 1–12, open 13–17).

## Personalize: one photo treatment per template, 2026-11-08
**Why:** the customer picks a template because they like its example, so a menu of Transform / Enhance / Decorate made them design the card again, and "Enhance" was hard to tell apart from Transform. The original brief also asked for no image modes on this path.
- **Photo step** (`PT_photo_mode`, heading "Add a photo?"): two cards, **Use my photo** (the card's own treatment, which reimagines the photo the way the example shows) and **Continue without a photo**. Where the card allows it, a quiet link "Prefer your photo untouched? Keep it as it is, framed with artwork" switches the photo card to **Use my photo as it is** (Decorate), and "Reimagine it in this card's style instead" switches it back.
- **Per template:** Comic Card is photo or no photo (no keep-as-is link). Horoscope, On This Day and Saved template offer the link. On This Day still marks no photo as Recommended, and its photo is now redrawn as a vintage newspaper picture.
- **Enhance is removed from Personalize:** `PhotoMode` is now `none | transform | decorate`. The Horoscope style question (`H_style`) and its `horoscope-enhance-style` mock suggestions are gone. Saved drafts with Enhance open as the card's own treatment. Build My Card is unchanged.
- **Card config** (`types.ts`): `photoModes` / `recommendedPhotoMode` become `photoTreatment`, `keepOriginal` and `recommendNoPhoto`. The summary rows read "Your photo, reimagined", "Your photo, kept as it is" or "No photo" (`photoSummary`).
- **Versions bumped:** `comic-card-draft-2026-11-08b`, `horoscope-draft-2026-11-08b`, `on-this-day-draft-2026-11-08b`, `saved-template-2026-11-08b`.
- **Files:** `personalize/types.ts`, `ptBrief.ts`, `sharedQuestions.ts`, `PtQuestion.tsx`, `templates/{comicCard,horoscope,onThisDay,savedTemplate}.ts`, `lib/mockPersonalize.ts`.
- **Checked:** `tsc` and `eslint` are clean. Walked through Horoscope in mock mode at desktop and 375px: both cards, the link in both directions, and Continue to the upload step.
- **Build prompt:** `PERSONALIZE_TEMPLATE_BUILD_PROMPT.md` item 5 is updated to match.

## Remaining screens, Phase 1: v2 removal, shared shell, not-found page (2026-11-08)
Following `REMAINING_SCREENS_BUILD_PROMPT.md` §3.1, §3.9 and §3.10.

**Snapshot first:** every file touched or removed was copied to `saved-ui/remaining-screens-phase1-2026-11-08/`. The owner chose to delete the code; git history also keeps it.

**Removed (owner decision, v2)**
- Routes: `app/refer/`, `app/gift/` and `app/gift/redeem/` (pages and layouts). These addresses now 404 to the branded page.
- `components/GiftAddon.ts` (blank-gift count and the `souv_blank_souvenote_pending` storage key).
- `components/Options.tsx`, the old pricing page, imported nowhere, which still carried gift and referral copy.
- `AccountPages.tsx`: `ReferPage` and its data and types; the Profile "Blank gifts" stat, gift activity row and gift panel.
- `AccountForms.tsx`: `GiftSouvenotePage`, `RedeemGiftPage`, `GiftIco` and the gift types; an unused `Link` import; "referrals" and "gifts" removed from two notification descriptions (that tab goes in Phase 2).
- `CartPage.tsx`:
  - the blank-gift cart item and the hidden gift offer pop-up (`GiftCheckoutOffer`, `GIFT_OFFER_ENABLED`);
  - the `souv_topup_blank_gift_offer_seen` key and the gift and spark icons;
  - Checkout now opens directly after sign-in.
- `Delivery.tsx`: the hidden blank-gift pop-up and reminder (`DlvBlankGiftModal`, `GIFT_AT_DELIVERY_ENABLED`) and the now-unused `FlowDialog` and `FlowField` imports.
- `MyCards.tsx`: the "Gift" card badge and "Give this Souvenote" variant.
- `PricingReturn.ts`: `peekPricingReturn`, unused after the cart change.
- **Copy:**
  - `AccountRouteClient.tsx` sign-in note: "gifts, and referral link" removed;
  - `flow/FlowDialog.tsx`: gift mentions removed from the comment;
  - `Footer.tsx`: the comment naming the removed features;
  - `/faq`: the lede's "gifting".
- **CSS:**
  - `account.css`: profile gift card, Gift, Redeem and Refer sections, and their responsive rules;
  - `options.css`: REFERRAL section;
  - `checkout-flow.css`: `.ct-thumb-gift`, `.dv-gift-reminder*`;
  - `mycards.css`: `.is-gift`.
- **Grep check:** the frontend has no referral, Refer a Friend, Gift a Souvenote, blank-gift or redeem code left. The only "gift" words left are unrelated: a decorative gift engraving and icon, "wrapped gifts" as a card decoration, the "Restaurant Gift" template idea, a mock story line, and the Sign Up birthday hint, which Phase 5 rewrites.

**Added**
- `components/content/ContentPageShell.tsx`: `ContentPageShell` (on `FlowPageShell`, `.souv-content` scope) and `ContentPageHead` (eyebrow, one h1 with one Lobster Two phrase, lede).
- `styles/content-pages.css`: the content-page styles (not-found card for now).
- `app/not-found.tsx` and `components/content/NotFoundActions.tsx`:
  - "We couldn't find *that page*", with **Go to Home** (`/home` when signed in, `/` otherwise);
  - FAQ and Contact links, plus Create a Card and Saved Cards & Songs when signed in;
  - title "Page not found | Souvenote"; Next.js adds the noindex itself.
- `legal/[slug]/page.tsx`: `dynamicParams = false`, so an unknown slug such as `/legal/terms` is a real 404.

**Docs:** `design-system/docs/02-components.md` §2.22; `06-governance.md` scope tables and version 1.6.

**Local only (don't commit):** `.claude/launch.json` gets a `frontend-remaining-screens-copy` config that runs a temp copy of `frontend/` on its own port, because another chat's dev server is using this folder's `.next`.

**Verified**
- `tsc` clean; lint 0 errors (10 existing `<img>` warnings); `npm test` 5/5.
- `next build` passes (run in a temp copy so the other dev server isn't disturbed). `/refer`, `/gift` and `/gift/redeem` are gone from the route list.
- **Browser (mock mode):**
  - `/refer`, `/gift`, `/gift/redeem`, `/legal/terms` and `/banana` all return 404 and show the branded page: one h1, one `noindex`, no sideways scrolling at 375px;
  - signed out: Home goes to `/`; signed in as the demo account: `/home` plus Create a Card and Saved Cards & Songs;
  - Cart, Delivery, Profile, Settings and Saved Cards load with no errors and no gift or referral text.

## Remaining screens, Phase 2: Saved Cards & Songs, Profile, Settings (2026-11-08)
Following `REMAINING_SCREENS_BUILD_PROMPT.md` §3.2–3.4. Snapshot of every touched file before the change: `saved-ui/remaining-screens-phase2-2026-11-08/`.

**Saved Cards & Songs** (`components/MyCards.tsx`, `create/my-cards-and-songs/page.tsx`)
- Rebuilt on `ContentPageShell` (berry & ivory).
  - **In progress:** draft rows that resume into BMC or Personalize, as before.
  - **Finished cards:** 5×7 fronts.
  - **Songs:** the landing song chip when the asset has a playable address, otherwise a static row.
  - Signed out: a Log In / Sign Up prompt.
- **Storage:** 12 calendar months from the last saved edit (`components/library/storage.ts`), shown as "Saved until {date}", berry inside 30 days. The 30-day rule and copy are gone.
- **Print and send, {price}** on each finished card. The price comes from the catalog through the new `components/pricing/printAndSendPrice.ts` (`printAndSendPriceFrom` moved out of `PricingClient.tsx`). The card goes to Delivery with its existing artwork and song, as before.
- **Delete (new, owner-approved):** a confirm dialog. Focus returns to the section, and the result is announced.
- Removed: the dead download buttons, the fake waveform, the `full` / `__mcsSetMode` mode switch and the `MCS_*` exports.
- `/my-cards` now redirects to `/create/my-cards-and-songs`. The page title is "Saved Cards & Songs | Souvenote".

**Profile** (`components/AccountPages.tsx`)
- An identity tile, four balance tiles (AI credits, cards in bank, cards made, songs made), the 15-month expiry note, Top up credits and See pricing, and links to Saved Cards & Songs, Settings, Saved recipients and Pricing.
- No activity panel (it was always empty) and no order history (v2).
- `AccountRouteClient.tsx` is now only the sign-in gate. The pages render `ContentPageShell` and get their own titles.

**Settings** (`components/AccountForms.tsx` plus the new `components/settings/*`), from the Cognito research
- **Layout:** sections are plain `#anchor` links (linkable, Back works). Desktop: a sticky list plus the open section. Below 900px: the list, or one section with "All settings".
- **Personal info:** unchanged fields, apart from the removals below. Added the line "We email your purchase and order confirmations to this address."
- **Password & sign-in:**
  - **change password** (Cognito `ChangePassword`), with an optional "Also sign out of all devices", ticked by default;
  - **two-step sign-in** (TOTP: QR code plus copyable key, verify, turn off);
  - **sign out of all devices** (`GlobalSignOut`).
  - Google, Facebook and Apple accounts see "You sign in with {provider}…" instead of the password and two-step controls.
  - **Change from the prompt:** sign-out-everywhere also signs out this device and goes to Log In with a message (`?signup=password` or `signed-out`). Staying signed in would have meant asking for the password and code again.
- **Payment methods:** same behaviour, new forms. Remove now asks first.
- **Saved recipients (new):** list, add, edit and delete, using Delivery's address fields and checks, for Canada and the US.
- **Preferences:** currency and language as approved. Currency becomes read-only in Phase 5.
- **Delete your account (new):** explains what's removed and what's kept, needs DELETE typed, then `DELETE /auth/me`, then Cognito `DeleteUser`, then sign out to `/`.
- **Removed (not supported by Cognito, or not in MVP):** the 2FA toggle mock-up, "signed in on 2 devices", the Notifications tab, Deactivate, the "Seasonal ideas and reminders" toggle (its `marketingOptIn` save is gone), the profile photo upload, "Save my spot automatically (30 days)" and "Show prices with tax".

**Two-step Log In** (`components/Auth.tsx`, `AuthProvider.tsx`, `lib/cognitoAuth.ts`)
- **Code step:** when Cognito answers `totpRequired`, Log In swaps the password fields for one 6-digit "Authenticator code" field ("Verify & Log In", "Back to email and password").
- **Errors:**
  - a wrong code says "That code didn't match…";
  - after 5 wrong codes, it says to wait and log in again;
  - a timed-out attempt goes back to email and password.
- **New in `cognitoAuth.ts`:**
  - sign-in: `TOTP_REQUIRED_CODE`, `completeCognitoTotpSignIn`, `cancelCognitoTotpSignIn`;
  - account actions: `changeCognitoPassword`, `signOutCognitoAllDevices`, `fetchCognitoTotpEnabled`, `startCognitoTotpSetup`, `confirmCognitoTotpSetup`, `disableCognitoTotp`, `totpSetupUri`, `deleteCognitoUser`;
  - `CognitoSession.provider`, taken from the id token's `identities` claim.
- **AuthProvider:** `completeTotpLogin` and `cancelTotpLogin`.
- **Password strength:** moved to `lib/passwordStrength.ts`, shared by Sign Up and Settings.

**Delivery** (`DeliveryForm.tsx`, `Delivery.tsx`, `checkout-flow.css`)
- "Choose a saved recipient" picker (shown when the address book isn't empty). It copies the address into the order; editing the order doesn't change the saved entry.
- An optional "Save this recipient to my account for next time" checkbox (signed-in only). It saves after the order is created and never blocks checkout.
- The address-field grid rules are shared with `.souv-account`.

**Data layer (mock mode, with contracts for the backend)**
- **`lib/api.ts`:** `SavedRecipient(Fields)` types, recipients CRUD, `deleteCardDraft`, `deleteAuthenticatedUser`, and `CardDraft.last_saved_edit_at`.
- **`lib/mockApi.ts`:**
  - recipients, owner-checked and de-duplicated;
  - card delete: a card an order points at is hidden but kept;
  - account delete: removes the profile, recipients, payment methods, balance and library, and keeps orders and the cards they point at;
  - `last_saved_edit_at` moves only on a real change.
- **`lib/mockDb.ts`:** recipient seed (Linda Wilson, Halifax), the TOTP fields on accounts, and `last_saved_edit_at` on seeded drafts.
- **`lib/mockCognito.ts`:** the TOTP sign-in challenge (demo code `246810`, 5-try limit), change password, global sign-out, TOTP setup, verify and disable, and the provider on sessions.
- **`lib/mockMode.ts`:** `MOCK_TOTP_CODE` and `MOCK_TOTP_SECRET`. `MockDataBadge` shows the authenticator code.
- **`DEVELOPER_HANDOFF.md`:** Cognito pool requirements (optional TOTP only, email recovery, device tracking off, lost-authenticator admin reset) and contracts (recipients, card delete, account delete, `last_saved_edit_at`).

**Styles:** new `.lib-*`, `.acc2-*` and `.set-*` in `content-pages.css`. `account.css` and `mycards.css` were deleted and their imports removed from `layout.tsx` (copies are in the snapshot). Design system: Components §2.23, governance scope tables, v1.7.

**Verified**
- `tsc` clean; lint 0 errors (10 existing `<img>` warnings); `npm test` 5/5; `next build` passes (temp copy).
- **Browser (mock mode, desktop 1024px and phone 375px):**
  - **Library:** dates are correct (7 Nov 2027 for yesterday's edit); Print and send shows $9.99 and opens Delivery; Delete works (dialog, removal, focus back to the section, announcement).
  - **Delivery:** the picker fills Linda Wilson's address.
  - **Settings, desktop:** the section list and the open section sit side by side, after a layout fix (see Fixed).
  - **Saved recipients:** an invalid ZIP is rejected; a US recipient saves; Edit moves focus to the form heading.
  - **Two-step sign-in:** a wrong setup code is rejected, the right code turns it on; Log In asks for the code, a wrong code is rejected, the right one lands on the return page; Turn off works.
  - **Change password:** a wrong current password is rejected; a real change signs out everywhere and Log In shows the message; logging in with the new password works.
  - **Delete account:** the typed-DELETE gate, then the account and recipients are gone, the order and its card are kept, and you're signed out to `/`.
  - **Signed out:** Profile, Settings, Library and `/my-cards` all show a Log In prompt with no sideways scrolling; the phone settings list opens one section with "All settings".
  - No console errors.
- **Fixed during testing:**
  - On desktop the "one section at a time" rule hid the list and squeezed the panel into the 250px column; it's now limited to below 900px.
  - The Log In code check had lost its regex backslashes (`/^d{6}$/`); restored to `\d` and `\s`.
- **Social accounts:** a mock Google sign-in (after the Terms screen) shows "You sign in with Google…" with no password or two-step controls, and Sign out of all devices stays.
- **Not tested:** real Cognito (no user pool yet), real Google, Facebook and Apple tokens (`identities` claim), reduced-motion and screen-reader runs.


## Remaining screens, Phase 3: FAQ, Contact, legal, cookie banner, upload consent (2026-11-08)
Following `REMAINING_SCREENS_BUILD_PROMPT.md` §3.5–3.7, §3.12 and §3.13, with the text from `FAQ_AND_LEGAL_DRAFTS.md`. Snapshot of every touched file: `saved-ui/remaining-screens-phase3-2026-11-08/`.

**Support constant:** new `lib/support.ts` holds `SUPPORT_EMAIL` (cameron@souvenote.com), `SUPPORT_MAILTO` and the approved reply line ("We read every message and will get back to you as soon as we can."). It's used by the FAQ, Contact, legal, Settings (Delete account, two-step lost-phone line) and the attestation.

**FAQ**
- **One list:** new `components/faq/faqData.ts` holds all 28 questions in 5 groups, from the drafts.
  - Every answer is `status: "draft"` except the approved "Can I buy creation credits without buying a card?".
  - CAD amounts come from the pricing catalog. USD amounts are the owner's list until the Phase 5 USD catalog.
  - `faqPlainText` and `faqStructuredData` build FAQPage JSON-LD from the same data.
- **New `components/faq/FaqAccordion.tsx`:** the landing accordion (2.11), shared. Answers support paragraphs, lists and a price table, and stay in the HTML while closed.
- **`/faq` page:** new title, description and canonical URL, topic jump pills, groups, "Still need help?", and JSON-LD for all 28 questions.
- **Landing and `/home`:** the six landing questions plus "See all questions". The landing page's FAQPage JSON-LD now comes from the same data. The old `FAQ_ITEMS` (North America, 30 days, USD toggle) and `components/FAQ.tsx` (Try Risk-Free) are removed.

**Contact** (`contact/page.tsx`, new `components/content/ContactForm.tsx`)
- Berry & ivory, with the side cards: Email us (the constant), About an order (order reference and Refund Policy link), Quick answers (FAQ), and Follow us (real social URLs, using `SOCIAL` from `Footer.tsx`, now exported).
- **Form:** name and email (pre-filled when signed in), a topic select, an order reference field for order and refund topics, a message with a 2000-character counter, a privacy line, then a reference number on send.
- New `submitContactMessage()` in `lib/api.ts`, with the mock storing to `souv_mock_db.supportMessages` and the contract `POST /support/messages`.
- Removed "reply within a day", "1–2 business days" and `hello@souvenote.com`.
- Below 900px the form comes before the side cards.

**Legal pages** (`/legal/[slug]`)
- **Content:** new `components/legal/legalDocs.ts` holds all four policies from the drafts (Canada and the US, BC law, Cameron as Privacy Officer). Each is `status: "draft"`, and the drafts' `[LAWYER]` notes stay in the drafts file. The missing legal entity shows highlighted as a placeholder.
- **Layout:** new `components/legal/LegalDocument.tsx` (server component):
  - the draft notice: "Draft for review… the version in effect was last updated June 1, 2026";
  - a sticky contents list on desktop and a collapsible "On this page" below 1024px;
  - section anchors, tables that scroll sideways, and print styles.
- **Routing:** `legal/[slug]/page.tsx` gives each policy its own `generateMetadata` (title, description, canonical URL). Unknown slugs still 404.
- **Dates:** `lib/legalVersions.ts` adds refund and cookie dates; they stay at June 1, 2026 until approval, and `TERMS_VERSION` is unchanged.
- Removed `LegalData.tsx` and `LegalPageClient.tsx`. `Pages.tsx` keeps only `PageHero` (the Community Cards placeholder, Phase 4).

**Upload rights pop-up** (`components/attestationContent.ts`, `components/bmc/BmcAttestationDialog.tsx`, new `styles/attestation.css`)
- **Wording:** the long Terms and Privacy texts (with legal@ and privacy@ addresses) are replaced by `ATTG_PROMISES` (5 promises shown in full, for Quebec CCQ 1435) and two reworded `ATTG_STATEMENTS`. `ATTESTATION_VERSION` is `photo-consent-2026-11-08-draft`.
- **Dialog:** one screen with the photo strip, the promises, links to the full Terms and Privacy Policy (new tab), and two unticked checkboxes. Agree unlocks once both are ticked.
  - The reader, scroll gate, progress bar and phone screens are gone (owner-approved, after research).
  - Cancel still discards the photos.
- **Recording:** agreeing records `{ version, acceptedAt, photoCount }` through the new `recordPhotoAttestation()` (mock: `souv_mock_db.attestations`; contract `POST /attestations`) and passes the record to `onAgree(record)`.
- **Not touched**, because another session is editing them:
  - `BmcQuestionnaire.tsx` and `PtQuestionnaire.tsx` still call `onAgree()` without using the record, so the record has no `cardDraftId` yet.
  - The now-unused reader styles (`.bmcq-attest-reader`, `-progress`, `-steps`) are still in `bmc-dialogs.css`.

**Cookie banner** (new `lib/consent.ts`, `lib/analytics.ts`, `components/content/CookieConsent.tsx`, `styles/cookie-consent.css`)
- **Banner:** shown on the first visit (or a new `COOKIE_POLICY_VERSION`) from the root layout. Decline and Accept look identical, nothing is pre-chosen, and it doesn't block the page.
- **Stored choice:** `souv_cookie_consent` holds the choice, its date and the policy version, for 12 months.
- **Footer:** a "Cookie settings" link (on the copyright line) reopens the banner with the current choice shown.
- **Analytics gate:** `analyticsAllowed()` returns true only with consent **and** `NEXT_PUBLIC_POSTHOG_KEY`. PostHog isn't installed (owner: later); the setup steps are in `DEVELOPER_HANDOFF.md`.
- The Mock data badge's "Reset all mock data" clears the choice, like every `souv_*` key.

**Docs:** `DEVELOPER_HANDOFF.md` (contact and attestation contracts, PostHog setup); design system Components §2.24, governance scope tables and v1.8.

**Verified**
- `tsc` clean; lint 0 errors (10 existing `<img>` warnings); `npm test` 5/5; `next build` passes (temp copy).
- **Browser (mock mode, desktop, 746px tablet and 375px phone):**
  - **FAQ:** 28 questions and 28 JSON-LD entries, every question matched in the visible text; answers in the DOM while closed; the price table renders; title and canonical correct.
  - **Landing FAQ:** 6 questions, with "See all questions" going to `/faq`.
  - **Cookie banner:** shows on first visit; Accept is stored (pressed in the pane); the footer link reopens it fixed at the bottom, focused, with the current choice; Decline is stored.
  - **Legal:** all four have their own titles and canonical URLs, the draft notice, and contents counts matching their sections. The entity placeholder is highlighted on Privacy and Terms; no review markers or old addresses show; `/legal/terms` gives the 404 page; the tablet width shows the collapsible contents.
  - **Contact:** three field errors; a successful send with reference SV-D79FB8, stored with the order reference; focus on the thank-you; no reply-time promises.
  - **Upload pop-up** (signed in, Build My Card photo step): 5 promises, links open in a new tab, both boxes unticked, Agree locked until both are ticked, the record stored on Agree.
  - No sideways scrolling at 375px on `/`, `/faq`, `/contact` and `/legal/privacy-policy`. No console errors besides the deliberate 404.
- **Fixed during testing:** the cookie banner wasn't fixed to the screen, because the `.souv-landing` root rule overrode its `position`. It's now `.souv-landing.cc-banner`.
- **Open:**
  - Delivery still promises "5–7 business days" and "into production within one business day", which the FAQ and Terms no longer promise. Left for the Phase 5 copy pass.
  - The old `.pg-faq-wrap` / `.souv-faq` rules in `pages.css` and `next-app.css` go with the Community Cards placeholder in Phase 4.


## Remaining screens, Phase 4: Community Cards catalog (2026-11-08)
Following `REMAINING_SCREENS_BUILD_PROMPT.md` §3.8 and Appendix A (approved). Snapshot of every touched or removed file: `saved-ui/remaining-screens-phase4-2026-11-08/`.

**Catalog** (new `components/community/catalog.ts`)
- 58 cards across the 14 Personalize occasions (sharing `OCCASION_FILTERS`), with the owner-approved names, 7 landscape cards and 8 public examples.
- Each card has `id`, `version`, `orientation`, `art`, `printAsset`, `approved: false` and `publicExample`. `COMMUNITY_CATALOG_VERSION` is `community-2026-11-08`.
- Message rules: 500 characters including the sign-off, 4 short lines.

**Page** (`community-cards/page.tsx`, new `components/community/CommunityGallery.tsx`, new `styles/community-cards.css`)
- Berry & ivory, no gold, with the approved lede and three fact pills (free message, no AI credits, Canada or the US).
- **Signed in:** search, occasion chips, and one scroll row per occasion (the Personalize `PtScrollRow`, with its arrow styles repeated for `.souv-cc`). Search or a chip switches to a grid with a count.
- **Signed out:** the 8 public examples and a sign-up band. **The prerendered HTML is this guest view**: the build output has the public cards and none of the others. The `?card=` reader sits in its own Suspense boundary so the gallery still renders on the server.
- **Metadata:** indexable, with a new title, description and canonical URL; the "coming soon" noindex is gone. Added to `sitemap.ts`.

**Send this card** (new `components/community/CommunitySendDialog.tsx`)
- **Pop-up:** the card front, the message box (characters and lines counted, saved exactly as typed, no AI, no gold), "Leave the inside blank", and the free / no-credits wording.
- **Send this card** saves a draft through the new `createCommunityCardDraft()`:
  - mock: a `community_card` draft with the card's front as its image asset, plus a message asset unless blank;
  - contract: `POST /community-cards/drafts`.
  - It then remembers the selected asset, sets the delivery source to `community`, and opens Delivery.
- **Signed out:** a "Log in to send …" pop-up; Log In and Sign Up come back to `/community-cards?card=id`, which opens that card's pop-up.

**Delivery and library**
- `deliverySource.ts`: new `community` source (Back goes to `/community-cards`) and a `useDeliverySource()` hook.
- `Delivery.tsx`: for Community Cards the lede says the message was free and no AI credits are used, and Back reads "Back to Community Cards". The keepsake shows the front and message with no song, because there's no song asset.
- `MyCards.tsx`: Community Card drafts are titled by card name and appear under Finished cards, where Print and send works as for any saved card.

**Removed (nothing used them):** `Pages.tsx` (`PageHero`), `StaticPageChrome.tsx`, `PageChrome.tsx` and `pages.css` (its import is gone from `layout.tsx`), plus the `.pg-faq-wrap` / `.bmc-shell .pg-hero` rules in `next-app.css`. That retires the last of the old dark page shell. Copies are in the snapshot.

**Docs:** `DEVELOPER_HANDOFF.md` (catalog, `POST /community-cards/drafts` contract, artwork as a launch blocker); design system Components §2.25, governance scope tables and v1.9.

**Verified**
- `tsc` clean; lint 0 errors (10 existing `<img>` warnings); `npm test` 5/5; `next build` passes (temp copy); `community-cards.html` contains the public examples only.
- **Browser (mock mode, desktop and 375px):**
  - **Signed out:** 8 tiles, the sign-up band, title and canonical correct, no gold. Send opens the log-in pop-up with return links to the card. A direct link to a non-public card (`?card=birthday-golden-year`) is gated too.
  - **Logging in through that link** returns to the page with that card's pop-up open, and the full catalog shows (14 rows, 58 cards).
  - **Pop-up:** an empty message and a 5-line message are both rejected; the counter works; Send saves a `community_card` draft with the exact message plus image and message assets, and opens Delivery.
  - **Delivery:** the Community Card wording, "Back to Community Cards", the front with no song row. With the saved recipient picked and a return address, Continue to checkout, Confirm payment and Send to print all work, ending on "On its way" with the order fulfilled.
  - **Credits:** 20 before and after.
  - **Saved Cards & Songs:** "Golden Year | Inside message" under Finished cards.
  - **Phone:** the occasion chip filter works (Wedding, 4 cards); no sideways scrolling; no console errors.
- **Not covered:**
  - real catalog art and print files (all placeholders);
  - a Big Sender redemption for a Community Card (it uses the same checkout path as other cards);
  - keyboard-only and screen-reader runs.

## Remaining screens, Phase 5: Canada and the US (2026-11-08)
Owner decisions 2026-11-08: Canada pays CAD and the US pays USD; anyone can send to either country; country is required at sign-up and currency follows it (read-only); signed-out visitors get a "Prices for" switch; Stripe Tax for both; cross-border postage is a checkout line, $0 until Scribeless confirms. Snapshot of every touched file: `saved-ui/remaining-screens-phase5-2026-11-08/`.

**Price lists** (new `lib/priceLists.ts`)
- CAD: Print and Send $9.99; Big Sender $8.99 / $7.99 / $6.99; top-ups $2 / $10 / $25; typo replacement $3.99.
- USD: Print and Send $7.99; Big Sender $6.99 / $5.99 / $4.99; top-ups $1.50 / $8 / $20; typo replacement $2.99.
- Big Sender starts at 2 cards; 10 AI credits per card in both. `CROSS_BORDER_POSTAGE` is 0 both ways. `formatMoney` gives "$9.99 CAD".
- `components/pricingCatalog.ts` now builds cart items in a currency; `makeTryRiskFreeCartItem` removed.

**Who sees which prices**
- New `pricing/usePriceCountry.ts`: the account's country when signed in; otherwise the guest choice (`souv_price_country`), first guessed from locale and time zone.
- New `pricing/PriceCountrySwitch.tsx` on `/pricing`: "Prices for: Canada | United States" for guests, a note for signed-in visitors.
- Pricing, the Top up pop-up, FAQ answers, Saved Cards prices and the JSON-LD (one OfferCatalog per country) all read the list. Storage copy is 12 months.

**Sign-up and Settings**
- Sign-up: the marketing opt-in is removed; step line "Set your login details."; country (Canada or United States) required, defaulting to the guess; currency saved with it. The terms step for social sign-ins asks for country too (`acceptTerms(country)`).
- Settings: country and currency are read-only, with "To change your country, email cameron@souvenote.com."

**Cart and checkout**
- Stored items are re-priced into the account's currency on load, with a notice. Estimated tax line (new `lib/taxEstimate.ts`, placeholder rates CA 5%, US 7%) and totals with the currency code; the payment pop-up says "Pay $17.11 USD".
- Mock orders are priced from the account's country (`print_and_send_usd`, `usd`) plus any cross-border postage.

**Delivery**
- "Shipping speed" is now "Postage": "Standard postage to {country}, included", no delivery-time promise, and a cross-border line shown only above $0. Production note: "We send your card to print as soon as you check out, and email you an order confirmation."
- New addresses start in the account's country (a US account gets State and ZIP code), only while nothing has been typed. Removing the address being edited keeps its country.

**Backend (approved):** new migration `008_canada_us_price_lists.sql` and the matching seed rows (USD Print and Send and Big Sender, credit packs and replacement in both currencies, Big Sender marked `cad`, Try Risk-Free turned off). Not run anywhere.

**Bug fixed on the way:** a scripted edit turned `$$` into `$` and dropped the dollar sign from `money()` in `PricingClient.tsx`; restored and checked no other spots were hit.

**Docs:** `DEVELOPER_HANDOFF.md` (migration 008, the "Canada and the US" section with the backend gaps); design system Components §2.26 and governance v1.10.

**Verified**
- `tsc` clean; lint clean on the changed files (temp copy).
- **Browser (mock mode):**
  - **Guest Pricing:** the switch flips CAD and USD prices; Big Sender's minus is disabled at 2; both catalogs in the JSON-LD.
  - **Sign-up:** no marketing box, new step line and hints, country defaulted to United States. The new US account stored `US` / `USD`, marketing off.
  - **Signed in as US:** Pricing shows $7.99 USD even with the guest switch on Canada.
  - **Cart:** $7.99 + Estimated tax $0.56 = $8.55 USD. A $10 CAD Creator pack added to storage became $8 USD with the notice. The payment pop-up says "Pay $17.11 USD".
  - **Settings:** Country "United States" and Currency "Prices in USD (United States)" both read-only.
  - **Delivery:** opens on United States with State and ZIP code; the Postage copy is right; switching the recipient to Canada keeps the cross-border line hidden ($0).
  - **Phone (375px):** Cart, Pricing and Delivery have no sideways scrolling; no console errors.
- **Not covered:**
  - a full US order through to "On its way" in the browser (the mock order's USD pricing was checked in code only);
  - real Stripe Tax amounts and Scribeless cross-border rates;
  - migration 008 against a database.


## Site audit against the BMC / Personalize standard (2026-11-08)
- **Request:** check every page and shared part outside Build My Card and Personalize a Template against the standard those two flows set, including the screens rebuilt in Remaining Screens Phases 1 to 5; list what fails, with a fix plan; change nothing until approved.
- **What changed:** new file `SITE-AUDIT-2026-11-08.md` (inventory of 33 routes and the shared dialogs, 13 bugs, 13 inconsistencies, 7 polish items, colour recommendations and a phased fix plan). No app code, styles or docs changed.
- **Files:** `build-fixes/mock-data-mode-2026-11-07/SITE-AUDIT-2026-11-08.md`. Local only: a `frontend-audit2-copy` entry in `.claude/launch.json` (don't commit).
- **Verified:** measured in a temp copy at 1280x720, 1024x768, 768x1024 and 375x812, signed in and signed out; two read-only code reviews; static scans for raw hex, logo files, control characters, eslint-disable and `<img>`.
- **Not covered:** see section 6 of the audit (some dialogs not opened, no screen reader, no reduced motion, no real devices).
- **Owner answers (2026-11-08):** the 12-month rule covers credit expiry; the Top up pop-up is to be made compact. Added B14 (a Print and Send bought from Personalize a Template's top-up stops on the cart instead of returning to the template) and the reason for the `/create` credit gate on Personalize (I6). Still open: I3 and I6. Audit file only; no app code changed.

## After-purchase pop-up in design-system colours; no credit check on /create (2026-11-08)
- **Request:** the "Print and Send ready" pop-up goes back to design-system colours, with a short explanation of what each option does. `/create` stops checking credits before Personalize a Template; credits are checked when the customer goes to generate, in each flow.
- **Pop-up ("Your cards are waiting"):**
  - The four filled buttons (gold, berry, forest, espresso, in raw hex) are now ivory option cards: a hairline edge, bold espresso title, forest arrow and one cocoa line saying what the option does.
  - A small dot names each option (terracotta, berry, forest, cocoa; no gold), with a berry edge, tint and title on hover.
  - The pop-up is 660px wide from 520px, so all four titles fit on one line in a 2×2 grid; one column on phones.
  - The explanations are a new `short` field in `createOptions.ts`, beside the existing titles and links:
    - Personalize a Template: "Start from one of our designs, like Horoscope or Comic Card, and make it yours."
    - Build My Card: "Answer a few questions and we'll create a card from your own idea."
    - Community Cards: "Pick a ready-made card and add your own message. No AI credits used."
    - Saved Cards & Songs: "Finish a draft, or send a card you've already made."
- **`/create`:**
  - Personalize a Template opens straight away; the click-time balance check is gone.
  - With no option checking any more, the `requiresCredits` flag, the check, its spinner, its "We couldn't check your credits" line and their styles were removed.
  - `getCreateFlowGate` was removed from `createFlowRules.ts`, along with its types and the unused `CARD_WITH_QR_SONG_CREDITS`; `MIN_GENERATION_CREDITS` stays, because Personalize uses it.
- **Credits at generate (checked, unchanged):** Build My Card and Personalize a Template both check at Create (`credits < generationCost`), at a paid redo on Review (`credits < 1`) and on the server's "insufficient credits" reply, and open the cards-or-credits choice (`TopUpChoiceDialog`, "create" variant). The mock server refuses a generation without enough credits (`mockApi.ts:571`). Community Cards uses no AI credits.
- **Still on entry:** Personalize a Template's own "Before you start" pop-up (`PersonalizeTemplateClient.tsx`, the "entry" variant) still opens on arrival with no credits. It's in Personalize's files, so it's left for the owner to decide.
- **Files:**
  - `components/createOptions.ts`, `components/CreateOptionsClient.tsx`, `components/createFlowRules.ts`, `components/pricing/PrintSendReadyModal.tsx`, `styles/pricing.css`, `styles/create-options.css`.
  - `design-system/docs/02-components.md` (new 2.27), `06-governance.md` (v1.11).
  - `SITE-AUDIT-2026-11-08.md` (I3 and I6 closed).
  - Backups of every changed file are in `%TEMP%\souv-audit-20261108\backup-1940\`.
- **Verified (temp copy, mock mode):**
  - `tsc` clean; eslint clean on the four changed TS/TSX files.
  - **`/create` CSS cleanup is invisible:** a computed-style fingerprint of every element at 1280 and 375 is identical before and after, apart from the two removed, empty `<p>`s and the cards' running animation transforms.
  - **0 credits:** pressing Personalize a Template on `/create` opened `/create/personalize-a-template` (no Top up); the page's own entry pop-up then opened.
  - **Pop-up, opened by paying for Print and Send:**
    - It's 519, 498, 493 and 695px tall at 1280×720, 1024×768, 768×1024 and 375×812: on one screen, with no inner scrolling, clipping or overflow.
    - The titles are one line each and share a top line per row.
    - Computed colours are ivory #F7F0E8 cards with dots #C98A76, #9E3D58, #2F3E3B and #655250.
    - Link names read "Personalize a Template Start from one of our designs…".
- **Not covered:**
  - Personalize's Create at 0 credits in the browser (code read only; Build My Card's was checked in §6).
  - Hover was checked in the CSS only.
  - No screen-reader pass.
  - `design-system/reference/index.html` has no example of the new pop-up yet.

## Personalize a Template: no credits pop-up on opening (2026-11-08)
- **Request (owner):** remove Personalize a Template's "Before you start" credits pop-up, so credits are asked about only when the customer goes to create, as in Build My Card.
- **What changed:**
  - `PersonalizeTemplateClient.tsx`: removed the on-entry balance check, its once-per-visit `souv_pt_entry_top_up_shown` session flag, its state and handler, and the now-unused router, top-up and pricing-return imports. The page still loads the balance for the questionnaire's Create step.
  - `flow/TopUpChoiceDialog.tsx` (shared with Build My Card): the unused "entry" wording ("Before you start", the balance-only line, "You can browse templates first…") is removed. The `variant` prop now only allows `"create"`, which both flows already pass, so no Build My Card or Personalize questionnaire file changed.
  - `createFlowRules.ts`: nothing imports it now. It's marked RETIRED in its header and kept, because files aren't deleted without approval.
  - **Cookie Policy:** `souv_pt_entry_top_up_shown` removed from the storage list in `legal/legalDocs.ts` and `FAQ_AND_LEGAL_DRAFTS.md`, since it's no longer set.
  - **Docs:** `02-components.md` 2.18 (entry variant marked removed) and 2.27; `06-governance.md` v1.11 row.
- **Files:** `components/PersonalizeTemplateClient.tsx`, `components/flow/TopUpChoiceDialog.tsx`, `components/createFlowRules.ts`, `components/legal/legalDocs.ts`, `FAQ_AND_LEGAL_DRAFTS.md`, `design-system/docs/02-components.md`, `06-governance.md`, `SITE-AUDIT-2026-11-08.md`. Backups: `%TEMP%\souv-audit-20261108\backup-1945\`.
- **Verified (temp copy, mock mode, demo account at 0 credits, session storage cleared):**
  - `tsc` clean; eslint clean on the four changed TS/TSX files.
  - `/create` → Personalize a Template opens the gallery with no pop-up.
  - **Horoscope, walked from names to "Ready to create":** no credit prompt at any step. Pressing "Create my card · 1 credit" opened "Top up to create your card" ("Almost there", "This uses 1 credit and you have 0 credits", "Your card is saved…"), labelled and described, with focus inside. The balance stayed at 0.
- **Not covered:**
  - Paying from that choice still stops on the cart instead of returning to the template: audit item **B14**, in Phase A, not yet fixed.
  - Phone sizes for this change.

## B14: paying from Personalize's top-up returns to the template (2026-11-08)
- **Request (owner):** fix audit item B14. A Print and Send bought from Personalize a Template's "Top up to create your card" choice stopped on the cart's "Your cards are waiting" pop-up instead of going back to the saved card.
- **Cause:** `CartPage.tsx` returned buyers to their work only for `/delivery` and `/create/build-my-card`. Personalize's return address (`/create/personalize-a-template?template=…&draftId=…`) wasn't on the list.
- **What changed:** `CartPage.tsx` has a `CREATE_FLOW_RETURNS` list, built from the two create options' links in `createOptions.ts` (so the paths can't drift). A Print and Send bought from either flow's top-up now goes straight back. Credits and Big Sender purchases with a return address already went back; unchanged.
- **Files:** `components/CartPage.tsx`; `SITE-AUDIT-2026-11-08.md` (B14 done). Backup: `%TEMP%\souv-audit-20261108\backup-1945\CartPage.tsx`.
- **Verified (temp copy, mock mode, 0 credits):**
  - `tsc` clean. Eslint has no new warnings; the two it reports were already there: an unused `FlowDialog` import and an unused `id` (audit P3).
  - Horoscope resumed at "Ready to create" (no pop-up). "Create my card · 1 credit" opened the choice; Top up cards, then Buy Print and Send, then the cart (return address saved), then payment ($10.49).
  - It came straight back to the same card at "Ready to create", with no "Your cards are waiting" pop-up and 10 credits.
  - Create then made the card and opened Review ("Look it over"), leaving 9 credits.
- **Not covered:** the same path from Personalize's Review (a paid "Try again"), and phone sizes.

## Site audit Phase A: bugs B1–B13 (2026-11-08)
- **Request (owner):** start Phase A of `SITE-AUDIT-2026-11-08.md`, the bug fixes. B14 was done earlier.
- **Backups:** every changed file is in `%TEMP%\souv-audit-20261108\backup-phaseA\`.

| # | Fix | Files |
|---|---|---|
| B1 | **Signed-in menu fits without scrolling inside itself.** Related links sit in pairs, two across (Profile / Account Settings, the two Top Ups, the bar's links on phones, FAQ / Contact, the four legal pages in two rows). It's 320px wide, and every item shares one 10px left edge. | `Navbar.tsx`, `landing.css` |
| B2 | **Legal pages on phones:** `.lg-layout` gets `grid-template-columns: minmax(0, 1fr)`, so the contents list and tables no longer run past the screen. | `content-pages.css` |
| B3 | **Cookie banner on the sign-in screens:** `CookieConsent.tsx` imports `landing.css` (all rules scoped under `.souv-landing`). Decline and Accept are 56px forest buttons there too, not 20px unstyled ones. | `content/CookieConsent.tsx` |
| B4 | **Checkout can't add credits twice:** one idempotency key per checkout (a ref in the cart, reset when checkout opens). Once the payment has gone through, the button becomes "Add it to my account" and retries only adding the purchase. New message: "Your payment went through, but we couldn't add it to your account yet. Press “Add it to my account” to try again. You won't be charged again." | `CartPage.tsx`, `Checkout.tsx` |
| B5 | **No second order on a checkout retry:** if "Checkout didn't start", pressing again reuses the pending order made from the same card and addresses, and only retries starting checkout. Recipients aren't re-saved. | `Delivery.tsx` |
| B6 | **Delete account:** the two steps report separately. "Nothing was removed" if the data delete fails. If only the sign-in close fails: "Your account's data was deleted, but your sign-in couldn't be closed yet. Press Delete my account to finish…", and the retry runs only that step. | `settings/DeleteAccount.tsx` |
| B7 | **Change password:** if the change works but signing out other devices fails, it says so and points to "Sign out of all devices". It no longer says the password wasn't changed. | `settings/SignInSecurity.tsx` |
| B8 | **Double presses:** in-flight refs on Contact's send, Community Cards' "Send this card" and every `ConfirmDialog`. | `content/ContactForm.tsx`, `community/CommunitySendDialog.tsx`, `content/ConfirmDialog.tsx` |
| B9 | **`?card=` links:** handled once. The link and the address's `?card=` are cleared, so an auth refresh can't reopen a closed pop-up. | `community/CommunityGallery.tsx` |
| B10 | **"Log in before *checkout*"** is rebuilt on `FlowDialog`: labelled and described, focus trapped, Escape and a 44px close, focus returned, page inert, forest stripe, a script word. New `.fd-note` style. The old `.auth-gate-*` rules in `site.css` are now unused. | `AuthGatePrompt.tsx`, `CartPage.tsx`, `checkout-flow.css` |
| B11 | **Focus never falls to `<body>`:** cookie banner (back to "Cookie settings", or the page `h1`), Contact "Send another message" (form heading), Saved recipients after save or delete ("Add a recipient"), Payment methods after Remove (form heading), two-step Turn on / Turn off (the new button). | `CookieConsent.tsx`, `ContactForm.tsx`, `settings/SavedRecipients.tsx`, `settings/PaymentMethods.tsx`, `settings/SignInSecurity.tsx` |
| B12 | **Field errors:** new `focusFirstInvalid(form)` in `FlowField.tsx` moves focus to the first invalid field after a failed submit, so its error is read. Used by Contact, Community Cards' Send and Change password. (`FlowField` isn't used by Build My Card or Personalize.) | `flow/FlowField.tsx` and the three forms |
| B13 | **12 months everywhere** (owner: covers credit expiry too). Profile (two lines), Checkout's "12-month send window", Pricing's lede, the FAQ answer, the Terms, and the matching lines in `FAQ_AND_LEGAL_DRAFTS.md` (fact sheet, lawyer item 13, FAQ, Terms). No "15-month" is left in the app. | `AccountPages.tsx`, `Checkout.tsx`, `pricing/page.tsx`, `faq/faqData.ts`, `legal/legalDocs.ts`, `FAQ_AND_LEGAL_DRAFTS.md` |

- **Docs:** `design-system/docs/02-components.md` new 2.28 (signed-in menu, dialogs, forms, focus, cookie banner, legal layout, honest failures); `06-governance.md` v1.12.
- **Verified (temp copy, mock mode):**
  - `tsc` clean. Eslint on all changed files: no new warnings. Three were already there: an unused `FlowDialog` import and an unused `id` in `CartPage.tsx` (audit P3), and Navbar's `<img>` (P2).
  - **B1:** the menu is 492px tall at 1280×720 and 603px at 375×812, with no scrolling inside it; all 16 items line up on one left edge. The iframe walk also shows no menu scrolling at 1024×768 and 768×1024.
  - **B2:** all four legal pages are exactly the screen width at 375. Only the tables scroll sideways inside their own box.
  - **B3:** on Log In, Decline and Accept are 153×56 forest with ivory Lato, and the page measures the same as before (main 623px).
  - **B8, B11, B12 (Contact):** an empty message focused the Message field with its error. Two submits in the same instant stored one message. Focus went to the thank-you heading, and "Send another message" went to the form heading.
  - **B9, B12 (Community Cards):** `?card=birthday-golden-year` opened Golden Year and cleared `?card=`. An empty send focused the message field. After Escape the pop-up stayed closed.
  - **B10:** signed out with Print and Send in the cart, "Proceed to checkout" opened the dialog. It's labelled and described with focus inside, the buttons are 52px, and Escape returned focus to "Proceed to checkout".
  - **B11 (cookie banner):** a first-visit Accept moved focus to the page `h1`. Reopening from "Cookie settings" focused the banner heading, and Decline returned focus to "Cookie settings".
  - **The browser pane wasn't running animation frames** (hidden window), so for the focus checks `requestAnimationFrame` was swapped for a 16ms timer in the test page only.
- **Not covered:**
  - **B4:** the mock database swallows write errors, so a failed grant couldn't be simulated from the browser. The key reuse and the retry-only path are checked in the code and type-checked only.
  - **B5, B6, B7** failure paths were checked in the code only (the mock calls don't fail).
  - Saved recipients and Payment methods focus, and the two-step toggle, were checked in the code only.
  - Screen reader and real devices.
- **Open (needs owner decision):** B5's second half. Delivery's "Multiple" recipients mode still sends only the first address to `createOrder`, which takes one recipient. Either the order contract takes several recipients (backend) or "Multiple" is hidden until it does.

## Orders with several recipients (Scribeless), audit B5 part 2 (2026-11-08)
- **Request (owner):** extend the order so Delivery's "Multiple" mode really mails every recipient. The owner uses Scribeless for printing and mailing. Its public API docs (docs.scribeless.co) show many recipients per send: `POST /api/recipients` takes `data` as an array, and bulk HTML takes 1–500 recipients per call. The owner's account wasn't opened.
- **What changed:**
  - **`lib/api.ts`:**
    - New `OrderRecipient = { address, quantity }`.
    - `CreateOrderRequest.recipients[]` replaces the single `recipientAddress`.
    - New `orderCardCount()` and `assertOrderRecipients()` (at least one recipient, 1–99 each).
    - `Order.recipients`.
    - `createOrder` still sends `recipientAddress` (the first recipient) for today's backend, marked transitional.
  - **`lib/mockApi.ts`:**
    - The mock order stores every recipient and charges per card: Σ quantity × Print and Send, plus cross-border postage per card. Before, one price was charged whatever the quantity.
    - The fulfilment payload lists every recipient, shaped like the Scribeless call.
    - It refuses an order with no recipients.
  - **`components/Delivery.tsx`:** "One recipient" sends the address with its "How many cards" quantity (it used to be dropped). "Multiple" sends every address once (it used to send only the first). The order's card and address counts are remembered for the confirmation.
  - **`lib/mockMvpFlow.ts`:**
    - New `orderCards` field.
    - **Bug fixed while testing:** after a sent order, "Print and send" from Saved Cards (or any create flow) opened Delivery still on the old order ("View confirmation"), so a second card couldn't be sent. `rememberSelectedAsset` now clears the old order when it was already sent, or when a different card arrives before anything was paid. A paid but unsent order, and Delivery's own reload of the same card, keep their order.
  - **`components/DeliveryConfirmation.tsx`:** "We're hand-writing your 3 cards now, and you'll get an email when they're posted." There's a new "Cards" row ("3 cards to 1 address", "2 cards to 2 addresses").
  - **`DEVELOPER_HANDOFF.md`:**
    - New section "Orders with several recipients (Scribeless)": the frontend contract, the backend steps (one order = one one-time campaign, recipients in one array call, checkout, webhooks), the field mapping, the no-idempotency retry rule, the bulk HTML alternative, and what to confirm in the Scribeless account.
    - The old "Several recipients" loose end now points there.
- **Files:** `lib/api.ts`, `lib/mockApi.ts`, `lib/mockMvpFlow.ts`, `components/Delivery.tsx`, `components/DeliveryConfirmation.tsx`, `DEVELOPER_HANDOFF.md`, `SITE-AUDIT-2026-11-08.md`. Backups: `%TEMP%\souv-audit-20261108\backup-recipients\`.
- **Verified (temp copy, mock mode):**
  - `tsc` clean, eslint clean on the changed files, `npm test` 5/5.
  - **Multiple:** Linda Wilson (Halifax, from the saved-recipient picker) plus a typed Sam Rivera (Vancouver), with a Toronto return address. Continue to checkout, Confirm payment and Send to print gave one order with both recipients ×1, $19.98 CAD, and a fulfilment payload with both. Confirmation reached.
  - **One recipient ×3,** via Saved Cards "Print and send" after the first order: Delivery opened fresh ("Continue to checkout"). The order has Linda Wilson ×3 at $29.97 CAD. The confirmation said "your 3 cards… they're posted" with "Cards: 3 cards to 1 address".
- **Not covered:**
  - The real backend: `POST /orders` must start reading `recipients`; until then it mails only the first.
  - Any live Scribeless call.
  - Phone sizes for the new confirmation row.
  - The separate street lines: `PostalAddress` still joins address lines 1–3 into `line1`. Scribeless wants `address1`, `address2` and `address3`, so the backend should split them, or a later change can send them separately.

## Site audit Phase B: consistency (2026-11-08)
- **Request (owner):** start Phase B of `SITE-AUDIT-2026-11-08.md`. I3 and I6 were done earlier; the owner chose "compact" for I4.
- **Backups:** every changed file is in `%TEMP%\souv-audit-20261108\backup-phaseB\`.

| # | Fix | Files |
|---|---|---|
| I1 | **Gold logo only on forest:** the cart pack thumbnail's front card (with the gold "S") is forest; the paper card sits behind it. **Not changed:** the Welcome modal's gold wordmark on ivory. A code comment records it as the owner's choice (2026-11-03), so it's left for the owner to decide. | `checkout-flow.css` |
| I2 | **Community Cards chips:** selected is forest with ivory text (`--l-btn-bg` / `--l-btn-ink`; it was berry with raw `#F7F0E8`). The occasion chips get the shared seven-slot tone dots; "All" has none. A Highlight outline is added for high-contrast mode. | `community-cards.css` |
| I4 | **Compact pop-ups (owner chose compact):** | |
| | — **Top up** (pop-up only): slimmer padding and heading; "How it works" closed behind a 44px toggle (`<details>`, `compactHow` prop); steps three across when opened; Big Sender's quantity on one line; offers and credit packs side by side from 700px; button labels never wrap. | `pricing/TopUpModal.tsx`, `pricing/PricingClient.tsx`, `pricing.css` |
| | — **Checkout:** card fields in two rows from 600px, tighter gaps, and the summary beside the form from 700px. | `checkout-flow.css` |
| | — **Community send, phones:** a 72px card picture beside the title, and the form full width. | `community-cards.css` |
| I5 | **No signed-out flash:** a before-paint script in the root layout marks `<html data-souv-session>` when a sign-in is stored. The nav's signed-out buttons stay hidden until auth resolves (3s safety). `AuthProvider` removes the mark if the sign-in is invalid. The account gate says "Opening your *account*" while loading. It works on every page, including Build My Card and Personalize, without touching their files. | `landing/signedInHold.ts`, `layout.tsx`, `AuthProvider.tsx`, `landing.css`, `AccountRouteClient.tsx` |
| I7 | **Eyebrows:** "Send · Delivery" and "Send · Confirmation" (no "07"/"08"). "Nothing to *confirm yet*" ends on its script phrase. | `Delivery.tsx`, `DeliveryConfirmation.tsx` |
| I8 | **Dialog names:** "Complete your *purchase*", described by a screen-reader line with the total. The Welcome modal is described by its "Pick a card…" line. | `Checkout.tsx`, `Auth.tsx` |
| I9 | **Raw colours → tokens:** new `--l-field-line` (#8A7B77) and `--l-graphite` (#514C4A) in `landing.css`, and `--sv-graphite-600` in `opened-card.css`'s token scope. The checkout field outlines, the handwriting and the Delivery hand note use them. The legal "missing entity" highlight is a terracotta tint (`--l-glow-1` plus a terracotta underline) instead of pale gold. Design system: `tokens.css`, `tokens.json`, Foundations 1.1 (colours and contrast: field line 3.90 / 3.59 / 4.05 on paper / ivory / white; graphite 7.49 on ivory). | `landing.css`, `checkout-flow.css`, `opened-card.css`, `content-pages.css`, design-system |
| I10 | **Mock data badge:** "a card costs 1 credit, or 2 with a song". | `MockDataBadge.tsx` |
| I11 | **Price country for visitors:** stored with its date and dropped after 12 months, as the Cookie Policy says. An old plain "CA"/"US" value is kept and re-saved with a date. | `pricing/usePriceCountry.ts` |
| I12 | **Cookie banner:** no inner scroll; it scrolls only on screens under 480px tall. | `cookie-consent.css` |
| I13 | **Even grids:** Community Cards' facts (one column on phones, three across from 600px) and the FAQ topic pills (2×2 plus a spanning last pill on phones, one row of five from 900px; `--faq-topics` set from the group count). | `community-cards.css`, `content-pages.css`, `faq/page.tsx` |

- **Docs:** Components new 2.29; governance token map (two rows) and v1.13; Foundations 1.1 (two colours, two contrast rows); `tokens.css` and `tokens.json`.
- **Verified (temp copy, mock mode):**
  - **Checks:** `tsc` clean. Eslint has no new problems; the two old `<img>` notices in `Auth.tsx` remain, and one unescaped apostrophe was fixed. `npm test` 5/5.
  - **Top up, measured in fixed-size frames:**

    | View | 1280×720 | 1024×768 | 768×1024 |
    |---|---|---|---|
    | Cards | 678 | 689 | 700 |
    | Credits | 602 | 626 | 620 |

    No inner scroll, toggles 44px, no wrapped or overflowing button labels.
  - **Checkout:** 639px at 1280×720 and 650px at 768×1024, with the card fields in two rows. **Community send:** 655 / 655 / 675 / 745px at the four sizes. Both have no inner scroll.
  - **I5:**
    - Signed in: at first paint `/pricing` had the mark and hidden signed-out buttons, then the signed-in nav.
    - Signed out: no mark, Log In visible.
    - Invalid stored session: the mark was removed and Log In showed.
    - The session was restored afterwards.
  - **Colours:** the cart front card is #2F3E3B. Community "All" is #2F3E3B when selected, with dots #C98A76, #9E3D58, #D9CFC3, #2F3E3B, #655250, #4A3B39, #9E3D58.
  - **Text:** the Confirmation eyebrow reads "Send · Confirmation".
  - **Layout:** FAQ pills 156+156 / 156+156 / 320 at 375, and five of 214px in one row at 1280.
  - **Regression sweep** (Pricing, Cart, Confirmation, Community Cards, FAQ, Profile, Privacy Policy, Create) at all four sizes: no inner scrolling except the sideways rows meant to scroll and the legal table on phones; no sideways page scrolling.
- **Not covered:**
  - **Phones:** the Top up and checkout pop-ups are still taller than the screen, because the packs and the summary stack. The whole pop-up scrolls like a page; it doesn't scroll inside a box.
  - **Not tested:** hover states (CSS only), screen reader, real devices.
- **Open:**
  - Owner decision on the Welcome modal's gold wordmark on ivory.
  - The `.cf-eyebrow-num` style is now unused (Phase C).
- **Owner decision (2026-11-08):** keep the Welcome modal's gold wordmark on ivory as it is (audit I1, second half). It's recorded as the one exception to the gold-logo-on-forest rule in design-system Components 2.13. No app change.

## Site audit Phase C: cleanup (2026-11-08)
- **Request (owner):** start Phase C of `SITE-AUDIT-2026-11-08.md`. Clean up with no visual change, and prove it.
- **Backups:** every changed file is in `%TEMP%\souv-audit-20261108\backup-phaseC\` (`styles/`, `p2/`, `p5/`).

| # | What | Files |
|---|---|---|
| P1 | Legal: contents links 44px tall (were 36). The sideways-scrolling table box is now a named, focusable region ("… (scrolls sideways)") with a focus ring, so keyboard users can scroll it. | `legal/LegalDocument.tsx`, `content-pages.css` |
| P2 | Static logos use `next/image`: nav (mark or wordmark, `priority`), footer wordmark, auth top bar (`priority`), Welcome title. The remaining `<img>` tags have reasoned eslint notes: the Delivery front (remote or `mock://` asset), the gallery's local blob preview, and `opengraph-image.tsx` (Satori needs plain `<img>`). ESLint is now 0 warnings app-wide (was 8). | `Navbar.tsx`, `Footer.tsx`, `Auth.tsx`, `DeliveryKeepsake.tsx`, `landing/LandingGallery.tsx`, `opengraph-image.tsx` |
| P3 | Dead code removed: <br>• Navbar's and Footer's old "default" branches: the other link list, separator dots, `LogoMark.png` / `WordmarkLobster.png`. `navVariant` / `variant` stay as `"landing"` so pages that pass them still compile, and BMC/PT page files are untouched. <br>• Navbar's unused `loggedIn` prop; DemoNavbar's unused props and `useAuth`. <br>• `BmcShared.tsx`: stepper, head, foot, cost, check, nav context and `STEPS` (319 → 145 lines). Only `BmcIcon`, `BmcErrorModal` and `bmcError` remain. <br>• `Ornaments.tsx`: `RuleGold`, `StampCorners`, `Eyebrow`. <br>• `DemoBalance.ts`: `getTotalDemoCredits`, `spendDemoCredits`, `applyDemoTopUpFromCart`, `clearDemoBalance` and the `window.__souvClearDemoBalance` debug hook. Two internal helpers are no longer exported. The other two QA hooks were kept. <br>• `ContentPageShell`'s unused `signedInOnly`. <br>• `CartPage.tsx`'s unused `FlowDialog` import and `id`. <br>• `DemoLibrary.ts` marked RETIRED (not deleted). | as listed |
| P4 | Dead CSS removed by a script (selectors whose classes no source file uses; classes inside `:not()`, `:is()`, `:where()` ignored; built names like `is-${…}` and `s${score}` respected): <br>• `site.css` 1,498 → 780 lines: the old dark chrome, gems, sparkles, flip cards, shimmer CTA, `.auth-gate-*`. <br>• `bmc.css` 2,041 → 235. <br>• `colors_and_type.css` 587 → 194. <br>• `checkout-flow.css` 1,331 → 1,124: old shipping options, hand note, gift tiers, `.cf-eyebrow-num`. <br>• `next-app.css` 118 → 96; `landing-chrome.css` 26 → 16. <br>• `options.css`: every rule was dead, so it's retired (header note) and its import is removed from `layout.tsx`. | `styles/*`, `layout.tsx` |
| P5 | **One money format:** new `formatAmount()` in `lib/priceLists.ts` ("$9.99"); `formatMoney` uses it. It replaces `cartMoney`, `coMoney` and Pricing's `money` (17 call sites). <br>**One total rule:** `orderTotals()` in `lib/taxEstimate.ts`, used by the cart and the checkout. <br>**One cart writer:** `addItemToCart()` in `cartStorage.ts`, used by Pricing; the duplicate `addPricingCartItemToCart` is removed. The cart page uses `SOUV_CART_KEY` instead of its own string. | `priceLists.ts`, `taxEstimate.ts`, `cartStorage.ts`, `pricingCatalog.ts`, `CartPage.tsx`, `Checkout.tsx`, `pricing/PricingClient.tsx` |
| P6 | No refs written during render: `AccountRouteClient` keeps "account shown" in state set by an effect; `Preferences` updates its last-saved ref in an effect. | `AccountRouteClient.tsx`, `settings/Preferences.tsx` |
| P7 | "Saving..." → "Saving…"; the `library/storage.ts` date comment names both locale orders. **Left:** the `cc-` class prefix shared by the cookie banner and Community Cards (both scoped, no clash). | `Preferences.tsx`, `library/storage.ts` |

- **Docs:**
  - `02-components.md` 2.13 (logos via `next/image`).
  - `06-governance.md`: a new "Retired files" table (`options.css`, `DemoLibrary.ts`, `createFlowRules.ts`, the two retired logo files) and v1.14.

### Proof of no visual change (P3–P7)
- **Method:** a computed-style fingerprint (49 properties per element, plus `::before` / `::after`) of every element.
  - Coverage: 24 targets × 2 sizes (1280×720 and 375×812). That covers every route, including Build My Card, Personalize and a Horoscope card, plus the Welcome modal, hamburger menu, Top up, checkout and Community send.
  - Before capturing: animations frozen, every image loaded.
- **Noise check:** two runs on unchanged code differed only by React's streaming `<template>` placeholders, Next's dev-time `<title>`/`<meta>` tags in the body, and a late lazy image. The tool now skips those tags and forces images to load.
- **Result:** baseline versus after, allowing for those skipped tags: 0 differences on 47 of 48 captures.
  - **Community Cards:** the first baseline differed at the landscape tiles. A direct test settled it: the same page with the old stylesheets swapped back and then the new ones, compared with full style text on 788 elements, showed 0 differences, and two runs on the new code were identical. So the CSS removal doesn't change that page. That one baseline run's difference isn't fully explained.
- **P1, P2, P5 are deliberate changes, checked directly:**
  - Logos keep their sizes: nav 35×52 (27×40 on phones), auth 130×30, Welcome 225×52. The footer is 207×48 (was 208, a rounding difference), and all now have `srcset`.
  - Legal contents links are 44px, and the table box is a region, focusable and named.
  - **Prices are identical** in the cart ($9.99, $0.50 tax, $10.49 CAD), checkout ("Pay $10.49 CAD"), Pricing ($9.99 / $8.99 / $7.99 / $6.99 / $17.98, packs $2 / $10 / $25) and Saved Cards ("$9.99 CAD").
- **Caught and fixed during the check:** a scripted edit turned `$$` into `$` and dropped the dollar sign from `formatAmount` ("9.99"). It was restored with the Edit tool and re-verified, and the other scripted edits were checked for the same trap.
- **Checks:** `tsc` clean; ESLint 0 errors and 0 warnings app-wide; `npm test` 5/5.
- **Not covered:**
  - Hover and focus states (computed styles are taken at rest).
  - States behind other interactions, such as edit forms and the delete dialogs.
  - A production `next build` (not run, to protect the shared `.next`).
- **Owner:** the files in the governance "Retired files" table can be deleted when you approve.

## Site audit Phase D: lesser-used colours (2026-11-08)
- **Request (owner):** build the colour recommendations in section 4 of `SITE-AUDIT-2026-11-08.md`.
- **Already true (checked, no change):**
  - Pricing's Print and Send and Big Sender cards already have terracotta top stripes.
  - Delivery's forest send bar already uses oat (#D9CFC3) for its secondary line.
  - The cart's per-card line is already cocoa.
- **Built:**
  - **Cart pack picture:** the back cards use the gallery's berry and terracotta gradients (`--l-tone-5`, `--l-tone-4`). The front stays forest with the gold "S".
  - **Delivery:** a 4px terracotta top edge on "Who's it going to?" and "Return address" (new `yours` prop on `DlvSection`; `.dv-section.is-yours`).
  - **Profile:** a 4px top stripe per balance tile. AI credits gold, Cards in your bank forest, Cards made terracotta, Songs made berry.
  - **Saved Cards & Songs:** a 22×4px terracotta stripe before each section heading, as on Personalize's row headings.
  - **Settings (desktop):** the open section in the list is raised ivory with its berry edge, instead of paper with a shadow.
- **Files:** `styles/checkout-flow.css`, `styles/content-pages.css`, `components/DeliveryForm.tsx`. Design system: Components 2.30, governance v1.15. Backups: `%TEMP%\souv-audit-20261108\backup-phaseD\`.
- **Verified (temp copy, mock mode):**
  - **Checks:** `tsc` clean; eslint clean on `DeliveryForm.tsx`.
  - **Computed colours:**
    - Cart back cards: berry #AC4A66→#9E3D58 and terracotta #D49A88→#C98A76 gradients; the front card shows no gradient.
    - Delivery: sections 1–2 have a 4px #C98A76 top edge; sections 3–4 have none.
    - Profile: stripes #D8B65A, #2F3E3B, #C98A76, #9E3D58, and all four tiles are 114px tall.
    - Saved Cards: three heading stripes, 22×4, #C98A76.
    - Settings: the open "Password & sign-in" item is #EFE3D5 with a #9E3D58 edge.
  - **Layout:** Cart, Delivery, Profile, Saved Cards and Settings at 1280×720, 1024×768, 768×1024 and 375×812 show no inner scrolling, clipping, overflow or small targets. Profile screenshot taken at 1280.
- **Not covered:** a screen-reader pass (no text changed) and real devices.

## Personalize: song lyrics use more of the card's answers (2026-11-08)
- **Request (owner):** pass the card's mood, the cover line or headline, and the comic ending to the lyric writer.
- **Found:** the Horoscope cover line already reached the lyrics as the approved caption. The gaps were the mood, the On This Day headline and the Comic Card ending.
- **Built:**
  - New optional `songCues` on each card file (`types.ts`): a `mood`, plus `lyricNotes` for the lyric writer only.
    - **Horoscope:** the mood answer.
    - **On This Day:** the headline, labelled as birthday wordplay, not a fact.
    - **Comic Card:** how the comic ends.
  - `ptTextContext` (`ptPrompts.ts`):
    - Intended feeling: the customer's written feeling first, then the card's mood, then the shared fallback. This applies to the inside message and the lyrics.
    - Lyric notes are sent only when the customer lets the song mention the detail. They never go to the inside-message writer.
    - With the name turned off for the song, any fact, note or cover line containing the recipient's name is left out.
  - `compileSongPrompt` adds `Mood: {feeling}.` when there is one. `PT_PROMPT_VERSION` is now `pt-prompts-2026-11-08b`.
- **Files:** `components/personalize/types.ts`, `ptPrompts.ts`, `templates/horoscope.ts`, `templates/onThisDay.ts`, `templates/comicCard.ts`, `PERSONALIZE-BEDROCK-HANDOFF.md`.
- **Verified:**
  - `tsc` clean; ESLint clean on the changed files.
  - Compiled the real modules in a temp folder (`%TEMP%\pt-song-cues-cefW`) and ran sample cards:
    - Horoscope "playful" reaches the lyrics, the message and the song prompt.
    - The cover line is dropped when the name is off.
    - The On This Day headline and the Comic ending appear only with the detail on, and never in the message context.
- **Not covered:** the mock lyric writer only uses the name, occasion and motif, so mock lyrics look the same. The difference shows only once the real lyric model is connected.

## Next prompts written (2026-11-08)
- New `NEXT-PROMPT-1-unopened-screens-build-cookie-debug.md`: open and measure the screens the audit never opened, a production build in a temp copy, "Cookie settings" on the sign-in screens, and the remaining debug hooks.
- New `NEXT-PROMPT-2-accessibility-phones-address-launch-performance.md`: the accessibility pass (keyboard, reduced motion, high contrast, hover and focus), phone pop-ups on one screen, separate address lines for Scribeless, a launch-readiness checklist, performance, SEO and security headers, and a real-device checklist.
- Prompts only; no app code changed.

## No eyebrow above a page heading (2026-11-08)
- **Change:** removed the small breadcrumb/section label above each page's main heading ("Create · Community Cards", "Account · Cart", "Send · Delivery", "Pricing · Card packs", "Sign Up · Welcome", and so on).
- **Screens:** Community Cards, FAQ, Contact, legal pages, Saved Cards & Songs, Profile, Settings, account gate, not found, Cart, Delivery, Confirmation, Pricing (card packs and AI credits bands), Build My Card review ("Review"), and the Log In, Sign Up, reset, verify/expired and grace screens.
- **Kept:** eyebrows inside pop-ups ("Account required", "Secure checkout", "Uses 1 credit", the Community Card occasion), the Delivery keepsake label, and Personalize's "Personalizing" label beside the template name.
- **Code:** `ContentPageHead` no longer takes an `eyebrow` prop; callers updated. The now-unused eyebrow CSS rules were left in place.
- **Design system:** new rule in Foundations 1.2 Typography; Components 2.17, 2.22 and 2.29 updated; governance v1.16.
- **Verified:** `tsc` and ESLint clean. In a temp copy (`%TEMP%\souv-noeyebrow-xgyVxn`, port 3160), server HTML for /community-cards, /faq, /contact, /pricing, /cart, /login, /signup and not found has no `cf-`/`pr-`/`auth-eyebrow`; Community Cards screenshot checked.

## Build My Card: better inside-message and lyric writers (2026-11-08)
- **Request (owner):** build improvements 2 to 6 from the writer review. Not built: #1, letting the customer steer a redraft, because it needs a prompt-wording change to the source documents.
- **Built:**
  - **Sign-off and language (#2):**
    - A sign-off chip row in the AI writer box, shown when a sender name is given: Writer’s choice (default), "Love, {name}", "From {name}", No sign-off. Saved as `message.signoff`. It's shared with Personalize, which uses the same message step.
    - `TextContext` gains `language`, `signoff` and `signoffPolicy`. These fill the `{{language}}` and `{{signoff_policy}}` slots the inside-message template already had but nothing supplied.
    - The mock message writer follows the choice.
  - **Lyric history (#3):** `song.lyricDrafts` keeps every lyric draft (at most 6). Rewrites send them all as previous drafts, in Build My Card and Personalize (new `lyricHistory()`).
  - **Front details (#4):** `conceptMeaning` adds the T2 scene detail. For Decorate it describes the real photo with the chosen accessories and lettering.
  - **Vibes (#5):** the writers' feeling is now the written feeling plus the chosen vibes (`writerFeeling()`). The image and music prompts are unchanged, so existing fronts aren't marked out of date.
  - **Out-of-date lyrics (#6):** `song.lyricsMessage` records the inside message the lyrics were written from. A new `lyricsStaleReason()` returns "story" or "message". The lyrics step shows "Your inside message changed since these lyrics were written." with "Rewrite them"; Review shows the same line as a hint.
- **Files:**
  - `components/bmc/`: `engine.ts`, `brief.ts`, `compile.ts`, `BmcQuestion.tsx`, `BmcQuestionnaire.tsx`, `BmcReviewStage.tsx`
  - `components/personalize/PtQuestionnaire.tsx`
  - `lib/mockInterview.ts`
  - `styles/bmc-polish.css` (`.bmcq-signoff`)
  - `BMC-BEDROCK-HANDOFF.md`
  - Design system: Components (AI writer), governance v1.17
  - New launch config `frontend-writers-copy` (port 3170, temp copy `%TEMP%\souv-writers-0Q2q`)
  - Saved drafts load with the new fields at their defaults (`mergeKnown`), so no schema bump.
- **Verified:**
  - `tsc` clean; ESLint clean on `components/bmc`, `components/personalize` and `mockInterview.ts`.
  - In the browser (temp copy, mock mode, Google test account), a full Build My Card run (no photo, Transform, Humorous and Heartfelt):
    - The AI draft signs "Love, Jo" with Writer's choice, "From Jo" after choosing From, and has no sign-off with None.
    - Both lyric drafts and `lyricsMessage` are saved in `creative_brief`.
    - Editing the message brings up the stale notice on the lyrics step; "Rewrite them" clears it.
    - After creating the card, editing the message on Review shows the hint.
    - Sign-off row at 1024×768 has no inner scroll. At 375×812 the chips wrap to two rows (48px tall) with no sideways overflow.
    - No console warnings.
  - Compiled-module check (`%TEMP%\bmc-writers-check-Kzwn`): combined feeling "proud; humorous, heartfelt", the scene detail in the concept, the Decorate concept text, a policy sentence for each sign-off, a bogus value falling back to auto, and the image prompt still using the written feeling only.
- **Not covered:**
  - The mock writers ignore the front details, vibes and draft history, so those improvements show only with the real models.
  - The mock has two lyric variants, so a third rewrite repeats one.
  - Personalize's message step also gets the sign-off row, but I didn't click through it there.

## Proposal: steering an AI redraft (Build My Card #1) (2026-11-08)
- **Request (owner):** draft the prompt change for review. Nothing built.
- **File:** `REDRAFT-STEERING-PROPOSAL.md`. It covers:
  - Exact wording to add to the inside-message template (Image and Message Prompts PDF, page 3) and the lyric writer template (Song Prompt Library).
  - The "What should change?" field and quick picks.
  - The rules the app enforces, the API change, and five decisions for the owner.
- **Found:** the lyric writer template never mentions `{{previous_drafts}}`, so "Rewrite" can return the same lyrics even though the app now sends every earlier draft. The proposal includes a one-sentence fix that can be approved on its own.

## Build My Card #1: steering an AI redraft, built (2026-11-08)
- **Request (owner):** "Approve all, build it" for `REDRAFT-STEERING-PROPOSAL.md`.
- **Built:**
  - **Prompts (`components/bmc/prompts.ts`, `bmc-prompts-2026-11-08b`):**
    - The approved steering sentences were added to the inside-message template.
    - The lyric template gets a new paragraph: "meaningfully different from {{previous_drafts}}", plus the steering sentences.
    - New `USER_DIRECTION_MAX_CHARS` (120) and `stripUserDirection()`, which removes the steering sentences when there's no note.
  - **App:**
    - `cleanDirection()` in `brief.ts` makes the note one line, strips control characters and limits it to 120 characters.
    - The note is sent only on a redraft. It's saved with the draft it produced (`message.aiVersion.direction`, `song.lyricsDirection`) and never as a card fact.
    - `draftInsideMessage` and `draftLyrics` in `lib/api.ts` send `user_direction`.
  - **UI (`BmcQuestion.tsx`, shared with Personalize):**
    - A "What should change?" row with quick picks and an optional line, under the AI message once a draft exists, and under the lyrics while rewrites are left.
    - "Funnier" is hidden for gentle occasions. The row clears after a successful redraft.
    - "Refresh it" and "Rewrite them" in the stale notices still work.
  - **Mock (`lib/mockInterview.ts`):** follows funnier/warmer and shorter/simpler for messages, and simpler/gentler for lyrics, so the feature can be tried in mock mode.
- **Files:** `components/bmc/prompts.ts`, `brief.ts`, `BmcQuestion.tsx`, `BmcQuestionnaire.tsx`; `components/personalize/PtQuestionnaire.tsx`; `lib/api.ts`, `lib/mockInterview.ts`; `styles/bmc-polish.css` (`.bmcq-direction`); the BMC and Personalize handoff notes; the proposal (marked approved and built); design system Components and governance v1.18.
- **Verified:**
  - `tsc` clean; ESLint clean on the changed folders.
  - In the browser (temp copy `%TEMP%\souv-writers-0Q2q`, mock mode):
    - No note row before the first draft.
    - "Funnier" plus "mention her tomatoes" gave the humorous version and the row cleared.
    - "Shorter" gave a one-line message; the saved `direction` was "Shorter".
    - On lyrics, "Simpler words" went from 9 to 7 sung lines and saved `lyricsDirection`.
    - No inner scroll at desktop size. At 375px the chips are 48px tall with no sideways overflow. No console warnings.
  - Compiled check (`%TEMP%\steer-check-*`):
    - `cleanDirection` gives "Funnier. mention Lisbon", null for empty or non-text, and stops at 120 characters.
    - `stripUserDirection` removes the note slot from both templates and keeps `{{previous_drafts}}`.
- **Not covered:**
  - The real request body (mock mode makes no network call).
  - Personalize's message and lyric steps weren't clicked through.
  - "Funnier" hiding was checked in code only.
- **Superseded the same day:** the documents are not updated. The code became the source of truth (see the next entry).

## The code is the source of truth for prompts and catalogues (2026-11-08)
- **Request (owner):** make the code the master copy instead of pasting the new wording into the reference documents.
- **Changed:**
  - **Headers:** the header comments in `components/bmc/prompts.ts` and `components/bmc/catalog.ts` now say the file is the source of truth. They also say to never re-sync from the documents and to bump the version with any change. The catalog was included because it was copied from the same documents and has already moved on from them.
  - **New `reference-materials/Build My Card/OUT-OF-DATE.md`:**
    - It marks the Image and Message Prompts PDF, the Song Prompt Library docx and the Asset Generation Map PDF as unmaintained early drafts, out of date as of 2026-11-08.
    - It points to the files that hold the real versions and lists known differences.
    - The documents themselves are untouched.
    - "User Inputs & Prompt Structure.pdf" is deliberately not covered, because the code doesn't cite it.
  - **Notes:** `BMC-BEDROCK-HANDOFF.md` and `REDRAFT-STEERING-PROPOSAL.md` were updated to match.
- **No prompt wording or behaviour changed.** Comments only; `tsc` clean.

## No eyebrow above a heading, follow-up sweep (2026-11-08)
- **Why:** you still saw "Legal · Refund Policy". The `frontend/` source was already clean. The label came from stale local servers: 3150 (`souv-audit2-copy`) and 3140 (`souv-phase5-build`) are old temp copies, and 3100 is an old `next start` production build. None of them pick up source edits.
- **Also removed:** the small method labels on Log In and Sign Up ("Fastest", "Social", "Email") above the "Sign up with social" / "Log in with email" headings (`Auth.tsx`). The `.auth-method-kicker` CSS rule was left in place, unused.
- **Verified:** synced the latest source into `%TEMP%\souv-noeyebrow-xgyVxn` (port 3160) and ran a rendered scan of every route, signed out and signed in (mock Google). It flags any small or uppercase text sitting just above an h1/h2/h3. No page-heading labels remain. The only remaining hits are step numbers, the "Most popular" badge, filter chips and the cookie banner. Not reached: the inner Build My Card review and Personalize questionnaire screens, which need a card in progress; their source has no page eyebrow left besides "Personalizing" (kept, it names the template).

## Personalize: better inside-message and lyric writers (2026-11-08)
- **Request (owner):** build rules 1, 2, 4 and 5 from the Personalize writer review, and propose a genre for each card (rule 3). Not built: rule 6, a test set per card.
- **Built:**
  - **New `writerBrief` on every card file (`personalize/types.ts`):** required, so new templates must fill it in. It replaces today's `songCues`. It holds:
    - **Labelled details (rule 1):** each detail is a `fact`, `public-event`, `framing` or `staging`.
    - **Writing guidance (rule 2):** one or two sentences for the message writer and for the lyric writer.
    - **Front text (rule 5):** every word printed on the front.
    - **Mood.**
  - **Each card:**
    - **Horoscope:** the sign and its themes as framing; the trait or memory as fact; the scene as staging; the cover line. Guidance: never claim astrology is true.
    - **On This Day:** the story with its date and source as a public event; the headline as framing; the birthplace as fact; the masthead, date, headline and caption as front text. Guidance: keep the event's facts exact and don't work out their age.
    - **Comic Card:** a memory or habit as fact, with exaggeration marked as staging; an adventure, write-in idea or ending as staging; the panel lettering as front text.
    - **Saved template:** the theme as staging, plus the caption.
  - **`ptTextContext`:** builds the context from the writer brief.
    - Only `fact` details join `facts`. New `labelledDetails`, `frontText` and `cardGuidance` keys are optional on `TextContext` (`bmc/engine.ts`).
    - The song switches still apply. With "mention the detail" off, the detail items are left out; with "use their name" off, anything carrying the name is left out.
  - **Relationship (rule 4):** a new optional "They're your…" field on the shared names step (`PtQuestion.tsx`) fills `shared.relationship`. "Your card so far" shows it as "Maya (sister)" (`PtSummary.tsx`).
  - **Genres (rule 3):** a proposal only, `PT-SONG-GENRES-PROPOSAL.md`.
- **Files:** `components/personalize/types.ts`, `ptPrompts.ts`, `PtQuestion.tsx`, `PtSummary.tsx`, and all four card files in `templates/`; `components/bmc/engine.ts`; `PERSONALIZE-BEDROCK-HANDOFF.md`; design system Components and governance v1.19.
- **Verified:**
  - `tsc` clean; ESLint clean.
  - Compiled check (`%TEMP%\pt-writer-brief-2ma3`) for each card, with the name and detail switches on and off. The labels, guidance and front text came out right. Switches off left out the detail items and anything with the name. The relationship came through.
  - In the browser (temp copy, mock mode):
    - The Horoscope names step shows the new field, and "sister" was saved on the brief and the draft record.
    - "Your card so far" shows "Maya (sister)".
    - No inner scroll at 1280×720 or 375×812, no sideways overflow on phones, and no console warnings.
- **Not covered:** the mock writers don't read the labels or guidance, so their effect shows only with the real models. On This Day and Comic Card weren't clicked through in the browser.

## Personalize: "Choose the sound" and a real song setup (2026-11-08)
- **Request (owner):** "Show the sound step" (option 1 of `PT-SONG-GENRES-PROPOSAL.md`). The proposed defaults were used as-is, and a card's own song theme is added to the preset, as recommended.
- **Built:**
  - **New required `songPreset` on every card:**
    - Horoscope: Dreamy → Piano Ballad, Playful → Pop, Heartfelt → Acoustic, written-in mood → Pop
    - On This Day: Jazz Swing
    - Comic Card: Pop Rock
    - Saved template: Pop
  - **The step:**
    - New shared question `PT_genre` (kind `genre`, in `sharedQuestions.ts`), placed after "Add a song?" on all four cards.
    - Build My Card's `GenreQuestion` is now exported and takes an optional `suggested`. Personalize passes the card's default with a reason ("Suits a playful Horoscope card.") and has it pre-selected.
    - "Your card so far" shows a Sound row.
  - **Lyrics:** sent with the chosen preset, or the card's default until the step is answered, instead of `""`.
  - **Song request:** `compileSongPrompt` now uses Build My Card's music prompt with the preset. It keeps the card's mood, includes the pronunciation only when the song may use the name, and adds a card theme line after the production prompt once one exists. The placeholder is retired.
  - **Versions:** `PT_PROMPT_VERSION` is `pt-prompts-2026-11-08c`. All four card versions bumped to `…-2026-11-08c`.
- **Bug fixed (Build My Card too):** for instrumental songs, `compileMusicPrompt` dropped every preset sentence mentioning voice. That removed the genre, BPM and metre sentence for Jazz Swing ("vocal jazz swing") and Acoustic ("singer-songwriter feel"). The first sentence now always stays, minus the word "vocal".
- **Files:** `components/bmc/BmcQuestion.tsx`, `components/bmc/compile.ts`; `components/personalize/types.ts`, `sharedQuestions.ts`, `PtQuestion.tsx`, `PtSummary.tsx`, `PtQuestionnaire.tsx`, `ptPrompts.ts`, and all four card files in `templates/`; the genre proposal (marked built); `PERSONALIZE-BEDROCK-HANDOFF.md`; design system Components and governance v1.20.
- **Verified:**
  - `tsc` clean; ESLint clean.
  - Compiled checks (`%TEMP%\pt-genre-check-P35U`):
    - Each mood maps to its preset.
    - A playful Horoscope gets the full Pop music prompt, with "Emotion and energy: playful" and the pronunciation.
    - Name off has no pronunciation.
    - The On This Day instrumental keeps its Jazz Swing line and has no lyrics.
    - Choosing Rap overrides the card's default.
    - All ten presets keep their BPM sentence for instrumentals.
  - In the browser (temp copy, mock mode), a Horoscope card (no photo, Playful, sung song):
    - "Choose the sound" appears with Pop pre-selected and gold.
    - Choosing Acoustic gave "Acoustic lyrics", a Sound row in "Your card so far" and the genre saved on the draft.
    - The only console warning was an existing one about a gallery image (`pt-comic-cover.jpg`), not from this work.
- **Not covered:** On This Day and Comic Card weren't clicked through; the step on a phone wasn't checked (it's the same component Build My Card already uses).

## Audit follow-up: unopened screens, production build, Cookie settings on sign-in, debug hooks (2026-11-09)
- **Request (owner, `NEXT-PROMPT-1-unopened-screens-build-cookie-debug.md`):** items 1, 4, 6 and 9 of the "what else" list. (1) Open and measure every screen the audit reviewed only in code. (4) Run a production build in a temp copy. (6) Add "Cookie settings" to the sign-in footer. (9) Remove or gate the DemoBalance debug hooks, and report any other `window.__…` hooks. Later the same session the owner approved four follow-ups: fix busy buttons everywhere, compact the two tall Settings pop-ups, add script words to the Settings dialog titles, and remove Delivery's hooks while gating the badge's.
- **Findings:** `SITE-AUDIT-2026-11-08.md` section 7 (F1–F12 fixed or noted, O1–O6 open).

### What changed
| Area | Change | Files |
|---|---|---|
| Task 6 | **"Cookie settings" in the sign-in footer** (`AuthFooter`, every sign-in screen), after Privacy, Terms and Help. It's styled exactly like those links: 12px Lato bold caps, cocoa, 44px tall, 10px padding, hover underline. **Bug found while testing (F8):** pressed without taking focus (Safari, or a scripted click), the banner stored `<body>` as its opener. The button now passes itself (`openCookieSettings(opener)`), and `<body>` is never stored. | `Auth.tsx`, `styles/auth.css`, `content/CookieConsent.tsx`, `lib/consent.ts` |
| Task 9 | **Debug hooks:** nothing in the repo, its QA scripts, `build-fixes/` or the temp scripts calls `__souvSetDemoBalance` / `__souvZeroDemoBalance` (only docs mention them). Removed with their `declare global`. The four exports nothing imports (`CartTopUpDelta`, `DEMO_BALANCE_STORAGE_KEY`, `ZERO_DEMO_BALANCE`, `DEFAULT_DEMO_BALANCE`) are no longer exported. **Also found:** Delivery's `__dlvSetCards` / `__dlvOpenCheckout` (nothing calls them) are removed, owner-approved, along with the write-only `cardBank` state and `useDemoBalance` call behind them. The Mock data badge's `__souvResetMockData` was set before its mock-mode check; it's now set only in mock mode. No `window.__` hooks are left outside BMC/PT except that one. | `DemoBalance.ts`, `Delivery.tsx`, `MockDataBadge.tsx`, `lib/mockDb.ts` (comment) |
| F1, F2 | **Busy buttons stay focusable:** `aria-disabled` instead of `disabled` while saving or sending, and a busy guard in each handler. A focused button that becomes `disabled` loses focus to `<body>` in Chrome; this was seen on Delivery's "Confirm payment" and Settings' "Save changes". Covers Delivery's main button, Personal info, Change password, Payment methods, Saved recipients, the Preferences select (`aria-busy`), the two-step Turn on, `ConfirmDialog`, Delete account, Contact, Community send, and every sign-in submit, "Resend code" and "Resend reset code". `disabled` stays for "can't yet" states (DELETE not typed, Terms not accepted, password already changed) and for Cancel while saving. Busy look: opacity 0.7, progress cursor, no hover lift. | `Delivery.tsx`, `settings/*.tsx`, `content/ConfirmDialog.tsx`, `content/ContactForm.tsx`, `community/CommunitySendDialog.tsx`, `Auth.tsx`, `styles/checkout-flow.css`, `styles/auth.css` |
| F3 | **Log In "Back to email and password":** clears the code step's message and error, and focuses the password field (it fell to `<body>`, with "That code didn't match" left on screen). | `Auth.tsx` |
| F4–F7 | **Field errors and focus:** the two-step code and "Last four digits" show their error on the field and focus it. A saved recipient's invalid field is focused. Recipients' Cancel goes back to "Add a recipient". Payment methods' Edit and Cancel focus the form heading. Delete account focuses its field after a failure, so the B6 message is read. | `settings/SignInSecurity.tsx`, `PaymentMethods.tsx`, `SavedRecipients.tsx`, `DeleteAccount.tsx` |
| F9 | **Compact two-step setup and Delete account pop-ups** (owner): 640px wide. Two-step: the QR code floats beside its line and the key (164px box from 600px, 132px on phones); on phones, Cancel and Turn on share a row. Delete: "What's removed" and "What's kept" side by side from 600px, tighter on phones. Same content and order. | `settings/SignInSecurity.tsx` (step 1 class), `settings/DeleteAccount.tsx` (two group wrappers), `styles/content-pages.css` |
| F10 | **Script words in dialog titles** (owner): Turn on two-step *sign-in*, Turn off two-step *sign-in*?, Sign out of *all devices*?, Delete your *account*?, Delete *{name}*?, Remove *this card*? (the card is now named in the line below), and Saved Cards' Delete *"{title}"*?. | `settings/SignInSecurity.tsx`, `DeleteAccount.tsx`, `SavedRecipients.tsx`, `PaymentMethods.tsx`, `MyCards.tsx` |
| F11 | Busy labels "..." → "…" (five on Delivery, five on the sign-in screens). | `Delivery.tsx`, `Auth.tsx` |
| Docs | Components 2.23 (two-step dialog, and the stale "15-month" note now reads 12), 2.24 (Cookie settings in two footers, the opener), 2.28 (the busy-button rule, more focus targets, field errors), new 2.31 (compact pop-ups with measurements, script-word titles, debug hooks). Governance: the cookie row in the scope table, and v1.21. Audit: §5 status, §6, new §7. | `design-system/docs/02-components.md`, `06-governance.md`, `SITE-AUDIT-2026-11-08.md` |

- **Backups:** `%TEMP%\souv-p1audit-work-225407\backup\` (before the first edits) and `backup2\` (before the owner-approved round, taken after the first round's edits). The edit scripts are beside them.
- **Local only (don't commit):** a `frontend-p1audit-copy` entry in `.claude/launch.json` (port 3180, temp copy `%TEMP%\souv-p1audit-copy-225407`). The original is backed up as `%TEMP%\souv-p1audit-work-225407\launch.backup.json`.

### Task 4: production build
- Built in a separate copy (`%TEMP%\souv-p1build-230123`, node_modules junction), never in `frontend/`. Run three times: before the fixes, after the first round, and with every change. **All three: exit 0, compiled with no errors and no warnings; lint and types passed; 36 static pages.**
- **Routes:** static: `/`, `/account/*`, `/cart`, `/community-cards`, `/contact`, `/create/*`, `/delivery/*`, `/faq`, `/forgot`, `/pricing`, `/recover`, `/verify/*`, `/my-cards`, `/welcome`, `/robots.txt`, `/sitemap.xml`, `/opengraph-image`. SSG: `/legal/[slug]` (4 pages). Dynamic: `/home`, `/login`, `/reset`, `/signup`, `/signup/terms`.
- **First-load JS (final build; shared 103 kB):** over about 200 kB are Personalize 259 kB, Build My Card 230, Saved Cards & Songs 214, Settings 211, `/home` 209, Cart 204 and Community Cards 202. Every other route is 186–199 kB, apart from the redirects and metadata routes at 103–104. Nothing was changed for size (audit O6).

### Verified (temp copy, mock mode)
- `tsc` clean; ESLint 0 problems app-wide; `npm test` 5/5; production build clean.
- **Task 6:** on `/login` the button's computed style matches the Privacy link (font, 12px, 700, 1.68px spacing, caps, colour, 44px, padding). First-visit Decline moved focus to the `h1`. Reopened: focus on the banner heading, "Your current choice: analytics declined." with Decline `aria-pressed`. Accept and Decline both returned focus to "Cookie settings", by keyboard and by a click that doesn't focus. Checked with real `requestAnimationFrame` and with it swapped for a 16ms timer. The landing footer's button still works. All seven sign-in screens are clean at 1280 and 375 (`/signup/terms` redirects without a sign-up, as designed); on phones "Cookie settings" wraps to its own centred line.
- **Task 1:** see audit §7, "Checked and fine". Each fix was re-tested in the browser: focus logs through Delivery's three steps, Personal info save and two-step on and off (the page visible), a wrong Log In password, Back to email and password, the invalid ZIP, last four and code fields, and Cancel/Edit focus.
- **Compact pop-ups:** two-step 653 / 653 / 649 / 718px and Delete 586 / 585 / 581 / 777px at the four sizes, so no overlay scroll; screenshots at 1280×720. Script words render in Lobster Two.
- Mock data for the copy's origin was reset at the end (the badge's reset), after tests changed the demo account's phone and saved card.

### Not covered
- Delete account's failure paths (F7) and the Safari opener case (F8): code, plus a scripted click that doesn't focus; no Safari run.
- The Log In code step was measured at 375×812 only.
- Screenshots were reviewed in the session; the preview tool doesn't save them to disk.
- Open items for the owner: audit §7 O1–O6 (focus after a page change, steppers disabled at their limit, uneven action buttons, sign-in code errors on the field, Community send titles, route sizes).
- Screen reader, reduced motion, high contrast, real devices.

## Audit follow-up, round 2: page focus, steppers, equal buttons, code field (2026-11-09)
- **Request (owner):** decisions on the open items in `SITE-AUDIT-2026-11-08.md` §7. O1: a shared rule on every page. O2: `aria-disabled` at the limit. O3: equal button widths. O4: mark the code field invalid. Not chosen: O5 (Community send script words) and O6 (bundle investigation).

| Item | Change | Files |
|---|---|---|
| O1 | New `RouteFocus` in the root layout. After a client-side page change (not first load), it focuses the new `main h1`, unless the page has already put focus inside `<main>` or in a dialog. It waits up to about 1s for the heading. | `components/RouteFocus.tsx` (new), `layout.tsx` |
| O2 | Cart's "−" at 1, Pricing's Big Sender "−" at its minimum and the landing gallery arrows at either end: `aria-disabled` plus a guard in the click handler, and the dimmed style extended to `[aria-disabled="true"]`. | `CartPage.tsx`, `pricing/PricingClient.tsx`, `landing/LandingGallery.tsx`, `styles/checkout-flow.css`, `styles/pricing.css`, `styles/landing.css` |
| O3 | Delivery's bar: from 600px the two buttons are a grid with equal columns. Contact's thank-you: full width on phones, side by side at one width from 600px. | `styles/checkout-flow.css`, `styles/content-pages.css` |
| O4 | Log In code step: a short or wrong code sets `aria-invalid` and the berry error outline on the field and focuses it. It clears on typing and on "Back to email and password". `totpRef` added to `handleTotp`'s dependencies (lint). | `Auth.tsx` |

- **Docs:** Components 2.28 (page-change focus, steppers, code field) and 2.31 (equal buttons); governance v1.22; audit §7 (decisions).
- **Backups:** `%TEMP%\souv-p1audit-work-225407\backup3\`; edit script `edit-round3.js`.
- **Verified (temp copy, mock mode, page visible):**
  - **Checks:** `tsc` clean; ESLint 0 problems; `npm test` 5/5; production build clean, with route sizes unchanged (e.g. Settings 211 kB, Personalize 259 kB).
  - **O1:**
    - First load: focus stays on `<body>`.
    - Focus lands on the new `h1` after: the login redirect to `/create`, a nav link to `/pricing`, the menu to Saved Cards, "Print and send" to `/delivery`, `/create` to `/contact`, and client navigation to Build My Card ("Start with a photo", its own question heading) and Personalize.
    - `/home?welcome=1` keeps focus in the Welcome modal.
  - **O2:**
    - Pricing: at the 2-card minimum, "−" is `aria-disabled`, at 0.4 opacity, keeps focus, and a press does nothing.
    - Cart: a credit pack at qty 2 → "−" → 1, focus kept, 0.35 opacity, and a press at 1 does nothing.
    - Gallery: "Previous" keeps focus at the start. Its `aria-disabled` updates after the smooth scroll settles, as before.
  - **O3:** Delivery's buttons are 235×52 both at 1280 and at 768, with no overflow. Contact's thank-you buttons are 295×56 stacked at 375, and 280×56 side by side at 1280, inside the card.
  - **O4:** an empty code and a wrong code (123456) both give `aria-invalid="true"`, a #9E3D58 outline and focus on the field, with the alert line kept. Typing clears it. 246810 signs in to `/create`, with focus on its `h1`.
  - The copy's mock data was reset afterwards (two-step had been turned on for the test).
- **Not covered:**
  - Community Cards' row arrows (`personalize/PtScrollRow.tsx`, a Personalize file: needs owner approval).
  - Browser back/forward navigation with `RouteFocus`: it uses the same path change, but wasn't clicked through.
  - Screen reader and real devices.

## Scroll-row arrows keep focus at the edge (2026-11-09)
- **Request (owner):** "Yes, fix arrows". This is audit O2's last part, in the shared Personalize row component (approved because it's a Personalize file).
- **What changed:**
  - `personalize/PtScrollRow.tsx`, used by Community Cards and Personalize's gallery: at the edge, the arrows use `aria-disabled` (not `disabled`) and a press does nothing. An edge arrow leaves the tab order, as before, unless it's the one with focus, so focus never drops to `<body>`.
  - `personalize.css` and `community-cards.css`: the fade-out also applies to `[aria-disabled="true"]`. A keyboard-focused arrow at the edge stays visible at 0.4 opacity.
- **Files:** `components/personalize/PtScrollRow.tsx`, `styles/personalize.css`, `styles/community-cards.css`. Docs: Components 2.28, governance v1.22 row, audit §7. Backups: `%TEMP%\souv-p1audit-work-225407\backup4\`.
- **Verified (temp copy, 1280×720):**
  - `tsc` clean; ESLint 0 problems; production build clean, with sizes unchanged (Community Cards 202 kB, Personalize 259 kB).
  - Community Cards' occasion row: at the start the back arrow is `aria-disabled`, out of the tab order and invisible. Two forward presses reached the end, and focus stayed on the forward arrow. A press at the end did nothing. After focus moved, the edge arrow left the tab order.
  - Same on Personalize's gallery row.
- **Not covered:** the pane didn't have window focus, so focus events didn't fire. The "stays in the tab order while focused" state and the 0.4 keyboard look were checked in code, not seen. Real keyboard use should be checked once.

## Prompt 3 written (2026-11-09)
- New `NEXT-PROMPT-3-build-my-card-and-personalize-full-audit.md`: applies the site audit, Prompt 1 and Prompt 2 to Build My Card and Personalize a Template, now in scope, including the owner's latest UX changes and new questions. It covers finding every change, walking every path at four sizes, colour, logo, layout, credits and idempotent Create, accessibility (keyboard, reduced motion, high contrast, hover and focus, busy buttons), prompt versions and the code-as-source-of-truth rule, code hygiene and the two largest route bundles. It reports first, then fixes after approval.
- Prompt only; no app code changed.

## Prompt 2: reports and checklists, nothing in the app changed yet (2026-11-09)
- **Request (owner):** `NEXT-PROMPT-2-accessibility-phones-address-launch-performance.md`, Parts A–F. Each part reports first and waits for approval.
- **New documents:**
  - `PROMPT-2-REPORT-2026-11-09.md`:
    - Part A: accessibility findings A1–A7 and what passed.
    - Part B: phone pop-up measurements and proposed layouts.
    - Part C: the address-lines proposal.
    - Part E: Lighthouse, SEO, headers, images and CSS findings E1–E13.
    - The decisions needed.
  - `LAUNCH-READINESS.md` (Part D): 75 items, each with an owner, where it's recorded and a status, plus "Before merging to main".
  - `DEVICE-AND-SCREEN-READER-CHECKLIST.md` (Part F, and the screen-reader checklist from Part A).
- **Local only (don't commit):** new `.claude/launch.json` entry `frontend-p2-prod`, which runs `next start` on the Prompt 1 build copy on port 3190. Lighthouse 12 is installed in `%TEMP%\souv-p2-lighthouse-*`; its reports are in `reports/`.
- **How it was checked:**
  - Scripted semantics and focus-ring probes (signed in and out, 1280 and 375).
  - Keyboard checks of the menu, popover, FAQ and dialogs.
  - Reduced motion emulated by copying the `@media` rules into a live sheet; hover checked with test classes (test page only).
  - Lighthouse: 14 runs.
  - Live `curl` of status codes and headers.
  - A read-only code review of SEO, headers, images and CSS by a helper agent.
- **Not covered:** a real screen reader, real forced-colours rendering, real devices (now on the checklists), and BMC/PT beyond page-level checks.

## Prompts re-split: 1B added, Prompt 2 widened, Prompt 3 superseded (2026-11-09)
- **Request (owner):** put Build My Card and Personalize through Prompts 1 and 2 instead of a separate Prompt 3.
- **New `NEXT-PROMPT-1B-build-my-card-and-personalize.md`:** Prompt 1's checks on the two flows. Task 0 finds every change, including the owner's latest UX changes and new questions. Task 1 opens and measures every step, state and dialog at four sizes, including Create at 0 credits, double presses and Review. Task 4 runs a production build. Task 9 looks for debug hooks inside the flows. Task 6 doesn't apply.
- **`NEXT-PROMPT-2-...md` widened:** runs after 1B. The flows are in scope in every part: keyboard paths, the flows' dialogs and sheets on phones (Part B), Lighthouse and a bundle analysis for the two largest routes (Part E), and flow items on the real-device checklist (Part F). It lists the shared files to ask about and keeps the code-is-source-of-truth rule. Backup of the old version: `%TEMP%\souv-audit-20261108\NEXT-PROMPT-2.backup.md`.
- **`NEXT-PROMPT-3-...md`:** marked superseded at the top and kept for reference.
- Prompts only; no app code changed.

## Prompt 2 built: accessibility, phone pop-ups, address lines, page weight, SEO, headers (2026-11-09)
- **Request (owner):** after `PROMPT-2-REPORT-2026-11-09.md`, the owner approved:
  - **Part A:** A1, A2, A3, A4 and A5.
  - **Part B:** the recommended layouts.
  - **Part C:** as proposed.
  - **Part E:** E1, E2, E3, and E4–E11.

### What changed
| Item | Change | Files |
|---|---|---|
| A1, A2 | **High contrast (forced colours):** the selected country, tier and Delivery chips get a 3px `Highlight` outline. FlowDialogs, the Top up pop-up, the cookie banner and nav menus get a `CanvasText` edge. | `pricing.css`, `checkout-flow.css`, `cookie-consent.css`, `landing.css` |
| A3 | **No change needed (report corrected):** `/create`'s option cards already draw a 3px `--sv-focus` ring around both card panels (`opened-card.css:60-61`); the probe had only read the card element itself. | — |
| A4 | Nav links: a space between the two stacked lines and no `aria-label`, so the name matches the visible text. Lighthouse's "label-content-name-mismatch" for the nav is fixed; the gallery flip buttons are left as they are (polish). | `Navbar.tsx` |
| A5 | Reduced motion: the nav underline appears without growing. **Report corrected:** the music button, footer social buttons and landing steps don't actually move with reduced motion (no transform on hover, or already gated), so they're unchanged. | `landing.css` |
| B | **Phone pop-ups on one screen:**<br>• Top up cards: an `aria-pressed` "Print and Send / Big Sender" switch shows one offer below 600px.<br>• Credits: compact pack rows.<br>• Checkout: below 700px the summary closes behind a 52px "Order summary · total +" bar (`aria-expanded`), and the form takes the 600px spacing.<br>• **Also fixed:** at 768 the Big Sender quantity row wrapped its label to four lines and pushed the total 29px past the card. It's now two rows below 1024px. | `pricing/TopUpModal.tsx`, `Checkout.tsx`, `pricing.css`, `checkout-flow.css` |
| C | **Separate address lines:**<br>• `PostalAddress` gains `firstName`, `lastName`, `title`, `company`, `line2` and `line3`, all optional, so older orders still read.<br>• `dlvPostalAddress` maps each field separately.<br>• The mock fulfilment payload adds `scribeless.data`, one exact Scribeless recipient per copy, built by `scribelessRecipient()`. It reads the stored record defensively: older orders split `name` and leave `address2` and `address3` empty.<br>• The handoff has a field-mapping table. | `lib/api.ts`, `components/Delivery.tsx`, `lib/mockApi.ts`, `DEVELOPER_HANDOFF.md` |
| E1 | **No Google Fonts `@import`** (Outfit and Lobster, render-blocking, sent visitors' IPs to Google before consent). The `--font-*` tokens point at the self-hosted Lato and Lobster Two, whose variables are now set on `<html>`. | `styles/colors_and_type.css`, `layout.tsx` |
| E2 | **Security headers:**<br>• CSP in report-only mode (self, the API, Cognito user pool and domain; data/blob images; `frame-ancestors 'self'`).<br>• nosniff, `strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, Permissions-Policy and COOP.<br>• HSTS in production only (no preload).<br>• `poweredByHeader: false`.<br>• `upgrade-insecure-requests` is left out until the CSP is enforced: in report-only mode browsers ignore it and log a console error, which cost 4 points of Lighthouse best practices.<br>**Changed during the check:** `DENY` became `SAMEORIGIN` / `'self'`, because DENY also blocked the site framing its own pages, which the QA tools rely on. Other sites still can't frame it. | `next.config.mjs` |
| E3 | `auth.css`, `opened-card.css`, `bmc.css` and `cardart.css` leave the root layout. They're imported by `Auth.tsx`, `create/page.tsx` (opened-card), `BmcShared.tsx` and `CardArt.tsx`. | `layout.tsx`, `create/page.tsx`, `Auth.tsx`, `BmcShared.tsx`, `CardArt.tsx`, `opened-card.css` (comment) |
| E4 | Hero `sizes`: `(min-width: 1200px) 288px, (min-width: 960px) 24vw, (min-width: 414px) 240px, 58vw`. The back face also has `priority`: the card turns, and Lighthouse once measured the lazy back face as the largest image (mobile LCP 5.2s). | `landing/HeroCard.tsx` |
| E5 | `pt-comic-cover.jpg` / `pt-comic-back.jpg`: 766 / 743 kB at 1488×2096 → 246 / 250 kB at 800×1127. The originals are in `frontend/asset-originals/` (not served). AVIF is enabled. | `public/assets/`, `asset-originals/`, `next.config.mjs` |
| E6 | Community Cards: the first row's first four images (and the public examples' first four) load with `priority`. | `community/CommunityGallery.tsx` |
| E7 | `SITE_URL` comes from `NEXT_PUBLIC_SITE_URL` (default `https://souvenote.com`), and only that origin is indexable. Otherwise robots.txt says `Disallow: /` and responses carry `X-Robots-Tag: noindex, nofollow`. | `lib/site.ts`, `robots.ts`, `next.config.mjs` |
| E8 | **Structured data:**<br>• The FAQPage is on `/faq` only, escaped like the others.<br>• The landing page has Organization (`logo` → `/icon.png`, `sameAs` from the footer's social links) and WebSite.<br>• Pricing: the printed card is a `Product` (brand, image, url) with Print and Send and Big Sender offers for Canada (CAD) and the US (USD). The credit packs stay in an `OfferCatalog`.<br>• Not added: `hasMerchantReturnPolicy` (needs the refund category confirmed) and `shippingDetails`. | `page.tsx`, `faq/page.tsx`, `pricing/pricingContent.ts` |
| E9 | App icons: `app/icon.png` (512) and `app/apple-icon.png` (180), the gold-and-silver mark on forest. | `app/icon.png`, `app/apple-icon.png` |
| E10 | The share image is a static `app/opengraph-image.jpg` (103 kB, from the 850 kB PNG), with `opengraph-image.alt.txt`. `app/opengraph-image.tsx` moved to `asset-originals/opengraph-image.tsx.retired` (governance "Retired files"). `SHARE_IMAGE.url` is `/opengraph-image.jpg`. | `app/`, `lib/site.ts` |
| E11 | **Small SEO fixes:**<br>• `/my-cards` is a 308.<br>• `og:url` on `/faq`, `/contact`, `/community-cards` and `/legal/*`.<br>• robots.txt has no `Host:` line.<br>• The sitemap has `lastModified`. | `my-cards/page.tsx`, those pages, `robots.ts`, `sitemap.ts` |
| Docs | Foundations 1.2 (self-hosted fonts), Components 2.32 (new), governance v1.23 and "Retired files" (two rows). `LAUNCH-READINESS.md` rows 1.7, 3.9, 9.2 and 10.5. | `design-system/docs/*`, `LAUNCH-READINESS.md` |

- **Backups:** `%TEMP%\souv-p1audit-work-225407\backup-p2\` (plus `seo/`). Edit scripts are beside them (`edit-e1.js`, `edit-e3.js`, `edit-parta.js`, `edit-partb.js`, `edit-partc.js`, `edit-seo.js`, `edit-img.js`, `images.cjs`).
- **Not done (not chosen):**
  - Pricing's `hasMerchantReturnPolicy` and `shippingDetails` (the `Product` itself is built).
  - A6 (carousel arrow keys).
  - E12 (legacy JS) and E13 (retiring unused assets).
  - Community send titles (O5).
  - CSP enforcement and nonces.

### Verified
- **Checks:** `tsc` clean, ESLint 0 problems, `npm test` 5/5. Production build clean (exit 0, no warnings); route sizes unchanged (e.g. `/` 192 kB, Settings 212, Personalize 259).
- **E3 proof (computed-style fingerprint, 24 targets × 1280 and 375):**
  - Baseline versus after: **0 differences on 46 of 48 captures.** The other two are Saved Cards & Songs, whose element count differs (the list was caught mid-load); the two baselines differ the same way.
  - The 1280 baseline was retaken because the pane's pixel ratio changed between the first two runs; every element's width shifted with it.
  - Delivery's error-modal styles: confirmed loaded on `/delivery` (rules present), and absent from `/faq`.
- **E1 proof (corrected the same day):** after versus E3, the fingerprint differs on the two page wrappers (font-family only, no text of their own), the dev-only Mock data badge, and one Personalize rail dot.
  - **Not a font change:** the rail dot doesn't change with the old tokens restored, and two fresh loads match, so that one difference wasn't caused by E1. The earlier note that "a rail number now renders in Lato" was wrong.
  - **Text scan, 25 pages at 1280:** every fingerprint target plus the signed-out landing, with each page's visible text compared under the new and the old tokens. The only visible text whose font changed is the Mock data badge.
  - **Delivery's error pop-up** (`BmcErrorModal`, styled by `bmc.css`, attached to `<body>`) did use Outfit and now uses Lato: title 800, body 400 and the "Got it" button 700. Checked by building its markup on `/delivery`, with screenshots in both fonts; same layout, slightly different letter shapes.
  - **Card-art thumbnails:** `cardart.css` text would also change, but nothing adds that kind of item to the cart any more.
  - **Found along the way:** the error pop-up still uses the old dark theme (black card, rose pill).
- **Part B (fixed-size frames):**

  | Pop-up | 1280×720 | 1024×768 | 768×1024 | 375×812 |
  |---|---|---|---|---|
  | Top up cards | 678 | 689 | 709 | 727 / 768 (Big Sender) |
  | Top up credits | 602 | 626 | 620 | 745 |
  | Checkout | 639 | 639 | 650 | 777 (summary closed) |

  - All labelled and described, with no overlay scroll. The 768 spill is gone.
  - Screenshots at 375 of credits, Big Sender and checkout.
  - The switch's `aria-pressed` and focus work; the summary bar's `aria-expanded` opens and closes the lines.
- **Part C:** Linda Wilson from the picker, plus "Ms", "Wilson & Co", "Unit 3" and "Rear entrance", through Continue to checkout → Confirm payment → Send to print → "On its way".
  - The stored order keeps every field separately (and the transitional `recipientAddress` matches).
  - The fulfilment payload has `scribeless.data[0]` with `address1`–`3`, `state: NS`, `country: CA` and `variables.company` / `title` / `externalId`.
  - The older seeded order (`line1` only) is unchanged.
- **E2, E7, E10, E11 (live `curl` against the dev copy and the production build):**
  - All headers are present, there's no `X-Powered-By`, and HSTS is only on the production build.
  - robots.txt allows crawling and lists the sitemap, with no `Host:` line.
  - `/my-cards` returns 308.
  - `/opengraph-image.jpg` is a 103 kB JPEG.
  - The icons are linked (512 and 180), and `og:url` is on `/faq`.
- **A4:** the nav link names read "Personalize a Template", "Build My Card" and "Community Cards", with no `aria-label`; still two lines.
- **Structured data:** the `/pricing` Product offers match the visible prices: $9.99 CAD / $7.99 USD, Big Sender $6.99–8.99 CAD / $4.99–6.99 USD, credits $2 / $10 / $25 CAD and $1.50 / $8 / $20 USD.
- **Lighthouse:** see the next entry.

### Not covered
- Forced colours can't be rendered in the pane: A1/A2 are checked in CSS only.
- The staging path of E7 (`NEXT_PUBLIC_SITE_URL` set to another origin) was checked in code only; it needs a build with that variable.
- The fallback for older orders inside `scribelessRecipient` (split `name`) was checked in code only.
- CSP reports weren't collected (report-only and no endpoint).
- Real devices and a screen reader (see `DEVICE-AND-SCREEN-READER-CHECKLIST.md`).
- Local only (don't commit): the `frontend-p2-prod` launch entry.

### Lighthouse 12, before → after (production build, `next start`, signed out)
| Run | Performance | Accessibility | Best practices | SEO | LCP | FCP |
|---|---|---|---|---|---|---|
| desktop /cart | 98 → 98 | 100 → 100 | 100 → 100 | 66 → 66 | 1.0 s → 1.2 s | 0.9 s → 0.4 s |
| desktop /community-cards | 98 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 0.9 s → 0.7 s | 0.8 s → 0.4 s |
| desktop /create | 99 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 0.8 s → 0.6 s | 0.6 s → 0.4 s |
| desktop /faq | 98 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 0.9 s → 0.7 s | 0.9 s → 0.4 s |
| desktop /home | 99 → 99 | 100 → 100 | 100 → 100 | 100 → 100 | 0.9 s → 0.8 s | 0.7 s → 0.5 s |
| desktop /pricing | 98 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 0.9 s → 0.7 s | 0.9 s → 0.4 s |
| desktop / | 98 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 0.9 s → 0.8 s | 0.9 s → 0.4 s |
| mobile /cart | 79 → 83 | 100 → 100 | 100 → 100 | 66 → 66 | 4.3 s → 4.5 s | 3.2 s → 1.7 s |
| mobile /community-cards | 82 → 89 | 100 → 100 | 100 → 100 | 100 → 100 | 3.8 s → 3.7 s | 3.1 s → 1.7 s |
| mobile /create | 85 → 91 | 100 → 100 | 100 → 100 | 100 → 100 | 3.9 s → 3.5 s | 2.3 s → 1.7 s |
| mobile /faq | 82 → 89 | 100 → 100 | 100 → 100 | 100 → 100 | 3.8 s → 3.6 s | 3.3 s → 1.8 s |
| mobile /home | 83 → 89 | 100 → 100 | 100 → 100 | 100 → 100 | 4.2 s → 3.6 s | 2.3 s → 1.8 s |
| mobile /pricing | 84 → 91 | 100 → 100 | 100 → 100 | 100 → 100 | 3.6 s → 3.5 s | 3.0 s → 1.5 s |
| mobile / | 83 → 89 | 100 → 100 | 100 → 100 | 100 → 100 | 3.8 s → 3.7 s | 3.0 s → 1.7 s |

- **First paint on mobile** is about 1.5s faster everywhere, from dropping the Google Fonts chain.
- **Scores:**
  - Best practices went 100 → 96 on a middle run (the report-only `upgrade-insecure-requests` error), and back to 100 once that directive was removed.
  - `/cart` SEO stays 66 because it's deliberately noindex.
  - The nav "label-content-name-mismatch" failures are gone.
- **Signed out:** `/home` and `/create` redirect to `/`.
- **Reports:** `reports-before/`, `reports-mid/` and `reports/` in `%TEMP%\souv-p2-lighthouse-*`.

## Prompt 2 follow-ups: error pop-up, carousel arrow keys, Community titles, retired files (2026-11-09)
- **Request (owner, answered one question at a time):**
  1. Rebuild Delivery's error pop-up.
  2. Do all four smaller items.
  3. The CSP blocks at launch.
  4. Check the Refund Policy before adding a return policy to the structured data.
- **Correction:** I'd said a Personalize rail number changed font. It didn't. A text scan of 25 pages, with the old tokens restored, showed the only visible text that changed font was the dev Mock data badge, plus Delivery's error pop-up (see "Prompt 2 built…", E1 proof).

| Item | Change | Files |
|---|---|---|
| Error pop-up | **Delivery's error pop-up** ("Address needed", "Card not ready", "Checkout didn't start", "Payment not confirmed", "Checkout needed", "Couldn't send to print") moves from the old dark look (black card, rose pill, Outfit, then Lato) onto `FlowDialog`.<br>• **Look:** ivory, berry stripe, light Lato title, cocoa message, one forest "Got it" (focused on open).<br>• **Behaviour:** `alertdialog`, labelled and described, Tab kept inside, Escape and × close it, focus returns to the button that was pressed.<br>• Build My Card and Personalize don't use it (checked: they never call `bmcError`).<br>• `bmc.css` is now unused, so it's retired. | `components/BmcShared.tsx`, `layout.tsx` (comment) |
| A6 | **Carousel arrow keys** (`/create` and the Welcome pop-up, below 1100px): with a card focused, Left/Right move focus and the centre to the previous or next card, wrapping round. Other keys are left alone. | `components/useCardCarousel.ts` |
| O5 | **Community Cards titles:**<br>• "Send *{card name}*".<br>• "Log in to send *this card*", with the name moved into the line below ("Sending "Golden Year", and the full Community Cards collection, is for Souvenote accounts.").<br>• "Log in to see *every card*". | `community/CommunitySendDialog.tsx` |
| E12 | **Tried, then reverted.** A `browserslist` (Safari/iOS 15+, Chrome/Edge 92+, Firefox 90+) left the shared chunks byte-identical (same hashes). Lighthouse's ~11 kB "legacy JavaScript" is inside Next's prebuilt framework chunk, which `browserslist` doesn't affect. `package.json` was restored from its backup. | — |
| E13 | **Retired files** (governance table, nothing deleted): `bmc.css`, `bmc-fathers-day-card.jpg` (499 kB), `hero-card-moon.jpg` (166 kB), `LogoMark.png` and `WordmarkLobster.png` (used only by hidden CSS-mask rules in `site.css`), and the dead selectors `.pt-shell`, `.pt-page`, `.auth-eyebrow`, `.auth-hide-phone`, `.auth-method-kicker` plus the mask and shimmer rules. | `design-system/docs/06-governance.md` |
| CSP | **Owner decision: it blocks at launch.** Until then it stays report-only. Before launch: add the Stripe, PostHog and asset origins; have the backend collect the reports; check them; then enforce (with `upgrade-insecure-requests` back in). No nonces. | `LAUNCH-READINESS.md` 10.5 |

- **Backups:** `%TEMP%\souv-p1audit-work-225407\backup-p2\` (`BmcShared.round4.tsx`, `useCardCarousel.ts`, `CommunitySendDialog.round4.tsx`, `package.json`).

### Verified
- **Checks:** `tsc` clean, ESLint 0 problems, `npm test` 5/5. Production build clean (exit 0, no warnings).
- **Error pop-up (opened on `/delivery` through its `bmc-error` event):**
  - `alertdialog`, labelled "Address needed" and described by its message.
  - Focus starts on "Got it", and Tab wraps both ways.
  - Escape returns focus to the pressed button (`Multiple`).
  - Ivory `#FFFAF3`, berry stripe `#9E3D58`, Lato 300 / 400 / 700.
  - 319 / 319 / 315 / 291px tall at the four sizes, with no scrolling or clipping. Screenshot at 1280×720.
- **Arrow keys:**
  - At 768 on `/create`: Right 0→1, Right wraps 1→0, Left 0→1. Focus, centre and dots move together, and ArrowDown isn't taken.
  - The Welcome pop-up: Right 0→1→2→0, and Escape still closes it.
- **Titles:** "Send *Something Borrowed, Something New*" renders with the script span.

### Then decided and built (owner, the same day)
- **Refunds → structured data: free shipping only.**
  - Each card offer in the `/pricing` Product has `shippingDetails`: $0 in its own currency to its own country.
  - No `hasMerchantReturnPolicy` until the lawyer approves the Refund Policy. The draft maps to "returns not accepted" (personalised, mailed straight to the recipient; damaged, misprinted or lost cards are replaced or refunded, with nothing sent back).
  - File: `components/pricing/pricingContent.ts`.
- **Community send pop-up, long names:**
  - **The owner's first pick, rejected after measuring:** "title under the picture" measured 838px for the longest name and 806px for short ones, worse than before. The owner then chose the alternative.
  - **Phones (under 720px):** Cancel and "Send this card" share one row, 146×52 each.
  - **720px and up:** the pop-up's title is 2rem, so the "Send" prefix doesn't push long names onto a second line (it had made the pop-up 708px tall at 1280×720).
  - **Measured, longest / short name:** 1280×720 653 / 653; 1024×768 653 / 653; 768×1024 720 / 678; 375×812 747 / 684. No inner scroll.
  - File: `styles/community-cards.css`.
- **Final checks:** `tsc` clean, ESLint 0 problems, tests 5/5, production build clean (exit 0, no warnings), and the build copy matches `frontend/`.

### Found earlier in this entry (now fixed, see above)
- **Community send pop-up on phones, long card names:**
  - At 375×812 the pop-up is 836px for "Something Borrowed, Something New", over the 780 available. It was already 827px before the script word. Short names fit (748px for "Golden Year").
  - **Cause:** the narrow text column beside the 72px card picture. A smaller title alone gets it only to 823px.
- **Structured-data return policy:** waiting for the owner's answer on how the Refund Policy maps.

### Not covered
- Lighthouse wasn't re-run (the only change since the last run was this small pop-up and the titles).
- Real keyboards and screen readers (see the checklist).

## No small label beside or around a heading (2026-11-09)
- **Removed:**
  - "Personalizing" above the template name on Personalize a Template (questions and review share this header; `PtQuestionnaire.tsx`).
  - The "N of 3 approved" count beside "Look it over" in the Build My Card review header (`BmcReviewStage.tsx`). Each panel's status pill still shows Approved.
  - The phone section markers ("Part 1 of 3 · Front") in Build My Card questions (accessory wearers, song/QR) and Review. The `SectionMark` component is removed from `bmc/ui.tsx`. The "Next: …" buttons and section headings still name the section.
- **Design system:** Foundations 1.2 rule widened ("No small label beside or around a heading"); Components review heading and phone-sections notes updated; governance v1.25.
- **Left in place:** pop-up eyebrows (the stated exception); the Delivery keepsake line, which is that section's own title; the unused `.bmcq-review-count` and `.bmcq-section-mark` CSS rules.
- **Verified:** `tsc` and ESLint clean. In the temp copy (`%TEMP%\souv-noeyebrow-xgyVxn`, port 3160), signed in (mock Google), Personalize a Template > Horoscope shows "Horoscope · Choose a different template" with no "Personalizing". Not opened in the browser: the Build My Card review, which needs a finished card; the change there is the removal of one element.

## Visual style options match the other questions (2026-11-09)
- **Problem:** on desktop, Build My Card "Choose a visual style" squeezed 17 tiles six across (106px each). "Watercolor", "Storybook" and "3D / Claymation" spilled outside their boxes, and "Artistic / Painted" and "Fantasy / Magical" wrapped to three lines.
- **Fix:** the question now uses the standard pill chips, like Occasion and Finish (`columns="chips"` in `BmcQuestion.tsx`), keeping each style's colour swatch. The `.is-style` tile overrides in `bmc-questionnaire.css` are removed.
- **Design system:** Components 2.17 single-choice rule: chips for short-label lists, tiles only for options with a sub-line or picture, never tiles squeezed to fit; governance v1.26.
- **Verified:** `tsc` and ESLint clean. Temp copy (port 3160), signed in, walked to the style question. At 1280×800 the 17 chips sit in five rows inside the card. At 768 every chip is 48px tall with none overflowing; selecting "3D / Claymation" works. At 375 the chips wrap one or two per row, as Occasion does.

## Prompt 1B: Prompt 1's checks on Build My Card and Personalize a Template (2026-11-09)
- **Request (owner, `NEXT-PROMPT-1B-build-my-card-and-personalize.md`):**
  - Task 0: list everything that changed in the two flows since 2026-11-08 21:50.
  - Task 1: open and measure every step, state and dialog at 1280×720, 1024×768, 768×1024 and 375×812.
  - Task 4: production build.
  - Task 9: debug hooks.
  - Fix clear bugs in scope; ask before anything bigger.
- **Findings:** `SITE-AUDIT-2026-11-08.md` §8. There are 12 fixed items (F-1 to F-12), 11 decisions for the owner (D1 to D11) and notes.

### Task 0
- Diffed every file in both flows against a copy of `frontend/` taken at 21:21 on 11-08 (`%TEMP%\souv-tsc-copy-212120`). The 2026-11-09 changes were also diffed against `%TEMP%\souv-p1audit-copy-225407` (22:54).
- **Every change is already in this changelog.** That covers:
  - the Build My Card writers;
  - redraft steering;
  - "the code is the source of truth" header comments;
  - the Personalize `writerBrief` and the "They're your…" field;
  - "Choose the sound";
  - the scroll-row arrows;
  - "No small label beside or around a heading";
  - the visual-style chips.
- Nothing in either flow is unlogged. `questionBank.ts` and `catalogue.ts` are unchanged since 21:21. `lib/api.ts` changed only for Prompt 2's address lines.

### What changed
| # | Change | Files |
|---|---|---|
| F-1 | **Busy buttons stay focusable (2.28) in both flows.** They get `aria-disabled` plus a guard instead of `disabled`: the action bar's Continue and Create, the AI writer, Rewrite (lyrics), "Suggest a caption", Personalize's "Suggest more" and "Rewrite storyboard", the lighter-stories checkbox, "Send idea", and Review's Try again, Approve and AI writer (`StackButton` `busy`). Out-of-tries states and "Choose photos" at the limit use `aria-disabled` too. The caption's Suggest button stays on screen while it works. Busy look: opacity 0.7, progress cursor, no hover lift. | `bmc/ui.tsx`, `bmc/BmcQuestion.tsx`, `bmc/BmcReviewStage.tsx`, `personalize/PtQuestion.tsx`, `personalize/PtSuggestBox.tsx`, `styles/bmc-questionnaire.css`, `styles/bmc-polish.css` |
| F-2 | **Focus when a control goes away:** "Describe them instead" focuses its box, and Back returns to the link. Removing a photo moves to the next remove button, or to Choose photos (new `useFocusAfterRemove`, both flows). "Print this one" moves to Approve message. "Rewrite them" and "Refresh it" hand focus back (`useRefocusAfterBusy`). | `bmc/ui.tsx`, `bmc/BmcQuestion.tsx`, `bmc/BmcReviewStage.tsx`, `personalize/PtQuestion.tsx` |
| F-3 | **Personalize view changes:** opening a card from the gallery, "Choose a different template" and browser Back focus the new view's heading. All three fell to `<body>`. The first only showed in a production build, because React Strict Mode in development ran the questionnaire's focus effect twice. | `PersonalizeTemplateClient.tsx` |
| F-4 | **No focus jump on first load.** A saved draft opening on a later question or on Review moved focus to its heading. Both questionnaires now use `useFocusOnChange`, keyed only after the draft loads and safe under Strict Mode. On Review the key stays put. | `bmc/ui.tsx`, `bmc/BmcQuestionnaire.tsx`, `personalize/PtQuestionnaire.tsx` |
| F-5 | **Phone sections are announced again.** The visible "Part N of M" went on 2026-11-09, so nothing was read on Next. Now a hidden polite line reads "Part 2 of 3: Who wears the crown?" (wearers, song and QR code). Review's Previous and Next focus the new card's heading; they had dropped focus at the last and first card. | `bmc/ui.tsx` (`SectionAnnounce`), `bmc/BmcQuestion.tsx`, `bmc/BmcReviewStage.tsx` |
| F-6 | "Top up to create your card" fits a phone: 851 → 664px at 375×812 (the overlay scrolled). CSS only; `TopUpChoiceDialog.tsx` is unchanged. | `styles/bmc-dialogs.css` |
| F-7 | "Your card so far" at 1024–1279px: each answer sits under its label. Answers were 53px wide and cut to a few letters ("Decor…"); now 139px. | `styles/bmc-polish.css` |
| F-8 | Photo step with photos added: the drop zone shrinks to one row. Build My Card 740 → 720px and Personalize 770 → 720px at 1280×720. | `styles/bmc-polish.css` |
| F-9 | Personalize header on one line: "On This Day · Choose a different template" had wrapped at 1280 (the rail is 690px wide), adding 38px to every On This Day and Comic Card step. The name is now 1.75rem from 1024px. | `styles/personalize.css` |
| F-10 | "What should change?" on desktop: the quick picks and the words share one row. The message step is 941 → 879px, still over (D1). | `styles/bmc-polish.css` |
| F-11 | On This Day lead stories sit two across from 1024px, with tighter cards: 1021 → 877px, still over (D4). | `styles/personalize.css` |
| F-12 | Review's lyrics editor (474px of lyrics in a 263px box) and the lyrics step's editor grow with the lyrics. The phone "Your card so far" sheets are now described as well as labelled. | `bmc/BmcReviewStage.tsx`, `bmc/BmcQuestion.tsx`, `bmc/BmcSummary.tsx`, `personalize/PtSummary.tsx` |
| Docs | Components 2.18 (sheet description) and 2.19 (phone sections: the hidden announcement, and the message and attestation no longer split), new 2.33; governance v1.27; audit §5 status and new §8. | `design-system/docs/02-components.md`, `06-governance.md`, `SITE-AUDIT-2026-11-08.md` |

- **Shared files (Prompt 1B list):** none changed.
  - `flow/FlowDialog.tsx`, `FlowField.tsx`, `TopUpChoiceDialog.tsx`, `personalize/PtScrollRow.tsx`, `CartPage.tsx`, `lib/api.ts`, `lib/mockApi.ts`, `landing.css`, `layout.tsx` and `RouteFocus.tsx` are untouched.
  - The top-up fix is in `bmc-dialogs.css`.
- **Backups:** `%TEMP%\souv-p1b-work-114339\backup\` (every file before its first edit). The edit scripts are beside it.
- **Local only (don't commit):** two new `.claude/launch.json` entries.
  - `frontend-p1b-copy`: port 3200, temp copy `%TEMP%\souv-p1b-copy-114339`. Its `lib/mockMode.ts` has a test-only slow-mock multiplier.
  - `frontend-p1b-prod`: port 3210, `next start` on the build copy.
  - The original file is backed up as `launch.backup.json` in the work folder.

### Task 4: production build
- Built in a separate fresh copy (`%TEMP%\souv-p1b-build-130834`, with a node_modules junction), never in `frontend/`.
- **Result:** exit 0, compiled with no errors and no warnings; lint and types passed; 38 static pages.
- **First-load JS:** Build My Card 230 kB (unchanged) and Personalize 260 kB (was 259, +1 kB). The extra kilobyte is the new focus helpers and the view-change focus. Shared JS is 103 kB.
- Other routes are as before (Settings 212, Saved Cards & Songs 213, `/home` 210, Cart 205, Community Cards 203).

### Task 9: debug hooks
- Searched `components/bmc/`, `components/personalize/`, `lib/mockInterview.ts`, `lib/mockPersonalize.ts`, both clients and both `page.tsx` files for:
  - `window.__…`, `globalThis.__…` and `declare global`;
  - console calls, `debugger` and `data-testid`.
- **None found.** Nothing to remove or gate.
- The only hook left in the app is the Mock data badge's `__souvResetMockData`, which is set only in mock mode (Prompt 1).
- `FlowDialog`'s `screenLabel` (`data-screen-label`) is an attribute for the QA screenshot tool, not a global; it's kept.

### Verified (temp copy, mock mode)
- **Checks:** `tsc` clean; ESLint clean on `components/bmc`, `components/personalize` and `PersonalizeTemplateClient.tsx`; production build clean.
- **Every step at four sizes:** a walker iframe pressed only real action-bar buttons, and each step was measured at all four sizes. Results are in audit §8. Paths:
  - **Build My Card:**
    - the photo path, with the rights pop-up and the main-photo step;
    - Decorate with all nine options, Custom opened in accents, accessories, border, colour, stickers, pattern, sparkle, vibes, finish, style and occasion;
    - Transform; Enhance; "Describe them instead" with the hair, style and signature follow-ups;
    - every message state; sung, instrumental and no song; the genre with "Suggested"; lyrics, a rewrite and the out-of-date notice;
    - Create at 0 credits, then cards, pay and back to the draft; Create with credits, triple-pressed (charged once); a reload during Create (nothing charged, Create offered, the retry charged once);
    - Review's decision buttons, the spend pop-up, "Approve all three", Delivery and "Back to review", and a paid Try again at 0 credits, then credits, pay and back to `#review`.
  - **Personalize:**
    - the gallery signed in and out (no credits pop-up at 0 credits);
    - search, a chip, no results and "Suggest 'zzqqx'";
    - Horoscope, On This Day, Comic Card, and the saved "Father's Day Comic" from Saved Cards & Songs, each to Review.
- **Each fix re-tested in the browser:**
  - Focus stays on Try again through "Use 1 credit", on the AI writer and Rewrite through a draft, on Suggest through a suggestion, and on the lighter checkbox.
  - "Print this one" → Approve message.
  - Remove photo → next remove button → Choose photos.
  - Describe → textarea; Back → link.
  - Phone Review Next and Previous → card headings.
  - Gallery → card heading, "Choose a different template" → gallery heading, and browser Back → card heading.
  - A resumed draft and `#review` load with focus left alone.
  - **Repeated on the production build (`next start`), where Strict Mode doesn't run:** fresh load, open from the gallery, Continue and a resumed draft.
- **Dialogs:** every pop-up is labelled and described by elements that exist, Tab wraps both ways, Escape closes and returns focus, and the title has a script word. That covers rights, cards-or-credits, spend, "Approve all three", sign-up and the phone sheet (now described). "Making your card" can't be closed while working. The full list is in audit §8.

### Not covered
- Real Bedrock, fal and Lyria calls (all mocked); a printed QR scan; a screen reader; real devices; Safari.
- **Screenshots** were checked in the session (main photo, accents, the message step, "Your card so far" at 1024, the lead stories, On This Day Review), but the preview tool can't save them to disk.
- **"Making your card" was measured at 1280 only** (466px). It closes about a second after Create, even with the slowed mock.
- The phone "Approve all three" pop-up wasn't opened: on a phone the three Approve buttons sit on separate cards. It was measured at the three larger sizes.
- **Signed-out Build My Card** wasn't re-walked; signed-out Personalize was.
- **Pane quirks:** the pane was sometimes hidden, so `requestAnimationFrame` paused in the test iframes. It was swapped for a 16ms timer in the test page only. Focus results that depended on Chrome's focus fix-up were confirmed with the page visible, or by code.

## Prompt 1B decisions D1 and D2: message and lyrics steps on one screen (2026-11-09)
- **Request (owner):** "D1 + D2 (message, lyrics)". For D1, the recommended (a) + (b).
- **D1, the message step with an AI draft:**
  - The sign-off chips become one labelled select, "Sign-off" (same four choices), on the "What should change?" row. The hint and the select share the first line; the picks and the few words the second. Before the first draft, or with no tries left, the select is on its own row. A hidden description says it applies from the next draft.
  - The AI box is 4 rows on desktop and 6 on phones, and grows with its text (`field-sizing: content`), so a long draft never scrolls inside.
  - The character counter sits in the box's corner on desktop.
  - The redraft hint is 14px.
- **D2, the lyrics step:**
  - The rewrites-left line (with the singer's guide) moves into the lyrics header.
  - From 1280px the lyrics run in three columns, at line height 1.4.
  - With the out-of-date notice on desktop, the notice is compact and the "What should change?" instruction steps aside.
- **Files:** `components/bmc/BmcQuestion.tsx` (shared with Personalize), `styles/bmc-polish.css`. Docs: Components 2.17 and 2.33, governance v1.28, audit §8 (D1 and D2 marked done).
- **Verified (temp copy, both flows, the walker resized to each size):**

  | Step | Before | After (1280×720 / 1024×768) |
  |---|---|---|
  | Message, AI draft | 941 / 950px | 720 / 768 |
  | Lyrics | 802 / 800px | 720 / 768 |

  - **Message:**
    - Measured with a four-line draft in Personalize and Build My Card.
    - A 378-character draft grows the page without an inner scrollbar.
    - The counter stays inside the box.
    - Choosing "From Jo" then pressing AI writer signs the next draft "From Jo", and focus stays on the AI writer.
    - Phone: the select is 163×44, the box has 6 rows with no inner scroll, and there's no sideways scroll.
  - **Lyrics:**
    - The header is one line (44px).
    - After "Rewrite them" (longer lyrics) it's still 720 / 768.
  - `tsc` clean, ESLint 0 problems, tests 5/5.
  - **Production build in the temp copy:** exit 0, no warnings. Build My Card 230 kB and Personalize 260 kB, unchanged.
- **Not quite:** the out-of-date lyrics state is 742 / 773px with the longer mock lyrics. Real lyrics may be longer than the mock's 10 lines; three columns gives the most room.
- **Side effect while testing:** a Horoscope card was created in the temp copy's mock data (2 mock credits). The temp copy only.

## Prompt 1B decision D3: the Comic Card storyboard on one screen (2026-11-09)
- **Request (owner):** "D3 storyboard". The proposal was the four panels side by side on desktop and one panel per screen on phones.
- **Desktop: tried as proposed, then changed.**
  - Four columns measured 781px at 1280×720 and 838px at 1024×768, because each column is 162px wide in the card and panel 1 holds the customer's story.
  - So each panel is **one row** instead: the number, what happens, then bubble 1 and bubble 2. All four still show at once.
  - The boxes grow with their words, and the bubbles are one-line boxes that wrap. A line break in a bubble becomes a space.
  - Each bubble's word count sits in its corner.
  - "Rewrite storyboard" moves into the action bar on tablet and desktop.
- **Phones:** one panel per screen.
  - "Next: panel N" is blocked while that panel has no action or an over-long bubble.
  - A hidden "Part N of 4: Panel N" line is read on each change.
  - Back steps back a panel; the last screen has "Approve storyboard".
- **Tablet:** 2 × 2, as before, with a 3px sideways spill fixed (`minmax(0, 1fr)` columns).
- **Files:** `components/personalize/PtQuestion.tsx` (`StoryboardQuestion`), `styles/personalize.css`. Docs: Components 2.20 and 2.33, governance v1.29, audit §8 (D3 done).
- **Verified (temp copy; fresh loads at each size):**

  | Size | Before | After |
  |---|---|---|
  | 1280×720 | 1385px | 720px |
  | 1024×768 | 1434px | 768px |

  - **No box scrolls inside** at any size.
  - **Validation:** an over-long bubble shows "Keep it to about 8 words…" and blocks Approve (the page grows to 775px while the error shows); fixing it unblocks Approve.
  - **Long text:** a 300-character first panel grows the page to 793px with Continue on screen.
  - **Focus:** "Rewrite storyboard" in the bar keeps focus through the rewrite.
  - **Phone:** the flow was walked from panel 1 to 4: an empty panel blocks Next, focus stays on the bar button, Back works, and Approve moves on to "Choose a comic style".
  - **Checks:** `tsc` clean, ESLint 0 problems, tests 5/5. Production build in the temp copy: exit 0, no warnings; Build My Card 230 kB and Personalize 260 kB, unchanged.
- **Note for checking:** in the test pane, a page loaded at one size didn't switch between phone and desktop layouts when the frame was resized, because media-query events wait for rendering while the pane is hidden. Every size was therefore measured on a fresh load.

## Prompt 1B decisions D4 and D5: On This Day and the front words on one screen (2026-11-09)
- **Request (owner):** "D4 and D5", answered with the recommended options:
  - D4: three stories, then "Show more".
  - D5: a "Check the spelling (N)" disclosure, the same on "Ready to create".
- **D4 ("Pick the lead story", "Write the headline"):**
  - Three stories show first; the chosen one always shows. "Show N more stories" reveals the rest and moves focus to the first one revealed. Mock research returns three stories, or five with "Also show lighter or neutral stories".
  - **Three across from 1024px.** I found that three cards two across were already 877px, so the count alone didn't fix it.
  - The research note and the lighter-stories checkbox share a line on desktop (new `pt-stories-foot` wrapper).
  - Suggestion cards (headlines and every Personalize suggestion step) are tighter on desktop.
- **D5:**
  - New `FrontWords` (`bmc/ui.tsx`): a closed `<details>`, "Check the spelling (N)", listing every printed line from `writerBrief().frontText`.
  - Shown on Review (new optional `frontWords` prop on `BmcReviewStage`) and on "Ready to create", for all four cards.
  - The "Front words: …" and "N bubbles and captions… (check the spelling)" notes are removed from the four card files; "No words on the front" stays.
  - On Review the front picture gives up the room the disclosure needs (as it already did for the out-of-date notice).
- **Files:** `components/bmc/ui.tsx`, `components/bmc/BmcReviewStage.tsx`, `components/personalize/PtQuestion.tsx`, `PtQuestionnaire.tsx`, `types.ts`, `templates/onThisDay.ts`, `comicCard.ts`, `horoscope.ts`, `savedTemplate.ts`, `styles/bmc-polish.css`, `styles/personalize.css`. Docs: Components 2.20 and 2.33, governance v1.30, audit §8 (D4 and D5 done; D7 and D11 updated).
- **Verified (temp copy, mock mode):**

  | Step (On This Day) | Before (1280 / 1024) | After |
  |---|---|---|
  | Pick the lead story | 1021 / 1029 (877 / 925 after F-11) | 720 / 768 |
  | Write the headline | 763 / 781 | 720 / 768 |
  | Ready to create | 789 / – | 720 / 768 |
  | Review | 819 / 916 | 720 / 768 |

  - **Other cards' Review:** Comic Card ("Check the spelling (6)") and Horoscope ("(1)") are 720 / 768, so Horoscope at 1024, part of D7, is fixed too.
  - **Show more:** with five stories it reveals two, and focus lands on "A city sets a new record…".
  - **The disclosure:** opening it lists all four On This Day lines in quotes, keeps focus on the summary, and lengthens the page as expected.
  - **Front:** 214×300 on Review at 1280.
  - `tsc` clean, ESLint 0 problems, tests 5/5.
  - **Production build in the temp copy:** exit 0, no warnings. Build My Card 231 kB (+1, the shared `FrontWords` lives in `bmc/ui.tsx`); Personalize 260 kB.
- **Not covered:** Personalize Review on phones still has the first card's buttons below the fold (D7, phone half). The saved template's Review wasn't re-opened; it uses the same rule as Horoscope.

## Prompt 1B decision D6: the image-rights pop-up on phones (2026-11-09)
- **Request (owner):** "D6 rights pop-up". I built the option I'd listed first: sections, the promises, then the two ticks, keeping every word.
- **What changed (`components/bmc/BmcAttestationDialog.tsx`, shared by both flows; `styles/attestation.css`):**
  - **Under 600px there are two screens:**
    - **1, the promises:** the title, the intro and all five promises, with Cancel and "Next: confirm".
    - **2, confirm:** the photos waiting, the Terms and Privacy links, the two unticked checkboxes, the status line, and Back and "Agree & continue".
  - **Balancing the screens:** a first try kept the photos and links on screen 1, which made it 946px, so they moved to the confirm screen. The links now sit next to the tick that names them.
  - **Phone type:** the promises are 15px, the title 1.6rem, and the two buttons side by side.
  - **Focus and announcing:** Next and Back focus the title, and a hidden "Part N of 2" line is read. The intro is visually hidden on screen 2, so the dialog's description still exists. Ticks survive Back and Next.
  - Larger screens are unchanged.
- **Wording:** the legal text and `ATTESTATION_VERSION` are unchanged; only the phone layout changed. For the lawyer's clickwrap review (LAUNCH-READINESS 6.4): on phones the promises and the ticks are now on consecutive screens.
- **Docs:** Components 2.18, 2.19 and 2.33; governance v1.31; audit §8 (D6 done).
- **Verified (temp copy, mock mode):**

  | Size | Before | After |
  |---|---|---|
  | 375×812, promises screen | 1344px, overlay scrolled | 712px, no scroll |
  | 375×812, confirm screen | (same pop-up) | 547px, no scroll |

  - **Dialog behaviour on phones:** labelled and described on both screens, Tab wraps on both, Next and Back focus the title, the ticks are kept, and Agree adds the photos and returns focus to "Choose photos".
  - **Personalize** (Comic Card photo step): the same 712 / 547px, and Agree adds the photo.
  - **Larger sizes unchanged:** 688 / 709 / 910px at 1280, 1024 and 768, everything on one screen. Tab wraps and Escape closes.
  - **Targets:** the buttons are 52px and the close button 44px. The inline links and the checkboxes inside their labels are the allowed exceptions.
  - **Checks:** `tsc` clean, ESLint 0 problems, tests 5/5. Production build in the temp copy: exit 0, no warnings; Build My Card 231 kB, Personalize 260 kB, unchanged.
- **Not covered:** a real phone and a screen reader. A screenshot caught the pop-up mid-fade (the page showed faintly); its computed opacity was 1 once the fade finished.

## Prompt 1B decision D7: Personalize Review on phones (2026-11-09)
- **Request (owner):** "D7 phone Review". The 1024 half was already fixed by D5.
- **What changed (`styles/personalize.css`, under 600px, Personalize only):**
  - **Template header:** one line ("On This Day · Choose a different template"); the name is 1.3rem and the link 14px, still 44px tall.
  - **"Look it over" header:** tighter, 10px 14px padding with a 15px lede.
  - **Front card:** 14px 16px padding, with the picture at 190px wide instead of 230px.
  - The one-line header also applies to the question steps on phones.
- **Docs:** Components 2.33, governance v1.32, audit §8 (D7 done).
- **Verified (fresh loads at 375×812; the first card's decision buttons, top to bottom):**

  | Card | Before | After |
  |---|---|---|
  | On This Day | 877–925px (below the fold) | 727–775 |
  | Comic Card | | 703–751 |
  | Horoscope | | 703–751 |
  | Saved template | | 670–718 |

  - **No overflow:** the header is 44px (46 for the saved template's longer name) and nothing is clipped. No sideways scroll.
  - **Build My Card unchanged:** its phone Review keeps a 230px front, with buttons at 755–803.
  - **Checks:** ESLint 0 problems. Production build in the temp copy: exit 0, no warnings; Build My Card 231 kB, Personalize 260 kB.
- **Not covered:** real phones; a very long saved-template name (it wraps by design).

## Prompt 1B decision D8: Review approvals are saved with the card (2026-11-09)
- **Request (owner):** "D8 approvals": save the approvals instead of asking for them again.
- **What changed:**
  - **New field:** `brief.control.approvals` = `{ front, message, song }` in `components/bmc/brief.ts`, default all null. Older drafts load it at its defaults through `mergeKnown`, so there's no schema bump.
  - **Storage:** both questionnaires (`bmc/BmcQuestionnaire.tsx`, `personalize/PtQuestionnaire.tsx`) read the approvals from the brief and write them back through `update` instead of keeping them as page state, so they're autosaved with the draft.
  - **Unchanged:** `BmcReviewStage` and the existing rules. An approval names the exact version (the front asset id, the printed message key, the song asset and lyrics version), and a new Create or a new version clears its approval.
- **Docs:** `BMC-BEDROCK-HANDOFF.md` (the field, for the backend); Components 2.33; governance v1.33; audit §8 (D8 done).
- **Verified (temp copy, mock mode):**
  - **Build My Card:**
    - Approving all three, then "Continue to delivery" and "Back to review", came back with all three approved and "Continue to delivery" in the header. The draft held `{"front":"a602b2…","message":"ai:5:82","song":"54ace2…:3"}`.
    - A reload kept them.
    - Editing the message un-approved only the message.
    - A paid new front (15 → 14 credits) un-approved only the front.
  - **Personalize (On This Day):** approve all three, then Delivery, then "Back to review" kept all three.
  - **Checks:** `tsc` clean, ESLint 0 problems, tests 5/5. Production build in the temp copy: exit 0, no warnings; Build My Card 231 kB, Personalize 261 kB (+1, rounding).
- **Not covered:** the real backend storing `creative_brief` (mock only), and Delivery itself doesn't check approvals (it never did).

## Prompt 1B decision D9: what starts chosen (2026-11-09)
- **Request (owner):** "D9 radio defaults", answered "Safe defaults only".
- **What changed:**
  - `bmc/BmcQuestion.tsx`:
    - "Pick the card's shape" starts on Portrait.
    - "Choose the sound" starts on the top-ranked suggestion once suggestions arrive. It never replaces a pick, and if suggestions don't load nothing is chosen.
  - `personalize/PtQuestion.tsx`: "What goes in the song?" starts on "Yes, sing {name}" and "Yes, mention {detail}". A saved answer wins.
  - **Already chosen before this change:** Personalize's shape (the card's default) and genre (the card's preset), On This Day's recommended story, and the border colour (Automatic).
  - **Left empty on purpose** (costs a credit or changes meaning): song or no song, the blueprint, who's in the photos, photo or no photo, the caption choice, and the occasion, story type and mood.
- **Docs:** Components 2.17 (the rule and the exception) and 2.33; governance v1.34; audit §8 (D9 done).
- **Verified (temp copy):**
  - **Build My Card, new card:** the shape starts on Portrait with Continue ready.
  - **Build My Card, the sound:** it starts on Rap, the top suggestion (Pop, Rap and Disco & Funk were suggested), with Continue ready. Picking Pop moved the choice.
  - **Personalize (Comic Card):** "What goes in the song?" starts on "Yes, sing “Dad”" and "Yes, mention the comic", with Continue ready.
  - **Checks:** ESLint 0 problems, tests 5/5. Production build in the temp copy: exit 0, no warnings; Build My Card 231 kB, Personalize 261 kB.
- **Note:** another session added `components/community/communityGuidelines.ts` and changed `lib/api.ts`, `lib/mockApi.ts` and `lib/mockDb.ts` at 14:39–14:40. They aren't part of this work, and they weren't copied into the build copy for this check.

## Prompt 1B decision D10: top-up wording on a redo (2026-11-09)
- **Request (owner):** "D10 top-up wording".
- **What changed:**
  - **`components/flow/TopUpChoiceDialog.tsx`** (shared by the two flows only): `variant` is now `"create" | "redo"`. The redo wording:
    - **Title:** "Top up to make a new *version*" (the script word is "version").
    - **Cards option:** "…Make the new version now, then send your card."
    - **Note:** "Your card is saved. After you pay, you'll come straight back to your review."
    - The screen label says the same.
  - **Both questionnaires** pass `"redo"` when the choice came from Review (`topUpNeed.fromReview`). The return address was already `#review`.
- **Docs:** Components 2.18 and 2.33; governance v1.35; audit §8 (D10 done).
- **Verified (temp copy, 0 credits):**
  - **Build My Card and Personalize Review:** "Try again" opens "Top up to make a new version" with the redo lines. The pop-up is labelled with "version" as its script word. It's 638px at 1280×720 and 717px at 375×812, with no overlay scroll. Escape returns focus to "Try again".
  - **Create at 0 credits** (new Build My Card) still says "Top up to create your card … come straight back here to finish it".
  - **Checks:** ESLint 0 problems, tests 5/5. Production build in the temp copy: exit 0, no warnings; Build My Card 231 kB, Personalize 261 kB.

## Prompt 1B decision D11: accents with Custom at 1024 (2026-11-09)
- **Request (owner):** "Yes, fix D11". The "Ready to create" half was already fixed by D5.
- **What changed:** `styles/bmc-polish.css`, at 1024–1279px only: the accents step's controls gap is 12 → 8px and the Custom field is 44px tall (it was 54).
- **Verified (temp copy, a new Decorate card with Custom open and text typed):**

  | Size | Height | Custom field |
  |---|---|---|
  | 1024×768 | 776 → 768px | 44px, focused, Continue on screen |
  | 1280×720 | 720px | 54px, unchanged |
  | 768×1024, 375×812 | scrolling layouts, as before | 54px |

  - **Checks:** ESLint 0 problems, tests 5/5. Production build in the temp copy: exit 0, no warnings; Build My Card 231 kB, Personalize 261 kB.
- **Status:** with this, all eleven Prompt 1B owner decisions (D1–D11) are built. Audit §8.3 now says so.

## Prompt 2, second run: Build My Card and Personalize in Prompt 2's checks (2026-11-09)
- **Request (owner):** the widened `NEXT-PROMPT-2-…` (Parts A–F, with both flows in scope). Each part reports first and waits for approval.
- **Found at the start:** Prompt 2 had already run and been built today for the rest of the app, so this run covers what was left:
  - the two flows in Parts A, B, E and F;
  - short phones (375×667);
  - fresh Lighthouse numbers after Prompt 2's fixes;
  - the flows' items in Parts D and F.
- **New:** `PROMPT-2B-REPORT-2026-11-09.md` (findings A-F1 to A-F10, the Part B measurements and proposals B-1 to B-3, findings E-F1 to E-F9, and the decisions needed).
- **Documents updated (no app code changed):**
  - **`LAUNCH-READINESS.md`:**
    - new items 5.10 (don't trust browser-built prompts), 5.11 (song player check), 10.7 (phone layout shift) and 10.8 (mock code in the production bundle), plus a ninth "Before merging" gate;
    - refreshed rows 9.2, 9.5, 10.1, 10.3, and 10.5 (`SAMEORIGIN`, not `DENY`).
  - **`DEVICE-AND-SCREEN-READER-CHECKLIST.md`:** new Part 3 for the two flows, replacing the "out of scope" note.
  - **`SITE-AUDIT-2026-11-08.md`:** new §9.
- **Backups:** `%TEMP%\souv-p2b-work-145408\backup\` (the four documents before editing). The launch file backup is `%TEMP%\souv-p2b-launch.backup.json`.
- **Local only (don't commit):** new `.claude/launch.json` entries:
  - `frontend-p2b-copy`: port 3240, dev, `%TEMP%\souv-p2b-copy-145408`;
  - `frontend-p2b-prod`: port 3250, `next start` on `%TEMP%\souv-p2b-build-145408`.
  - The bundle analyser is installed in `%TEMP%\souv-p2b-analyzer` (not in `frontend/`). A third build with mock mode off is in `%TEMP%\souv-p2b-build-nomock-145408`.
- **How it was checked:**
  - **Scripted probes along one full path per flow at 1280×720:** headings, landmarks, names, Tab order, radio groups and arrow keys, live regions, alt text, and focus rings matched against every focus rule.
  - **Every pop-up and sheet at 375×812 and 375×667,** plus the signed-out sign-up pop-up.
  - **Reduced motion:** emulated by copying the `@media` rules into a live sheet.
  - **High contrast and hover:** read from the CSS.
  - **Builds:** two production builds (mock on and off) with the bundle analyser; both exit 0 with no warnings (Build My Card 232 kB, Personalize 261 kB).
  - **Lighthouse:** 18 runs.
  - **Live checks:** server HTML and headers read with `curl`.
- **Side effects in the temp copy only:** two test cards created, and the mock balance set to 0 and then 20.
- **Not covered:**
  - real Tab presses and `:focus-visible` in a focused window;
  - real forced colours;
  - a screen reader and real devices;
  - in this run: the lyrics step, Transform, Enhance and the storyboard (Prompt 1B walked them);
  - the Part C order (built and verified in Prompt 2; code re-checked only).

## Prompt 2 flows built: accessibility, short phones, layout shift, page weight (2026-11-09)
- **Request (owner):** "The recommended set" from `PROMPT-2B-REPORT-2026-11-09.md`.
- **Accessibility:**
  - **A-F1:** "Your card so far" is an `h2` around its toggle (`BmcSummary.tsx`, `PtSummary.tsx`).
  - **A-F2:** new `BusyAnnounce` in `bmc/ui.tsx`, used for the caption, the message and lyrics writers, Review's new front, message and song, and Personalize's suggestions and On This Day research (`BmcQuestion.tsx`, `BmcReviewStage.tsx`, `PtQuestion.tsx`). `Thinking` gains `announce={false}`.
  - **A-F3:** a forced-colours outline on the AI writer's on state.
  - **A-F4:** the Review toggles keep the visible word "Approve".
  - **A-F5:** 44px `::after` hit areas on the summary rows and links and on "Keep it as it is" (`is-hit`).
  - **A-F6:** the sign-off is a `<label for>`, with the hint outside it.
  - **A-F7:** photo alt text is "Photo N of M" (rights pop-up: "Photo N: file name").
  - **A-F8:** gallery tiles drop their `aria-label`.
  - **A-F9:** `PtScrollRow.tsx` (shared with Community Cards, flagged in the report): no hover glide and no smooth jump under reduced motion.
  - **A-F10:** berry hover on Review's secondary and done buttons, the top-up options and the summary rows; tiles lift 1px.
- **Short phones (B-1, B-2):** a `(max-width: 599px) and (max-height: 700px)` block in `bmc-dialogs.css` and `attestation.css`. Every word kept; `ATTESTATION_VERSION` and `TopUpChoiceDialog.tsx` unchanged.
- **Page:**
  - **E-F1:** `.souv-bmcq .bmcq-main { min-height: 100dvh }` (`bmc-questionnaire.css`).
  - **E-F3:** `QrSongCode.tsx` imports `qrcode` lazily, with a same-sized placeholder.
  - **E-F4:** new `personalize/PtCard.tsx` (loaded with `next/dynamic` by `PersonalizeTemplateClient.tsx`, prefetched after 1.5s) and `personalize/templates/ids.ts` (open ids, `SAVED_TEMPLATE_ID`, `PT_RETURN_PATH`). `templates/index.ts`, `savedTemplate.ts` and `PtQuestionnaire.tsx` re-export from it, with a development check that the ids match.
  - **E-F6:** the gallery head card has `sizes="150px"` and no priority.
- **Docs:** Components 2.17 (decision buttons) and new 2.34; governance v1.37; audit §9 outcome; `LAUNCH-READINESS.md` 9.5, 10.7 and 10.8; the report's Outcome section.
- **Other sessions:** the community-sharing session had edited `BmcQuestion.tsx` and `02-components.md` at 15:05–15:07. These changes were small edits on top of theirs; nothing of theirs was overwritten. `lib/api.ts` and `mockApi.ts` are untouched (E-F2 waits).
- **Backups:**
  - `%TEMP%\souv-p2b-work-145408\backup-fixes\` (`components/bmc`, `components/personalize`, both clients and `styles/` before the first edit);
  - `backup\` (the docs).
- **Verified:** see the report's Outcome table. Summary:
  - the short-phone pop-ups now fit 375×667, and 375×812 is unchanged;
  - mobile CLS 0.665 / 0.728 → 0, and mobile performance 64 / 56 → 87 / 89;
  - first-load JS 232 → 224 kB (Build My Card) and 261 → 205 kB (Personalize);
  - the one-screen heights still hold at 1280×720 and 1024×768;
  - `tsc`, ESLint and tests pass, and the production build exits 0 in the temp copy.
- **Not covered:**
  - forced `:hover` states, real forced colours, a screen reader, real devices and Safari;
  - full walks at 768×1024 and 375×812 (spot checks only).
- **Found:** Build My Card became a dynamic route through `?for=community` (another session); see the report's Outcome.

## Community Cards audit prompt written (2026-11-09)
- New `build-fixes/community-sharing-2026-11-09/COMMUNITY-CARDS-AUDIT-PROMPT.md`: an audit plan for Community Cards only.
  - It covers the gallery, tiles, Send, sign-in, Share and guidelines pop-ups, the "Build a card for the Community" band, `?card=` links, community-mode Build My Card end to end, Community cards in Delivery and Saved Cards & Songs, the guidelines and Terms §5/§6, share-link previews, SEO and performance.
  - It runs against the same standards as the site audit and Prompts 1, 1B and 2, reports first and waits for approval.
- Not added to the community-sharing changelog, because another session was editing it. Prompt only; no app code changed.

## Prompt 2 flows E-F2: mock code out of every page (2026-11-09)
- **Request (owner):** done once the community-sharing session finished ("finished").
- **What changed:**
  - **`lib/api.ts`:** the three static mock imports became `loadMock()`, `loadMockInterview()` and `loadMockPersonalize()` (`import()`). All 41 mock calls are `(await loadMock()).…`, and every caller was already async. This is the pattern `cognitoAuth.ts` already used for `mockCognito`.
  - **`components/MockDataBadge.tsx`:** now only a gate that loads the new `components/MockDataPanel.tsx` (the old badge body, unchanged) with `next/dynamic` when `MOCK_MODE` is on. `layout.tsx` is unchanged.
  - **New `lib/mockDemo.ts`:** the demo login, the code hint and the two-step code and secret moved out of `mockMode.ts`. `mockDb.ts`, `mockCognito.ts` and `MockDataPanel.tsx` import them from there. `mockMode.ts` keeps `MOCK_MODE` and `mockDelay`.
- **Result (production builds in the temp copies):**
  - **Shared chunk:** the chunk every page loads went 42.9 → 12.9 kB gzipped (mock mode on) and 42.4 → 12.5 kB (off).
  - **First load:** `/` 192 → 162 kB, Pricing 162, FAQ 157, Cart 176, Community Cards 171, Build My Card 224 → 213, Personalize 205 → 185.
  - **With mock mode off:** no page's first load contains the mock modules, the seed data, the demo login or the fixed codes (checked against `app-build-manifest.json` and the prerendered HTML).
  - **Left as built:** they're still emitted as four lazy chunks that load only in mock mode. Leaving them out of a production build entirely would need a build-time swap; not done.
- **Verified (dev temp copy, mock mode):**
  - credits load;
  - the Build My Card interviewer filled "Mike", "dad" and "Jo";
  - On This Day research returned three stories, with "3 stories found." read;
  - the Mock data panel opens and shows the demo login;
  - a fresh demo sign-in reaches `/create` with 20 credits.
  - `tsc`, ESLint and tests (5/5) pass; both production builds exit 0 with no warnings.
- **Also checked:** the short-phone rights pop-up after another session removed every eyebrow (17:48–17:54). It's 595px at 375×667, and the title clears the close button. That session had already updated the short-phone block in `bmc-dialogs.css`.
- **Backups:** `%TEMP%\souv-p2b-work-145408\backup-ef2\` (`api.ts`, `MockDataBadge.tsx`, `mockMode.ts`, `mockCognito.ts`, `mockDb.ts` and these four documents before editing).
- **Not covered:** every mock route one by one. Sign-in, credits, the BMC interviewer and Personalize research were exercised; cart, checkout and delivery use the same `loadMock()` path but weren't re-walked in this step.
