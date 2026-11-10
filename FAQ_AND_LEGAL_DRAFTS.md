# Souvenote: FAQ and legal drafts (for owner and lawyer review)

**Status:** DRAFT, revised 2026-11-08 for **Canada and the United States**. Not approved and not legal advice. Before launch, the four policies need review by a lawyer qualified in **Canadian (BC) and US consumer and privacy law** (checklist in §8).

**Sources:** the facts below come from:
- `reference-materials/Souvenote MVP-PRD.pdf` (1 Nov 2026);
- owner decisions in `DEVELOPER_HANDOFF.md`, `build-fixes/*/CHANGELOG.md`, `REMAINING_SCREENS_BUILD_PROMPT.md`, and the owner's answers on 2026-11-08 (§2);
- the frontend code on `mock-data-mode`;
- the database seed and migrations;
- Scribeless's public pricing page (checked 2026-11-08).

**What it's for:** `REMAINING_SCREENS_BUILD_PROMPT.md` §3.5 and §3.7 use this file as the starting text. Owner decisions here win over the PRD.

**Placeholder markers:**
- `[NEEDS OWNER]`: a fact only the owner can supply.
- `[NEEDS PROVIDER]`: waiting on Scribeless, Stripe or a music provider.
- `[LAWYER]`: wording that must be legally checked.

---

## 1. Fact sheet (what the drafts rely on)

