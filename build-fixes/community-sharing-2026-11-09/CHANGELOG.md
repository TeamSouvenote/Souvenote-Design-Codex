# Community Cards: share a card you made, Share, guidelines (2026-11-09)

## 1. "Have a card the public would love?" band
- Files: `frontend/app/components/community/CommunitySubmit.tsx` (new), `CommunityGallery.tsx`, `styles/community-cards.css`.
- What: a band at the top of `/community-cards`, under the fact pills. It reads: use your credits to design it in Build My Card, share it here, anyone can send it once approved, share it to your socials. It has a REVIEWED FIRST pill and a "What we can and can't post" link.
  - Signed in: **Share a card I made** and **Build a new card**.
  - Signed out: **Sign up to share a card** and **Log In** (both return to `/community-cards`).
- "Your shared cards" row (signed in, once there's one): status pills In review, Posted, Changes requested, Not approved.

## 2. Submit pop-up
- Lists only finished Build My Card designs that weren't made from uploaded photos, and hides cards already in review or posted.
- Fields: card name (40 characters), occasion, a short "Before you share" list with the full guidelines in a disclosure, and two required checkboxes (original and follows the guidelines; the licence as in Terms §5).
- Ends on "Thanks, it's in review". Sharing uses no credits.
- API: `submitCommunityCard`, `fetchMyCommunitySubmissions` in `lib/api.ts`. The mock is in `lib/mockApi.ts` and stored in `souv_mock_db.communitySubmissions` (type in `lib/mockDb.ts`). The backend contract is in `DEVELOPER_HANDOFF.md`.

## 3. Share to socials
- File: `components/community/CommunityShare.tsx` (new).
- A round Share button on every tile, plus "Share it to your socials" in the Send pop-up.
- The pop-up offers:
  - the device share sheet, where the browser has one;
  - Facebook, X, Pinterest, WhatsApp and Email;
  - Copy link, which falls back to selecting the link;
  - a note for Instagram and TikTok.
- Link: `/community-cards?card=id` on the current origin. Guests can share without signing in.

## 4. Guidelines and Terms
- `components/community/communityGuidelines.ts` (new): What we can post, What we can't post, Grey areas, How review works, and a rights-holder report line. The legal basis is in the file comment: copyright, trademarks, personality rights and privacy, takedowns, and AI-art copyright.
- `components/legal/legalDocs.ts`, Terms of Service:
  - §5 gains four bullets: review, the licence if posted, the creator's promises, and reports.
  - Creators are not credited or paid (owner decision, 2026-11-09). Terms §5 says so, replacing the earlier placeholder, and the licence checkbox in the submit pop-up reads "It's posted without my name and isn't paid."
  - §6 now excludes customer-shared cards from "remain ours".
- `LEGAL_LAST_UPDATED` / `TERMS_VERSION` were not changed: the drafts still need owner and lawyer review.

## 5. Docs
- `DEVELOPER_HANDOFF.md`: Community Cards submissions and Share contract, plus what's still to build.
- `design-system/docs/02-components.md` §2.25: the new band, rows, tile Share button and the three pop-ups.

## Verified
- `npx tsc --noEmit` passes; `eslint` is clean on the changed files.
- In the dev preview (temp copy on port 3230, mock data):
  - The band shows for signed-out and signed-in visitors.
  - The guidelines pop-up opens.
  - Share opens from a tile and from the Send pop-up; Copy link falls back to selecting the link.
  - Submit shows all four errors and focuses the card choice. A valid submit shows "Thanks, it's in review", and "Sunflower Morning" appears as In review.
  - Submitting again shows the "already shared" empty state.
  - At 375px there's no sideways overflow, and Send and Share share a row on tiles.
  - The new Terms §5 text renders.
- Fixed during testing: mock card images use absolute localhost URLs, so user-card images use `unoptimized` (as in Saved Cards & Songs).
- `.claude/launch.json`: added `frontend-community-share-copy` (port 3230, temp copy). Do not commit unless wanted.

## 6. Follow-up (owner): reuse Build My Card, Share link under cards, no login to browse
- **Band:** one button for everyone, **Build a card for the Community** → `/create/build-my-card?for=community`. The lede now says "Use your credits to build a card for the Community."
  - The submit pop-up and "Your shared cards" are removed from the page but kept in `CommunitySubmit.tsx` for when the backend exists.
- **Build My Card:** `create/build-my-card/page.tsx` reads `?for=community` and `bmc/BmcPageHeading.tsx` shows "Build a card for the *Community*". The flow and backend are unchanged.
- **Tiles:** **Share link** is a full-width outlined button with the share icon, under **Send this card**. It replaces the round icon button.
- **No login to browse:** `CommunityGallery.tsx` shows search, chips and all 14 occasion rows (58 cards) to everyone, including the server HTML. The "A few of our cards" grid and the "See every card" band are gone.
  - Send still opens the sign-in pop-up for guests. Its copy changed to "Sending "{name}" is for Souvenote accounts, so we can print and mail it for you."
  - The `community-cards/page.tsx` comment was updated to match.
- Also fixed: two unescaped apostrophes in the licence checkbox (lint).
- Verified (preview, signed out):
  - 14 rows, 58 tiles and search are visible, with no sign-up band.
  - Share link sits under Send at the same width and opens the Share pop-up.
  - Send opens the sign-in pop-up.
  - The band button lands on `/create/build-my-card?for=community` titled "Build a card for the Community".
  - `tsc` passes and `eslint` is clean.
- Both known gaps were fixed in section 7.

## 7. Follow-up (owner): no photos for Community cards
- `components/bmc/community.ts` (new) holds `BmcCommunityContext`, `buildMyCardPath()` and the community Photo-step copy. `BuildMyCardClient.tsx` reads `?for=community` and provides the context.
- Photo step (`BmcQuestion.tsx` PhotoQuestion, `BmcQuestionnaire.tsx`) in community mode:
  - It shows "What's on the *front?*" with "Describe the picture you'd like on the front of your card."
  - The helper reads "Community Cards can't show real, recognizable people, so this card is made from your words, not photos."
  - The field is "Describe the front of your card", with the placeholder "A fox in a knitted scarf…" and a no-people/characters/brands hint.
  - There's no upload area and no Back to photos; the button reads "Continue". It saves `photoSkipped: true` (describe mode) as before.
- Image mode step: the "Add a photo" link is replaced with "Enhance and Decorate work from a photo, so they aren't used for Community cards."
- `?for=community` is now kept in the sign-up/log-in return link and in the top-up return (`buildMyCardPath`). This fixes the title reverting after sign-up.
- Regular `/create/build-my-card` is unchanged: "Start with a photo", the upload area and "No photo? Describe them instead".
- Verified in preview (signed out):
  - The community page shows the describe-only step, and its sign-up links return to `/create/build-my-card?for=community`.
  - The regular page is unchanged.
  - `tsc` passes and `eslint` is clean.
- Still true:
  - The stage tab still says "Photo".
  - A draft reopened later from Saved Cards (`?draftId=` without `?for=community`) opens as a normal Build My Card. The community choice isn't saved in the draft yet.

## 8. Follow-up (owner): causes and statements, no song, tile clean-up
- **Guidelines** (`communityGuidelines.ts`, version `community-guidelines-2026-11-09-v2`):
  - New group: "Causes and statements we welcome". It opens with the rule "a card can stand for something, never against people". Then: political and civic statements, social justice and human rights, health and awareness, environment and animals, money milestones and encouragement, work and community, and faith and culture.
  - "Can't post" gains:
    - attacking, demeaning, stereotyping or blaming people for who they are (the protected grounds listed);
    - telling people to vote for or against a named candidate, party or ballot question, and misleading voting claims (this replaces the old blanket "election or campaign messages");
    - financial advice and promotions;
    - cure-promising health claims;
    - business ads.
  - Grey areas gain: hot-button issues, protest slogans, named organizations and logos, civic cards near an election, and money humour. The religion line was reworded.
  - The file comment lists the legal basis: human-rights grounds and Criminal Code s. 319; the Canada Elections Act Part 17 and FEC express-advocacy rules; securities regulators, the SEC/FINRA, the Competition Act and the FTC Act.
- **No song for Community cards** (`BmcQuestionnaire.tsx`, `BmcSummary.tsx`, `bmc/community.ts`):
  - `song.mode` is set to `"none"` up front, so the song questions never show and Create costs 1 credit.
  - The progress rail and "Your card so far" use `COMMUNITY_STAGES` (no Song), and "Ready to make it" shows under Message.
  - `StageRail` and `BmcSummary` take an optional `stages` prop.
- **No hair / clothes follow-ups** for Community cards: the describe step marks them answered (`BmcQuestion.tsx`). Without this, "A fox in a knitted scarf" was followed by "Their hair".
- **Community hint** now reads "Keep it general and kind: … Causes and statements are welcome when they don't target anyone."
- **Tile clean-up** (`CommunityGallery.tsx`, `community-cards.css`):
  - One 5×7 frame for every card, with landscape fronts shown as a 7×5 card inside it.
  - Names are always two lines tall (clamped), so the buttons line up.
  - The occasion only shows in mixed results, and the "· landscape" text is gone (screen readers still hear "Landscape card").
- **Catalog names** (`catalog.ts`, version `community-2026-11-09`): "You Did It!" → "You Did It"; "Just Because" → "No Reason Needed"; "Thinking of You Today" → "You Crossed My Mind".
- Verified in the preview at 1280×900:
  - All 58 row tiles are 432px tall, the Send button is in the same place on every tile, and the frames are uniform. No occasion lines show in rows, and no old names remain.
  - Search for "you": 13 tiles, all showing the occasion, all the same height.
  - The guidelines pop-up shows 5 groups.
  - Community Build My Card: the rail reads Photo / Basics / Image / Message / Review; the saved draft has `song.mode: "none"`; after the front description the next question is "Tell us about the moment".
  - `tsc` passes and `eslint` is clean.
- Not checked: clicking through the whole community flow to Review.
- `describesAPerson` treating wild animals as people was fixed in section 9.

## 9. Fix (owner): "Their hair" asked about animals
- File: `components/bmc/lookDetails.ts` (`describesAPerson`), used by the no-photo hair / clothes follow-ups in Build My Card.
- Bug: anything not on a short pet and object list counted as a person, so "A fox in a knitted scarf" got "Their hair". Pronouns also forced "person", so "Our cat Luna, she loves naps" did too.
- Fix:
  - A broad animal list (pets and breeds, general words like "animal" and "creature", wild, farm, bird, insect and sea animals, made-up creatures like dragons and unicorns) plus more things (trees, sky, sunsets, balloons…), with plain plurals.
  - The new order: person words win ("my mom and her dog", "me and my cat"); then an animal or thing means not a person; otherwise it's a person.
  - Pronouns alone no longer decide it.
- Verified:
  - A 16-case check passes (temp script, not committed): fox, foxes, bear, "our cat Luna, she…", dog, car, dragon, penguins and sunflowers give "not a person"; sister Maya, "my mom and her dog", "me and my cat", "Maya, tall…", "He always wears…" and "a woman…" give "a person".
  - In the preview, regular Build My Card goes from "A fox in a knitted scarf…" to "Tell us about the moment", and "My sister Maya, big laugh" still gets "Their hair".
  - `tsc` passes and `eslint` is clean.
- Known limit: a name that is also an animal or thing ("Robin with curly hair", "Rose") with no person word now skips the hair question. Adding "my friend", "my aunt" and so on brings it back. In production the interviewer model should classify this instead.

## Not done
- No backend, staff review queue or emails. Nothing is ever approved in mock mode, so a customer's card never appears in the public rows yet.
- Guidelines and Terms wording need owner and lawyer review.
- Not committed or pushed.

## 10. Community Cards audit (report only, 2026-11-09)
- **Request (owner):** audit everything built today against the site-audit and Prompt 1/1B/2 standards; report a ranked list, then fix what's approved.
- **Changed in the app:** nothing.
- **New:** `COMMUNITY-CARDS-AUDIT-REPORT-2026-11-09.md` in this folder. It holds the inventory, 21 findings (C1–C21), what's fine, 9 decisions and what isn't covered. The site audit gains §10 pointing to it.
- **Top findings:**
  - C1: "Build a card for the Community" never submits or reviews anything, though the band promises it.
  - C2: community mode is lost on Delivery's Back and from Saved Cards.
  - C3: this session's "Share it to your socials" line made the Send pop-up overflow at 1280×720 and on phones.
  - C4: `?for=community` made Build My Card a dynamic route.
  - C5: the guidelines pop-up is 2,293–4,629px tall.
- **Verified with:**
  - temp copy `%TEMP%\souv-cc-audit-I8gc` (port 3260, launch config `frontend-cc-audit-copy`, local only);
  - production build `%TEMP%\souv-cc-audit-build-*` (exit 0, no warnings; `/community-cards` 209 kB);
  - Lighthouse `/community-cards`: mobile 87/100/100/100, desktop 99/100/100/100;
  - scripts in `%TEMP%\souv-cc-audit-work-KbIU\`.
- **The browser tool's five-server limit:** I stopped this session's old preview on port 3230 (`frontend-community-share-copy`) to start the audit copy.
- **Not covered:** see the report's last section.

## 11. Community Cards audit: the recommended set, built (2026-11-09)
- **Request (owner):** "Recommended set" for `COMMUNITY-CARDS-AUDIT-REPORT-2026-11-09.md` (C1–C21), with the report's recommended answer to each decision. Where it gave two options without picking one:
  - **C1:** the mock submission (option a);
  - **C5:** disclosures in the pop-up;
  - **C16:** keep the `publicExample` flags for a future featured row.
- **Found and fixed while building:**
  - **C22:** the row headings' ids held spaces and apostrophes (`cc-row-Valentine's Day`), so 7 of the 14 rows had a broken `aria-labelledby`.
  - **Build My Card weight:** the Review link briefly pulled the Community and Personalize catalogues into Build My Card (+14 kB); the helper moved to `bmc/community.ts`.
  - **Page title:** a reopened community draft's title didn't follow the address change. Fixed with `BMC_COMMUNITY_EVENT`.

| # | What changed | Files |
|---|---|---|
| C1 | **Share for review, end to end (mock):**<br>• A community card's Review starts with "Happy with your front? Share it with the Community…" and **Share to Community Cards**, which opens `/community-cards?submit={draftId}`: the submit pop-up with that card chosen and its occasion filled in.<br>• The band adds **Share a card I made** (signed in), and "Your shared cards" shows under it.<br>• The guidelines' review step now says where you'll see it. | `bmc/BmcQuestionnaire.tsx`, `bmc/community.ts`, `styles/bmc-questionnaire.css`, `community/CommunityBand.tsx` (new), `community/CommunitySubmit.tsx`, `community/CommunityGallery.tsx`, `community/communityGuidelines.ts` |
| C2 | **Community mode survives reopening:** drafts are saved with `creative_brief.audience: "community"`. On open, `BuildMyCardClient` switches the mode on, adds `?for=community` to the address and fires `BMC_COMMUNITY_EVENT` for the title. | `bmc/BmcQuestionnaire.tsx`, `BuildMyCardClient.tsx`, `bmc/BmcPageHeading.tsx`, `bmc/community.ts` |
| C3 | **The Send pop-up fits again:** the "Share it to your socials" line is gone (every tile has Share link). | `community/CommunitySendDialog.tsx` |
| C4 | **Build My Card is a static page again:** `?for=` is read in the browser (`BmcPageHeading` in Suspense, with a static fallback). | `create/build-my-card/page.tsx`, `bmc/BmcPageHeading.tsx` |
| C5 | **Guidelines as five disclosures,** one open at a time, all closed at first: 48px rows with a +/− mark. Tighter spacing, plus a short-phone block. | `community/CommunitySubmit.tsx`, `styles/community-cards.css` |
| C6 | **Delivery wording from the card:** it reads `flow: "community_card"` from the draft, so a Community Card sent from Saved Cards gets the Community wording. Back reads "Back to Saved Cards & Songs" from there. | `Delivery.tsx` (shared) |
| C7 | **Send again reuses the tab's earlier draft** for that card, with its message filled back in (`updateCardDraft`). A new draft is made only when the inside switches between blank and written. | `community/CommunitySendDialog.tsx` |
| C8 | **The guest pop-up shows the card** (front, eyebrow, the O5 title, the name in the lede) with Share link, Log In and Sign Up. | `community/CommunitySendDialog.tsx`, `community/CommunityGallery.tsx`, `styles/community-cards.css` |
| C9 | **Renamed cards' old ids still open them** (`COMMUNITY_CARD_ALIASES`). An unknown `?card=` shows "That card isn't available any more. Here are all our Community Cards." | `community/catalog.ts`, `community/CommunityGallery.tsx` |
| C10 | **FAQ and drafts brought in line:**<br>• "Do I need an account?" now says Community Cards are open to browse;<br>• new draft FAQ "Can I add my own design to Community Cards?";<br>• `FAQ_AND_LEGAL_DRAFTS.md` gains both, the Terms §5 shared-card bullets, §6, and lawyer item 10. | `faq/faqData.ts`, `FAQ_AND_LEGAL_DRAFTS.md` |
| C11 | **Each card's own page,** `/community-cards/{id}`:<br>• static for 58 cards plus 2 aliases; other ids are a 404;<br>• its own title, description, canonical, OG/Twitter image (the card front) and CreativeWork JSON-LD;<br>• the card with Send this card and Share link.<br>Share links point there, and the sitemap lists them. | `community-cards/[id]/page.tsx` (new), `community/CommunityCardFeature.tsx` (new), `community/CommunityShare.tsx`, `community/catalog.ts`, `sitemap.ts`, `styles/community-cards.css` |
| C12 | **Community mode skips "Who it's from and to"** and gets community wording for the story ("What's the moment this card is for?", a general placeholder). The inside message says it's your own copy. | `bmc/community.ts`, `bmc/BmcQuestion.tsx`, `bmc/BmcQuestionnaire.tsx` |
| C13 | **`.cc-tile { position: relative }`:** hidden text no longer escapes the rows. | `styles/community-cards.css` |
| C14 | **Share links are named** "Share on {network}: {card}" (email: "Email: {card}"), with the new-tab note. | `community/CommunityShare.tsx` |
| C15 | **The share link uses `NEXT_PUBLIC_SITE_URL`** when set, else the current origin. | `community/CommunityShare.tsx` |
| C16 | **Dead code out, reasons in:**<br>• `COMMUNITY_PUBLIC_EXAMPLES` removed; the `publicExample` flags are documented as kept;<br>• the sign-in pop-up's no-card branch is gone;<br>• the `unoptimized` images have reason comments;<br>• "Your shared cards" names use their own class. | `community/catalog.ts`, `community/CommunitySendDialog.tsx`, `community/CommunityBand.tsx`, `community/CommunitySubmit.tsx` |
| C17 | **No results now offers** "build one for the Community". | `community/CommunityGallery.tsx` |
| C18 | **The gallery has `ItemList` JSON-LD** of the 58 card pages. | `community-cards/page.tsx` |
| C19 | **The pop-ups load only when opened** (`next/dynamic`). The share icon and the band live in their own files. | `community/CommunityGallery.tsx`, `community/CommunityCardFeature.tsx`, `community/ShareIcon.tsx` (new), `community/CommunityBand.tsx` (new) |
| C20 | **Grid `sizes`** follow the grid's columns; rows use `200px`. | `community/CommunityGallery.tsx` |
| C21 | **The Photo tab reads "Front"** for community cards (rail and summary). | `bmc/BmcSummary.tsx`, `bmc/community.ts`, `bmc/BmcQuestionnaire.tsx` |
| C22 | **Row heading ids are slugs** (`cc-row-valentine-s-day`). | `community/CommunityGallery.tsx` |

- **Backups (before each edit):** `%TEMP%\souv-cc-audit-work-KbIU\backup-fixes\` (the community folder, the Build My Card files, `BuildMyCardClient`, `Delivery`, `faqData`, the CSS, the page files, `sitemap`, the drafts, `02-components`, `DEVELOPER_HANDOFF`, plus each scripted file's pre-script copy).
- **Other sessions:** no in-scope file had changed within 15 minutes of each edit.
- **Verified**, in temp copy `souv-cc-audit-I8gc` (port 3260), at 1280×720, 1024×768, 768×1024, 375×812 and 375×667:
  - **Tiles:** unchanged (rows 432px, frame 252, Send at 324; search grid 546 / 390), with no sideways or hidden-text overflow (C13: the root width is now the screen's).
  - **Send pop-up:** 653 / 653 / 720 / 715–747 px, back to the owner-approved heights. 375×667: 599–627 px, fits.
  - **Guidelines, closed:** 666 / 666 / 685 / 716 / 613 px, fits. One long group opened scrolls the pop-up (1,126–1,791 px).
  - **Guest pop-up:** 378–568 px, fits. **Share:** 454 / 622 px.
  - **Every pop-up:** labelled and described, with a script word, Escape and no small targets (the inline links in running text are exempt).
- **Behaviour, verified:**
  - **C7:** Back and Send again reopened "First draft…" and updated the same draft (one "Make a Wish" draft, with the new text).
  - **C6:** from Saved Cards, the Community wording and "Back to Saved Cards & Songs".
  - **C12 / C21:** community mode shows Front / Basics / Image / Message / Review and the new story wording, skips "Who it's from and to", and adds the message helper.
  - **Create:** 1 credit.
  - **C1:** Review → Share to Community Cards → the pop-up with the card chosen (Birthday filled in) → "Thanks, it's in review" → "Autumn Fox · Birthday · In review".
  - **C2:** `/create/build-my-card?draftId=…#review` (no `?for=`) reopens with the community title, the tabs, `?for=community` and the share row.
  - **C9:** the old `just-because-just-because` link opens "No Reason Needed"; `?card=nope` shows the notice.
  - **C11:** a card page's title, canonical and OG image are its own; the alias page canonicalises to the new id; an unknown id gives the 404 page.
  - **Regular Build My Card:** "Start with a photo" and the photo upload, as before.
  - **Checks:** `tsc` clean, ESLint clean on all of `app/`.
- **Not covered:**
  - a real screen reader, real devices, forced colours, real social previews and Safari's exclusive `details[name]`;
  - the backend: the review queue, emails and turning an approved submission into a catalog card;
  - the opened long guideline groups scroll the pop-up (accepted: reading text; the alternative is a guidelines page).
- **Production build and Lighthouse:** see the next lines.
- **Production build** (temp copy `souv-cc-fix-build2-*`): exit 0, no warnings.
  - `/community-cards` is static: 203 kB first load (was 209).
  - `/community-cards/[id]` is SSG: 196 kB, 60 pages (58 plus 2 aliases).
  - `/create/build-my-card` is **static again**, 227 kB (it was 225 kB and dynamic; the 2B session had 224 before the community code). Its description and `noindex` are back in the server HTML.
  - Personalize is unchanged (206 kB).
  - The gallery HTML has all 58 tiles and an ItemList of 58.
- **Lighthouse** (performance / accessibility / best practices / SEO; one run each, so expect a few points of variance):

  | Route | Desktop | Mobile | Notes |
  |---|---|---|---|
  | `/community-cards` | 100/100/100/100 | 83/100/100/100 | Mobile LCP 4.5s is the cookie banner's text, site-wide and known (the audit run had 87) |
  | A card page | 100/100/100/100 | 89/100/100/100 | |
  | `/create/build-my-card` | 98/100/100/66 | 88/100/100/66 | SEO 66 is the intended `noindex` |

## 12. No eyebrows in Community Cards (2026-11-09)
- **Request (owner):** "I don't want the eyebrow copy "Community Card · Birthday" anywhere in the app."
- **Removed:**
  - the "Community Card · {occasion}" line from the Send pop-up, the guest pop-up, the Share pop-up and each card's page;
  - the other two Community eyebrows: "Community Cards guidelines" and "Share to Community Cards" (submit pop-up).
- **Files:**
  - `community/CommunitySendDialog.tsx`, `community/CommunityShare.tsx`, `community/CommunityCardFeature.tsx`, `community/CommunitySubmit.tsx`;
  - `styles/community-cards.css`: the `.cc-card-occasion` rule removed (backup in `%TEMP%\souv-cc-audit-work-KbIU\backup-fixes\community-cards.pre-eyebrow.css`). The card title sits at the top, and pop-up titles keep 32px clear of the close button (48px on short phones).
  - Docs: design system 2.25 and the long-name note.
- **Verified:**
  - no `.fd-eyebrow` and no "Community Card ·" text in the card page or the guest, guidelines and Share pop-ups (signed out), nor in the Send pop-up (signed in); the code has none;
  - titles don't touch the close button;
  - every pop-up fits one screen at 1280×720, 1024×768, 768×1024, 375×812 and 375×667: Send 555–682px, guest 341–515, Share 454 / 606, guidelines 581–680;
  - `tsc` and ESLint clean.
- **Not covered:** the submit pop-up was checked in code only. It opens signed in from "Share a card I made", and the same title rule applies.
- **Not changed (outside Community Cards):** eyebrows in other pop-ups (Checkout, the top-up choice, the Build My Card dialogs and Review, the rights pop-up, `AuthGatePrompt`). Waiting for the owner.

## 13. No eyebrows anywhere in the app (2026-11-09)
- **Request (owner):** "Yes, remove all": the eyebrows outside Community Cards too.
- **Removed (10):**
  - "Account required" in `AuthGatePrompt.tsx` (the cart) and in `bmc/BmcDialogs.tsx` (sign-up);
  - "Before we upload" (`bmc/BmcAttestationDialog.tsx`);
  - "Creating" and "Uses 1 credit" (`bmc/BmcDialogs.tsx`);
  - "Everything approved" (`bmc/BmcReviewStage.tsx`);
  - "Secure checkout" (`Checkout.tsx`);
  - "Almost there" (`flow/TopUpChoiceDialog.tsx`);
  - "Your keepsake is approved" (`DeliveryKeepsake.tsx`): the section is now named by `aria-label`.
  - No page-level eyebrows were left: `.bmcq-eyebrow`, `.cf-eyebrow`, `.pr-eyebrow` and `.auth-eyebrow` were already unused.
- **Shared CSS:**
  - `checkout-flow.css`: `.fd-title` has no top margin, and keeps 36px clear of the close button (centred titles get 36px on both sides). `.fd-eyebrow` is marked retired.
  - `bmc-dialogs.css` and `attestation.css`: in the short-phone blocks, the title (not the eyebrow) takes the 48px clearance, with no top margin.
  - The eyebrow classes are listed in governance's dead CSS (nothing deleted).
- **Docs:**
  - Foundations 1.2: "No eyebrows in pop-ups either", with no exceptions; the old pop-up exception is removed.
  - Components 2.18 (rights pop-up), 2.29 (the cart's prompt) and the short-phone note.
  - Governance v1.39.
- **Backups:** `%TEMP%\souv-cc-audit-work-KbIU\backup-eyebrows\` (all ten files, the three CSS files and the three docs).
- **Verified** (temp copy, port 3260): no eyebrow, no title touching the close button, and no scrolling, except where noted:
  - Build My Card sign-up: 459 / 536 / 536px (1280×720, 375×812, 375×667);
  - the cart's "Log in before checkout": 354 / 389 / 389px;
  - Checkout: 602 / 601 / 774px at 1280×720, 1024×768 and 375×812. At 375×667 it's 775px and still scrolls, as before (B-3, accepted by the owner).
  - Approve both: 330px (1280×720);
  - Make a new front?: 372 / 407px;
  - Top up to make a new version: 601 / 681 / 566px;
  - every Community pop-up (section 12).
  - `tsc` and ESLint clean on all of `app/`.
- **Not covered:**
  - the rights pop-up (it needs a real photo upload) and the brief "Creating" pop-up were checked in code and CSS only;
  - the phone approve pop-up wasn't re-opened, because the approvals are saved with the card;
  - Delivery's keepsake was checked in code only.
