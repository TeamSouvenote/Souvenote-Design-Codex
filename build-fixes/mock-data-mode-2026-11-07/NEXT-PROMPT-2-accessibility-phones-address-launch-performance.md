# Prompt 2: accessibility, phone pop-ups, address lines, launch readiness, performance and SEO

Run this after Prompt 1 **and Prompt 1B** (`NEXT-PROMPT-1B-build-my-card-and-personalize.md`) are finished. Copy everything below the line into a new chat. Since 2026-11-09 it covers Build My Card and Personalize a Template too.

---

You're continuing the site audit of the Souvenote web app (Next.js 15 App Router, React 19, TypeScript, mock-data mode) on the branch `mock-data-mode`, in `C:\Users\wilso\Desktop\Souvenote AWS DESIGN\frontend`.
- The audit's Phases A–D are done. Prompt 1 then covered the unopened screens, a production build, "Cookie settings" on the sign-in screens and the debug hooks.
- Prompt 1B ran the same checks on **Build My Card** (`/create/build-my-card`) and **Personalize a Template** (`/create/personalize-a-template`), including the owner's latest UX changes and new questions. Its findings are in `SITE-AUDIT-2026-11-08.md` §8.
- **Both flows are in scope for every part below.** Their files (`components/bmc/*`, `components/personalize/*`, `bmc-*.css`, `personalize.css`) may be changed after approval.
- This prompt covers everything that's left. Work in the parts below, in order.
- Each part **reports first and waits for my approval before changing anything**, unless it says otherwise.

