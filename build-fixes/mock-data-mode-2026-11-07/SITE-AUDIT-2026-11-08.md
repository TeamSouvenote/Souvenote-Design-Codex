# Site audit against the Build My Card / Personalize standard, and the fix plan

Date: 2026-11-08, re-run at 19:10 after the Remaining Screens build (Phases 1–5).
Branch: `mock-data-mode`. Status: **audit only, nothing changed.** Each fix below waits for owner approval.

Standard: design system v1.3+ (`design-system/docs/01-foundations.md`, `02-components.md` §2.13, §2.17–2.26, `06-governance.md`, `tokens/tokens.css`) and the decisions in `CHANGELOG.md` §1–13.
Out of scope (not audited, not to be changed): Build My Card and Personalize a Template (`components/bmc/*`, `components/personalize/*`, `bmc-*.css`, `personalize.css`).

---

## 1. Inventory: what was audited

### Routes (33)
| Route | What it is | New since the first audit |
|---|---|---|
| `/` | Landing, signed out | |
| `/home`, `/home?welcome=1` | Signed-in home; Welcome modal | |
| `/welcome` | Redirect to `/home?welcome=1` | |
| `/create` | Create options | |
| `/community-cards` (+ `?card=`) | Community Cards catalogue, 58 cards; Send pop-up | **Rebuilt** (was a placeholder) |
| `/create/my-cards-and-songs`, `/my-cards` | Saved Cards & Songs (`/my-cards` redirects) | **Rebuilt** |
| `/pricing`, `/account/top-up` | Pricing with the Canada/US "Prices for" switch | Switch is new |
| `/cart` | Cart, checkout pop-up, payment confirmed, "Print and Send ready" pop-up | Currency re-pricing, tax line |
| `/delivery` | Delivery: one or several recipients, saved-recipient picker, send now or schedule, postage | Picker, postage copy |
| `/delivery/confirmation` | Order confirmation | |
| `/login` (+ two-step code step), `/signup`, `/signup/terms`, `/forgot`, `/verify`, `/verify/expired`, `/reset`, `/recover` | Sign-in screens | Two-step code step, country field |
| `/account/profile` | Profile | **Rebuilt** |
| `/account/settings` + `#personal`, `#security`, `#payments`, `#recipients`, `#preferences`, `#delete` | Settings (six sections; two-step setup, change password, delete account) | **Rebuilt**, four sections new |
| `/faq` | 28-question FAQ | **Rebuilt** |
| `/contact` | Contact form and side cards | **Rebuilt** |
| `/legal/privacy-policy`, `/terms-of-service`, `/cookie-policy`, `/refund-policy` | Legal documents | **Rebuilt** |
| any unknown address (`app/not-found.tsx`) | Branded 404 | **New** |
| (removed) `/refer`, `/gift`, `/gift/redeem` | Now 404 | Removed |

### Shared parts
- **Shells:** `Navbar` + hamburger menu, `Footer` (with "Cookie settings"), `flow/FlowPageShell`, `content/ContentPageShell`.
- **Dialogs:** `flow/FlowDialog`, `content/ConfirmDialog` (new), `community/CommunitySendDialog` (new), `settings/DeleteAccount` (new), the two-step setup dialog in `settings/SignInSecurity` (new), `pricing/TopUpModal`, `pricing/PrintSendReadyModal`, `flow/TopUpChoiceDialog` (shared with BMC/PT), `AuthGatePrompt`, the Welcome modal in `Auth.tsx`.
- **Banner:** `content/CookieConsent` (new).
- **Pieces:** `faq/FaqAccordion`, `legal/LegalDocument`, `pricing/PriceCountrySwitch`, `settings/*`, `MockDataBadge` (dev only).

---

## 2. How it was checked

