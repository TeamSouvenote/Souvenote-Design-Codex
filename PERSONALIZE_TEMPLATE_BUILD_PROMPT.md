# Build prompt: Personalize a Template, adaptive template cards (`/create/personalize-a-template`)

You are continuing the Souvenote web application redesign on the `mock-data-mode` branch. Your task is to rebuild Personalize a Template so that **each template card is powered by Claude Haiku 5.5 and adapts to the customer**. After choosing a template, the customer answers one focused question at a time. Each template has its own short question set: it asks only what that card needs to reach its intended scene, subject treatment, wording and result, and it skips anything already answered or irrelevant. The path stays **simpler than Build My Card**: no image modes, no style picker, no vibes, no genre picker.

You will also make these changes to the current version:

1. **Out of credits on entry:** opening Personalize without enough credits must show the same **cards-or-credits choice pop-up** used in Build My Card (`BmcTopUpChoiceDialog`). Today it opens the credits-only Top up pop-up straight away.
2. **"Suggest a template" box:** on the same line as the search bar, at the top right, add a statement with input fields: *"Looking for something else? Suggest your idea for our team to build and we'll let you know when it's done."* The inputs are the suggestion and the customer's email.
3. **Attestation on upload**, an **optional AI version of the inside message**, and the **custom song QR preview**, matching what Build My Card now does.
4. **Berry & ivory** for the marketplace, the questionnaire and Review. The page still uses the older dark gold style.

## Owner decisions, 2026-11-08 (these override anything below that disagrees)

