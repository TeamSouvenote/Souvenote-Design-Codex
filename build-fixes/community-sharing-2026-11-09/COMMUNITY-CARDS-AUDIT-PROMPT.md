# Community Cards audit plan (prompt)

Copy everything below the line into a new chat. Run it **after** the community-sharing work in `build-fixes/community-sharing-2026-11-09/CHANGELOG.md` has stopped changing. Its session was still editing on 2026-11-09 at 16:14.

---

You're auditing the **Community Cards** section of the Souvenote web app (Next.js 15 App Router, React 19, TypeScript, mock-data mode), branch `mock-data-mode`, in `C:\Users\wilso\Desktop\Souvenote AWS DESIGN\frontend`.
- The rest of the site was audited and fixed on 2026-11-08 and 09 (site audit, Prompts 1, 1B and 2).
- Since then Community Cards has gained a lot. Check all of it against the standards the rest of the app meets: the gallery, the share and send pop-ups, the guidelines, community mode in Build My Card, and how Community cards flow into Delivery and Saved Cards & Songs.
- Report a ranked list first, then fix what I approve.

## Read first (don't skip)
- `build-fixes/community-sharing-2026-11-09/CHANGELOG.md`: everything built today, sections 1–9 plus "Not done". It's the main source for what's new.
- `build-fixes/mock-data-mode-2026-11-07/SITE-AUDIT-2026-11-08.md`: the standards, method and status, §1–8 and any later sections.
- `build-fixes/mock-data-mode-2026-11-07/CHANGELOG.md`: "Remaining screens, Phase 4: Community Cards catalog", "Orders with several recipients", the audit phases A–D, the Prompt 1, 1B and 2 sections, and anything mentioning Community Cards (the `?card=` fix B9, the double-press guard B8, the chips and dots I2, the facts grid I13, the send pop-up on phones I4, the scroll-row arrows, Community send titles O5, and the long-name fixes).
- The previous prompts in `build-fixes/mock-data-mode-2026-11-07/`: `NEXT-PROMPT-1-unopened-screens-build-cookie-debug.md`, `NEXT-PROMPT-1B-build-my-card-and-personalize.md` and `NEXT-PROMPT-2-accessibility-phones-address-launch-performance.md`. Their "Standards", "Tools and method" and "Rules" apply here word for word.
- The design system:
  - `design-system/docs/01-foundations.md`, including the "no eyebrow above a page heading" rule;
  - `02-components.md`: **2.25 Community Cards** first, then 2.13, 2.17–2.21 (Build My Card), and 2.22–2.31;
  - `06-governance.md` and `design-system/tokens/tokens.css`.
