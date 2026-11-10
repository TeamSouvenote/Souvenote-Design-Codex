# Build prompt: Create Options page (`/create`)

_Written 2026-11-04. Every decision below was approved by the owner. Don't change behaviour, copy or design
direction without asking first, using multiple-choice questions._

> **Revised after the first build (owner, 2026-11-04). These changes replace the matching parts of §3, §5 and §6:**
> - **Hierarchy instead of a 2x2 quadrant.** Template and Build are the main two. On desktop (now **1024px and
>   wider**, not 1100px) they're large opened cards on top, tilted slightly toward each other. Community and Saved
>   are 72% the size underneath and stay still. Main cards never go under 390px wide, so very short windows scroll
>   a little.
> - **Below 1024px:** a **two-card** carousel (Template, Build), then Community and Saved as two small **closed**
>   5x7 cards (front only: title, sketch, arrow; the handwriting is still read out to screen readers). The 4-card
>   carousel and its hidden fourth card are gone.
> - **Exact 5x7 shapes:** opened cards are always 10:7 and closed cards 5:7. Contents are sized in `cqi`, so text
>   scales with the card instead of stretching it. Titles keep their last two words together ("a Template").
> - **Motion:** a slower, gentler "breathe" on the main two only (7s, 1.2% swell), instead of the 3.6s, 3% throb.
> - **Saved sketch:** a heavier safe with an open door on gold hinges, locking bolts, a silver combination dial
>   and a spoked handle wheel.
> - **Cart badge:** the nav shows the real number of items in the saved cart on every page (not a fixed number).
> - Current details live in `DEVELOPER_HANDOFF.md` ("Create Options page").

---

## 1. Context

Souvenote is being redesigned one page at a time in the **berry & ivory** design system. Finished so far: the
landing page `/`, the auth pages, the **Welcome modal**, and the signed-in **Home** `/home`. Everything since the
landing page is **uncommitted**. Don't commit, deploy or run migrations.