## Read first (don't skip)
- `build-fixes/mock-data-mode-2026-11-07/SITE-AUDIT-2026-11-08.md`: the audit, its standards and its status.
- `build-fixes/mock-data-mode-2026-11-07/CHANGELOG.md`: read from "Site audit against the BMC / Personalize standard" to the end, including Prompt 1's section.
- `build-fixes/mock-data-mode-2026-11-07/NEXT-PROMPT-1-unopened-screens-build-cookie-debug.md`: its "Standards", "Tools and method" and "Rules" apply here word for word, **except the BMC/PT exclusion**. Follow them.
- `NEXT-PROMPT-1B-build-my-card-and-personalize.md`: the flows' inventory, their shared-file list, and the design-system sections for them (2.17–2.21).
- The design system: `design-system/docs/01-foundations.md`, `02-components.md` (2.13, 2.17–2.30), `06-governance.md` and `design-system/tokens/tokens.css`.
- `DEVELOPER_HANDOFF.md`: the backend contracts, including "Orders with several recipients (Scribeless)" and "Canada and the US".
- `REMAINING_SCREENS_BUILD_PROMPT.md` and `FAQ_AND_LEGAL_DRAFTS.md`: the owner decisions and the open legal items.
- My memory notes in `C:\Users\wilso\.claude\projects\C--Users-wilso-Desktop-Souvenote-AWS-DESIGN\memory\`.

## Part A: Accessibility pass (keyboard, reduced motion, high contrast, screen-reader semantics)
Scope: **every route, including Build My Card and Personalize a Template.** In the two flows, run the keyboard pass along one full path each: photo → Decorate → message → song → Create → Review, and Horoscope to Review. Include radio groups (arrow keys), the AI writer, the sign-off and "What should change?" rows, the genre step, the rights pop-up, the "Your card so far" sheet on phones, the Review decision buttons, and the Personalize gallery rows and suggestion band.
1. **Keyboard only, at 1280×720 and 375×812.** On every page and dialog, record:
   - the Tab order;
   - that every control is reachable and visibly focused (the focus ring is 2px `--l-focus`, or gold on forest);
   - that the skip link works;
   - that there are no keyboard traps outside dialogs.

   Check that menus (the hamburger), the nav hover popovers, the FAQ accordion, the scroll rows (Community Cards), the carousels (`/create`, Welcome) and every dialog work with Enter, Space, Escape and the arrow keys where expected.
2. **Screen-reader semantics, by script and from the accessibility tree** (`preview_snapshot`):
   - one `h1` per page and a logical heading order;
   - landmarks: header, nav, main, footer;
   - every control has a name;
   - live regions for errors and status;
   - `aria-pressed` and `aria-current` used correctly;
   - images have the right alt text (decorative ones `alt=""`).

   **A real screen-reader pass (NVDA or VoiceOver) can't be done here.** Write a short checklist I can run myself, and say so plainly.
3. **Reduced motion:** emulate `prefers-reduced-motion: reduce`. Check that the hero card stops, the vinyl doesn't spin, carousels and pop-ups don't animate, and nothing depends on motion.
4. **High contrast:** emulate `forced-colors: active`. Check that the logo, the selected states (chips, radio cards, settings list), the dialogs, the focus rings and the cookie banner stay visible.
5. **Hover and focus states:** for every interactive component on the in-scope pages, read the computed style in the `:hover` and `:focus-visible` states. Use the browser's state forcing, or add the classes in a test page only.
   - Hover is berry on ivory and gold on forest, with a 1px lift where the design system says so.
   - Nothing uses colours outside the design system, and no hover makes text fail contrast.

Report a ranked list (bug, inconsistency, polish; page and size; what's wrong; proposed fix), then wait for approval.

## Part B: Phone pop-ups taller than the screen (audit I4, phone half)
At 375×812, the Top up pop-up (cards about 1,330px, credits about 1,430px) and the checkout pop-up (about 1,260px) still stack their packs or summary, so the whole pop-up scrolls like a page. The larger sizes now fit one screen.
- Propose, with a sketch and measurements, how each could fit one phone screen. For example: one pack per screen with Previous/Next (as Build My Card does on phones), compact pack rows, or a collapsible summary.
- Keep every price, label and action. Wait for my approval, then build it in the pop-ups' own CSS only (`pricing.css` `.tu-overlay` rules, `checkout-flow.css` `.fd-checkout` rules). Re-measure at all four sizes.
- **The two flows' dialogs and sheets too:**
  - Build My Card's rights pop-up, sign-up, creating, spend, cards-or-credits choice and "Approve all three";
  - the "Your card so far" bottom sheet;
  - Personalize's equivalents.

  Measure each at 375×812 (and on short phones, 375×667). List any that are taller than the screen, and propose fixes in `bmc-dialogs.css` / `personalize.css` the same way.

## Part C: Separate address lines for Scribeless (audit B5 follow-up)
`components/Delivery.tsx` (`dlvPostalAddress`) joins address lines 1–3 into `PostalAddress.line1`. Scribeless's `POST /api/recipients` wants `address.address1`, `address2` and `address3` separately, plus `state` (required in Canada and the US) and a two-letter `country`.
- Propose the change:
  - `PostalAddress` gets `line2` (already typed but unused) and `line3`, plus optional `company` and `title`;
  - `dlvPostalAddress` maps them separately;
  - the mock order and the fulfilment payload keep them;
  - `DEVELOPER_HANDOFF.md`'s Scribeless field mapping is updated.
- Check saved recipients, the Delivery picker and older stored orders still read correctly.
- Wait for approval, then build it and verify an order with three address lines, and a company, through to "On its way".

## Part D: Launch-readiness checklist (document, no code)
Write `build-fixes/mock-data-mode-2026-11-07/LAUNCH-READINESS.md`: one checklist of everything that must happen before real customers. For each item give the owner, where it's recorded, and its status. Gather the items from the changelog, `DEVELOPER_HANDOFF.md`, `FAQ_AND_LEGAL_DRAFTS.md` and the audit. At least:
- **App switches:**
  - mock mode is on by default (`lib/mockMode.ts`, `NEXT_PUBLIC_MOCK_MODE=0`); it must be off before merging to `main`;
  - Cognito env placeholders `REPLACE_ME`;
  - real Google, Facebook and Apple sign-in.
- **Payments and tax:** Stripe Checkout/Elements, Stripe Tax for Canada and the US, Stripe promotion codes, receipts.
- **Printing and postage:**
  - Scribeless (`DEVELOPER_HANDOFF.md`): one campaign per order, recipients in one call, checkout, webhooks, no idempotency key, the product key for a folded 5×7 card, Canada enabled, cross-border postage;
  - the Delivery address-lines change (Part C).
- **Backend data:** the backend must read `recipients[]` on `POST /orders`; migration 008 (USD price lists) not yet run; card bank and credit balance on the backend; card message and song saved with the card.
- **AI services:** real Bedrock (Haiku 5.5), fal and Lyria; a printed QR code scan test on real phones.
- **Legal and content:**
  - legal pages are drafts, with an entity placeholder, lawyer items and the prepaid expiry question (12-month credit expiry);
  - FAQ answers marked draft;
  - Community Cards placeholder art and print files (`approved: false`).
- **Analytics:** PostHog not installed; the consent banner is ready.
- **Email:** the "posted" email and the support email address.
- **Owner approvals still pending:** deleting the retired files (governance "Retired files" list); the `.claude/launch.json` test entries are local only and never committed.

## Part E: Performance, SEO and security headers (report first)
Run these against a fresh production build in a temp copy (Prompt 1 and 1B's builds may be out of date). Don't run `next build` in `frontend/`.
1. **Lighthouse** (mobile and desktop) on `/`, `/home`, `/pricing`, `/community-cards`, `/faq`, `/cart`, `/create`, `/create/build-my-card` and `/create/personalize-a-template`: performance, accessibility, best practices, SEO. List the main opportunities.
   - **The two flows have the largest first-load JS in the app:** Personalize about 259 kB, Build My Card about 230 kB. Run a bundle analysis in the temp copy and propose reductions, for example lazy-loading the QR library, the dialogs, the card files and the question bank.
2. **CSS weight:**
   - Global stylesheets loaded on every page from `app/layout.tsx`: `colors_and_type.css`, `site.css` (about 780 lines), `opened-card.css`, `auth.css` (about 1,200 lines), `bmc.css` (about 235 lines, used only by the error modal in `BmcShared.tsx`), `cardart.css`, `landing-chrome.css`, `next-app.css`.
   - Since the CookieConsent change, `landing.css` also loads on every page.
   - Propose which could move to the routes that use them, and prove it with the fingerprint method before and after.
3. **Images:** sizes and formats of `public/assets/*`. Flag anything over about 300 kB, and check that `next/image` sizes and `priority` are sensible.
4. **SEO:**
   - per-route `metadata` (title, description, canonical);
   - `app/sitemap.ts` and robots;
   - `noindex` on sign-in and account pages;
   - OG/Twitter images (`opengraph-image.tsx`);
   - structured data (FAQ and pricing JSON-LD) checked against Google's rules;
   - the 404 status on unknown addresses.
5. **Security headers:** check `next.config.mjs` for Content-Security-Policy, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy and frame-ancestors. Propose a CSP that allows only what the app uses: Google Fonts if any, Cognito, Stripe, the asset storage and PostHog later.

Report a ranked list with proposed fixes and wait for my approval before changing anything.

## Part F: Real devices (checklist for me)
Browser emulation isn't a real phone. Write a short checklist for me to run on a real iPhone (Safari) and Android phone (Chrome) and on an iPad:
- the safe-area insets;
- the 100dvh one-screen layouts;
- the sticky nav and action bars;
- the keyboard covering fields (Delivery, Contact, Settings);
- the QR code scan;
- Apple Pay and Google Pay buttons;
- touch targets;
- the cookie banner above the home indicator;
- **Build My Card and Personalize:**
  - adding photos from the camera roll and the camera (HEIC on iPhone, large files);
  - the drop zone on a tablet;
  - the one-section-per-screen phone steps and "Your card so far" sheet;
  - the rights pop-up's checkboxes;
  - the scroll rows (swipe) and the date selects (the native pickers);
  - typing a long message with the keyboard open;
  - the song preview playing on iOS.

## Rules (the same as Prompt 1)
- Build My Card and Personalize a Template are in scope. Changes to them, like everything else, wait for approval.
- **Shared with the rest of the app: tell me before changing them:** `flow/FlowDialog.tsx`, `flow/FlowField.tsx`, `flow/TopUpChoiceDialog.tsx`, `personalize/PtScrollRow.tsx` (Community Cards), `CartPage.tsx`, `lib/api.ts`, `lib/mockApi.ts`, `landing.css`, `layout.tsx`, `RouteFocus.tsx`.
- **Prompts and catalogues:** the code is the source of truth (`bmc/prompts.ts`, `bmc/catalog.ts`, `personalize/ptPrompts.ts`, the card files). Bump their version constants with any wording change.
- Never delete files.
- Use a fresh temp copy and temp folders; back up files before scripted rewrites.
- Check file times for other sessions; never run `next build` in `frontend/`.
- Log every change in the CHANGELOG (request, what changed, files, verified, not covered). Update `SITE-AUDIT-2026-11-08.md` and the design-system docs, with a governance version entry, when a UI pattern changes.
- Don't commit or push until I say so.
- Report honestly what you couldn't check.

## Deliver
For each part:
- the findings or the document;
- my decisions needed, as short questions;
- then the approved fixes, verified at 1280×720, 1024×768, 768×1024 and 375×812.

End with a recap of what changed, what was verified, what wasn't, and what's still open.