- `DEVELOPER_HANDOFF.md`: the Community Cards catalog, `POST /community-cards/drafts`, the submissions and Share contract, and what's still to build.
- `FAQ_AND_LEGAL_DRAFTS.md` and `components/legal/legalDocs.ts`: Terms §5 and §6 now cover shared cards.
- My memory notes in `C:\Users\wilso\.claude\projects\C--Users-wilso-Desktop-Souvenote-AWS-DESIGN\memory\`, especially `crlf-and-shared-dev-server.md` and `prompts-code-is-source-of-truth.md`.

## Step 0: inventory
- **Files and changes:** list every file in scope with a one-line purpose, and what changed since 2026-11-09 morning (`git diff --stat HEAD`, file modification times, the community-sharing changelog):
  - `components/community/`: `CommunityGallery.tsx`, `CommunitySendDialog.tsx`, `CommunityShare.tsx`, `CommunitySubmit.tsx`, `catalog.ts`, `communityGuidelines.ts`;
  - `community-cards/page.tsx` and `styles/community-cards.css`;
  - `personalize/PtScrollRow.tsx` (shared);
  - community mode in Build My Card: `bmc/community.ts`, `BuildMyCardClient.tsx`, `create/build-my-card/page.tsx`, `bmc/BmcPageHeading.tsx`, and the community branches in `BmcQuestion.tsx`, `BmcQuestionnaire.tsx`, `BmcSummary.tsx` and `lookDetails.ts`;
  - `delivery/deliverySource.ts` (the `community` source), and Community handling in `Delivery.tsx`, `DeliveryKeepsake.tsx` and `MyCards.tsx`;
  - `lib/api.ts`, `lib/mockApi.ts` and `lib/mockDb.ts`: community drafts and submissions;
  - `legal/legalDocs.ts`: Terms §5 and §6.
- **Every state and dialog:**
  - the page signed out and signed in;
  - search with results, with no results, and with one result;
  - each occasion chip;
  - the rows with their arrows;
  - a tile: Send this card, Share link;
  - the Send pop-up: message, the leave-blank choice, errors, a long name, "Share it to your socials";
  - the sign-in pop-up for guests;
  - the Share pop-up: share sheet, social links, Copy link and its fallback, the Instagram/TikTok note;
  - the guidelines pop-up ("What we can and can't post");
  - the "Build a card for the Community" band;
  - `?card=id` links, valid, invalid and non-public, signed in and out, and after logging in.
- **`CommunitySubmit.tsx`:** the submit pop-up and "Your shared cards" are kept but not shown. Report what's unused today. **Don't remove any of it:** it's kept on purpose for the backend.

## Step 1: walk it in the browser
- **Setup:** a fresh temp copy of `frontend/` on its own port with its own `.claude/launch.json` entry (local only). Old copies on ports 3100–3230 are stale or belong to other sessions. Never run `next build` in `frontend/`.
- **Sizes:** walk every state at 1280×720, 1024×768, 768×1024, 375×812 and a short phone at 375×667.
- **Measure with the measuring script** (Prompt 1's "Tools"):
  - page height;
  - no box that scrolls on its own: the rows and chips are meant to scroll sideways and must have no visible scrollbar;
  - no sideways page scroll;
  - nothing clipped or spilling;
  - tile titles on one top line, names clamped to two lines, Send and Share link the same width;
  - all 58 tiles the same height in rows and in search results;
  - the dialogs fit one screen.
- **The community mode of Build My Card,** end to end for the first time ("not checked: clicking through the whole community flow to Review"):
  - `/create/build-my-card?for=community` signed out (sign-up returns with `?for=community`), then signed in;
  - "What's on the *front?*" (describe-only, no upload);
  - the image mode note ("Enhance and Decorate work from a photo…");
  - Basics, Image, Message;
  - no Song stage, with "Ready to make it" under Message, and Create costing 1 credit;
  - Create at 0 credits: the top-up choice, then back to the same community draft;
  - Review with no song panel;
  - Delivery: "Back to Community Cards"? Check what the community *Build My Card* card should return to, compared with a catalogue Community Card.

  Report the known gaps: the stage tab still says "Photo", and a draft reopened from Saved Cards loses community mode, because the choice isn't saved in the draft.
- **A catalogue Community Card** through Send → Delivery (picker, return address) → checkout → "On its way". Then check Saved Cards & Songs shows it under Finished cards, with Print and send working.
- **The describe check:** "A fox in a knitted scarf" gets no hair question; "My sister Maya, big laugh" does. Note the known limit (names like "Robin" or "Rose").
- Take screenshots of each distinct state.

## Step 2: check against every standard
- **Colour:**
  - **No gold anywhere in Community Cards** (2.25: they aren't AI-made), except the AI parts of community-mode Build My Card.
  - Selected chips are forest with the tone dots ("All" has none).
  - The Share and Send buttons, the band and the pop-up stripes follow colour meanings: terracotta is decoration or "yours", berry is emphasis, forest is action.
  - Tokens only: grep `community-cards.css` and the community components for raw hex.
- **Logo:** the gold logo only on forest; card placeholders use the current logo. The retired files aren't used.
- **Layout and fit:**
  - even grids (facts, results);
  - one 5×7 frame for every tile, with landscape fronts shown as 7×5 inside it;
  - equal action buttons with labels that never wrap (including "Share link" on phones);
  - no eyebrow above the page heading;
  - the band's buttons: equal, and stacked on phones.
- **Credits and payment:**
  - Sending a Community Card uses no credits. Check the wording everywhere (Send pop-up, Delivery lede, FAQ).
  - Community-mode Build My Card charges only at Create (1 credit, since there's no song).
  - Send is idempotent: a double press saves one draft, and Back from Delivery then Send again doesn't pile up drafts unexpectedly (report what happens).
- **Accessibility:**
  - **Dialogs:**
    - every pop-up uses `FlowDialog`: Send, sign-in, Share, guidelines and the kept submit pop-up;
    - each is labelled and described by elements that exist, with a script word in the title;
    - Tab stays inside, Escape closes, focus returns to the tile's button;
    - the guidelines disclosure works by keyboard.
  - **Scroll rows:** the arrow keys and Tab work in the rows and chips; edge arrows are `aria-disabled` and keep focus.
  - **Live regions:** search results announce their count, and Copy link announces "Copied".
  - **The Share pop-up:** buttons and links have names that mention the card, and links that open a new tab say so.
  - **Fields:** each has a label, errors focus the first invalid field (`focusFirstInvalid`), and busy buttons use `aria-disabled`.
  - **Targets:** at least 44px.
  - **Reduced motion:** row gliding and the smooth jump are off.
  - **High contrast:** the selected chip and tile frames stay visible.
  - A keyboard-only run through browse → Send → Delivery, and browse → Share.
- **Text and content:**
  - **Catalogue** (`catalog.ts`, version `community-2026-11-09`): 58 cards across 14 occasions, with the owner-approved names. Check the new names appear everywhere, including old drafts in Saved Cards. Also check that the `publicExample` flags still mean something now that browsing is open to everyone.
  - **Messages:** the 500-character and four-line rules in the Send pop-up, and the counters.
  - **Guidelines and Terms:** check that `communityGuidelines.ts` (`community-guidelines-2026-11-09-v2`) and Terms §5 and §6 say the same things. That covers review, the licence, no credit or pay for creators, reports and takedowns, and causes and statements. Flag contradictions and unclear wording. **This isn't legal advice**: the drafts still need owner and lawyer review, and `TERMS_VERSION` is deliberately unchanged.
  - **Copy:** "Causes and statements" wording on the band, the community hint and the guidelines. Named days keep their capitals; no control characters.
- **Privacy and sharing:**
  - Share links are `/community-cards?card=id` on the current origin. Confirm production would use the real domain, and that no tracking parameters are added.
  - **Link previews:** a shared link should show a sensible preview (title, description, image) on Facebook, X, WhatsApp and Messages. Today every `?card=` link shares the page's general OG image. Propose per-card previews (`generateMetadata` reading `searchParams`, or `/community-cards/[id]` routes with their own OG images), with the trade-offs.
  - **The guest sign-in pop-up:** its links return to the same card.
- **SEO** (the page is indexable):
  - the title, description and canonical;
  - `?card=` addresses: canonical back to the page, or their own pages?
  - the server HTML includes all 58 cards now that login isn't needed;
  - the sitemap;
  - structured data (an `ItemList` of cards could help);
  - the 404 for an unknown `?card=` (today it may just do nothing: report).
- **Code:**
  - `next/image` for static art (`unoptimized` only where the URL needs it, with a reason);
  - no unused state, exports, props or imports (but keep `CommunitySubmit.tsx`'s submission code, flagged as kept for the backend);
  - no react-hooks eslint-disables; shared helpers (`formatAmount`, `addItemToCart`, `FlowField`);
  - client/server boundaries: the gallery renders on the server and `?card=` sits in its own Suspense boundary;
  - the `lib/api.ts` submission contracts match `DEVELOPER_HANDOFF.md`.
- **Performance:**
  - The route's first-load JS (about 203 kB in the last build).
  - 58 tile images: their sizes and `sizes` attributes; lazy loading below the fold; layout shift when they load.
  - A Lighthouse run (mobile and desktop).

## Step 3: report, then fix after approval
1. A ranked list: severity (bug, inconsistency, polish), where, size, what's wrong against which standard, and the proposed fix. Put the new features first. Also list what's fine.
2. My decisions needed, as short questions. At least:
   - Should community mode be saved in the draft, so it survives reopening?
   - Should the Photo stage be renamed for community cards?
   - Per-card share previews: yes or no, and which approach?
   - What should an unknown `?card=` do?
3. Then apply what I approve:
   - each area's CSS in its own stylesheet (`community-cards.css`; Build My Card's in `bmc-*.css`);
   - tokens only;
   - re-measure at all five sizes;
   - prove any CSS cleanup changes nothing on screen with the computed-style fingerprint (`%TEMP%\souv-audit-20261108\` scripts; copy them, don't edit them).

## Rules
- **Another session built this today and may still be working.**
  - Check file modification times before every edit. Don't edit a file changed in the last 15 minutes without asking.
  - Append to the community-sharing changelog. Don't rewrite it.
- **Shared with the rest of the app: tell me before changing them:**
  - `personalize/PtScrollRow.tsx`, `flow/FlowDialog.tsx`, `flow/FlowField.tsx`, `flow/TopUpChoiceDialog.tsx`;
  - `lib/api.ts`, `lib/mockApi.ts`, `lib/mockDb.ts`, `Delivery.tsx`, `MyCards.tsx`, `legal/legalDocs.ts`;
  - every Build My Card file: the community branches sit inside the shared flow.
- **Never delete anything:**
  - Don't `rm` files; retire them in governance's "Retired files" list.
  - Put scratch files and screenshots in a new, uniquely named temp folder outside the repo.
  - Back up files before scripted rewrites.
- **Scripted edits:** many files are CRLF, and JS `replace()` turns `$$` into `$`. Use `split/join`, a replacer function or the Edit tool.
- **Log every change** in `build-fixes/community-sharing-2026-11-09/CHANGELOG.md`: request, what changed, files, verified, not covered. Add a Community Cards section to `SITE-AUDIT-2026-11-08.md`. Update design-system 2.25 and governance (a version entry) when a UI pattern changes.
- **Don't commit or push** until I say so.
- **Report honestly:** say what you couldn't check (the real backend and review queue, real social previews, a screen reader, real devices). Don't present a partial check as done.