Your job: rebuild **`/create`** (the "Create Options" screen that Home's "Create a Card" button opens) so it looks and
behaves like the **Welcome modal's opened-card picker**, as a full page with **four** options in a 2x2 quadrant.

### Read these first

| What | Where |
|---|---|
| Handoff notes (start here) | `DEVELOPER_HANDOFF.md` |
| Design system | `design-system/README.md`, `design-system/docs/01-foundations.md` to `05-content.md`, `design-system/tokens/tokens.css` |
| Welcome modal: the look to copy | `frontend/app/components/Auth.tsx` (`WELCOME_OPTIONS`, `WelcomeOptions`, `WelcomeModal`), `frontend/app/styles/auth.css` (the "Options as opened 5x7 greeting cards" section, roughly lines 918-1300) |
| Pencil sketches | `frontend/app/components/WelcomeSketches.tsx` |
| Welcome reference screenshots | `saved-ui/home-nav-2026-11-04/screenshots/welcome-modal-*.png` |
| Current `/create` (old dark design, being replaced) | `frontend/app/create/page.tsx`, `frontend/app/components/CreateOptionsClient.tsx`, `TileGrid`/`OptionsHeader`/`BackButton` in `frontend/app/components/Options.tsx`, `frontend/app/styles/options.css`, `options-screenshot.png` |
| Signed-in page shell to mirror | `frontend/app/home/page.tsx` (nav, backdrop, skip link, signed-out redirect, landing footer) |
| Credit rules | `frontend/app/components/createFlowRules.ts`, `frontend/app/components/PricingReturn.ts`, `frontend/app/lib/creditBalance.ts` |
| Credits line | `frontend/app/components/landing/CreditsLine.tsx` (was `HomeCreditsLine.tsx`) |
| Fonts | `frontend/app/lib/brandFonts.ts` (`brandFontVariables`, `handFontVariable`) |

---

## 2. Page anatomy (top to bottom)

1. **Skip link** to `#main` (`l-skip`, same as Home).
2. **Signed-in nav**: the same as Home, `<DemoNavbar ... navVariant="landing" alwaysSignedIn />`. **Don't** pin it
   (`followUserOnScroll` is only for `/` and `/home`; on every other screen the nav scrolls away).
3. **`<main id="main">`**:
   - **h1**: "Choose how to *create your card*". Lato 300, light. "create your card" in Lobster Two, berry. Use
     `text-wrap: balance`. Size it smaller than the landing display size so the page fits one screen (see §5).
   - **Subtext**: "Pick a card to get started." (same as the Welcome modal).
   - **Credits line**: "You have N credit(s)", reusing `CreditsLine` (empty while loading, on error, or when
     signed out, so the layout doesn't jump; `aria-live="polite"`). It's fine that this asks for the balance a
     second time (the same is accepted on Home).
   - **The four opened cards** (§3, §4).
   - **"Back to home"** pill button → `/home` (restyle the existing `BackButton` idea in berry & ivory: outlined
     pill, 44px+ tall, chevron icon).
4. **Footer**: the landing variant, as on Home: `<Footer variant="landing" communityCardsHref={COMMUNITY_CARDS_HREF} lede={FOOTER_LEDE} />`.

Page background: the ivory page with the soft fixed glows (`l-backdrop`), the same as Home. No dark starfield, no
rose-gold metallic text: all of the old `opt-*` look goes.

---

## 3. The four options

Same opened 5x7 card as the Welcome modal: **10:7 landscape**, two halves tilted about the fold.
- **Left half**: coloured card stock, grain, fold shadow, title (Lato 400), pencil sketch at the bottom.
- **Right half**: ivory paper, terracotta stationery frame, explanation in **Patrick Hand**, graphite `#514C4A`,
  and the round berry arrow at the bottom right.

| Position | Option | Left panel | Ink | Route | Handwriting (exact copy) | Sketch |
|---|---|---|---|---|---|---|
| Top left | **Personalize a Template** + forest "Most popular" pill badge | Gold `--sv-gold-400` | Espresso | `/create/personalize-a-template` | Need inspiration? Personalize one of our pre-built cards like Horoscope or Comic cards! | `TemplateSketch` (existing) |
| Top right | **Build My Card** | Berry `--sv-berry-500` | Ivory `--sv-ivory-200` | `/create/build-my-card` | Have your own idea? Answer a few questions and watch your card come to life. | `BuildSketch` (existing) |
| Bottom left | **Community Cards** | Forest `--sv-forest-700` | Ivory | `COMMUNITY_CARDS_HREF` (`/community-cards`, the noindex placeholder). A normal link, **not** "Coming soon"/disabled | Choose from our collection of ready to send cards, just add your personal message. No AI credits required. | `CommunitySketch` (existing) |
| Bottom right | **Saved Cards & Songs** (NEW) | **Espresso `--sv-espresso-700`** (#4A3B39) | Ivory (9.41:1) | `/create/my-cards-and-songs` | Resume a draft. Re-send a saved card. Queue another song. | **`SavedSketch` (new, see §4)** |

Titles, routes and handwriting for the first three must match the Welcome modal exactly. Ideally they come from
one shared data list, so the two can't drift apart.

---

## 4. New sketch: `SavedSketch`, someone pulling cards out of a safe

Add `export function SavedSketch()` to `WelcomeSketches.tsx`. Draw it in the **same hand** as the other three:

- The same `SketchSvg` wrapper: `viewBox="0 0 150 124"`, `aria-hidden`, `stroke="currentColor"`, `strokeWidth` about
  1.3, round caps and joins, and the `feTurbulence` + `feDisplacementMap` pencil filter through `usePencilId()`.
- Line work takes the panel's ink colour (`currentColor` = ivory on espresso). Small flat fills come from the
  existing `C` palette (gold, berry, terracotta, ivory, oat, forest, platinum). **Don't use `C.ink` (espresso)
  for anything that sits directly on the panel**: it would disappear on the espresso background.
- Scene: a small, sturdy **safe/vault**, drawn in outline, with its **door swung open** (hinge side, round
  combination dial with tick marks, lever handle). Inside: two or three shelves of mini 5x7 cards, the same
  size and style as the cards in `CommunitySketch` (coloured rect + pencil-outline rect, slight random tilts).
  Put one tiny musical note or vinyl disc among them for "songs".
- A **person** in the same stick-and-curve style as Build/Community (round head, hair strokes, simple body),
  standing or crouching beside the safe and **pulling a card out**, with one card held in the hand, tilted, in
  gold or terracotta.
- A floor line and one or two small sparkles, as in the other sketches. Keep the detail at the same density as
  the others: it must still read at the phone size (`max-height` 100px, 84px on short phones, 64px landscape).
- It must also read clearly at the desktop size. Check it next to the other three in a screenshot.

---

## 5. Layout and responsive behaviour

### Desktop (≥1100px): a 2x2 quadrant
- Grid: Template | Build on top, Community | Saved below. All four cards the **same size, upright and level**
  (no fan, no enlarged centre card: that was Welcome-only).
- Gaps of about 28-40px between cards. The whole grid is centred within the 1200px max width.
- **Must fit one screen at 1440x900**: nav, h1, subtext, credits line and **all four cards fully visible** with
  no scrolling. The Back button and the footer may sit below the fold. Work out the card width from the
  available height (roughly 420-460px wide each, so about 295-320px tall), and size the heading to suit. Also
  check 1280x800 and 1920x1080, and make sure nothing breaks at 1100-1279px wide.
- Text sizes follow the Welcome desktop side cards: title about `clamp(1.2rem, 1rem + 0.55vw, 1.6rem)`,
  handwriting about 19-21px (body text never under 16px).

### Below 1100px: the Welcome carousel, with four cards
- Reuse the Welcome carousel behaviour exactly: `(max-width: 1099px)`; the centre card plus the side cards
  peeking out on both sides; mouse hover auto-rotates (1700ms), skipping a turn while the pointer is over the centre card; touch
  press-and-hold (380ms) rotates; a swipe (40px or more) steps one card; tapping a side card moves it to the
  centre; tapping the centre card opens it; each new press clears the "ignore next click" flag; keyboard focus
  centres the focused card; mouse right-click works, but the long-press menu is blocked for touch/pen.
- **Four cards** in quadrant order: Template, Build, Community, Saved, **starting on Template**. The position
  maths in `WelcomeOptions` assumes three cards (`-1/0/1`). With four, one card is always out of view, so give
  it a hidden position (not visible, not focusable, not clickable) and make wrap-around from Saved back to
  Template animate cleanly.
- **4 dots**, each with a 44x44px tap area, `aria-pressed`, and `aria-label="Show {title}"`.
- Phone fit: everything from the nav down to the dots fits at **390x844** (the footer and Back button may be
  below). Also check 320x568, 360x740, 375x667, 1024x768, and phones turned sideways (844x390, 667x375,
  932x430). For sideways phones copy Welcome's 2-column landscape rule (heading block left, carousel right,
  card sized from `100dvh`).
- The narrowest phones (<360px) get Welcome's fix: the track is held to the screen width, cards 90% wide,
  handwriting 17px.

### Code sharing (don't break Welcome)
Pull the option data, the opened-card markup and the carousel logic out of `Auth.tsx` into shared code (for
example `components/OpenedCardPicker.tsx` + a `useCardCarousel` hook, with styles that work outside `.souv-auth`)
so both screens use it. The **Welcome modal must look and behave exactly as before**: same three cards, same
desktop fan, same 3-card carousel. Prove it by re-running `~/souv-qa/welcome-measure.js` and `fixes-1104.js`
and comparing new Welcome screenshots with `saved-ui/home-nav-2026-11-04/screenshots/`. Put the page styles in a
new `frontend/app/styles/create-options.css` scoped to the page, using `--sv-*` role tokens.

---

## 6. Motion

- Keep the **throb**: 3.6s ease-in-out, scale to 1.03, leaves opening from about 10deg to 2deg, staggered per
  card (four delays, e.g. 0, -0.9s, -1.8s, -2.7s).
- Hover: pause the throb where it is, lift the card 6px, open the leaves a little more, and fill the arrow
  berry. The same on `:focus-visible`, with the 3px focus ring on both halves.
- `prefers-reduced-motion: reduce`: no throb, no hover lift or rotation, and no auto-rotation from hover or
  press-and-hold. Tapping, swiping and the dots still change cards. Every card stays fully visible.
- `forced-colors: active`: titles, handwriting, sketches and the focus ring stay visible.

---

## 7. Behaviour

- **Signed-in only**, the same as `/home`: add the inline `SIGNED_OUT_REDIRECT_SCRIPT` (before paint,
  `location.replace("/")` when no session is stored) and `<SignedOutRedirect />` for a stored session that turns
  out invalid. Remove `CreateOptionsClient`'s `fallbackUser` path.
- **0 credits** (keep today's logic in `CreateOptionsClient.handleTileSelect`): choosing **Template** or **Build**
  with fewer than `MIN_GENERATION_CREDITS` sends the user to `goToPricingAfterPurchase(href)`, so they return to
  that option after buying. **No lock icon** and no visual change on the cards. Community and Saved never check
  credits. In the carousel, the check runs only when the **centre** card is opened (a tap on a side card only
  centres it).
- **The balance is always confirmed by the backend before the choice goes through** (owner, 2026-11-04): every
  time Template or Build is opened, fetch the balance fresh from the backend (even if the page already has
  one) and decide only once it answers. While it checks, that card's arrow shows a small spinner and repeat
  clicks are ignored. If the backend can't be reached, stay on the page and show under the cards: "We couldn't
  check your credits. Please try again." (approved, `role="alert"`). Tapping the card again retries.
- Cards are real `<Link>`s, so Cmd/Ctrl-click and right-click → "open in new tab" work. When a credit redirect
  happens, the click is prevented and the router is used instead.

---

## 8. SEO / AEO / GEO

- `frontend/app/create/layout.tsx` already sets `robots: NOINDEX`. Keep it.
- Add `export const metadata = { title: "Create a Card | Souvenote" }` to `create/page.tsx` (approved). No
  description, canonical or structured data (the screen is signed-in only and user-specific).
- Don't add `/create` to the sitemap.

---

## 9. Accessibility (WCAG 2.2 AA, audience: women aged 40-65)

- One h1. The list has `aria-label="Create options"`. Each card is one link whose name is its title plus its
  handwriting (as in Welcome). The "Most popular" badge is real text inside the link.
- Sketches, grain, the frame and the arrow are `aria-hidden`.
- Every tap target is at least 44x44px (cards, dots, Back button). Contrast is AA throughout: ivory on
  espresso/berry/forest, espresso on gold, graphite on ivory.
- Body text at least 16px (17px from 600px). Keyboard order is logical: Template, Build, Community, Saved, then
  Back.

---

## 10. Copy

All of it is approved. **Don't add or change any user-facing text without asking**, and list any new string
(such as an error message) in your report.

- Tab title: **Create a Card | Souvenote**
- h1: **Choose how to *create your card***
- Subtext: **Pick a card to get started.**
- Credits line: **You have N credit / N credits** (existing `CreditsLine`)
- Badge: **Most popular**
- Card titles and handwriting: the table in §3
- Dots: **Show {title}**. Back button: **Back to home**
- Balance check failed: **We couldn't check your credits. Please try again.**
- Spoken label while checking: **Checking your credits** (approved 2026-11-04)

---

## 11. Clean-up

- `CreateOptionsClient` stops using `OptionsHeader`, `TileGrid` and `BackButton`. `Options.tsx` is still imported by
  `frontend/app/pricing/page.tsx`, so **don't delete the file**. Only remove exports that nothing else uses,
  and ask the owner before deleting anything.
- Don't touch the Pricing, Saved Cards & Songs, Build or Template pages themselves.

---

## 12. QA and hand-off

- **Never run `next build` in `frontend/` while the owner's `npm run dev` is on :3000** (check `netstat` first). For
  production-build checks, build a copy and serve it on **:3217**.
- Stub every external request in browser QA (Cognito, the API, the credit balance). Don't use real sign-ups or
  live services. Test the 0-credit redirect, balances of 1 and 2, balance loading, and balance error.
- Check every viewport listed in §5 for no scroll down to the cards (or dots), and for the cards not being
  clipped. Re-check that the Welcome modal is unchanged.
- Save screenshots (1440x900, 1280x800, 390x844, 320x568, 844x390, reduced motion) and the working tree to
  `saved-ui/create-options-<date>/` (files, patch vs `a90ed6b`, screenshots, README). Update
  `DEVELOPER_HANDOFF.md` with a "Create Options page" section.
- Report plainly: what changed, any new copy, anything blocked by the backend, and anything not done.
