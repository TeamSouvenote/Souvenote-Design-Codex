# 4. Accessibility

Target: **WCAG 2.2 AA.** Our audience is mainly women aged 40-65, so comfortable reading, large tap targets and calm motion are design requirements, not extras.

## Checklist for anything new

**Colour and contrast**
- [ ] Body text is at least 4.5:1, and large text and icons at least 3:1 (see the contrast table in [Foundations](01-foundations.md#contrast-measured-wcag-22)).
- [ ] Gold and terracotta are never text on ivory; berry is never used on forest.
- [ ] Meaning never depends on colour alone (the table has tick and cross shapes plus hidden "Yes"/"No").

**Type and reading**
- [ ] Body text is at least 17px; small print at least 12px, and only for labels.
- [ ] Line height 1.65 for body text; reading width 34-64ch.
- [ ] Script (Lobster Two) is used only for short accent phrases.

**Touch and keyboard**
- [ ] Every clickable thing is at least 44 × 44px (main buttons are 56px tall).
- [ ] Everything works with the keyboard, in a logical order, with a visible focus ring (2px, 3px offset; gold on forest).
- [ ] There is a skip link to `#main`.
- [ ] Anything that works on hover also works on focus and tap.

**Structure**
- [ ] One h1 per page; sections are h2 and labelled by their heading.
- [ ] Icon-only buttons have an `aria-label` that names the thing they act on.
- [ ] Toggles use `aria-pressed` and accordions use `aria-expanded`/`aria-controls`.
- [ ] Decoration (engravings, glows, card art in flip faces) is `aria-hidden` or has `alt=""`.
- [ ] Links that open a new tab say so in their label.
- [ ] Tables have a caption and header scopes.

**Motion**
- [ ] Nothing flashes.
- [ ] Anything that moves on its own can be paused.
- [ ] `prefers-reduced-motion: reduce` stops the spins and removes transitions.
- [ ] With reduced motion **and** with `forced-colors: active` (Windows high contrast), every logo, image and heading is still visible. Reduced motion must only remove movement, never content.

**Media**
- [ ] Audio never plays by itself and loads only on demand (`preload="none"`).
- [ ] Player status changes are announced politely (`aria-live="polite"`).

## Known manual checks before launch
- Screen readers: VoiceOver (iOS and macOS) and NVDA (Windows).
- Real touch devices, plus Safari and Firefox.
- A real MP3 in the song player.
- 200% browser zoom and 400% reflow at 320px.
