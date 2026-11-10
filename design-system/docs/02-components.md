# 2. Components

Each entry lists what the component is for, its parts, variants and states, accessibility requirements, and where it lives in the app.
Live examples of all of them are in `reference/index.html`.

Paths are relative to `frontend/app/`. Landing class names start with `l-`. Shared components keep their `souv-` classes.

---

## 2.1 Button

**For:** the main actions on the page ("Start for Free", "Log In").
**Source:** `.l-btn` in `styles/landing.css`; in the nav, `.souv-cta-flow` and `.souv-nav-login`.

| Variant | Fill | Text | Border | Hover |
|---|---|---|---|---|
| Primary | `--sv-action-bg` (forest) | `--sv-action-ink` (ivory), 700 | none | `--sv-action-bg-hover`, lift 1px, `--sv-shadow-2` |
| Secondary | transparent | `--sv-text`, 400 | 1.5px `--sv-line-strong` | Border and text turn `--sv-hover` (berry) |
| Primary on forest | ivory | forest | none | white |
| Text link (nav "Log In") | none | `--sv-text`, 700 | none | `--sv-hover` |

**Size:** 56px tall, 32px side padding, pill shape, 17px text with 0.02em tracking. In the nav: 44px tall, 20px padding, 15px text.

**Rules:**
- One primary button per view. The secondary sits to its right, or below it on phones (<480px).
- Labels are short verbs in title case: "Start for Free", "Log In".
- The focus ring is 2px `--sv-focus` with a 3px offset.

## 2.2 Icon button

**For:** small actions on cards (try your own photo, preview the song) and the gallery arrows.
**Source:** `.l-gcard-tool`, `.l-arrow`.

| Variant | Size | Look | Hover | Disabled |
|---|---|---|---|---|
| Outline (card tools) | 44 × 44px | Transparent, 1.5px `--sv-line-strong` ring, 20px icon | Ring and icon turn berry | n/a |
| Filled (gallery arrows) | 52 × 52px | Forest fill, ivory chevron, 22px icon | Ring turns berry | 40% opacity |
| Playing (song preview) | 44 × 44px | Forest fill, ivory icon | n/a | n/a |

**Accessibility:** icon-only, so every one needs an `aria-label` that names the card, e.g. "Try Your Life As A Hero with your own photo".

## 2.3 Navigation bar (landing variant)

**For:** moving between the main areas while signed out.
**Source:** `components/Navbar.tsx` with `navVariant="landing"`.

**Parts:** gold wordmark on the left · four evenly spaced links (Personalize a Template, Build My Card, Community Cards, Pricing) · Log In and Start for Free on the right.

**Look:** a floating forest bar, 22px radius, 68px tall (76px from 1221px), `--sv-shadow-3`. Links are 12px bold capitals with 0.16em tracking, on two lines where they're long.

**States:**
- Hover: the link turns gold and gets an underline. A popover opens below with the link name and a one-sentence description.
- Below 701px: the links hide. Below 481px "Start for Free" hides too, because the hero has it.

**Rules:** no separator dots and no hamburger menu on the signed-out landing page.

## 2.4 Hover popover

**For:** a one-sentence explanation under each nav link.
**Look:** a forest panel with an arrow, a hairline rule, the title in gold, and the description in oat at 15px.
**Rules:** one sentence that says what you can do there, e.g. "Choose from flexible options as low as $6.99."

## 2.5 Section heading

**For:** the start of every section.
**Source:** `components/landing/SectionHeading.tsx`.

**Parts:** h2 = light lead words plus one script accent, then an optional sub-line (`--sv-text-muted`, max 44ch, 14px above).

**Variants:** centred (default) or start-aligned (the gallery rail).

```tsx
<SectionHeading id="steps-title" lead="Three steps," accent="one keepsake" />
```

## 2.6 Hero keepsake card

**For:** showing a real finished card front and back.
**Source:** `components/landing/HeroCard.tsx`.

**Parts:** a `<button>` with two faces (cover and inside) · a soft floor shadow · the song chip · the hint "Tap or click the card to pause".

**Behaviour:** rotates continuously (30s, linear). It pauses on mouse hover, keyboard focus or a tap, and a second tap starts it again. Under reduced motion it stays still facing front and the hint is hidden.

**Size:** `min(58vw, 240px)` wide, or `min(24vw, 288px)` at ≥960px. Aspect ratio 1488:2096, 16px radius, `--sv-shadow-3`.

## 2.7 Song chip (player)

**For:** playing the original song that comes with a card.
**Source:** `components/landing/SongPlayer.tsx`.

**Parts:** a vinyl play button (48px: espresso disc, faint ivory grooves, berry label, play/pause glyph) · a label in small capitals ("ORIGINAL SONG") · the title in Lobster Two · the time (only when a file is set) · a 3px progress line.

