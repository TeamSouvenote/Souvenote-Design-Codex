# 6. Using and changing the system

## Where things live

| What | Where |
|---|---|
| Live landing styles (source of truth) | `frontend/app/styles/landing.css` (the PALETTE block at the top) |
| Landing components | `frontend/app/components/landing/` |
| Landing copy | `frontend/app/components/landing/content.ts` |
| Shared nav and footer (landing options) | `frontend/app/components/Navbar.tsx` (`navVariant="landing"`), `Footer.tsx` (`variant="landing"`) |
| Paper texture (all screens) | `frontend/app/styles/next-app.css` (`--souv-paper-*`), asset `frontend/public/assets/paper-texture.svg` |
| Design-system tokens | `design-system/tokens/tokens.css`, `tokens.json` |
| Visual reference | `design-system/reference/index.html` |

The design system is documentation plus portable tokens. The app does not import `design-system/`, so editing these files changes nothing on the site. To change the site, edit `landing.css` and then update the tokens to match.

## Token map: design system to the live landing CSS

| `--sv-*` (design system) | `--l-*` (landing.css) | Value |
|---|---|---|
| `--sv-bg` | `--l-bg` | #F7F0E8 |
| `--sv-paper-texture`, `--sv-paper-size`, `--sv-paper-opacity` | `--souv-paper-texture`, `--souv-paper-size`, `--souv-paper-opacity` (in `next-app.css`, not `landing.css`) | paper-texture.svg, 320px, 0.9 (soft-light) |
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
| `--sv-logo-tint` | none (baked into `/assets/wordmark-gold.png` and `/assets/logomark-gold-silver.png`) | #D8B65A |
| `--sv-platinum-400` | none (baked into the note of `/assets/logomark-gold-silver.png`; the app's `--platinum-mid`) | #CBCFD6 |
| `--sv-engrave-color` / `-opacity` | `--l-engrave-color` / `-opacity` | #4A3B39 / 0.55 |
| `--sv-vinyl-*` | `--l-vinyl-*` | #4A3B39 / #9E3D58 / #F7F0E8 |
| `--sv-line` / `-strong` / `-paper` | `--l-line` / `--l-line-strong` / `--l-paper-line` | espresso at 14% / 34% / 16% |
| `--sv-field-line` | `--l-field-line` (and `--cf-field-line` in checkout-flow.css) | #8A7B77 |
| `--sv-graphite-600` | `--l-graphite`; `--sv-graphite-600` in opened-card.css (Welcome modal, `/create`) | #514C4A |
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

These screens use the berry & ivory system (checked against the 2026-10-25 screenshot set, 2026-11-08):

| Screen | Route | Live styles |
|---|---|---|
| Landing | `/` | `landing.css`, `landing-chrome.css` |
| Sign Up, Log In, Verify, Verification Expired, Forgot, Recover, Reset, social-sign-in Terms | `/signup`, `/login`, `/verify`, `/verify/expired`, `/forgot`, `/recover`, `/reset`, `/signup/terms` | `auth.css` |
| Welcome (now a pop-up over `/home`, `?welcome=1`) | `/welcome`, `/home?welcome=1` | `opened-card.css` |
| Signed-in Home | `/home` | `landing.css` |
| Create Options | `/create` | `create-options.css`, `opened-card.css` |
| Pricing (and the Account Top-Up alias) | `/pricing`, `/account/top-up` | `pricing.css` |
| Cart, Delivery, Order confirmation | `/cart`, `/delivery`, `/delivery/confirmation` | `checkout-flow.css` |
| Build My Card (v1.3, branch `mock-data-mode`) | `/create/build-my-card` | `bmc-questionnaire.css`, `bmc-dialogs.css`, `bmc-polish.css` |
| Personalize a Template (v1.4, branch `mock-data-mode`) | `/create/personalize-a-template` | `personalize.css` |
| Saved Cards & Songs (alias `/my-cards` now redirects) | `/create/my-cards-and-songs` | `content-pages.css` (`.lib-*`) |
| Account Profile, Account Settings (incl. two-step sign-in, saved recipients, delete account) | `/account/profile`, `/account/settings` | `content-pages.css` (`.acc2-*`, `.set-*`) |
| FAQ (shared list with the landing page), Contact, Privacy, Terms, Refund and Cookie policies | `/faq`, `/contact`, `/legal/[slug]` | `content-pages.css` (`.faq-*`, `.ct2-*`, `.lg-*`) |
| Cookie banner and "Cookie settings" (landing footer and the sign-in screens' footer) | every screen | `cookie-consent.css`; sign-in footer button in `auth.css` (`.auth-foot-cookie`) |
| Upload rights pop-up (summary with links) | Build My Card, Personalize a Template | `attestation.css` + `bmc-dialogs.css` |
| Community Cards (full catalog signed in, 8 public examples signed out) | `/community-cards` | `community-cards.css` |
| Page not found (every unknown address, 404) | `app/not-found.tsx` | `content-pages.css` on `ContentPageShell` |
| Shared nav and footer, paper texture | every screen | `Navbar.tsx`, `Footer.tsx`, `next-app.css` |

**Not redesigned yet** (still the original styles):

| Screen | Route |
|---|---|
| Local test checkout (dev-only guard page) | test checkout route |

Refer a Friend, Gift a Souvenote and Redeem Gift were **removed from the app** on 2026-11-08 (v2). Their addresses now show the not-found page.

The backend is outside this system. The remaining screens are being brought in by `REMAINING_SCREENS_BUILD_PROMPT.md`, in phases.

## Retired files

Kept because files aren't deleted without the owner's OK. Nothing imports them, and each is safe to delete:

| File | Retired | Why |
|---|---|---|
| `frontend/app/styles/options.css` | 2026-11-08 | It styled only the old pricing page (`Options.tsx`, removed). Its import is gone from `layout.tsx`. |
| `frontend/app/components/DemoLibrary.ts` | 2026-11-08 | Saved Cards & Songs reads real card drafts since the Remaining Screens rebuild. |
| `frontend/app/components/createFlowRules.ts` | 2026-11-08 | The `/create` credit gate and Personalize's "Before you start" check were removed. |
| `frontend/public/assets/hero-souvenote-card-face.png` | 2026-11-08 | Retired logo (Components 2.13); kept for old saved snapshots. |
| `frontend/public/assets/logomark-gold.png` | 2026-11-02 | Superseded by `logomark-gold-silver.png` (Components 2.13). |
| `frontend/asset-originals/opengraph-image.tsx.retired` (was `frontend/app/opengraph-image.tsx`) | 2026-11-09 | It generated an 850 kB PNG share image; replaced by the static `app/opengraph-image.jpg` (audit E10). Moved out of `app/`, not deleted. To use it again, move it back and remove the JPEG. |
| `frontend/asset-originals/pt-comic-cover.jpg`, `pt-comic-back.jpg` | 2026-11-09 | The 1488×2096 originals (766 / 743 kB), kept here (not served) after `public/assets/` got 800×1127 copies (audit E5). |
| `frontend/app/styles/bmc.css` | 2026-11-09 | Its only user was Delivery's error pop-up, now rebuilt on `FlowDialog` (owner, 2026-11-09). Nothing imports it. |
| `frontend/public/assets/bmc-fathers-day-card.jpg` (499 kB) | 2026-11-09 | No code uses it (audit E13). |
| `frontend/public/assets/hero-card-moon.jpg` (166 kB) | 2026-11-09 | No code uses it (audit E13). |
| `frontend/public/assets/LogoMark.png` (436 kB), `WordmarkLobster.png` (108 kB) | 2026-11-09 | The un-tinted originals of the gold logos (Components 2.13). Only referenced by the old CSS-mask logo rules in `site.css` (about lines 100–120 and 601–616), which `landing.css` always hides. The structured-data logo now uses `/icon.png`. Retire the files together with those `site.css` rules. |
| Dead CSS rules (no component uses them): `.fd-eyebrow` (`checkout-flow.css`, since 2026-11-09), `.bmcq-dialog-eyebrow` (`bmc-dialogs.css`), `.dv-keepsake-eyebrow` (`checkout-flow.css`), `.bmcq-eyebrow` (`bmc-questionnaire.css`, `bmc-polish.css`, `personalize.css`), `.cf-eyebrow` (`checkout-flow.css`), `.pr-eyebrow` (`pricing.css`), `.cv-eyebrow-part` (`content-pages.css`); `.pt-shell`, `.pt-page` (`next-app.css`); `.auth-eyebrow`, `.auth-hide-phone`, `.auth-method-kicker` (`auth.css`); the nav and footer CSS-mask logo and shimmer rules (`site.css`) | 2026-11-09 | Left in place. Remove them with a computed-style before/after check, as in Phase C (audit E13). |

## Version history

| Version | Date | Notes |
|---|---|---|
| 1.0 | 2026-11-01 | First release: berry & ivory, antique-gold logo on forest. Built from the landing redesign (snapshot `saved-ui/landing-berry-ivory-2026-11-01`). |
| 1.1 | 2026-11-02 | Logo fix: the gold logo is now pre-tinted image files (`wordmark-gold.png`, `logomark-gold-silver.png`), not a CSS mask over a hidden image, which vanished with reduced motion. `--l-logo-tint*` and `--l-logo-img-opacity` removed from the live CSS. The "S" mark is two-tone again (gold "S", platinum `#CBCFD6` note, new token `--sv-platinum-400`), replacing the all-gold `logomark-gold.png`. Added a reduced-motion / high-contrast visibility check. Snapshot `saved-ui/landing-berry-ivory-gold-silver-mark-2026-11-02`. |
| 1.2 | 2026-11-05 | Paper texture on every screen: generated grain `assets/paper-texture.svg`, soft-light at 0.9 over the page background only, so the ivory keeps its colour (inspired by the paper look on scribeless.co; our own asset, not theirs). New tokens `--sv-paper-*`; live rule in `frontend/app/styles/next-app.css`. Rules in Foundations 1.1 and Patterns 3.2. Step tiles are now solid berry, gold (AI), terracotta; new colour `--sv-espresso-900` (deep espresso, text on terracotta) and role `--sv-text-on-terracotta`. Step tiles got a soft shadow, sheen and subtle hover lift; new pen-stroke underline component (2.9a); hero free-credits line is now "Includes 2 free credits", centred under Start for Free. |
| 1.3 | 2026-11-07 | Build My Card moves onto the system (branch `mock-data-mode`): new questionnaire components in [Components 2.17](02-components.md#217-questionnaire-build-my-card) (question card, progress rail, radio and toggle chips, AI-version cards with "Currently selected to print", summary panel and bottom sheet, review panels, custom song QR code). Live styles in `frontend/app/styles/bmc-questionnaire.css`, built only on the existing `--l-*` tokens; no new colours. Example section added to `reference/index.html`. |
| 1.4 | 2026-11-08 | Personalize a Template moves onto the system (branch `mock-data-mode`): gallery rows, logo-placeholder and Coming soon tiles, the "Looking for something else?" suggestion box, card questionnaires (date, choice with write-in, AI suggestions, story candidates with sources, comic storyboard, song use) in [Components 2.20](02-components.md#220-personalize-a-template-gallery-and-card-questionnaires). The cards-or-credits dialog is now shared (`flow/TopUpChoiceDialog.tsx`) with a new "entry" variant (2.18). Live styles in `frontend/app/styles/personalize.css` on the existing `--l-*` tokens; no new colours. Example section added to `reference/index.html`. |
| 1.5 | 2026-11-08 | Build My Card colour pass, no new tokens: gold removed from the decorative option dots (oat with a hairline ring and espresso instead); done steps on the progress rail are a forest ring, not berry; terracotta now also means "yours" (your message version and box, your photo thumbnails); the review header is a forest band with gold accents and oat text; the attestation reader is paper instead of `#fff`. Live styles in `bmc-polish.css` ("Colour pass" block) and `bmc-dialogs.css`. See [Foundations 1.1](01-foundations.md#colour-meanings) and [Components 2.17](02-components.md#217-questionnaire-build-my-card). |
| 1.6 | 2026-11-08 | Remaining screens, Phase 1 (branch `mock-data-mode`). New `ContentPageShell` and `ContentPageHead` (Components 2.22) on the existing tokens, and a branded not-found page (`app/not-found.tsx`, `content-pages.css`). Refer a Friend, Gift a Souvenote and Redeem Gift removed with their styles (`account.css`, `options.css`, `checkout-flow.css`, `mycards.css`). No new colours. |
| 1.7 | 2026-11-08 | Remaining screens, Phase 2: Saved Cards & Songs, Profile and Settings move onto the system ([Components 2.23](02-components.md)). They add the confirm dialog, library rows with "Saved until", the settings section list, the two-step setup dialog, delete account, and the Log In code step. `account.css` and `mycards.css` are removed. The Delivery address field grid is shared with Settings (`:is(.souv-delivery, .souv-account)`). No new colours. |
| 1.8 | 2026-11-08 | Remaining screens, Phase 3: FAQ, Contact and the four legal pages move onto the system, plus the cookie banner and the summary-style upload consent ([Components 2.24](02-components.md)). They add one shared FAQ accordion with list and table answers, the long-form legal layout with contents and a draft notice, and Decline/Accept at equal weight. `FAQ.tsx`, `LegalData.tsx` and `LegalPageClient.tsx` are removed. No new colours. |
| 1.9 | 2026-11-08 | Remaining screens, Phase 4: Community Cards becomes the real catalog ([Components 2.25](02-components.md)), with occasion rows, chips and search, public examples for signed-out visitors, and the "Send this card" message pop-up, with no gold. The last old dark page shell (`Pages.tsx`, `StaticPageChrome.tsx`, `PageChrome.tsx`, `pages.css`) is removed. No new colours. |
| 1.10 | 2026-11-08 | Remaining screens, Phase 5: Canada and the US. Adds the "Prices for" switch, the currency code after prices, read-only country and currency in Settings, the cart re-pricing notice and the Estimated tax row ([Components 2.26](02-components.md)). Delivery's section is now "Postage", with no delivery-time promise. No new colours. |
| 1.11 | 2026-11-08 | The after-purchase pop-up ("Your cards are waiting") moves to design-system colours: ivory option cards with a one-line explanation each and a decorative dot, replacing the four filled buttons ([Components 2.27](02-components.md)). `/create` no longer checks credits before opening Personalize a Template, and Personalize's "Before you start" pop-up on opening is removed (the "entry" variant of the cards-or-credits choice is gone); both create flows ask only at Create. No new colours. |
| 1.12 | 2026-11-08 | Site audit Phase A: the signed-in menu sets related links two across so it fits one screen; the cart's "Log in before checkout" moves onto `FlowDialog`; shared form behaviour (`focusFirstInvalid`, in-flight guards, focus after a control disappears); the cookie banner styled on every screen; legal pages fit phones; honest messages for half-finished actions ([Components 2.28](02-components.md)). No new colours. |
| 1.13 | 2026-11-08 | Site audit Phase B: compact Top up and checkout pop-ups, Community Cards send fits a phone, forest selected chips with tone dots, even grids for facts and FAQ topics, the gold logo only on forest in the cart, no signed-out nav flash, section eyebrows on Delivery, a cookie banner without inner scroll ([Components 2.29](02-components.md)). **Two new colours:** `--sv-field-line` #8A7B77 and `--sv-graphite-600` #514C4A, which were raw values in the app ([Foundations 1.1](01-foundations.md)). |
| 1.14 | 2026-11-08 | Site audit Phase C, cleanup with no visual change: about 4,400 lines of dead CSS removed from the global stylesheets (`site.css`, `bmc.css`, `colors_and_type.css`, `checkout-flow.css`, `next-app.css`, `landing-chrome.css`); `options.css` retired. The Navbar and Footer keep only the landing variant (the CSS-mask logo and un-tinted logo files are no longer used by any page). Logos use `next/image`. One money helper (`formatAmount` in `priceLists.ts`) and one total rule (`orderTotals` in `taxEstimate.ts`). New "Retired files" list above. |
| 1.15 | 2026-11-08 | Site audit Phase D: lesser-used colours on the shared screens, each within its meaning: gallery tones on the cart pack picture, terracotta edges on Delivery's address cards, a coloured stripe per Profile balance tile (gold for AI credits), terracotta stripes before Saved Cards headings, and raised ivory for the open Settings section ([Components 2.30](02-components.md)). No new colours. |
| 1.16 | 2026-11-08 | **New rule: no eyebrow above a page heading** ([Foundations 1.2](01-foundations.md)). The small breadcrumb labels are removed from every page: Community Cards, FAQ, Contact, the legal pages, Saved Cards & Songs, Profile, Settings, the account gate, not found, Cart, Delivery, Confirmation, Pricing (both bands), Build My Card review and the Log In, Sign Up, reset, verify and grace screens, including the small method labels above "Sign up with social" and "Log in with email" ("Fastest", "Social", "Email"). `ContentPageHead` no longer takes an `eyebrow` prop. Pop-up eyebrows stay. No new colours. |
| 1.17 | 2026-11-08 | Build My Card writers: a sign-off chip row in the AI writer box, and an "inside message changed" notice for lyrics ([Components](02-components.md), AI writer). Both use existing chip and stale-notice styles. No new colours. |
| 1.18 | 2026-11-08 | Build My Card and Personalize: a "What should change?" redraft note under the AI message and the lyrics, with quick-pick chips and an optional line ([Components](02-components.md), AI writer). Existing chip and field styles. No new colours. |
| 1.19 | 2026-11-08 | Personalize names step: an optional relationship field ("They’re your…"), shown in "Your card so far" ([Components](02-components.md), AI writer). Existing field styles. No new colours. |
| 1.20 | 2026-11-08 | Personalize gains Build My Card's "Choose the sound" step, with the card's suggested genre gold and pre-selected ([Components](02-components.md), AI writer). Existing tile styles. No new colours. |
| 1.21 | 2026-11-09 | Audit follow-up, the screens never opened before: **busy buttons stay focusable** (`aria-disabled` instead of `disabled` while saving or sending, with a guard in each handler) on Delivery, every Settings form, `ConfirmDialog`, Contact, Community send and the sign-in screens ([Components 2.28](02-components.md)). Field errors and focus on the two-step code, "Last four digits" and saved-recipient fields; focus after Cancel, Edit and "Back to email and password". **"Cookie settings" on the sign-in screens' footer** ([2.24](02-components.md)). The two-step setup and Delete account pop-ups made compact so they fit one screen, and a script word in every Settings dialog title ([2.31](02-components.md)). Debug hooks: `__souvSetDemoBalance`, `__souvZeroDemoBalance`, `__dlvSetCards` and `__dlvOpenCheckout` removed; `__souvResetMockData` set only in mock mode. No new colours. |
| 1.22 | 2026-11-09 | Audit follow-up, owner choices: **focus moves to the new page's heading after a page change** (`RouteFocus` in the root layout; not on first load, and not when the page or a dialog already placed focus). Steppers, gallery arrows and the scroll-row arrows (Community Cards and Personalize, owner-approved) stay focusable at their limit (`aria-disabled`). Delivery's bar and Contact's thank-you buttons are one width. The Log In code field is marked invalid on a wrong code ([Components 2.28, 2.31](02-components.md)). No new colours. |
| 1.23 | 2026-11-09 | Prompt 2: **high contrast** (selected states get a Highlight outline; dialogs, the Top up pop-up, the cookie banner and nav menus get a CanvasText edge), nav link names that match their visible text, the nav underline still under reduced motion. **Phones:** the Top up pop-up shows one card offer at a time and compact credit rows, and checkout has a collapsible summary bar, so both fit one screen ([Components 2.32](02-components.md)). **Weight:** no Google Fonts import, so the `--font-*` tokens point at the self-hosted Lato ([Foundations 1.2](01-foundations.md)); route-only stylesheets leave the root layout; smaller images, AVIF, a static share image, app icons. No new colours. |
| 1.24 | 2026-11-09 | Delivery's error pop-up moves onto `FlowDialog` (ivory card, berry stripe, Lato, one "Got it"); the last pop-up on the old dark look. `bmc.css` is retired. Arrow keys move the `/create` and Welcome carousels. Community Cards' send pop-up titles get their script word. More unused files listed under "Retired files". No new colours. |
| 1.25 | 2026-11-09 | The no-eyebrow rule widens to **no small label beside or around a heading** ([Foundations 1.2](01-foundations.md)). Removed: "Personalizing" above the template name on Personalize a Template, the "N of 3 approved" count in the Build My Card review header, and the phone section markers ("Part 1 of 3 · Front") in Build My Card questions and Review. `SectionMark` is removed from `components/bmc/ui.tsx`. No new colours. |
| 1.26 | 2026-11-09 | Build My Card "Choose a visual style" moves from six-across tiles (labels like "Watercolor" and "3D / Claymation" spilled out and "Artistic / Painted" wrapped to three lines) to the standard pill chips used by Occasion and Finish, keeping the swatches. New rule in [Components 2.17](02-components.md): chips for short-label lists, tiles only for options with a sub-line or picture, never tiles squeezed to fit. The `.is-style` tile overrides are removed from `bmc-questionnaire.css`. No new colours. |
| 1.27 | 2026-11-09 | Prompt 1B, Build My Card and Personalize: the busy-button rule (2.28) now covers both flows. That's the action bar's Continue and Create, the AI writer, Rewrite, Suggest, Suggest more, Rewrite storyboard, the lighter-stories checkbox, Send idea and Review's decision buttons, all `aria-disabled` while working, with one busy look. Focus never falls to `<body>`: not on first load of a saved draft, the heading after Personalize's view changes, the next control after removing a photo, "Describe them instead" and "Print this one". On phones, a hidden "Part N of M" line, and Review's cards take focus. Fit: the photo step with photos, "Your card so far" at 1024–1279px, a one-row redraft note on desktop, the Personalize header on one line, two-across lead stories, and a phone-sized "Top up to create your card" pop-up ([Components 2.33](02-components.md); 2.18 and 2.19 updated). No new colours. |
| 1.28 | 2026-11-09 | Owner, audit §8 D1 and D2. **Message step:** the AI writer's sign-off chips become one select on the "What should change?" row. The AI box is 4 rows on desktop and grows with its text, and the counter sits in its corner. The step fits one screen at 1280×720 and 1024×768. **Lyrics step:** the rewrites-left line moves into the lyrics header, and the lyrics run in three columns from 1280px, so the step fits one screen. Both flows ([Components 2.17, 2.33](02-components.md)). No new colours. |
| 1.29 | 2026-11-09 | Owner, audit §8 D3: the Comic Card storyboard fits one screen on desktop. **Desktop:** one row per panel (number, what happens, two wrapping bubbles with their word count in the corner), and "Rewrite storyboard" in the action bar. **Phones:** one panel per screen with "Next: panel N". Boxes grow with their words instead of scrolling ([Components 2.20, 2.33](02-components.md)). The side-by-side columns first proposed were measured and didn't fit (162px columns). No new colours. |
| 1.30 | 2026-11-09 | Owner, audit §8 D4 and D5. **On This Day:** three lead stories first, three across on desktop, then "Show N more stories" (focus moves to the first one revealed); the research note and the lighter-stories option on one line; tighter AI suggestion cards on desktop. **Front words:** a closed "Check the spelling (N)" disclosure (`FrontWords`) on Review and "Ready to create" for all four Personalize cards, replacing the "Front words: …" notes. All of these fit one screen at 1280×720 and 1024×768 ([Components 2.20, 2.33](02-components.md)). No new colours. |
| 1.31 | 2026-11-09 | Owner, audit §8 D6: the image-rights pop-up on phones is two screens, the five promises in full, then the photos waiting, the links and the two ticks. Focus goes to the title on each change, Back keeps the ticks, and the buttons are side by side. Same words and attestation version; larger screens are unchanged ([Components 2.18, 2.33](02-components.md)). No new colours. |
| 1.32 | 2026-11-09 | Owner, audit §8 D7: Personalize Review on phones puts the first card's decisions on the first screen. The template header is one line (smaller name and link), the "Look it over" header is tighter, and the front picture is 190px wide. Personalize only; Build My Card's phone Review already fitted ([Components 2.33](02-components.md)). No new colours. |
| 1.33 | 2026-11-09 | Owner, audit §8 D8: Review approvals are saved with the draft (`brief.control.approvals`) in both flows, so "Back to review" from Delivery, a reload or Saved Cards keep them. An edit or a new version still un-approves just that piece. No visual change; no new colours ([Components 2.33](02-components.md)). |
| 1.34 | 2026-11-09 | Owner, audit §8 D9: single-choice questions start on an answer only when it's the usual one, free and easy to change. New: Build My Card's shape (Portrait), its genre (the top suggestion) and Personalize's "What goes in the song?" (Yes / Yes). Choices that cost a credit or change what the card is about start empty on purpose, the documented exception to "a radio group always has a checked item" ([Components 2.17, 2.33](02-components.md)). No new colours. |
| 1.35 | 2026-11-09 | Owner, audit §8 D10: the cards-or-credits choice reads "Top up to make a new *version*" (with matching card and "back to your review" lines) when it opens from a paid "Try again" on Review; Create keeps "Top up to create *your card*". `TopUpChoiceDialog` gains a `"redo"` variant ([Components 2.18, 2.33](02-components.md)). No new colours. |
| 1.36 | 2026-11-09 | Owner, audit §8 D11: Build My Card "Choose your accents" with Custom open fits one screen at 1024–1279px (8px gaps and a 44px Custom field). With this, all Prompt 1B decisions are built ([Components 2.33](02-components.md)). No new colours. |
| 1.37 | 2026-11-09 | Owner, Prompt 2 for the flows (`PROMPT-2B-REPORT-2026-11-09.md`): "Your card so far" is an `h2`; AI results are announced (`BusyAnnounce`); the AI writer's on state is outlined in high contrast; Review's toggles keep the visible word "Approve"; 44px hit areas on the summary rows and links, with chips and swatches recorded as an exception; berry hover on decision buttons and top-up options; 1px tile lift; no hover glide under reduced motion; short-phone (≤700px tall) layouts for both "Top up to…" choices and the rights pop-up; a reserved screen height against layout shift; lazy QR library and Personalize questionnaire ([Components 2.17, 2.34](02-components.md)). No new colours. |
| 1.38 | 2026-11-09 | Owner, Community Cards audit, the recommended set (`build-fixes/community-sharing-2026-11-09/COMMUNITY-CARDS-AUDIT-REPORT-2026-11-09.md`):<br>• each card's own page, `/community-cards/{id}`, with its own preview, and Share links pointing there;<br>• a guest pop-up showing the card;<br>• the guidelines as five disclosures that fit one screen;<br>• the Send pop-up back to its one-screen height, plus a short-phone block for the Send, guest and guidelines pop-ups;<br>• "Share to Community Cards" on a community card's Review, with "Share a card I made" and "Your shared cards" back on the page;<br>• community mode saved with the draft, the Photo tab called "Front", and "Who it's from and to" skipped;<br>• a notice for unknown card links;<br>• Delivery wording taken from the card, and a back label naming its destination ([Components 2.25](02-components.md)).<br>No new colours. |
| 1.39 | 2026-11-09 | Owner: **no eyebrows anywhere**, pop-ups included ([Foundations 1.2](01-foundations.md)). Removed:<br>• "Account required" (the cart's log-in prompt and Build My Card's sign-up);<br>• "Before we upload" (rights pop-up), "Creating", "Uses 1 credit", "Everything approved";<br>• "Secure checkout", "Almost there" (the top-up choice);<br>• Delivery's "Your keepsake is approved" (the section keeps a hidden name);<br>• every Community Cards eyebrow.<br>`.fd-title` has no top margin and keeps clear of the close button (36px; centred titles both sides; 48px on short phones). The eyebrow classes are listed under dead CSS. No new colours. |
| 1.40 | 2026-11-09 | The last eyebrow is removed: the item-kind line ("Card pack", "Creation credits", "Saved card") above each cart item name. The thumbnail badge still names the kind for screen readers. `.ct-line-kind` is removed from `checkout-flow.css`, and `.ct-line-name` has no top margin. No new colours. |
