# Prompt 2, second run: Build My Card and Personalize a Template

Date: 2026-11-09. Branch `mock-data-mode`. **Report only: nothing in the app has changed.** Each part waits for the owner's approval.

**Why a second run:** Prompt 2 (`PROMPT-2-REPORT-2026-11-09.md`) already ran today on the rest of the app, and its approved fixes are built. That covers A1–A6, the 375×812 pop-ups, Part C and E1–E11. Prompt 1B then covered the two flows (F-1 to F-12, D1 to D11). This run adds what Prompt 2 left out: the two flows in Parts A, B, E and F, short phones (375×667) in Part B, fresh Lighthouse numbers after Prompt 2's fixes, and the flows' items in Parts D and F.

**Where it was checked:**
- **Dev copy:** `%TEMP%\souv-p2b-copy-145408` (port 3240, local-only launch entry `frontend-p2b-copy`), taken at 14:54.
- **Production build:** a second fresh copy, `%TEMP%\souv-p2b-build-145408` (`next start` on port 3250, launch entry `frontend-p2b-prod`), built with the bundle analyser.
- **Production build with mock mode off:** a third copy, `%TEMP%\souv-p2b-build-nomock-145408`, built with `NEXT_PUBLIC_MOCK_MODE=0`, for the bundle check only.
- **Lighthouse 12:** the copy from Prompt 2 (`%TEMP%\souv-p2-lighthouse-080515`). Reports are in `%TEMP%\souv-p2b-lh`.
- **Not in `frontend/`:** no build was run there.
- **Another session:** a community-sharing session was editing Community Cards, `lib/api.ts`, `lib/mockApi.ts`, `lib/mockDb.ts` and `legalDocs.ts` at 14:39–14:48. Nothing here touches them.

---

## Part A: accessibility in the two flows

### How it was checked
- **Build My Card, one full path at 1280×720:** photo → rights pop-up → the moment → names → shape → blueprint (Decorate) → decorations (border, border colour, vibe) → words on the front ("Suggest a caption") → "Your front, at a glance" → the message (AI writer, the quick picks, the few-words field, the sign-off) → song (sung, then genre) → Ready → Create → Review (the decision buttons, Approve, the spend pop-up, cards-or-credits at 0 credits).
- **Personalize, Horoscope to "Ready to create" at 1280×720:** the gallery (search, chips, rows, suggestion band), details, "Add a photo?", the symbol, the occasion, the story, the feeling, words on the front, the message, song, genre and Ready, then Create at 0 credits.
- **At 375×812 and 375×667:** every pop-up and sheet (Part B), and the signed-out sign-up pop-up.
- **At every step, a script recorded:**
  - headings, heading skips and landmarks;
  - unnamed controls, positive tabindex and the Tab order (from the DOM, which matches Tab when nothing uses a positive tabindex);
  - `aria-pressed`, `aria-current`, radio groups and their single Tab stop;
  - live regions, image alt text and exposed SVGs.
