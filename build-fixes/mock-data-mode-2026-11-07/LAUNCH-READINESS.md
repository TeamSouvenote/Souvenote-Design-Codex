# Launch readiness: before real customers use Souvenote

**Date:** 2026-11-09, updated the same day for Build My Card and Personalize a Template (Prompt 2, flows). **Branch:** `mock-data-mode` (Next.js 15).

This is one checklist of everything that must happen before real customers use the web app. Today the app runs in mock data mode: every backend and Cognito call is answered in the browser from a localStorage "database", so nothing here has been tried against real services.

**How to use it:**
- Each row is one thing to do, with who does it, where it's recorded, and its status on 2026-11-09.
- Owners: **Owner** is the business owner; **Backend dev**, **Lawyer** and **Designer** as named. "Provider" items are checked by the owner with that provider.
- When an item is done, change its status here and log it in `CHANGELOG.md`, as for any other change.
- "Before merging to main" at the end lists the hard gates.
- Gathered from the changelog, `DEVELOPER_HANDOFF.md`, `FAQ_AND_LEGAL_DRAFTS.md`, the site audit, the two Bedrock hand-offs, governance and the code. Documentation only: no code was changed.

---

## 1. App switches

| # | Item | Owner | Where it's recorded | Status |
|---|---|---|---|---|
| 1.1 | Mock data mode is on by default: `MOCK_MODE` is true unless `NEXT_PUBLIC_MOCK_MODE` is `0` or `false`, and neither `frontend/.env.local` nor `.env.example` sets it. It must be off (or the default flipped) before this branch is merged to `main`. | Backend dev | `frontend/app/lib/mockMode.ts` (header comment) | Not started |
| 1.2 | With mock mode off, the Mock data badge, the demo account (`demo@souvenote.com`), the fixed two-step code and `__souvResetMockData` must not reach customers. Check they all hide behind `MOCK_MODE`. | Backend dev | `mockMode.ts`; CHANGELOG "Audit follow-up: unopened screens…" (Task 9) | Done in frontend, backend pending (badge hook gated; needs a check with mock mode off) |
| 1.3 | Cognito settings: `NEXT_PUBLIC_COGNITO_REGION`, `_USER_POOL_ID`, `_CLIENT_ID`, `_DOMAIN`, `_REDIRECT_URI`, `_LOGOUT_URI` (and `_OAUTH_SCOPES`, `NEXT_PUBLIC_API_BASE_URL`). The memory note says they are still `REPLACE_ME`, but on 2026-11-09 no env file contains `REPLACE_ME` and all six Cognito names in `frontend/.env.local` have values. Confirm they point at the production pool, and set them in the hosting environment. | Backend dev | `frontend/.env.example`, `frontend/.env.local`; `DEVELOPER_HANDOFF.md` "Cognito settings the frontend now depends on" | In progress (local values set; production values not confirmed) |
| 1.4 | Real Google, Facebook and Apple sign-in: configure the three identity providers and enable them on the app client (the hosted UI answered "Login option is not available" in the 2026-11-02 test). The buttons show anyway, by the owner's choice. | Backend dev | `DEVELOPER_HANDOFF.md` "Cognito settings…" (Social sign-in) | Not started |
| 1.5 | Cognito pool settings the copy relies on: verification by code, password minimum 12, 30-day refresh token, 24-hour codes, TOTP-only optional MFA, email recovery, remembered devices off. | Backend dev | `DEVELOPER_HANDOFF.md` "Cognito settings…" | Not started |
| 1.6 | Backend `.env` has `AI_MOCK_MODE=true` and empty `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SCRIBELESS_API_KEY`, `AWS_S3_BUCKET_NAME`, `SENDGRID_API_KEY`, `POSTHOG_API_KEY` and `SENTRY_DSN`. Each needs a production value (or a decision that it isn't used). | Backend dev | `backend/server/.env` and `.env.example` (names only checked) | Not started |
| 1.7 | Staging and preview deploys must stay out of search. Done in the frontend (audit E7, 2026-11-09): `SITE_URL` comes from `NEXT_PUBLIC_SITE_URL` (default `https://souvenote.com`), and only that production origin is indexable (`SITE_INDEXABLE`). Anywhere else, `robots.txt` disallows everything and every response sends `X-Robots-Tag: noindex, nofollow`. **Each staging/preview deploy must set `NEXT_PUBLIC_SITE_URL` to its own address** (or `NEXT_PUBLIC_ALLOW_INDEXING=false`). | Backend dev | `frontend/app/lib/site.ts`, `app/robots.ts`, `next.config.mjs`; PROMPT-2-REPORT E7 | Done in frontend; env vars per deploy pending |
| 1.8 | Backend CORS allows any origin (`origin: true`). Limit it to the real frontend origins. | Backend dev | `DEVELOPER_HANDOFF.md` "Before deploying"; `backend/server/src/main.ts` | Not started |

## 2. Payments and tax

| # | Item | Owner | Where it's recorded | Status |
|---|---|---|---|---|
| 2.1 | Real Stripe Checkout/Elements. The payment pop-up is a mock: `Checkout.tsx` waits about 1.3 s and calls `onPaid`. "Payments secured by Stripe" isn't true until this is built. | Backend dev | `DEVELOPER_HANDOFF.md` "Cart / Delivery fixes", Backend gaps 1 | Not started |
| 2.2 | Create the Stripe session in the account's currency (CAD or USD) with the matching `offerCode` (`print_and_send` / `print_and_send_usd`), priced per card as in the order contract. | Backend dev | `DEVELOPER_HANDOFF.md` "Canada and the US" (Cart) and "Orders with several recipients (Scribeless)" (Price) | Done in frontend, backend pending |
| 2.3 | Stripe Tax for Canada and the US. Today's "Estimated tax" uses placeholder rates (CA 5%, US 7%) in `lib/taxEstimate.ts`; replace it with Stripe Tax's amount, and complete the tax registrations Stripe Tax flags. | Backend dev, Owner | `DEVELOPER_HANDOFF.md` "Canada and the US" (Tax), Backend gaps 7; `FAQ_AND_LEGAL_DRAFTS.md` §8 Provider | Not started |
| 2.4 | Promo codes as Stripe promotion codes checked on the server: replace `lookupPromo` in `lib/promo.ts` with a backend call and send the applied code with the checkout. | Backend dev | `DEVELOPER_HANDOFF.md` Backend gaps 2 | Not started |
| 2.5 | Receipt email after payment. The copy "A receipt is on its way to your inbox" was kept by the owner but isn't true yet. | Backend dev | `DEVELOPER_HANDOFF.md` Backend gaps 1 | Not started |
| 2.6 | Apple Pay and Google Pay in Stripe (domain verification and wallet setup), then tried on real phones. | Owner, Backend dev | `FAQ_AND_LEGAL_DRAFTS.md` §8 Provider; `NEXT-PROMPT-2…` Part F | Not started |
| 2.7 | Retire Try Risk-Free as the default offer in `orders.service.ts` and `checkout.service.ts` (still `try_risk_free_one_card`). Migration 008 turns the row off. | Backend dev | `DEVELOPER_HANDOFF.md` "Backend follow-ups" 3 | Not started |
| 2.8 | Checkout and cart still price from frontend constants (`pricingCatalog.ts` / `priceLists.ts`). Read prices from the backend catalog, and keep them equal until then. | Backend dev | `DEVELOPER_HANDOFF.md` "Backend follow-ups" 2 | Not started |
| 2.9 | Refunds: unused top-ups and packs are refundable within 14 days. The backend needs the refund path (Stripe refund and removing the unspent credits or cards). | Backend dev | CHANGELOG "Owner decisions round, 2026-11-08"; `FAQ_AND_LEGAL_DRAFTS.md` §2 items 8, 10 and §6 | Not started |
| 2.10 | Raw backend error messages (for example "Checkout response did not include a checkout session and order.") need customer wording before launch. | Backend dev | `DEVELOPER_HANDOFF.md` "Cart / Delivery fixes", Backend gaps 10 | Not started |

## 3. Printing and postage (Scribeless)

| # | Item | Owner | Where it's recorded | Status |
|---|---|---|---|---|
| 3.1 | One order is one Scribeless one-time campaign (`POST /api/campaigns`). Store the campaign ID on the order before anything else. | Backend dev | `DEVELOPER_HANDOFF.md` "Orders with several recipients (Scribeless)", step 1 | Not started |
| 3.2 | Add every recipient in one array call (`POST /api/recipients`, `data: [...]`), one entry per copy, with `variables.externalId` set to our order-recipient ID. Store every returned recipient ID. | Backend dev | Same section, step 2 | Not started |
| 3.3 | Pay the campaign with `POST /api/recipients/checkout` (one-time accounts). A paid campaign can't take more recipients. | Backend dev | Same section, step 3 | Not started |
| 3.4 | Webhooks for the recipient lifecycle move the order to sent or posted and trigger the "posted" email (see 8.1). | Backend dev | Same section, step 4 | Not started |
| 3.5 | Scribeless has no idempotency key: never repeat steps 1 or 2 for an order. Keep the campaign and recipient IDs and resume from the first missing step; never re-upload on a retry. | Backend dev | Same section, "Retries"; `SITE-AUDIT-2026-11-08.md` §5 (B5) | Not started (frontend already reuses a pending order on retry) |
| 3.6 | In the Scribeless account, confirm: the product key for the folded 5×7 card with envelope; one-time or subscription account; recurring campaigns and `externalId` upsert; where the handwritten inside message goes; the QR and attachment features. | Owner | Same section, "To confirm in the Scribeless account" | Not started |
| 3.7 | Confirm Canada is enabled as a destination on the account. | Owner | Same section, "To confirm…" | Not started |
| 3.8 | Cross-border postage: confirm US↔Canada cards go out from the destination's facility at domestic rates. `CROSS_BORDER_POSTAGE` is $0 both ways until then. | Owner | `DEVELOPER_HANDOFF.md` "Canada and the US"; `FAQ_AND_LEGAL_DRAFTS.md` §2 item 17 | Blocked on Scribeless confirming rates |
| 3.9 | Separate address lines: `PostalAddress` now carries `firstName`, `lastName`, `title`, `company`, `line1–3` separately. `dlvPostalAddress` maps each field, and the mock fulfilment payload has the exact Scribeless `data[]` shape (`scribelessRecipient()`). The backend must map them as in the handoff table (older orders: split `name`, `address2/3` empty) and confirm the template's company field. | Backend dev | `lib/api.ts`, `components/Delivery.tsx`, `lib/mockApi.ts`; `DEVELOPER_HANDOFF.md` "Orders with several recipients (Scribeless)" | Done in frontend, backend pending |
| 3.10 | Printer's bleed and safe area: the image prompt uses a provisional 6% inset (`PRINT_PROFILE` in `compile.ts`) until confirmed. | Owner | `BMC-BEDROCK-HANDOFF.md` "Print and QR" | Not started |
| 3.11 | Mail-out date and "Send now" / "Schedule" sent with the order, and a real arrival estimate from Scribeless (none is shown until then). | Backend dev, Owner | `DEVELOPER_HANDOFF.md` Backend gaps 8; `FAQ_AND_LEGAL_DRAFTS.md` §8 Provider | Not started |

## 4. Backend data

| # | Item | Owner | Where it's recorded | Status |
|---|---|---|---|---|
| 4.1 | `POST /orders` must read `recipients[]` (address and quantity). Until it does, only the first address is mailed. Then drop the transitional `recipientAddress` from `createOrder`. | Backend dev | `DEVELOPER_HANDOFF.md` "Orders with several recipients (Scribeless)", Frontend contract; CHANGELOG same heading, Not covered | Done in frontend, backend pending |
| 4.2 | Migration 008 (`008_canada_us_price_lists.sql`, USD price lists, credit packs in both currencies, Big Sender marked `cad`, Try Risk-Free off). Approved as a file on 2026-11-08; not run anywhere. Safe to re-run. | Backend dev | `DEVELOPER_HANDOFF.md` "Before deploying"; CHANGELOG "Remaining screens, Phase 5" | Not started (file exists in `backend/database/migrations/`) |
| 4.3 | Run migrations 004 (sign-in breaks without it), 005, 006 and 007 on the production database too; 007 has not been run on any database. | Backend dev | `DEVELOPER_HANDOFF.md` "Before deploying"; "Pricing copy + Print and Send credits" | Not started |
| 4.4 | Card bank and credit balance held on the backend, with a ledger and 12-month expiry. Today the card bank is `DemoBalance` in localStorage (`souv_demo_balance`), which a customer can change; the out-of-cards check stays off (`CARD_BALANCE_CHECK_ENABLED = false` in `Delivery.tsx`) until this exists. | Backend dev | `DEVELOPER_HANDOFF.md` "Backend follow-ups" 5 and Backend gaps 5 | Not started |
| 4.5 | Card message and song saved with the card draft, and real image addresses (generation returns `mock://`). | Backend dev | `DEVELOPER_HANDOFF.md` Backend gaps 6 | Not started |
| 4.6 | Profile update accepts `country` and `currency` at sign-up and on the terms step, and refuses later client changes. | Backend dev | `DEVELOPER_HANDOFF.md` "Canada and the US" | Not started |
| 4.7 | Routes the frontend calls only in mock today: `POST /community-cards/drafts`, `POST /support/messages`, `POST /attestations`, saved recipients (`/recipients`), `DELETE /card-drafts/:id`, `DELETE /auth/me`, `last_saved_edit_at`. All must check ownership from the token. | Backend dev | `DEVELOPER_HANDOFF.md` "Not built yet (backend)" | Not started |
| 4.8 | Account recovery (`/recover`) has a screen but no backend. | Backend dev | `DEVELOPER_HANDOFF.md` "Not built yet (backend)"; `backend/docs/account-recovery-spec.md` | Not started |
| 4.9 | Big Sender: make the last tier open-ended (seed still stores `card_count_max = 30`) and accept any quantity of 2 or more. | Backend dev | `DEVELOPER_HANDOFF.md` "Backend follow-ups" 1, 7 | Not started |
| 4.10 | Real photo upload with signed URLs (the frontend still sends only file metadata to `/uploads/mock`). | Backend dev | `BMC-BEDROCK-HANDOFF.md` "Photos" | Not started |
| 4.11 | The photo-consent record from the questionnaires carries no `cardDraftId` yet (`onAgree(record)` is received but unused). | Backend dev | `DEVELOPER_HANDOFF.md` "Photo-consent records"; CHANGELOG "Remaining screens" (Upload rights pop-up, Not touched) | Not started |

## 5. AI services

| # | Item | Owner | Where it's recorded | Status |
|---|---|---|---|---|
| 5.1 | Real Bedrock for Build My Card: Claude Haiku 5.5 (`HAIKU_MODEL_ID = "global.anthropic.claude-haiku-5-5"` in `bmc/prompts.ts`), Converse with structured output, for the interviewer and inside message. Replaces `lib/mockInterview.ts`. | Backend dev | `BMC-BEDROCK-HANDOFF.md` "Routes…", "Interviewer" | Not started |
| 5.2 | Choose the models for caption, genre recommendation and lyrics ("Not yet chosen"). | Owner, Backend dev | `BMC-BEDROCK-HANDOFF.md` "Routes…" table | Not started |
| 5.3 | Real Bedrock for Personalize a Template (interview, suggestions, comic storyboard, template suggestions). On This Day research also needs a web-search tool on the backend. Replaces `lib/mockPersonalize.ts`. | Backend dev | `PERSONALIZE-BEDROCK-HANDOFF.md` §1–5 | Not started |
| 5.4 | Generation: add optional `parts` to `StartGenerationDto` (the live DTO rejects unknown fields), stop creating a `message` asset for Build My Card, then remove the `MOCK_MODE` condition around `parts`. | Backend dev | `BMC-BEDROCK-HANDOFF.md` "Generation (one backend change needed)" | Not started |
| 5.5 | Real image generation with fal (`fal-ai/gpt-image-2.5-flare/edit`, up to 16 reference photos). | Backend dev | `BMC-BEDROCK-HANDOFF.md` "Photos"; CHANGELOG line "Not covered: real Bedrock, fal and Lyria calls" | Not started |
| 5.6 | Real music generation with Lyria. | Backend dev | CHANGELOG Build My Card rebuild, "Not covered: real Bedrock, fal and Lyria calls" | Not started |
| 5.7 | The QR code must point at the stable, app-owned song page, then be test-printed and scanned on iPhone Safari and Android Chrome. | Owner, Backend dev | `BMC-BEDROCK-HANDOFF.md` "Print and QR"; `NEXT-PROMPT-2…` Part F | Not started |
| 5.8 | Prompts come from `bmc/prompts.ts` and `bmc/catalog.ts`, not the old reference documents, which are out of date. | Backend dev | `reference-materials/Build My Card/OUT-OF-DATE.md` | Done in frontend, backend pending |
| 5.9 | Confirm each AI provider's data-use and training terms before the Privacy Policy says customer content isn't used for training. | Owner, Lawyer | `FAQ_AND_LEGAL_DRAFTS.md` §4 `[LAWYER/PROVIDER]`, §8 Lawyer 6 | Not started |
| 5.10 | **Don't trust prompts built in the browser.** The browser builds `compiledImagePrompt` and `compiledMusicPrompt` (`bmc/compile.ts`) and freezes them in `creative_brief.control.generation`. The backend must rebuild them from the brief with its own copy of `prompts.ts` / `catalog.ts` (or check them against it) and never pass browser text straight to fal or Lyria; otherwise anyone can edit the request and generate anything on Souvenote's account, outside the content rules. | Backend dev | `BMC-BEDROCK-HANDOFF.md` "Frozen snapshot"; `PROMPT-2B-REPORT-2026-11-09.md` Part E | Not started |
| 5.11 | **Song player on Review:** Review says "A player appears here once real audio is connected." When the player lands, check it has named Play/Pause controls, a time read-out, no autoplay, and plays on iOS Safari after a tap (the device checklist has the steps). | Backend dev, Designer | `bmc/BmcReviewStage.tsx`; `DEVICE-AND-SCREEN-READER-CHECKLIST.md` Part 3 | Not started |

## 6. Legal and content

| # | Item | Owner | Where it's recorded | Status |
|---|---|---|---|---|
| 6.1 | All four legal pages (Privacy, Terms, Refund, Cookie) are `status: "draft"` in `components/legal/legalDocs.ts`, showing a draft notice. They need lawyer review (Canada (BC) and US) and owner approval. | Lawyer, Owner | `FAQ_AND_LEGAL_DRAFTS.md` Status and §8 Lawyer checklist; CHANGELOG "Legal pages" | Blocked on lawyer review |
| 6.2 | Legal entity placeholder: Souvenote isn't incorporated, so `[NEEDS OWNER: legal entity]` stays in the Privacy Policy and Terms. The policies can't go live until the business is registered (BC) and the name and address are filled in. | Owner | `FAQ_AND_LEGAL_DRAFTS.md` §2 item 16, §8 Owner | Blocked on incorporation |
| 6.3 | Prepaid expiry question (high priority): the owner set a 12-month expiry for credits and unused Big Sender cards, and the 12-month send window. The lawyer must confirm this is allowed under provincial and state gift-card and prepaid rules before it's published. | Lawyer | `FAQ_AND_LEGAL_DRAFTS.md` §2 item 13, §8 Lawyer 1; audit B13 | Blocked on lawyer review |
| 6.4 | Other lawyer items: data outside Canada and US state privacy laws (item 14), US consumer terms and governing law (item 15), cookie consent for Quebec and US states, CASL/CAN-SPAM transactional emails, AI output and IP rights, the attestation as clickwrap (Quebec CCQ 1435), age of majority, tax wording. | Lawyer | `FAQ_AND_LEGAL_DRAFTS.md` §2 items 14–15, §8 Lawyer 2–9 | Blocked on lawyer review |
| 6.5 | When approved, update the legal dates in `lib/legalVersions.ts` (held at June 1, 2026) and the attestation version (`photo-consent-2026-11-08-draft`). Bumping dates doesn't re-prompt anyone for Terms. | Owner, Backend dev | CHANGELOG "Legal pages" (Dates) and "Upload rights pop-up"; `DEVELOPER_HANDOFF.md` "How the new auth behaviour works" | Not started |
| 6.6 | FAQ answers: 27 of 29 entries in `faq/faqData.ts` are `status: "draft"` until the owner approves them. | Owner | `frontend/app/components/faq/faqData.ts` header; `FAQ_AND_LEGAL_DRAFTS.md` §3 | Not started |
| 6.7 | Community Cards: all 58 cards are `approved: false` and use the logo placeholder (`/assets/mock-card-front.png`). Each needs approved, print-ready, cleared artwork and a real print file. | Designer, Owner | `DEVELOPER_HANDOFF.md` "Not built yet" (Community Cards, Launch blocker); `components/community/catalog.ts` | Not started |
| 6.8 | Personalize template configuration (per-template concept, style, photo use, questions, music) and the templates proposed as not launch-ready, waiting for owner approval. | Owner | `PERSONALIZE-TEMPLATE-CONFIG-PROPOSAL.md`; CHANGELOG line "Waiting for owner approval before any code changes" | Proposed |

## 7. Analytics

| # | Item | Owner | Where it's recorded | Status |
|---|---|---|---|---|
| 7.1 | PostHog isn't installed (owner: add it once there's an account). Install `posthog-js`, set `NEXT_PUBLIC_POSTHOG_KEY`, initialise only where `analyticsAllowed()` is true, and call `opt_out_capturing()` on "declined". | Owner (account), Backend dev | `frontend/app/lib/analytics.ts`; `DEVELOPER_HANDOFF.md` "Analytics (PostHog)" | Not started |
| 7.2 | The consent banner is ready: analytics stay off until the visitor presses Accept (`souv_cookie_consent`, "Cookie settings" in both footers). | Backend dev | `lib/consent.ts`, `content/CookieConsent.tsx`; CHANGELOG "Cookie banner" | Done in frontend, backend pending (PostHog to be wired) |
| 7.3 | Never capture card text, messages, recipients, photos or songs. Fill in the PostHog cookie names and lifetime in the Cookie Policy. | Backend dev, Owner | `DEVELOPER_HANDOFF.md` "Analytics (PostHog)"; `FAQ_AND_LEGAL_DRAFTS.md` §7 and §8 Provider | Not started |

