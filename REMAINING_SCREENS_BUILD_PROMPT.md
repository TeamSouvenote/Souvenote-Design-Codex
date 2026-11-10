# Build prompt: the remaining screens on berry & ivory

**Screens:** Saved Cards & Songs, Account Profile, Account Settings, FAQ, Contact, the four legal pages and Community Cards. Refer a Friend, Gift a Souvenote and Redeem Gift are removed until v2.

You are continuing the Souvenote web application redesign on the `mock-data-mode` branch. These screens still use the older dark gold style (`input-dark`, `bmc-shell`, `text-metallic-*`, `souv-hero-italic`, `pg-italic`). Your task is to:

1. **Rebuild each one on the berry & ivory design system**, in clean, typed Next.js code.
2. **Make them match the MVP PRD.** Several still show behaviour the PRD rules out.
3. **Turn Community Cards from a "coming soon" placeholder into the real MVP catalog.**

| Screenshot (2026-10-25 set) | Route | Current code |
|---|---|---|
| 19 / 20 Saved Cards & Songs (+ alias) | `/create/my-cards-and-songs`, `/my-cards` | `components/MyCards.tsx`, `styles/mycards.css` |
| 26 Account Profile | `/account/profile` | `components/AccountPages.tsx` (`ProfilePage`), `AccountRouteClient.tsx`, `styles/account.css` |
| 27 Account Settings | `/account/settings` | `components/AccountForms.tsx` (`SettingsPage` and its tabs) |
| 31 FAQ | `/faq` | `faq/page.tsx`, `components/FAQ.tsx` (outdated list) |
| 32 Contact | `/contact` | `components/Pages.tsx` (`ContactPage`), `styles/pages.css` |
| 33–36 Privacy, Terms, Refund, Cookie | `/legal/[slug]` | `components/LegalData.tsx`, `LegalPageClient.tsx`, `lib/legalVersions.ts` |
| none (placeholder) | `/community-cards` | `community-cards/page.tsx` |
| 28–30 Refer, Gift, Redeem | `/refer`, `/gift`, `/gift/redeem` | `AccountPages.tsx` (`ReferPage`), `AccountForms.tsx` (`GiftSouvenotePage`, `RedeemGiftPage`) |

## Owner decisions, 2026-11-08 (these override anything below that disagrees)

1. **Community Cards: build the full catalog** on mock data, following the PRD and the task brief. Until approved artwork exists, the tiles show the Souvenote logo as a placeholder, in the same way as the Personalize "Coming soon" tiles. Every tile here is a real, sendable card, not a "Coming soon" tile.
2. **Refer a Friend, Gift a Souvenote (send a blank Souvenote) and Redeem Gift: delete the code.**
   - That means the routes, components, CSS, gift and referral pieces on Profile and Cart, the mock data for them, and every link.
   - **No trace stays in the code or the UI:** no feature flag, no redirect and no route list naming them. They will be rebuilt in v2. (The backend has no referral or gift code; checked 2026-11-08.)
   - **Wrong addresses get one branded "page not found" screen.** Add `app/not-found.tsx`. It covers every address that doesn't exist, so an old `/refer` bookmark lands there in the same way as `/banana`. It isn't Refer-specific code.
3. **Account Settings: researched against Amazon Cognito (2026-11-08).** The findings and decisions are in §3.4. Cognito is the identity provider, and the Souvenote backend will be built later. Build to §3.4 as written. Don't re-research it, but tell me if anything you find in the code contradicts it.
   - **Cognito-backed controls are built for real** through `lib/cognitoAuth.ts`, with mock twins in `lib/mockCognito.ts` like the existing ones.
   - **Controls that need the Souvenote backend are built on mock data**, with the API contract written up for the backend.
4. **FAQ and legal text: update both to match the PRD.** The researched drafts are in **`FAQ_AND_LEGAL_DRAFTS.md`** (repo root). Use that text as written, including its `[NEEDS OWNER]`, `[NEEDS PROVIDER]` and `[LAWYER]` markers. Don't write your own. Its §2 conflicts must be settled by me before the text goes live.
   - Write the new wording as **drafts for my approval**. Mark each changed passage `DRAFT` in the data file, as was done for the landing FAQ.
   - Bump the "Last updated" dates in `legalVersions.ts` only once I approve.
   - The legal text is a product draft, not legal advice. Say so in your report, and list anything a lawyer must confirm.
5. **Prices come from the pricing catalog**, never hard-coded, and there are now **two price lists, CAD and USD** (decision 10). The owner's prices override the PRD's figures. The full table is in `FAQ_AND_LEGAL_DRAFTS.md` §1. For example, Print and Send is **$9.99 CAD / $7.99 USD**, each including 10 AI credits. The PRD's $7.99 CAD, and the task brief's $8.99 for the Saved Cards button, are both out of date.
6. **The support contact is `cameron@souvenote.com`.** It appears everywhere a support address shows: Contact, FAQ, legal pages and the confirmation-email copy. Keep it in **one config constant** (for example `lib/support.ts`), never repeated in copy.
7. **No reply-time promise.** Contact says: *"We read every message and will get back to you as soon as we can."* Remove "reply within a day" and "1–2 business days" everywhere.
8. **The Community Cards seed catalog is Appendix A**, approved by the owner on 2026-11-08. Use it as written.
9. **Remove the marketing-email opt-in everywhere** (owner, 2026-11-08). MVP sends only purchase and order confirmations, so there's nothing to consent to. Remove:
   - the "marketing" checkbox on Sign Up (`Auth.tsx`, around line 621) and on the social sign-in Terms screen `/signup/terms` (around line 1387);
   - the `marketing` state behind both;
   - the `marketingOptIn` value they send.
   `acceptTerms` takes no marketing argument, and the pending sign-up profile no longer carries one.
   - **Keep the backend column** `marketing_opt_in` (default `false`, migrations 004 and 005); don't change the backend.
   - In mock mode, stop writing the field. Note in `DEVELOPER_HANDOFF.md` that it's unused until marketing is approved, at which point a new opt-in and a Settings toggle to withdraw it are needed.
   - Also note that the old Settings toggle defaulted to **on** (`profile?.marketing_opt_in ?? true` in `AccountForms.tsx`), which CASL doesn't allow. It goes with the toggle (§3.4.4). Don't carry that default into any new code.
   - While editing Sign Up, change the step line *"Set your login details, birthday reminder, and country preferences."* to **"Set your login details."** (owner, 2026-11-08).