**Look:** a gold pill (it's AI-made), `--sv-shadow-1`, with espresso text.

| State | What shows |
|---|---|
| No file yet (`audioSrc: null`) | Clickable; does nothing; no status text |
| Ready | "Tap to play" |
| Loading | "Loading…" |
| Playing | The vinyl spins, the time counts up, and the progress line fills |
| Error | "Song unavailable"; the button is disabled and the icon dimmed |

**Accessibility:** `role="group"` labelled with the label and title; the button uses `aria-pressed` and a label like "Play Jude Mister to the Rescue"; the status is `aria-live="polite"`. Audio uses `preload="none"`, so nothing downloads until someone presses play.

## 2.8 Gallery card (flip card)

**For:** browsing templates.
**Source:** `components/landing/LandingGallery.tsx`.

**Parts:** a flip button (5:7, 16px radius, a thin inner frame 10px in) · a front with artwork or the occasion name in script on a tone · a back with artwork, or the small gold logo mark on forest · a meta row with the name (bold), the occasion (berry label) and two outline icon buttons.

**Tones** (for fronts with no artwork):

| Tone | Fill | Script ink | Contrast |
|---|---|---|---|
| 1 | Gold gradient | Espresso | 5.45 |
| 2 | Forest gradient | Ivory | 9.92 |
| 3 | Paper gradient | Berry | 6.20 |
| 4 | Terracotta gradient | Espresso | 3.74 (large script only) |
| 5 | Berry gradient | Ivory | 5.70 |

**Behaviour:** the card turns over in 700ms on mouse hover, keyboard focus or a tap. `aria-pressed` reflects the side showing, and the label says which side you'll see next.

**Track:** scrolls sideways with snap points. Cards are `min(74vw, 290px)` wide, or 250px at ≥1024px. On desktop the right edge fades out. The arrows scroll one card at a time and dim at either end.

## 2.9 Step tile

**For:** numbered process steps.
**Source:** `components/landing/LandingSteps.tsx`.

**Parts:** a number in spaced capitals ("01") · a title (h3, 400) · body text (max 38ch).

**Look:** solid brand-colour tiles with an 18px radius, one colour per step, in this order (owner, 2026-11-05):

| Step | Fill | Text | Contrast |
|---|---|---|---|
| 1 | Berry | Ivory | 5.70 |
| 2 (the AI step) | Gold | Espresso | 5.45 |
| 3 | Terracotta | Deep espresso `#2E2422` | 5.30 |

No top stripe: its 4px goes into the top padding, so the tiles keep their size. A soft layered shadow, a faint top-lit sheen and a light top edge make them read as raised card stock; with a mouse, a tile lifts 6px and tilts 4° on hover (none with reduced motion). Gold stays on the step where AI does the work.

**Layout:** stacked, then three across from 900px.

## 2.9a Pen-stroke underline

**For:** one short phrase that carries the page's feeling (today: "its own personalized song" in the hero lede). At most one per screen.
**Source:** `components/landing/LandingHero.tsx` (`.l-hero-mark`, `.l-hero-mark-line` in `landing.css`).

**Look:** a hand-drawn berry stroke (2.4px, round caps, slightly wavy) just under the phrase; the text itself stays espresso, so contrast doesn't change. The phrase doesn't wrap, so keep it to a few words.

**Motion:** the stroke draws in once on load (1.1s, after 0.6s). With reduced motion it's simply shown. In forced-colours mode it uses the system text colour.

## 2.10 Comparison table

**For:** comparing Souvenote with other services.
**Source:** `components/landing/LandingComparison.tsx`.

**Parts:** a forest band · a heading with the gold wordmark inline ("How *Souvenote* compares") · an ivory sub-line · a paper table (max 880px, 18px radius, `--sv-shadow-3`).

**Rows:** service names left-aligned in the first column (34% wide). The Souvenote row is highlighted gold and bold. Ticks are forest (espresso on gold), crosses cocoa and slightly smaller.

**Accessibility:** a real `<table>` with a hidden `<caption>`, `scope` on header cells, and hidden "Yes"/"No" text beside each icon.

**Content rule:** competitor claims must be checked against each company's own site, with the date noted in `content.ts`. The table carries no on-page legend.

## 2.11 Accordion (FAQ)

**For:** questions and answers.
**Source:** `components/landing/LandingFaq.tsx`.

**Parts:** h3 → a full-width button (min 72px tall) holding the question and a 36px round plus icon → an answer panel (max 64ch).

**States:** only one item is open at a time (the first, by default). The open item gets the `--sv-surface-raised` fill, its question turns berry, and the plus becomes a minus. The panel opens by animating the grid row (0fr → 1fr, 350ms), and closed panels are hidden from screen readers.

**Accessibility:** `aria-expanded` and `aria-controls` on the button; each panel has `role="region"` and `aria-labelledby`.

## 2.12 Footer (landing variant)

**For:** brand sign-off, links, and social media.
**Source:** `components/Footer.tsx` with `variant="landing"`.

**Parts:** a 4px terracotta top stripe · the gold wordmark (48px) · the slogan · outline social buttons (they open in a new tab, with "(opens in a new tab)" in their labels) · link columns (Create, Account, Company) with gold column titles · a base line in 12px spaced text.

Links are at least 44px tall and turn gold with an underline on hover.

## 2.13 Gold logo

**For:** showing the logo in antique gold (#D8B65A) on forest (5.74:1).
**Source:** `components/landing/TintedLogo.tsx` (comparison heading, gallery card backs); the nav and footer pick the gold file in their landing variant (`navVariant="landing"`, `variant="landing"`).

**How:** a plain image of pre-tinted gold artwork, rendered with `next/image` (nav, footer, auth top bar and Welcome title since 2026-11-08) so it gets a responsive `srcset`:

| File | Use | Size |
|---|---|---|
| `/assets/wordmark-gold.png` | Nav (signed out), footer, comparison heading | 900 × 208 |
| `/assets/logomark-gold-silver.png` | Nav (signed in), gallery card backs | 400 × 600 |

The files live in `frontend/public/assets/` (copies in `design-system/assets/`). They have exactly the shape of the originals (`WordmarkLobster.png`, `LogoMark.png`), which stay unchanged for the rest of the app.

**One exception (owner, 2026-11-03, confirmed 2026-11-08):** the Welcome modal's title, "Welcome to [wordmark]", shows the gold wordmark on the ivory modal with no backing box (`Auth.tsx`, `.auth-welcome-mark` in `auth.css`). It's a large display mark beside its own "Souvenote" alt text, not a logo on a surface. Everywhere else the gold logo sits only on forest.

**Retired (2026-11-08):** `hero-souvenote-card-face.png` (the black card with a yellow S) is an old logo. Don't use it anywhere. The file stays in `frontend/public/assets/` only so old saved snapshots still open. Mock mode's card front is now `mock-card-front.png`: the current two-tone logo on forest with a thin gold frame.

The "S" mark keeps the original's two tones: the "S" in antique gold `#D8B65A` and the music note in platinum `#CBCFD6` (`--sv-platinum-400`, the app's existing `--platinum-mid`). Both are flat colours, like the wordmark. `logomark-gold.png` (all gold, note included) is superseded and shouldn't be used.

**Don't** tint the logo with CSS masks, a hidden image plus an overlay, or `opacity` tricks. Version 1.0 did, and the logo vanished (an empty forest bar) for anyone with *reduce motion* turned on, because the shared navbar hides its overlay layer for reduced motion. It would also vanish in Windows high-contrast mode. A real image is visible in every setting.

**New colour?** Export a new pre-tinted file with the same shape and canvas as the original, and add it next to the others. Don't recolour in CSS.

## 2.14 Engraving motif

**For:** quiet, hand-engraved decoration in empty space.
**Source:** `components/landing/Engraving.tsx`.

**Motifs:** envelope, stamp, heart, notes (music), flower, gift. They are line art only: 1.4px strokes (some details 0.45-1px), round caps and joins, no fill, and the stroke width doesn't scale with size.

**Look:** espresso at 55% opacity, 72-150px wide, each tilted between -14° and +10°.

See [Patterns › Engravings](03-patterns.md#34-engravings) for the placement rules.

**Accessibility:** `aria-hidden="true"` and `focusable="false"`; never interactive.

## 2.15 Skip link

**Source:** `.l-skip`. A forest pill that slides in (200ms) at the top left when it receives keyboard focus, and jumps to `#main`.

## 2.16 Utilities

- `.l-sr-only`: hides text visually while keeping it for screen readers.
- `.l-script`: Lobster Two, 400, berry (gold on forest).
- `.l-wrap`: the 1200px centred content column.
- `.l-section`: side gutters, section spacing below, and a fading hairline divider above.

## 2.17 Questionnaire (Build My Card)

**For:** one focused question at a time inside a create flow. First used by Build My Card (`/create/build-my-card`, 2026-11-07).
**Source:** `components/bmc/` (`BmcQuestionnaire`, `BmcQuestion`, `ui.tsx`), styles in `styles/bmc-questionnaire.css`, scoped under `.souv-bmcq` on a `.souv-landing` page.

**Anatomy:**
- **Page heading** at the top: "Build *My Card*" only (no back link, no subtext).
- **Progress rail:** six pill steps (Photo, Basics, Image, Message, Song, Review). Current takes its stage colour, done is a forest ring with a forest tick on paper and links back (berry on hover; v1.5, so berry stays for emphasis and errors), upcoming is outlined. Phones show numbers only for upcoming steps.
- **Question card:** paper, 18px radius, a 4px top stripe in the stage colour and `--sv-shadow-3`. An h1 with one Lobster Two phrase (no eyebrow), the question sentence as a lede, an optional helper, then the controls.
- **Stage colours** (decoration only, set by `data-stage` in `styles/bmc-polish.css`): Photo terracotta, Basics berry, Image gold, Message berry, Song gold, Review forest. Each colours the card stripe, a faint top tint, the current rail dot and the matching group border in "Your card so far". Occasion, vibe and accessory chips carry a small dot in design-system colours only, never gold (gold means AI; v1.5): a seven-slot rotation (terracotta, berry, oat with a hairline ring, forest, cocoa, espresso, berry) so the colours never line up into stripes in the 2-, 4-, 5- or 6-column grids. (Sage and mauve, used briefly, were not system colours and are gone.)
- **Action bar:** sticky at the bottom of the card. Back (quiet), Skip (secondary, optional questions only) and Continue (forest pill with arrow). It sits at the end of the question, and every control has `scroll-margin-bottom`, so it never hides a field.

**Controls:**
- **Single choice:** radio group (`role="radiogroup"`, arrow keys move). Pill chips for lists of short labels (occasion, finish, visual style, with a colour swatch where the option has one); 16px-radius cards with a sub-line for blueprints, captions and song modes; tiles only when each option carries a sub-line or a picture (card shape, music style). **Never squeeze tiles into narrow columns to fit a long list:** a label must never wrap to three lines or spill outside its box. Use chips instead, at the standard 48px height and 16px text (v1.26). Selected is forest with a tick.
- **What starts chosen (owner, 2026-11-09, v1.34):** a question starts on an answer only when that answer is the usual one, costs nothing, and is easy to change.
  - **Starts chosen:**
    - card shape (Portrait; Personalize uses the card's own default);
    - Build My Card's genre (the top "Suggested" one, once suggestions arrive);
    - Personalize's genre (the card's preset);
    - "What goes in the song?" (Yes and Yes);
    - On This Day's recommended story;
    - border colour (Automatic).
  - **Starts empty, on purpose:** a choice that costs a credit or changes what the card is about. That covers song or no song, the blueprint, who's in the photos, photo or no photo, the caption choice, and a card's occasion, story type and mood.
  - **Accessibility:** ARIA allows a radio group with nothing checked. The first option is still reachable by Tab, and Continue stays disabled until there's an answer.
  - **The exception:** this is the one exception to the audit's "a radio group always has a checked item".
- **Multiple choice:** toggle chips with `aria-pressed`; a counter when there's a limit (vibes: 3).
- **Text:** 14px-radius inputs, 17px text, a spaced-capital berry label, a hint line and a berry error line with `role="alert"`.
- **Custom is always terracotta (2026-11-08):** every set of options ends with a Custom choice (occasion, style, vibes, finish, accents, accessories, border, stickers, pattern, sparkle), as does "Describe in my own words". It's styled with a terracotta edge on a terracotta tint, with espresso text, and becomes solid terracotta when chosen; it opens a text field. Song genres are the exception: the ten fixed genres from the PRD, no Custom.
- **Card pictures in tiles:** card shape (5×7 and 7×5) and blueprint tiles each show a greeting-card-shaped placeholder: the current logo on forest (`CardPlaceholder` in `components/bmc/ui.tsx`), to be swapped for real visual examples. On these tiles the selected state is a forest outline, not a fill, so the card stays visible.
- **AI writer (inside message):** the customer's box fills the open space.
  - Every press of the gold "AI writer · N left" button writes a fresh AI message. There are five in total, the first included, and the button keeps its name.
  - "Write a message" (top left) brings back what the customer wrote.
  - Whichever is on screen at Continue is the one that prints, shown by a "This one will print" badge on the box.
  - **Sign-off (2026-11-08; one select since 2026-11-09, v1.28):** when a sender name is given, a labelled select, "Sign-off", sets how AI drafts sign off: "Writer’s choice" (default), "Love, {name}", "From {name}" or "No sign-off". It applies from the next draft (a hidden description says so), and the customer’s own message is never changed.
    - Once a draft exists, the select sits on the first line of the "What should change?" row, beside its hint.
    - Before the first draft, or with no tries left, it's on its own row under the AI box.
    - It replaced a row of four chips so the step fits one screen (2.33).
- **Personalize "Choose the sound" (2026-11-08):** Build My Card's genre tiles, shared. The card's suggested genre is gold, carries a reason ("Suits a playful Horoscope card.") and is pre-selected until the customer picks. "Your card so far" adds a Sound row.
- **Personalize names step (2026-11-08):** an optional "They’re your… (optional)" field (e.g. sister, mom, best friend) sits beside "How to say their name", two across on desktop and stacked on phones. "Your card so far" shows it as "Maya (sister)".
- **Redraft note (2026-11-08):** once there is an AI draft (message) or lyrics (song), a "What should change?" row sits under the text: up to one quick-pick chip (message: Warmer, Funnier, Shorter, Simpler; lyrics: More upbeat, Gentler, Simpler words, Funnier) and an optional one-line field, up to 120 characters in total. "Funnier" is hidden for Sympathy, Get Well, Thinking of You and Apology. The note goes with the next AI writer or Rewrite press only, then clears. It uses the standard chips and text field.
- **Out-of-date lyrics (2026-11-08):** if the inside message changes after the lyrics were written, the lyrics step shows the stale notice ("Your inside message changed since these lyrics were written." with "Rewrite them" while rewrites are left), and Review shows the same line as a hint.
- **Pronunciation:** an optional "How to say their name" field beside the names in Basics, hinted "Only used to help the singer in your song. Never printed."

**AI is gold:** suggested genres carry a gold "Suggested" badge with a one-line reason; AI text sits in a gold-tinted card with a sparkle icon; AI buttons are gold with espresso text (5.45:1); the working state is three gold dots with a polite live region ("Reading your answer…"). Gold is never text on ivory.

**Message versions (review):** the customer's message and the AI version are stacked in the message panel. The one that prints has a forest ring and a forest "Currently selected to print" badge; the other offers "Print … instead". The customer's own words are selected by default. Yours is terracotta (v1.5): the customer's version, their message box on the message step and their photo thumbnails have a terracotta edge and tint, as the AI version is gold; the forest ring still marks the one that prints.

**Your card so far:** a raised-ivory panel. Sticky on the right from 1024px, a collapsible panel on tablets, a bottom sheet on phones. A small 5×7 (or 7×5) card preview, then answers grouped by stage with a "Change" link on each.

**Review (2026-11-08):**
- **Heading:** small, in the top-right corner: "Look it over" and its lede only: no eyebrow and no approved count (v1.25); each panel's status pill shows what is approved. Since v1.5 it is a forest band (16px radius; a slim pill like the nav from 1024px): gold script word, ivory title, oat count, ivory "Continue to delivery" pill.
- **Cards:** three equal cards (Front with a terracotta edge, Message berry, Song gold). Each card's heading uses the design-system Label style (Lato 700, spaced capitals, berry), with a status pill. Front shows the whole 5×7 card. The song shows its QR code, genre and the full lyrics.
- **Decision buttons:** under each card, small two-line buttons (top word over a smaller second line), all on one line:
  - Front: Change / answers · Try again / 1 credit · Approve.
  - Message: Edit / free · AI / writer (only while tries are left) · Approve.
  - Song: Edit / lyrics · Try again / 1 credit · Approve.
  - Accessible names stay in full ("Try again, 1 credit").
- **No approve-all bar:** approving the last piece opens "Approve all three and continue to delivery?" (Not yet / Continue to delivery). After "Not yet", a small "Continue to delivery" button stays in the heading.

**Song QR code** (`QrSongCode.tsx`): the whole code is styled as the logo. Round forest dots (r 0.5, touching), rounded corner markers, and a forest tile with the gold S about 30% of the width (about 9% of the area), on paper, with "Scan me" above and "To Play Song" below in forest spaced capitals. Error correction H, version 5 or larger, a 4-module quiet zone. Decoded with jsQR at 120 to 800px; smaller dots (r 0.43) failed, so don't shrink them. Test-print and scan on real phones before launch. Previews say "Preview · your card gets its own code".

**Accessibility:** 44px minimum targets (main buttons 52px), focus moves to the new question heading, every field is labelled, errors are announced, reduced motion stops the dots and all transitions, and high-contrast mode outlines the selected options.

**No photo, describe them (2026-11-08):** after "Describe them instead", up to two optional follow-ups ask only for what the description leaves out ("Their *hair*", "What they *usually wear*", "Anything they're *known for?*"). They appear only when the description is about a person, and skipping one ends them. The same rule and wording are used in Personalize a Template (`bmc/lookDetails.ts`).


## 2.18 Dialogs (Build My Card)

**Source:** `components/flow/FlowDialog.tsx` (the shared shell, also used by Cart and Delivery), with Build My Card's dialogs in `components/bmc/BmcAttestationDialog.tsx` and `components/bmc/BmcDialogs.tsx`, styles in `styles/bmc-dialogs.css`.

**Shell:** paper panel, 22px radius, a 4px top stripe whose colour says what kind of dialog it is, a forest scrim at 60%, 44px close button. Rendered into `<body>`; the page behind is inert, Tab stays inside, Escape closes, focus returns to the control that opened it, and page scroll is locked. Actions sit bottom right (stacked full width on phones), with the primary forest pill last.

| Dialog | Stripe | Notes |
|---|---|---|
| Image-rights attestation | Berry | **Since 2026-11-08 (no scroll gate):** the photos waiting (no eyebrow since 2026-11-09), the five promises in full with links to the Terms and Privacy Policy, then two unticked checkboxes that both unlock Agree & continue. Legal text in `components/attestationContent.ts`. **Phones (v1.31):** two screens, "Next: confirm" then "Back" (see 2.33). |
| Sign up to continue | Forest | Same copy as before, plus the gold "Includes 2 free credits" pill |
| Creating your card | Gold (AI) | One row per piece with its own status; can't be dismissed while working |
| Top up to create your card | Gold | Shared: `components/flow/TopUpChoiceDialog.tsx`. **"redo"** variant (v1.35): a paid "Try again" on Review says "Top up to make a new *version*", "Make the new version now, then send your card." and "…you'll come straight back to your review." **"create"** variant: only when a paid action is pressed without enough credits (never on the way through the questions). "This uses N credits and you have M", then two options: Top up cards (Best value: printing, shipping and 10 AI credits) and Top up credits only. "Your card is saved" note; choosing saves the draft and opens the Top up pop-up, returning to the draft after payment. The **"entry"** variant (Personalize a Template on opening, 2026-11-08) was removed the same day (owner): no flow asks about credits before the moment of spending. |
| Confirm a credit | Gold | `role="alertdialog"`, states the balance and the cost before anything is spent |
| Your card so far (phones) | Terracotta | A bottom sheet: full width, flush with the bottom edge, top corners rounded. Described by a hidden line, "Your answers so far, grouped by stage. Choose Change to edit one." (v1.27) |

**Rules:** one script phrase in each title; say the cost before spending; never close a dialog that is mid-way through a paid action; reduced motion removes the entrance and dot animations.

## 2.19 One-screen steps and phone sections (Build My Card)

**Desktop (1024px and up):** each step is one screen. The page is `100dvh` tall: title and progress rail in the top row, the question card and "Your card so far" below. The card is a column: question at the top, controls in the middle (they scroll only as a last resort on very short windows), and the action bar pinned at the bottom. Long lists use wider grids (six style tiles, five genre tiles, accent group tabs, a drop-down per accessory) rather than scrolling. Review puts its three panels side by side, with the approval bar underneath.

**Phones (under 600px):** a step with several sections shows one per screen (`useSections` in `components/bmc/ui.tsx`). There is no visible section marker (v1.25): the section's own heading names it, the action bar's Continue becomes "Next: …", and Back steps back a section before leaving the step. Screen readers still hear the change: `SectionAnnounce` (in `ui.tsx`) is a hidden polite line, "Part 2 of 3: Who wears the crown?", and on Review, Previous and Next move focus to the new card's heading (v1.27, [2.33](#233-build-my-card-and-personalize-focus-busy-buttons-and-fit-2026-11-09)). This applies to the song and QR code, each accessory's wearer and the Review panels. (The message versions and the attestation no longer split: the AI writer replaced the two versions on 2026-11-07, and the attestation's reading screens went with the scroll gate on 2026-11-08; since v1.31 the attestation is two phone screens, the promises then the ticks.)

**Page heading:** "Build *My Card*" only. The current question stays the page's only `h1`.

**No box scrolls on its own (QA, 2026-11-07):** desktop pages are at least one screen tall. Normal answers fit exactly; longer content makes the page longer rather than adding an inner scrollbar. Ways it stays compact:
- "Your card so far" is an accordion: the current stage open, the others one line each with a +, values clamped to two lines.
- Chip lists are even grids (four columns; five for vibes at 1280px and up).
- Custom fields use a descriptive placeholder, with the label kept for screen readers.
- Review sizes the 5×7 front to the screen and shows the non-printing message version in two lines.

The only exception is the legal reader in the rights dialog, which must be scrolled to the end. On phones the progress rail shows only the current step's name.

**Grids by screen size (QA, 2026-11-08):**
- **Phones:**
  - Option chips sit in an even two-column grid with rounded-rectangle shapes; a lone last item ("Describe in my own words") spans the row.
  - Card-shape tiles stack.
  - The "at a glance" table puts each label above its answer.
- **Tablets and up:** a group of three option cards always sits three across.
- **Desktop "Your card so far":** a stage with more than five answers shows each on one line, and nothing opens until the current stage has answers.

**Decision buttons:** a toggle keeps one accessible name (for example "Approve front"); `aria-pressed` says whether it's on. **Its visible word stays "Approve"** (2026-11-09, governance v1.37): the done look (forest ring and tint, tick) and the panel's "Approved" pill show the state, so the visible label is always part of the name (WCAG 2.5.3). "Write a message" and "Leave the inside blank" are toggle buttons for the same reason.

## 2.20 Personalize a Template (gallery and card questionnaires)

**Source:** `components/PersonalizeTemplateClient.tsx`, `components/personalize/*` (catalogue, card files in `templates/`, `PtGallery`, `PtSuggestBox`, `PtQuestionnaire`, `PtQuestion`, `PtSummary`), styles in `styles/personalize.css` (scoped `.souv-pt`) on top of Build My Card's `bmcq-*` styles.

**Gallery:**
- **Heading:** "Personalize a *template*" (the page's `h1`, no eyebrow) with the spinning comic card (hidden on phones).
- **Toolbar (2026-11-08):** the search leads (up to 720px wide). Beside it is a quiet link, "Can't find it? **Suggest a card**" (berry, underlined); on phones the link sits under the search. The link scrolls to the suggestion band at the end of the gallery and puts the cursor in the idea field, bringing along any search words.
- **Occasion chips:** toggle buttons with `aria-pressed`, on one line that scrolls sideways, with an arrow on each side (`PtScrollRow`). They filter across every row, as search does.
- **Rows:** one per heading in the ideas PDF, in its order. Each is a horizontal list with no visible scrollbar and a 44px forest arrow on each side (tablet and up). Hovering an arrow glides the row until the pointer leaves; pressing jumps most of a screen; an arrow fades out at its end. Phones swipe.
- **Tiles:** a placeholder card (the two-tone logo on forest, `CardPlaceholder`) with the name.
  - A template with a card file is one button ("Personalize Horoscope") with a forest "Personalize →".
  - Every other template is a "Coming soon" tile: the name and an outlined label, not focusable and not clickable.
  - The tiles are general examples of each template, not the customer's final card.
- **Signed out:** only the Most popular row, then a raised sign-up band. Search and the chips open the sign-up dialog.

**Suggestion band ("Looking for something else?"):**
- A full-width paper band at the end of the gallery, with a terracotta top stripe. It used to sit beside the search and competed with it.
- On the left (stacked on screens under 900px): a section heading with one script word ("Looking for something *else?*") and one sentence.
- On the right: the idea field on its own row (300 characters, grows), then the email field (pre-filled from the account) beside a forest "Send idea" pill.
- A one-line privacy note with a link to the Privacy Policy.
- Errors are announced. After sending, a check and "We'll email {email} when it's ready", plus "Suggest another".
- A search with no results offers "Suggest '{search}' to our team", which fills the idea field.

**Card questionnaire:**
- Same shell as Build My Card: question card, "Your card so far" with the template's placeholder card, and a progress rail with only the stages the card uses (Details, Photo, Design, Words, Song, Review).
- The template's name replaces the page title, with "Choose a different template" beside it.
- New controls:
  - **Date:** month, day and year selects in one row. Horoscope shows "That's Pisces." in berry, because the app works it out, not the AI.
  - **Choice with a write-in:** radio cards plus a forest "own words" option that opens a text field.
  - **AI suggestions:** the same radio cards with gold "Suggested" badges, plus "Suggest more" (initial draft plus 5) and a write-in.
  - **Story candidates (On This Day):** radio cards with the headline, a summary and a 44px source link (opens in a new tab), a gold "Recommended" badge, and "Also show lighter or neutral stories".
    - **Three stories first** (the chosen one always shows), then a "Show N more stories" link. Focus moves to the first story it reveals.
    - From 1024px the stories sit three across, and the research note and the lighter-stories option share one line (v1.30).
  - **Storyboard (Comic Card):** four numbered panels. Each has an action field and up to 2 bubble or caption fields with word counters (about 8 words). "Rewrite storyboard" (initial plus 5) and "Approve storyboard".
    - **Desktop (from 1024px):** one row per panel: the number, what happens, then the two bubbles, all four on one screen. "Rewrite storyboard" sits in the action bar, like "No photo? Describe them instead".
    - **Tablet:** 2 × 2.
    - **Phones:** one panel per screen, with "Next: panel N" (blocked while that panel has no action or an over-long bubble) and a hidden "Part N of 4" line (v1.29, [2.33](#233-build-my-card-and-personalize-focus-busy-buttons-and-fit-2026-11-09)).
  - **Song use:** two chip groups, "Use {name} in the song?" and "Mention {the card's detail}?".
  - **No photo, describe them:** on cards whose no-photo front shows the person, "How do they *look?*" (open text, optional), then up to two follow-ups that each name one missing detail ("Their *hair*", "What they *usually wear*", "Anything they're *known for?*"), each with Skip.
  - **Create:** a card-shape switch (portrait or landscape, defaulting to the template's), the cost list, and the front words to check.
- Review is Build My Card's, with the card's front notes. **The words printed on the front aren't a note:** they sit in a closed "Check the spelling (N)" disclosure (`FrontWords` in `bmc/ui.tsx`, from the card's `writerBrief().frontText`).
  - It appears on Review and on "Ready to create", for all four cards.
  - The summary is a 44px underlined forest link.
  - Opened, it lists each printed line in quotes.
  - On Review the front picture gives up the room it needs (v1.30).

**Colour in Personalize a Template (2026-11-08)**, each within its rule:
- **Stage colours** for Personalize's own stage names: Details and Words berry, Photo terracotta, Design gold (the front is AI-made), Song gold, Review forest. They colour the card stripe and tint, the current rail dot, and the stage groups in "Your card so far".
- **"Your card so far"** uses Build My Card's accordion, grouped by stage.
- **Template tones:** each template has one of the landing gallery's five tones (`templateTone` in `catalogue.ts`: gold, forest, paper, terracotta, berry, in catalogue order). Its tile shows the tone with the template's name in script, and a small swatch of it sits beside the name in the questions header (also shown on Review).
- **Coming soon** tiles are raised ivory with a terracotta top stripe and cocoa text.
- **Row headings** carry a short terracotta stripe.
- **Occasion chips** carry the shared tone dots ("All" has none).
- **AI suggestions** (for example "Picture the symbol") sit in the gold AI box (`bmcq-ai-block`).
- **The sign-up band** is forest, with ivory heading, gold script word, oat body text and an ivory button.
- **The star sign** is a terracotta chip with deep-espresso text.
- **The chosen On This Day story** is raised ivory with a berry edge; sources are cocoa.
- **The song step** shows the logo QR preview beside the choices.
- **Four option cards** sit two by two from 600px.
- **Class names:** the suggestion band uses `pt-idea-*`. `pt-suggest` belongs to the AI suggestion box.

## 2.21 Create option cards: song badge

**For:** marking the create options that can come with a song, in the Welcome modal (`Auth.tsx`) and on `/create` (`CreateOptionsClient.tsx`). Added 2026-11-08.
**Source:** `SongMark` in `components/WelcomeSketches.tsx`; the `song` flag in `components/createOptions.ts` (Personalize a Template and Build My Card are `true`; Community Cards and Saved Cards & Songs are `false`); styles in `styles/opened-card.css`.

**Look:** a round antique-gold badge with an espresso music note (5.45:1). Gold because the song is AI-made, matching the landing page's song chip. It sits at the bottom left of the card's inside right, opposite the round arrow, and is the same size as the arrow on each screen (`auth.css`, `create-options.css`).

**Accessibility:** `role="img"` with the label "Can include a song", so the link reads, for example, "Build My Card … Can include a song".


## 2.22 Content page shell and page head (2026-11-08)

The shell for the content and account screens: FAQ, Contact, legal, Community Cards, Saved Cards & Songs, Profile, Settings, and not found.

**Code:**
- `ContentPageShell` (`components/content/ContentPageShell.tsx`) wraps `FlowPageShell`, so it has the same nav, backdrop, skip link and footer as Cart, Delivery and Pricing. It adds the `.souv-content` scope for `styles/content-pages.css`.
- Pass `signedInOnly` for account screens. Indexing is set per route.

**Page head:** `ContentPageHead` renders the page's one h1 with no eyebrow above it ([Foundations 1.2](01-foundations.md)), using the shared `.cf-head` type from Pricing and Cart:
- a light Lato title with **one** Lobster Two phrase (`<span className="l-script">`);
- an optional lede.

**Not-found card (`.nf-card`):**
- a paper tile with a terracotta top stripe, centred in the viewport;
- a forest **Go to Home** pill, then underlined text links (44px targets);
- signed-in visitors also get Create a Card and Saved Cards & Songs.
- It never names a specific missing page.

## 2.23 Library, account and settings pieces (2026-11-08)

All of these sit on the existing tokens, with no new colours. Live styles: `styles/content-pages.css`.

**Saved Cards & Songs (`.lib-*`, `components/MyCards.tsx`)**
- **Draft row:** a paper tile with a terracotta left stripe and a 5×7 forest logo thumbnail, holding:
  - the title;
  - the flow and the stage it stopped at;
  - a forest progress bar with "Step N of M";
  - **"Saved until {date}"**, which turns berry and bold as "Expires soon" inside 30 days.

  Actions: a forest **Resume** pill and a berry underlined **Delete** text button (44px).
- **Finished card:** the 5×7 front (or the logo placeholder) above a terracotta-topped body, with the title, what's inside, "Saved until", a forest **Print and send, {catalog price}** pill and Delete.
- **Song row:** the landing **song chip (2.7)** when the asset has a playable address; otherwise a static paper row with a gold left stripe (the song is AI-made).
- **Empty state:** a dashed paper tile with one forest action. **Signed out:** the same tile with Log In and Sign Up.

**Confirm dialog (`components/content/ConfirmDialog.tsx`):** a `FlowDialog` with `role="alertdialog"` and a berry stripe, a one-line consequence, then Cancel (secondary) and the action (forest). Used for deleting cards, recipients and payment methods, turning off two-step sign-in, and signing out everywhere.

**Profile (`.acc2-*`)**
- an identity tile (forest avatar with gold initials, name, email, member since, Edit details);
- four balance tiles (light 30px numbers);
- the 12-month expiry note (was 15 before audit B13);
- Top up credits and See pricing;
- link tiles that get a berry left stripe on hover.

**Settings (`.set-*`)**
- **Layout:** a list of section links (`#personal`, `#security`, `#payments`, `#recipients`, `#preferences`, `#delete`).
  - Desktop (900px+): a sticky left list; the current link is a paper tile with a berry stripe and `aria-current`.
  - Below 900px: the list, then one section on its own with an "All settings" link back.
- **Sections:** terracotta-topped paper cards with a light 24px h2 that takes focus when opened. Subsections are split by a paper line.
- **Status line** under each form: forest bold for saved, berry bold for errors (`role="alert"`), muted for "Saving…".
- **Two-step setup dialog** (forest stripe, "Turn on two-step *sign-in*"):
  1. a QR code (forest on paper) floated beside its line, with the key as copyable text (compact since 2026-11-09, 2.31);
  2. a 6-digit code field (22px, spaced digits). A short or wrong code is shown on the field and focused.

  Then the lost-phone line.
- **Delete account:** "What's removed" / "What's kept" lists, then a dialog that needs DELETE typed before the berry-text action unlocks.

**Log In code step (`auth.css`, existing styles):** after the password, one "Authenticator code" field (`autocomplete="one-time-code"`, numeric, 6 digits), "Verify & Log In", and "Back to email and password".


## 2.24 FAQ, Contact, legal, cookie banner and upload consent (2026-11-08)

On the existing tokens; no new colours. Live styles: `content-pages.css` (`.faq-*`, `.ct2-*`, `.lg-*`), `landing.css` (accordion additions), `cookie-consent.css`, `attestation.css`.

**FAQ**
- **Accordion:** the existing landing accordion (2.11), now shared as `FaqAccordion`. Answers are blocks (paragraphs, bullet lists, and a price table with a caption and row headers) and stay in the HTML while closed.
- **`/faq` page:** topic pills (outlined, 44px) that jump to group headings in small spaced berry capitals, then a terracotta-topped "Still need help?" tile.
- **Landing / Home:** the six landing questions and a "See all questions" link.

**Contact:** on desktop, a column of small paper tiles (Email us, About an order, Quick answers, Follow us) beside a terracotta-topped form. Below 900px the form comes first.
- **Form:** fields, a character counter that turns berry and bold when over the limit, the privacy line, and a forest pill.
- **Sent:** a thank-you with the reference number; focus moves to its heading.

**Legal pages:**
- an h1 with one Lobster Two word;
- a berry-bordered **draft notice** while a policy is unapproved;
- **contents:** a sticky list on desktop (1024px+), and a collapsible `<details>` "On this page" below that;
- **text:** about 72 characters per line on a paper card, light 24px section headings that link to their own anchor, and wide tables that scroll sideways inside the card;
- **missing facts:** highlighted marks (`.lg-missing`);
- print styles drop the nav, footer and contents.

**Cookie banner:**
- a bottom-left paper card (full width on phones, above the safe area) with a terracotta stripe;
- **Decline and Accept are identical forest pills** (equal weight), with nothing pre-chosen;
- it doesn't block the page;
- when reopened from "Cookie settings", focus goes to its heading and the current choice is shown. After Accept or Decline, focus goes back to the "Cookie settings" that opened it.
- **"Cookie settings" is in two footers (2026-11-09):** the landing footer, on the copyright line, and the sign-in screens' small footer (`AuthFooter` in `Auth.tsx`, every `/login`, `/signup`, `/forgot`, `/verify`, `/reset`, `/recover` and `/signup/terms` state), after Privacy, Terms and Help. There it's a button styled exactly like those links: 12px Lato bold spaced capitals, cocoa, 44px tall, 10px side padding, underline on hover (`.auth-foot-cookie` in `auth.css`). On phones it wraps to its own centred line.
- **Opener:** the button passes itself to `openCookieSettings(opener)` (`lib/consent.ts`), because Safari doesn't focus a button on click. The banner never records `<body>` as the opener; with no opener it falls back to the page's `h1`.

**Upload consent:** the berry-striped dialog shows the photo strip, the promises in full on a raised-ivory panel with links to the Terms and Privacy Policy, then two unticked checkbox rows. Agree & continue unlocks when both are ticked. The old two-document reader and scroll gate are gone.


## 2.25 Community Cards (2026-11-08)

`components/community/*` and `styles/community-cards.css`, on the existing tokens. **No gold:** Community Cards aren't AI-made.

**Page head:**
- the approved lede;
- three raised-ivory fact pills ("Write your own message inside, free", "No AI credits used", "Printed and mailed to Canada or the US").

**Everyone, signed in or not (owner, 2026-11-09; also the prerendered HTML):**
- a search field, then the occasion chips. These are paper pills with a 1px line; the selected one is filled forest with ivory text and `aria-pressed` (audit I2), with tone dots ("All" has none). They're in a Personalize scroll row with arrows.
- Then one scroll row per occasion. Searching or picking a chip switches to a grid with a count and "Show all cards".

Retired 2026-11-09: the signed-out view of 8 public examples and the "See every *card*" band. Only sending needs an account.

**Tile:** a paper card, every one the same shape (2026-11-09 clean-up). It holds:
- one 5×7 frame for every card, with the forest logo placeholder until the artwork is approved. A landscape front sits in it as a 7×5 card, centred on raised ivory with a shadow, and screen readers hear "Landscape card";
- the name (bold, always two lines tall, cut off with … after two), so the buttons line up across every row;
- the occasion, only in search and "All" results, where occasions mix (the rows already name it);
- a full-width forest pill: **Send this card**;
- under it, a full-width outlined pill with the share icon: **Share link** (opens the Share pop-up).

**Send this card pop-up** (terracotta stripe):
- the card front beside the title ("Send *{name}*") and the free / no-credits lede. **No eyebrow** (owner, 2026-11-09: no "Community Card · {occasion}" line anywhere);
- the inside message textarea, with a counter for characters and lines (berry and bold when over 500 characters or 4 lines);
- a "Leave the inside blank" checkbox;
- a note on payment and no song;
- Cancel and **Send this card**.

**Guest pop-up** (berry stripe, `fd-mid`; Community Cards audit C8, 2026-11-09): the card front (120px; 72px on phones) beside the title, "Log in to send *this card*" (O5) and "Sending "{name}" is for Souvenote accounts…", then **Share link**, Log In and Sign Up. The links come back to the same card (`?card=id`).

**Send again** (audit C7): sending the same card again in the tab reopens your message and updates that draft instead of saving a copy.

**Links:**
- `?card=id`: opens the card, following renamed ids (`COMMUNITY_CARD_ALIASES`).
- An unknown id shows one raised line under the lede: "That card isn't available any more. Here are all our Community Cards." (audit C9).
- `?submit=draftId` opens "Share a card I made" with that card chosen.

**A card's own page** (`/community-cards/{id}`, audit C11), the address every Share link points to:
- a paper panel with the card front (320px, 5×7 frame; landscape inside it as 7×5);
- the name as the page's `h1` (Lato light) and a lede;
- **Send this card** and **Share link**, two equal pills;
- "See all Community Cards".
- Its own title, description, canonical and preview image (the card front). Built statically for the 58 cards and the renamed ids; other ids are a 404.

**Share a card you made (2026-11-09):** `CommunityBand.tsx`, `CommunitySubmit.tsx`, `CommunityShare.tsx`. **Forest** marks sharing; still no gold.
- **Band** under the fact pills: a paper card with a 6px forest left edge.
  - It has the heading "Have a card the public would *love?*", a lede, and a forest **REVIEWED FIRST** pill with the line "Every card is checked by our team before it's posted" and a "What we can and can't post" text link.
  - The buttons stack on the right from 860px: **Build a card for the Community** (primary, everyone) and, signed in, **Share a card I made** (secondary).
  - "Build a card for the Community" opens Build My Card with `?for=community`, titled "Build a card for the *Community*":
    - the Photo tab is called **Front** and the step is "What's on the *front?*": describe only, no upload, no Back, no hair or clothes follow-ups;
    - "Who it's from and to" is skipped, and the story and inside-message steps are worded for a card anyone could send;
    - there's **no song**: the tabs read Front / Basics / Image / Message / Review, and "Ready to make it" sits under Message;
    - Review starts with a raised row with a 6px forest edge, "Happy with your front? Share it with the Community…", and **Share to Community Cards**, which opens the submit pop-up on this card;
    - the draft is saved as a community card, so it reopens in this mode.
- **Your shared cards** (signed in, once there's one): paper rows with a 56px front, the name (one line) and occasion, and a status pill: In review (raised), Posted (forest), Changes requested (terracotta), Not approved (berry outline).
- **Share pop-up** (forest stripe, `fd-mid`):
  - a small front beside the title "Share *{name}*" (no eyebrow);
  - a Share from this device button (only where the browser has a share sheet);
  - five outlined network pills (Facebook, X, Pinterest, WhatsApp, Email), each named "Share on {network}: {card}";
  - a read-only link field (the card's own page) with Copy link, and a note for Instagram and TikTok.
- **Guidelines pop-up** (berry stripe, `fd-wide`; audit C5):
  - five disclosures, all closed at first, with one open at a time: What we can post (forest), Causes and statements we welcome (forest), What we can't post (berry), Grey areas (terracotta) and How review works (espresso);
  - each heading is a 48px row with a +/− mark;
  - closed, it fits one screen at every size, including 375×667. An opened long group scrolls the pop-up.
- **Submit pop-up** (forest stripe, `fd-wide`):
  - radio cards of eligible designs (selected: forest ring);
  - Card name (40) and Occasion;
  - a raised "Before you share" panel with the full guidelines in a disclosure;
  - two required agreement checkboxes;
  - Submit for review.
  - It ends on "Thanks, it's in *review*".
- **Short phones** (≤700px tall): the Send, guest and guidelines pop-ups use the same tighter top, title and gaps as Build My Card's pop-ups, so they fit one screen. Every word stays.

## 2.26 Country and currency (2026-11-08)

Canada pays CAD, the US pays USD. On the existing tokens; no new colours.

**"Prices for" switch** (`pricing/PriceCountrySwitch.tsx`, `.pc-switch` in `pricing.css`):
- **Signed out:** the label "Prices for:" and two 44px pill buttons, Canada and United States. The chosen one is filled forest (`--l-btn-bg`) with `aria-pressed`; the other is paper with a 1px line.
- **Signed in:** no buttons, just the note "Prices for {country}, in {currency}."

**Currency code:** big prices carry a small spaced-capital code after the amount ("$9.99 CAD"; `.pr-cur`, 0.42em, bold, raised). Totals in the cart and payment pop-up end with the code too. Shorter copy elsewhere uses "$6.99 CAD or $4.99 USD".

**Read-only country and currency** (Settings): a read-only field with the note "Your prices are in {currency}. To change your country, email cameron@souvenote.com."

**Cart notice:** when stored items were priced in the other currency, a quiet line above the items: "Prices are shown in {currency} for {country}, your account's country."

**Estimated tax:** a summary row labelled "Estimated tax", with the note that the exact amount is worked out at payment.

## 2.27 After-purchase pop-up: "Your cards are waiting" (2026-11-08)

**For:** pointing a customer to where they can use what they just bought.
**Source:** `pricing/PrintSendReadyModal.tsx`; the one-line explanations are `short` in `components/createOptions.ts`; styles `.pr-ready-*` in `styles/pricing.css`.

**When it shows:** over the cart's "Payment confirmed" screen after paying for Print and Send, a Big Sender pack or a credits pack. It doesn't show when the purchase started in Delivery or Build My Card; those go straight back to the card. The title is "Your cards are *waiting*", or "Your credits are *waiting*" when only credits were bought.

**Look:**
- The usual paper pop-up: 22px radius, terracotta top stripe, forest scrim. It's up to 660px wide, so every option title fits on one line.
- **Four option cards:** Personalize a Template, Build My Card, Community Cards, Saved Cards & Songs.
  - Each card is ivory (`--l-bg`) with a 1.5px hairline edge and a 16px radius.
  - It has a bold espresso title, a forest arrow and one cocoa line saying what the option does.
  - A small dot names each option. It's decoration only: terracotta, berry, forest or cocoa, never gold.
  - On hover the edge, title and arrow turn berry on the berry tint, and the card lifts 1px.
- **Layout:** 2×2 from 520px, so titles share a top line across each row; one column on phones. It fits one screen at every size, with nothing scrolling inside it.
- **Before (2026-11-06 to 2026-11-08):** four pill buttons filled gold, berry, forest and espresso. They were retired because gold means AI and berry means emphasis.

**Accessibility:** a dialog labelled by its title and described by its sentence. Each option is one link whose name is the title followed by the explanation. Escape, the close button and a press on the backdrop close it; focus returns. Reduced motion removes the lift; high-contrast mode outlines the cards.

**Credits (related, 2026-11-08):** nothing checks credits on the way in: not `/create`, not this pop-up, and not Personalize a Template on opening (its "Before you start" pop-up was removed). Personalize a Template and Build My Card ask for a top-up only when Create, or a paid redo, is pressed without enough credits. That uses the cards-or-credits choice (2.18), and the server's "insufficient credits" reply opens the same choice.

## 2.28 Signed-in menu and shared form behaviour (2026-11-08)

From the site audit's Phase A fixes (`build-fixes/mock-data-mode-2026-11-07/SITE-AUDIT-2026-11-08.md`). No new colours.

**Signed-in menu** (the round menu button; `Navbar.tsx`, `.souv-popmenu-site` in `landing.css`):
- **Width and pairs:** 320px wide, or the bar's width on phones. Related links sit two across in `.souv-popmenu-pair` rows:
  - Profile | Account Settings;
  - Top Up Cards | Top Up Credits;
  - the bar's four links (phones only);
  - FAQ | Contact Us;
  - Terms of Service | Privacy Policy;
  - Cookie Policy | Refund Policy.
- **Full-width items:** Saved Cards & Songs and Sign Out keep a full row.
- **Spacing:** every item is at least 44px tall and starts on the same 10px left edge.
- **Fit:** the whole menu fits the screen (492px at 1280×720, 603px at 375×812), so nothing scrolls inside it. The max-height scroll stays only as a last resort for very short windows. On phones the long link names wrap to two lines, as they do in the bar.

**Dialogs:** every dialog uses `flow/FlowDialog`. That includes the cart's "Log in before *checkout*" (`AuthGatePrompt.tsx`): forest stripe, no eyebrow (2026-11-09), Log in (secondary) then Sign up (primary), and a quiet pricing link (`.fd-note`).

**Forms** (`flow/FlowField.tsx`):
- **After a failed submit:** call `focusFirstInvalid(form)`. Focus lands on the first field marked `aria-invalid`, and its error is read with it. Used by Contact, Community Cards' Send and Change password.
- **Double presses:** a submit that saves or sends keeps an in-flight ref as well as its busy state. A second press in the same instant does nothing. Used by Contact, Community Cards' Send and `content/ConfirmDialog`.
- **Busy buttons stay focusable (2026-11-09):** while a button's action runs, it gets `aria-disabled="true"`, not `disabled`, and its handler ignores presses (`if (busy) return`). A focused button that becomes `disabled` loses focus to `<body>` in Chrome, so the "Saving…" label and the result were never read. Look: opacity 0.7, `cursor: progress`, no hover lift (`.souv-flow .l-btn[aria-disabled]` and the dialog rule in `checkout-flow.css`; `.auth-submit`, `.auth-submit-secondary` and `.auth-link` in `auth.css`). `disabled` stays only for "can't yet" states that the person hasn't pressed (Delete account before DELETE is typed, Terms not accepted, a password already changed) and for Cancel while saving. Used by Checkout (first), Delivery's main button, every Settings form and the Preferences select, `ConfirmDialog`, the two-step and Delete account dialogs, Contact, Community send, and every sign-in submit, "Resend code" and "Resend reset code".
- **Steppers and arrows at their limit (2026-11-09):** the same rule. Cart's quantity "−" at 1, Pricing's Big Sender "−" at its minimum, and the landing gallery's arrows at either end get `aria-disabled` (same dimmed look) and ignore presses, so focus stays on them. **Scroll-row arrows** (`personalize/PtScrollRow.tsx`, used by Community Cards and Personalize's gallery; owner-approved 2026-11-09):
- **At the edge:** `aria-disabled`, and a press does nothing. They're out of the tab order (`tabIndex=-1`), as `disabled` was, except the arrow that already has focus.
- **Look:** still faded out (opacity 0, no pointer events), so mouse users see no change. If the keyboard-focused arrow reaches the edge, it stays visible at 0.4 (`:focus-visible`) until focus moves on.

**Focus when a control disappears:** focus never falls to `<body>`.
- Cookie banner: back to "Cookie settings" if that opened it, otherwise the page's `h1`.
- Contact "Send another message": the form heading.
- Saved recipients after a save or delete: "Add a recipient", or the open form's heading.
- Payment methods after Remove: the form heading.
- Two-step Turn on / Turn off: the button that replaces it.
- Saved recipients Cancel: "Add a recipient". Payment methods Edit and Cancel: the form heading ("Edit payment method" / "Add a payment method").
- Log In "Back to email and password": the password field (the code step's message and error are cleared).
- **After a page change (2026-11-09):** `components/RouteFocus.tsx` (in the root layout) moves focus to the new page's `main h1` after every client-side navigation, but not on first load. It leaves focus alone if the page has already put it inside `<main>` (a code field, a questionnaire heading) or in a dialog (the Welcome modal). It waits up to about a second for the heading. It covers every route, Build My Card and Personalize included, without touching their files.
- **Log In code step:** a short or wrong code also marks the field (`aria-invalid`, berry outline) and focuses it; the form's alert line still says why. Typing clears it.
- **Field errors on dialogs and Settings forms (2026-11-09):** the two-step code, "Last four digits" and a saved recipient's fields show their error on the field (`FlowField` `error`, so `aria-invalid` and `aria-describedby`), and `focusFirstInvalid` moves focus there. Delete account's failure messages (B6) are focused the same way, since both of its buttons are busy while it runs.

**Cookie banner on every screen:** `CookieConsent.tsx` loads `landing.css` itself. That gives the banner its 56px forest buttons and palette on the sign-in screens, which don't load the landing styles. Every rule in `landing.css` is scoped under `.souv-landing`.

**Legal pages:** `.lg-layout` has a `minmax(0, 1fr)` column, so on phones the contents and tables stay inside the screen. A wide table scrolls sideways inside its own box: the one accepted exception, along with the rights-dialog reader.

**Honest failure messages:** when a two-step action half-succeeds, the message says which half worked. A retry repeats only the step that failed.
- **Checkout:** "Your payment went through, but we couldn't add it to your account yet…". The button becomes "Add it to my account", reusing the same idempotency key.
- **Delete account:** data deleted but sign-in not closed.
- **Change password:** changed, but other devices not signed out.
- **Delivery:** a retry reuses a pending order made from the same inputs.

## 2.29 Consistency pass on the shared screens (2026-11-08)

From the site audit's Phase B (`build-fixes/mock-data-mode-2026-11-07/SITE-AUDIT-2026-11-08.md`).

**Top up pop-up, compact** (`pricing/TopUpModal.tsx`, `.tu-overlay` rules in `pricing.css`; `/pricing` is unchanged):
- **From 600px:** slimmer padding and heading, and the two offers side by side from 700px. Big Sender's "How many cards?" sits on one line. The three credit packs sit three across.
- **"How it works":** starts closed behind a 44px "How it works +" toggle (`<details>`, via `compactHow` on `PricingCardPacks`). Opened, the steps sit three across and the pop-up grows like a page.
- **Fits:** cards 678 / 689 / 700px and credits 602 / 626 / 620px at 1280×720 / 1024×768 / 768×1024.
- **Buttons:** labels never wrap (15px from phone to tablet).
- **Phones:** the packs still stack, so the whole pop-up scrolls like a page.

**Checkout pop-up, compact** (`.fd-checkout` in `checkout-flow.css`):
- **Layout:** from 600px the card fields take two rows (number; expiry, CVC, postal code), with tighter gaps. From 700px the summary sits beside the form.
- **Fits:** 639px at 1280×720 and 650px at 768×1024.
- **Title:** "Complete your *purchase*". It's described by a screen-reader line with the total.

**Community Cards send pop-up on phones:** a 72px card picture beside the title and lede (no eyebrow since 2026-11-09), with the message form full width below. It's 745px tall at 375×812, so it fits.

**Community Cards chips:** selected is forest with ivory text (not berry). The occasion chips carry the shared tone dots (terracotta, berry, oat, forest, cocoa, espresso, berry; never gold). "All" has none.

**Even grids:** Community Cards' three facts (one column on phones, three across from 600px) and the FAQ topic pills (two across on phones with a lone last pill spanning, one row from 900px) are grids of rounded rectangles, not ragged centred rows.

**Gold logo only on forest:** the cart's pack thumbnail now has the forest card in front with the gold "S"; the paper card sits behind it.

**No signed-out flash:**
- **The mark:** an inline script in the root layout (`SESSION_HINT_SCRIPT` in `landing/signedInHold.ts`) marks `<html data-souv-session>` before the first paint when a sign-in is stored.
- **While it's there:** the nav's signed-out buttons stay hidden (`landing.css`, lifting after 3s). `AuthProvider` removes the mark when the sign-in isn't valid.
- **Account gate:** while auth loads it says "Opening your *account*", not "Log in to see your account".

**Eyebrows:** none on Delivery or Confirmation since v1.16 (no eyebrow above a page heading). The script phrase ends the heading: "Nothing to *confirm yet*".

**Cookie banner:** no inner scroll. It scrolls only on screens under 480px tall.

**New colours (v1.13):** `--sv-field-line` (#8A7B77, form field outlines, 3.6–4.1:1) and `--sv-graphite-600` (#514C4A, the sketches' pencil handwriting, 7.5:1). See Foundations 1.1. The legal placeholder highlight is a terracotta tint, since gold means AI.

## 2.30 Lesser-used colours on the shared screens (2026-11-08)

From the site audit's Phase D. Each colour keeps its meaning (Foundations 1.1), with no new colours. Before this, these screens were mostly forest, espresso and berry.

| Where | What | Meaning |
|---|---|---|
| Cart, pack picture | Back cards in the gallery's berry and terracotta tones (`--l-tone-5`, `--l-tone-4`). The front card stays forest with the gold logo | Decoration; gold stays for AI |
| Delivery | A 4px terracotta top edge on "Who's it going to?" and "Return address" (`.dv-section.is-yours`) | Terracotta = what the sender made |
| Profile | A 4px top stripe per balance tile: AI credits gold, Cards in your bank forest, Cards made terracotta, Songs made berry | Gold = AI; the rest decoration |
| Saved Cards & Songs | A short 22×4px terracotta stripe before each section heading, as on Personalize's row headings | Decoration |
| Settings (desktop list) | The open section is raised ivory (`--l-raised`) with its berry edge, like the open FAQ item | Raised = open |

**Already in place (checked, unchanged):** Pricing's offer cards have terracotta top stripes; Delivery's forest send bar uses oat for its secondary line; the cart's per-card line is cocoa.

## 2.31 Settings dialogs on one screen, with script words (2026-11-09)

From the audit follow-up that opened the screens the site audit had reviewed only in code (`build-fixes/mock-data-mode-2026-11-07/SITE-AUDIT-2026-11-08.md`, section 7). Owner decisions of 2026-11-09. No new colours.

**Compact two-step setup and Delete account pop-ups** (`.set-totp-dialog`, `.set-delete-dialog` in `content-pages.css`), as for Top up and Checkout (I4). Same content, same order:
- **Both:** 640px wide; the lede runs the full width; 16px above the actions. From 600px, 38px / 36px / 26px padding.
- **Two-step:** the QR code floats beside "Scan this QR code…" and the key (164px box with a 150px code from 600px; 132px with 120px on phones), so step 1 keeps its "1.". On phones, Cancel and Turn on share one row.
- **Delete account:** from 600px, "What's removed" and "What's kept" sit side by side, with the song note spanning both. On phones the lists are 15px with tighter spacing.
- **Fit (tallest at each size):**

  | Pop-up | 1280×720 | 1024×768 | 768×1024 | 375×812 |
  |---|---|---|---|---|
  | Two-step setup | 653 (was 886) | 653 | 649 (was 882) | 718 (was 1016) |
  | Delete account | 586 (was 726) | 585 | 581 | 777 (was 898) |

**One script phrase, last, in each Settings dialog title** (2.18, as Checkout's "Complete your *purchase*"):
- Turn on two-step *sign-in*;
- Turn off two-step *sign-in*?;
- Sign out of *all devices*?;
- Delete your *account*?;
- Delete *{recipient's name}*?;
- Remove *this card*? The card is named in the line below: "Visa ending in 4242 will be removed from your payment methods…";
- Saved Cards & Songs' delete: Delete *"{card title}"*? (same `ConfirmDialog`).

`ConfirmDialog`'s `title` takes the `<span className="l-script">`; the dialog's accessible name still reads as plain text.

**Busy buttons and focus:** see 2.28 ("Busy buttons stay focusable").

**Equal action buttons (2026-11-09):**
- **Delivery's forest bar:** from 600px, "Back to review" and the main button share one width, the wider label's (235px at 1280×720, one line each). At 768 the status text beside them wraps one more line, and the bar is 93px tall (was 80).
- **Contact's thank-you:** "Send another message" and "Read the FAQ" are full width and stacked on phones (295px), and side by side at one width from 600px (280px).

**Debug hooks:** no `window.__…` QA hooks are left outside Build My Card and Personalize, except `window.__souvResetMockData` (Mock data badge), which is set only in mock mode.

## 2.32 High contrast, phone pop-ups and page weight (2026-11-09)

From Prompt 2 (`build-fixes/mock-data-mode-2026-11-07/PROMPT-2-REPORT-2026-11-09.md`). Owner decisions of 2026-11-09. No new colours.

**High contrast (forced colours):** fills and shadows disappear in forced colours, so state and edges need an outline or border.
- **Selected states:** the "Prices for" switch, Pricing's quantity tiers and Delivery's chips (One recipient / Multiple, Send now / Schedule) get `outline: 3px solid Highlight`, as Community Cards' chips already did.
- **Surface edges:** every `FlowDialog`, the Top up pop-up, the cookie banner and the nav menus and popovers get `border: 1px solid CanvasText`.
- **Focus rings** are outlines, so they already survive.

**Nav link names:** the stacked labels ("Personalize / a Template") have a space between their two lines and no `aria-label`, so the visible text is the name ("Personalize a Template").

**Reduced motion:** the nav underline appears without growing. Everything else was already still (hero card, vinyl, pop-up entrances, landing steps, carousels).

**Top up pop-up on phones (below 600px)** (`.tu-overlay` in `pricing.css`):
- **Cards:** a two-button switch, "Print and Send | Big Sender" (`aria-pressed`, forest when selected, 44px), shows one offer at a time.
- **Quantity line:** below 1024px it takes two rows, the label and then the stepper with the total. At 768 the single row had wrapped the label to four lines and pushed the total 29px past the card.
- **Credits:** each pack is a compact row: badge, name and price, credit count, one line, then the Choose button.
- Every price, label and button is kept. From 600px nothing changes.

**Checkout on phones (below 700px)** (`.fd-checkout` in `checkout-flow.css`):
- The order summary starts closed behind a 52px "Order summary · $2.10 CAD +" bar (`aria-expanded`). Opened, it shows every line, the total and the tax note. The Pay button also shows the total.
- The form takes the tighter spacing it already had from 600px.
- From 700px the summary sits beside the form, open, as before.

**Fit at 375×812** (780px inside the overlay):

| Pop-up | Before | After |
|---|---|---|
| Top up cards | 1,329 | 727 (Print and Send), 768 (Big Sender) |
| Top up credits | 1,432 | 745 |
| Checkout | 1,238 | 777 with the summary closed (opened, it scrolls like a page) |

**Page weight:**
- No Google Fonts `@import` (Foundations 1.2).
- `auth.css`, `opened-card.css`, `bmc.css` and `cardart.css` load only with the components that use them, not from the root layout. A computed-style fingerprint showed no change on 46 of 48 captures; the other two caught a list mid-load.
- The comic card images are 800×1127 (about 250 kB, was about 750 kB; originals in `frontend/asset-originals/`).
- AVIF is enabled.
- The share image is a static 100 kB JPEG (`app/opengraph-image.jpg`).
- The app icons are the gold-and-silver mark on forest: `app/icon.png` (512) and `app/apple-icon.png` (180).

**Follow-ups (2026-11-09, governance v1.24):**
- **Delivery's error pop-up** (`BmcErrorModal` in `BmcShared.tsx`, opened with `bmcError(message, title)`) is a `FlowDialog`: `alertdialog`, berry stripe, `fd-narrow`, a title and message, and one primary "Got it" that takes focus. Its titles are system messages ("Address needed"), so they carry no script word.
- **Carousels** (`useCardCarousel`, `/create` and the Welcome pop-up, below 1100px): Left/Right on a focused card move focus and the centre, wrapping round.
- **Community Cards send pop-up:** "Send *{card name}*"; signed out, "Log in to send *this card*" (the name is in the lede) or "Log in to see *every card*".
- **Community send pop-up sizes:**
  - On phones (under 720px), Cancel and "Send this card" share one row.
  - From 720px, the title is 2rem, so even the longest card name fits one screen at every size (at most 747px at 375×812, 653px at 1280×720).

## 2.33 Build My Card and Personalize: focus, busy buttons and fit (2026-11-09)

From Prompt 1B (`build-fixes/mock-data-mode-2026-11-07/NEXT-PROMPT-1B-build-my-card-and-personalize.md`; findings in `SITE-AUDIT-2026-11-08.md` §8). The rules in 2.28 now cover both flows. No new colours.

**Busy buttons stay focusable** (the 2.28 rule, now in the flows). While something is being written or made, the button gets `aria-disabled="true"` and ignores presses; `disabled` is only for "can't yet" (nothing chosen, a lyric over the limit).
- **Where:**
  - The action bar's Continue, including "Create my card" (`Actions` in `bmc/ui.tsx`).
  - The AI writer, Rewrite (lyrics) and "Suggest a caption".
  - Personalize's "Suggest more", "Rewrite storyboard", the "Also show lighter or neutral stories" checkbox and "Send idea".
  - Review's Try again, Approve and AI writer (`StackButton`'s new `busy` prop).
- **No tries left also uses `aria-disabled`** on the AI writer, "Suggest a caption", "Suggest more", "Rewrite storyboard" and "Choose photos" at the photo limit. The last press must not drop focus either.
- **The caption's "Suggest" button stays on screen** while it works. The thinking line replaces only the suggested caption.
- **Look:** opacity 0.7, `cursor: progress`, no hover lift (`bmc-polish.css`, Prompt 1B block). The hover rules read `:hover:not(:disabled, [aria-disabled="true"])`.

**Focus never falls to `<body>`** (`bmc/ui.tsx` helpers):
- `useFocusOnChange(key, ref)` moves focus to the question heading when the question or view changes. It doesn't move focus on first load, including a saved draft that opens on a later question or on Review (the key starts only once the draft has loaded). It's safe under React Strict Mode. On Review the key stays put, so edits there never move focus.
- `useRefocusAfterBusy(busy, ref)`: a control swapped out while busy ("Refresh it", "Rewrite them") hands focus back to the AI writer or Rewrite.
- `useFocusAfterRemove`: removing a photo moves focus to the next remove button, or to Choose photos.
- "Describe them instead" focuses its text box; Back from it returns to the link.
- "Print this one" moves on to Approve message.
- **Personalize view changes** aren't route changes, so `RouteFocus` doesn't run. `PersonalizeTemplateClient` focuses the new view's `main h1` after opening a card, "Choose a different template" and browser Back.
- **Phones:** `SectionAnnounce` reads "Part N of M: …" for the wearer and song sections. On Review, Previous and Next focus the new card's heading (`h2`, `tabIndex=-1`).

**Fit fixes (one screen at 1280×720 and 1024×768):**
- **Photo step with photos added:** the drop zone shrinks to one row (`.bmcq-controls:has(.bmcq-thumbs)`). Build My Card 740 → 720px, Personalize 770 → 720px.
- **"Your card so far" at 1024–1279px:** each answer sits under its label, with Change beside both. Answers are 139px wide instead of 53px, so they're no longer cut to a few letters.
- **"What should change?" on desktop:** the quick picks and the few words share one row. The message step is 62px shorter; it still needs an owner decision (audit §8, D1).
- **Personalize header:** the template name is 1.75rem from 1024px, so "On This Day · Choose a different template" stays on one line beside the rail. It had wrapped, adding 38px to every On This Day and Comic Card step. A long saved-template name can still wrap.
- **On This Day's lead stories** sit two across from 1024px, with tighter cards (1021 → 877px; the rest is decision D4).
- **"Top up to create your card" on phones:** tighter options and note, 851 → 664px at 375×812. Larger sizes are unchanged.
- **Review's lyrics editor and the lyrics step's editor** grow with the lyrics (`rows` from the line count) instead of scrolling inside.

**Message and lyrics steps on one screen (owner, 2026-11-09, audit §8 D1 and D2; governance v1.28):**
- **Message step, AI writer on desktop:**
  - The sign-off is one select on the "What should change?" row: the hint and the select on the first line, the picks and the few words on the second.
  - The hint is 14px.
  - The AI box is 4 rows on desktop and 6 on phones, and grows with its text (`field-sizing: content`), so a long draft makes the page longer, never a scrolling box.
  - The character counter sits in the box's bottom-right corner, back on its own line if there's an error.
  - The box's gaps are 4px.
  - **Measured with the usual mock draft:** 941 → 720px at 1280×720 and 950 → 768px at 1024×768, in both flows.
- **Lyrics step:**
  - The rewrites-left line (and the singer's guide) sits in the lyrics header, right-aligned, beside Edit and Rewrite. On phones it wraps under them.
  - From 1280px the lyrics run in three columns at line height 1.4. Sections never split.
  - With the out-of-date notice on desktop, the notice is one compact line and the "What should change?" instruction steps aside.
  - **Measured:** 802 → 720px at 1280 and 800 → 768px at 1024, in both flows.
  - **Not quite one screen:** the out-of-date state is 742 / 773px with longer lyrics. It lasts only until "Rewrite them" or an edit.

**Comic Card storyboard on one screen (owner, 2026-11-09, audit §8 D3; governance v1.29):**
- **The approved idea was tried first:** four panels side by side. It measured 781px at 1280 and 838px at 1024, because each column is only 162px wide in the card and panel 1 carries the customer's story (up to 300 characters). So desktop uses **one row per panel** instead: all four still show at once.
- **Desktop row** (grid `18px 1.25fr 1fr 1fr`): the number (the word "Panel" kept for screen readers), what happens, bubble 1 and bubble 2.
  - Every box is 14px, grows with its words (`field-sizing: content`) and never scrolls inside.
  - The bubbles are one-line boxes that wrap, so a whole bubble is readable. A line break becomes a space.
  - Each bubble's word count sits in its bottom-right corner (back underneath when there's an error).
  - Visible labels are kept for screen readers; the panel number and a placeholder name each box, as for Custom fields (2.19).
  - "Rewrite storyboard" and its count sit in the action bar.
  - From 600px the bar's labels don't wrap.
- **Phones:** one panel per screen (`useSections`), `SectionAnnounce` "Part N of 4: Panel N", "Next: panel N" blocked while that panel is invalid, Back steps back a panel, and "Approve storyboard" on the last. "Rewrite storyboard" stays under the panel.
- **Measured** (with an 86-character first panel):

  | Size | Before | After |
  |---|---|---|
  | 1280×720 | 1385px | 720px |
  | 1024×768 | 1434px | 768px |
  | 768 (2 × 2) | 1765px | 1941px, the scrolling layout |

  - On phones the boxes no longer scroll inside.
  - A 300-character first panel makes the page longer (793px at 1280), never a scrolling box.

**On This Day and the front words on one screen (owner, 2026-11-09, audit §8 D4 and D5; governance v1.30):**
- **"Pick the lead story"** (owner's choice: three, then Show more):
  - Three stories, three across from 1024px.
  - "Show N more stories" appears when the lighter-stories option adds more.
  - The research note and the lighter-stories option share a line on desktop.
  - **Measured:** 1021 → 720px at 1280×720 and 1029 → 768px at 1024×768. With all five stories shown, the page grows by one row (1033px), the customer's choice.
- **"Write the headline"** and the other suggestion steps: tighter suggestion cards on desktop (12px top padding, 15px headline). 763 → 720px at 1280; 768 at 1024.
- **"Check the spelling (N)"** (owner's choice):
  - The "Front words: …" and "N bubbles and captions" notes are gone from all four cards; the words are listed in the disclosure.
  - "No words on the front" stays as a note when there are none.
  - **On This Day measured:** Review 819 / 916px → 720 / 768. "Ready to create" 789 → 720 / 768.
  - Horoscope and Comic Card Review: 720 / 768.

**Image-rights pop-up on phones (owner, 2026-11-09, audit §8 D6; governance v1.31):** under 600px it's two screens, so neither scrolls. Every word is kept and the wording version is unchanged.
- **Screen 1, the promises:** the title, the intro, "By uploading, you promise that:" and all five promises (15px type), with Cancel and "Next: confirm".
- **Screen 2, confirm:**
  - The photos waiting, then the links to the Terms of Service and Privacy Policy.
  - The two unticked checkboxes and the status line.
  - Back and "Agree & continue", which still unlocks only when both are ticked.
  - Ticks are kept when going Back and Next.
- **Name and description:** the title stays on both screens. The intro is visually hidden on the second, so the dialog's name and description always exist.
- **Focus:** Next and Back move focus to the title, and a hidden "Part 2 of 2: Confirm" line is read.
- **Buttons:** side by side, equal widths.
- **Larger screens are unchanged:** everything on one screen, with the links inside the promises.
- **Measured at 375×812:** 1344px → 712px (promises) and 547px (confirm). The same in Personalize.
- **At 1280, 1024 and 768:** 688 / 709 / 910px, as before.

**Personalize Review on phones (owner, 2026-11-09, audit §8 D7; governance v1.32):** under 600px the first card's decisions sit on the first screen, as in Build My Card.
- **Template header:** one line. The name is 1.3rem and "Choose a different template" 14px (still 44px tall). A long saved-template name wraps rather than being cut.
- **"Look it over" header:** tighter, 10px 14px padding and a 15px lede.
- **Front card:** 14px 16px padding, with the picture at 190px wide (Build My Card keeps 230px).
- **Measured at 375×812** (decision buttons, top to bottom):

  | Card | Before | After |
  |---|---|---|
  | On This Day | 877–925px | 727–775 |
  | Comic Card | | 703–751 |
  | Horoscope | | 703–751 |
  | Saved template | | 670–718 |

  No sideways scroll.

**Review approvals are saved with the card (owner, 2026-11-09, audit §8 D8; governance v1.33):** both flows keep Review's approvals in the draft (`brief.control.approvals`), so Delivery's "Back to review", a reload and Saved Cards & Songs all reopen the card approved as it was.
- Each approval names the exact version it approved, so editing the message, rewriting the lyrics or making a new front still un-approves just that piece.
- A new Create clears all three.
- "Continue to delivery" shows in the header when all are approved; the "Approve all three" pop-up opens only when the last one is pressed.

**What starts chosen (owner, 2026-11-09, audit §8 D9; governance v1.34):** safe defaults only (see the single-choice rule in 2.17).
- **New in this change:** Build My Card's shape starts on Portrait; its genre starts on the top-ranked suggestion (shown in catalogue order, not as the first tile); Personalize's "What goes in the song?" starts on Yes and Yes.
- **A saved answer always wins**, and a pick is never replaced.

**Top up on a redo (owner, 2026-11-09, audit §8 D10; governance v1.35):** the cards-or-credits choice has a `"redo"` variant for a paid "Try again" on Review.
- **Title:** "Top up to make a new *version*".
- **Cards option:** "…Make the new version now, then send your card."
- **Note:** "Your card is saved. After you pay, you'll come straight back to your review."
- **Unchanged:** the options, the cost line ("This uses N credits and you have M") and the layout. Create keeps "Top up to create *your card*".

**Accents with Custom open at 1024–1279px (owner, 2026-11-09, audit §8 D11; governance v1.36):** the controls' gap is 8px and the Custom field 44px tall, so the step is 768px (was 776). Other sizes are unchanged.

## 2.34 Build My Card and Personalize: Prompt 2 accessibility, short phones and page weight (2026-11-09)
Owner-approved after `PROMPT-2B-REPORT-2026-11-09.md` (governance v1.37). Both flows unless named.

- **"Your card so far" is an `h2`** wrapping its toggle button (`.bmcq-summary-heading`, same look), so the stage `h3`s no longer skip a level. The phone sheet already had an `h2`.
- **AI results are announced.** `BusyAnnounce` (`bmc/ui.tsx`) is a polite status that's always in the page. It reads the working line ("Writing your message…"), then the result:
  - "Caption suggested: …", "New draft ready in the AI-written message box." and "New lyrics ready.";
  - on Review: "New front ready.", "New message ready." and "New song ready.";
  - in Personalize: "N ideas ready." and "N stories found.".
  The visible `Thinking` line beside it takes `announce={false}`, so nothing is read twice. After an error only the error's alert is read.
- **High contrast:** the AI writer's "on" state gets the 3px `Highlight` outline, like selected chips.
- **Hit areas:** the summary's stage rows, its Change links, and standalone link buttons (`.bmcq-link.is-hit`) keep their 28–32px look but get a 44px invisible hit area (`::after`), so the one-screen heights don't change. The vibe and occasion chips (40–47px) and the border swatches (38px) are a recorded exception to the 44px rule: raising them would undo the one-screen fits. They still pass WCAG AA's 24px.
- **Sign-off:** the label is a real `<label for>`, and the hidden hint sits outside it, so it's read once, as the description.
- **Photo alt text:** "Photo N of M" in the photo steps; "Photo N: file name" in the rights pop-up.
- **Personalize gallery tiles:** no `aria-label`; the name is the visible text ("Horoscope, Personalize"). Tiles lift 1px on hover (none with reduced motion).
- **Scroll rows (`PtScrollRow`, shared with Community Cards):** under reduced motion there's no hover glide, and a press jumps without smooth scrolling.
- **Hover is berry on ivory:** Review's secondary and done decision buttons, the cards-or-credits options, and the summary's stage rows.
- **Short phones** (`max-width: 599px` and `max-height: 700px`, the iPhone SE/8 class):
  - **What fits now:** "Top up to create your card" (664 → 552px), "Top up to make a new version" (718 → 572px) and the rights pop-up's promises screen (712 → 600px) fit 375×667.
  - **How:** the top padding shrinks and the title starts on the close button's row, clear of it (no eyebrows since 2026-11-09); the title is 1.4rem, and the type and gaps are tighter. Every word stays, and `ATTESTATION_VERSION` is unchanged.
  - **Still scroll at that height:** Top up cards and credits and Checkout scroll by 100–140px (owner: accepted).
- **No layout shift on load:** the flows' `main` reserves a screen (`min-height: 100dvh`) at every size, so the footer no longer jumps when the client-rendered step appears (Lighthouse mobile CLS 0.67–0.73 → 0).
- **Page weight:**
  - **QR library:** `QrSongCode` loads the `qrcode` library only when a code is shown, with a same-sized paper square in its place until then.
  - **Personalize:** the questionnaire, Review and card files load with `next/dynamic` when a card opens (`personalize/PtCard.tsx`), prefetched 1.5s after the page loads. `templates/ids.ts` holds the open template ids, `SAVED_TEMPLATE_ID` and `PT_RETURN_PATH` without the card files; `templates/index.ts` warns in development if the ids drift from `PT_TEMPLATES`.
  - **Head card:** the 150px head card has `sizes="150px"` and no priority preload (it's hidden on phones).
  - **First load:** Build My Card 232 → 224 kB, Personalize 261 → 205 kB.