- **Focus rings:** every focusable element was matched against every `:focus` / `:focus-visible` rule in the loaded stylesheets. The pane has no window focus, so `:focus-visible` can't be triggered by script.
- **Arrow keys:** tried on the shape radio group (Right moves the choice and focus, Left moves back).
- **Reduced motion:** every `prefers-reduced-motion: reduce` block was copied into a live sheet, then running animations were listed (gallery, a template's questions, dialogs).
- **High contrast and hover:** read from the CSS. Forced colours can't be emulated in the pane.

### Passed
- **Headings:** one `h1` per step, and the step title takes focus on Continue.
- **Landmarks:** banner, "Main" navigation, "Build My Card progress" navigation, main, the "Your card so far" complementary region, and contentinfo.
- **Names:** every control has a name, and no positive tabindex is used. The only nameless input is the hidden file input, which is opened by "Choose photos".
- **Radio cards:**
  - shape, blueprint, border style, border colour, song and genre each have one Tab stop;
  - each group is labelled ("Card shape", "Border style");
  - Right and Left move the choice.
- **Multi-select chips:** Decorate's "How should we decorate it?" and the vibes use `aria-pressed` in a labelled group.
- **Dialogs:** rights, spend ("Make a new front?"), cards-or-credits, "Making your card", sign-up and the sheet are labelled, described and `aria-modal`. The rights pop-up's status line ("Tick both boxes to continue.") is polite.
- **Busy states:** "Suggest a caption" and the AI writer keep focus, take `aria-disabled`, and show a polite "Finding the right words…" / "Writing your message…".
- **Focus rings:** 2px `--l-focus` on every focusable element in both flows and their pop-ups:
  - nav, skip link and footer through `.souv-landing :focus-visible`;
  - the flow's own buttons, options, chips, links, summary and rail;
  - dialog controls.
  The only button without a ring is the dev-only Mock data badge (A7, as before).
- **Reduced motion:** nothing keeps animating in either flow or their pop-ups.
  - Build My Card's `.souv-bmcq *` rule also covers Personalize (its root is `souv-bmcq souv-pt`).
  - The thinking dots stay still and visible.
  - The Personalize head card stops spinning.
  - The tile lift is removed.
- **High contrast:** selected options, chips, the chosen message version and the chosen On This Day story get a 3px `Highlight` outline. Dialogs have the A2 border.
- **Hover colours** come from tokens only (no raw colours), and none fails contrast.
- **Lighthouse accessibility:** 100 on both flows, mobile and desktop.

### Findings (ranked)
| # | Severity | Where / size | What's wrong | Proposed fix |
|---|---|---|---|---|
| A-F1 | Inconsistency | Both flows, "Your card so far" beside the questions; 1024 and up, and the tablet panel | **Heading skip:** as soon as there's an answer, the stage names (Photo, Basics, Image…) are `h3`s straight under the step's `h1`. The panel title "Your card so far" is a `<span>`. Prompt 1B's probe ran while the panel was empty, so it missed this. | Make the panel title an `h2` with the same look (`BmcSummary.tsx:149`, `PtSummary.tsx`). The phone sheet already has an `h2`. |
| A-F2 | Inconsistency | Both flows: AI writer, "Suggest a caption", lyrics Rewrite, Personalize's "Suggest more"; all sizes | **The result isn't announced.** The "Writing your message…" status appears with its text already in it (some screen readers skip that), then disappears. When the draft or caption arrives, nothing is read, and focus stays on the button. | One polite region per questionnaire that is always in the page (like `SectionAnnounce`), saying "Writing your message…" and then "New draft ready" or "Caption suggested: Happy Birthday". Files: `bmc/ui.tsx`, `BmcQuestion.tsx`, `PtQuestion.tsx`, `PtSuggestBox.tsx`. |
| A-F3 | Bug (high contrast) | Message step, the AI writer button; all sizes | Its "on" state is only a gold glow (`box-shadow`), which forced colours removes, so you can't see that the AI box is open. `aria-pressed` is right. | Add `.bmcq-writer-switch.is-on` to the `forced-colors` outline rule (`bmc-polish.css`). |
| A-F4 | Inconsistency (owner decision) | Review's Approve buttons (both flows); all sizes | After pressing, the button reads **"Approved"** on screen, but its name stays "Approve front" (by design: Components 2.33, "a toggle keeps one accessible name"). That breaks WCAG 2.5.3 (label in name): a voice-control user who says "tap Approved" gets nothing. | **(a, recommended)** Keep the visible word "Approve" and show the state with the filled tick and the done look; the panel's pill already says "Approved". **(b)** Keep "Approved" and accept the mismatch. |
| A-F5 | Inconsistency (owner decision) | Both flows; mostly 1024 and up | **Targets under the design system's 44px rule** (WCAG AA's 24px is met):<br>• the summary's "Change" links (51×28) and stage rows (270×28);<br>• "Keep it as it is, framed with artwork" (32px);<br>• the vibe and occasion chips (40–47px);<br>• the border style and colour swatches (38px);<br>• Personalize's symbol suggestion (40px). | Raise the summary links, the stage rows and "Keep it as it is" to 44px; they sit in the side panel or under the options, so the one-screen heights don't change. Record the chips and swatches as an exception: raising them would undo D1–D11's one-screen fits. |
| A-F6 | Polish | Message step, "Sign-off" select; all sizes | The hidden hint "Used from the next AI draft…" sits inside the `<label>`. So it's likely read as part of the name and again as the description. | Move the hint out of the label (`BmcQuestion.tsx`). |
| A-F7 | Polish | Photo step, main-photo step, rights pop-up; both flows | Thumbnails use the **file name** as alt text ("IMG_4032.jpg"). | "Photo 1 of 3", with the file name only where the name helps (the rights pop-up's "photos waiting"). |
| A-F8 | Polish | Personalize gallery tiles; all sizes | Lighthouse "label-content-name-mismatch": the name is "Personalize Horoscope", but the visible text is "Horoscope … Personalize". | Drop the `aria-label`: the content already reads "Horoscope, Personalize" (`PtGallery.tsx:49`). |
| A-F9 | Polish | Personalize gallery rows and Community Cards; tablet and up | **Reduced motion:** the row arrows always scroll smoothly (`behavior: "smooth"`). | Use `auto` under reduced motion, as `PtSuggestBox` already does. **`PtScrollRow.tsx` is shared with Community Cards: ask first.** |
| A-F10 | Inconsistency | Hover, both flows | Hover doesn't follow "berry on ivory" (Foundations 1.2) here:<br>• Review's decision buttons and the cards-or-credits options turn **forest** on hover;<br>• the summary's stage rows turn plain text colour;<br>• Personalize tiles lift **3px** (Foundations 1.4 says 1px; the landing tiles' 6px is a documented exception). | Berry border on the decision buttons and options (`bmc-polish.css`, `bmc-dialogs.css`), berry text on the stage rows, and a 1px tile lift. Or record the tiles' lift as an exception in 2.20. |