10. **Canada and the United States are both in MVP** (owner, 2026-11-08; this overrides the PRD, where the US was v2). Customers in either country can mail cards to addresses in either country. Build it as §3.11.
11. **Storage is 12 months; the Big Sender minimum is 2** (owner, 2026-11-08).
    - Fix the Pricing page's Big Sender line *"Your cards are saved in Saved Cards & Songs for 15 months"* to 12 months from the last saved edit.
    - Change `BIG_SENDER_TIERS` from "1–10" to **"2–10"**, so 1 card is always Print and Send.
12. **Account country and currency** (owner, 2026-11-08):
    - Sign Up asks for the country, **required, Canada or United States only**. Social sign-ups choose it on `/signup/terms`.
    - The country sets the account's price list and currency. In Settings > Preferences, currency becomes **read-only**: "Prices in CAD (Canada)" or "Prices in USD (United States)", with "To change your country, contact support".
    - Signed-out visitors on the landing page and Pricing get a **"Prices for: Canada | United States"** switch. It defaults from the browser region, is remembered in `souv_price_country`, and keeps both price lists in the public HTML.
13. **The upload attestation becomes a short summary with links** (owner, 2026-11-08). Build it as §3.12.
14. **Analytics uses cookies, behind a consent banner** (owner, 2026-11-08). Build it as §3.13.
15. **Unused credit top-ups and Big Sender packs** can be refunded within 14 days if unused. This is policy text only; support handles it, so add no UI.
16. **Privacy Officer: Cameron** (cameron@souvenote.com). **Governing law: British Columbia.** Both are already in the drafts.

**Earlier decisions (still apply)**
- Only usable features appear in navigation. Customers see no "coming soon" tiles or inactive v2 routes (PRD §2).
- Mock data mode stays on by default on this branch.
- Language lives in Account Settings > Preferences, and that code is approved (see `DEVELOPER_HANDOFF.md`). Keep its behaviour and copy. **Currency changes:** it now follows the account's country and is read-only (decision 12).

---

If any requirement, product behaviour, design decision, existing copy, reference material or technical constraint is unclear, ask me focused follow-up questions before you assume anything or start building. Do not make changes that could alter intended product behaviour, copy, data handling, authentication, credits, or the Souvenote design direction until I have clarified them.

---

## 1. Inspect before you edit

Read the existing implementation first and map it. Do not edit anything until you understand it.

- **The screens:** every file in the table above, and the old shells they use: `StaticPageChrome.tsx`, `PageChrome.tsx`, `Pages.tsx` (`PageHero`), `Ornaments.tsx` (`OrnamentDivider`, `Eyebrow`).
- **Who uses what:**
  - Which other screens still import `bmc-shell`, `input-dark`, `pages.css`, `account.css`, `mycards.css` or `BmcShared.tsx`?
  - Which code calls `MCS_DRAFTS`, `MCS_CARDS`, `MCS_SONGS` and `personalizeResumeTarget` / `buildMyCardResumeTarget`?
  - Where does `rememberDeliverySource('saved')` lead in `Delivery.tsx`?
- **Gift and referral traces:**
  - grep for `refer`, `gift`, `blankGift`, `useBlankSouvenoteGiftCount`, `Gift a Souvenote` and `Refer a Friend`;
  - `CartPage.tsx` (the hidden "Gift a Souvenote" split, around line 351);
  - the Profile stats ("Blank gifts");
  - `Footer.tsx` (comment at line 57);
  - `Navbar.tsx`, `sitemap.ts`, `robots.ts`;
  - `lib/mockDb.ts` and `lib/mockApi.ts`;
  - the backend's referral or gift fields. **Don't touch the backend.** List anything there in your report instead.
- **Already-redesigned screens to match:**
  - Create Options (`CreateOptionsClient.tsx`, `create-options.css`, `opened-card.css`);
  - Pricing (`components/pricing/*`, `pricing.css`);
  - Cart, Delivery and Confirmation (`components/flow/*`: `FlowPageShell`, `FlowField`, `FlowDialog`, `TopUpChoiceDialog`, plus `checkout-flow.css`);
  - Auth (`Auth.tsx`, `auth.css`);
  - the landing page (`components/landing/*`, `landing.css`, and `content.ts` with the approved `FAQ_ITEMS`);
  - Personalize a Template (`components/personalize/*`: `PtGallery`, `PtScrollRow`, the placeholder logo tile, plus `personalize.css`).
- **Data and auth:**
  - `lib/api.ts` and its mock layer (`mockMode.ts`, `mockDb.ts`, `mockApi.ts`, `mockCognito.ts`);
  - `lib/cognitoAuth.ts` and `AuthProvider.tsx`;
  - `DeliveryForm.tsx` (the recipient entry the address book must reuse);
  - `lib/legalVersions.ts` and `/signup/terms` (which reads the legal versions).
- **Notes:** `DEVELOPER_HANDOFF.md` (the approved copy list, and "Other loose ends": FAQ/Contact/legal metadata, `/community-cards` sitemap, `/legal/terms` giving 500 not 404) and `build-fixes/mock-data-mode-2026-11-07/CHANGELOG.md`.

## 2. Sources of truth (read all of them)

**Product: `reference-materials/Souvenote MVP-PRD.pdf`.** The rules that apply here:

- **Navigation (§2, §6):**
  - Only usable features appear in navigation.
  - Do not expose coming-soon tiles or inactive v2 routes.
  - The whole referral programme, prepaid blank-card gifting, Trust Circle and gift cards are v2.
  - **My Orders, order history and status screens are v2.**
- **Saved Cards & Songs (§5):**
  - Drafts and finished creations are stored for **12 calendar months from the creation's last saved edit**, or from its first save if never edited.
  - Viewing a creation, or an unrelated order or job update, does not restart the clock.
  - **Show the current storage-expiry date.**
  - There is no Save/Extend control and no customer-chosen retention date.
  - Reorder without regenerating: change the recipient and edit the inside message for free. Each reorder uses a new Print and Send purchase or a paid Big Sender card. No AI credits are used.
  - A mailed card's QR song stays available indefinitely, even after the library entry expires.
- **Saved recipients (§5):**
  - A basic address book that stores only a name and mailing address.
  - Delivery offers an optional "Save this recipient" checkbox and a saved-recipient selector on later orders.
  - A simple account page to view, create, edit and delete entries.
  - Choosing a saved recipient copies the address into the order. Later edits never change a submitted order.
  - Birthdays, reminders, groups and imports are v2.
  - Every list, read, create, update and delete call is owner-checked (backend later; note it in the contract).
