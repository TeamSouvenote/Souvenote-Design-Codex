# Community Cards audit, 2026-11-09 (report only; nothing in the app changed)

Scope: the gallery, tiles, Send, sign-in, Share and guidelines pop-ups, the "Build a card for the Community" band, `?card=` links, community-mode Build My Card end to end, and Community cards in Delivery and Saved Cards & Songs. It also covers the guidelines against Terms §5/§6, SEO and performance. The standards come from the site audit and Prompts 1, 1B and 2.

## How it was checked
- **Temp copy:** `%TEMP%\souv-cc-audit-I8gc` (launch config `frontend-cc-audit-copy`, port 3260, local only). It was taken at 16:2x, after the last edit to any in-scope file (`lookDetails.ts`, 16:12, by this session). No other session touched the in-scope files in the 20 minutes before.
- **Production build:** `%TEMP%\souv-cc-audit-build-*` (exit 0, no warnings). Lighthouse ran against `next start` from that copy.
- **Scripts** (my copies, in `%TEMP%\souv-cc-audit-work-KbIU\`; the originals weren't edited):
  - the audit measuring script (`install.js`);
  - `tiles.js` (tile geometry in fixed-size iframes);
  - `dialogs.js` (open, measure, Escape, focus);
  - `bmcwalk.js` (an adapted copy of the Personalize walker that logs the stage tabs).
- **Sizes:** 1280×720, 1024×768, 768×1024, 375×812 and 375×667 for the gallery, tiles and every pop-up. The Build My Card community walk and the Delivery walk ran at the pane's own size.

## Inventory
| File | Purpose | Changed today |
|---|---|---|
| `community/CommunityGallery.tsx` | Page: band, search, chips, 14 rows, tiles, dialogs, `?card=` | yes (open to all, Share link, tile clean-up) |
| `community/CommunitySendDialog.tsx` | Send pop-up, guest sign-in pop-up | yes ("Share it to your socials", guest copy) |
| `community/CommunityShare.tsx` | Share pop-up and `ShareIcon` | new |
| `community/CommunitySubmit.tsx` | Band, guidelines pop-up and body; **kept, not shown:** submit pop-up, "Your shared cards", `useMyCommunitySubmissions`, `COMMUNITY_NAME_LIMIT` | new |
| `community/communityGuidelines.ts` | Guidelines (`-v2`) and review steps | new |
| `community/catalog.ts` | 58 cards / 14 occasions (`community-2026-11-09`) | yes (3 names) |
| `community-cards/page.tsx`, `styles/community-cards.css` | Route and styles | yes |
| `personalize/PtScrollRow.tsx` | Shared scroll rows | yes, 15:46 by the Prompt 2B session (A-F9 reduced motion) |
| `bmc/community.ts`, `BuildMyCardClient.tsx`, `create/build-my-card/page.tsx`, `bmc/BmcPageHeading.tsx` | Community mode | new / yes |
| `BmcQuestion.tsx`, `BmcQuestionnaire.tsx`, `BmcSummary.tsx`, `lookDetails.ts` | Community branches (describe-only, no song, stages), animal check | yes (shared with the 2B session's edits) |
| `delivery/deliverySource.ts`, `Delivery.tsx`, `DeliveryKeepsake.tsx`, `MyCards.tsx` | Community in Delivery and the library | not today |
| `lib/api.ts`, `lib/mockApi.ts`, `lib/mockDb.ts` | Community drafts; submissions (kept) | yes (submissions) |
| `legal/legalDocs.ts` | Terms §5/§6 | yes |

**Unused today:**
- **Kept on purpose for the backend (not touched):** `CommunitySubmitDialog`, `MyCommunitySubmissions`, `useMyCommunitySubmissions`, `COMMUNITY_NAME_LIMIT`, `submitCommunityCard`, `fetchMyCommunitySubmissions`, `mockSubmitCommunityCard`, `mockFetchMyCommunitySubmissions`, `MockDb.communitySubmissions`.
- **Unused otherwise:**
  - `COMMUNITY_PUBLIC_EXAMPLES` (no import);
  - the `publicExample` flags (meaningless since browsing is open);
  - `COMMUNITY_CATALOG_VERSION` (exported, never saved);
  - the sign-in pop-up's `card === null` branch (nothing opens it without a card now);
  - the community "Enhance and Decorate…" note in `ModeQuestion` (the mode question never shows without a photo).

## Findings, ranked (new features first)
| # | Severity | Where / size | What's wrong (standard) | Proposed fix | Size |
|---|---|---|---|---|---|
| C1 | **Bug** | "Build a card for the Community" → Review → Delivery | **Nothing is ever submitted or reviewed.** The band says "Once it's approved, anyone can send it", and the guidelines say "Our team reviews every card… Until then, only you can see it here". The flow ends as an ordinary private card: no submission, no "in review", no mention at Review or Delivery. Honest failure messages; the promise isn't backed. | Decide (Q1): **(a)** at the end of Review, a "Share to Community Cards" step that uses the kept submit pop-up (name, occasion, the two agreements) and the mock `submitCommunityCard`, then shows "In review" on the page; or **(b)** until the backend exists, the band says "Coming soon" and doesn't promise posting. | M |
| C2 | **Bug** | Delivery "Back to review"; Saved Cards reopen | **Community mode is lost.** `BACK_HREF.build` is `/create/build-my-card#review` without `?for=community`, so the card reopens titled "Build My Card" (seen). From there, Change answers brings back photo upload, the hair questions and the Song choice. The same happens from Saved Cards (known gap). | Save `creative_brief.audience: "community"` with the draft; `BuildMyCardClient` reads it on resume, and Back keeps the query (Q2). Touches BMC and `deliverySource.ts` (shared). | M |
| C3 | **Bug (regression, this session)** | Send pop-up, 1280×720, 375×812, 375×667 | **No longer fits one screen.** The added "Love this one? Share it to your socials" line makes it 709px at 1280×720 (it was 653 after the owner-approved long-name fix) and 796 / 828px at 375×812 (was 684 / 747). It scrolls at 1280×720, 375×812 and 375×667. | Drop the line (every tile has Share link under Send), or make it a text button in the note line, re-measured to the old heights. | S |
| C4 | **Bug** | `/create/build-my-card` (all) | **The route became dynamic (ƒ)** because `page.tsx` reads `searchParams`. Next 15 then streams the metadata: Lighthouse saw no description or `noindex` in `<head>` (Prompt 2B: SEO 66 → 92). | Read `?for=` in the client: `BmcPageHeading` reads `BmcCommunityContext` (already set by `BuildMyCardClient`), and `page.tsx` goes back to static. BMC files. | S |
| C5 | Inconsistency | Guidelines pop-up, all sizes | **Scrolls like a page:** 2,293px at 1280×720, 2,902 at 768×1024, 4,629 at 375×812 (one screen per dialog). | Q6: **(a)** five disclosures in the pop-up, one open at a time (about 600px), or **(b)** its own page `/community-cards/guidelines` (indexable, linkable from Terms §5), with the band linking there. | M |
| C6 | Inconsistency | Delivery, a Community Card sent from Saved Cards | **Wording follows the screen you came from, not the card:** "handwrite your message, and link your optional song to a QR code" for a card with no song; "Back to review" while the link goes to Saved Cards. | Detect `flow: "community_card"` from the draft for the lede; label Back per source ("Back to Saved Cards & Songs"). `Delivery.tsx` (shared). | S |
| C7 | Inconsistency | Send → Delivery → Back → Send again | **A new draft every time, and the message is cleared.** Saved Cards then shows two identical "Another Lap Around the Sun" cards (seen). A double press is fine (one draft). | Q8: remember the last community draft per card for the tab; reopen with its message and update it instead of creating a new one (needs an update call for community drafts in `lib/api.ts`). | M |
| C8 | Inconsistency | Shared `?card=` link, guest | **The guest gets only "Log in to send this card"**, with no picture or name of the card they were sent. That's a weak first view for social shares now that browsing is public. | A guest card pop-up: front, name, occasion, Share link, and Log In / Sign Up to send (same return links). | S |
| C9 | Inconsistency | `?card=unknown`, renamed ids | **Silently ignored.** The three renamed cards' old links (e.g. `just-because-just-because`) open the page with no message. | Q5: an alias map for the three renames plus a short status line "That card isn't available any more"; or `/community-cards/[id]` pages that 404 (with C11). | S |
| C10 | Inconsistency | Copy | **Contradictions:**<br>• FAQ: "to browse the full template and Community Card collections, you'll need a free account" (`faq/faqData.ts:67` and `FAQ_AND_LEGAL_DRAFTS.md:108`); browsing is open now.<br>• Guidelines: "Until then, only you can see it here" (there's no "here" on the page).<br>• `FAQ_AND_LEGAL_DRAFTS.md` (the lawyer's copy) has neither the Terms §5 shared-card bullets nor the §6 change.<br>• No FAQ answer on building or sharing a Community card. | Fix the FAQ line; fix the review step once C1 is decided; copy Terms §5/§6 into the drafts file; add a draft FAQ entry. | S |
| C11 | Polish | Share link previews | **Every `?card=` link shares the page's general OG image and title.** | Q4: **(a, recommended)** static `/community-cards/[id]` pages (`generateStaticParams`, 58), each with its own title, description, canonical and `opengraph-image` (the card front). The gallery stays static, unknown ids 404, and the Send pop-up opens there. Cost: 58 more static pages, and a route to keep in step. **(b)** `generateMetadata` reading `searchParams` on `/community-cards`: small, but the gallery becomes dynamic (the same streaming problem as C4). | M / S |
| C12 | Inconsistency | Community Build My Card, Basics and Message | **Personal questions on a public card:** the story placeholder ("It's my sister Maya's birthday"), "Who it's from and to" (names) and the creator's inside message. Catalogue Community Cards carry the sender's own message, so it's unclear what becomes public. | Q7: decide what's public (front only?). Then, in community mode, skip "Who it's from and to", use generic story placeholders, and say the inside message is the creator's own copy. | S–M |
| C13 | Polish | Tiles, all sizes | **Hidden text escapes the rows:** each tile's screen-reader text ("Send this card: …", "Landscape card") is positioned against the page, so the root box is 987px wide at 375 (1,069 at 1024). It's clipped, so nothing scrolls sideways, but it's fragile. | `.souv-cc .cc-tile { position: relative }`; proved in an iframe: 987 → 360. | XS |
| C14 | Polish | Share pop-up | **Link names don't mention the card** ("Facebook (opens in a new tab)"). | "Share on Facebook" with the card name in the hidden text. | XS |
| C15 | Polish | Share link | **The link uses the current origin.** In production it's `souvenote.com` only if the site is served there (a `www.` visit would share `www.`). No tracking parameters are added (good). | Use `SITE_URL` when `NEXT_PUBLIC_SITE_URL` is set, else the origin. | XS |
| C16 | Polish | Code | **Unused code:**<br>• `COMMUNITY_PUBLIC_EXAMPLES` and the `publicExample` flags;<br>• `COMMUNITY_CATALOG_VERSION` (never saved with a draft);<br>• the sign-in pop-up's no-card branch;<br>• two `unoptimized` images in the kept submit code, without a reason comment. | Remove the dead export and branch (keep the flags or retire them, Q9); add reason comments; save the catalog version with community drafts. | XS |
| C17 | Polish | Search, no results | **"Design your own" opens plain Build My Card.** | Point it at `?for=community` ("Build it for the Community"). | XS |
| C18 | Polish | SEO | **No structured data** for the 58 cards. | An `ItemList` JSON-LD of card names and links (better with C11's pages). | S |
| C19 | Polish | Performance | **First load 209 kB** (Phase 4: 202). The Share, guidelines and kept submit code all ship with the gallery. | `next/dynamic` for the Share, guidelines and Send pop-ups (only on open). Not measured yet. | S |
| C20 | Polish | Search grid, desktop | **`sizes` says 200px for 4-column tiles about 245px wide.** | `sizes` for grids: `(min-width:1024px) 25vw, (min-width:720px) 33vw, 50vw`. | XS |
| C21 | Known gap | Community Build My Card | **The stage tab still reads "Photo"** for a describe-only step. | Q3: "Front" in community mode (the rail and summary get a label map). | XS |

## Checked and fine
- **Tiles, at all five sizes:**
  - all 58 row tiles are 432px, with one 252px frame and the same name and button positions;
  - names are at most two lines, none clamped;
  - Send and Share link are equal width, 44px, and don't wrap;
  - search "the" gives 12 tiles, uniform at each size (546 / 479 / 483 / 390 / 390), with the occasion shown and "12 cards" in a status region.
- **Layout:**
  - no box scrolls on its own except the intended chips and rows (their scrollbars are hidden);
  - no sideways page scroll;
  - no clipped text and no spills;
  - page height is 8,595px at 1280×720 and 9,624 at 375×812 (14 rows).
- **Colour and logo:**
  - no raw hex, gold tokens or retired logo files in the Community CSS or components;
  - selected chips are forest, with tone dots ("All" has none);
  - pop-up stripes: Send terracotta, sign-in and guidelines berry, Share forest.
- **Pop-ups:**
  - **Share:** 454px (622 on phones) and the **sign-in pop-up** 349–415px: both fit every size;
  - every pop-up is labelled and described by existing elements, with a script word in the title;
  - Escape closes it, and focus returns to the opener (Share link, Send, the guidelines link);
  - Copy link announces through a status region, and falls back to selecting the link when the clipboard is blocked (seen in the pane);
  - links that open a new tab say so.
- **`?card=`:**
  - a valid card signed out opens the sign-in pop-up, whose Log In / Sign Up links return to the same card;
  - logging in through it lands on the card's Send pop-up, and `?card=` is cleared from the address.
- **Send:**
  - a double press saves one draft;
  - Delivery shows the Community lede and "Back to Community Cards";
  - Linda Wilson + a return address → Confirm payment → Send to print → "On its way", order `fulfilled_mock`;
  - **credits 20 before and after**;
  - Saved Cards lists it under Finished cards, and Print and send opens Delivery.
- **Community Build My Card, signed in with 0 credits:**
  - **Steps:** "What's on the *front?*" (describe only), then Basics, Image, Message, with the tabs Photo / Basics / Image / Message / Review and no Song;
  - **Create:** "Ready to make it" sits under Message and reads "Create my card · 1 credit";
  - **At 0 credits:** "Top up to create your card" ("This uses 1 credit") → credits → cart → pay → back on the same draft with `?for=community`;
  - **After Create:** 1 credit was spent (10 → 9), and Review shows Front and Inside message only ("Approve both"), with no song panel;
  - **Signed out:** the sign-up links return with `?for=community` (checked earlier today).
- **Describe check:** "A fox in a knitted scarf" goes straight to "Tell us about the moment"; "My sister Maya, big laugh" gets "Their hair" (checked earlier today, 16-case script). The "Robin" / "Rose" limit remains.
- **Build:** exit 0, no warnings. `/community-cards` is static (○), 10.4 kB / 209 kB first load.
- **Server HTML:** all 58 tiles, title "Community Cards | Souvenote", canonical `https://souvenote.com/community-cards`, and the site OG image. 55 tile images lazy-load, and the first row's first cards load eagerly.
- **Lighthouse `/community-cards`:**
  - **Mobile:** performance 87, accessibility 100, best practices 100, SEO 100. LCP 3.8s, CLS 0, TBT 130ms.
  - **Desktop:** performance 99, everything else 100. LCP 0.9s, CLS 0.003.
  - **LCP element:** the cookie banner's text, site-wide and known.
- **Sitemap and robots:** `/community-cards` is listed. `?card=` addresses canonicalise to the page.
- **Guidelines vs Terms §5/§6:**
  - **Consistent on:**
    - review before posting, and decline or remove at any time;
    - the licence: show, print, sell, share, promote;
    - no credit or pay;
    - takedown on request, and rights-holder reports to the support email;
    - no real people, others' IP or personal details, and no photo cards;
    - AI art may not be protected by copyright.
  - **Causes and statements** appear only in the guidelines. That's fine: §5 points to the guidelines.
  - **The only contradiction** is C10's "here". This isn't legal advice; `TERMS_VERSION` was left unchanged on purpose.

## Decisions needed
1. **C1:** What happens at the end of a community card: a mock "Share to Community Cards" submission now, or "Coming soon" copy until the backend exists?
2. **C2:** Save community mode in the draft, so it survives Delivery's Back and Saved Cards?
3. **C21:** Rename the Photo tab to "Front" for community cards?
4. **C11:** Per-card share previews: yes or no, and static `/community-cards/[id]` pages (recommended) or `generateMetadata` on `?card=`?
5. **C9:** An unknown `?card=`: an alias for the renamed cards plus a short notice (recommended), silence, or a 404 page (with C11)?
6. **C5:** Guidelines as disclosures in the pop-up, or their own page?
7. **C12:** What's public for a community card (front only?), and should community mode skip "Who it's from and to"?
8. **C7:** Should Send again reuse the previous draft and keep the message?
9. **C16:** Retire the `publicExample` flags, or keep them for a future "featured" row?

## Not covered
- The real backend, the review queue and emails.
- Real social link previews.
- A screen reader.
- Real devices and Safari.
- Forced-colours emulation: the CSS has a forced-colours outline on the selected chip, but tiles are framed only by background and shadow, so they may lose their edges. Not seen.
- A real keyboard Tab trap: `FlowDialog` is unchanged since its audit.
- Arrow keys in the rows: `PtScrollRow` was changed today by the 2B session and not re-run here.
- A Big Sender redemption for a Community Card.
- The community Build My Card walk at all five sizes (it ran at the pane's size).
- A full screenshot set: screenshots were taken for the gallery, tiles, Share, guidelines and Delivery states, not every state.

## Outcome
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
