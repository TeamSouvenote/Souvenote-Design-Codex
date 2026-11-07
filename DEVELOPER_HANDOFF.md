# Developer handoff notes

Open items from the landing, auth, Welcome modal, signed-in Home and Create Options redesign (branch `landing-page-redesign`).
Keep this list current as items are resolved. Last reviewed 2026-11-05.

Latest snapshot of the working tree: `saved-ui/create-options-2026-11-04/` (README there explains how to restore it).

## Before merging

- **The redesign is committed on `landing-page-redesign`, not merged into `main`.** Landing (`a731844`,
  `65367c4`, `4bc032f`, `a90ed6b`); auth, Welcome modal, `/home` + nav, `/create`, Pricing, backend consent
  changes and migrations 004/005 (`51dabff`); the 2026-11-05 Pricing pass in the commit after that. Merge
  through a pull request.
- **`reference-materials/` (98 MB) and `saved-ui/` (13 MB) are git-ignored.** They are local design references
  and saved UI snapshots; keep them out of commits.
- **CI now runs `npm test` in `frontend/`** (`.github/workflows/ci.yml`). The script uses
  `node --experimental-strip-types`, which needs Node 22.6 or later; CI pins Node 22, so make sure it resolves
  to 22.6+.

## Before deploying

- **Run database migration 004 before deploying the backend or frontend.**
  `backend/database/migrations/004_consent_terms_marketing.sql` adds `terms_accepted_at` and `terms_version`.
  Every user read and profile update in the backend selects these columns, so on a database without 004
  the API returns errors and sign-in breaks. Migration 005 is a one-time data fix to run once after 004 on
  existing databases (see `backend/database/README.md`).
- **Run migration 006 on existing databases** (`006_print_and_send_offer.sql`, safe to re-run): it adds the
  `print_and_send` offer that the Pricing page now reads. Without it the page still shows $9.99 (its fallback).
- **Staging and preview deploys would be indexed by search engines.** `SITE_URL` is hard-coded to
  `https://souvenote.com` (`frontend/app/lib/site.ts`), and `robots.txt` allows everything. Any non-production
  deploy will (a) set canonical, Open Graph and sitemap URLs to production and (b) be crawlable. Make
  `SITE_URL` an env var and serve `Disallow: /` (or a site-wide noindex) outside production.
- **Restrict backend CORS.** `backend/server/src/main.ts` uses `origin: true` (any site may call the API).
  Limit it to the real frontend origins.

## Cognito settings the frontend now depends on

Check these in the Cognito console; the UI copy assumes them:

- **Social sign-in isn't enabled on the app client.** The Google, Apple and Facebook buttons show on Sign Up
  and Log In, but the 2026-11-02 integration test found Cognito answers "Login option is not available" for
  all three. Configure the providers and enable them on the app client. The owner chose (2026-11-04) to keep the
  buttons showing until then.
- **Email verification must use codes, not links.** Sign-up and password reset both ask the user to type a
  6-digit code. The pool's verification type must be "Code".
- **Password policy must allow the UI's rule.** The forms say "At least 12 characters". Set the pool minimum
  to 12, or at least not higher than what the UI enforces.
