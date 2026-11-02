# 1. Foundations

Every value below is taken from the live landing page (`frontend/app/styles/landing.css`).
The token names are in `tokens/tokens.css` and `tokens/tokens.json`.

## 1.1 Colour

### The palette

| Name | Hex | Token | Job |
|---|---|---|---|
| Dusty berry | `#9E3D58` | `--sv-berry-500` | Brand voice: script accent words, small labels, hover and active states |
| Warm ivory | `#F7F0E8` | `--sv-ivory-200` | Page background; text and buttons on forest |
| Paper | `#FFFAF3` | `--sv-ivory-100` | Step tiles, comparison table |
| Raised ivory | `#EFE3D5` | `--sv-ivory-300` | Open FAQ item, menus |
| Soft espresso | `#4A3B39` | `--sv-espresso-700` | All main text and headings; engravings |
| Cocoa | `#655250` | `--sv-espresso-500` | Secondary text, "no" marks |
| Forest green | `#2F3E3B` | `--sv-forest-700` | Primary buttons; nav, footer and comparison band |
| Antique gold | `#D8B65A` | `--sv-gold-400` | Means "AI made this"; the logo on forest |
| Platinum | `#CBCFD6` | `--sv-platinum-400` | Only the music note in the "S" mark (the app's existing `--platinum-mid`). Not for text or surfaces |
| Muted terracotta | `#C98A76` | `--sv-terracotta-400` | Top stripes on tiles and footer; background glow |
| Oat | `#D9CFC3` | `--sv-ivory-400` | Secondary text on forest |

The real colours are shown in `reference/index.html`.

### Proportion

The page should feel mostly ivory, held together by forest, and lifted by berry and gold.

- **About 70% ivory and paper.** Content sits on light surfaces.
- **About 20% forest.** The nav, the comparison band, the footer and the main buttons.
- **About 10% accents.** Berry for words that matter, gold for anything AI-made, terracotta for stripes.

### Colour meanings

- **Gold means AI.** The AI step tile, the song chip and the Souvenote row in the comparison table are gold. Don't use gold for anything that isn't AI-made, or the signal stops working.
- **Berry means emphasis.** One script word per heading, small spaced-capital labels, and every hover or active state on ivory.
- **Forest means action or structure.** Primary buttons, and the bands that frame the page.
- **Terracotta is decoration only.** It appears in stripes and the background glow, never as text.

### Contrast (measured, WCAG 2.2)

| Foreground | Background | Ratio | Allowed use |
|---|---|---|---|
| Espresso | Ivory | 9.41 | Any text |
| Espresso | Paper | 10.23 | Any text |
| Espresso | Raised | 8.41 | Any text |
| Cocoa | Ivory | 6.46 | Any text |
| Cocoa | Raised | 5.78 | Any text |
| Berry | Ivory | 5.70 | Any text |
| Berry | Raised | 5.09 | Any text |
| Ivory | Forest | 9.92 | Any text |
| Ivory | Forest hover | 7.93 | Any text |
| Oat | Forest | 7.29 | Any text |
| Gold | Forest | 5.74 | Any text; the logo |
| Platinum | Forest | 7.17 | The note in the "S" mark |
| Espresso | Gold | 5.45 | Any text |
| Ivory | Berry | 5.70 | Any text |
| Berry | Gold | 3.30 | Large text only (24px+, or 19px+ bold) |
| Espresso | Terracotta | 3.74 | Large text only (the terracotta card's script title) |
| **Gold** | **Ivory** | **1.73** | **Never text.** Fills only |
| **Terracotta** | **Ivory** | **2.52** | **Never text.** Stripes only |
| **Berry** | **Forest** | **1.74** | **Never.** Use gold for accents on forest |

### Surfaces

There are two surface themes. Components never pick colours directly: they use roles (`--sv-text`, `--sv-hover`, ...), and the surface re-maps them.

| Role | On ivory (default) | On forest (`.sv-surface-forest`) |
|---|---|---|
| Text | Espresso | Ivory |
| Muted text | Cocoa | Oat |
| Hover, labels, focus | Berry / Berry / Forest | Gold |
| Primary button | Forest with ivory text | Ivory with forest text (white on hover) |
| Lines | Espresso at 14% / 34% | Ivory at 16% / 40% |

## 1.2 Typography

Two families, both from Google Fonts.

- **Lato** (300, 400, 700) does the work: headings, body, buttons, labels.
- **Lobster Two** (400) is the voice: one accent word or short phrase per heading. It is never used for whole sentences.

### Type scale

| Style | Font | Weight | Size | Line height | Tracking | Example |
|---|---|---|---|---|---|
| Display (h1) | Lato | 300 | `clamp(2.9rem, 1.6rem + 6.2vw, 5.2rem)` (46-83px) | 1.05 | -0.02em | "A card worth" |
| Display script | Lobster Two | 400 | 1.12em of the display line | 1.08 | 0 | "keeping" |
| Section heading (h2) | Lato | 300 | `clamp(2.1rem, 1.5rem + 2.8vw, 3.5rem)` (34-56px) | 1.15 | -0.01em | "Three steps," |
| Heading script | Lobster Two | 400 | 1.1em | inherit | 0 | "one keepsake" |
| Title (h3) | Lato | 400 | `clamp(1.45rem, 1.3rem + 0.6vw, 1.75rem)` | 1.25 | 0 | "Choose a moment" |
| Lede | Lato | 400 | `clamp(1.1rem, 1rem + 0.45vw, 1.3rem)` | 1.65 | 0 | Hero paragraph |
| Body | Lato | 400 | 17px (18px from 600px) | 1.65 | 0 | Paragraphs |
| Question | Lato | 400 | `clamp(1.06rem, 1rem + 0.3vw, 1.2rem)` | 1.4 | 0 | FAQ questions |
| Card name | Lato | 700 | 1.1rem | 1.3 | 0 | "Your Life As A Hero" |
| Button | Lato | 700 (400 for secondary) | 17px (15px in the nav) | 1 | 0.02em | "Start for Free" |
| Nav link | Lato | 700, uppercase | 12px | 1.2 | 0.16em | "PRICING" |
| Label | Lato | 700, uppercase | 11-13px | 1.3 | 0.14-0.22em | "COMIC STRIP", "01" |
| Small | Lato | 400 | 14px | 1.5 | 0 | "Tap or click the card to pause" |

### Rules

- **Headings are light (300), not bold.** The look is elegant and calm; size and the script word carry the emphasis.
- **One script phrase per heading,** always last, always berry on ivory (gold on forest). For example: "Explore the *possibilities*", "Frequently asked *questions*".
- **Spaced capitals are for labels only:** nav links, card occasions, step numbers, footer column titles, the free-credits line. Never paragraphs.
- **Measure:** ledes stop at 34ch, sub-headings at 44ch, step text at 38ch, answers at 64ch.
- **Balance headings** with `text-wrap: balance`.
- **Numbers that change** (song time) use `font-variant-numeric: tabular-nums`.

## 1.3 Spacing and layout

### Spacing scale (4px base)

`4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 44 · 48 · 56 · 64 · 80 · 96` px (`--sv-space-1` ... `--sv-space-24`).

Common pairings:

- Label to title: 4px. Title to body: 12-14px.
- Heading to sub-heading: 14px. Heading block to content: 40px (56px at ≥1024px).
- Between buttons: 12px. Between cards in a row: 18px (24px for tiles at ≥900px).
- Tile padding: 28 / 24 / 30px.

### Page grid

| | Phone (<600px) | Tablet (600-1023px) | Desktop (≥1024px) |
|---|---|---|---|
| Side gutter | 20px | 32px | 48px |
| Space between sections | 64px | 80px | 96px |
| Body text | 17px | 18px | 18px |
| Content max width | 1200px | 1200px | 1200px |

Narrower columns inside the 1200px: comparison table 880px, FAQ list 820px.

### Breakpoints (mobile first, `min-width`)

| Width | What changes |
|---|---|
| 480px | Hero buttons sit side by side |
| 600px | Bigger gutters and section spacing; 18px body; roomier table |
| 701px | Nav links appear (below this only the logo and Log In show) |
| 900px | Step tiles go three across |
| 960px | Hero becomes two columns (text 1.1fr, card 0.9fr); envelope engraving appears |
| 1024px | Gallery gets its left rail; section spacing 96px; stamp and steps engravings appear |
| 1221px | Taller nav and larger wordmark |
| 1296px | Heart and notes beside the hero card; flower and gift beside the FAQ |

## 1.4 Shape

| Token | Radius | Used on |
|---|---|---|
| `--sv-radius-sm` | 10px | The thin inner frame inside gallery cards |
| `--sv-radius-md` | 16px | Hero card, gallery cards |
| `--sv-radius-lg` | 18px | Step tiles, comparison table |
| `--sv-radius-xl` | 22px | The floating nav bar |
| `--sv-radius-pill` | 999px | Every button, icon button and chip |

Borders: 1px hairlines, 1.5px for outlined controls, and a 4px top stripe on tiles and the footer.

## 1.5 Elevation

Shadows are warm (espresso), soft and low.

| Token | Value | Used on |
|---|---|---|
| `--sv-shadow-1` | `0 8px 20px` espresso at 16% | Song chip; nav button hover |
| `--sv-shadow-2` | `0 12px 26px` espresso at 16% | Primary button hover |
| `--sv-shadow-3` | `0 18px 40px` at 14% + `0 2px 8px` at 8% | Cards, nav bar, comparison table, menus |
| Floor shadow | A blurred espresso ellipse at 30% | Under the spinning hero card |

The page background has two very soft radial glows (terracotta top right, gold left) on a fixed layer behind everything.

## 1.6 Motion

| Token | Value | Used for |
|---|---|---|
| `--sv-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | Everything that isn't linear: a gentle ease-out |
| `--sv-dur-fast` | 200ms | Skip link sliding in |
| `--sv-dur-base` | 250ms | Hover colour, border and lift |
| `--sv-dur-medium` | 300-350ms | FAQ open and close, plus-to-minus icon |
| `--sv-dur-flip` | 700ms | Gallery card turning over |
| `--sv-dur-vinyl` | 3.2s linear | Vinyl spinning while a song plays |
| `--sv-dur-spin` | 30s linear | Hero card rotating |

Rules:

- **Hover lifts by 1px** and adds `--sv-shadow-2`. Nothing bounces or scales more than 6%.
- **Anything that moves on its own can be paused.** The hero card pauses on hover, focus or tap.
- **Reduced motion turns it all off.** Under `prefers-reduced-motion: reduce` the hero card stands still facing front (its pause hint is hidden), the vinyl doesn't spin, cards turn over instantly, and transitions are removed.
