import { LEGAL_LAST_UPDATED } from "../../lib/legalVersions";
import { SUPPORT_EMAIL } from "../../lib/support";

// The four public policies, from FAQ_AND_LEGAL_DRAFTS.md §4–7 (Canada and the
// US, owner decisions 2026-11-08). Every document is a DRAFT for owner and
// lawyer review: the page says so, and the "Last updated" date in
// lib/legalVersions.ts stays on the version in effect until the owner approves.
// Inline text: **bold**, and [[placeholder]] for facts still missing (shown
// highlighted). The drafts' [LAWYER] review notes are kept in the drafts file,
// not shown here.

export type LegalSlug = "privacy-policy" | "terms-of-service" | "refund-policy" | "cookie-policy";

export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[]; ordered?: boolean }
  | { kind: "table"; caption: string; head: string[]; rows: string[][] };

export type LegalSection = { id: string; title: string; blocks: LegalBlock[] };

export type LegalDoc = {
  slug: LegalSlug;
  /** Title words; `accent` is the one Lobster Two word. */
  lead: string;
  accent: string;
  description: string;
  status: "draft" | "approved";
  /** Date of the version currently in effect. */
  inEffectSince: string;
  intro: string;
  sections: LegalSection[];
};

const p = (text: string): LegalBlock => ({ kind: "p", text });
const list = (...items: string[]): LegalBlock => ({ kind: "list", items });
const ENTITY = "[[legal entity name and address, to be added when Souvenote is registered]]";

