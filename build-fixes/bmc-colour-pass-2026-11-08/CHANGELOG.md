# Build My Card colour pass — session change log

Branch: `mock-data-mode`
Date: 2026-11-08
Status: **uncommitted**. Goes out with the session's batch commit (see `build-fixes/mock-data-mode-2026-11-07/CHANGELOG.md` for the "do not commit" list).

**Goal:** use the design system's lesser-used colours (terracotta, forest as a surface, oat, espresso) in Build My Card, and fix places that broke the colour rules. No new tokens.

## Changes

| # | What | File(s) |
|---|---|---|
| 1 | Decorative option dots (occasion, vibes, accessories) no longer use gold, because gold means AI-made. Slot 3 is oat with a hairline ring; slot 6 is espresso. | `frontend/app/styles/bmc-polish.css` (dot rotation) |
| 2 | Done steps on the progress rail are a forest ring and tick on paper, berry on hover. They were solid berry, the same colour as errors. | `bmc-polish.css` ("Colour pass" block) |
| 3 | Attestation reader background `#fff` → `var(--l-paper)`. | `frontend/app/styles/bmc-dialogs.css` |
| 4 | "Yours is terracotta": the customer's own message version (review), their message box (message step) and photo thumbnails get a terracotta edge and tint, matching the gold treatment of AI content. The selected thumbnail and the chosen version keep the forest ring. | `bmc-polish.css` ("Colour pass" block) |
| 5 | The review header is a forest band: gold eyebrow and script word, ivory title, oat count and lede, ivory "Continue to delivery" pill (white on hover), gold focus ring. From 1024px it is a slim pill band like the nav (4px inset) so the one-screen layout grows by only ~8px. Bordered in forced-colours mode. | `bmc-polish.css` ("Colour pass" block) |
| 6 | Design system updated to v1.5: colour meanings (terracotta = yours, forest band), rail and dot rotation, review heading, version history. Reference style guide: the "Your message" example card is terracotta. | `design-system/docs/01-foundations.md`, `02-components.md`, `06-governance.md`, `design-system/reference/styleguide.css` |

## Deliberately not changed
- Checkout's hard-coded hex values (`checkout-flow.css`): `#8A7B77` is the input-border colour, `#514C4A` matches the Welcome sketches' handwriting, and black/white/`#3C4043` are Apple Pay and Google Pay's required button colours.
- "This one will print" badge: stays forest. It also appears on the AI box, so it means "chosen", not "yours".
- `bmc.css` (old dark theme, loaded site-wide in `layout.tsx`): not used by the live flow; left alone.

## Verification
- Preview (`frontend-mock`, port 3103): `/create/build-my-card` loads with the new stylesheet (checked the page CSS contains the "Colour pass" block).
- I injected sample markup (review header, rail, message versions, message box, chips, thumbnails) into the page (temporary, DOM only) and checked computed colours: header `#2F3E3B`, title `#F7F0E8`, eyebrow and script `#D8B65A`, count `#D9CFC3`, pill ivory with forest text; done dot paper with a 2px inset forest ring; your version and message box border `#C98A76`; thumbnails terracotta at 55%, selected forest; dot rotation terracotta, berry, oat (with ring), forest, cocoa, espresso, berry. Screenshot looked right.
- **Not verified:** the real review screen after clicking through a full draft. The shared `.next` folder kept being overwritten by other dev servers running in the same folder (404s/ChunkLoadError), and the mock session dropped. Contrast for text was not re-measured because no new text/background pairs were added. All the text pairs on forest are already measured in Foundations 1.1.