**Notes, no change proposed:**
- **Duplicate names:** Review has two buttons named "Try again, 1 credit" (front and song). Each sits in a labelled group ("Front decisions", "Song decisions"), so the context is there.
- **Disabled Continue:** Personalize's "Tell us what happened" keeps Continue `disabled` until there's text. That matches the "can't yet" rule in 2.17.
- **Rail labels:** the rail steps are read in capitals ("PHOTO, DONE. CHANGE YOUR ANSWERS") because of `text-transform`. VoiceOver may spell very short all-capital words; check it on the device list.

**Not covered:**
- Real Tab key presses and `:focus-visible` in a focused window (Safari and Firefox included).
- On phones in this run: the keyboard path through the phone sections (Prompt 1B walked it).
- Not re-walked: the lyrics step, Transform, Enhance and the Comic Card storyboard (Prompt 1B walked them).
- Real forced-colours rendering, and a screen reader (checklist Part 3).

---

## Part B: pop-ups on phones, flows included, and short phones

### Measured (the pop-up's height; the overlay scrolls when it's taller than the screen minus the overlay's padding)
| Pop-up | 375×812 | 375×667 |
|---|---|---|
| Top up cards, Print and Send / Big Sender | 728 / 770, fits | **scrolls** (768 / 810 of 667) |
| Top up credits | fits (Prompt 2) | **745, scrolls** (785 of 667) |
| Checkout | fits (Prompt 2) | **777, scrolls** (809 of 667) |
| Top up to create your card (Build My Card and Personalize) | 664, fits | **664, scrolls** (696 of 667) |
| Top up to make a new version (a paid Try again at 0 credits) | 717, fits | **718, scrolls** (750 of 667) |
| Make a new front? (spend) | 443, fits | 443, fits |
| Rights pop-up, screen 1 (the promises) | 712, fits | **712, scrolls** (744 of 667) |
| Rights pop-up, screen 2 (confirm) | 548, fits | 548, fits |
| Save your card before step two (sign-up, signed out) | fits | 572, fits |
| Making your card | 466 (Prompt 1B, 1280) | fits at that height |
| Your card so far (bottom sheet) | 780 box, scrolls inside | 635 box, scrolls inside, fits |
| Approve all three | not shown on phones | not shown on phones |