- **Account deletion (§5):**
  - Deletion removes the profile, saved recipients and private library, subject to required record retention.
  - Songs already linked to mailed cards keep their playback and download links.
  - **Explain these effects before the customer confirms.** Don't promise that deletion removes every copy.
  - Song removal requests go through support.
- **Community Cards (§3, §6):**
  - Ready-made physical card designs reached from the navbar. Browse, choose a design, write and edit the inside message for free, review, then Delivery and checkout.
  - **No AI credits, no AI generation, no lyrics, no song and no QR code.**
  - Payment is still needed: Print and Send, or a valid paid Big Sender card.
  - **The full catalog requires sign-in.** Guests see only a small approved selection and are prompted to sign in or sign up.
  - Make the free-message and no-AI-credit terms clear during selection and checkout.
- **Support (§4):** cancellations, refunds and reprints all go through support. There are no self-service request buttons, no returns portal and no helpdesk tool. Help stays reachable from public and account pages. The support contact must be configured; don't invent response-time promises that aren't approved.
- **AEO/GEO (§7):**
  - Public pages (FAQ, legal, Contact, and Community Cards for guests) need readable HTML without interaction, with accurate titles, descriptions, canonical URLs, sitemap entries and a clear heading hierarchy.
  - FAQ answers must be concise and accurate, and consistent with Pricing and checkout: the two free credits, the initial image and song cost, the fixed CAD and USD offers, **delivery in Canada and the US** (cross-border allowed), optional later Print and Send, the 12-month storage, and no-login QR playback and download.
  - `FAQPage` structured data is allowed only where it matches the visible text exactly.
  - **Account pages, saved creations and saved recipients stay out of indexes** (noindex plus real auth).

**Task brief: `reference-materials/App Screenshots/2026-10-25 Full App/Souvenote UI - Task Breakdown.pdf` and `Change Notes/`:**
- **19 Saved Cards & Songs:** when a saved card is present, show a visible **Print and send** button beside it, with the price from the catalog (decision 5).
- **25 Account Profile:** remove Gift a Souvenote and Refer a Friend altogether and disable their functionality.
- **27–29 Refer / Gift / Redeem:** remove them from the working app and the UI. They are v2.
- **Community Cards (in the 04-Welcome notes):**
  - The page looks similar to Personalize a Template, with many card types.
  - **Each card has a "Send this card" button**, which opens a write-a-message pop-up where the customer adds an inside message, as in the other flows.
  - The pop-up has **Send this card** and **Cancel**. Send this card goes to Delivery.
- **General:** keep most existing copy and UX. Responsive desktop and mobile. Keyboard navigation, readable contrast, semantic HTML, accessible labels. Clean Next.js code.

**Design: `design-system/`** (berry & ivory, v1.4)
- Read `README.md`, `docs/01`–`06`, `tokens/tokens.css` and `reference/index.html`. The live source is `frontend/app/styles/landing.css` (the `--l-*` names map one-to-one to `--sv-*`). `docs/06-governance.md` "Scope today" lists exactly which screens are done and which are left; update it when you finish.
- The rules:
  - Lato 300/400/700, plus Lobster Two for **one accent phrase per heading**. The `text-metallic-*`, `souv-hero-italic` and `pg-italic` treatments go.
  - Ivory and paper surfaces with the shared paper texture. Forest for actions, berry for emphasis, **gold only for AI-made things**. Community Cards are not AI-made, so no gold on them.
  - 17–18px body text, tap targets of 44px or more, pill buttons, warm low shadows, the `--sv-ease` curve.
  - The FAQ uses the **Accordion (2.11)**. Dialogs use `FlowDialog` (2.18 behaviour).
  - Gallery tiles follow the Personalize gallery (2.20), placeholder logo tile included.
  - Forms use `FlowField`.
- No generic SaaS dashboard or settings-template styling. Account pages should feel like the rest of Souvenote: warm, paper, calm.

---

## 3. What changes

### 3.1 Shared page shell for static and account pages

- Replace `StaticPageChrome` / `PageHero` / `OrnamentDivider` on these screens with berry & ivory equivalents. Use one shell for **public content pages** (FAQ, Contact, legal, Community Cards for guests) and the existing `FlowPageShell` pattern for **signed-in pages** (Saved Cards, Profile, Settings, Community Cards signed in), so they match Cart and Delivery.
- One h1 per page, with a single Lobster Two phrase. Breadcrumbs only if the design system has them; don't invent a new pattern without asking.
- Once nothing uses the old shell pieces and stylesheets (`pages.css`, `account.css`, `mycards.css`, the `input-dark` / `bmc-shell` / `pg-*` / `acc-*` / `mcs-*` classes), remove them. Check the importers first.

### 3.2 Saved Cards & Songs (`/create/my-cards-and-songs`, `/my-cards`)

- **Keep the structure:** in-progress drafts, finished cards and saved songs, with the empty states and the resume logic.
  - `personalizeResumeTarget` and `buildMyCardResumeTarget` must keep opening the new BMC and Personalize stages, old-format drafts included.
  - Keep `/my-cards` as an alias, preferably a redirect, so there's one canonical page.
- **Storage expiry (PRD):**
  - Replace the **30-day** rule (`daysUntilExpiry`, the "30 days" copy in the lede and empty states) with **12 calendar months from the last saved edit**.
  - Show the **actual expiry date** ("Saved until 8 November 2027"), not just a day count.
  - Add a typed `last_saved_edit_at` (or similar) to the mock draft, kept separate from `updated_at`, so that viewing a creation or an order update doesn't move it. Document the field for the backend.
  - No Save/Extend control.
- **Print and send button:** on every finished card, a visible forest pill **"Print and send, {price}"**, with the price from the pricing catalog. It opens the reorder path: Delivery with this card's existing artwork and song (`rememberDeliverySource('saved')`).
  - The customer may change the recipient and edit the inside message for free.
  - **No AI credits are used.**
  - Checkout applies Print and Send or a Big Sender card as it does today.