| Topic | Fact | Source |
|---|---|---|
| What it is | Personalized physical greeting cards (5×7) with AI-assisted artwork or ready-made Community Cards, an inside message, and an optional 30–45 second song played from a printed QR code | PRD §1 |
| Where | **Canada and the United States.** Customers in either country can mail cards to addresses in either country | Owner 2026-11-08 (overrides PRD: US was v2) |
| Account country | Chosen at sign-up: Canada or United States. It sets the account's price list and currency. The Settings currency is read-only and follows the country; to change country, contact support | Owner 2026-11-08 |
| Sign-in | Email and password, Google, Apple, Facebook (AWS Cognito). Optional authenticator-app two-factor for email accounts | PRD, owner 2026-11-08 |
| Free credits | 2 AI credits once per new account, no payment details needed | PRD §3 |
| Credit costs | Image + song: 2 credits. Image only: 1. New image: 1. Replacement song: 1 | PRD §4, owner |
| Free text help | Initial inside-message and lyric drafts are free. Each card gets up to **5 free AI rewrites** of the message and **5** of the lyrics; lyric rewrites close once the first song is made | PRD §4 |
| Failed generation | Credits for a failed image or song are returned automatically, once. These are credit returns, not cash refunds | PRD §9 |
| Prices | See the price table below | Owner 2026-11-05/06 and 2026-11-08 |
| Cross-border postage | A card mailed across the border may carry a postage adjustment, shown and added at checkout. Scribeless prints in the US and Canada and uses domestic stamps from each, so the adjustment is expected to be small or nothing (it's set to $0 until Scribeless confirms) | Owner 2026-11-08, scribeless.co/pricing `[NEEDS PROVIDER]` |
| Tax | Stripe Tax works out Canadian GST/HST/PST and US state and local sales tax at checkout | Owner 2026-11-08 |
| Expiry | AI credits (signup ones included) and unused Big Sender cards expire **12 months** after purchase or grant (owner, 2026-11-08; the PRD said 15) | PRD §4 `[LAWYER]` |
| Library storage | Drafts and finished cards are kept **12 months from the last saved edit**, and the date is shown. There's no Extend button | PRD §5, owner 2026-11-08 |
| QR song | Plays and downloads with no login. **Private by link.** It shows no artwork or message, isn't indexed, and stays available **indefinitely** for mailed cards | PRD §5 |
| Uploads | JPEG, PNG or WEBP, up to 16 photos, with a rights attestation (a short summary linking to Terms and Privacy). Moderated. Uncommitted uploads are deleted after **24 hours** | PRD §9, owner 2026-11-08 |
| Support | All cancellations, refunds and reprints go through **cameron@souvenote.com**. There's no self-service returns portal and no My Orders page | PRD §4, owner |
| Privacy Officer | **Cameron**, cameron@souvenote.com | Owner 2026-11-08 |
| Governing law | **British Columbia** and the federal laws of Canada | Owner 2026-11-08 |
| Emails | Account, purchase and order confirmations only. **No marketing emails, and no marketing opt-in** | PRD, owner 2026-11-08 |
| Analytics | PostHog **with cookies**, **off until the visitor agrees** in a consent banner | Owner 2026-11-08 |
| Unused purchases | An unused credit top-up or unused Big Sender pack can be refunded in full within **14 days** of purchase. After that, no refund except where the law requires | Owner 2026-11-08 |
| Delivery time | **Not confirmed**, so no estimate may be promised yet | `[NEEDS PROVIDER]` |
| Providers (provisional) | AWS (Cognito, S3, Bedrock with Claude Haiku 5.5, Rekognition, Guardrails), fal.ai (GPT Image 2.5 Flare artwork, Lyria 3.5 music), Stripe and Stripe Tax, Scribeless (print and mail), SendGrid (email), PostHog (analytics), Sentry (errors) | PRD tech table |
| Sign-up fields | Email, password, country (Canada or United States, required), birthday (optional), Terms (required). The step line reads "Set your login details." | Owner 2026-11-08 |

**Prices**

| Offer | Canada (CAD) | United States (USD) | Included |
|---|---|---|---|
| Print and Send (1 card) | $9.99 | $7.99 | Printing, envelope, postage, 10 AI credits |
| Big Sender, 2–10 cards | $8.99 / card | $6.99 / card | The same per card |
| Big Sender, 11–20 cards | $7.99 / card | $5.99 / card | The same per card |
| Big Sender, 21+ cards | $6.99 / card | $4.99 / card | The same per card; no maximum |
| Starter credits | $2 = 10 | $1.50 = 10 | |
| Creator credits | $10 = 80 | $8 = 80 | |
| Power credits | $25 = 250 | $20 = 250 | |
| Replacement for your own typo or wrong address | $3.99 | $2.99 | One per card; printing, envelope and postage included |

The Big Sender tier price applies to every card in the purchase. **The minimum is 2**; 1 card is Print and Send. All prices are before tax.

## 2. Decisions and open conflicts

**Settled by the owner, 2026-11-08**
1. **Storage is 12 months.** Fix the Pricing page's *"saved … for 15 months"* line (Big Sender "Always saved").
2. **The Big Sender minimum is 2.** `BIG_SENDER_TIERS` changes from "1–10" to "2–10".
3. **The marketing opt-in is removed** from Sign Up and `/signup/terms`. No marketing emails in MVP.
4. **The sign-up step line** reads "Set your login details."
5. **Canada and the US are both in MVP.** Each country has its own price list, and the account's country is fixed at sign-up.
6. **The attestation pop-up** becomes a short photo-consent summary with links to the final Terms and Privacy Policy. The only address is cameron@souvenote.com, so `legal@` and `privacy@` are gone.
7. **Analytics uses cookies**, behind a consent banner.
8. **Unused top-ups and packs:** a full refund within 14 days if unused.
9. **The Privacy Officer is Cameron. Governing law is British Columbia.**
10. **An "unused" pack** means no card sent and no included AI credit spent.
11. **The attestation has no scroll gate.** The photo-consent promises are shown in full in the pop-up, with unticked checkboxes, links to the full Terms and Privacy Policy, and the accepted version and time recorded. Clickwrap is accepted in both countries (*Meyer v. Uber*, 2d Cir. 2017; *Berman v. Freedom Financial*, 9th Cir. 2022; *Rudder v. Microsoft*, Ont. 1999). Quebec CCQ art. 1435 needs separate-document terms expressly brought to the consumer's attention, which is why the promises are shown in the pop-up itself. `[LAWYER]` to confirm.
12. **Analytics:** the banner and loader are built now; PostHog is added later, once there's an account and key.

**Still open**
13. **Credit and card expiry vs. prepaid rules.** `[LAWYER]` **High priority.** Some provinces (Ontario, Quebec and others) and some US states (California, for example) restrict expiry dates on gift cards and prepaid value. Confirm whether AI credits and Big Sender cards bought for your own use are covered, and whether the 12-month expiry can be published as is.
14. **Data outside Canada and US state privacy laws.** `[LAWYER]` Data is processed in Canada and the US. Canadian disclosure (PIPEDA, and Quebec Law 25's transfer assessment) applies to Canadian customers. For US customers, check which state privacy laws apply at Souvenote's size (for example California's CCPA/CPRA thresholds), and whether the "your rights" section needs state-specific wording.
15. **US consumer terms.** `[LAWYER]` BC governing law for US consumers, any dispute-resolution clause (the draft adds no arbitration), and whether US state auto-renewal and gift laws touch anything. Nothing renews automatically today.
16. **Souvenote isn't incorporated yet** (owner, 2026-11-08). Keep `[NEEDS OWNER: legal entity]` in the Privacy Policy and Terms. **The policies can't go live until the business is registered** (BC is the intended governing law) and the name and address are filled in.
17. **Cross-border postage amounts.** `[NEEDS PROVIDER]` Confirm with Scribeless whether US↔Canada cards go out from the destination's facility at domestic rates. Until then, the adjustment is $0.

---

## 3. FAQ (one list for `/faq` and the landing page)

Grouped for `/faq`. The landing page can show the first six, marked ★. Every answer is visible text, so `FAQPage` structured data can mirror it exactly. Kept or changed answers are marked; everything else is new. Prices appear in both currencies on public pages. Signed-in pages may show only the account's own currency.

### Getting started

**★ What is Souvenote?** *(new)*
Souvenote helps you create a personal greeting card, print it and mail it anywhere in Canada or the United States. Design your own with our AI-assisted builder, personalize one of our templates, or choose a ready-made Community Card. AI-made cards can include an original 30–45 second song, which your recipient plays by scanning a QR code printed inside.

**★ Is it free to try?** *(new)*
Yes. Every new account gets 2 free AI credits, with no payment details needed. That's enough to create your first card with artwork and a song, review it, and save it. You only pay when you're ready to print and mail it, or if you want more credits to keep creating.

**What are the ways to make a card?** *(new)*
- **Build My Card:** answer a few friendly questions, one at a time, and we design an original card around your answers, with an optional photo.
- **Personalize a Template:** pick one of our designs and add your details.
- **Community Cards:** choose a ready-made design and write your own message inside. No AI credits are used.

**Do I need an account?** *(new)*
You can read about Souvenote, browse every Community Card and see a few example templates without one. To create, save or send a card, and to browse the full template collection, you'll need a free account. You can sign up with email or with Google, Apple or Facebook. You'll choose Canada or the United States when you sign up. That sets the prices and currency you see.

### Credits and pricing

**★ How much does it cost to send a card?** *(new)*
Print and Send is **$9.99 CAD** in Canada or **$7.99 USD** in the United States, per card. It includes printing, an envelope, postage and 10 AI credits for your next creations.

Sending more? **Big Sender** packs of 2 or more cards save you money:

| Cards | Canada | United States |
|---|---|---|
| 2–10 | $8.99 CAD each | $6.99 USD each |
| 11–20 | $7.99 CAD each | $5.99 USD each |
| 21 or more | $6.99 CAD each | $4.99 USD each |

The price for your quantity applies to every card in the pack, and each card includes 10 AI credits. Tax is added at checkout.

**How do credits work?** *(new)*
Credits are used when AI creates something for you:
- **A new card with artwork and a song:** 2 credits.
- **Artwork only:** 1 credit.
- **New artwork:** 1 credit.
- **A replacement song:** 1 credit.

Drafting your inside message and lyrics is free. Each card also comes with up to 5 free AI rewrites of the message and 5 of the lyrics. Lyric rewrites are available until the first song is made. Editing any text yourself is always free. We always show the cost before you spend a credit.

**★ Can I buy creation credits without buying a card?** *(kept, approved; prices added)*
Yes. You can top up creation credits on the Pricing page at any time, without ordering a printed card. One credit covers one action (generating a design, editing an image, or creating an optional QR-code song), so you can explore ideas first and print only when you're ready.
> Starter: 10 credits for $2 CAD / $1.50 USD. Creator: 80 for $10 CAD / $8 USD. Power: 250 for $25 CAD / $20 USD. Plus tax.

**Do credits or cards expire?** *(new, `[LAWYER]` item 13)*
AI credits, including your 2 free signup credits, expire 12 months after you buy or receive them. Unused Big Sender cards also expire 12 months after purchase. Your balance and expiry dates are shown in your account.

**What happens if a creation fails?** *(replaces "What happens if I don't like my card?")*
If an image or song can't be made because of a technical problem, the credits for that item come back to your balance automatically. Anything that was made successfully is kept. If you're unhappy with a result, you can edit the text for free, or make new artwork or a new song for 1 credit. If something seems wrong, email us at cameron@souvenote.com.

**What payment methods do you accept?** *(changed: no more "toggle prices between USD and CAD")*
We accept major credit and debit cards through our secure payment partner, Stripe. Apple Pay and Google Pay work where your device supports them `[CONFIRM in Stripe]`. Canadian accounts pay in Canadian dollars and US accounts in US dollars. Tax is added at checkout.

### Delivery

**★ Where do you deliver, and how long does it take?** *(changed: was "5–7 business days across North America")*
We print and mail cards to addresses in Canada and the United States, and you can send across the border. Delivery times depend on our print and mailing partner and the destination. We'll show an estimate at checkout where one is available `[NEEDS PROVIDER]`. We can't guarantee arrival by a specific date, so please order early for special occasions.

**Does it cost more to mail across the border?** *(new)*
If a card is going from Canada to the US, or from the US to Canada, any postage difference is shown and added at checkout before you pay. `[NEEDS PROVIDER: if Scribeless confirms it's $0, change this to "No, the price is the same."]`

**Can I send the same card to several people?** *(new)*
Yes. With a Big Sender pack you can send the same design to everyone, or a different card to each person. Each card uses one card from your pack.

**Can I save addresses?** *(new)*
Yes. When you send a card you can tick "Save this recipient" to keep their name and mailing address in your account, then choose them next time. You can edit or delete saved recipients in Account Settings. Changes never affect a card that's already been ordered.

**Will I get tracking?** *(new)*
Not yet. We email you a receipt when you pay and a confirmation when your order is placed. Tracking updates aren't available at the moment.

### Songs and QR codes

**What does a personalized song sound like?** *(changed)*
Songs are optional. If you include one, it's an original 30–45 second song made from the details you share: vocal (with lyrics you write or approve), or instrumental. With Build My Card you choose the musical style. Templates come with a style chosen for that design. We print a QR code inside the card so your recipient can listen.

**How does my recipient hear the song?** *(new)*
They scan the QR code with their phone camera. A simple music page opens where they can play and download the song. They don't need an account or an app. The page shows only the song, not your card or message.

**Who can hear the song?** *(new)*
The song is private by link: anyone who has the QR code or its link can listen, and the page isn't listed in search engines. Please keep that in mind when choosing what goes into the lyrics.

**How long does the song stay available?** *(new)*
For cards that have been mailed, the song stays available through its QR code indefinitely, even after the card leaves your Saved Cards & Songs or you delete your account. To have a mailed card's song removed, email cameron@souvenote.com. Once it's removed, the QR code will stop working.

### Your cards and account

**Can I save my card and finish later?** *(changed: was "30 days")*
Yes. Your drafts and finished cards are saved automatically in Saved Cards & Songs for 12 months from the last time you edited them, and the date is shown on each one. Each time you save a change, the 12 months start again. Opening or viewing a card doesn't.

**Can I send a saved card again?** *(new)*
Yes. Choose **Print and send** on any finished card in Saved Cards & Songs. You can change the recipient and edit the inside message for free. Reusing the artwork and song costs no credits; you just pay for the card with Print and Send or use a card from a Big Sender pack.

**Are Community Cards free?** *(new)*
Choosing a Community Card and writing your message is free and uses no AI credits. Community Cards don't include a song. You pay for the printed card with Print and Send ($9.99 CAD / $7.99 USD) or with a card from a Big Sender pack.

**Can I add my own design to Community Cards?** *(new, 2026-11-09)*
Yes. Choose Build a card for the Community on the Community Cards page and design the front in Build My Card with your credits (a community card has no song and isn't made from photos). Then choose Share to Community Cards. Our team reviews every card against the Community Cards guidelines before it's posted, and only you can see it until then. Shared cards are posted without your name and aren't paid for. Anyone can share a Community Card's link to social media.

**Can I use my own photos?** *(new)*
Yes, in Build My Card and Personalize a Template. You can upload JPEG, PNG or WEBP photos. Before uploading, you'll confirm that you own the photo, or have permission to use it, and that everyone in it has agreed. Photos you upload but don't use are deleted after 24 hours.

**How do I keep my account secure?** *(new)*
Use a strong password. You can also turn on two-step sign-in with an authenticator app (Google Authenticator or 1Password, for example) in Account Settings. If you sign in with Google, Apple or Facebook, your password and two-step sign-in are managed by that account. If you lose access to your authenticator, email cameron@souvenote.com and we'll help you back in after confirming it's you.

**Can I change my country?** *(new)*
Your country is set when you sign up, and it decides your prices and currency. If you move, email cameron@souvenote.com and we'll help. Credits and cards you've already bought keep their original value.

**How do I delete my account?** *(new)*
Go to Account Settings, then Delete your account. This removes your profile, saved recipients, and your saved cards and songs. Songs on cards you've already mailed keep working for their recipients, and we keep the order and payment records the law requires. Any unused credits and cards are lost. `[LAWYER]`

**How do I cancel an order or get a refund?** *(new)*
Email cameron@souvenote.com with the order reference from your confirmation email. We'll try to stop the order with our print partner, but once a card is in production it can't be cancelled. If your card arrives damaged or misprinted, or is confirmed lost, we'll offer a free replacement or a refund for that card. Unused credit top-ups and Big Sender packs can be refunded within 14 days. See our Refund Policy for the details.

**How do I contact you?** *(new)*
Email cameron@souvenote.com or use our Contact page. We read every message and will get back to you as soon as we can.

---

## 4. Privacy Policy (draft)

**Last updated:** `[on approval]` · Applies to souvenote.com and the Souvenote app, for customers in Canada and the United States.

**Who we are.** Souvenote (`[NEEDS OWNER: legal entity name and address]`, British Columbia, Canada) is responsible for the personal information described here. Our Privacy Officer is **Cameron**, reachable at **cameron@souvenote.com**.

**What we collect**
- **Account details:** your email, your name, a password (stored by our sign-in provider, never by us in readable form), your country (Canada or United States), and, if you choose to give them, your birthday and phone number. If you sign in with Google, Apple or Facebook, we receive your name and email from that provider.
- **What you create:** answers you give while making a card, photos you upload, descriptions, names and details you mention, captions, inside messages, lyrics, and the artwork and songs made for you.
- **Recipients:** the names and mailing addresses you enter to send a card, and any you choose to save.
- **Purchases:** what you bought, prices, taxes, credit and card balances, and order references. Card payments are handled by Stripe. We don't see or store your full card number.
- **Support:** messages you send us.
- **Technical information:** device and browser type, pages visited, and error reports. These are collected without your card text, messages, recipient details, photos or songs. Analytics cookies are used **only if you agree** (see our Cookie Policy).

**How we use it**
- To create your cards and songs, save them, print and mail them, take payment and work out tax.
- To run your account, keep it secure, and provide support.
- To prevent abuse and keep people safe. We check uploaded photos and generated content against our acceptable-use rules, which may include automated moderation.
- With your consent, to understand and improve how Souvenote is used.
- To meet legal, tax and accounting obligations.

We **don't** sell or share your personal information for advertising, we don't use your photos to identify people or build facial recognition profiles, and we don't send marketing emails. We only email you about your account and your purchases and orders. `[LAWYER: confirm "sell/share" wording for US state laws.]`

**AI processing.** To create your card we send the relevant parts of your answers, photos and text to AI services, which process them only to produce your result:
- **Claude** on Amazon Bedrock: questions and text;
- fal.ai image and music models: artwork and songs.

`[LAWYER/PROVIDER: confirm each provider's terms say customer content isn't used to train their models, and say so here only if confirmed.]`

**Who we share it with.** We share only what each service needs to do its job:
- cloud hosting and storage (Amazon Web Services);
- sign-in (Amazon Cognito);
- AI generation (Amazon Bedrock, fal.ai);
- payments and tax (Stripe);
- printing and mailing (Scribeless, with facilities in Canada and the US), which receives the card files and the recipient's and return mailing addresses;
- email (SendGrid);
- product analytics (PostHog, only with your consent) and error monitoring (Sentry), set up to leave out personal content.

We may also disclose information when the law requires it, to enforce our Terms, or to respond to credible safety reports. `[PROVIDER: update this list when providers are final.]`

**Where it's stored.** Your information is stored and processed in Canada and the United States, and possibly other countries where our providers operate. Information held outside your country may be accessed by authorities under that country's law. `[LAWYER]`

**The song link.** A song on a mailed card can be heard by anyone who has its QR code or link. The music page shows only the song, not your card, message or details, and it's hidden from search engines.

**How long we keep it**

| Information | How long |
|---|---|
| Photos you upload but don't use | Deleted after 24 hours |
| Drafts and finished cards in Saved Cards & Songs | 12 months from your last saved edit, then deleted |
| Songs on mailed cards | Kept so the QR code keeps working, until you ask us to remove one |
| Saved recipients | Until you delete them or your account |
| Orders, payments and tax records | As long as the law requires `[LAWYER: periods for Canada and the US]` |
| Account | Until you delete it |

**Your choices and rights.** You can see and update your details in Account Settings, delete saved recipients and cards, delete your account, and change your cookie choices at any time. You can also ask us for a copy of your personal information, ask us to correct or delete it, or withdraw consent, by emailing cameron@souvenote.com. We may need to confirm it's you first, and we won't treat you differently for using your rights.
- **In Canada:** if you're not satisfied with our answer, you can complain to the Office of the Privacy Commissioner of Canada, or your provincial commissioner.
- **In the United States:** depending on your state, you may have more rights under state privacy law. `[LAWYER: state-specific wording if any state law applies.]`

**Deleting your account** removes your profile, saved recipients and Saved Cards & Songs. Songs on cards you've already mailed keep working for their recipients unless you ask us to remove them. Order and payment records we must keep are held separately. We can't recall cards that have already been mailed.

**Children.** Souvenote is for adults and isn't directed to children under 13 or to minors. You must be the age of majority where you live (18 or 19 in Canada, depending on the province; 18 in most US states) to have an account. Only upload photos of children if you're their parent or guardian, or have their parent's or guardian's permission. `[LAWYER]`

**Security.** Data is encrypted in transit, photos and songs are kept in private storage, access is limited, and two-step sign-in is available. No system is perfectly secure. If a breach puts you at risk, we'll tell you and the relevant authorities as the law requires.

**Changes.** We'll update the date above and, for important changes, tell you by email or in the app.

---

## 5. Terms of Service (draft)

**Last updated:** `[on approval]`

1. **About these terms.** These terms are an agreement between you and `[NEEDS OWNER: legal entity]` ("Souvenote", "we") for using souvenote.com. By creating an account or placing an order you accept them, together with our Privacy Policy, Refund Policy and Cookie Policy.
2. **Who can use Souvenote.** You must live in Canada or the United States and be the age of majority where you live. You choose your country at sign-up. Each account is for one person. Keep your sign-in details safe; you're responsible for activity on your account. We offer optional two-step sign-in.
3. **What we provide.** Souvenote lets you create greeting cards with AI-assisted artwork, personalized templates or ready-made Community Cards, write an inside message, add an optional AI-made song played by QR code, and have the card printed and mailed to an address in Canada or the United States. Features may change.
4. **Credits, cards and prices**
   - New accounts receive 2 free AI credits once.
   - Credits are spent as shown before each action. Text drafting, and up to 5 AI rewrites each of the message and lyrics per card, are free.
   - **Prices depend on your account's country:** Canadian dollars for Canada and US dollars for the United States. Tax is added at checkout. Any cross-border postage adjustment is shown before you pay.
   - The price you accept at checkout is the price you pay; later price changes don't affect completed purchases.
   - Print and Send and each Big Sender card cover one printed card, envelope and postage, and include 10 AI credits.
   - **Credits and unused Big Sender cards expire 12 months after purchase or grant.** `[LAWYER, item 13]`
   - Credits and cards have no cash value, can't be transferred, and aren't refundable except as our Refund Policy describes or the law requires.
   - If a generation fails for technical reasons, its credits are returned automatically.
5. **Your content**
   - You keep the rights you have in the photos and words you provide.
   - You give us permission to use them, and to have our service providers use them, only to create, store, print, mail and play your cards and songs, and to keep the service safe.
   - You promise that you own, or have permission to use, every photo you upload, and that everyone identifiable in it has agreed. You also promise that nothing you provide breaks the law or someone else's rights.
   - **Cards you share to Community Cards.** You can offer a card you designed in Build My Card to the public Community Cards collection. Our team reviews every card against the Community Cards guidelines (on the Community Cards page) before it's posted, and we may decline it, ask for a change, or remove it at any time. *(added 2026-11-09; in `legalDocs.ts`)*
   - If we post your card, you give us a non-exclusive, worldwide, royalty-free permission to show, print, sell and mail it to other customers, to let anyone share its link, and to use it to promote Community Cards, for as long as it's posted. Shared cards are posted without the creator's name, and we don't pay for them or give credits in return (owner decision, 2026-11-09). You can ask us to take it down at any time; cards already ordered will still be printed and mailed. `[LAWYER, item 10]`
   - You promise that a card you share is your own design, and that it doesn't show a real, recognizable person or use anyone else's characters, logos, artwork, lyrics or personal details. Cards made from your own photos can't be shared. AI-made artwork may not be protected by copyright, so we can't promise that no one else will make a similar card.
   - If you think a Community Card uses your work or shows you, email **cameron@souvenote.com** with the card's name and link. We review every report and remove cards where appropriate.
6. **What you get.** Subject to these terms, you may use the cards and songs made for you for personal, non-commercial purposes, such as sending, sharing and keeping them. The Souvenote name, our designs, templates and Community Cards (other than cards customers share, covered in section 5), and our software remain ours. `[LAWYER: confirm against each AI provider's output-rights terms.]`
7. **AI results.** AI results can be imperfect: likenesses may not be exact, and words or names in artwork may be misspelled. **You're responsible for reviewing the artwork, message, lyrics and song before you order.** Once you approve and order a card, we print it as approved.
8. **Acceptable use.** Don't use Souvenote to:
   - create content that's unlawful, hateful, harassing, sexually explicit or violent;
   - create content that shows a real person in a false, intimate or degrading way;
   - impersonate anyone;
   - infringe someone's rights;
   - upload photos of people who haven't agreed;
   - try to break, overload or copy the service.

   We may refuse to generate or print content, remove it, cancel an order (with a refund of what you paid for it), or suspend an account that breaks these rules.
9. **Orders and delivery**
   - Orders are printed and mailed by our partner to the address you approve in Canada or the United States. Please check it carefully.
   - We email a receipt and an order confirmation.
   - Delivery dates are estimates, not guarantees.
   - Cancellations, refunds and replacements are handled as described in the Refund Policy.
10. **The song link.** Songs on mailed cards are available to anyone with the QR code or link, and stay available after your library entry expires or your account is deleted, unless you ask us to remove them.
11. **Storage.** Saved cards are kept for 12 months from your last saved edit, then deleted. Download anything you want to keep.
12. **Ending your account.** You can delete your account at any time in Account Settings; unused credits and cards are lost, except for a refund you're entitled to under the Refund Policy. We may suspend or close accounts that break these terms.
13. **Liability.** `[LAWYER: Canadian provinces (Quebec especially) and US states limit what a business can exclude for consumers. Draft to respect both.]` To the extent the law allows, we're not responsible for indirect losses, and our total responsibility for a claim is limited to what you paid us for the order or purchase involved. Nothing in these terms limits rights you have under consumer protection law where you live.
14. **Changes.** We may update these terms. For important changes we'll tell you in advance by email or in the app, and you'll be asked to accept them before continuing.
15. **Law.** These terms are governed by the laws of **British Columbia** and the federal laws of Canada that apply. This doesn't take away consumer rights you have where you live, including in your own province or US state. `[LAWYER: confirm this works for US consumers; no arbitration clause is included.]`
16. **Contact.** cameron@souvenote.com.

---

## 6. Refund and Cancellation Policy (draft)

**Last updated:** `[on approval]`

**How to reach us.** All cancellations, refunds and replacements go through support: email **cameron@souvenote.com** with the order reference from your confirmation email. There's no online returns form. Refunds are paid in the currency you paid in.

**Cancelling an order**
- **Before printing:** we'll ask our print partner to stop it. Your order is cancelled only once they confirm it's stopped. We can't promise a time window, and asking doesn't guarantee the order can be stopped. `[NEEDS PROVIDER: the partner's actual cancellation window]`
- **Once it's stopped:**
  - Print and Send orders are refunded the price paid for that card, plus its tax and any cross-border postage adjustment.
  - Big Sender cards go back into your pack, with their original expiry date. There's no cash refund for a pack card.
- **Already in production:** the order can't be cancelled.

**If something goes wrong with your card**

| What happened | What we offer |
|---|---|
| The card arrives damaged or misprinted (our or our partner's mistake) | Your choice: a free replacement or a refund for that card |
| The card is confirmed lost, and the address was correct | After we check with our partner, your choice: a free replacement or a refund for that card. A late arrival on its own isn't proof of loss |
| There was a typo or a wrong address in what you approved | One replacement per card for **$3.99 CAD** (Canadian accounts) or **$2.99 USD** (US accounts), plus tax, with printing, envelope and postage included. Fix the text yourself for free first |
| The card is late | We'll look into it and tell you what we find. Delays alone aren't refunded, and we can't guarantee arrival by a date |

A Print and Send refund is the amount paid for that card, plus its tax. A Big Sender refund is the per-card price you paid, plus its share of the tax. We refund one card, not the whole pack. A refunded card isn't also returned to your pack.

**Unused credit top-ups and Big Sender packs**
- **Within 14 days of purchase**, if **none** of the credits or cards from that purchase have been used, we'll refund it in full, tax included.
- After 14 days, or once any of it has been used, it isn't refundable, except where the law requires.
- A Big Sender pack counts as unused only if **no card has been sent and none of its included AI credits have been spent**.
- Credits that come with Print and Send follow that card's refund, not this rule.

**AI credits**
- If an image or song fails for a technical reason, its credits are returned automatically. That's a credit return, not a cash refund.
- Credits spent on results that were successfully made aren't returned, but you can always edit text for free or make something new.

**Refund timing.** Refunds go back to the original payment method. Once we've issued one, your bank decides how long it takes to appear.

**Your legal rights.** This policy doesn't limit any rights you have under consumer protection law in your province or state. `[LAWYER]`

---

## 7. Cookie and Storage Policy (draft)

**Last updated:** `[on approval]`

**The short version.** Souvenote doesn't use advertising cookies, and we don't sell your information. To work, the app stores a few essential items in your browser. **Analytics cookies are used only if you say yes** in our cookie banner, and you can change your mind at any time from "Cookie settings" in the footer.

**Essential (always on).** These are needed for signing in, your cart and checkout, so they can't be switched off. Audited from the code, 2026-11-08:

| Purpose | Stored as | How long |
|---|---|---|
| Keeping you signed in | sign-in session and tokens (`souv_cognito_session`, `souv_local_user`, and the sign-in library's own entries) | Until you sign out. Only for the browser session if "Remember me" is off (`souv_session_persistence`) |
| Social sign-in safety | `souv_cognito_oauth_state` | Removed as soon as sign-in finishes |
| Finishing sign-up | `souv_pending_signup_profile` (name, birthday, country and consent until your account is ready) | Up to 7 days, cleared on sign-out |
| Your cart | `souv_cart` | Until you check out or empty it |
| Picking up where you left off | `souv_current_card_draft_id`, `souv_pricing_return_to`, `souv_delivery_source` | Session or until finished |
| Your cookie choice | `souv_cookie_consent` *(new)* | 12 months `[LAWYER]` |
| Price country for visitors | `souv_price_country` *(new; Canada or US switch for signed-out visitors)* | 12 months |

**Analytics (only with your consent):** PostHog helps us see how the site is used, for example which pages are visited and where people get stuck. It never records your card text, messages, recipients, photos or songs. It sets a cookie (`ph_<project>_posthog`) and similar browser storage to recognize a returning visitor, for up to 12 months `[confirm in the PostHog setup]`. If you say no, PostHog doesn't load at all.

**Our partners' essential cookies**
- **Sign-in (Amazon Cognito):** sets cookies on its own sign-in pages, used for Google, Apple and Facebook sign-in.
- **Payments (Stripe):** sets cookies for fraud prevention when you check out.

**Your choices.** Use "Cookie settings" in the footer to change your analytics choice. You can also clear stored items in your browser settings, which signs you out and empties your cart.

**For the developer** (not public text):
- **Consent banner:**
  - shown on first visit, with **Accept** and **Decline** given equal weight, and nothing ticked in advance;
  - PostHog doesn't load until Accept;
  - a footer "Cookie settings" link reopens the banner;
  - store the choice and its date.
  - Quebec Law 25 needs tracking off by default. Some US states, such as California, need an opt-out. "Off until Accept" satisfies both. `[LAWYER]`
- Remove these keys with the v2 features: `souv_topup_blank_gift_offer_seen` and `souv_blank_souvenote_pending`.
- These are mock or demo only and must not ship to production: `souv_mock_db`, `souv_mock_mvp_flow`, `souv_mock_social_pending`, `souv_demo_balance` and `souv_demo_library`.
- These legacy keys are only cleaned up: `souv_cognito_oauth_return_to`, `souv_cognito_oauth_error` and `souv_cognito_oauth_attempt`.
- The app sets no cookies itself today, and fonts are self-hosted by `next/font`.

---

## 8. Checklists

**Lawyer** (Canada (BC) and US; consumer protection, privacy, IP):
1. Credit and pack expiry vs. provincial and state gift-card and prepaid rules (item 13).
2. Consumer-protection limits on liability, refund and governing-law wording, for Canadian provinces (Quebec, Ontario) and US states (item 15).
3. Privacy:
   - PIPEDA, Quebec Law 25, and the BC and Alberta PIPAs (Privacy Officer named, data outside Canada, the transfer assessment, breach notice, retention periods);
   - US state privacy law applicability, including the "sell/share" wording (item 14).
4. The cookie banner and consent record for Quebec and the US states.
5. CASL and CAN-SPAM: confirm that receipts, order confirmations and account emails are transactional (there's no marketing opt-in).
6. Output and IP rights for AI-made artwork and songs, against each provider's terms. Can we say customer content isn't used for training?
7. The attestation pop-up as clickwrap with no scroll gate, the photo-consent promises shown in full (Quebec CCQ 1435), the intimate-images wording (now in the Terms only), and the minors wording.
8. Age-of-majority wording (Canadian provinces and US states).
9. Tax wording with Stripe Tax for Canada and the US.
10. Community Cards shared by customers (2026-11-09): the licence in Terms §5 (non-exclusive, royalty-free, no credit or pay, takedown on request), the guidelines in `components/community/communityGuidelines.ts` (incorporated by reference from §5), notice-and-notice (Canada) and DMCA (US) takedowns, election-advertising rules for civic cards, and copyright in AI-made fronts.

**Owner:** incorporate (BC), then supply the legal entity name and registered address. Nothing else is open.

**Provider:** Scribeless cross-border routing and postage; the print partner's cancellation window and delivery estimates; Apple Pay and Google Pay in Stripe; the US and Canada tax registrations Stripe Tax flags; the PostHog cookie names and lifetime; the final provider list; each AI provider's data-use and training terms.
