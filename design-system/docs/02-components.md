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

**How:** a plain image of pre-tinted gold artwork:

| File | Use | Size |
|---|---|---|
| `/assets/wordmark-gold.png` | Nav (signed out), footer, comparison heading | 900 × 208 |
| `/assets/logomark-gold-silver.png` | Nav (signed in), gallery card backs | 400 × 600 |

The files live in `frontend/public/assets/` (copies in `design-system/assets/`). They have exactly the shape of the originals (`WordmarkLobster.png`, `LogoMark.png`), which stay unchanged for the rest of the app.

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