- **Personalize** uses the same rights, spend, cards-or-credits and sheet components with the same sizes (the create choice and the sheet were measured in Personalize).
- **A correction, made while measuring:** the sheet first measured 24px below the screen. That was its slide-up animation, paused because the test pane was hidden. Measured again settled, it fits. It isn't a bug.

### Proposal
Everything at 375×812 fits. The open problem is short phones (iPhone SE and 8 class, 667px).

**B-1. The two "Top up to…" choices (recommended; CSS only in `bmc-dialogs.css`, only under `(max-width: 599px) and (max-height: 700px)`):**
```
┌──────────────────────────────── [×] ┐
│ ✦ Almost there                      │  ← eyebrow on the close button's row
│ Top up to make a new version        │  ← title 1.4rem
│ This uses 1 credit and you have 0.  │
│ ┌ Best value · Top up cards ──────┐ │  ← badge inline with the title
│ │ Every card includes printing …  │ │
│ │ [ Top up cards → ]              │ │
│ └─────────────────────────────────┘ │
│ ┌ Top up credits only ────────────┐ │
│ │ Credits for creating and …      │ │
│ └─────────────────────────────────┘ │
│ ✓ Your card is saved. After you …   │  ← 13px, one line shorter
│ [ Not now ]                         │
└─────────────────────────────────────┘
```
- **Estimate:** redo 718 → about 630px, create 664 → about 590px; both fit 667.
- **Unchanged:** every word, the options and the actions. `TopUpChoiceDialog.tsx` stays as it is.

**B-2. The rights pop-up's promises screen (recommended; CSS only, the same short-phone query, `attestation.css` / `bmc-dialogs.css`):**
- The eyebrow on the close button's row.
- Promises at 14px with a 1.4 line height and tighter gaps.
- **Estimate:** 712 → about 630px.
- **Wording:** unchanged, and `ATTESTATION_VERSION` unchanged.
- **Alternatives (not recommended):**
  - a third screen, which adds a step to a legal agreement;
  - the promises scrolling inside with the buttons pinned, which hides promises below a fold.

**B-3. Top up cards, Top up credits and Checkout on short phones (owner decision):**
- **(a, recommended) Accept a short scroll under 700px tall.** The 375×812 layouts already put each pack or summary on one screen. The scroll is 100–140px, and the buy and pay buttons are reached by scrolling.
- **(b) The same short-phone tightening** (a smaller head, tighter pack rows and card fields; `pricing.css` `.tu-overlay`, `checkout-flow.css` `.fd-checkout`). It saves about 80–100px, so Big Sender and Checkout would still scroll about 40px.
- **(c) (b) plus the Buy/Pay button pinned to the bottom.** This changes the pop-ups' pattern, so it needs a design-system entry.

Each would be re-measured at 1280×720, 1024×768, 768×1024, 375×812 and 375×667.

---

## Part C: separate address lines for Scribeless
- **Built and verified in Prompt 2** (CHANGELOG "Prompt 2 built…"): an order with three address lines and a company went through to "On its way". The stored order and the Scribeless payload were read back, along with an older `line1`-only order and the saved-recipient picker.
- **Code re-checked after the other session's 14:40 edits** to `lib/api.ts` and `mockApi.ts`:
  - `PostalAddress` still has `firstName`, `lastName`, `title`, `company` and `line1–3`;
  - `dlvPostalAddress` (`Delivery.tsx:83`) maps each field;
  - `scribelessRecipient()` still builds the payload;
  - the handoff's field table (`DEVELOPER_HANDOFF.md:585`) is in place.