- **Token lifetimes must match the copy.** Log In says "Remember me on this device · 30-day rolling session"
  (refresh token validity 30 days). The expired screen says "Verification codes last twenty-four hours"
  (Cognito's default for sign-up codes).

## How the new auth behaviour works

Worth knowing before changing these areas:

- **Remember me.** Ticked (default): session stored in `localStorage`, survives a browser restart. Unticked:
  stored in `sessionStorage`, ends when the browser closes. The Cognito SDK's own token cache follows the same
  choice. Social sign-ins are always remembered. See `frontend/app/lib/cognitoAuth.ts`.
- **Sign-up profile is saved after the account exists.** Birthday, country/currency, the marketing choice and
  Terms acceptance are held in `localStorage` (`souv_pending_signup_profile`) until the account has a session
  to save them, then sent to `PATCH /auth/me`. The record expires after 7 days, is dropped after 3 failed
  tries or a 4xx, and is cleared on logout. It contains a birthday, so treat it as personal data.
- **Terms consent for social sign-ups.** Social sign-ups skip the sign-up form's Terms checkbox, so the first
  social sign-in with no `terms_accepted_at` redirects to `/signup/terms`. Limits:
  - It's enforced only in the browser. The backend doesn't refuse requests from users without acceptance.
  - It checks only whether acceptance exists, not the version. Bumping the "Last updated" dates in
    `frontend/app/lib/legalVersions.ts` won't re-prompt anyone.
  - Users who sign in with email/password and have no record (accounts created before migration 004) are
    never prompted.
  - The comment in migration 004 says social sign-ups "do not show the terms checkbox"; that's now out of
    date because of `/signup/terms`.
- **Password reset signs out every device.** After a new password is set, the account is globally signed
  out (all refresh tokens revoked) and then signed in fresh on this device.
- **Forgot password and resend code don't reveal accounts.** An unknown email is treated as "sent".
- **Profile phone fix (backend).** Omitting `phone` in a profile update now keeps the saved number; an empty
  string clears it. Previously an omitted phone was wiped.
- **Account Profile and Delivery** now use the signed-in user instead of the hard-coded demo user.

## Not built yet (backend)

- **Account recovery (`/recover`).** The screen is designed, but there is no backend behind it, so it cannot
  restore an account scheduled for deletion. The spec is in `backend/docs/account-recovery-spec.md`.

## Decided 2026-11-04

- **`/verify` and `/verify/expired` stay as unused fallbacks** (noindex, not linked). Sign-up confirms the
  6-digit code inline on the Sign Up page and shows expired-code errors there. The expired screen's label
  "Expired code" is approved (not the original design's "Expired link").
- **Welcome modal pill stays "2 CREDITS in your account."** (not "2 FREE CREDITS").
- **Welcome modal closes on a backdrop click** (as well as Close and Escape), only when the press starts and
  ends on the backdrop (`WelcomeModal` in `Auth.tsx`). This settles item #8 in the 2026-11-03 PROPOSED-FIXES.
- **Footer "About" is hidden** until an About page exists (`Footer.tsx`).
- **FAQ answer "Can I buy creation credits without buying a card?" is approved**; the DRAFT marker is gone.
- **Currency copy approved:** "Saving...", "Currency saved.", "Currency could not be saved."
- **Language copy approved:** "Language saved.", "Language could not be saved."
- **Hamburger order:** Profile, Account Settings, then Saved Cards & Songs, Top Up Cards/Credits.
- **Social sign-in buttons stay visible** until Cognito is set up.
- **Sign Out stays last** in the hamburger menu.

## Known and accepted

- **Sign Up scrolls slightly on the smallest phones (iPhone SE, 375x667).** All other auth screens fit one
  viewport. The owner accepted this rather than splitting the phone form into two steps.
- **Welcome modal credit badge is fixed text ("2 CREDITS in your account").** It is correct because the modal
  is only shown once, right after first sign-up (`/welcome` redirects to `/home?welcome=1`). If the modal is
  ever shown at other times, the badge must read the user's real balance.

## Signed-in Home and nav (done 2026-11-04, committed in `51dabff`)

How it works now, for anyone changing these areas:

- **`/home` is signed-in only.** An inline script (`SIGNED_OUT_REDIRECT_SCRIPT` in
  `frontend/app/components/landing/signedInHold.ts`) runs before paint and does `location.replace("/")` when no
  session is stored, so signed-out visitors never see Home. A stored session that turns out invalid is caught
  after load by `SignedOutRedirect.tsx`. `/welcome` and `/home?welcome=1` follow the same rule.
- **`/` sends signed-in users to `/home`** without flashing the landing page (`SIGNED_IN_HOLD_SCRIPT` +
  `SignedInRedirect.tsx`). Signed-out, the logo on `/` links to `/` (stays put).
- **`/home` mirrors the landing page** (same copy from `landing/content.ts`), with "Create a Card" and
  "Saved Cards & Songs" hero buttons and "You have N credit(s)" (`landing/CreditsLine.tsx`).
- **Nav credits box always reads "Credits N".** It shows 0 while the balance loads and if it can't be fetched;
  the tooltip and screen-reader label still say "Loading credits" / "Credit balance unavailable".
- **One menu.** The person-icon account menu was merged into the hamburger on every signed-in screen
  (`Navbar.tsx` `NavRight`): name/email, Profile, Account Settings, Saved Cards & Songs, Top Up Cards/Credits
  (owner's order, 2026-11-04), then (phones under 701px only) the bar's four links incl. Pricing, then FAQ/Contact, legal, Sign Out last.
  Pricing is not in the menu on wider screens (it's in the bar). The menu scrolls when taller than the screen.
- **Gift a Souvenote and Refer a Friend aren't linked anywhere** (owner, 2026-11-04): removed from the menu,
  the Profile page's Quick links and the inner-page footer. The `/gift` and `/refer` pages still exist, and the
  gift add-on in the cart is unchanged. The Profile page's Quick links box now holds only Saved Cards & Songs
  (the Profile page itself hasn't been redesigned yet). With one link the box looks stretched; the owner chose
  to leave it until the Profile page is redesigned.
- **No currency button in the nav.** Currency moved to Account Settings → Preferences (`PrefsCurrency` in
  `AccountForms.tsx`); it saves on change with `PATCH /auth/me { currency }`. Personal info no longer has it.
- **Language lives in Preferences too** (`PrefsLanguage`, next to Currency), saving on change with
  `PATCH /auth/me { language }`. It was removed from Personal info, whose Save no longer sends `language` (the
  backend keeps the saved value when it's omitted). Stored values are still `English` / `Francais`; the option
  is shown as "Français". The old non-working Preferences select is gone.
- **Nav position:** pinned to the top of the screen on `/` and `/home`; scrolls away with the page on every
  other screen (owner chose to keep this).
- **Account pages stay mounted during a sign-in re-check** (`AccountRouteClient.tsx`), so "Currency saved." /
  "Profile saved." no longer vanish when `refreshUser()` runs after a save.
- **`<html suppressHydrationWarning>`** in `frontend/app/layout.tsx`: a browser extension on the owner's machine
  adds `xk-*` attributes to `<html>`. Only that tag's attributes are ignored.

Still open:

- **Saved currency isn't used anywhere.** No price, pricing page or checkout reads `user.currency` yet.
- **Home asks for the credit balance twice** (nav + hero line). Not fixed, by choice.
- **Phone landscape** layout for `/home` not done, by choice.
- **About page** doesn't exist; add it back to the footer's Company column when it does.
- **Welcome modal leftovers** from `saved-ui/auth-welcome-modal-2026-11-03/PROPOSED-FIXES.md`: #10 (fixed "2
  CREDITS" text, accepted, see "Known and accepted"), #11 (carousel starts at 1100px, not 1024px), #13 (small
  clean-ups) and #14 (animation cost on low-end phones, needs a real device). #7's tiny decorative text inside the
  Template sketch is unchanged. Everything else in that file is done (see below).

## Welcome modal fixes (done 2026-11-04, committed in `51dabff`)

All in `frontend/app/components/Auth.tsx` (`WelcomeOptions`) and `frontend/app/styles/auth.css`:

- **Swipe, then tap:** every new press clears the "ignore the next click" flag, so the first tap after a swipe
  works (PROPOSED-FIXES #2).
- **Hover rotation pauses on the centre card** (owner's choice): the timer keeps running, but a turn is skipped
  while the mouse is over the centre card, so the card under the pointer can't change before a click. It still
  rotates while the mouse is over a side card or the gaps (#3).
- **Reduced motion** (`prefers-reduced-motion: reduce`): no auto-rotation from hover or press-and-hold; the
  throb was already off. Tapping, swiping and the dots still change cards (#4).
- **Right-click works for the mouse** in the carousel; the long-press menu is still blocked for touch/pen (#5).
- **Dots** have 44x44px tap areas (were 44x32) (#6). **Phone "Most popular" badge** is 11px (was 10px) (#7).
- **Narrowest phones (under 360px wide):** the carousel track is held to the screen width (it used to grow past
  it and cut off the centre card's right half), the card is 90% wide and the handwriting 17px (#12).
- **Phones turned sideways** (up to 1099px wide, 520px tall or less, landscape): title, pill and "Pick a card"
  sit on the left, the carousel on the right, with the card sized to the screen height (#12).
- **Fit (no scrolling):** checked at 320x568, 360x740, 375x667, 390x844, 667x375, 740x360, 844x390, 932x430,
  1024x768 and 1440x900.

## Create Options page `/create` (done 2026-11-04, committed in `51dabff`)

Built from `CREATE_OPTIONS_BUILD_PROMPT.md` (repo root). Every decision in it was approved by the owner.

- **Look:** the Welcome modal's opened 5x7 cards, on Home's shell (berry & ivory nav, backdrop, landing footer).
  Heading "Choose how to *create your card*", "Pick a card to get started.", the live "You have N credits" line
  (`CreditsLine`), then the cards and a "Back to home" button. Styles: `frontend/app/styles/create-options.css`
  (scoped `.souv-create`).
- **Four options:** Template (gold, "Most popular"), Build (berry), Community (forest, links to the
  `/community-cards` placeholder), Saved Cards & Songs (espresso, new `SavedSketch` in `WelcomeSketches.tsx`:
  someone taking a card out of an open safe). Titles, routes and handwriting come from
  `components/createOptions.ts`, which the Welcome modal uses too.
- **Template and Build are the main two** (owner, 2026-11-04 revision). Desktop (1024px and wider): they're large
  opened cards on top, tilted slightly toward each other, with a slow 7s "breathe" (1.2% swell). Community and
  Saved are 72% the size underneath and stay still. Sized from the screen height so everything fits under the nav
  down to about 1280x800 / 1366x768. Main cards never go under 390px wide (or the small cards' handwriting would
  drop under 16px), so shorter windows scroll a little.
- **Below 1024px:** Template and Build in the Welcome carousel (`components/useCardCarousel.ts`, shared with the
  Welcome modal, here with a 1023px breakpoint), then Community and Saved as two small **closed** cards (front only:
  title, sketch, arrow; the handwriting is still read out to screen readers).
- **Exact 5x7 shape:** opened cards are always 10:7 and closed cards 5:7. Each list item is a CSS size container and
  everything inside is sized in `cqi`, so text scales with the card instead of stretching it. Titles keep their
  last two words together ("a Template").
- **Credits are always confirmed by the backend before Template or Build opens** (owner, 2026-11-04). Each time,
  `CreateOptionsClient` fetches the balance fresh (spinner on the arrow, repeat clicks ignored), publishes it to
  the nav, then opens the option, or goes to Pricing (returning to that option after buying) when there are no
  credits. If the request fails it stays and shows "We couldn't check your credits. Please try again." Community
  and Saved don't check. Cmd/Ctrl-click and "open in new tab" skip this page's check, but the Template and Build
  pages check credits themselves when they load.
- **Signed-in only**, the same as `/home` (`SIGNED_OUT_REDIRECT_SCRIPT` + `SignedOutRedirect`). Tab title
  "Create a Card | Souvenote", noindex from `create/layout.tsx`, not in the sitemap.
- **Live cart badge on every page** (owner, 2026-11-04): the nav no longer takes a `cartCount` prop. `Navbar` reads
  the saved cart (`useCartCount` in `components/cartCount.ts`: the sum of each line's quantity, the same as the
  cart page) and updates when it changes. Everything that writes `souv_cart` (cart page, Pricing, `pricingCatalog`,
  `Options.tsx`) calls `notifyCartChanged()` from `components/cartStorage.ts`; other tabs update through the
  browser's `storage` event. The key `SOUV_CART_KEY` now lives in `cartStorage.ts` (re-exported by
  `pricingCatalog.ts`).
- **Shared opened-card styles** (`styles/opened-card.css`, loaded globally before `auth.css`): colour tokens for
  `.souv-auth` and `.souv-create`, and the card surfaces, grain, fold shadows, frame, badge, handwriting, arrow and
  hover, used by both the Welcome modal and `/create` through `sv-ocard*` classes. Each screen keeps its own sizes,
  animation and layout. The Welcome modal is pixel-identical, apart from the live cart badge in the nav behind it.
- **Hover lift only with a real mouse** (`@media (hover: hover)`), on `/create` and in the Welcome modal, so a tap
  on a touch screen no longer leaves a card stuck raised. Keyboard focus raises `/create` cards the same way.
- **Both layouts are in the HTML.** The server always sends the dots, the small opened cards and the closed
  cards, and `create-options.css` shows the right ones by width, so phones see the right layout before
  JavaScript loads (it used to show the desktop layout for up to about 1.4s on a slow phone).
- **Old tile code removed** (owner, 2026-11-04): `TileGrid` and `OptionsHeader` (and the helpers only they used)
  are gone from `Options.tsx`, and their `opt-tile*`, `opt-tiles*`, `opt-head*` and `opt-title` rules are gone
  from `options.css`. `BackButton` stays because Pricing uses it.
- **`CreditsLine`** (`components/landing/CreditsLine.tsx`, was `HomeCreditsLine`) is the "You have N credit(s)" line
  on Home and `/create`.
- **Spoken status "Checking your credits"** while the check runs is approved.
- **Welcome modal colour fix** (owner, 2026-11-04): `--sv-platinum-400` was missing, so one small shelf card in
  the Community sketch had no fill. It's now light grey.

## Pricing page `/pricing` (done 2026-11-04, committed in `51dabff`)

Redesigned on berry & ivory with the old page's structure (reference `21-Pricing`): heading, Print and Send +
Big Sender side by side (stacked below 900px), the send-window note, the three credit packs, a back link.
`/account/top-up` shows the same page (noindex from the account layout, canonical `/pricing`). All copy and
behaviour below was approved by the owner on 2026-11-04.

- **Files:** `app/pricing/page.tsx` (metadata, canonical, OfferCatalog JSON-LD), `components/pricing/PricingClient.tsx`,
  `components/pricing/pricingContent.ts` (credit packs, title/description, structured data),
  `components/pricing/PrintSendReadyModal.tsx`, `styles/pricing.css`. The old `CardPacks`/`CreditPacks`/
  `TryRiskFreeCard` etc. in `Options.tsx` are no longer used by any page (not deleted).
- **Print and Send replaces Try Risk-Free:** $9.99 CAD, 1 card, shipping included, **0 AI credits**, button "Buy
  Print and Send". The price is fixed in the frontend (`PRINT_AND_SEND_PRICE` in `pricingCatalog.ts`); the cart
  rebuilds the item from there, so a stored price can't drift. (The MVP PRD says $7.99; the owner chose $9.99.)
- **Compact boxes (owner, 2026-11-04):** each offer box fits one 1440x900 screen (about 630px). Print and Send's
  copy is condensed: intro "One flat price, shipping included Canada-wide. Prices in CAD; tax is extra." and the
  steps are Buy your card (the card-bank explanation) / Choose a card / Add the details. Big Sender's "Always
  saved" reads "Design now, send later. Your cards are saved in Saved Cards & Songs for 15 months."
- **More brand colour (owner, 2026-11-05):** "Top up credits" is the page's one forest band (ivory text, gold
  accents and badge; the pack cards stay paper); selected Big Sender tier filled forest; step numbers in berry
  circles; prices in berry. Box headings (name, labels, price, "How it works") are centred; steps stay
  left-aligned and spread to fill the box. The back link now sits on ivory below the band.
- **"More below" tab (owner, 2026-11-05):** no jump links at the top. Instead a forest folder tab, "More below:
  top up credits ↓", rises from the top edge of the green band (`.pr-more-tab`, links to `#credit-top-ups`;
  the arrow bobs gently, and stays still under reduced motion). It only appears once you scroll past the card
  packs; the owner chose not to add a first-screen hint. In the first lede, "10 AI creation credits" has a 3px
  gold underline with the text kept dark (gold is never text on ivory) and stays on one line.
- **Reduced motion:** `styles/next-app.css` turns off the site-wide smooth scrolling when reduced motion is
  requested, so in-page links jump instead of gliding.
- **After paying for Print and Send** the cart stays on "Payment confirmed" and opens a pop-up explaining how to use
  the card (Saved Cards & Songs / Community Cards). The remembered "return to" page is dropped in that case,
  because Print and Send adds no credits. Other purchases still return to it.
- **Card bank:** checkout adds purchased cards to the card bank, and the nav's Cards box now shows it on every
  screen (`Navbar.tsx` reads `useDemoBalance()` when a screen passes 0). The hamburger shows
  "N credits · N cards to send" under the name and email.
- **Big Sender has no maximum** (frontend only): the last tier is open-ended ("21-30+ cards", $6.99 for 21 and up)
  in `pricingCatalog.ts`, so Pricing, cart, Delivery and the checkout picker all accept any quantity. Copy now
  says cards are kept for **15 months**.
- **Loading/error copy:** "Loading prices…" / "We couldn't load prices right now. Please refresh the page or try
  again." Print and Send stays usable if the pricing endpoint is down; only Big Sender waits for it.
- **Shared dialog code:** the Welcome modal's focus/scroll-lock/inert logic moved unchanged to
  `components/useModalDialog.ts`; the Print and Send pop-up uses it too.

**Backend follow-ups (not done, needed before launch):**

1. **Big Sender maximum:** the seed (`backend/database/seeds/001_pricing_catalog.sql`) still stores
   `card_count_max = 30` on `big_sender_21_30`. Make the last tier open-ended (e.g. a nullable max meaning "no
   limit") and make sure order/checkout validation accepts any quantity of 2 or more.
2. **Print and Send is in the catalog now** (done 2026-11-05: migration 006 + seed, `print_and_send`, 999 CAD cents,
   1 card, 0 credits; the Pricing page reads it and falls back to $9.99). **Still to do:** the cart and checkout price
   both Print and Send and Big Sender from the frontend constants in `pricingCatalog.ts`, not the catalog, so keep
   them equal (a dev-only console warning flags a Print and Send mismatch) until checkout reads prices from the backend.
3. **Try Risk-Free is still the default offer** in `orders.service.ts` (`try_risk_free_one_card`, 999) and
   `checkout.service.ts`. Retire it (set `is_active = FALSE`, keep history) and change the defaults.
4. **Currency:** catalog rows are `usd`, but all MVP prices are CAD. Change to `cad` with a migration.
5. **Card entitlements aren't stored on the server.** Purchased cards live only in the browser
   (`souv_demo_balance` in `DemoBalance.ts`), so they don't follow the user to another device. The PRD needs a
   ledger (15-month expiry per purchased card).
6. **Checkout copy still says 12 months** ("Cards never expire for 12 months." in `Checkout.tsx`) and the
   checkout picker still lists Try Risk-Free. Not changed: copy outside Pricing wasn't approved.
7. **Big Sender minimum:** the frontend fallback (`MIN_BIG_SENDER_CARDS = 1`, fallback tiers "1-10") differs from
   the seed (2). Pricing uses the seed; the cart/Delivery fallback still allows 1. Align on 2.

## Paper texture on every screen (2026-11-05, uncommitted)

Owner-approved. A fine paper grain on the page background of every screen, keeping the background colour
(ivory measures #F7F0E8 with and without it).

- **Asset:** `frontend/public/assets/paper-texture.svg`, a generated grain (fractal noise with side lighting), not a
  photo. Inspired by scribeless.co's paper look; their image is not used.
- **Rule:** one shared block in `frontend/app/styles/next-app.css` (`--souv-paper-*`). Soft-light at 0.9 on
  `.l-backdrop::after` (landing, home, create, pricing), `.auth-backdrop::after` (auth) and `body::before` (all other
  screens). Cards, photos, buttons, nav, popovers and forest bands stay smooth. Off in forced-colours mode and print.
- **Older dark screens** (FAQ, Contact, Community Cards, templates, etc., still on the old #08080B design) get it too,
  but it's barely visible there until they're redesigned onto ivory.
- **New screens:** paint the background with one of those backdrops or the body and the grain comes for free. See
  design system v1.2: `design-system/docs/01-foundations.md` (Paper texture) and `03-patterns.md` (3.2).
- **Seen while testing (not caused by this):** in the dev server, `/legal/*` pages returned 500 ("Jest worker encountered 2
  child process exceptions"). A production build prerenders all four fine, so it is a dev-server hiccup; restarting `next dev`
  should clear it. An unknown slug like `/legal/terms` also gives 500 instead of 404.

## Top-up credits pop-up and nav menu (2026-11-05, uncommitted)

Owner-approved.
- **Nav Credits/Cards box menu** (hover or keyboard focus, every signed-in screen): Top up cards, Top up credits
  (both open the Top up pop-up), Saved Cards & Songs. Clicking the box itself still goes to Saved Cards & Songs. On
  touch screens there's no hover, so the menu doesn't appear there; use the hamburger instead.
- **Hamburger:** **Top Up Cards** and **Top Up Credits** both open the Top up pop-up (cards / credits view); focus
  returns to the menu button when it closes. The open state lives in `NavRight` so both menus share it.
- **`components/pricing/TopUpModal.tsx`** (replaces `TopUpCreditsModal.tsx`, 2026-11-07): one dialog, two views.
  Cards view = the Pricing page's Print and Send + Big Sender boxes (with How it works), heading "Top up cards", intro
  = Pricing lede, bottom button "Buy only credits". Credits view = the three credit packs, bottom button "Buy a full
  card + credits". The buttons swap views in place and move focus to the new heading. Buy flow as on Pricing (choose ->
  pop-up closes, item added to the cart, cart opens). Shared dialog behaviour from `useModalDialog.ts`. Loaded with
  `next/dynamic` on first open, so its code and CSS aren't on every page.
- **Opening it from anywhere:** `openTopUp(view, returnTo)` in `components/pricing/topUp.ts` fires a window event the
  nav listens for; it returns false if no signed-in nav is on the page, and callers then fall back to `/pricing`.
  `returnTo` is saved only once a pack is chosen, so after paying the customer goes straight back. Used when out of
  credits in Create a Card, Build My Card (wizard + Review) and Personalize (credits view), and on Delivery when out
  of cards (cards view, behind `CARD_BALANCE_CHECK_ENABLED = false`, see backend gap 5 below).
- **Personalize, too few credits on "Create my Card"** (owner, 2026-11-07): instead of the "Not enough credits"
  error box, the draft (and any photos) is saved first, then the credits pop-up opens. After paying, the customer
  comes back through the Saved Cards & Songs resume link (`?modal=1&draftId=...&step=caption`) with what they typed
  still filled in. If the draft can't be saved, the old error box shows instead.
- **Build My Card, too few credits on "Generate"** (owner, 2026-11-07): same as Personalize. Draft + photos saved,
  credits pop-up opens, and after paying the customer returns via `/create/build-my-card?draftId=...#song` (QR Song
  step) with their answers restored. Falls back to the old "Not enough credits" box if the draft can't be saved.
- **After paying** (`CartPage.tsx`): Print and Send still always shows "Your cards are waiting", except when it was
  bought from Delivery's out-of-cards pop-up (return page `/delivery`): then it goes straight back to Delivery, like
  Big Sender and credits.
- Removed the unused `BmcPricingModal` (old Single/Studio/Atelier packs) from `BmcShared.tsx`.
  Styles: `.tu-*` in `styles/pricing.css`. `PricingCreditPacks` now takes `returnTo` and `onChosen`.
- **Not built:** buying credits is still the frontend demo cart; no backend top-up.
- **QA 2026-11-07** (`build-fixes/cart-delivery-2026-11-06/qa-scripts/topup/topup.js`, run from `~/souv-qa/topup`,
  everything stubbed): 91/91. Covers opening from the Credits box menu (mouse + keyboard) and the hamburger (desktop +
  phone) on 9 signed-in screens, dialog behaviour (focus, Tab trap, Escape, x, backdrop, inert page, scroll lock,
  reduced motion), copy and the three packs, the buy flow and credits granted, signed-out (not reachable), 8 screen
  sizes incl. sideways phone, tap targets, axe. Two bugs found and fixed:
  1. **Cart page didn't refresh** when a pack was added while it was open (pop-up or another tab): it showed and
     charged the old cart, and its next save dropped the new item. `CartPage.tsx` now follows `souv-cart-changed` /
     `storage` events (only replaces lines that really differ, so its own saves don't loop).
  2. **Keyboard focus** went to the page heading after closing the pop-up opened from the Credits box menu; it now
     returns to the Credits box (`Navbar.tsx`, keyboard activation only).
- **After-purchase pop-up for every pack (owner, 2026-11-07):** the Print and Send pop-up ("Your card is waiting", four
  option buttons; `PrintSendReadyModal.tsx`) now also opens after paying for **Big Sender** or **credits**
  (`CartPage.tsx` `handlePaid`). Print and Send always shows it. Big Sender / credits bought after being sent from
  another page (saved return page, e.g. out of credits in Build My Card, or "Reserve cards" on Delivery) still go
  straight back there, with no pop-up. Title: "Your credits are *waiting*" when only credits were bought, "Your cards
  are *waiting*" for Print and Send or a card pack (also when credits are in the same cart). QA:
  `qa-scripts/topup/after-purchase.js` 18/18.

## Cart / Delivery fixes (2026-11-06, uncommitted)

Owner-approved, from `build-fixes/cart-delivery-2026-11-06/` (BUILD-FIXES.md items, decisions in DECISIONS.md).
Owner rule: **no dummy data** (no made-up codes, addresses, prices or results).

Done in the frontend:
- **Promo codes (items 1, 2):** one shared check in `lib/promo.ts`, used by the cart and the payment pop-up. The
  hard-coded `SOUVENOTE10` and the pop-up's "any text = 10% off" are gone. A code applied in the cart is passed into
  the payment pop-up (`CheckoutModal` `promo` prop), so both show the same total. Until Stripe is connected
  `lookupPromo` returns null, so every code shows "That code isn't valid."
- **Card fields (item 3):** Pay checks that card number, expiry, CVC and billing postal code are filled in (per-field
  messages, focus moves to the first one). Apple Pay / Google Pay skip this. It only checks the fields are complete.
- **Delivery addresses (items 4, 5, 7):** recipient starts empty; the return address name comes from the signed-in
  profile (`first_name`/`last_name`), the address lines start empty. The hidden "123 Main St / Toronto" fallback is
  removed: required fields must be filled or nothing is sent. With the return address switch on, its fields are
  checked too; with it off, `senderAddress` is left out of `POST /orders` (backend already stores `{}`).
- **Card preview (item 9):** no sample card. `DeliveryKeepsake.tsx` shows the selected asset's image only when it
  has a real `http(s)` address; generation is still mocked (`mock://...`), so today it's an empty card frame. The
  handwritten message preview and the song line are hidden; "Song QR printed inside" shows only when the card really
  has a song asset.
- **Blank Souvenote Gift (item 11): off until version 2.** `GIFT_OFFER_ENABLED = false` in `CartPage.tsx` (no
  "Add a blank Souvenote?" before checkout) and `GIFT_AT_DELIVERY_ENABLED = false` in `Delivery.tsx` (no reminder
  banner, no "You have a blank Souvenote to give" pop-up). The code is kept for V2. Gift lines already in a cart
  still show and can be removed; `/gift` is untouched (not linked anywhere).
- **Cart (12, 13, 14, 21, 25):** made-up "SV-123456" order number removed; "GST calculated from your delivery
  address" removed (flat 5% kept); "← Back to cart" closes the payment pop-up; gift price reads
  `BLANK_SOUVENOTE_GIFT_PRICE`; no hyphens used as dashes.
- **Delivery (15, 16, 18, 20, 24, 25):** Schedule needs a date, tomorrow or later ("Choose a mail-out date.");
  the "On its way" pop-up and its made-up "+7 days" arrival estimate are removed (straight to Confirmation);
  "Back to review" returns to the builder the card came from (`components/delivery/deliverySource.ts`, set by
  BmcWizard / BmcReview / Personalize / MyCards; Personalize's review isn't linkable, so it lands on the Personalize
  page); shipping is a plain "Standard shipping, included" line; top-up pop-up copy updated.
- **Signed-in only (17):** `/delivery` and `/delivery/confirmation` send signed-out visitors to `/`
  (`FlowPageShell signedInOnly`, same script + `SignedOutRedirect` as `/create`). `/cart` stays open.
- **Confirmation (22, 23):** no "Nothing to confirm yet" flash; spacing tightened on short phones (<600px wide and
  <700px tall) so Confirmation fits iPhone SE and the empty cart fits 320x568.
- **Error pop-up (27):** `BmcErrorModal` (shared with Build My Card) now uses `useModalDialog`: focus trap, scroll
  lock, page inert, focus return, labelled `alertdialog`. Dark look kept until the Build My Card redesign.
- **Lint (29):** ESLint 9 + `eslint-config-next` (`frontend/eslint.config.mjs`, `npm run lint`). First run found
  37 errors + 37 warnings, all from before this work (report: `build-fixes/cart-delivery-2026-11-06/lint-2026-11-06.json`).
  Owner-approved clean-up (2026-11-06): the 37 errors (`react/no-unescaped-entities`, apostrophes/quotes now
  `&apos;`/`&quot;`, pages look identical), 21 unused leftovers removed (old icons in Options.tsx,
  LegacySettingsPayments, unused Cognito helpers/types, unused state), and the MyCards hook dependency. **Now: 0 errors,
  15 warnings**, all `@next/next/no-img-element` (switch to `next/image` during each page's redesign, with a visual
  check). `next build` runs lint again (Next.js default; the temporary skip was removed once errors hit 0).
  Production build verified 2026-11-06: passes, 0 lint errors, all suites green on `next start`.

**Raw backend errors are shown on purpose (item 10, owner 2026-11-06).** This is a frontend rebuild while the
backend is built, so Delivery's error pop-ups show the backend's own text (e.g. "Mock checkout completion failed
with status 500.", "Checkout response did not include a checkout session and order." from `lib/api.ts`). **Backend
gap, going forward for every such message:** give each error customer wording before launch.

**Version 2:** Blank Souvenote Gift recipients (name + email/phone saved, sent, and redeemable), then switch the two
gift flags back on.

**Backend gaps (must do before real customers):**
1. **Stripe payments + receipt email** (item 3). Payment is still simulated (`Checkout.tsx` waits 1.3 s and calls
   `onPaid`). The copy "Payments secured by Stripe" and "A receipt is on its way to your inbox" was kept by the owner
   but isn't true until Stripe Checkout/Elements and a receipt email exist.
2. **Promo codes from Stripe** (items 1, 2). Codes should be Stripe promotion codes checked server-side; replace
   `lookupPromo` in `lib/promo.ts` with a backend call, and send the applied code with the checkout so Stripe charges
   the discounted total.
3. **Mailing address on the profile** (item 4). Profiles have only name + billing postal code. Once there's an
   address, pre-fill the Delivery return address lines from it.
4. **Several recipients + quantity per order** (item 6, owner chose to leave as is for now). `POST /orders` takes one
   recipient, so with "Multiple" only `recipients[0]` is sent, and "How many cards to this address?" is never sent.
5. **Card balance on the backend** (item 8). The card bank is browser-only (`DemoBalance`), so the out-of-cards check on
   Delivery stays off (`CARD_BALANCE_CHECK_ENABLED = false` in `Delivery.tsx`) and a customer with 0 cards can still
   send. When on, it opens the Top up pop-up on its cards view. Turn it on once the backend owns the card balance.
6. **Card message + song saved with the card** (item 9). Card drafts store only the chosen image; the inside message
   and song details aren't saved, so Delivery can't preview them. Real image addresses are also needed (generation
   returns `mock://`).
7. **Real tax by province** (item 13), e.g. Stripe Tax. Tax is a flat 5% GST today.
8. **Mail-out date + "Send now"/"Schedule" sent with the order** (item 15), and a real arrival estimate from the
   print/mail partner (no estimate is shown until then).
9. **"Posted" email** (item 19). Confirmation says "you'll get an email when it's posted"; no email is sent yet.
10. **Raw error messages** (item 10): see above.

## Pricing copy + Print and Send credits (2026-11-06, uncommitted)

Owner-approved.
- **Print and Send now includes 10 AI creation credits** (same as each Big Sender card). `makePrintAndSendCartItem`
  in `pricingCatalog.ts` has `creditsPerCard: 10`, so paying in the cart grants 10 credits (`grantCredits`, still
  the mock checkout) and adds 1 card to the card bank. Saved carts pick it up automatically (P&S is rebuilt from the
  catalog on load).
- **Backend: run migration `007_print_and_send_credits.sql` before deploying** (sets `credits_per_card = 10` on
  `print_and_send`; 006 created it with 0). Seed updated too. Not run on any database yet.
- **Copy:** Pricing intro "Every card includes shipping + 10 AI credits. Buy just one or stock up on more to save."
  (gold underline on "10 AI credits"); Print and Send line "Send 1 card · Shipping and 10 AI creation credits
  included", step 1 "Buy your card + credits" / "It waits in your card bank, shown as Credits and Cards at the top of
  the page and in the menu.", step 2 body "Choose from four different creation options."; Big Sender line "Send
  multiple different cards · Shipping and 10 AI creation credits included per card". Long meta lines now stack on
  every screen (`.pr-meta-row.is-long`). Post-purchase pop-up (`PrintSendReadyModal.tsx`): title "Your cards are
  *waiting*" (credits only: "Your credits are *waiting*"), body "Choose one of the following options to create a new card or send a saved one.", and four buttons
  from `CREATE_OPTIONS` in the Create Options colours (Personalize a Template gold, Build My Card berry, Community
  Cards forest, Saved Cards & Songs espresso; 2x2 from 520px, stacked on phones). Search description + structured data mention
  the 10 credits.

## Running it locally

- Three things must be running: the Windows service `postgresql-x64-17` (database `souvenote_dev`, URL in
  `backend/server/.env`), the backend (`npm run start:dev` in `backend/server/`, port 4000, Swagger at
  `http://localhost:4000/api/docs`) and the frontend (`npm run dev` in `frontend/`, port 3000).
- Log In checks the password with the real Cognito pool, then calls the local backend. **"Failed to fetch" on
  Log In means the backend isn't running.**
- **Never run `next build` inside `frontend/` while `npm run dev` is running.** They share `.next/`; the dev
  server then serves 404s for its JS and CSS (buttons do nothing, fonts look wrong). Fix: stop the dev server,
  delete `frontend/.next`, start it again. For production-build testing, build a copy elsewhere.
- The local database already has migration 004's columns (checked 2026-11-04).

## Other loose ends

- **Footer social icons** now use the real Instagram/TikTok/Pinterest/Facebook URLs (opening in a new tab) on
  every page, not just the landing/Home footer (`frontend/app/components/Footer.tsx`, 2026-11-04).
- **FAQ, Contact and legal pages haven't been redesigned** but are in the sitemap. Give each its own
  title and description when they are. (Pricing is done; see above.)
- **`/community-cards` is a noindex "coming soon" placeholder.** Add it to `frontend/app/sitemap.ts` when it
  goes live.
