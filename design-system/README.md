# Souvenote Design System

**Berry & ivory · v1.1 · 2026-11-02**

The design language of Souvenote's public landing page, written down so the rest of the product can follow it.
Every value comes from the live redesign (`frontend/app/styles/landing.css`, branch `landing-page-redesign`).

> **Open the visual guide:** `reference/index.html` (double-click it; it works offline, but needs internet for the fonts).

## Principles

1. **A keepsake, not a website.** Warm paper tones, real cards as the imagery, quiet engraved motifs. Every screen should feel like something you'd want to keep.
2. **Calm elegance.** Light headings, generous space, soft shadows, slow motion. Emphasis comes from one script word, not from bold or loud colour.
3. **Colour has meaning.** Gold means AI made it. Berry means it matters. Forest means act here. Terracotta is only ever decoration.
4. **Comfortable for everyone.** Designed for women aged 40-65 first: 17-18px body text, 44px+ tap targets, AA contrast throughout, and every motion can be paused or switched off.
5. **Mobile first.** Start from the phone layout and add room as the screen grows.

## What's here

```
design-system/
├── README.md                ← you are here
├── tokens/
│   ├── tokens.css           CSS custom properties (--sv-*), surface theme, breakpoints
│   └── tokens.json          The same tokens in W3C Design Tokens (DTCG) format, for Figma/Style Dictionary
├── docs/
│   ├── 01-foundations.md    Colour, contrast, typography, spacing, grid, shape, elevation, motion
│   ├── 02-components.md     Button, icon button, nav, popover, section heading, hero card,
│   │                        song chip, gallery card, step tile, comparison table, accordion,
│   │                        footer, gold logo, engravings, skip link, utilities
│   ├── 03-patterns.md       Page anatomy, sections, forest surfaces, engraving placement,
│   │                        logo use, imagery, interaction, responsive behaviour
│   ├── 04-accessibility.md  WCAG 2.2 AA checklist and pre-launch manual checks
│   ├── 05-content.md        Voice, writing rules, current key copy
│   └── 06-governance.md     Token map to the live CSS, changing the palette, adding components, versions
├── reference/
│   ├── index.html           Visual guide with live, interactive examples of every component
│   └── styleguide.css       Component styles for the guide, built only on tokens.css
└── assets/
    ├── wordmark-gold.png    Wordmark pre-tinted antique gold (#D8B65A), 900px wide (live copy in frontend/public/assets)
    ├── logomark-gold-silver.png  "S" mark: antique-gold S + platinum (#CBCFD6) note, 400px wide (live copy in frontend/public/assets)
    ├── logomark-gold.png    Superseded all-gold "S" mark (kept for reference; don't use)
    ├── WordmarkLobster.png  Original wordmark (copy)
    ├── LogoMark.png         Original mark (copy)
    └── pt-comic-cover.jpg, pt-comic-back.jpg   Example card artwork (copies)
```

## The system at a glance

| | |
|---|---|
| **Colours** | Ivory `#F7F0E8` · Paper `#FFFAF3` · Espresso `#4A3B39` · Berry `#9E3D58` · Forest `#2F3E3B` · Gold `#D8B65A` · Terracotta `#C98A76` |
| **Fonts** | Lato 300/400/700 · Lobster Two 400 (accent words only) |
| **Body text** | 17px (18px from 600px), line height 1.65 |
| **Spacing** | 4px base; gutters 20/32/48px; sections 64/80/96px; max width 1200px |
| **Radius** | 10 · 16 · 18 · 22 · pill |
| **Easing** | `cubic-bezier(0.22, 1, 0.36, 1)`, 250ms for most hovers |

## Using the tokens

```html
<link rel="stylesheet" href="design-system/tokens/tokens.css">
<section class="sv-surface-forest"> … </section>   <!-- green band: roles re-map automatically -->
```

```css
.my-card {
  background: var(--sv-surface-paper);
  color: var(--sv-text);
  border-radius: var(--sv-radius-lg);
  box-shadow: var(--sv-shadow-3);
}
.my-card:hover { color: var(--sv-hover); }
```

Use **role** tokens (`--sv-text`, `--sv-hover`, `--sv-action-bg`…) in components, not the primitives (`--sv-berry-500`…), so surfaces and future palettes keep working.

## Relationship to the app

- The app does **not** import this folder, so nothing here changes the site.
- The live source of truth is `frontend/app/styles/landing.css`. The `--l-*` names there map one-to-one to the `--sv-*` names here (see `docs/06-governance.md`).
- Today the system covers the signed-out landing page (`/`) and the landing options of the shared nav and footer. Other screens still use their original styles.
- The UI snapshot this was built from is in `saved-ui/landing-berry-ivory-2026-11-01/`.