const PRIVACY: LegalDoc = {
  slug: "privacy-policy",
  lead: "Privacy",
  accent: "Policy",
  description: "What Souvenote collects, why, who it's shared with, how long it's kept, and your choices, for customers in Canada and the United States.",
  status: "draft",
  inEffectSince: LEGAL_LAST_UPDATED.privacy,
  intro: "This policy applies to souvenote.com and the Souvenote app, for customers in Canada and the United States.",
  sections: [
    { id: "who-we-are", title: "Who we are", blocks: [p(`Souvenote (${ENTITY}, British Columbia, Canada) is responsible for the personal information described here. Our Privacy Officer is **Cameron**, reachable at **${SUPPORT_EMAIL}**.`)] },
    { id: "what-we-collect", title: "What we collect", blocks: [list(
      "**Account details:** your email, your name, a password (stored by our sign-in provider, never by us in readable form), your country (Canada or United States), and, if you choose to give them, your birthday and phone number. If you sign in with Google, Apple or Facebook, we receive your name and email from that provider.",
      "**What you create:** answers you give while making a card, photos you upload, descriptions, names and details you mention, captions, inside messages, lyrics, and the artwork and songs made for you.",
      "**Recipients:** the names and mailing addresses you enter to send a card, and any you choose to save.",
      "**Purchases:** what you bought, prices, taxes, credit and card balances, and order references. Card payments are handled by Stripe. We don't see or store your full card number.",
      "**Support:** messages you send us.",
      "**Technical information:** device and browser type, pages visited, and error reports. These are collected without your card text, messages, recipient details, photos or songs. Analytics cookies are used **only if you agree** (see our Cookie Policy).",
    )] },
    { id: "how-we-use-it", title: "How we use it", blocks: [
      list(
        "To create your cards and songs, save them, print and mail them, take payment and work out tax.",
        "To run your account, keep it secure, and provide support.",
        "To prevent abuse and keep people safe. We check uploaded photos and generated content against our acceptable-use rules, which may include automated moderation.",
        "With your consent, to understand and improve how Souvenote is used.",
        "To meet legal, tax and accounting obligations.",
      ),
      p("We **don't** sell or share your personal information for advertising, we don't use your photos to identify people or build facial recognition profiles, and we don't send marketing emails. We only email you about your account and your purchases and orders."),
    ] },
    { id: "ai-processing", title: "AI processing", blocks: [
      p("To create your card we send the relevant parts of your answers, photos and text to AI services, which process them only to produce your result:"),
      list("**Claude** on Amazon Bedrock: questions and text.", "fal.ai image and music models: artwork and songs."),
    ] },
    { id: "sharing", title: "Who we share it with", blocks: [
      p("We share only what each service needs to do its job:"),
      list(
        "Cloud hosting and storage (Amazon Web Services).",
        "Sign-in (Amazon Cognito).",
        "AI generation (Amazon Bedrock, fal.ai).",
        "Payments and tax (Stripe).",
        "Printing and mailing (Scribeless, with facilities in Canada and the US), which receives the card files and the recipient's and return mailing addresses.",
        "Email (SendGrid).",
        "Product analytics (PostHog, only with your consent) and error monitoring (Sentry), set up to leave out personal content.",
      ),
      p("We may also disclose information when the law requires it, to enforce our Terms, or to respond to credible safety reports."),
    ] },
    { id: "where-stored", title: "Where it's stored", blocks: [p("Your information is stored and processed in Canada and the United States, and possibly other countries where our providers operate. Information held outside your country may be accessed by authorities under that country's law.")] },
    { id: "song-link", title: "The song link", blocks: [p("A song on a mailed card can be heard by anyone who has its QR code or link. The music page shows only the song, not your card, message or details, and it's hidden from search engines.")] },
    { id: "retention", title: "How long we keep it", blocks: [{
      kind: "table", caption: "How long each kind of information is kept", head: ["Information", "How long"],
      rows: [
        ["Photos you upload but don't use", "Deleted after 24 hours"],
        ["Drafts and finished cards in Saved Cards & Songs", "12 months from your last saved edit, then deleted"],
        ["Songs on mailed cards", "Kept so the QR code keeps working, until you ask us to remove one"],
        ["Saved recipients", "Until you delete them or your account"],
        ["Orders, payments and tax records", "As long as the law requires"],
        ["Account", "Until you delete it"],
      ],
    }] },
    { id: "your-rights", title: "Your choices and rights", blocks: [
      p(`You can see and update your details in Account Settings, delete saved recipients and cards, delete your account, and change your cookie choices at any time. You can also ask us for a copy of your personal information, ask us to correct or delete it, or withdraw consent, by emailing ${SUPPORT_EMAIL}. We may need to confirm it's you first, and we won't treat you differently for using your rights.`),
      list(
        "**In Canada:** if you're not satisfied with our answer, you can complain to the Office of the Privacy Commissioner of Canada, or your provincial commissioner.",
        "**In the United States:** depending on your state, you may have more rights under state privacy law.",
      ),
    ] },
    { id: "deleting-your-account", title: "Deleting your account", blocks: [p("Deleting your account removes your profile, saved recipients and Saved Cards & Songs. Songs on cards you've already mailed keep working for their recipients unless you ask us to remove them. Order and payment records we must keep are held separately. We can't recall cards that have already been mailed.")] },
    { id: "children", title: "Children", blocks: [p("Souvenote is for adults and isn't directed to children under 13 or to minors. You must be the age of majority where you live (18 or 19 in Canada, depending on the province; 18 in most US states) to have an account. Only upload photos of children if you're their parent or guardian, or have their parent's or guardian's permission.")] },
    { id: "security", title: "Security", blocks: [p("Data is encrypted in transit, photos and songs are kept in private storage, access is limited, and two-step sign-in is available. No system is perfectly secure. If a breach puts you at risk, we'll tell you and the relevant authorities as the law requires.")] },
    { id: "changes", title: "Changes", blocks: [p("We'll update the date above and, for important changes, tell you by email or in the app.")] },
  ],
};

