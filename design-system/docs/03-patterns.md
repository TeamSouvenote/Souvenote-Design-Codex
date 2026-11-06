# 3. Patterns

## 3.1 Page anatomy (landing page, top to bottom)

| # | Section | Surface | Key components |
|---|---|---|---|
| 0 | Skip link | n/a | Skip link |
| 1 | Nav | Forest (floating) | Gold wordmark, 4 links, Log In, Start for Free |
| 2 | Hero | Ivory with glow | Display heading, lede (second sentence on its own line with a pen-stroke underline), buttons with the free-credits line centred under Start for Free, keepsake card, song chip |
| 3 | Gallery | Ivory | Section heading (start-aligned) in a left rail, arrows, flip cards |
| 4 | Steps | Ivory | Section heading, 3 step tiles: berry, gold (AI), terracotta |
| 5 | Comparison | Forest band | Heading with logo, paper table |
| 6 | FAQ | Ivory | Section heading, accordion |
| 7 | Footer | Forest, terracotta stripe | Wordmark, slogan, social, link columns |

**Rhythm:** ivory sections are separated by a fading hairline and `--sv-section-space` (64/80/96px). The forest band has no hairline, because the colour change does that job.

## 3.2 Sections

```html
<section class="l-section" aria-labelledby="x-title">
  <div class="l-wrap">
    <!-- SectionHeading (h2 id="x-title") -->
    <!-- content -->
  </div>
</section>
```

- Every section is labelled by its heading (`aria-labelledby`).
- There is one h1 per page (the hero). Sections use h2; cards, steps and questions use h3.

### Paper texture on every screen

The grain (see [Foundations: Paper texture](01-foundations.md#paper-texture)) is applied once, in `frontend/app/styles/next-app.css`, so a new screen gets it automatically when its background is painted by one of:

| Screen type | Background element | Texture layer |
|---|---|---|
| Landing-style screens (`.souv-landing`: landing, home, create, pricing) | `.l-backdrop` (fixed) | `.l-backdrop::after` |
| Auth screens (`.souv-auth`) | `.auth-backdrop` (fixed) | `.auth-backdrop::after` |
| Anything else | the page `body` colour | `body::before` (fixed, behind content) |

When building a new screen, paint its ivory with one of these, not with a full-page section background. A section that paints its own opaque full-width background (like the forest band) covers the grain. If a new screen needs its own backdrop element, add its `::after` to the shared rule in `next-app.css`; don't copy the texture into a page stylesheet.

## 3.3 Forest surfaces

To make a band green, add the surface class. Every component inside re-maps itself: text turns ivory, accents and focus turn gold, and buttons invert.

```html
<section class="l-section l-compare">        <!-- live app -->
<section class="sv-surface-forest">          <!-- design-system tokens -->
```

Rules:
- Use at most one forest band between the nav and the footer, so the page stays light.
- On forest, accents are gold, never berry (berry on forest is 1.74:1).
- Content cards on forest (like the table) stay paper, with espresso text.

## 3.4 Engravings

Engravings are what make the page feel like a keepsake rather than a website. They only work if they stay rare.

**Placement rules**
1. **Only in space that's guaranteed empty.** Each motif appears only at the widths where the layout leaves room. It never sits behind or touches text, buttons or images.
2. **They scroll with the page.** No fixed or parallax positioning.
3. **At most two per section,** and at most about seven on the page.
4. **Unevenly balanced:** where two flank something, give them different heights, sizes and tilts.
5. **Larger and fewer beats smaller and more.** 72-150px wide, at 55% opacity.

**Current placements**

| Motif | Where | Appears from |
|---|---|---|
| Envelope | Under the hero buttons, tilted -7° | 960px |
| Heart | High, left of the hero card, centred in the gap | 1296px |
| Notes | Lower, right of the hero card, centred to the screen edge | 1296px |
| Stamp | Under the gallery arrows, tilted 6° | 1024px |
| Heart + notes | Either side of the "Three steps" heading | 1024px |
| Flower + gift | Either side of the FAQ list, staggered | 1296px |

**Making a new motif:** a single SVG `<g>` with `fill="none"`, `stroke="currentColor"`, a 1.4 base stroke, round caps and joins. It should be recognisable as an outline at 72px. Give it a little engraved hatching (0.45-0.6 strokes) and nothing more. Subjects should relate to cards, love, music or giving.

## 3.5 Logo use

- **On forest:** the gold wordmark (nav, footer, comparison heading) or the gold "S" mark (gallery card backs).
- **On ivory:** don't place the gold logo there (1.73:1). Use the original artwork, or put it on a forest shape.
- **Clear space:** at least the height of the "S" all round.
- **Sizes:** nav 34px tall (42px ≥1221px, 30px on tablets), footer 48px, inline in a heading 1.15em, card back 30% of the card width.
- **Files:** always the pre-tinted `wordmark-gold.png` / `logomark-gold-silver.png` as a plain image (see 2.13). Never a CSS mask or a hidden image with an overlay.
- **The "S" mark is two-tone:** gold "S", platinum note. Never flatten it to one colour.
- **Don't** stretch it, recolour it outside the palette, add effects to it, or animate it.

## 3.6 Imagery

- **Cards are the photography.** Show real finished cards (cover and inside) rather than stock photos.
- **Frame them physically:** a 16px radius, the warm `--sv-shadow-3`, and a floor shadow when the card stands up.
- **Without artwork,** use a tone fill with the occasion name in script (see the gallery card).
- **Images:** use `next/image` with `sizes` in px matching the real maximum width, so the same file isn't downloaded twice.

## 3.7 Interaction

| Input | Card (hero) | Card (gallery) | Links, buttons |
|---|---|---|---|
| Mouse hover | Pauses | Turns over | Colour change (+ lift on primary) |
| Keyboard focus | Pauses | Turns over | 2px focus ring |
| Tap / Enter / Space | Toggles pause | Toggles side | Activates |
| Reduced motion | Still, facing front | Instant turn | No transitions |

## 3.8 Responsive behaviour

The design is mobile first: start from the phone layout and add.

- **Phone:** one column; the hero card follows the text; full-width stacked buttons below 480px; the gallery scrolls with snap points and runs to the screen edge; the nav shows the logo and Log In only; tiles and the table stay full width (the table squeezes rather than scrolls).
- **Tablet:** the nav shows all links with tighter type (701-900px); gutters grow to 32px.
- **Desktop:** two-column hero; gallery rail; three tiles across; engravings appear in the margins.