- **Not re-walked** in this run. Nothing to decide.

---

## Part D: launch readiness
`LAUNCH-READINESS.md` is updated (documentation only).
- **New items:**
  - **5.10:** the backend must rebuild or check the image and music prompts instead of trusting the ones the browser built (see E-F7).
  - **5.11:** an accessibility check for the song player once real audio lands.
  - **10.7:** the flows' phone layout shift (E-F1).
  - **10.8:** mock code in the production bundle (E-F2).
  - **Before merging to main:** a ninth gate for 5.10 and 10.8.
- **Refreshed rows:**
  - 9.2: the launch entries list;
  - 9.5: the short-phone pop-ups;
  - 10.1 and 10.3: keyboard, reduced motion and high contrast partly done;
  - 10.5: the frame header is `SAMEORIGIN`, not `DENY`.

---

## Part E: performance, SEO and security headers

### Lighthouse 12 (fresh production build, mock mode, `next start`, signed out)
| Route | Mobile perf (Prompt 2 before) | Desktop perf | A11y | Best pr. | SEO | Mobile LCP / FCP / CLS |
|---|---|---|---|---|---|---|
| `/` | 82 (83) | 100 | 100/100 | 100/100 | 100 | 4.8 s / 1.7 s / 0 |
| `/home (→ / signed out)` | 94 (83) | 99 | 100/100 | 100/100 | 100 | 2.8 s / 2.0 s / 0 |
| `/pricing` | 91 (84) | 100 | 100/100 | 100/100 | 100 | 3.5 s / 1.5 s / 0.001 |
| `/community-cards` | 89 (82) | 100 | 100/100 | 100/100 | 100 | 3.7 s / 1.7 s / 0 |
| `/faq` | 89 (82) | 100 | 100/100 | 100/100 | 100 | 3.6 s / 1.8 s / 0 |
| `/cart` | 83 (79) | 98 | 100/100 | 100/100 | 66 | 4.6 s / 1.7 s / 0 |
| `/create (→ / signed out)` | 92 (85) | 99 | 100/100 | 100/100 | 100 | 3.3 s / 1.7 s / 0 |
| `/create/build-my-card` | 64 | 98 | 100/100 | 100/100 | 66 | 3.9 s / 1.7 s / 0.665 |
| `/create/personalize-a-template` | 56 | 99 | 100/100 | 100/100 | 66 | 5.2 s / 1.5 s / 0.728 |

- **Mobile performance is up on most routes since Prompt 2's fixes** (Google Fonts removed, route CSS moved, images): `/home` 83 → 94, `/pricing` 84 → 91, `/community-cards` and `/faq` 82 → 89, `/create` 85 → 92 and `/cart` 79 → 83. `/` is unchanged (82 vs 83). Its mobile LCP is the cookie banner's text, which is client-rendered, at 4.8s here. Single runs vary by a few points.
- **The two flows are the weak spot on phones:** 64 and 56, almost entirely the layout shift (E-F1). On desktop they score 98 and 99.
- **SEO 66** on `/cart` and the two flows is their `noindex` (on purpose; see E-F8).
- **Accessibility 100 and best practices 100** on all 18 runs.

### Bundle analysis (gzipped)
**What every page loads before its own code**, from `app/layout` (both builds):

| Chunk | Size | What's in it |
|---|---|---|
| `1587-…` | 42.9 kB | **Mock modules and Build My Card data:** `mockApi` 5.7, BMC `catalog` 5.6, `cognitoAuth` 5.5, `api` 4.9, `questionBank` 3.9, `mockInterview` 3.4, `engine` 2.6, `AuthProvider` 2.4, `brief` 2.4, `mockDb` 2.3, `mockPersonalize` 2.3, `prompts` 1.8, `lookDetails` 1.2 |
| `2550-…` | 27.2 kB | `amazon-cognito-identity-js` and its crypto and buffer helpers (needed for sign-in) |