const TERMS: LegalDoc = {
  slug: "terms-of-service",
  lead: "Terms of",
  accent: "Service",
  description: "The agreement for using Souvenote: who can use it, credits and prices in CAD and USD, your content, AI results, orders, storage and your account.",
  status: "draft",
  inEffectSince: LEGAL_LAST_UPDATED.terms,
  intro: "Please read these terms before you create an account or place an order.",
  sections: [
    { id: "about", title: "1. About these terms", blocks: [p(`These terms are an agreement between you and ${ENTITY} ("Souvenote", "we") for using souvenote.com. By creating an account or placing an order you accept them, together with our Privacy Policy, Refund Policy and Cookie Policy.`)] },
    { id: "who-can-use", title: "2. Who can use Souvenote", blocks: [p("You must live in Canada or the United States and be the age of majority where you live. You choose your country at sign-up. Each account is for one person. Keep your sign-in details safe; you're responsible for activity on your account. We offer optional two-step sign-in.")] },
    { id: "what-we-provide", title: "3. What we provide", blocks: [p("Souvenote lets you create greeting cards with AI-assisted artwork, personalized templates or ready-made Community Cards, write an inside message, add an optional AI-made song played by QR code, and have the card printed and mailed to an address in Canada or the United States. Features may change.")] },
    { id: "credits-prices", title: "4. Credits, cards and prices", blocks: [list(
      "New accounts receive 2 free AI credits once.",
      "Credits are spent as shown before each action. Text drafting, and up to 5 AI rewrites each of the message and lyrics per card, are free.",
      "**Prices depend on your account's country:** Canadian dollars for Canada and US dollars for the United States. Tax is added at checkout. Any cross-border postage adjustment is shown before you pay.",
      "The price you accept at checkout is the price you pay; later price changes don't affect completed purchases.",
      "Print and Send and each Big Sender card cover one printed card, envelope and postage, and include 10 AI credits.",
      "**Credits and unused Big Sender cards expire 12 months after purchase or grant.**",
      "Credits and cards have no cash value, can't be transferred, and aren't refundable except as our Refund Policy describes or the law requires.",
      "If a generation fails for technical reasons, its credits are returned automatically.",
    )] },
    { id: "your-content", title: "5. Your content", blocks: [list(
      "You keep the rights you have in the photos and words you provide.",
      "You give us permission to use them, and to have our service providers use them, only to create, store, print, mail and play your cards and songs, and to keep the service safe.",
      "You promise that you own, or have permission to use, every photo you upload, and that everyone identifiable in it has agreed. You also promise that nothing you provide breaks the law or someone else's rights.",
      "**Cards you share to Community Cards.** You can offer a card you designed in Build My Card to the public Community Cards collection. Our team reviews every card against the Community Cards guidelines (on the Community Cards page) before it's posted, and we may decline it, ask for a change, or remove it at any time.",
      "If we post your card, you give us a non-exclusive, worldwide, royalty-free permission to show, print, sell and mail it to other customers, to let anyone share its link, and to use it to promote Community Cards, for as long as it's posted. Shared cards are posted without the creator's name, and we don't pay for them or give credits in return. You can ask us to take it down at any time; cards already ordered will still be printed and mailed.",
      "You promise that a card you share is your own design, and that it doesn't show a real, recognizable person or use anyone else's characters, logos, artwork, lyrics or personal details. Cards made from your own photos can't be shared. AI-made artwork may not be protected by copyright, so we can't promise that no one else will make a similar card.",
      `If you think a Community Card uses your work or shows you, email **${SUPPORT_EMAIL}** with the card's name and link. We review every report and remove cards where appropriate.`,
    )] },
    { id: "what-you-get", title: "6. What you get", blocks: [p("Subject to these terms, you may use the cards and songs made for you for personal, non-commercial purposes, such as sending, sharing and keeping them. The Souvenote name, our designs, templates and Community Cards (other than cards customers share, covered in section 5), and our software remain ours.")] },
    { id: "ai-results", title: "7. AI results", blocks: [p("AI results can be imperfect: likenesses may not be exact, and words or names in artwork may be misspelled. **You're responsible for reviewing the artwork, message, lyrics and song before you order.** Once you approve and order a card, we print it as approved.")] },
    { id: "acceptable-use", title: "8. Acceptable use", blocks: [
      p("Don't use Souvenote to:"),
      list(
        "create content that's unlawful, hateful, harassing, sexually explicit or violent;",
        "create content that shows a real person in a false, intimate or degrading way;",
        "impersonate anyone;",
        "infringe someone's rights;",
        "upload photos of people who haven't agreed;",
        "try to break, overload or copy the service.",
      ),
      p("We may refuse to generate or print content, remove it, cancel an order (with a refund of what you paid for it), or suspend an account that breaks these rules. Distributing or processing an intimate image of a person without their consent may be unlawful; we act on credible reports, including removing content and suspending accounts."),
    ] },
    { id: "orders-delivery", title: "9. Orders and delivery", blocks: [list(
      "Orders are printed and mailed by our partner to the address you approve in Canada or the United States. Please check it carefully.",
      "We email a receipt and an order confirmation.",
      "Delivery dates are estimates, not guarantees.",
      "Cancellations, refunds and replacements are handled as described in the Refund Policy.",
    )] },
    { id: "song-link", title: "10. The song link", blocks: [p("Songs on mailed cards are available to anyone with the QR code or link, and stay available after your library entry expires or your account is deleted, unless you ask us to remove them.")] },
    { id: "storage", title: "11. Storage", blocks: [p("Saved cards are kept for 12 months from your last saved edit, then deleted. Download anything you want to keep.")] },
    { id: "ending", title: "12. Ending your account", blocks: [p("You can delete your account at any time in Account Settings; unused credits and cards are lost, except for a refund you're entitled to under the Refund Policy. We may suspend or close accounts that break these terms.")] },
    { id: "liability", title: "13. Liability", blocks: [p("To the extent the law allows, we're not responsible for indirect losses, and our total responsibility for a claim is limited to what you paid us for the order or purchase involved. Nothing in these terms limits rights you have under consumer protection law where you live.")] },
    { id: "changes", title: "14. Changes", blocks: [p("We may update these terms. For important changes we'll tell you in advance by email or in the app, and you'll be asked to accept them before continuing.")] },
    { id: "law", title: "15. Law", blocks: [p("These terms are governed by the laws of **British Columbia** and the federal laws of Canada that apply. This doesn't take away consumer rights you have where you live, including in your own province or US state.")] },
    { id: "contact", title: "16. Contact", blocks: [p(SUPPORT_EMAIL)] },
  ],
};