## 8. Email

| # | Item | Owner | Where it's recorded | Status |
|---|---|---|---|---|
| 8.1 | The "posted" email: the confirmation says "you'll get an email when they're posted", but nothing sends it. It should come from the Scribeless webhooks (3.4). | Backend dev | `DEVELOPER_HANDOFF.md` Backend gaps 9; `DeliveryConfirmation.tsx`; CHANGELOG "Orders with several recipients (Scribeless)" | Not started |
| 8.2 | Order confirmation and receipt emails (Delivery says "email you an order confirmation"; see 2.5). Choose and set up the email provider (backend `.env` has an empty `SENDGRID_API_KEY`). | Backend dev, Owner | CHANGELOG "Remaining screens, Phase 5" (Postage copy); `DEVELOPER_HANDOFF.md` Backend gaps 1 | Not started |
| 8.3 | Support email: `SUPPORT_EMAIL` is `cameron@souvenote.com` (owner decision 2026-11-08), used by Contact, FAQ, the legal pages, the attestation and account screens. Make sure that inbox is live and monitored. | Owner | `frontend/app/lib/support.ts` | Done in frontend, backend pending |
| 8.4 | Contact form messages (`POST /support/messages`) must be delivered to that inbox and kept for follow-up; no email provider is wired. | Backend dev | `DEVELOPER_HANDOFF.md` "Contact messages" | Not started |