- **With mock mode off** (`NEXT_PUBLIC_MOCK_MODE=0`), the same 42.4 kB chunk ships. The mocks are imported statically by `lib/api.ts`, so the `if (MOCK_MODE)` checks don't remove them.
- **Two side effects:**
  - Build My Card's prompts and catalogue go to every visitor on every page.
  - The demo e-mail and password strings ship through `mockMode.ts` (the badge itself renders nothing when mock mode is off).

**Route-only code** (on top of the shared chunks):

| | Build My Card | Personalize |
|---|---|---|
| Route-only total | 66.1 kB | 97.4 kB |
| `qrcode` library | 11.9 | 11.9 |
| `BmcQuestion` | 11.3 | 11.3 |
| `next/image` and helpers | 9.3 | 9.3 |
| Questionnaire, Review, `compile`, `ui` | 4.9 + 4.3 + 3.6 + 3.0 | 4.5 + 4.3 + 3.6 + 3.0 |
| Personalize only | – | `PtQuestion` 6.6, `catalogue` 5.3, the four card files 9.1, `sharedQuestions` 2.0, gallery, summary, prompts, brief, engine and suggest box about 8.5 |
| Dialogs (rights, Build My Card dialogs, top-up choice, `FlowDialog`) | about 4.6 | about 4.6 |

### Ranked findings
| # | Severity | What | Evidence | Proposed fix |
|---|---|---|---|---|
| E-F1 | Bug | **Phone layout shift in both flows:** Lighthouse mobile CLS **0.665** (Build My Card) and **0.728** (Personalize); "poor" starts at 0.25. The server HTML's `<main>` holds only "Build My Card" or "Opening templates…" (122 and 194 bytes), so the footer paints near the top and jumps down when the flow loads. It's the only shift that counts. | Lighthouse `layout-shifts` (`footer.souv-footer`); `curl` of the server HTML | Reserve the flow's height: `min-height: calc(100dvh - <nav height>)` on the flow's `main` (`bmc-questionnaire.css`, `personalize.css`), or a server-rendered skeleton of the step card. CSS is enough to keep the footer below the fold. Expected CLS about 0. |
| E-F2 | Should fix | **Mock and Build My Card code on every page** (about 32 kB gzipped, mock mode on or off; see above). | Bundle analysis of both builds | Load the mocks with `import()` only when `MOCK_MODE` is on (every mock call is already async). Build My Card's catalogue, question bank and engine then load only on its own route. Expected: every route about −25 to −32 kB (for example `/` 193 → about 163 kB). **`lib/api.ts` and `mockApi.ts` are shared, and another session is editing them today: ask first, and wait for that session.** |
| E-F3 | Should fix | **QR library on both flows' first load** (11.9 kB plus `QrSongCode`), though the code only shows on the song step and Review. | Bundle analysis | `next/dynamic` for `QrSongCode`, with a same-sized placeholder so nothing shifts. Build My Card 232 → about 219 kB, Personalize 261 → about 248 kB. |
| E-F4 | Should fix | **Personalize's gallery loads the whole questionnaire** (about 50 kB: `BmcQuestion`, `PtQuestion`, the questionnaire, Review, `compile`, the four card files and the rest) before a card is chosen. | Bundle analysis | Load the questionnaire with `next/dynamic` when a card opens, and prefetch it when a tile is hovered or focused. Gallery first load 261 → about 210 kB. Focus on opening (F-3) must still land on the card's heading: re-test it. |
| E-F5 | Polish | Build My Card's dialogs and Review (about 9 kB) load up front. | Bundle analysis | Optional: lazy-load the rights, creating, spend and top-up choice dialogs and Review. Small gain; do it with E-F3 or skip it. |
| E-F6 | Polish | **Personalize's head card image** has no `sizes`, so phones get the 640px file for a smaller box (Lighthouse: 43–58 KiB). The dev console also warns that `pt-comic-cover.jpg` and `pt-comic-back.jpg` have `fill` with a parent 0px tall, and that `logomark-gold-silver.png` is the LCP without `priority`. | `PtGallery.tsx:88`; Lighthouse `uses-responsive-images`; console | Add `sizes`, fix the 0px-tall parent, and decide `priority` for the logomark where it's above the fold. |
| E-F7 | Launch (security) | **Prompts built in the browser:** `compiledImagePrompt` and `compiledMusicPrompt` are built client-side (`bmc/compile.ts`) and sent with the generation request. If the backend uses them as they are, anyone can edit the request and generate anything on Souvenote's fal and Lyria accounts, outside the content rules. | `BMC-BEDROCK-HANDOFF.md` "frozen snapshot"; the bundle | Backend: rebuild the prompts from the brief with its own copy of `prompts.ts` / `catalog.ts`, or at least check them against it. Recorded as LAUNCH-READINESS 5.10. No frontend change. |
| E-F8 | Owner question | **Both flows are `noindex`** (`create/layout.tsx`), so the two product pages in the main nav aren't in search. That's why SEO scores 66 there. | Lighthouse `is-crawlable` | Keep them private (as now), or make the signed-out first screen indexable, with a canonical and the sitemap. |
| E-F9 | Note | **Headers and CSP on the flow routes:** CSP (report-only), nosniff, Referrer-Policy, `SAMEORIGIN`, Permissions-Policy, COOP and HSTS are all present. No report-only violations while walking either flow (photos are `data:` / `blob:`, the QR is inline SVG). | `curl -I`; console | When fal and Lyria land, serve the images and songs from the asset origin (`NEXT_PUBLIC_ASSET_ORIGIN`), or add their hosts to `img-src` / `media-src`. `camera=()` doesn't affect the file picker's camera; confirm on a phone (checklist Part 3). |