const REFUND: LegalDoc = {
  slug: "refund-policy",
  lead: "Refund",
  accent: "Policy",
  description: "How Souvenote handles cancellations, damaged, misprinted or lost cards, typo replacements, unused credits and packs, and refund timing.",
  status: "draft",
  inEffectSince: LEGAL_LAST_UPDATED.refund,
  intro: "Cancellations, refunds and replacements, and how to ask for them.",
  sections: [
    { id: "how-to-reach-us", title: "How to reach us", blocks: [p(`All cancellations, refunds and replacements go through support: email **${SUPPORT_EMAIL}** with the order reference from your confirmation email. There's no online returns form. Refunds are paid in the currency you paid in.`)] },
    { id: "cancelling", title: "Cancelling an order", blocks: [list(
      "**Before printing:** we'll ask our print partner to stop it. Your order is cancelled only once they confirm it's stopped. We can't promise a time window, and asking doesn't guarantee the order can be stopped.",
      "**Once it's stopped:** Print and Send orders are refunded the price paid for that card, plus its tax and any cross-border postage adjustment. Big Sender cards go back into your pack, with their original expiry date; there's no cash refund for a pack card.",
      "**Already in production:** the order can't be cancelled.",
    )] },
    { id: "something-wrong", title: "If something goes wrong with your card", blocks: [
      {
        kind: "table", caption: "What we offer when something goes wrong", head: ["What happened", "What we offer"],
        rows: [
          ["The card arrives damaged or misprinted (our or our partner's mistake)", "Your choice: a free replacement or a refund for that card"],
          ["The card is confirmed lost, and the address was correct", "After we check with our partner, your choice: a free replacement or a refund for that card. A late arrival on its own isn't proof of loss"],
          ["There was a typo or a wrong address in what you approved", "One replacement per card for $3.99 CAD (Canadian accounts) or $2.99 USD (US accounts), plus tax, with printing, envelope and postage included. Fix the text yourself for free first"],
          ["The card is late", "We'll look into it and tell you what we find. Delays alone aren't refunded, and we can't guarantee arrival by a date"],
        ],
      },
      p("A Print and Send refund is the amount paid for that card, plus its tax. A Big Sender refund is the per-card price you paid, plus its share of the tax. We refund one card, not the whole pack. A refunded card isn't also returned to your pack."),
    ] },
    { id: "unused", title: "Unused credit top-ups and Big Sender packs", blocks: [list(
      "**Within 14 days of purchase**, if **none** of the credits or cards from that purchase have been used, we'll refund it in full, tax included.",
      "After 14 days, or once any of it has been used, it isn't refundable, except where the law requires.",
      "A Big Sender pack counts as unused only if **no card has been sent and none of its included AI credits have been spent**.",
      "Credits that come with Print and Send follow that card's refund, not this rule.",
    )] },
    { id: "ai-credits", title: "AI credits", blocks: [list(
      "If an image or song fails for a technical reason, its credits are returned automatically. That's a credit return, not a cash refund.",
      "Credits spent on results that were successfully made aren't returned, but you can always edit text for free or make something new.",
    )] },
    { id: "timing", title: "Refund timing", blocks: [p("Refunds go back to the original payment method. Once we've issued one, your bank decides how long it takes to appear.")] },
    { id: "your-rights", title: "Your legal rights", blocks: [p("This policy doesn't limit any rights you have under consumer protection law in your province or state.")] },
  ],
};