- **Browser:** a temp copy of `frontend/` (taken 19:08, after the other session's last edit at 19:03) on its own port, so another chat's dev server and storage weren't touched. Every route above, signed in and signed out, at 1280×720, 1024×768, 768×1024 and 375×812.
- **What the script measured on each page and dialog:**
  - the page height;
  - every box that scrolls on its own;
  - the document width against the screen;
  - clipped text;
  - elements spilling past their card;
  - controls under 24px;
  - whether dialog labels and descriptions exist.

  Scroll rows meant to scroll sideways (gallery, chips, Community rows) are expected and not counted.
- **Code:** two read-only reviews (before and after the rebuild), each claim spot-checked in the source. ESLint is clean: 0 errors, and its warnings are all `<img>`.
- **Static scans:**
  - raw hex outside `tokens.css`;
  - logo files;
  - control characters (none found);
  - `eslint-disable` (none in scope);
  - `<img>`.

---

## 3. Findings, ranked

Severity: **Bug** (broken, wrong or unsafe), **Inconsistency** (breaks a written standard), **Polish**.

### Bugs

| # | Page / size | What's wrong (standard) | Proposed fix |
|---|---|---|---|
| B1 | Hamburger menu (signed in), every size | Scrolls inside itself: 710px in 598 at 1280×720, 899px in 690 at 375×812 (3 Layout: no box scrolls). | Put the four legal links in two columns, or behind one "Legal" row; tighten the item spacing so all 16 items fit. `Navbar.tsx` and the menu styles. |
| B2 | All four legal pages, 375 | The page runs past the right edge. `.lg-layout` is a grid with no column template, so the "On this page" list (536px) and the cookie table (492px) are wider than the phone and get cut off (3 Layout: nothing clipped). | `content-pages.css:363`: `grid-template-columns: minmax(0, 1fr)` on the base rule. |
| B3 | Cookie banner on the sign-in screens, every size | Decline and Accept are 20px tall (5 Targets: never under 24px). The banner uses `.l-btn`, but `landing.css` isn't loaded on the auth screens. | Give `.cc-btn` its own size in `cookie-consent.css`, or import `landing.css` in `CookieConsent.tsx`. |
| B4 | Cart → Checkout | Retrying the credit grant uses a new idempotency key each time (`CartPage.tsx:414`), and the error says "Payment succeeded, but credits could not be added. Please try again." (`Checkout.tsx:168`), which invites paying again (7 Paid actions). | One key per checkout attempt (a ref); a "Retry adding credits" action that repeats only the grant; honest wording. |
| B5 | Delivery | If `startCheckout` fails after `createOrder`, the next press creates a second order (`Delivery.tsx:291-321`). With several recipients only `recipients[0]` is sent (`:298`) (7 Paid actions). | Reuse the pending order and retry only `startCheckout`; send every recipient (backend contract to confirm). |
| B6 | Settings › Delete account | If the data delete succeeds and the Cognito delete fails, it says "couldn't be deleted. Please try again", and the retry then fails (`settings/DeleteAccount.tsx:57-62`) (7 honest failures). | A separate message for step 2; a retry that goes straight to the Cognito step. |
| B7 | Settings › Password | If the password changes but signing out other devices fails, it says the password couldn't be changed (`settings/SignInSecurity.tsx:69-78`). | Handle the two calls separately: "Password changed, but other devices couldn't be signed out." |
| B8 | Contact, Community send, every ConfirmDialog | The buttons are only disabled after a re-render, so a fast double press can send two messages or create two drafts (`ContactForm.tsx:60`, `CommunitySendDialog.tsx:~40`, `ConfirmDialog.tsx:30`). Community send has no idempotency key. | A `useRef` in-flight guard; an action key for Community send. |
| B9 | `/community-cards?card=…` | An auth refresh reopens a Send pop-up the user already closed (`CommunityGallery.tsx:59-65`). | Clear the linked id and the query string after the first open. |
| B10 | Cart (sign-up prompt) | `AuthGatePrompt.tsx:31` is `role="dialog"` with no label, focus trap, Escape or focus return, and a literal "x" close button (5 Dialogs). | Rebuild it on `FlowDialog`, labelled by its h2. |
| B11 | Several | Focus falls to `<body>` when the focused control disappears (5 Focus): cookie banner Accept/Decline (verified in the browser), Contact "Send another message", Saved recipients after save or delete, Payment methods after Remove, two-step on/off. | Return focus to the opener ("Cookie settings"), the section heading, or the replacement button. |
| B12 | Contact, Community send, Change password | `FlowField` errors aren't announced, and focus doesn't move to the first bad field (`flow/FlowField.tsx:41`) (5 Every field labelled; errors announced). | Focus the first invalid field on submit. **`FlowField` is shared with Cart/Delivery; ask before changing it.** |
| B13 | Profile, Checkout, Pricing | Still say 15 months; the owner set 12 (`AccountPages.tsx:97`, `Checkout.tsx:306`, `pricing/page.tsx:50`). The FAQ (`faqData.ts:117`) and Terms (`legalDocs.ts:128`) say credits expire after 15 months. | Change all five to 12 months. **Owner, 2026-11-08: the 12-month rule also covers when credits expire.** |
| B14 | Personalize a Template → Top up cards → pay | `CartPage.tsx:444` sends a buyer back to their work only for `/delivery` and `/create/build-my-card`. Personalize's return address (`/create/personalize-a-template…`) isn't on that list, so a Print and Send bought there stops on the cart with the "Your cards are waiting" pop-up instead of reopening the template (4 Credits: paying returns to the same draft). | Add Personalize's return path to `backToWork`. One line in `CartPage.tsx`; Personalize's own files aren't touched. |

### Inconsistencies

| # | Page / size | What's wrong (standard) | Proposed fix |
|---|---|---|---|
| I1 | Welcome modal; Cart | The gold logo sits on ivory, not forest (2 Logo): the Welcome title wordmark is on paper at 1.73:1 (`Auth.tsx:1000`); the cart pack thumbnail's gold "S" is on an ivory card (`CartPage.tsx:180/205`, `.ct-pack-card.c1`). | A forest chip behind the wordmark (or the wordmark in the forest top band); make the front pack card forest (`--l-tone-2`). |
| I2 | Community Cards chips | The selected chip is berry with raw `#F7F0E8` (`community-cards.css:42`); the standard is forest with ivory text, as in Personalize. No tone dots, while Personalize's occasion chips have them (1 Colour: berry is emphasis, forest is actions). | Use `--l-btn-bg` / `--l-btn-ink`, and add the shared tone dots. |
| I3 | "Print and Send ready" pop-up | Buttons filled gold, berry, forest and espresso, in raw hex (`pricing.css:540, 554-556`). Gold and berry fills break their meanings. | Forest (or outline) pills, each with a small tone dot naming the option. **Owner choice.** Context: the owner picked these four fills on 2026-11-06 to match the `/create` option cards (comment in `PrintSendReadyModal.tsx`). Where it shows: over the cart's "Payment confirmed" screen after paying for Print and Send, a Big Sender pack or a credits pack, unless the purchase came from Delivery or a create flow, which go straight back. |
| I4 | Top up pop-up, Checkout, Community send | Taller than the screen (the overlay scrolls). Top up credits: 761px at 720, 785 at 768, about 1450 on tablet and phone. Top up cards: 1049 at 720, 1981 on phone. Checkout: 788 at 720. Community send: 991 on phone. Build My Card's dialogs fit one screen. | **Owner, 2026-11-08: compact.** Top up: keep the content and tighten it to fit one screen (shorter "How it works" lists, packs side by side from 600px, smaller headings and padding). Checkout: tighter spacing. Community send: card art beside the message on tablet, smaller on phone. |
| I5 | Cart, Delivery, Pricing, Profile, Settings, Saved Cards | The signed-out nav (Log In / Start for Free) flashes before the signed-in nav; Profile and Settings also flash "Log in to see your account" while auth loads. | A neutral loading heading; the nav waits for auth (like `/home`'s hold). Build My Card and Personalize have the same flash; **ask before touching them.** |
| I6 | `/create` → Personalize a Template | Pressing the option checks credits and opens Top up instead of the page (`CreateOptionsClient.tsx:140-155`, `requiresCredits: true`) (4 Credits: no gating navigation on credits). Earlier owner decision: Personalize keeps its checks. | **Why it happens:** `/create` was built (2026-11-04) to check credits before opening Personalize or Build My Card. On 2026-11-07 Build My Card was switched to `requiresCredits: false` (CHANGELOG §6), but Personalize was left with `true` because it wasn't part of that change. Personalize then got its own "Before you start" entry dialog (2026-11-08). So a customer at 0 credits is now stopped twice: `/create` opens Top up instead of the page, and the page itself opens the entry dialog. **Recommendation:** set Personalize to `requiresCredits: false` in `createOptions.ts`, as Build My Card is, and let its own entry dialog do the asking. **Owner decision pending.** |
| I7 | Delivery, Confirmation | Step eyebrows "07 Delivery" and "08 Confirmation" (BMC removed its step eyebrows). In "Nothing to *confirm* yet" the script word isn't last (1.2 Type rules). | Eyebrows "Create · Delivery" style, or none; "Nothing to *confirm yet*". |
| I8 | Checkout, Welcome | "Complete your purchase" has no script word (2.18: one script phrase per dialog title). Neither dialog has `aria-describedby`. | "Complete your *purchase*"; point `describedBy` at each lede. |
| I9 | CSS | Raw colours outside the tokens (1 Colour): `#F3E2A6` pale gold for the legal "missing entity" highlight (`content-pages.css:402`; gold means AI); `#F7F0E8` (`community-cards.css:42`); `#8A7B77` field outline (`checkout-flow.css:22, 92, 950`; needed for 3:1, so it should be a token); `#514C4A` handwriting graphite (`checkout-flow.css:619`, `create-options.css:26`, `opened-card.css:126`). Apple Pay and Google Pay brand colours are allowed. | A terracotta tint for `.lg-missing`; `--l-bg` for the ivory; propose two new tokens, `--sv-field-line` and `--sv-graphite`, added to `tokens.css` and the docs. |
| I10 | Mock data badge | Says "generation costs 2 credits"; everything else says 1, or 2 with a song (`MockDataBadge.tsx:101`). | Match the wording. |
| I11 | Cookie Policy | Says `souv_price_country` is kept 12 months, but it's stored with no expiry (`legalDocs.ts:230`, `usePriceCountry.ts:38`). | Store it with a date and expire it after 12 months. |
| I12 | Cookie banner | `max-height: min(60vh, 420px); overflow-y: auto` makes it a box that scrolls on its own (`cookie-consent.css:7`). | Remove the cap; keep it only under a very short screen height. |
| I13 | Community Cards facts, FAQ topic pills | Centred `flex-wrap` rows go ragged (3 Even grids) (`community-cards.css:9`, `content-pages.css:301`). | Even grids: two columns on phones, three or more across from 600px. |

### Polish

| # | Where | What | Proposed fix |
|---|---|---|---|
| P1 | Legal | Contents links are 36px tall (`content-pages.css:376`); the sideways-scrolling table wrapper can't be reached by keyboard. | 44px links; `tabindex="0"`, `role="region"` and a label on `.lg-table-wrap` (`LegalDocument.tsx:30`). |
| P2 | `<img>` | Static assets should use next/image: `Auth.tsx:144, 1000`, `Footer.tsx:79`, `Navbar.tsx:462`. `DeliveryKeepsake.tsx:28`, `LandingGallery.tsx:88` and `opengraph-image.tsx` need a reasoned eslint note. | Switch to next/image; add the notes. |
| P3 | Dead code | Navbar's and Footer's non-landing branches (every page now passes the landing variant), including `LogoMark.png`, `WordmarkLobster.png` and the CSS-mask logo in `site.css:173-192, 1268-1280`. Also: `DemoLibrary.ts`; the `BmcShared.tsx` stepper/head/foot/cost exports; `Ornaments` (all but `OrnamentDivider`); `CARD_WITH_QR_SONG_CREDITS`; `addPricingCartItemToCart`; unused `DemoBalance` exports and `window.__souvClearDemoBalance`; Navbar `loggedIn`; DemoNavbar `onLoginClick`, `onSignupClick`, `variant`; `ContentPageShell` `signedInOnly`. | Remove, with approval (no file deletes; retire in the docs). |
| P4 | Global CSS | Still loaded on every page from `layout.tsx` but mostly dead: `options.css` (~95%), `bmc.css` (~86%, used only by the dead BmcShared parts), half of `site.css`, most of `colors_and_type.css`, and `landing-chrome.css` (the old gold and rose shimmer). | A scripted cleanup with backups and a before/after computed-style comparison, as in CHANGELOG §9. |
| P5 | Money | `cartMoney` (`CartPage.tsx:153`), `coMoney` (`Checkout.tsx:48`) and `money` (`PricingClient.tsx:54`) repeat `formatMoney` in `lib/priceLists.ts`; the tax maths is written twice. | Use `formatMoney` and one total helper. |
| P6 | React | Refs written during render (`AccountRouteClient.tsx:18-19`, `settings/Preferences.tsx:31`). | Move them into effects or state. |
| P7 | Copy and names | "Saving..." with three dots (`Preferences.tsx:40`); the `storage.ts:34` comment shows the wrong date format; `cc-` is both the cookie banner's prefix and Community Cards'; stale credit comments in `CreateOptionsClient.tsx:24`. | Tidy. |

### Fixed by the rebuild (from the first audit)
- Saved Cards & Songs sideways scroll on phones.
- The FAQ answer clipped on phones, and the old "Try Risk-Free" copy.
- Next's default black 404 (now branded; unknown legal slugs 404).
- The dark legacy theme on Saved Cards, Account, FAQ, Contact, Legal and Community.
- The 15px "Sort by newest" target.
- The fake Gift and Contact forms (Gift removed; Contact stores and returns a reference).
- `Options.tsx` dead file.

---

## 4. Lesser-used colours: recommendations only

These are where a screen is all forest, espresso and berry. They need approval before anything is built.
- **Pricing:** terracotta top stripes on the Print and Send and Big Sender cards; berry stays for the labels.
- **Delivery:** a terracotta edge on the recipient and return-address cards (terracotta means "yours"); oat secondary text on the forest send bar.
- **Cart:** pack thumbnails in the five gallery tones (`--l-tone-1…5`, gold kept for credits); cocoa for the per-card line.
- **Profile:** the four balance tiles each carry a short stripe. Gold for AI credits; terracotta, berry and forest for the others.
- **Saved Cards & Songs:** a short terracotta stripe on the section headings, as on Personalize's row headings.
- **Settings:** raised ivory for the open section in the list (it's paper now), like the open FAQ item.

---

## 5. Fix plan

Each phase is approved separately.

| Phase | Items | Touches | Proof |
|---|---|---|---|
| **A. Bugs** | B1–B11, B13 (12 months everywhere, incl. FAQ and Terms), B14 | `Navbar.tsx`, `content-pages.css`, `cookie-consent.css`, `CartPage.tsx`, `Checkout.tsx`, `Delivery.tsx`, `settings/*`, `content/*`, `community/*`, `AuthGatePrompt.tsx`, `AccountPages.tsx`, `pricing/page.tsx` | Re-measure at all four sizes; mock-mode double-press and failure tests |
| **B. Consistency** | I1–I13 | `Auth.tsx`, `auth.css`, `CartPage.tsx`, `checkout-flow.css`, `community-cards.css`, `pricing.css`, `TopUpModal.tsx`, `Delivery*.tsx`, `CookieConsent.tsx`, `tokens.css` and docs (two new tokens) | Re-measure; computed colours |
| **C. Cleanup** | P1–P7 | Navbar, Footer and the global CSS files, with backups | Computed-style fingerprint before and after: 0 differences |
| **D. Colour** | Section 4 | Per-page stylesheets only | Screenshots and computed colours |

**Shared with Build My Card / Personalize (ask first):** B12 (`FlowField`), the I5 nav hold on those two pages, any change to `FlowDialog`.

**Owner decisions (2026-11-08):** B13: 12 months covers credit expiry too. I4: compact. B14 (Personalize return after paying) joins Phase A.
**Done (2026-11-08, see CHANGELOG):**
- I3: the pop-up now uses design-system option cards, each with a one-line explanation.
- I6: `/create` no longer checks credits; both flows check at Create.

- Personalize a Template's "Before you start" pop-up on opening was also removed (owner). No flow checks credits before Create.
- B14: a Print and Send bought from Personalize's top-up now returns to the saved card (verified end to end).
- **Phase A (B1–B13) done, 2026-11-08** (CHANGELOG "Site audit Phase A"). Two parts were checked in the code only: B4's failed-grant retry, and the B5/B6/B7 failure paths (the mock calls can't be made to fail).
- **Still open from Phase A:** B5's second half. Delivery's "Multiple" mode sends only the first recipient, because `createOrder` takes one address.
  - **Scribeless check (public API docs, 2026-11-08):** Scribeless supports many recipients per send, so the limit is only in our own order contract.
    - `POST /api/recipients` takes `campaignId` plus `data` as one recipient or an array. Each recipient has its own `firstName`, `lastName`, `address{address1, address2, address3, city, state, postalCode, country}` and `variables`. `state` is required for the US and Canada.
    - `POST /api/recipients/html/bulk` takes 1–500 recipients per call, each with its own front/back artwork.
    - The return address is one per campaign or batch, which matches our one return address per order.
    - One-time campaigns are paid with `POST /api/recipients/checkout`.
    - **No idempotency key:** our backend must create one campaign per order, store its campaign and recipient IDs, and never re-upload on a retry. `variables.externalId` can carry our order-recipient ID.
  - **Done (owner approved, 2026-11-08):** `createOrder` takes `recipients[]` with quantities, and Delivery sends every address (plus the quantity in single mode). The mock charges per card, and the confirmation shows the card count. The backend steps are in `DEVELOPER_HANDOFF.md`, "Orders with several recipients (Scribeless)". A related bug was fixed while testing: a second "Print and send" no longer reopens the previous order. The real backend still has to read `recipients`.
- **Phase B done, 2026-11-08** (CHANGELOG "Site audit Phase B"): I1 (cart), I2, I4 (compact), I5, I7–I13.
- **Still open from Phase B:**
  - I1, Welcome modal: **kept as is (owner, 2026-11-08).** It's recorded as the one exception in design-system 2.13.
  - On phones the Top up and checkout pop-ups still stack, so the whole pop-up scrolls like a page.
- **Phase C done, 2026-11-08** (CHANGELOG "Site audit Phase C"): P1–P7 and `.cf-eyebrow-num`. A computed-style comparison of 48 captures showed no visual change, and ESLint is 0 warnings app-wide. **Left:** the shared `cc-` prefix (harmless), and deleting the retired files once the owner approves (governance "Retired files").
- **Phase D done, 2026-11-08** (CHANGELOG "Site audit Phase D"). Three of the six recommendations were already true; the other five changes are built (cart, Delivery, Profile, Saved Cards, Settings). **All four phases of the audit are complete.**
- **Follow-up done, 2026-11-09** (CHANGELOG "Audit follow-up: unopened screens…"): the screens in section 6 were opened and measured, the production build was run, "Cookie settings" was added to the sign-in footer, and the debug hooks were removed. Findings and what's still open are in section 7.
- **Prompt 2 done, 2026-11-09:** the accessibility pass, phone pop-ups, address lines, launch checklist, performance, SEO and headers. The report and its outcome are in `PROMPT-2-REPORT-2026-11-09.md`, with checklists in `LAUNCH-READINESS.md` and `DEVICE-AND-SCREEN-READER-CHECKLIST.md`. The phone half of I4 is closed: Top up and checkout fit one phone screen.
- **Prompt 1B done, 2026-11-09:** Prompt 1’s checks on Build My Card and Personalize a Template. Findings and fixes are in section 8. All eleven owner decisions (D1–D11) were built the same day.

---

## 6. Not covered
- **Dialogs and states not opened this round:** Delivery's checkout, "On its way", the two-step Log In code step, the two-step setup dialog, the Delete account dialog, a Contact send, Settings forms in their edit states. **Opened and measured on 2026-11-09 (section 7).** Delivery has no checkout or "On its way" pop-up any more: payment happens on the page, and the pop-up was removed earlier (build-fixes item 16).
- **Screenshots:** the browser pane was hidden for part of the walk, so screenshots were unreliable. The findings rest on measurements and source, with screenshots only where noted. None were saved to disk.
- **Not tested at all:** reduced motion, Windows high contrast, a screen-reader pass, keyboard-only runs, real devices.
- **Scratch files:** the measuring script and the temp app copy are in `%TEMP%\souv-audit-20261108\` and `%TEMP%\souv-audit2-copy-190833\`. A local-only `frontend-audit2-copy` entry was added to `.claude/launch.json` (backup beside the copy); don't commit it.

---

## 7. Follow-up, 2026-11-09: the unopened screens

Opened in a fresh temp copy (`%TEMP%\souv-p1audit-copy-225407`, port 3180, launch entry `frontend-p1audit-copy`, local only) at 1280×720, 1024×768, 768×1024 and 375×812, with the audit's measuring script plus a dialog checker (label and description exist, Tab wraps at both ends, Escape closes, focus returns).

### Findings

| # | Severity | Screen | Size | What was wrong | Fix | Status |
|---|---|---|---|---|---|---|
| F1 | Bug | Delivery action bar | all | After "Confirm payment", focus fell to `<body>`: the button is `disabled` while busy, and Chrome drops focus from a focused button that becomes disabled. | `aria-disabled` while busy and a guard in the handler (Checkout's pattern). | Fixed |
| F2 | Bug | Settings (Personal info, Change password, Payment methods, Saved recipients, Preferences select, two-step Turn on), `ConfirmDialog`, Delete account, Contact, Community send, every sign-in submit, "Resend code" / "Resend reset code" | all | The same `disabled={busy}` pattern (about 20 controls). Seen in the browser on Personal info: "Save changes" → `<body>`. | Same as F1 everywhere, plus a busy style for `aria-disabled` on Settings, Contact and the sign-in screens. **Owner: fix all.** | Fixed |
| F3 | Bug | Log In, two-step code step | 375 | "Back to email and password" dropped focus to `<body>` and left "That code didn't match" showing on the password form. | Clear the message and error; focus the password field. | Fixed |
| F4 | Bug | Settings › Saved recipients | all | An invalid ZIP left focus on Save (error not read). Cancel (add or edit) dropped focus to `<body>`. | `focusFirstInvalid`; Cancel returns to "Add a recipient". | Fixed |
| F5 | Bug | Settings › Payment methods | all | A bad "Last four digits" was only in the status line, not on the field. Edit didn't move focus to the form it fills. Cancel dropped focus to `<body>`. | Error on the field and focused; Edit and Cancel focus the form heading. | Fixed |
| F6 | Bug | Two-step setup dialog | all | An empty or wrong code was only in the status line; the field wasn't marked or focused. | Error on the field (`aria-invalid`, `aria-describedby`) and focused. | Fixed |
| F7 | Bug | Delete account dialog | all | The B6 failure messages sit in the field's error, which isn't a live region, and both buttons are busy while it runs, so focus was lost and the message never read. | Focus the field after a failure. | Fixed (code only: the mock calls can't fail) |
| F8 | Bug | Cookie banner (found in task 6) | all | When "Cookie settings" is pressed without taking focus (Safari doesn't focus buttons on click), the banner stored `<body>` as the opener and returned focus there. | The button passes itself as the opener; `<body>` is never stored. | Fixed |
| F9 | Inconsistency | Two-step setup; Delete account | 1280, 1024, 375 | Taller than the screen: 886 / 1016px and 726 / 898px, so the overlay scrolled. | Compact (owner): now 653 / 718px and 586 / 777px (Components 2.31). | Fixed |
| F10 | Inconsistency | Settings dialog titles; Saved Cards delete | all | No script word (2.18). | One script phrase, last, in each (owner). | Fixed |
| F11 | Polish | Delivery and sign-in busy labels | all | "Starting checkout..." and nine more with three dots (P7 standard "…"). | "…". | Fixed |
| F12 | Note | Delivery | all | The checkout and "On its way" pop-ups in the brief don't exist: Delivery pays on the page (Continue to checkout → Confirm payment → Send to print). | Measured the page in each state instead: no inner scroll, clipping or overflow. | — |

### Checked and fine
- **Delivery:** Linda Wilson from the picker plus a Toronto return address, then Continue to checkout, Confirm payment and Send to print. Every field is labelled. The page in the paid state and the confirmation are clean at all four sizes.
- **Log In code step:** the code field (numeric, `one-time-code`, 6 digits) is focused on arrival, and empty and wrong codes are announced. 246810 signs in to `/create`. 375×812: 812px, nothing scrolls.
- **Two-step setup and Turn off:** both dialogs are labelled and described, Tab wraps both ways, and Escape returns focus to the opener. Turn on → "Turn off" gets focus, and the reverse.
- **Delete account:** the DELETE gate (case-insensitive, spaces trimmed, partial words rejected). Labelled and described alertdialog, Tab trapped, Escape back to "Delete my account…". The demo account was not deleted.
- **Settings edit states:** recipients add (invalid ZIP) and edit, payment method add, edit and Remove (confirm checked, Escape back to Remove, Remove → form heading), mismatched passwords ("Doesn't match yet", focus on the confirm field), Personal info save. No inner scroll, clipping, overflow or small targets at the four sizes.
- **Contact on a phone:** a send gives the thank-you with its reference, focus on its heading; "Send another message" goes back to the form heading. 375×812: no sideways scroll.

### Owner decisions on the open items (2026-11-09)
- **Done:** O1 (shared page-change focus rule), O2 (Cart, Pricing, the landing gallery, and the scroll-row arrows in `personalize/PtScrollRow.tsx` used by Community Cards and Personalize, approved by the owner), O3 (equal widths), O4 (code field marked invalid). See CHANGELOG "Audit follow-up, round 2".
- **Not chosen, still open:** O5 (Community send titles) and O6 (route sizes).

### Open items as first found
- **O1 — focus after a page change:** moving between pages (Saved Cards → Delivery, Delivery → Confirmation) leaves focus on `<body>`, site-wide. Next's route announcer reads the title, but nothing moves focus to the new `h1`. That needs a shared rule (for example, focus `main h1` on client navigation, not on first load), including Build My Card and Personalize.
- **O2 — steppers and arrows disabled at their limit:** Cart's quantity "−", Pricing's Big Sender "−", the landing gallery arrows and Community Cards' row arrows become `disabled` (Community: opacity 0) while focused, so focus drops to `<body>`. They aren't busy states, so they weren't in F2.
- **O3 — action buttons not the same width:** Delivery's bar (Back to review 181px, Send to print 172px at 1280) and Contact's thank-you on phones (239px and 174px, stacked, left-aligned).
- **O4 — sign-in code errors:** shown in the form's alert line (announced, like every sign-in form), not on the field with `aria-invalid`. Kept consistent with the other sign-in forms.
- **O5 — Community send titles:** "{card name}" and "Log in to send "…"" have no script word.
- **O6 — first-load JS over about 200 kB:** Personalize 259 kB, Build My Card 230, Saved Cards & Songs 214, Settings 211, `/home` 209, Cart 204, Community Cards 202 (shared 103 kB).

### Not covered
- Delete account's failure paths and the Safari opener case: checked in code (and with a scripted click that doesn't focus) only.
- The Log In code step was measured at 375×812 only; the normal Log In page at 1280 and 375.
- Screenshots were checked in the session (two-step and Delete dialogs at 1280, Delivery, the phone footer and banner, Contact on a phone) but the preview tool can't save them to disk.
- The pane was hidden for part of the walk (timers throttled, `requestAnimationFrame` paused). Where a check relied on it, `requestAnimationFrame` was swapped for a 16ms timer in the test page only. The busy-button checks were repeated with the page visible.
- Screen reader, reduced motion, high contrast and real devices.

---

## 8. Prompt 1B, 2026-11-09: Build My Card and Personalize a Template

The site audit, Prompt 1's checks and its two follow-up rounds, now run on the two flows Prompt 1 left out. Temp copy `%TEMP%\souv-p1b-copy-114339` (port 3200, launch entry `frontend-p1b-copy`, local only); production check on `%TEMP%\souv-p1b-build-130834` (port 3210, `frontend-p1b-prod`). Sizes: 1280×720, 1024×768, 768×1024, 375×812. A walker iframe pressed only real action-bar buttons; each step was measured in the walker resized to each size (same state), with the audit's measuring script plus a dialog checker.

### 8.1 Inventory (Task 0)
**What changed since 2026-11-08 21:50:** every change is already in the changelog (diffed against a copy of `frontend/` from 21:21 on 11-08). ★ marks a question or screen that is new or changed since then.

**Build My Card questions** (`bmc/questionBank.ts`, unchanged file):

| Stage | Question | Purpose |
|---|---|---|
| Photo | P1_photo "Start with a *photo*" | Add photos (rights pop-up on pick), or "Describe them instead" |
| Photo | P2_primary "Which one is the *main photo?*" | With 2+ photos: the photo the front is built from |
| Photo | P3_subjects "Who's in *these photos?*" | Same person or pet, different ones, or a mix |
| Photo | P4_look_hair / P4_look_style / P4_look_signature | After a description of a person: up to two follow-ups for missing details (hair, then clothes, then something they're known for); a skip ends them |
| Basics | B0_story "Tell us about *the moment*" | Free story the interviewer reads to fill later answers |
| Basics | B1_occasion "What's the *occasion?*" | 33 occasions plus Custom |
| Basics | B2_people "Who it's *from and to*" | Their name, how to say it, who they are to you, your name |
| Basics | B6_orientation "Pick the card's *shape*" | Portrait 5×7 or Landscape 7×5 |
| Basics | B7_purpose "What should it *say to them?*" | The feeling, when the story didn't give it |
| Image | I1_mode "Choose a *blueprint*" | Transform, Enhance or Decorate |
| Image | I2_style "Choose a *visual style*" ★ | 16 styles plus Custom, now pill chips (11-09) |
| Image | T1_scene, T2_detail, T4_keep, T3_options | Transform: the scene, more detail, who stays recognisable, add or avoid |
| Image | E2_refine "Set the *finish*" | Enhance: light and colour, plus Custom |
| Image | D1_what "How should we *decorate it?*" | Decorate: nine options in a 3×3 grid |
| Image | D2_accents, D3_wearables, D3a_wearer ★, D4_border, D5_colour, D7_stickers, D8_pattern, D9_sparkle, D10_lettering, D6_own_words | The Decorate follow-ups. The wearer's phone marker was removed on 11-09 |
| Image | I3_vibes "Set the *vibe*" | Up to three of 21 vibes, plus Custom |
| Image | I4_caption "Words on *the front*" | Write it, suggest one (AI), or none |
| Image | I5_summary "Your front, *at a glance*" | Check the front's answers |
| Message | M1_inside "What goes *inside*" ★ | Your words, the AI writer (sign-off chips, "What should change?" row), or blank |
| Song | S1_song "Add a *song*" ★ | Sung, instrumental or none; QR code on its own phone screen (marker removed 11-09) |
| Song | S2_genre "Choose the *sound*" | Ten presets, three "Suggested" |
| Song | S4_lyrics "Your *lyrics*" ★ | Edit, Rewrite with a note, the out-of-date notice, approve |
| Song | G1_generate "Ready to *make it*" | Costs, then Create |

**Personalize questions:**

| File | Questions (purpose) |
|---|---|
| `sharedQuestions.ts` | PT_names ★ (names, "They're your…" (new 11-08), how to say it); PT_photo_mode (use the card's photo treatment, keep it as it is, or no photo); PT_photo (upload, rights pop-up); PT_look (how they look, plus the same follow-ups as Build My Card); captions; PT_message ★ (shared message step with the sign-off and "What should change?" rows); PT_song ("Add a *song?*"); PT_genre ★ ("Choose the *sound*", new 11-08, the card's preset pre-selected with its reason); PT_song_use (name and detail in the song); PT_lyrics ★ (redraft row and history); PT_generate |
| `templates/horoscope.ts` | H_birthdate (the sign), H_feature (who's featured), H_transform / H_symbol (scene or symbol ideas, AI), H_celebrate + H_celebrate_detail (trait, memory or wish), H_mood (Dreamy, Playful, Heartfelt, or write one), H_cover (cover line). ★ `writerBrief` and `songPreset` (11-08) |
| `templates/onThisDay.ts` | O_birthdate (with the year), O_location, O_story (lead story candidates with sources; lighter-stories option), O_photo_role, O_headline (AI), O_front_copy (masthead and caption). ★ `writerBrief`, `songPreset` Jazz Swing |
| `templates/comicCard.ts` | C_character (hero concepts if no look is given), C_occasion, C_story_type + C_story_detail, C_premise / C_ending (AI), C_storyboard (four panels, two bubbles each), C_style. ★ `writerBrief`, `songPreset` Pop Rock |
| `templates/savedTemplate.ts` | Old drafts: L_birthday, L_caption, plus the shared look questions. ★ `writerBrief`, `songPreset` Pop |

**Stages:** Build My Card: Photo, Basics, Image, Message, Song, Review. Personalize: Details, Photo, Design, Words, Song, Review.

**Dialogs:**
- the image-rights pop-up;
- "Save your card before *step two*" (sign-up);
- "Making your *card*" (creating);
- "Make a new *front?*" and "Make a new *song?*" (spend);
- "Top up to create *your card*";
- "Approve all three and continue to *delivery?*";
- "Your card *so far*" (phone sheet);
- "Sign up to see every *template*" (Personalize, signed out);
- and, through the choice, the Top up pop-up.

**Review:** Front (Change answers, Try again · 1 credit, Approve), Inside message (Edit, AI writer, Approve, "Print this one"), Song (Edit lyrics, Try again · 1 credit, Approve); "Continue to delivery" once all are approved.

**`catalogue.ts`:** unchanged. Horoscope, On This Day and Comic Card open; the rest are Coming soon.

### 8.2 Findings and fixes

| # | Severity | Flow · where | Size | What was wrong (standard) | Fix | Status |
|---|---|---|---|---|---|---|
| F-1 | Bug | Both · AI writer, Rewrite, Suggest a caption, Suggest more, Rewrite storyboard, lighter-stories checkbox, Send idea, Continue/Create, Review Try again / Approve / AI writer | all | `disabled` while busy, so focus fell to `<body>` (2.28). Seen in the browser: AI writer, Rewrite (both flows), Suggest a caption, Review Try again after "Use 1 credit", Review AI writer, the checkbox | `aria-disabled` plus a guard; the busy look; out-of-tries states too | Fixed |
| F-2 | Bug | Both · photo step, Review message | all | Focus to `<body>` after "Describe them instead" and its Back, Remove photo, and "Print this one" | Focus the box or link, the next remove button or Choose photos, and Approve message | Fixed |
| F-3 | Bug | Personalize · gallery and card | all | Opening a card, "Choose a different template" and browser Back left focus on `<body>`. The first only shows in production (Strict Mode hid it in development) | The new view's `main h1` is focused | Fixed |
| F-4 | Bug | Both · saved draft opened by address | all | Focus jumped to the heading on first load (resume, `#review`) | `useFocusOnChange`, keyed after the draft loads | Fixed |
| F-5 | Bug | Build My Card · wearers, song/QR, Review on phones | 375 | Since the visible "Part N of M" went (11-09), a section change wasn't announced. Review's Next at the last card and Previous at the first dropped focus to `<body>` | A hidden polite "Part N of M: …" line; Review focuses the card's heading | Fixed |
| F-6 | Bug | Both · "Top up to create your card" | 375 | 851px in 812: the overlay scrolled (Prompt 2: phone pop-ups fit one screen) | Compact phone CSS: 664px | Fixed |
| F-7 | Inconsistency | Both · "Your card so far" | 1024 | Answers 53px wide, cut to a few letters (nothing clipped) | Label above the answer from 1024 to 1279px: 139px | Fixed |
| F-8 | Inconsistency | Both · photo step with photos | 1280 | Build My Card 740px, Personalize 770px (one screen) | One-row drop zone once photos are added: 720 / 720 | Fixed |
| F-9 | Inconsistency | Personalize · every step of On This Day and Comic Card | 1280 | The header wrapped to two lines, adding 38px (2.20 says one line) | Name 1.75rem from 1024px; 44px header | Fixed |
| F-10 | Inconsistency | Both · "What should change?" row | ≥1024 | Picks and the few words stacked (133px) | One row on desktop. Message 941 → 879, lyrics 802 → 792 | Fixed (rest is D1, D2) |
| F-11 | Inconsistency | Personalize · On This Day "Pick the lead story" | 1280, 1024 | 1021 / 1029px | Two across, tighter: 877 / 925 | Partly fixed (D4) |
| F-12 | Polish | Both · Review lyrics editor, lyrics step editor, phone sheet | all | The editor scrolled inside (474 in 263px); the sheet had no description | The editor grows; a hidden description | Fixed |

**Checked and fine:**
- **Every other step at all four sizes** fits one desktop screen (720 / 768) with Continue on screen, no inner scroll, no sideways scroll and nothing clipped, including:
  - the Decorate path with all nine options and every Custom field;
  - Transform, Enhance, the describe path and its follow-ups;
  - every Personalize Details, Photo and Design question.
- **Phones:** one section per screen, Continue always on screen.
- **Tablet (768):** the scrolling layout, as designed (2.19).
- **Credits:**
  - Create at 0 credits opens the choice. Cards → pay → back to the same draft (10 credits). Credits from Review → pay → back to `#review`.
  - A triple-pressed Create charged once (BMC 10 → 8, Personalize 20 → 18).
  - A reload during Create: nothing was charged, Create was offered again, and the retry charged once.
- **No credits pop-up on opening Personalize** at 0 credits.
- **Dialogs:** each is labelled and described by elements that exist, Tab wraps both ways, Escape closes and returns focus to the opener, and each title has a script word.
  - Rights pop-up: Escape discards the photos.
  - Spend: Escape keeps the approval.
  - "Making your card" can't be closed while working.
- **Suggested:** the Build My Card genre shows three "Suggested". Personalize pre-selects the card's preset with its reason: "Suits a playful Horoscope card." for Pop, Jazz Swing for On This Day.
- **Redraft row:** "Funnier", "From Jo" and "Shorter" are followed, and the row clears after a redraft. The out-of-date lyrics notice appears after editing the message, and "Rewrite them" clears it.
- **Personalize gallery:** search, chips and no results. "Suggest 'zzqqx'" fills and focuses the idea field. Coming soon tiles aren't interactive. Edge arrows are `aria-disabled` and out of the tab order. Signed out: Most popular, the forest band, and the sign-up pop-up (Escape returns to the tile).

### 8.3 Needs the owner's decision

**Status, 2026-11-09:** all eleven are decided and built (D1–D11). See each row and the CHANGELOG entries "Prompt 1B decision D1 and D2" through "D11".

| # | Flow · where | Size | What | Options |
|---|---|---|---|---|
| D1 | Both · the message step with an AI draft | 1280 / 1024 | 879 / 940px, so the sign-off and "What should change?" rows run under the sticky action bar | **Done (owner chose (a) + (b), 2026-11-09):** the sign-off is one select on the "What should change?" row; the AI box is 4 rows on desktop and grows with its text; the counter sits in its corner. Now 720 / 768px in both flows. |
| D2 | Both · the lyrics step | 1280 / 1024 | 792 / 800px | **Done (owner, 2026-11-09):** the rewrites-left hint is in the header, and the lyrics run in three columns from 1280. Now 720 / 768px in both flows. With the out-of-date notice it's 742 / 773px (that state lasts until "Rewrite them" or an edit). |
| D3 | Personalize · Comic Card storyboard | all | 1385px at 1280 (665 over); the panel boxes scroll inside at 1024 and 375 | **Done (owner, 2026-11-09).** Side by side was tried and measured 781 / 838px (162px columns), so desktop has one row per panel, with Rewrite in the action bar. Phones get one panel per screen. Now 720 / 768px, and no box scrolls inside. |
| D4 | Personalize · On This Day "Pick the lead story" and "Write the headline" | 1280 / 1024 | 877 / 925px after F-11; the headline step was 804 / 783 before F-9 (about 766 / 745 expected now) | **Done (owner chose three, then Show more; 2026-11-09):** three across from 1024px, with "Show N more stories" and the note and option on one line. Lead story 720 / 768px. Headline (tighter suggestion cards) 720 / 768px. |
| D5 | Personalize · On This Day Review (and "Ready to create") | 1280 / 1024 | Review 819 / 916px, so the front's buttons are off screen; "Ready to create" 789px. The cause is the "Front words: …" note listing every printed word | **Done (owner chose the disclosure; 2026-11-09):** "Check the spelling (N)" on Review and "Ready to create", for all four cards. Review 720 / 768px; "Ready to create" 720 / 768px. |
| D6 | Both · the image-rights pop-up | 375 | 1344px: the overlay scrolls. The promises are shown in full (legal, 2026-11-08); the old phone sections went with the scroll gate | **Done (owner chose sections, 2026-11-09):** two phone screens, the promises in full, then the photos waiting, the links and the two ticks. 712 / 547px at 375×812, no overlay scroll, the same in Personalize. Same words, same attestation version. |
| D7 | Personalize · Review | 375, 1024 | On phones the first card's buttons sat below the fold (882–930 in 812) under the template header; Horoscope Review was 792px at 1024 | A smaller header on phones; at 1024 the name beside the rail like the questions. **Update 2026-11-09:** after D5, Horoscope, Comic Card and On This Day Review are 768px at 1024. **Phones done (owner, 2026-11-09):** a one-line template header, a tighter Review top and a 190px front put the first card's buttons at 670–775px of 812 for all four cards. |
| D8 | Both · Delivery → "Back to review" | all | The three approvals are cleared (they're page state) | **Done (owner, 2026-11-09): saved with the draft** (`brief.control.approvals`) in both flows. Back to review, a reload and Saved Cards keep them; an edit or a new version un-approves just that piece. |
| D9 | Both · radio groups with nothing chosen yet | all | "Who's in these photos?", shape, blueprint, song and the Build My Card genre start empty. The audit standard says a radio group always has a checked item | **Done (owner chose safe defaults only, 2026-11-09):** Build My Card's shape (Portrait) and genre (the top suggestion), and Personalize's "What goes in the song?" (Yes / Yes) start chosen. Choices that cost a credit or change meaning stay empty on purpose. That's the documented exception in Components 2.17, so the standard now reads "a radio group always has a checked item, unless the choice costs or changes meaning". |
| D10 | Both · a paid Try again at 0 credits | all | The choice says "Top up to create *your card*" on Review too | **Done (owner, 2026-11-09):** a `"redo"` variant says "Top up to make a new *version*", "Make the new version now, then send your card." and "…back to your review." Create is unchanged. |
| D11 | Personalize · "Ready to create"; Build My Card · accents with Custom | 1280; 1024 | 725px (5 over); 776px (8 over) | Polish. **The first is done with D5 (720px). Accents done (owner, 2026-11-09):** tighter gaps and a 44px Custom field at 1024–1279px, 776 → 768px. |

### 8.4 Build and hooks
- **Production build (Task 4):** a separate copy, exit 0, no errors or warnings. Build My Card 230 kB (unchanged); Personalize 260 kB (+1 kB, the focus helpers). Reducing them is Prompt 2's job.
- **Debug hooks (Task 9):** none in either flow, their mock writers or their pages.

### 8.5 Not covered
- Real Bedrock, fal and Lyria calls; a printed QR scan; a screen reader; real devices; Safari.
- Screenshots were reviewed in the session but couldn't be saved to disk.
- "Making your card" was measured at 1280 only (it closes about a second after Create).
- The phone "Approve all three" pop-up wasn't opened (each Approve is on its own card on phones).
- Signed-out Build My Card wasn't re-walked.
- Where the pane was hidden, `requestAnimationFrame` was swapped for a 16ms timer in the test page only.

## 9. Prompt 2, second run, 2026-11-09: the two flows in Prompt 2's checks

Report only; nothing in the app changed. The full report, with measurements and proposals, is `PROMPT-2B-REPORT-2026-11-09.md`.
- **Part A (accessibility, both flows):**
  - **Passed:** one `h1` per step; landmarks; names; radio groups with one Tab stop and arrow keys; labelled dialogs; busy states; 2px `--l-focus` rings everywhere; reduced motion; selected states in high contrast; hover colours from tokens.
  - **Findings A-F1 to A-F10:**
    - the "Your card so far" panel has no `h2`, so the stage `h3`s skip a level;
    - AI results aren't announced;
    - the AI writer's on state is invisible in high contrast;
    - "Approved" on screen vs the name "Approve front" (WCAG 2.5.3);
    - targets under 44px;
    - the sign-off hint inside its label;
    - file names as alt text;
    - the gallery tiles' name mismatch;
    - smooth scroll-row arrows under reduced motion (`PtScrollRow.tsx`, shared);
    - hover in forest instead of berry on Review's decision buttons and the cards-or-credits options.
- **Part B (pop-ups):**
  - Everything fits at 375×812.
  - At 375×667 these still scroll: Top up cards and credits, Checkout, both "Top up to…" choices and the rights pop-up's promises screen.
  - The sheet's apparent 24px overflow was a paused animation, not a bug.
- **Part C:** built in Prompt 2; the code was re-checked after another session's edits.
- **Part E:**
  - **Phone CLS** is 0.665 (Build My Card) and 0.728 (Personalize): the server HTML's `<main>` is nearly empty, so the footer jumps.
  - **About 32 kB of mock and Build My Card code** reaches every page, even with mock mode off.
  - **Lazy-loading candidates:** the QR library (12 kB) and Personalize's questionnaire on the gallery (about 50 kB).
  - **Browser-built prompts** must not be trusted by the backend (LAUNCH-READINESS 5.10).
- **Parts D and F:** `LAUNCH-READINESS.md` and `DEVICE-AND-SCREEN-READER-CHECKLIST.md` (new Part 3) updated.
- **Outcome (owner, 2026-11-09, "The recommended set"):**
  - **Built:** A-F1 to A-F10, B-1, B-2, E-F1, E-F3, E-F4 and E-F6.
  - **Results:** the short-phone pop-ups fit 375×667. Mobile CLS is 0, and mobile performance is 87 (Build My Card) and 89 (Personalize). First load is 224 kB (Build My Card) and 205 kB (Personalize).
  - **Open:** E-F2 waits for the community-sharing session; B-3 is accepted as a scroll.
  - **New note:** `?for=community` made Build My Card a dynamic route (streamed metadata). Details are in the report's Outcome.

## 10. Community Cards audit, 2026-11-09 (report only)

Report only; nothing in the app changed. The full report is `build-fixes/community-sharing-2026-11-09/COMMUNITY-CARDS-AUDIT-REPORT-2026-11-09.md`. Today's features are logged in `build-fixes/community-sharing-2026-11-09/CHANGELOG.md`.
- **Scope:**
  - the gallery (open to everyone), tiles, and the Send, sign-in, Share and guidelines pop-ups;
  - the "Build a card for the Community" band and community-mode Build My Card end to end;
  - Community cards in Delivery and Saved Cards & Songs;
  - guidelines vs Terms §5/§6, SEO and performance.
- **Passed:**
  - tiles uniform at all five sizes;
  - no raw hex, gold or retired logos;
  - pop-ups labelled and described, with a script word, Escape and focus return;
  - Send idempotent on a double press, and no credits used;
  - community mode: describe-only, no Song, 1 credit, top-up returns to the draft;
  - build clean; Lighthouse mobile 87 / desktop 99, with accessibility, best practices and SEO all 100.
- **Findings C1–C21.** The biggest:
  - C1: the community flow never submits for review;
  - C2: community mode is lost on Back and reopen;
  - C3: the Send pop-up no longer fits at 1280×720 and on phones;
  - C4: Build My Card is a dynamic route;
  - C5: the guidelines pop-up scrolls like a page.
- **Open:** 9 owner decisions, listed in the report.
- **Outcome (owner, 2026-11-09, "Recommended set"):**
  - **Built:** C1–C22. C22 was found while building: 7 of the 14 rows had a broken `aria-labelledby`, because their ids held spaces.
  - **Decisions as built:**
    - C1: a mock submission from Review;
    - C2: community mode saved in the draft (`audience`);
    - C21: "Front";
    - C11: static `/community-cards/{id}` pages;
    - C9: aliases plus a notice;
    - C5: disclosures;
    - C12: front only is public, and "Who it's from and to" is skipped;
    - C7: reuse the draft;
    - C16: the flags kept.
  - **Results:**
    - every Community pop-up fits one screen at all five sizes, including 375×667 (the guidelines closed; an opened long group scrolls);
    - the Send pop-up is back to 653px at 1280×720;
    - tiles are unchanged;
    - Build My Card is static again (227 kB);
    - `/community-cards` 203 kB; card pages 196 kB;
    - Lighthouse: gallery 100 / 83 and card page 100 / 89 (desktop / mobile).
  - **Details:** `build-fixes/community-sharing-2026-11-09/CHANGELOG.md` §11.
  - **Still open:**
    - the backend review queue and emails;
    - a 1200×630 preview image per card once real art exists;
    - lawyer review of the guidelines and Terms §5 (drafts item 10);
    - a screen reader, real devices and real social previews.
- **E-F2 done (2026-11-09):** the mocks load only in mock mode. Every page's shared chunk is 42.9 → 12.9 kB, and `/` is 192 → 162 kB. Build My Card is static again (213 kB), and Personalize is 185 kB.