**Checked and fine:** both flows' `metadata` (title and description), the noindex, the 404 status (Prompt 2), and `next/image` sizes for the flows' thumbnails, which are `data:` URLs.

---

## Part F: real devices
`DEVICE-AND-SCREEN-READER-CHECKLIST.md` has a new **Part 3** for Build My Card and Personalize. It replaces the old "out of scope" note.
- **Photos:** the camera roll (HEIC on iPhone), the camera, large files, the 16-photo limit, and the iPad drop zone.
- **The rights pop-up's tick boxes**, including on a short phone.
- **One section per screen** and the "Your card so far" sheet.
- **Personalize:** swiping the gallery rows, and the native date pickers.
- **Typing a long message** with the keyboard open, and "What should change?".
- **Create, Review and the song:** "Making your card", Review on a phone, the iOS song preview once real audio exists, and the QR scan.
- **A screen-reader list for the flows**, including what to listen for in A-F2, A-F4 and A-F6.

---

## Decisions needed
1. **Part A:** which of A-F1 to A-F10 to fix?
   - A-F4: (a) or (b)?
   - A-F5: raise only the side-panel targets, and record the chips as an exception?
   - A-F9 touches the shared `PtScrollRow.tsx`.
2. **Part B:** build B-1 and B-2? For B-3, (a), (b) or (c)?
3. **Part E:**
   - E-F1, E-F3, E-F4 and E-F6?
   - E-F2 (shared `lib/api.ts`): now, or after the community-sharing session finishes?
   - E-F5: optional.
   - E-F8: keep the flows noindex?

---

## Outcome (2026-11-09, owner: "The recommended set")
**What the recommended set covered:**
- **Built:**
  - A-F1, A-F2, A-F3;
  - A-F4 (a): the visible word stays "Approve";
  - A-F5: 44px hit areas on the summary rows and links, with the chips and swatches recorded as an exception;
  - A-F6 to A-F10;
  - B-1 and B-2;
  - E-F1, E-F3, E-F4 and E-F6.