const COOKIES: LegalDoc = {
  slug: "cookie-policy",
  lead: "Cookie",
  accent: "Policy",
  description: "The cookies and browser storage Souvenote uses: essential sign-in and cart items, and analytics only if you agree.",
  status: "draft",
  inEffectSince: LEGAL_LAST_UPDATED.cookie,
  intro: "What Souvenote stores in your browser, and your choices.",
  sections: [
    { id: "short-version", title: "The short version", blocks: [p("Souvenote doesn't use advertising cookies, and we don't sell your information. To work, the app stores a few essential items in your browser. **Analytics cookies are used only if you say yes** in our cookie banner, and you can change your mind at any time from \"Cookie settings\" in the footer.")] },
    { id: "essential", title: "Essential (always on)", blocks: [
      p("These are needed for signing in, your cart and checkout, so they can't be switched off."),
      {
        kind: "table", caption: "Essential items stored in your browser", head: ["Purpose", "Stored as", "How long"],
        rows: [
          ["Keeping you signed in", "Sign-in session and tokens (souv_cognito_session, souv_local_user, and the sign-in library's own entries)", "Until you sign out. Only for the browser session if \"Remember me\" is off (souv_session_persistence)"],
          ["Social sign-in safety", "souv_cognito_oauth_state", "Removed as soon as sign-in finishes"],
          ["Finishing sign-up", "souv_pending_signup_profile (name, birthday, country and consent until your account is ready)", "Up to 7 days, cleared on sign-out"],
          ["Your cart", "souv_cart", "Until you check out or empty it"],
          ["Picking up where you left off", "souv_current_card_draft_id, souv_pricing_return_to, souv_delivery_source", "Session or until finished"],
          ["Your cookie choice", "souv_cookie_consent", "12 months"],
          ["Price country for visitors", "souv_price_country", "12 months"],
        ],
      },
    ] },
    { id: "analytics", title: "Analytics (only with your consent)", blocks: [p("PostHog helps us see how the site is used, for example which pages are visited and where people get stuck. It never records your card text, messages, recipients, photos or songs. It sets a cookie and similar browser storage to recognize a returning visitor, for up to 12 months. If you say no, PostHog doesn't load at all.")] },
    { id: "partners", title: "Our partners' essential cookies", blocks: [list(
      "**Sign-in (Amazon Cognito):** sets cookies on its own sign-in pages, used for Google, Apple and Facebook sign-in.",
      "**Payments (Stripe):** sets cookies for fraud prevention when you check out.",
    )] },
    { id: "your-choices", title: "Your choices", blocks: [p("Use \"Cookie settings\" in the footer to change your analytics choice. You can also clear stored items in your browser settings, which signs you out and empties your cart.")] },
  ],
};

export const LEGAL_DOCS: Record<LegalSlug, LegalDoc> = {
  "privacy-policy": PRIVACY,
  "terms-of-service": TERMS,
  "refund-policy": REFUND,
  "cookie-policy": COOKIES,
};

export const LEGAL_SLUGS = Object.keys(LEGAL_DOCS) as LegalSlug[];
