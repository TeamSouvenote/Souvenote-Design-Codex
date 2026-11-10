# Prompt 2 report: accessibility, phone pop-ups, address lines, launch, performance and SEO

Date: 2026-11-09. Branch `mock-data-mode`. **Report only: nothing in the app has changed yet.** Each part waits for the owner's approval.

**Where it was checked:**
- **Dev copy:** `%TEMP%\souv-p1audit-copy-225407` (port 3180, `frontend-p1audit-copy`).
- **Production build:** from Prompt 1, served with `next start` from `%TEMP%\souv-p1build-230123` (port 3190, new local-only launch entry `frontend-p2-prod`).
- **Lighthouse 12:** installed in `%TEMP%\souv-p2-lighthouse-*`.

Part D is `LAUNCH-READINESS.md`. Part F and the screen-reader checklist are `DEVICE-AND-SCREEN-READER-CHECKLIST.md`.

---

## Part A: accessibility

### How it was checked
- **Semantics probe:** every in-scope route signed in and signed out at 1280×720 and 375×812, plus Build My Card and Personalize as report-only. It checked:
  - headings and their order, and landmarks;
  - the skip link: that it's the first Tab stop and its target exists;
  - control names, and the values of `aria-pressed`, `aria-current` and radio groups;
  - image alt text, and SVGs not hidden from screen readers;
  - live regions, positive tabindex, and controls you can Tab to but can't see.