## 9. Owner approvals pending

| # | Item | Owner | Where it's recorded | Status |
|---|---|---|---|---|
| 9.1 | Delete the retired files: `styles/options.css`, `components/DemoLibrary.ts`, `components/createFlowRules.ts`, `public/assets/hero-souvenote-card-face.png`, `public/assets/logomark-gold.png`. Nothing imports them. | Owner | `design-system/docs/06-governance.md` "Retired files"; CHANGELOG "Site audit Phase B" (Owner) | Blocked on owner approval |
| 9.2 | The `.claude/launch.json` test entries (`frontend-audit2-copy`, `frontend-p1audit-copy`, `frontend-p2-prod`, `frontend-p1b-copy`, `frontend-p1b-prod`, `frontend-p2b-copy`, `frontend-p2b-prod`, and other sessions' `frontend-community-share-copy` and `waitlist-site-prod`) are local only and must never be committed. `.gitignore` has no `.claude` line, so take care at commit time. | Owner | CHANGELOG "Site audit…" and "Audit follow-up…" (Local only) | Open (every commit) |
| 9.3 | The batch commit and push of this branch's work, waiting for the owner's say-so. Keep `reference-materials/` and `saved-ui/` out of commits (they're git-ignored). | Owner | `DEVELOPER_HANDOFF.md` "Before merging"; session changelog rule | Blocked on owner approval |
| 9.4 | Audit O5 (script words in the Community send titles) and O6 (routes over about 200 kB first-load JS) were not chosen and are still open. | Owner | `SITE-AUDIT-2026-11-08.md` §7 "Owner decisions on the open items" | Open (not chosen) |
| 9.5 | Phone pop-ups taller than the screen. Top up and checkout fit 375×812 since Prompt 2 (built 2026-11-09). On a short phone (375×667) Top up cards (728–770px), Top up credits (745), checkout (777), both "Top up to…" choices (664 / 718), and the rights pop-up's first screen (712) still scroll. | Owner, Designer | `PROMPT-2B-REPORT-2026-11-09.md` Part B | Mostly done 2026-11-09: both "Top up to…" choices and the rights pop-up fit 375×667; Top up and Checkout keep a short scroll there (owner: accepted) |

## 10. Accessibility, devices and performance

| # | Item | Owner | Where it's recorded | Status |
|---|---|---|---|---|
| 10.1 | Close or accept the audit's open items (O6, short-phone pop-ups; see section 9) and the Prompt 2 flow findings (`PROMPT-2B-REPORT-2026-11-09.md`). | Owner | `SITE-AUDIT-2026-11-08.md` §5–8 | Open |
| 10.2 | A real screen-reader pass (NVDA or VoiceOver). Every round so far lists it as not covered; a checklist is being written separately. | Owner | `SITE-AUDIT-2026-11-08.md` §6–7 Not covered; `NEXT-PROMPT-2…` Part A | Not started |
| 10.3 | Keyboard-only, reduced motion and Windows high contrast. Scripted keyboard, reduced-motion and CSS-level high-contrast checks are done for every route (Prompt 2) and for Build My Card and Personalize (Prompt 2, flows). Still to do: a real keyboard run in Safari and Firefox, and Windows high contrast on a real machine (the test pane can't emulate forced colours). | Owner | `PROMPT-2-REPORT-2026-11-09.md` and `PROMPT-2B-REPORT-2026-11-09.md` Part A | Partly done |
| 10.4 | A real-device pass on iPhone Safari, Android Chrome and iPad: safe areas, 100dvh layouts, sticky bars, the keyboard over fields, QR scan, wallet buttons, touch targets, the cookie banner. A checklist is being written separately. | Owner | `NEXT-PROMPT-2…` Part F; audit §6 | Not started |
| 10.5 | Performance, SEO and security headers (audit Part E, built 2026-11-09). Headers are set in `next.config.mjs`: nosniff, Referrer-Policy, X-Frame-Options SAMEORIGIN with `frame-ancestors 'self'`, Permissions-Policy, COOP, HSTS in production, no X-Powered-By. The CSP is report-only for now. **Before launch:** read the CSP reports; add Stripe, PostHog and the asset origin (`NEXT_PUBLIC_ASSET_ORIGIN`); switch to enforcing; decide on nonces (they make every page dynamic); set the same headers on any CDN. Also done: Google Fonts import removed, route-only CSS moved, images resized, AVIF on, structured data, icons, static share image. | Backend dev, Owner | `next.config.mjs`; PROMPT-2-REPORT-2026-11-09.md Part E | Done in frontend; **owner, 2026-11-09: enforce at launch**, no nonces |
| 10.6 | Safari behaviour for the cookie-settings opener (F8) and Delete account's failure paths (F7) were checked in code only. | Owner | `SITE-AUDIT-2026-11-08.md` §7 Not covered | Not started |
| 10.7 | **Phone layout shift in the two flows:** the server sends Build My Card and Personalize with an almost empty `<main>`, so the footer paints near the top and jumps down when the flow loads (Lighthouse mobile CLS 0.665 and 0.728, "poor"). | Owner, Designer | `PROMPT-2B-REPORT-2026-11-09.md` Part E | Done 2026-11-09: the flows reserve a screen height; mobile CLS 0 (perf 87 / 89) |
| 10.8 | **Mock code in the production bundle:** even with `NEXT_PUBLIC_MOCK_MODE=0`, the chunk every page loads carries `mockApi`, `mockInterview`, `mockPersonalize`, `mockDb`, the Build My Card catalogue, question bank, engine and prompts (about 32 kB gzipped), because `lib/api.ts` imports the mocks statically. The demo e-mail and password strings ship too (`mockMode.ts` via the Mock data badge). Load the mocks with `import()` only in mock mode, or swap them out at build time. | Backend dev, Owner | `PROMPT-2B-REPORT-2026-11-09.md` Part E (build with mock mode off) | Done 2026-11-09: mocks load with `import()` only in mock mode; the shared chunk is 42.9 → 12.9 kB; with mock mode off no page's first load has mock code or the demo login (they remain as lazy files that load only in mock mode) |

---

## Before merging to main

1. Mock data mode off by default for `main` (1.1), with the demo account, badge and fixed codes unreachable (1.2).
2. Production Cognito settings and pool configuration confirmed (1.3, 1.5); social buttons either working (1.4) or a recorded owner decision to keep them.
3. Migrations 004–008 run on the target database (4.2, 4.3), and `POST /orders` reads `recipients[]` (4.1).
4. Real Stripe payments with Stripe Tax and receipts (2.1–2.5); the card bank and credits on the backend (4.4).
5. Scribeless wired end to end (3.1–3.7), with the address-lines change decided (3.9).
6. Legal pages approved by the lawyer, the entity filled in after incorporation, and the expiry question answered (6.1–6.4).
7. Community Cards art and print files approved (6.7), or the page held back.
8. `.claude/launch.json` test entries left out of the commit (9.2), and the owner's go-ahead for the commit and push (9.3).
9. The backend rebuilds or checks the image and music prompts itself instead of trusting the browser's (5.10), and the mock modules are out of the production bundle (10.8).
