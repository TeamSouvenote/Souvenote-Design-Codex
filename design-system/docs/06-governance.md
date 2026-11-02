# 6. Using and changing the system

## Where things live

| What | Where |
|---|---|
| Live landing styles (source of truth) | `frontend/app/styles/landing.css` (the PALETTE block at the top) |
| Landing components | `frontend/app/components/landing/` |
| Landing copy | `frontend/app/components/landing/content.ts` |
| Shared nav and footer (landing options) | `frontend/app/components/Navbar.tsx` (`navVariant="landing"`), `Footer.tsx` (`variant="landing"`) |
| Design-system tokens | `design-system/tokens/tokens.css`, `tokens.json` |
| Visual reference | `design-system/reference/index.html` |

The design system is documentation plus portable tokens. The app does not import `design-system/`, so editing these files changes nothing on the site. To change the site, edit `landing.css` and then update the tokens to match.

## Token map: design system to the live landing CSS

| `--sv-*` (design system) | `--l-*` (landing.css) | Value |
|---|---|---|
| `--sv-bg` | `--l-bg` | #F7F0E8 |
| `--sv-text` | `--l-text`, `--l-heading`, `--l-paper-ink`, `--l-ai-ink`, `--l-song-ink` | #4A3B39 |
| `--sv-text-muted` | `--l-text-2`, `--l-paper-ink-2` | #655250 |
| `--sv-text-script` | `--l-script-color` | #9E3D58 |
| `--sv-text-label` | `--l-label` | #9E3D58 |
| `--sv-hover` | `--l-hover` | #9E3D58 |
| `--sv-surface-raised` | `--l-raised` | #EFE3D5 |
| `--sv-surface-paper` | `--l-paper` | #FFFAF3 |
| `--sv-surface-ai` | `--l-ai`, `--l-song-bg` | #D8B65A |
| `--sv-surface-inverse` | `--l-dark-bg`, `--l-card-back` | #2F3E3B |
| `--sv-action-bg` / `-hover` / `-ink` | `--l-btn-bg` / `-hover` / `-ink`, `--l-arrow-*` | #2F3E3B / #3B4D49 / #F7F0E8 |
| `--sv-focus` | `--l-focus` | #2F3E3B |
| `--sv-yes` / `--sv-no` | `--l-yes` / `--l-no` | #2F3E3B / #655250 |
| `--sv-stripe` / `--sv-stripe-ai` | `--l-stripe` / `--l-stripe-2` | #C98A76 / #9E3D58 |
| `--sv-logo-tint` | `--l-logo-tint` | #D8B65A |
| `--sv-engrave-color` / `-opacity` | `--l-engrave-color` / `-opacity` | #4A3B39 / 0.55 |
| `--sv-vinyl-*` | `--l-vinyl-*` | #4A3B39 / #9E3D58 / #F7F0E8 |
| `--sv-line` / `-strong` / `-paper` | `--l-line` / `--l-line-strong` / `--l-paper-line` | espresso at 14% / 34% / 16% |
| `--sv-shadow-3` | `--l-shadow` | (see Foundations) |
| `--sv-tone-1..5` | `--l-tone-1..5` | (see Foundations) |
| `--sv-font-sans` / `--sv-font-script` | `--l-font` / `--l-script` | Lato / Lobster Two |
| `--sv-max` / `--sv-gutter` / `--sv-section-space` | `--l-max` / `--l-gutter` / `--l-section-space` | 1200 / 20-48 / 64-96px |
| `--sv-radius-lg` | `--l-radius` | 18px |
| `--sv-ease` | `--l-ease` | cubic-bezier(0.22, 1, 0.36, 1) |
| `.sv-surface-forest` | `:is(.souv-nav, .souv-footer, .l-compare)` re-map | |

## Trying a new palette

1. Copy the current files into a new `saved-ui/` snapshot first (see `saved-ui/README.md`).
2. Change only the PALETTE block in `landing.css`. Components use roles, so nothing else needs editing.
3. Re-check every pair in the contrast table and update [Foundations](01-foundations.md).
4. Update `tokens.css` and `tokens.json` to match, then bump the version below.

## Adding a component

1. Use existing tokens. If you need a new value, add it as a role, not a raw hex.
2. Scope landing CSS under `.souv-landing` and prefix classes with `l-`.
3. Support both surfaces (ivory and forest) through roles.
4. Pass the [accessibility checklist](04-accessibility.md).
5. Document it in [Components](02-components.md) and add an example to `reference/index.html`.

## Scope today

This system describes the **public signed-out landing page (`/`)** and the landing options of the shared nav and footer. The signed-in home (`/home`), the other app screens and the backend still use their original styles. Bringing them into this system would be a separate, planned piece of work.

## Version history

| Version | Date | Notes |
|---|---|---|
| 1.0 | 2026-11-01 | First release: berry & ivory, antique-gold logo on forest. Built from the landing redesign (snapshot `saved-ui/landing-berry-ivory-2026-11-01`). |