- **Focus rings:** read from the stylesheets. The pane has no window focus, so `:focus-visible` never matches a scripted focus. Each element was tested against every `:focus` / `:focus-visible` rule.
- **Keyboard:** the hamburger menu, the nav credits popover, the FAQ accordion, scroll rows, carousels and dialogs (most dialogs were already checked in Prompt 1).
- **Reduced motion:** emulated by copying every `prefers-reduced-motion: reduce` block into a live sheet, then listing anything still animating or moving.
- **High contrast:** checked statically in the CSS (forced colours can't be emulated in the pane).
- **Hover:** every `:hover` rule applied on a test class (test page only); colour, background and contrast read for each element.
- **Lighthouse accessibility:** 100 on all 14 runs.

### Passed
- **Headings:** one `h1` per page, and no skipped heading levels anywhere (BMC and PT included).
- **Landmarks:** banner, navigation (labelled when there are two), main and contentinfo on every page; the sign-in screens have no nav, by design.
- **Skip link:** it's the first Tab stop on every page and its target exists.
- **Names and states:** every control has a name, and nothing uses a positive tabindex. `aria-pressed` values are valid. `aria-current="location"` marks the open Settings section.
- **Images:** logos are named "Souvenote"; card art and engravings use `alt=""`. The landing gallery's file inputs are `aria-hidden` and `tabindex=-1`, opened by a labelled button.
- **Focus rings:** 2px `--l-focus` (forest on light, gold on forest) on every page; `--sv-focus` on the sign-in screens. Delivery's switch draws its ring on a wider `::before`. Personalize's search draws it on the box (`:focus-within`). Pricing's selected tier uses a forest ring on purpose.
- **Menu:** Enter opens it with `aria-expanded`; Escape closes it and returns focus to the button.
- **Nav credits popover:** opens on `:focus-within`, and its three links are reachable by Tab.
- **FAQ accordion:** `aria-expanded` and `aria-controls` buttons inside `h3`s, each with a `region` panel; no closed answer is tabbable.
- **Hidden controls:** none can be tabbed to while invisible. The flags were the hidden popover (`visibility: hidden`), the phone nav links and `/create`'s phone/desktop layouts (`display: none`), at the four real sizes.
- **Reduced motion:** no animation keeps running on `/home`, `/create`, Community Cards, Pricing, FAQ, Settings, Delivery or Cart. The hero card, the vinyl and the pop-up entrance animations all stop.
- **Hover:** berry on ivory and gold on forest everywhere (5.1–6.2:1); forest buttons stay ivory on forest (9.9:1). No raw colours, and no hover that fails contrast.

### Findings (ranked)
| # | Severity | Where / size | What's wrong | Proposed fix |
|---|---|---|---|---|
| A1 | Bug | Pricing "Prices for" switch, Delivery's One recipient / Multiple and Send now / Schedule chips, Pricing's quantity tiers; all sizes | **High contrast (forced colours):** the selected one is shown only by its fill, which forced colours removes, so you can't see which is selected. Screen readers still hear `aria-pressed`. | `@media (forced-colors: active)`: a 3px `Highlight` outline on the selected item, as Community Cards' chips already have (`pricing.css`, `checkout-flow.css`). |
| A2 | Bug | Every `FlowDialog`, the Top up pop-up, the cookie banner, the hamburger menu panel; all sizes | **High contrast:** these surfaces are edged only by a top stripe and a shadow, so their outline disappears against the page. | In forced colours, `border: 1px solid CanvasText` on `.fd-dialog`, `.tu-dialog`, `.cc-banner` and `.souv-popmenu` (scoped CSS only). |
| A3 | Inconsistency | `/create` option cards; all sizes | No focus ring (`outline: none`): focus is shown by the card lifting and the arrow pill turning berry. With reduced motion, only the pill change is left. | Add the standard 2px `--l-focus` ring (outline-offset 4px) and keep the lift (`create-options.css`). |
| A4 | Inconsistency | Nav links "Personalize a Template", "Build My Card", "Community Cards"; landing gallery flip buttons; desktop | Lighthouse "label-content-name-mismatch". The nav labels break across two lines with no space, so the visible text reads "Personalizea Template", which doesn't match the `aria-label`. The flip buttons' `aria-label` replaces the visible card text. | Nav: put a space before the line break and drop the redundant `aria-label`. Gallery: keep the label but start it with the visible title (it already does); Lighthouse still flags it, so this one is polish. |
| A5 | Polish | `/home`, footer on every page | With reduced motion, four hover transitions still move: the nav underline (0.3s), the music button, the landing steps' hover lift (0.6s) and the footer social buttons (`transition: all`). | Add them to the existing reduced-motion blocks (`landing.css`, `site.css`). |
| A6 | Polish | `/create` and Welcome carousels | No arrow-key support. Tab, Enter and the labelled dot buttons do work. | Optional: Left/Right on the focused card moves the carousel. **`useCardCarousel` is shared with the Welcome modal; ask before changing.** |
| A7 | Polish | Mock data badge (dev only) | No custom focus ring (browser default). | None needed; it isn't in production builds. |

**BMC and Personalize (report only, no change):** same results; one `h1`, landmarks, skip link, names, rings. Personalize's search ring is on its box. Nothing to fix from this pass.

**Not covered:**
- A real screen reader (see the checklist).
- Real forced-colours rendering (CSS reading only).
- Tab order was checked for no positive tabindex and no invisible stops; it wasn't read out step by step on every page.
- Hover was checked on the desktop pages; dialogs in their hover state weren't.

---

## Part B: phone pop-ups taller than the screen (375×812, 780px available inside the overlay)

### Measured today
| Pop-up | Height | What's in it |
|---|---|---|
| Top up cards | **1,329px** | head 142, Print and Send offer 428 (top 135, text 84, How it works 59, Buy 56), Big Sender offer 518 (top 89, tiers 72, quantity 135, How it works 59, Reserve 56), switch link 73, Back 48 |
| Top up credits | **1,432px** | head 171, three packs at 325 each (Starter $2 / 10 credits, Creator $10 / 80 "Most popular", Power $25 / 250), switch link 73, Back 48 |
| Checkout | **1,238px** | payment column 693 (express pay 52, card fields 237, promo 70, Pay 56, Back 44), summary 447 (pack 67, lines 140, total 46, tax note 92) |

### Proposal (every price, label and action kept)
**Top up credits: compact pack rows (recommended).** On phones each pack becomes one row: name and badge, price, credits and the one-line description on the left, with a "Choose" button on the right. "Most popular" keeps its forest edge.
```
┌──────────────────────────────────────┐
│ Starter            $2.00 CAD  [Choose]│
│ 10 credits · Top off a short session. │
├──────────────────────────────────────┤
│ ★ Most popular                        │
│ Creator           $10.00 CAD  [Choose]│
│ 80 credits · A full evening of …      │
├──────────────────────────────────────┤
│ Power             $25.00 CAD  [Choose]│
│ 250 credits · For repeat senders …    │
└──────────────────────────────────────┘
```
- **Estimate:** packs 1,038 → about 370px, so the pop-up is about 765px (fits 780).
- **Alternative:** one pack per screen with Previous/Next, as Build My Card does: about 800px, still slightly over, and it hides the comparison. Not recommended.

**Top up cards: one offer at a time, with a two-button switch at the top (recommended).**
```
[ Print and Send | Big Sender ]   ← aria-pressed, as the "Prices for" switch
┌ Print and Send ─────────────── $9.99 ┐
│ Send 1 card · postage + 10 AI credits │
│ One flat price, postage included…     │
│ How it works +                        │
│ [ Buy Print and Send ]                │
└───────────────────────────────────────┘
```
- **Estimate:**
  - The larger offer (Big Sender) with a tighter top and quantity row: about 430px.
  - Plus the switch (52px), the head, the switch link and Back: about 760px in total.
- **Alternative:** both offers as collapsed rows that expand in place. That's about 600px collapsed, but about 820px with Big Sender open.

**Checkout: collapsible summary plus a tighter card form (recommended).**
- **Summary bar:** on phones it collapses to "Order summary · $2.10 CAD ▾" (about 56px) at the top. Opened, it shows the full lines and the tax note.
- **Card fields:** Expiry and CVC sit side by side on phones (as from 600px today).
- **Estimate:** 1,238 → about 775px.
- **Placement:** the summary stays in the HTML, closed with a `<details>`, so the total is always visible in the bar.

**Where:** only the pop-ups' own CSS (`pricing.css` `.tu-overlay` rules, `checkout-flow.css` `.fd-checkout` rules), plus two small markup additions:
- the offer switch in `TopUpModal.tsx`;
- the summary `<details>` in `Checkout.tsx`.

Both are needed for the switch and the collapse. They would be re-measured at all four sizes.

---

## Part C: separate address lines for Scribeless

### Today
- **Joined address lines:** `dlvPostalAddress` (`components/Delivery.tsx:82`) joins address lines 1–3 into `PostalAddress.line1`. `PostalAddress` (`lib/api.ts:186`) has `name`, `line1`, `city`, `region`, `postalCode`, `country` and an unused `line2`.
- **Company and title are dropped:** the Delivery form has both, but they never reach the order.
- **Payloads:** the mock order (`mockApi.ts:640`) and the fulfilment payload (`:710`) copy the address as it is.
- **The handoff** (`DEVELOPER_HANDOFF.md:567`) tells the backend to split `name` into first and last names, but a name like "Mary Anne Smith" can't be split reliably.

### Proposal
1. **`PostalAddress`** becomes `{ name, firstName?, lastName?, title?, company?, line1, line2?, line3?, city, region, postalCode, country }`.
   - `name` stays, so existing readers and older stored orders still work.
   - The new fields are optional.
2. **`dlvPostalAddress`** maps each field separately: `line1` = address1, `line2` = address2, `line3` = address3, plus firstName, lastName, title and company. Empty fields are left out. `country` is already two letters (CA/US), and `region` is the province or state.
3. **Mock:** `mockCreateOrder` and the fulfilment payload keep the new fields (they already copy the whole object). Add a `scribelessRecipient(address)` helper in `mockApi.ts` that builds the exact Scribeless shape (`firstName`, `lastName`, `company`, `address{address1, address2, address3, city, state, postalCode, country}`). The fulfilment payload then shows what the backend should send.
4. **`DEVELOPER_HANDOFF.md`:**
   - Field mapping: `firstName` / `lastName` from the order (fall back to splitting `name` only for older orders), `address1–3` from `line1–3`, `state` from `region`, `country` as is, and `company` and `title` into `variables` or the company field if Scribeless's template has one (to confirm in the account).
   - Drop the "join" note.
5. **Compatibility checks before shipping:**
   - Saved recipients already store separate fields, so they're unchanged.
   - The Delivery picker fills the form from them, so it's unchanged.
   - Older stored orders only have `line1`; every reader treats the new fields as optional.
   - The confirmation page doesn't print the address lines.

**Verification after approval:** an order with three address lines and a company ("Linda Wilson, Wilson & Co, 42 Maple Grove, Unit 3, Rear entrance, Halifax NS B3H 1A1") through Continue to checkout → Confirm payment → Send to print → "On its way". Then read the stored order and the fulfilment payload. Also an older order kept in storage (`line1` only) and the saved-recipient picker.

---

## Part D: launch readiness
`LAUNCH-READINESS.md` has 75 items in 10 sections (owner, where each is recorded, status) and a "Before merging to main" list of 8 hard gates. Notes from writing it:
- **Cognito:** the variables in `frontend/.env.local` no longer say `REPLACE_ME` (names checked, not values). It's still unconfirmed whether they point at the production pool.
- **`.gitignore` has no `.claude` line:** the local test entries in `.claude/launch.json` could be committed by accident. Add `.claude/launch.json` to `.gitignore`, or keep excluding it by hand.
- **Model id:** the code uses `global.anthropic.claude-haiku-5-5`.

---

## Part E: performance, SEO and security headers

### Lighthouse 12 (production build, `next start`, signed out)
| Route | Mobile perf | Desktop perf | A11y | Best pr. | SEO | Mobile LCP / FCP |
|---|---|---|---|---|---|---|
| `/` | 83 | 98 | 100 | 100 | 100 | 3.8 / 3.0 s |
| `/home` (→ `/` signed out) | 83 | 99 | 100 | 100 | 100 | 4.2 / 2.3 s |
| `/pricing` | 84 | 98 | 100 | 100 | 100 | 3.6 / 3.0 s |
| `/community-cards` | 82 | 98 | 100 | 100 | 100 | 3.8 / 3.1 s |
| `/faq` | 82 | 98 | 100 | 100 | 100 | 3.8 / 3.3 s |
| `/cart` | 79 | 98 | 100 | 100 | 66 (noindex on purpose) | 4.3 / 3.2 s |
| `/create` (→ `/` signed out) | 85 | 99 | 100 | 100 | 100 | 3.9 / 2.3 s |

Total blocking time 40–100ms on mobile; layout shift 0–0.006. Mobile LCP is mostly **render delay** (89% on `/home`), caused by blocking CSS.

### Ranked findings
| # | Severity | What | Evidence | Proposed fix |
|---|---|---|---|---|
| E1 | Bug | **Google Fonts `@import` on every page.** Outfit (7 weights) and Lobster are imported for fonts that are almost never shown. Each route sets its own font; Outfit shows only in the portalled `BmcErrorModal`, and Lobster is unused. The visitor's IP goes to Google before consent, the Cookie Policy doesn't mention it, and it's the first render-blocking request on all 14 Lighthouse runs (about 650ms). | `styles/colors_and_type.css:9`; built chunk `bbf1462f…css` | Remove the `@import`. Map `--font-sans` to Lato (already self-hosted through `next/font`) so the error modal keeps a brand font. Check the portalled dialogs by eye. |
| E2 | Should fix | **No security headers.** No CSP, HSTS, `X-Frame-Options`/`frame-ancestors`, `nosniff`, Referrer-Policy or Permissions-Policy, and `X-Powered-By: Next.js` is sent (checked live). The session is in web storage, so XSS would mean account takeover, and login and checkout can be framed. | `next.config.mjs:2-5`; `curl -I` | A `headers()` block with CSP in **report-only** mode first, using `'unsafe-inline'` for scripts (Next's 17–28 inline scripts per page can't be hashed), plus HSTS (no preload yet), `nosniff`, `strict-origin-when-cross-origin`, `DENY`, a strict Permissions-Policy, COOP, and `poweredByHeader: false`. Later, a nonce through middleware (this makes every page dynamic: an owner decision). Draft in the agent report (below). If a CDN serves the site, set them there instead. |
| E3 | Should fix | **Route-only CSS in the root layout:** `auth.css` (about 37 kB min, sign-in routes and the Welcome modal), `opened-card.css` (Welcome, `/create`), `bmc.css` (Delivery's error modal), `cardart.css` (Cart). About 47 kB raw / 10 kB gzipped on every page. BMC and PT use none of them. | `app/layout.tsx:5-7` | Import each from the component that uses it (`Auth.tsx`, `CreateOptionsClient.tsx`, `BmcShared.tsx`, `CardArt.tsx`). Prove it with the fingerprint method: baseline twice, then after, 24 targets × 2 sizes. Cascade order shifts, so `/login`, `/signup`, `/home?welcome=1`, `/create`, `/delivery` and `/cart` are the ones to watch. |
| E4 | Should fix | **Hero image `sizes` overstates the width:** `(min-width: 960px) 288px, 58vw`, but the card is at most 240px below 960. Tablets download about twice the bytes ("Properly size images", 57 KiB). | `landing/HeroCard.tsx:38, :48` | `sizes="(min-width: 1200px) 288px, (min-width: 960px) 24vw, (min-width: 414px) 240px, 58vw"`. |
| E5 | Should fix | **Oversized images:** `pt-comic-cover.jpg` 766 kB and `pt-comic-back.jpg` 743 kB at 1488×2096, shown at 288px at most. AVIF isn't enabled. | `public/assets`, `next.config.mjs` (no `images`) | Re-export at about 1000×1408 q80; keep the originals in an archive folder (never delete). Add `images: { formats: ["image/avif", "image/webp"] }`. |
| E6 | Should fix | **Community Cards' main image is lazy-loaded** (`lcp-lazy-loaded`). | `community/CommunityGallery.tsx` (first row's images) | `priority` on the first visible card image (first row only). |
| E7 | Should fix | **Staging would be indexed:** `SITE_URL` is hard-coded and robots allows everything. | `lib/site.ts:4`, `app/robots.ts:9` | Read the site URL from an env var, and serve `Disallow: /` plus `X-Robots-Tag: noindex` outside production. Already in the handoff. |
| E8 | Polish | **Structured data earns no rich results.** FAQPage rich results are limited to government and health sites since 2023, and the same questions are marked up on both `/` and `/faq`. Pricing is an `OfferCatalog` with no `Product`. | `app/page.tsx:27-34`, `app/faq/page.tsx:21`, `pricingContent.ts:37-79` | Keep the FAQPage on `/faq` only, and escape `<` there as `/` does. Change pricing to a `Product` with CAD and US offers (plus shipping details and a return policy once the refund category is confirmed). Organization: a small square logo instead of the 436 kB `LogoMark.png`, `sameAs` with the social links, and a `WebSite` entry. |
| E9 | Polish | **Favicon:** only a 32×32 ICO (Google wants 48px+), and no `app/icon` or `apple-icon`. | `public/favicon.ico` | Add `app/icon.png` (≥192px) and `app/apple-icon.png` (180px). |
| E10 | Polish | **Share image is 850 kB** (it embeds the 766 kB JPEG). | `app/opengraph-image.tsx` | A static share JPEG under 200 kB. |
| E11 | Polish | **Small SEO items:**<br>• `/my-cards` sends a 307 (temporary) for a permanent move; it should be 308.<br>• `og:url` is missing on `/faq`, `/contact`, `/community-cards` and `/legal/*`.<br>• robots.txt has a non-standard `Host:` line.<br>• The sitemap has no `lastModified`. | `my-cards`, `robots.ts:11` | `permanentRedirect()`; `openGraphFor()` on those pages; remove `Host:`; add `lastModified`. |
| E12 | Polish | **Lighthouse "legacy JavaScript"** (11 KiB, one chunk) and "unused JavaScript" (about 50 KiB). | build | Optional: a modern `browserslist`. Unused JS is mostly the shared framework chunk; nothing cheap to cut. |
| E13 | Note | **Unused assets:** `bmc-fathers-day-card.jpg` (499 kB), `hero-card-moon.jpg`, `logomark-gold.png`. `LogoMark.png` and `WordmarkLobster.png` are used only by CSS masks that are always hidden. Dead CSS: `.pt-shell`/`.pt-page`, `auth-eyebrow`, `auth-method-kicker`, the hidden nav/footer shimmer masks. | | Add to the governance "Retired files" list; delete only with approval. |

**Checked and fine:**
- **Indexing:** every private and sign-in route is noindex except `/login` and `/signup` (indexable and in the sitemap, on purpose).
- **Canonicals** are right.
- **Sitemap:** the 11 public URLs only.
- **Robots:** allows crawling so the noindex tags can be read (correct).
- **404s:** unknown pages and unknown `/legal/*` slugs return **HTTP 404** (checked live).
- **Images:** `next/image` width and height match the files; the nav and auth logos use `priority`.

<details><summary>Draft security headers (from the review; not applied)</summary>

Phase 1 is report-only: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: <asset origin>; media-src 'self' blob: <asset origin>; connect-src 'self' <API origin> https://cognito-idp.<region>.amazonaws.com <Cognito domain>; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' <Cognito domain>; worker-src 'self' blob:; upgrade-insecure-requests`.
- **Stripe (when added):** `https://js.stripe.com` in script-src and frame-src, `https://api.stripe.com` in connect-src, `https://hooks.stripe.com` in frame-src.
- **PostHog (when added):** its ingest and asset hosts.
- **Fonts:** with E1 done, no Google Fonts origins are needed.
- **Asset origin:** a new `NEXT_PUBLIC_ASSET_ORIGIN` env var for the asset storage.
- **Hashes:** the three own inline scripts' hashes are recorded, but a hash-only policy would block Next's own scripts.
</details>

---

## Decisions needed
1. **Part A:** which of A1–A5 to fix now. A6 needs the shared carousel hook, so that one is ask-first.
2. **Part B:** the recommended layouts (compact credit rows; one card offer at a time; collapsible checkout summary), or an alternative.
3. **Part C:** build the address-line change as proposed?
4. **Part E:** which of E1–E11 to do now. E2 needs a choice between report-only CSP now and nonces later. E13 needs approval to retire files.
5. **Housekeeping:** add `.claude/launch.json` to `.gitignore`?

---

## Outcome (2026-11-09, after the owner's decisions)
**Approved and built:** A1, A2, A4 and A5; Part B (recommended set); Part C; E1–E11. Details and checks are in CHANGELOG "Prompt 2 built…".

**Report corrections found while building:**
- **A3:** `/create`'s option cards already have a focus ring (3px `--sv-focus` around both card panels), so there was nothing to change.
- **A5:** the music button, footer social buttons and landing steps don't actually move under reduced motion. Only the nav underline did.
- **Part B:** Expiry and CVC were already side by side on phones. A pre-existing spill at 768 (the Big Sender quantity row) was found and fixed.
- **E2:** `X-Frame-Options: DENY` also stopped the site framing its own pages. It's `SAMEORIGIN` / `frame-ancestors 'self'` instead, which still blocks every other site.

**Still open:**
- **Not chosen:** A6 (carousel arrow keys, shared hook); E12 (legacy JavaScript); E13 (retiring unused assets); O5 (Community send titles).
- **Pricing structured data:** `hasMerchantReturnPolicy` and `shippingDetails` wait for the refund category.
- **CSP:** enforcing it and nonces (owner decision), and the CSP report endpoint.
- **Checked in code only:** the staging robots path, and real forced-colours rendering.

**Follow-up decisions (2026-11-09):**
- **Delivery's error pop-up:** rebuilt on `FlowDialog`.
- **A6 carousel arrow keys:** built.
- **O5 Community titles:** built, plus a fit fix for long card names.
- **E13:** files listed under "Retired files".
- **E12:** tried; it had no effect, so it was reverted.
- **CSP:** enforce at launch, no nonces.
- **Structured data:** free shipping added; the return policy waits for the lawyer.