- **Not built, by that choice:**
  - B-3 (a): Top up and Checkout keep a short scroll on 667px phones;
  - E-F2 waits for the community-sharing session (`lib/api.ts`);
  - E-F5 (optional);
  - E-F8: the flows stay `noindex`.
- **Recorded for the backend:** E-F7 (LAUNCH-READINESS 5.10).

**Measured after (temp copy and a fresh production build):**

| Check | Before | After |
|---|---|---|
| Rights pop-up, promises screen, 375×667 | 712px, scrolls | 600px, fits (confirm screen 499) |
| Top up to create your card, 375×667 | 664px, scrolls | 552px, fits |
| Top up to make a new version, 375×667 | 718px, scrolls | 572px, fits; 375×812 unchanged (717) |
| Build My Card first-load JS | 232 kB | 224 kB |
| Personalize first-load JS | 261 kB | 205 kB |
| Lighthouse mobile, Build My Card | perf 64, CLS 0.665 | perf 87, CLS 0 |
| Lighthouse mobile, Personalize | perf 56, CLS 0.728 | perf 89, CLS 0.001 |
| Lighthouse desktop (Build My Card / Personalize) | 98 / 99 | 98 / 99 |
| Accessibility / best practices | 100 / 100 | 100 / 100 |
| Heading skip beside the questions | h1 → h3 | h1 → h2 "Your card so far" → h3 |

- **Fit:** the steps still fit one screen at 1280×720 and 1024×768 (`main` 720 and 768px). On tablets (768×1024) the footer now starts at the fold. Phones are unchanged (the steps were already taller than the screen), with the action bar at the bottom. No sideways scroll.
- **Announcements:** on Review, a paid new front read "Making a new front…", then "New front ready.". The caption and message lines use the same component.
- **Approve and alt text:** Approve stays "Approve" with `aria-pressed="true"` and the done look. The rights pop-up's photo is "Photo 1: IMG_4032.jpg".
- **Lazy-loaded card:** opening Comic Card from the gallery puts focus on its heading (F-3 kept), and a saved Horoscope draft opens.
- **Hit areas:** a press 6px above a 28px summary row lands on the row.
- **Checks:** `tsc` clean, ESLint clean, tests pass. Production build: exit 0, no warnings.

**Found while checking (not changed):**
- **Build My Card is now a dynamic route (`ƒ`),** from the community-sharing session's `?for=community` (`searchParams` in `create/build-my-card/page.tsx`). Next 15 then streams its metadata, so Lighthouse no longer sees the description or `noindex` in the `<head>` (SEO 66 → 92 and "no meta description"). The `noindex` tag is still in the HTML. Reading `?for=` in the client instead would keep the page static; that's for that session or the owner.
- **Personalize's head card** still downloads the 256px file for a 150px box on desktop (about 22 KiB each, down from about 55 KiB).
- **Measuring note:** stopping the first `next start` left its server running on port 3250, so the first "after" Lighthouse run hit the old build (best practices 96 from missing chunks). That process was stopped and every run repeated; the table above is from the repeat.

**Not covered:**
- Hover was checked by CSS order only (`:hover` can't be forced in the pane).
- Real forced colours, a screen reader, real devices and Safari.
- At 768×1024 and 375×812, only spot checks (Review, the photo step, the pop-ups). The changes there are CSS-only or don't change layout.

**E-F2, done after the community-sharing session finished (2026-11-09):**
- **Change:** the mocks load with `import()` only in mock mode. The Mock data panel and the demo login (`lib/mockDemo.ts`) load lazily too.
- **Shared chunk:** the chunk every page loads is 42.9 → 12.9 kB gzipped.
- **First load:** `/` 192 → 162 kB, Build My Card 224 → 213, Personalize 205 → 185.
- **With mock mode off:** no page's first load carries mock code, seed data or the demo login. They remain only as lazy files that load in mock mode.
- **Build My Card is a static page again**, since the community session's later version reads `?for=` in the browser. So the streamed-metadata note above no longer applies.
