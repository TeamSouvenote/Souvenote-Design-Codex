# Waitlist paper texture (2026-11-09)

## 1. Paper texture on souvenote.com waitlist
- Files (Codex Sites project, not this repo): `public/assets/paper-texture.svg` (new, copied from frontend), `app/globals.css` (`.backdrop::after`).
- Purpose: same page-background grain as the app; forest bar, cards and form stay smooth.
- Verified: `npm run build` passes; production preview shows the layer (soft-light, 0.9, asset 200 image/svg+xml).
- Not published: Codex must save/deploy the site version. Handoff: `saved-ui/souvenote-waitlist-paper-texture-2026-11-09/`.

## 2. `.claude/launch.json`
- Added `waitlist-site-prod` (wrangler preview of the built waitlist site, port 3220). Do not commit unless wanted.

## 3. Design-system colours on the waitlist landing
- File: `app/globals.css` (Codex Sites project).
- Step tiles berry / gold / terracotta with raised shadow and hover lift (matches `frontend/app/styles/landing.css`); `--espresso-deep` #2E2422 and `--field-line` #8A7B77 added; email field outline uses `--field-line`.
- Verified: build passes; computed colours checked in the production preview (berry/ivory, gold/espresso, terracotta/#2E2422; input border rgb(138,123,119)); screenshot of the steps section.
- Not published. Combined patch: `saved-ui/souvenote-waitlist-paper-texture-2026-11-09/waitlist-texture-and-colours.patch`.