The template process lives in `C:\Users\wilso\Desktop\Personalize a Template\`:
- `AGENTS.md`: the per-card method and the seven cover inputs.
- `Personalize a Template ideas.pdf`: the catalogue, under its own headings.
- `Personalize a Template - Prompting.pdf`.
- `Completed Prompts.pdf` and the three `* Question Map.md` files: Horoscope, On This Day and Comic Card. These are **drafts, not final**.

**Gallery and catalogue**
1. **Gallery:** the rows follow the ideas PDF's headings, in its order. The occasion chips and search still filter across every template. The 12 templates that aren't in the ideas list are removed, but old saved drafts of them still open.
2. **Tile images are placeholders for now:** the Souvenote logo on a forest tile. The user-facing tiles are general examples of each template, not the customer's final result.
3. **Clickable templates:** only **Horoscope, On This Day and Comic Card** open the questionnaire. Every other idea is a **"Coming soon"** tile showing only the logo, its name and the label, with no click.
4. **One data file per card:** each card's questions, branches, defaults and generation instructions live in their own file, so changes to a question map are quick to apply.

**Questions and photo modes**
5. **One photo treatment per template** (owner, 2026-11-08, replaces the per-template mode lists): "Use my photo" (the card's own treatment, as its example shows) or "Continue without a photo", plus an optional "keep it as it is" link (Decorate) where the card allows it. No Enhance on this path. Comic: photo or no photo. Horoscope and On This Day: both plus the link; On This Day recommends no photo.
6. **Names come first**, as one shared question with the sender's name, the recipient's name and the optional phonetic spelling. Where each name is used is tracked separately: a name being given doesn't mean it goes in the song.
7. **Orientation:** a default per template that the customer can switch.
8. **Horoscope:** names, then birth month and day (the year is optional), then the photo choice, then the sign-specific choices. The app works out the sign.
9. **On This Day:**
   - Birthday only, for now.
   - Live web research with verified sources: mock mode shows realistic canned stories with source links, and the search contract is written up for the backend.
   - Three headline suggestions (playful, warm, classic).
10. **Comic Card:** an editable 4-panel storyboard with **at most 2 short bubbles or captions per panel, about 8 words each**.
11. **Front text:** the **image model draws all the front text**, including the masthead, date, headline and speech bubbles. Review asks the customer to check the spelling.
12. **AI limits:** every AI suggestion set (storyboard, headlines, styles, Transform ideas, message, lyrics) is an initial draft plus 5 successful rewrites.

**Song**
13. **Each card will get its own song prompt later.** For now each template has an empty song-prompt slot, and mock mode uses a generic draft. Vocal, Instrumental and No song stay. There is no genre picker, and the ten BMC presets aren't used. The song step asks whether to include the recipient's name and the card's story detail.

**Earlier decisions (still apply)**
14. No Back to options button.
15. Suggestions are stored in mock data only.
16. **No photo, describe them** (owner, 2026-11-08): when the no-photo front shows the person (Comic Card, saved templates), ask "How do they look?" and then up to 2 follow-ups, each only for a key detail still missing (hair, then what they wear, then anything they're known for). All of them are optional, and skipping one ends the follow-ups. Never guess a look from a name. Horoscope and On This Day keep their symbol and story fronts.

---

If any requirement, product behaviour, design decision, existing copy, reference material or technical constraint is unclear, ask me focused follow-up questions before you assume anything or start building. Do not make changes that could alter intended product behaviour, copy, data handling, authentication, credits, or the Souvenote design direction until I have clarified them.

---

## 1. Inspect before you edit

Read the existing implementation first and map it. Do not edit anything until you understand the current flow.

- **Route and shell:** `frontend/app/create/personalize-a-template/page.tsx`, `components/PersonalizeTemplateClient.tsx` (credit entry gate, `?modal=1&draftId=&step=` resume params), `components/Personalize.tsx` (about 2,000 lines: `TEMPLATES`, `OCCASIONS`, `PtMarketplace`, `PtSectionRail`, `PtPersonalizeModal`, `PtChat`, `PersonalizeApp`), `styles/pt.css`.
- **The Build My Card rebuild you should reuse** (already on this branch): `components/bmc/*`. That includes `brief.ts`, `engine.ts`, `questionBank.ts`, `catalog.ts` (the ten `GENRE_PRESETS`, `LIMITS`), `compile.ts`, `prompts.ts` (`HAIKU_MODEL_ID`), `ui.tsx` (`ChoiceGroup`, `ToggleChips`, `TextField`, `Actions`, `Thinking`, `Counter`, `useIsPhone`, `useSections`), `BmcQuestion.tsx`, `BmcSummary.tsx` (`StageRail`), `BmcReviewStage.tsx`, `BmcAttestationDialog.tsx`, `BmcDialogs.tsx` (`BmcTopUpChoiceDialog`, `BmcGeneratingDialog`, `BmcSpendDialog`, `BmcSignUpDialog`), `QrSongCode.tsx`, `photos.ts`, plus `styles/bmc-questionnaire.css`, `bmc-dialogs.css`, `bmc-polish.css`. Also read `build-fixes/mock-data-mode-2026-11-07/CHANGELOG.md` and `BMC-BEDROCK-HANDOFF.md` for the decisions already made there.
- **Shared pieces:** `components/AttestationGate.tsx` and `attestationContent.ts`, `components/flow/*` (`FlowDialog`), `components/useModalDialog.ts`, `components/pricing/topUp.ts` (`openTopUp`), `pricing/TopUpModal.tsx`, `PricingReturn.ts`, `lib/creditBalance.ts`, `components/createFlowRules.ts` (`MIN_GENERATION_CREDITS`, `CARD_WITH_QR_SONG_CREDITS`), `components/AuthGatePrompt.tsx`, `components/AuthProvider.tsx`.
- **Data:** `lib/api.ts` (createCardDraft, updateCardDraft, fetchCardDraftById, mockUpload, startGeneration, refreshCardDraftBackendState) and the mock layer that answers it (`lib/mockMode.ts`, `lib/mockDb.ts`, `lib/mockApi.ts`, `lib/mockInterview.ts`).
- **Things that read Personalize drafts:** `components/MyCards.tsx` (`personalizeResumeTarget` resumes from the `photo` / `birthday` / `recipient` / `caption` / `insideMessage` keys of `creative_brief` and maps them to steps 1–3), `components/Delivery.tsx` (`rememberDeliverySource('personalize')`), `components/AccountPages.tsx`, `lib/mockDb.ts` (seeded "Father's Day Comic" draft).
- **Old review:** Personalize is now the last user of the legacy dark gold `components/BmcReview.tsx` (it holds the old 17-genre list). Check who still uses `BmcShared.tsx` (Delivery does).

## 2. Sources of truth (read all of them)

**Product and prompt rules**
- `reference-materials/Souvenote MVP-PRD.pdf` (also in `Build My Card/`). Key Personalize rules:
  - Personalize starts from a guided design picked from an occasion-based gallery.
  - Intake is the template and occasion, an optional photo or written idea, upload-rights attestation, an optional birthday, recipient name, phonetic spelling, front caption and inside message. **Keep this path simpler than Build My Card.**
  - **Birthday is creation context only**, not a reminder or address-book feature.
  - Vocal, Instrumental or No song. **The template's configured music style is used, with no customer genre or style selector**, no mood selector and no free-text music prompt.
  - The inside message is drafted from the shared brief **before** song generation. The customer can write their own. Initial draft plus five free AI rewrites.
  - Vocal lyrics: write my own, or draft for me. Initial draft plus five free rewrites, available only before the first song. Explicit **Approve lyrics** on the current version before vocal audio. Instrumental skips lyrics. No song charges 1 credit and prints no QR code.
  - **Every enabled template needs validated artwork and configuration.** Placeholder or padded gallery tiles are not launch-ready.
  - **The full gallery requires sign-in**, direct routes included. Guests see only the small approved example selection.
  - Sample arrays and counters alone do not count as AI generation.
- `reference-materials/Build My Card/Build My Card Image and Message Prompts.pdf`, sections **"Personalize reference template"** and **"Personalize occasion reference list"**:
  - *"Each individual Personalize card template should define its own adaptive question set. The interviewer asks only the card-specific details needed to achieve that template's intended scene, subject treatment, wording and visual result, then skips questions already answered or irrelevant to that card. The application retains the template's deterministic requirements and validates completeness before generation."*
  - The **universal master image prompt**. Each template swaps in only `{{card_concept_or_scene_direction}}`, `{{visual_style}}`, `{{visual_style_description}}` and its reference-image preservation rules. The rest of the prompt (composition, print-safe 6% zone, exact cover text or no text, subject and child-safety rules, originality and rights rules, reference handling, edge discipline, quality bar) is shared and fixed.
  - The caption and inside-message suggestion templates in the same PDF.
- `reference-materials/Build My Card/Build My Card Asset Generation Map Expanded Image Flow.pdf`: the shared rules on versioning templates and presets, generation snapshots, the placeholder audit (no unresolved braces), and edit and approval rules.
- `reference-materials/Build My Card/Souvenote Song Prompt Library.docx`: the ten preset IDs, the lyric writer prompt and the final music template. Each template maps to one of these presets.

**Design: `design-system/`** (berry & ivory, v1.2)
- Read `README.md`, `docs/01`–`06`, `tokens/tokens.css` and `reference/index.html`. The live source is `frontend/app/styles/landing.css` (the `--l-*` names map one-to-one to `--sv-*`). The signed-in screens already on this system are Create Options (`CreateOptionsClient.tsx`, `create-options.css`), Pricing, and the rebuilt Build My Card (`bmc-questionnaire.css`, `bmc-dialogs.css`). Match them.
- The rules:
  - Lato 300/400/700, plus Lobster Two for one accent phrase per heading. The current `text-metallic-rose-gold` / `souv-hero-italic` heading treatment goes.
  - Ivory and paper surfaces with the shared paper texture.
  - Forest for actions, berry for emphasis.
  - **Gold only for AI-made things** (Haiku suggestions, generated assets, the "thinking" state).
  - 17–18px body text, tap targets of 44px or more, pill buttons.
  - Warm low shadows and the `--sv-ease` motion curve.
- No generic SaaS or onboarding-wizard styling.
- **Template artwork stays as designed.** The card thumbnails are the product. Restyle the page around them, not the cards themselves.

---

## 3. What changes

### 3.1 Template configuration (versioned data, not components)

Move `TEMPLATES` out of `Personalize.tsx` into typed, versioned data files (for example `components/personalize/templates.ts`, plus `templateQuestions.ts`). Each enabled template defines:

```text
id, version, name, tag, sub, occasion, popular, art (thumbnail, unchanged)
orientation: portrait | landscape (fixed by the template, never asked)
image: conceptDirection, visualStyle, visualStyleDescription, referenceRules, photoUse: optional | recommended | none
caption: defaultSuggestionHint, allowNoCaption
music: presetId (one of the ten launch IDs), allowedModes [vocal, instrumental, none]
questions: [templateQuestionId...] in priority order, with required / optional per question
requiredFields: the deterministic fields this card cannot generate without
```

- **Template-specific questions** fill `templateFields` only. Examples (propose the full list for my approval, see §6):
  - **On This Day:** the date (required). The birthday answer fills it if given.
  - **Horoscope:** the birth date (required). **The app works out the star sign from the date**, never Haiku.
  - **Courtroom Case:** the playful "charge" and the verdict.
  - **Book / Movie Cover:** the title, and optionally a tagline.
  - **Recipe Cards:** the dish, and who it's from.
  - **Fortune Cards:** the fortune's theme.
- Haiku may tailor a question's wording. It may not change the template's concept, style, orientation, music preset, required fields, or a question's options and limits.
- The `PAD_STYLES` / `padOccasion` "style variant" tiles are placeholders, not real templates (owner, 2026-11-08):
  - Keep the slots so each occasion row still has at least four tiles, but replace the made-up variant art and names with **the Souvenote logo as a placeholder**. Use the logomark the design system's logo guidance calls for on ivory.
  - Placeholder tiles have no Personalize button. They aren't focusable or clickable, they are hidden from screen readers, and they never open the questionnaire or create a draft.
  - They don't count towards "See all N" or the search results.
- Log `template.id` and `template.version`, the prompt template version and the music preset ID on every generated asset.

### 3.2 From a three-step modal to an adaptive questionnaire

Replace the Photo / Birthday / Caption & Message modal with **one question at a time**, using the BMC question engine and components wherever they fit. Stages make a quiet progress rail and are the save and resume points:

**Photo, Details, Words, Song, Review**

**Shared question bank (asked only when it applies and is still unresolved):**

- **Opening (Details, asked first):** `PT0_story`. Free text: *"Who's this {template name} card for, and what should it celebrate?"* It can fill recipient, sender, relationship, birthday, facts, feeling and template fields all at once. Optional, but it is the main signal for skipping later questions.
- **Photo:** `PT1_photo`. Upload a photo (JPEG / PNG / WEBP), or "Describe them instead", or "No photo" when the template's `photoUse` allows it. **The attestation opens immediately after files are chosen** (see 3.5). Ask `PT2_keep` only when the template uses people or pets from the photo: confirm who stays recognisable. Keep identity, apparent age and subject count.
- **Details:**
  - `PT3_recipient`: recipient name, optional.
  - `PT4_birthday`: optional, and **only on templates where it helps** (birthday-occasion templates, or templates whose required field is a date). It is context only.
  - Then the template-specific questions from 3.1, in the template's order.
  - Never infer gender, age, relationship, faith or appearance from a name or photo.
- **Words:**
  - `PT5_caption`: the exact words to print, No caption, or the **Caption Generator** (2–8 words; the initial suggestion plus 5 successful regenerations). **Nothing is pre-filled and nothing prints until confirmed.** Today the field starts as "To the moon and back"; remove that.
  - `PT6_inside`: "Desired inside message". The customer writes their version, leaves it empty for an automatic draft, or chooses **Leave inside blank**. English, 1–4 short lines, at most 500 characters including the sign-off. Their wording is saved exactly as typed.
    - **Toggle: "Also create an AI version".** Haiku writes a meaningfully different alternative. Both are kept, both show on Review and can be edited there, and the customer chooses which one prints.
    - Initial draft plus 5 successful rewrites, with the remaining count shown.
    - A late result never overwrites typed text or a blank choice. A context change marks the AI version stale and offers a refresh; it never refreshes silently.
- **Song:**
  - `PT7_song`: Vocal, Instrumental or No song. **Show the template's music style as a fixed label** (for example "This card's song: Warm Acoustic"), not a selector.
    - Show the **custom QR preview** here (`QrSongCode`): the two-tone mini logo (`/assets/logomark-gold-silver.png`) at the centre, "Scan me" above, "To play song" below, labelled clearly as a preview.
    - No song: no lyrics and no QR code, 1 credit. A blank inside can still carry the song QR code; say so clearly.
  - `PT8_pronunciation`: only when a recipient name exists and the song is Vocal. Used only to guide pronunciation, never printed or sung.
  - `PT9_lyrics` (Vocal only): "Write my own" or "Draft for me". Use the preset's word range and the `[Verse] [Chorus] [Final]` timing blocks, with a 750-character counter. The draft is read-only until Edit is pressed. Initial draft plus 5 successful regenerations. **Approve lyrics** on the current version is required before generation.

**No fixed question count.** A rich opening answer can fill most fields. A simple template can finish in three or four questions. Record optional skips and don't ask them again unless the customer changes something they depend on.

**Haiku 5.5** (`global.anthropic.claude-haiku-5-5`, Bedrock Converse, thinking disabled, structured output). Reuse the BMC interviewer contract and validation (`engine.ts`: `INTERVIEW_RESPONSE_SCHEMA`, `applyProposal`, `decideNext`), with a **per-template allow-list**:
- **Accept an update only if:** the field is on the current template's allow-list, the value has a valid type, the `evidence_quote` really appears in the saved answer, and the brief version still matches.
- **Never accept updates that:** overwrite a direct selection or the customer's own wording, change the template, its preset or its orientation, or invent memories, ages, beliefs or pronouns.
- **Throw away** stale responses.
- **If Haiku fails:** one bounded retry, then the bank's default wording. Keep every answer.
- **Customer text is data,** never instructions.
- Haiku also writes caption suggestions, the inside message (and its AI version) and the lyrics, using the template's concept and preset as fixed context.

**Data shape** (map onto `creative_brief`; add a schema number; keep My Cards resume working):

```text
flow: "personalize_template", schema: 2
template: {id, version, name, occasion}
shared:   recipientName?, senderName?, relationship?, birthday?, pronunciation?, userFacts[], intendedFeeling?, contentLanguage: "en"
photo:    mode: upload|description|none, references[{id, role, subjectId?}], description?, keepSubjects[], attested
templateFields: { [fieldId]: value }
caption:  enabled, text, origin: user|ai, suggestionsUsed
message:  userVersion{text, version}, aiVersion?{text, version, successfulRegenerations, stale}, aiAlternateEnabled, mode: text|blank, printedChoice: user|ai
song:     mode: vocal|instrumental|none, presetId (from the template, read-only), lyricsSource: user|ai, lyrics, lyricsVersion, approvedLyricsVersion?, regenerationCount, targetSeconds: 45
control:  currentStage, answerHistory[], skippedOptionalFields[], briefVersion, conflicts[], omissions[]
```

- **Migrate saved drafts.** Old drafts (`photo`, `birthday`, `recipient`, `phonetic`, `caption`, `insideMessage`, `includeSong`) open in the new shape with nothing lost. An old `includeSong: true` becomes **Vocal with no lyrics approved yet**; it is never auto-approved.
- Update `personalizeResumeTarget` in `MyCards.tsx` to the new stages, and update the seeded mock draft.

**Mock data mode (this branch).** Put the interviewer, caption writer, message writer and lyric writer behind one typed client, answered in the browser by the mock layer, the same way `mockInterview.ts` serves Build My Card:
- a deterministic rule engine that picks the next unresolved question for the template;
- keyword extraction with evidence quotes;
- canned but context-aware drafts.

Write the real Bedrock contract (request, response, per-template prompt assembly, schema) into the BMC hand-off doc, or a sibling `PERSONALIZE-BEDROCK-HANDOFF.md`. Don't add the AWS SDK or backend routes without asking me.

**Generate gate.** Show the cost first: image plus song is 2 credits, image only is 1. Freeze a snapshot (brief, template version, prompt version, preset). Deduplicate repeated clicks. Image and audio run independently. If credits are short at this point, show the **same cards-or-credits choice pop-up** (3.3) with the "Your card is saved" line, and return to this draft after paying.

**Review.** Replace the legacy `BmcReview` with the berry & ivory review pattern from `BmcReviewStage` (reuse it, or extract a shared review). Show:
- the front;
- **both inside-message versions** (editable, with a choice of which prints);
- the song with its lyrics version;
- the QR preview.

The customer approves each piece or uses Approve All. Approval applies to an exact version, and stale items are flagged. Then the existing Delivery hand-off continues (`rememberDeliverySource('personalize')`). If nothing else uses `BmcReview.tsx` afterwards, remove it and its legacy genre list.

### 3.3 Out of credits on entry: the cards-or-credits choice

Today `PersonalizeTemplateClient` calls `openTopUp("credits")` as soon as the balance is under `MIN_GENERATION_CREDITS`. Replace this with **the same dialog Build My Card shows, `BmcTopUpChoiceDialog`**: "Top up cards" (Best value; every card includes printing, shipping and 10 AI credits) or "Top up credits only".
- Move it to a shared place (for example `components/flow/TopUpChoiceDialog.tsx`) so both flows import one component, and keep BMC's behaviour unchanged.
- Add an **entry variant**. Nothing is saved yet, so hide "Your card is saved…". Replace "This uses N credits and you have N" with balance-only wording. **Propose the exact entry copy to me before you build it.**
- Choosing opens `openTopUp("cards" | "credits", "/create/personalize-a-template")`, falling back to Pricing (`goToPricingAfterPurchase`).
- **Not now** closes it and leaves the customer browsing the gallery. Show it once per visit on entry. It shows again, in the saved-draft variant, only when they press Create without enough credits.
- Keep today's exceptions: signed out (sign-up prompt instead), resuming a `draftId`, and a balance that is still loading.

### 3.4 "Suggest a template" box

Add this to the right of the search bar, on the same line, in `.pt-search-row`:

> **Looking for something else?** Suggest your idea for our team to build and we'll let you know when it's done.

- **Inputs:**
  - **Your idea**: required, single line that grows, 300 characters, with a counter near the limit. Placeholder example: "A retirement card that looks like a boarding pass".
  - **Your email**: required, `type="email"`, `autocomplete="email"`, **pre-filled from the signed-in account** and editable.
  - A forest pill button: **"Send idea"**.
  - Every input has a visible or programmatic label. Inline errors are announced.
- **After sending:** replace the form with a calm confirmation ("Thanks, we'll email {email} when it's ready."), plus "Suggest another". Keep the search bar usable the whole time.
- **Privacy:** one short line under the inputs saying the email is used only to tell them about this idea, with a link to the Privacy Policy. Don't add marketing opt-in without asking me.
- **Data:** add a typed `submitTemplateSuggestion({ idea, email, searchQuery?, occasionFilter? })` in `lib/api.ts`. Mock mode stores it in `mockDb` (visible in the mock data), deduplicates repeats, and rate-limits locally. Include the current search text and occasion filter: they show what was missing. **There is no backend route for this today, and that is fine for now** (owner, 2026-11-08): storing suggestions in the mock data is enough. Document the contract (`POST /template-suggestions`) for the backend. Don't add a route, an email provider or any notification.
- **Layout:**
  - Desktop (1024px and up): search on the left, the suggestion block on the right, aligned on one row. The statement sits above its inputs inside the right block.
  - Tablet: the same row if it fits, otherwise the block wraps below the search, full width.
  - Phone: stacked under the search, collapsed to the statement with an "Suggest an idea" button that expands the inputs.
  - Never covers the occasion chips. No horizontal overflow.
- Also show a compact version of the statement when a search returns **no results**, carrying the search text into the idea field.

### 3.5 Attestation on upload

As soon as the customer picks a photo (file input or drop), open the attestation **straight away**, before any upload request and before Continue. Today Personalize opens it only on Continue.
- Use the berry & ivory `BmcAttestationDialog` (it shares its legal text with `AttestationGate` through `attestationContent.ts`), with the same rules: scroll-gated Terms and Privacy, checkboxes unlock only after both are read, and confirm unlocks only after both are ticked.
- Agreeing commits the photo and starts the upload. Cancelling or Escape discards the unattested photo and returns to the photo question.
- If `AttestationGate.tsx` ends up with no users, remove it.

### 3.6 Marketplace on berry & ivory

- Keep the structure: heading, the spinning comic card, the ornament divider, search plus the suggestion box, occasion chips, "Our Top Picks", the occasion rails with "See all", the filtered grid.
- Restyle onto berry & ivory: the h1 "Personalize a *template*" with Lobster Two on "template", ivory paper, forest actions, berry chips with `aria-pressed`.
- Rails stay keyboard-scrollable with visible arrow buttons. Template cards are real buttons with accessible names ("Personalize On This Day").
- **Gallery access (PRD):** the full gallery requires sign-in. Today guests can browse everything. Show me how you plan to gate it (the approved example selection plus a sign-up prompt) before building.
- Remove `PtChat` ("Nova"). It is exported but never rendered.
- **No "Back to options" button** on this page (owner, 2026-11-08). As on Build My Card, the page heading does that job.

### 3.7 Questionnaire UI

Follow the Build My Card layout so the two flows feel like one product:
- **Desktop (1024px and up):** the selected template's thumbnail and name at the top. A centred question card on paper on the left (one heading with one script phrase, a short helper, then the controls). On the right, a sticky **"Your card so far"** panel with the template preview, chips for resolved answers and an edit button on each. The rail of five stages sits above. The whole flow fits one screen; only the controls scroll if a window is short.
- **Tablet (600–1023px):** one column, with the summary as a collapsible panel above the question.
- **Phone (under 600px):**
  - one column, with the summary as a bottom sheet;
  - a sticky, safe-area-aware footer with Back, Continue and Skip (when optional) that **never covers inputs**;
  - no horizontal overflow.
- It can open as a full-screen `FlowDialog` over the marketplace (keeping `?modal=1&draftId=&step=`) or as its own view. Pick one, tell me why, and keep closing it saving the draft as it does today.
- **Haiku turns:** a calm gold "thinking" state with a polite live region. Keep the answer visible. When it finishes, move focus to the new question heading. Under reduced motion, use no animation.
- **Editing earlier answers** jumps back to that question and keeps later work. Only dependent items are marked stale.
- **Accessibility:**
  - every control has a label;
  - chips use `aria-pressed`;
  - single-choice groups are radio groups;
  - 44px minimum targets;
  - visible 2px focus ring;
  - errors are announced;
  - one h1 per page.
- Keep the page `noindex` (it is authenticated), with accurate metadata.

---

## 4. Implementation rules

- Keep the route, the Next.js / TypeScript conventions, auth, credits, draft persistence, the generation and asset flow, the Delivery hand-off, analytics and the mock-data-mode behaviour intact. Don't change Build My Card's behaviour while sharing its pieces.
- No changes to the backend, environment variables or deployment.
- No new dependencies without asking me (this includes a QR library and the AWS SDK).
- Templates, template question sets, the shared question bank and the master prompt live in versioned, typed data files, separate from the components. Split `Personalize.tsx` into a `components/personalize/` folder the same way BMC was split.
- Reuse shared components. Remove the code the questionnaire replaces (the old modal, the sample caption and message arrays, the hard-coded "Cameron" / "Mom" messages, `PtChat`, unused CSS in `pt.css`). Leave no dead code, `any`, console logs or TODOs.
- The QR code is made by the layout or print system, never inside the AI front image. Keep it scannable: high error correction, a small logo, and a quiet zone.
- Add each change to `build-fixes/mock-data-mode-2026-11-07/CHANGELOG.md`. **Don't commit or push**; everything is committed together at the end of the session.
- Document the suggestion box, the shared top-up choice dialog (both variants) and the template question pattern in `design-system/docs/02-components.md` and `reference/index.html`.

## 5. Verify

- Run type-check, lint, `npm test` and `npm run build`.
- In mock data mode, at 375px, 768px and 1280px, walk through these cases:
  - **Entry with 0 credits:** the cards-or-credits choice appears (not the credits-only pop-up). Each choice opens the right Top up view. Not now leaves the gallery usable. Signed out shows the sign-up prompt. Resuming a draft shows no pop-up.
  - **Create with too few credits:** the choice appears with "Your card is saved", and paying returns to the draft.
  - **Suggestion box:** empty and invalid email errors, the pre-filled email, a successful send, the stored record in mock data, "Suggest another", the no-results version carrying the search text, and the phone collapse.
  - **Rich opening answer:** no repeated questions.
  - **A date template** (On This Day or Horoscope): the birthday fills the date, and the sign is worked out by the app.
  - **A template with its own questions** (Courtroom or Book Cover).
  - **A photo template:** attestation on pick, scroll-gated, cancel discards; keep-subjects; and a no-photo or description path.
  - **Captions:** exact caption, no caption, generator limit, nothing pre-filled.
  - **Inside message:** an exact manual message, over 500 characters, the AI-version toggle (both versions editable on Review, choosing which prints), and a blank inside with a song.
  - **Song:** Vocal, Instrumental and No song; the template's style shown as a label with no selector; pronunciation; lyrics over 750 characters; the sixth regeneration is blocked; generation is blocked until lyrics are approved.
  - **Resume from My Cards:** a new draft, and an **old-format draft** migrated.
  - **Generation and delivery:** duplicate Generate clicks, Review approvals, then Delivery.
  - **Placeholder tiles:** they show the logo, can't be focused or clicked, and aren't counted.
  - **Build My Card still works,** including its own top-up choice dialog.
  - **Keyboard-only** and **reduced-motion** runs.

## 6. Before you edit, give me a short summary of:

1. The current Personalize routes, components, data shape and the places that read it (My Cards resume, Delivery, mock data).
2. Which Build My Card pieces you will share as they are, which you will generalise, and how BMC stays unchanged.
3. **The template configuration table:** for each enabled template, its concept, style, photo use, required fields, its own questions and its music preset. Mark any template you think isn't launch-ready.
4. The Haiku contract per template, and the mock interviewer.
5. The entry copy for the top-up choice dialog, and the gallery sign-in gate.
6. What you'll keep, what you'll remove, and the migration of saved drafts.
7. Problems you found in the existing code or contradictions in the references.

## 7. After you build, give me:

1. The changed files.
2. The responsive behaviour (phone, tablet, desktop).
3. The AEO/GEO and metadata handling.
4. The commands you ran and their results.
5. Problems that were already there and are still there.