- **Songs:** keep the play rows on the design system's song chip (2.7). Keep download only if it works today. Explain that a mailed card's song stays reachable through its QR code after the library entry expires.
- **Community Cards** that were sent appear as finished cards, with no song.
- **Delete a draft or creation (new, owner-approved 2026-11-08; it doesn't exist today):**
  - a "Delete" action on each draft and finished card, with a `FlowDialog` confirmation that names the card;
  - it never affects submitted orders, and a mailed card's QR song keeps working;
  - add a typed `deleteCardDraft(id)` to `lib/api.ts`, with a mock twin, and write up the contract `DELETE /card-drafts/:id` (owner-checked) for the backend;
  - focus moves to the next item, or to the empty state.
- Remove the "Mock data" demo arrays from the export if nothing else needs them, and remove the decorative `MCS_BARS` if the song chip replaces it.

### 3.3 Account Profile (`/account/profile`)

- **Remove all gift and referral content:** the "Blank gifts" stat, the gift activity row, the Refer and Gift links and cards, and `useBlankSouvenoteGiftCount`.
- **Keep:** the account summary (name, email, member since), the credits balance and the Big Sender card balance with their **15-month expiry** where known, and links to Saved Cards & Songs, Account Settings, Saved recipients and Pricing / Top up (`openTopUp`).
- Show no order history. My Orders is v2, so don't add a placeholder for it.
- Propose the final layout to me before building it if the current sections don't fit once gifts and referrals are gone.

### 3.4 Account Settings (`/account/settings`)

**What Cognito can do (researched 2026-11-08, AWS Cognito developer guide).** The app signs in through `amazon-cognito-identity-js` (`authenticateUser`, SRP) with our own screens. The username is the email address, and Google, Facebook and Apple come in through managed login. The user pool isn't created yet (env values are still placeholders), so the pool settings below are **set-up requirements to write into `DEVELOPER_HANDOFF.md`**, not things to change.

| Control today | Cognito? | Decision |
|---|---|---|
| Personal info (name, phone) | No: Souvenote profile (`PATCH /auth/me`) | **Keep**, restyled, on the existing API. |
| Login email (read-only) | It's the Cognito username | **Keep read-only.** No email change in MVP. |
| "Seasonal ideas and reminders" toggle (in Personal info) | No | **Remove.** Reminder and marketing emails aren't in MVP. |
| Change password | Yes: `changePassword` (email and password accounts only) | **Build for real** (3.4.1). |
| Two-factor authentication | Yes: authenticator app (TOTP), optional | **Build for real** (3.4.2). |
| "Signed in on 2 devices" | No: Cognito can't report live sessions, and remembered devices miss social sign-ins | **Remove.** |
| Sign out all | Yes: `globalSignOut` (`signOutCognitoEverywhere` exists) | **Keep as "Sign out of all devices"** (3.4.3). |
| Notifications tab | No | **Remove the whole tab** (3.4.4). |
| Payment methods | No: Stripe and backend | **Keep** on mock data, as today. |
| Preferences (currency, language) | No | **Language unchanged** (approved). **Currency becomes read-only** and follows the account's country (decision 12). |
| Deactivate account | Admin-only (`AdminDisableUser`); customers couldn't reactivate themselves | **Remove.** |
| Delete account | Partly: `deleteUser` removes the Cognito identity, and the backend removes the data | **Build** (3.4.5). |
| *(new)* Saved recipients | No: backend | **Build** on mock data (3.4.6). |

**Social sign-in accounts** (Google, Facebook, Apple): Cognito gives federated users no password and no two-factor, because their provider handles both. For these accounts, hide Change password and Two-factor and show one line instead: *"You sign in with {Google}. Manage your password and two-step sign-in in your {Google} account."* Show the provider's real name. Tell the account type apart from the session or token (identities claim), not a guess.

#### 3.4.1 Change password
- Fields: current password, new password, confirm. Use the same password rules and strength hints as Sign Up (`Auth.tsx`); reuse them, don't copy them.
- Calls `changePassword(old, new)` on the signed-in `CognitoUser`.
- Map the real error codes to plain messages: `NotAuthorizedException` (wrong current password), `InvalidPasswordException`, `LimitExceededException`.
- **After a change, offer "Also sign out of other devices"**, ticked by default, which then runs global sign-out and signs in fresh here. The reset flow already does the same.

#### 3.4.2 Two-factor sign-in (authenticator app, optional)
- **Pool requirements for the hand-off:** MFA **Optional**, MFA method **Authenticator apps (TOTP)** only. No SMS (no SNS) and no email MFA (no SES or paid plan needed). Account recovery stays **email**. Remembered devices stay **off**.
- **Turn on (Settings):**
  1. Explain it in one line: "Each time you sign in, you'll also enter a 6-digit code from an authenticator app."
  2. `associateSoftwareToken`, then show the **QR code** (an `otpauth://totp/Souvenote:{email}?secret=…&issuer=Souvenote` URI) and the secret as copyable text for people who can't scan.
  3. The customer enters a 6-digit code; `verifySoftwareToken(code, "Souvenote")`.
  4. `setUserMfaPreference(null, { Enabled: true, PreferredMfa: true })`.
  5. Calm confirmation.
  - **The QR code needs a library.** `qrcode` is already allowed for the BMC song QR; reuse it and don't add another.
- **Turn off:** confirm in a `FlowDialog`, then `setUserMfaPreference(null, { Enabled: false, PreferredMfa: false })`.
- **Sign-in:** `cognitoAuth.ts` (around line 902) currently rejects `totpRequired`.
  - Replace that with a **code step on the Log In page**: a single 6-digit field (`inputmode="numeric"`, `autocomplete="one-time-code"`), sent with `sendMFACode(code, callbacks, "SOFTWARE_TOKEN_MFA")`.
  - Handle a wrong code (`CodeMismatchException`), the lockout after five failures (explain and ask them to wait), and Back to start again.
  - `mfaRequired` (SMS) and `selectMFAType` stay as clear errors, because the pool won't offer them.
- **Lost phone:** there are no backup codes in Cognito's TOTP. Say plainly in the setup and in the FAQ that a customer who loses their authenticator contacts support (`cameron@souvenote.com`), and that support can reset it from the admin side. Put that procedure in the hand-off.
- **Mock mode:** `mockCognito.ts` gets associate, verify, preference and the sign-in challenge, with a fixed demo code shown in the Mock data badge, and the real error codes.

#### 3.4.3 Sign out of all devices
- One row: "Sign out of all devices. You'll stay signed in here." It needs the password today (`signOutCognitoEverywhere(email, password)`), so ask for it in a `FlowDialog`. For social accounts, which have no password, use global sign-out with the current session, then sign in again with the provider.
- No device count and no device list.

#### 3.4.4 Emails
- Remove the Notifications tab and the "Seasonal ideas and reminders" toggle (its `marketingOptIn` save goes too; see decision 9).
- In its place, one line in Personal info under the email: *"We email your purchase and order confirmations to this address."* No toggles.

#### 3.4.5 Delete account
- A `FlowDialog` that explains, before confirming, what happens (PRD §5):
  - **Removed:** your profile, saved recipients and private library (drafts, cards, songs).
  - **Kept:** songs already linked to mailed cards keep playing from their QR codes, and order and payment records are kept as the law requires.
  - **Song removal:** to remove a mailed card's song, contact support.
- **Typed confirmation:** the customer types DELETE.
- **Order of operations (hand-off):**
  1. The backend deletes the data (contract `DELETE /auth/me`).
  2. Then Cognito `deleteUser`.
  3. Then sign out.
  - Mock mode clears the mock account and signs out.
- Remove the "Danger zone" label. Use calm wording: "Delete your account".

#### 3.4.6 Saved recipients (PRD address book)
- A Settings section with list, create, edit and delete, holding a name and a mailing address in Canada or the US only (country, plus province or state, and postal or ZIP code, validated per country). Reuse the `DeliveryForm` address fields and their validation. Deleting needs a `FlowDialog` confirmation.
- **Also wire Delivery:**
  - an optional **"Save this recipient"** checkbox;
  - a **saved-recipient selector** that copies the address into the order;
  - editing the order's copy never changes the saved entry, and a submitted order keeps its own snapshot.
- Mock data only. Write up the contract `GET/POST/PATCH/DELETE /recipients` (owner-checked) for the backend.

#### 3.4.7 Layout
- **Sections, in order:** Personal info, Password & sign-in (password, two-factor, sign out of all devices), Payment methods, Saved recipients, Preferences, Delete your account.
- **Desktop:** a left list of sections. **Tablet and phone:** the same sections as a stacked list that opens each panel.
- **Keyboard:** real `tablist` semantics or plain links to `#section`. Pick one, tell me why, and make the URL reflect the open section so it can be linked to.
- Backend-backed sections (personal info, payment methods, preferences, saved recipients, the deletion data effects) use typed `lib/api.ts` functions on mock data. Write each request and response contract into `DEVELOPER_HANDOFF.md`, together with the Cognito pool requirements above.

### 3.5 FAQ (`/faq`)

- **One FAQ list for the whole site.** `/faq` uses the approved landing list (`components/landing/content.ts`, `FAQ_ITEMS`), not the old `components/FAQ.tsx` (Try Risk-Free, 30 days, USD, North America). Move the list to a shared data file if needed, and delete the old component.
- **Update the answers to the PRD as drafts (decision 4).** Draft new answers where the PRD needs them and the list is missing them, marked `DRAFT`:
  - the two free signup credits and the initial image and song cost;
  - Print and Send and Big Sender in CAD and USD;
  - **delivery in Canada and the US**, including across the border (don't promise a delivery time until the provider confirms one);
  - 12-month storage;
  - credits and cards expiring after 15 months;
  - no-login QR playback and download, private by link;
  - Community Cards needing no AI credits;
  - refunds, cancellations and reprints through support (`cameron@souvenote.com`);
  - optional two-factor sign-in with an authenticator app, and what to do if the authenticator is lost (contact support);
  - the answer about reimbursing credits when the customer doesn't like the card, rewritten to the PRD's exactly-once technical-failure rules.
  - Show me the full list, new and changed, before replacing anything on the landing page.
- **Layout:**
  - Group the questions under a few headings (Getting started, Credits and pricing, Delivery, Songs and QR codes, Your account and data).
  - Accordion 2.11, keyboard and screen-reader correct (`button` + `aria-expanded` + `aria-controls`).
  - **Answers are present in the HTML when closed**, for AEO.
  - End with a "Still need help?" panel linking to Contact.
- **`FAQPage` JSON-LD** generated from the same data, so it always matches the visible text.

### 3.6 Contact (`/contact`)

- Restyle onto berry & ivory with `FlowField`. Keep the form: name, email (pre-filled when signed in), subject (a select: card or order, song, account, refund or reprint, something else), and message with a counter.
- **Data:**
  - There's no backend route. Add a typed `submitContactMessage()` to `lib/api.ts`; mock mode stores it in `mockDb`.
  - Document the contract (`POST /support/messages`).
  - **Don't add an email provider.**
  - On success, show a calm confirmation with the reference number.
- **Copy:**
  - No reply-time promise (decision 7). Use *"We read every message and will get back to you as soon as we can."* on the page and in the confirmation. Remove "We read every note and reply within a day" from the FAQ's help panel too.
  - The email card shows `cameron@souvenote.com` from the support constant (decision 6), replacing `hello@souvenote.com`.
  - For order problems, ask for the order reference from the confirmation email (PRD §4).
  - Socials point to the real URLs in `Footer.tsx`.
- Privacy line under the form linking to the Privacy Policy. No marketing opt-in.

### 3.7 Legal pages (`/legal/[slug]`)

- **Design:** a readable long-form layout on paper:
  - about 68 characters per line, h1 with one Lobster Two word, "Last updated" date from `legalVersions.ts`;
  - a sticky table of contents on desktop and a collapsible one on phones;
  - section anchors with visible focus, print styles.
- **Routing:** an unknown slug returns **404, not 500**. Fix the reported 500. Each policy gets its own `generateMetadata` title, description and canonical URL. Keep the four slugs.
- **Content (decision 4), as drafts:**
  - Bring each policy in line with the PRD and the owner's 2026-11-08 decisions: Canada and the US, with CAD and USD; physical cards; 12-month library storage; 15-month credit and card expiry; QR songs private by link and kept for mailed cards; account deletion effects.
  - **Refund Policy:** support-handled cancellations, refunds and reprints, and the remedies in PRD §4 (stopped order, verified defect, confirmed loss). No automatic refunds for delays alone, and no unsupported promises.
  - **Privacy:** what's collected (account, uploads, recipients, payments through Stripe, analytics without personal content), the attestation, and no referral or gift data.
  - **Cookie Policy:** only the cookies and storage the app actually sets. **Audit `localStorage` and `sessionStorage` keys** (`souv_*`), and say if a consent banner is needed.
  - **Terms:** remove anything about Try Risk-Free holds, USD, gifts or referrals.
  - **Privacy and Terms** also mention two-factor sign-in (authenticator app, optional) and the support contact `cameron@souvenote.com`.
  - List every passage a lawyer must confirm, and anything waiting on the owner or provider (cancellation windows, delivery estimates).
- The attestation dialog (`attestationContent.ts`) and `/signup/terms` show these documents too. Make sure they still render, and note whether the attestation text needs the same updates.

### 3.8 Community Cards (`/community-cards`): the real catalog

**Gallery**
- Model it on the Personalize gallery (`PtGallery`, `PtScrollRow`, the occasion chips and search), sharing code where it fits rather than copying.
  - Heading: "Community *Cards*". Lede (approved): *"Choose from our collection of ready to send cards, just add your personal message. No AI credits required."*
  - Occasion rows and chips; search.
- **Catalog data:** a typed, versioned data file (`components/community/catalog.ts`), separate from the components. Each card has: `id`, `version`, name, occasion, orientation, art (placeholder for now), print asset reference (placeholder), `approved: boolean`, and `publicExample: boolean`.
  - Seed it from **Appendix A** (decision 8), using the same occasion filters as Personalize (`OCCASION_FILTERS` in `personalize/catalogue.ts`; share them, don't copy them).
  - The ✓ cards in Appendix A are `publicExample: true`. That's the small selection guests see.
- **Placeholder art:** until approved artwork exists, each tile shows the Souvenote logo on a forest tile, as on the Personalize placeholder tiles, with the card's name.
  - Unlike Personalize's Coming soon tiles, these are **real and sendable** in mock mode.
  - The PRD says unapproved artwork isn't launch-ready. Note in the hand-off that the catalog needs approved, print-ready art before release.
- **Sign-in gate (PRD):**
  - Guests see only the `publicExample` cards, plus a sign-up / sign-in prompt for the full catalog.
  - Direct links to a non-public card also prompt sign-in.
  - Show me how you'll gate it before building.
  - Guest view is indexable with its own metadata; the signed-in full catalog is noindex.
  - Add the page to `sitemap.ts` and remove its "coming soon" metadata.

**Send this card**
- Each tile has a forest pill **"Send this card"**. It opens a `FlowDialog` showing the card front, the **inside message** field and its rules:
  - written by the customer;
  - English, 1–4 short lines, at most 500 characters including the sign-off;
  - a counter;
  - typed text saved exactly;
  - **no AI suggestions, no AI version and no gold**;
  - a "Leave inside blank" choice.
  - Buttons: **Send this card** and **Cancel**.
- The pop-up says plainly that writing and editing the message is free and uses no AI credits. No credit checks run at any point.
- **Send this card** saves a draft (`flow: "community_card"`, card id and version, message) so it appears in Saved Cards & Songs and can be resumed, then goes to **Delivery**.
  - Add `"community"` to `DeliverySource` so Back returns to the gallery.
  - Delivery skips song and QR content for this flow. Checkout uses Print and Send or a Big Sender card, with the no-AI-credit note.
- Signed-out **Send this card** opens the existing sign-up prompt (`AuthGatePrompt`) and comes back to the same card.
- Review: the Delivery and confirmation steps already show the card. Make sure a Community Card shows its front and message there, with no song section.

### 3.9 Remove Refer a Friend, Gift a Souvenote and Redeem Gift (v2)

- **Delete:** `app/refer/`, `app/gift/` (including `redeem/` and their `layout.tsx`), `ReferPage`, `GiftSouvenotePage`, `RedeemGiftPage`, `GiftIco`, `REFER_*`, the gift split in `CartPage.tsx`, `useBlankSouvenoteGiftCount` and its storage, the gift and referral seed data and endpoints in the mock layer, and their CSS.
- **Unlink:** remove them from `sitemap.ts`, the nav, Profile, Settings, and the FAQ and legal text. Also remove the `Footer.tsx` comment that names them.
- **Leave no trace in the code:** no redirects, rewrites, feature flags, "coming soon" pages, or comments or route lists that name them. Remove gift or referral wording from other copy too (for example "Prefer to bundle it?" in Cart, and "everything you need to know about … gifting" on the FAQ).
- **Keep** the general credits module and ledger (PRD §6). The backend has no referral or gift code (checked 2026-11-08). If you find any, list it; don't change the backend.
- Grep the frontend afterwards for `refer` (as in referral), `gift`, `blank souvenote` and `redeem`, and report **zero matches** apart from unrelated words (for example "preferences").

### 3.10 Branded "page not found" (`app/not-found.tsx`)

- **One screen for every address that doesn't exist.** Next.js serves it with a real **404** status. That covers a mistyped URL, an old bookmark to a removed page, an unknown legal slug (call `notFound()`), and a missing draft or card ID where the page already handles that.
- **Content:** a berry & ivory page in the public shell. h1: "We couldn't find *that page*" (Lobster Two on "that page"). One short line ("It may have moved, or the link may be mistyped."). A forest pill **Go to Home** (`/home` when signed in, `/` when signed out), plus text links to Create a Card and Saved Cards & Songs (shown only when signed in), FAQ and Contact.
- `noindex`, its own title ("Page not found | Souvenote"), no structured data. **Don't mention any specific removed feature.**
- Keep the nav and footer, the paper texture and one h1. Check it at 375px, 768px and 1280px.

---

### 3.11 Canada and the United States (decisions 10–12)

These changes touch screens that are already redesigned: Sign Up, `/signup/terms`, Pricing, the Top up pop-up, Cart, Delivery, Checkout and Confirmation. **Change only what this section needs; keep their design and behaviour otherwise.**

- **Price lists:**

  | Offer | CAD (Canada) | USD (United States) |
  |---|---|---|
  | Print and Send | $9.99 | $7.99 |
  | Big Sender 2–10 / 11–20 / 21+ (per card, applied to every card) | $8.99 / $7.99 / $6.99 | $6.99 / $5.99 / $4.99 |
  | Starter / Creator / Power credits | $2 = 10 / $10 = 80 / $25 = 250 | $1.50 = 10 / $8 = 80 / $20 = 250 |
  | Typo or wrong-address replacement | $3.99 | $2.99 |

  - Each card, in both lists, includes 10 AI credits. Credit costs per action are the same in both countries.
  - The frontend fallbacks (`pricingCatalog.ts`, `pricingContent.ts`) and the mock pricing endpoint serve **both lists, by currency**. Nothing prices from a hard-coded number.
  - Pricing structured data lists both currencies, each matching the visible text.
- **Backend catalog:** the live catalog is PostgreSQL (`pricing_catalog`, migrations 006 and 007).
  - **Add migration 008 (owner-approved 2026-11-08)** with the matching seed rows: the USD rows, the Big Sender minimum of 2, the USD top-ups and the USD replacement price. Also retire the old `try_risk_free` USD row if nothing uses it.
  - Like 006 and 007, it's a file to run later, documented in `DEVELOPER_HANDOFF.md`. Don't run it, and don't change backend code.
- **Account country:**
  - Add `country: "CA" | "US"` to the profile type and mock DB. Seed the mock demo account as `CA`. **Existing real accounts need no handling** (owner, 2026-11-08: there are only a few, and they're the owner's).
  - The currency follows the country. The cart and checkout use the account's currency.
  - A cart built while signed out in the other currency re-prices on sign-in, with a calm notice.
  - Purchases keep the currency and amounts they were made in.
  - Write the contract for the backend (`PATCH /auth/me` country; the pricing endpoint filtered by currency).
- **Addresses:** Delivery, saved recipients and the return address take **Canada or the US**.
  - Country first; then province or state, and postal code (A1A 1A1) or ZIP (12345 or 12345-6789), validated for that country.
  - Reuse `DeliveryForm`. Remove any "Canada only" copy.
- **Cross-border postage:** when the sender's country and the recipient's country differ, checkout shows a **"Cross-border postage"** line from a typed per-route table (`CA→US`, `US→CA`), in the account's currency.
  - **It's $0 until Scribeless confirms the rates.** Scribeless prints in both countries with domestic stamps. Hide the line while it's $0, but keep the code path tested.
  - The amount is added before tax and shown before Pay.
- **Tax:** Stripe Tax handles both countries. In mock mode, show a plausible tax line per province or state, labelled as an estimate on the mock badge only. Don't hard-code real rates.
- **Copy:** every "Canada-wide" or "Canadian postage" string on Pricing, Cart, Delivery, the Top up pop-up and the landing page changes to cover both countries. For example, Pricing's *"One flat price, shipping included Canada-wide. Prices in CAD; tax is extra."* becomes *"One flat price, postage included to Canada and the US. Tax is extra."* Propose the full string list in §6.

### 3.12 Upload attestation: a short summary with links (decision 13)

- `BmcAttestationDialog` (used by Build My Card and Personalize) keeps its rules: it opens on photo pick, both confirmations are required, and cancelling discards the photo.
- **But it no longer shows the full legal text.** Replace `ATTG_TERMS` and `ATTG_PRIVACY` in `attestationContent.ts` with a plain summary of about 5 short points:
  - you took the photo or own its rights;
  - everyone identifiable has agreed;
  - only your own children, or with their parent's or guardian's permission;
  - no intimate or degrading images;
  - we use the photo only to make your card, and keep it as the Privacy Policy says.
- **Links** to the final Terms of Service and Privacy Policy open in a new tab.
- **Remove the scroll-to-read gate** (owner, 2026-11-08, after research). Neither Canada nor the US requires it: US courts look for conspicuous notice plus explicit assent (*Meyer v. Uber*, 2d Cir. 2017; *Berman v. Freedom Financial*, 9th Cir. 2022), and *Rudder v. Microsoft* (Ont. 1999) upheld click-to-agree. Instead:
  - **Show the photo-consent promises in full in the pop-up**, not just behind a link. Quebec's Civil Code art. 1435 voids a separate-document term in a consumer contract unless it was expressly brought to the consumer's attention.
  - Each confirmation is its own **unticked** checkbox, with the statement right beside it, and the links sit in the same view.
  - **Record the acceptance:** the attestation text version, the time and the photo batch, on the draft (mock) and in the backend contract.
  - `[LAWYER]` to confirm.
- The only address is cameron@souvenote.com; remove `legal@` and `privacy@`. The two confirmation statements (`ATTG_STATEMENTS`) stay, reworded to match. Propose the wording in §6.

### 3.13 Cookie consent banner (decision 14)

- **A first-visit banner on every page:**
  - one or two sentences, with **Accept** and **Decline** given equal weight, and nothing ticked in advance;
  - a link to the Cookie Policy;
  - berry & ivory, not blocking the page, keyboard and screen-reader correct, and not covering inputs on phones.
- **Store the choice** in `souv_cookie_consent` with a date and the policy version, and show the banner again when the version changes. A footer **"Cookie settings"** link reopens it.
- **Analytics stays off until Accept.** PostHog isn't installed yet.
  - Add a small `lib/analytics.ts` loader that does nothing unless consent is given **and** an analytics key is configured.
  - Don't add the PostHog package (ask me first). Write the PostHog set-up steps into the hand-off.
- Mock mode: the Mock data badge can reset the consent choice.

## 4. Implementation rules

- **Code:** clean Next.js App Router and TypeScript.
  - Server components for static content (FAQ, legal, the Community guest view); client components only where state is needed.
  - Typed data files separate from components.
  - No `any`, console logs, TODOs or dead code.
  - Remove the CSS and components these screens replace once nothing imports them.
- **Keep intact:** auth, credits, draft persistence and resume, the Delivery hand-off, checkout, pricing, analytics, mock data mode, and every already-redesigned screen. Don't change Build My Card or Personalize behaviour.
- **No changes** to the backend, environment variables or deployment. The one exception is migration 008 (§3.11, approved). No new dependencies without asking me.
- **Analytics and error reports** never include card text, messages, recipient names or addresses (PRD privacy).
- **Accessibility:**
  - every control labelled;
  - 44px targets;
  - visible 2px focus ring;
  - errors announced;
  - dialogs trap focus and return it;
  - reduced motion respected;
  - one h1 per page;
  - no horizontal overflow at 375px.
- **Metadata:** each public page gets its own title, description and canonical URL. Account pages, Saved Cards and signed-in Community Cards are `noindex`, as well as auth-protected.
- Add each change to `build-fixes/mock-data-mode-2026-11-07/CHANGELOG.md`. **Don't commit or push**; everything is committed together at the end of the session.
- Document new components (Saved Cards card row with expiry and Print and send, the settings section list, saved-recipient row, the delete-account dialog, legal long-form layout and table of contents, the Community Card tile and message dialog) in `design-system/docs/02-components.md` and `reference/index.html`. Bump the version in `06-governance.md` and update its "Scope today" tables.
- Save a `saved-ui/` snapshot of the current versions of these screens before replacing them (see `saved-ui/README.md`).

## 5. Verify

- Run type-check, lint, `npm test` and `npm run build`.
- In mock data mode, at 375px, 768px and 1280px, walk through these cases:
  - **Saved Cards:**
    - drafts resume into the right BMC, Personalize or Community stage, old-format drafts included;
    - the expiry date is 12 months from the last saved edit, and viewing doesn't move it;
    - **Print and send** shows the catalog price and reaches Delivery with the existing art and song, using no credits;
    - empty states.
  - **Profile:** no gift or referral traces; the balances and expiry show; the links work.
  - **Settings:**
    - change password: wrong current password, a weak new password, success with and without "Also sign out of other devices";
    - two-factor: turn on (QR code and copyable secret, wrong code, right code), then log out and back in with the code step (wrong code, then right code), then turn off;
    - sign out of all devices;
    - no Notifications tab, no device count, no Deactivate, no reminders toggle;
    - Google, Facebook and Apple accounts hide password and two-factor and show the provider line;
    - payment methods (not hand-tested before; test them now);
    - preferences unchanged;
    - saved recipients: create, edit and delete;
    - Delivery's "Save this recipient" and the selector, where editing the order doesn't change the saved entry;
    - Delete account: the explainer, typed confirmation, then signed out.
  - **FAQ:**
    - one list shared with the landing page;
    - answers in the HTML while closed;
    - the accordion by keyboard;
    - the JSON-LD validates and matches the text.
  - **Contact:** validation errors, the pre-filled email, a successful send, the stored record in mock data.
  - **Legal:** all four slugs; an unknown slug gives 404; the table of contents by keyboard; print preview; the attestation and `/signup/terms` still render.
  - **Community Cards:**
    - guest sees only the public examples and the sign-in prompt, and a direct link to a full-catalog card is gated;
    - signed in sees the full catalog;
    - Send this card: the message rules, blank inside, Cancel;
    - Delivery and checkout with no song or QR and no credit change;
    - the draft appears in Saved Cards.
  - **Removed features:** `/refer`, `/gift` and `/gift/redeem` show the branded not-found page with a 404 status, the same as `/banana`. The grep in §3.9 finds nothing.
  - **Not-found page:** signed in and signed out (the right Home link), and `noindex`.
  - **Canada and the US:**
    - sign-up country required, CA or US only;
    - CAD and USD accounts see their own prices everywhere (Pricing, Top up, Cart, Saved Cards' Print and send);
    - the signed-out price switch;
    - read-only currency in Settings;
    - US addresses with state and ZIP validation;
    - a CA→US and a US→CA order (the cross-border line hidden at $0, and shown when the table has an amount);
    - Big Sender rejects 1;
    - the Pricing storage line says 12 months.
  - **Attestation:** the summary, the links, both confirmations required, cancel discards the photo.
  - **Cookie banner:** first visit; Accept and Decline; the choice stored; the footer link reopens it; the analytics loader stays inactive after Decline and with no key.
  - **Support contact:** `cameron@souvenote.com` everywhere, from the one constant, and no reply-time promise anywhere.
  - **The already-redesigned screens still work:** Home, Create Options, Pricing, Cart, Delivery, BMC and Personalize.
  - **Keyboard-only** and **reduced-motion** runs.

## 6. Before you edit, give me a short summary of:

1. The current routes, components, data and the places that read them, for every screen in scope.
2. How you'll build §3.4 on today's `cognitoAuth.ts` and `mockCognito.ts`, and anything in the code that contradicts the Cognito findings.
3. Anything in `FAQ_AND_LEGAL_DRAFTS.md` (FAQ and the four policies) that doesn't match how the code actually behaves.
4. Any browser-storage keys or cookies the drafts' Cookie Policy table misses.
5. The guest gate and the Community Card draft shape (the catalog is Appendix A).
6. The full Canada and US copy changes (§3.11), the attestation summary wording (§3.12), and the cookie banner copy (§3.13).
7. Everything you'll delete for Refer, Gift and Redeem, and any backend fields you found.
8. What you'll share or reuse from the redesigned screens, and the old CSS and components that will be removed.
9. Problems you found in the existing code, or contradictions between the PRD, the task brief and the current app.

## 7. After you build, give me:

1. The changed and deleted files.
2. The responsive behaviour (phone, tablet, desktop).
3. The AEO/GEO and metadata handling (indexed vs noindex, sitemap, JSON-LD).
4. The API contracts added for the backend (recipients, contact, account deletion, settings) and the Cognito user-pool requirements (optional TOTP MFA, email recovery, device tracking off).
5. The commands you ran and their results.
6. Problems that were already there and are still there.

---

## Appendix A: Community Cards seed catalog (owner-approved 2026-11-08)

These are original card names, all **portrait** unless marked (L) for landscape. ✓ = `publicExample: true` (the guest selection: one per main occasion, 8 in all). Every tile uses the logo placeholder until approved, print-ready artwork exists. Approved by the owner on 2026-11-08.

| Occasion | Cards |
|---|---|
| Birthday | Another Lap Around the Sun ✓ · Make a Wish · Cake First, Questions Later · Confetti Morning (L) · Golden Year |
| Anniversary | Still My Favourite ✓ · Year After Year · Two Coffees, One Table (L) · Here's to Us |
| Wedding | Happily Ever Starts Today ✓ · Two Hearts, One Home · Something Borrowed, Something New · The First Dance (L) |
| Valentine's Day | Be Mine, Always ✓ · You Had Me at Hello · Love Letters · Sweet on You |
| Mother's Day | For the Heart of Our Home ✓ · Mom, You're the Best · Garden of Thanks · Wisdom & Warmth |
| Father's Day | Dad, the Original Hero · Grill Master · Gone Fishing (L) · Thanks for Everything, Dad |
| Thank You | With Heartfelt Thanks ✓ · You Made My Day · Grateful for You · A Little Thank-You Bouquet |
| Graduation | The Tassel Was Worth the Hassle · Onward & Upward · Cap, Gown & Big Dreams · Class Act |
| New Baby | Welcome, Little One ✓ · Tiny Toes, Big Love · Hello, World · Brand New Bundle |
| Congratulations | You Did It! · Cheers to You · Big News, Bigger Smiles · Well Deserved |
| Holiday | Warmest Wishes of the Season ✓ · Snowy Pines (L) · Merry & Bright · Joy to Your Home · Happy New Year |
| Get Well | Get Well Soon, Friend · Sending Sunshine · Rest, Heal, Repeat · Thinking of You |
| Sympathy | With Deepest Sympathy · Forever in Our Hearts · Gentle Thoughts · Remembering With Love |
| Just Because | Just Because · Thinking of You Today · You're One of a Kind · Hello From Me (L) |

Sympathy and Get Well cards stay calm in name and art (no jokes). None of the names may copy an existing brand's card line; replace any that do.
