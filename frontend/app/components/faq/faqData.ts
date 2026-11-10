import { creditPacksFor } from "../pricing/pricingContent";
import { PRICE_LISTS, formatMoney, formatShortMoney } from "../../lib/priceLists";
import { SUPPORT_EMAIL } from "../../lib/support";

// The one FAQ list for the whole site (/faq and the landing / signed-in home).
// Text: FAQ_AND_LEGAL_DRAFTS.md §3 (owner decisions 2026-11-08), every
// answer marked DRAFT until the owner approves it, except the one already
// approved ("Can I buy creation credits without buying a card?").
// Answers are plain blocks so the visible text and the FAQPage structured data
// always match (faqPlainText).
// Every amount comes from the Canada and US price lists (lib/priceLists.ts).

export type FaqBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; caption: string; head: string[]; rows: string[][] };

export type FaqItem = {
  id: string;
  q: string;
  a: FaqBlock[];
  /** Shown on the landing page and signed-in home (the first six). */
  landing?: boolean;
  status: "approved" | "draft";
};

export type FaqGroup = { id: string; title: string; items: FaqItem[] };

const CAD_LIST = PRICE_LISTS.CAD;
const USD_LIST = PRICE_LISTS.USD;
const cad = (amount: number) => formatMoney(amount, "CAD");
const usd = (amount: number) => formatMoney(amount, "USD");
const [tier1, tier2, tier3] = CAD_LIST.bigSender;
const USD = { printAndSend: USD_LIST.printAndSend, tiers: USD_LIST.bigSender.map((tier) => tier.pricePerCard) };
const packs = creditPacksFor(CAD_LIST).map((pack, index) => `${pack.name}: ${pack.tokens} credits for ${formatShortMoney(pack.price, "CAD")} / ${formatShortMoney(USD_LIST.creditPacks[index].price, "USD")}`);
const PRINT_AND_SEND_PRICE = CAD_LIST.printAndSend;

const p = (text: string): FaqBlock => ({ kind: "p", text });

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "getting-started",
    title: "Getting started",
    items: [
      {
        id: "what-is-souvenote", landing: true, status: "draft",
        q: "What is Souvenote?",
        a: [p("Souvenote helps you create a personal greeting card, print it and mail it anywhere in Canada or the United States. Design your own with our AI-assisted builder, personalize one of our templates, or choose a ready-made Community Card. AI-made cards can include an original 30–45 second song, which your recipient plays by scanning a QR code printed inside.")],
      },
      {
        id: "free-to-try", landing: true, status: "draft",
        q: "Is it free to try?",
        a: [p("Yes. Every new account gets 2 free AI credits, with no payment details needed. That's enough to create your first card with artwork and a song, review it, and save it. You only pay when you're ready to print and mail it, or if you want more credits to keep creating.")],
      },
      {
        id: "ways-to-make", status: "draft",
        q: "What are the ways to make a card?",
        a: [{ kind: "list", items: [
          "Build My Card: answer a few friendly questions, one at a time, and we design an original card around your answers, with an optional photo.",
          "Personalize a Template: pick one of our designs and add your details.",
          "Community Cards: choose a ready-made design and write your own message inside. No AI credits are used.",
        ] }],
      },
      {
        id: "need-account", status: "draft",
        q: "Do I need an account?",
        a: [p("You can read about Souvenote, browse every Community Card and see a few example templates without one. To create, save or send a card, and to browse the full template collection, you'll need a free account. You can sign up with email or with Google, Apple or Facebook. You'll choose Canada or the United States when you sign up. That sets the prices and currency you see.")],
      },
    ],
  },
  {
    id: "credits-and-pricing",
    title: "Credits and pricing",
    items: [
      {
        id: "cost-to-send", landing: true, status: "draft",
        q: "How much does it cost to send a card?",
        a: [
          p(`Print and Send is ${cad(PRINT_AND_SEND_PRICE)} in Canada or ${usd(USD.printAndSend)} in the United States, per card. It includes printing, an envelope, postage and 10 AI credits for your next creations.`),
          p("Sending more? Big Sender packs of 2 or more cards save you money:"),
          {
            kind: "table", caption: "Big Sender price per card", head: ["Cards", "Canada", "United States"],
            rows: [
              ["2–10", `${cad(tier1.pricePerCard)} each`, `${usd(USD.tiers[0])} each`],
              ["11–20", `${cad(tier2.pricePerCard)} each`, `${usd(USD.tiers[1])} each`],
              ["21 or more", `${cad(tier3.pricePerCard)} each`, `${usd(USD.tiers[2])} each`],
            ],
          },
          p("The price for your quantity applies to every card in the pack, and each card includes 10 AI credits. Tax is added at checkout."),
        ],
      },
      {
        id: "how-credits-work", status: "draft",
        q: "How do credits work?",
        a: [
          p("Credits are used when AI creates something for you:"),
          { kind: "list", items: [
            "A new card with artwork and a song: 2 credits.",
            "Artwork only: 1 credit.",
            "New artwork: 1 credit.",
            "A replacement song: 1 credit.",
          ] },
          p("Drafting your inside message and lyrics is free. Each card also comes with up to 5 free AI rewrites of the message and 5 of the lyrics. Lyric rewrites are available until the first song is made. Editing any text yourself is always free. We always show the cost before you spend a credit."),
        ],
      },
      {
        id: "credits-without-card", landing: true, status: "approved",
        q: "Can I buy creation credits without buying a card?",
        a: [
          p("Yes. You can top up creation credits on the Pricing page at any time, without ordering a printed card. One credit covers one action (generating a design, editing an image, or creating an optional QR-code song), so you can explore ideas first and print only when you're ready."),
          p(`${packs.join(". ")}. Plus tax.`),
        ],
      },
      {
        id: "expiry", status: "draft",
        q: "Do credits or cards expire?",
        a: [p("AI credits, including your 2 free signup credits, expire 12 months after you buy or receive them. Unused Big Sender cards also expire 12 months after purchase. Your balance and expiry dates are shown in your account.")],
      },
      {
        id: "creation-fails", status: "draft",
        q: "What happens if a creation fails?",
        a: [p(`If an image or song can't be made because of a technical problem, the credits for that item come back to your balance automatically. Anything that was made successfully is kept. If you're unhappy with a result, you can edit the text for free, or make new artwork or a new song for 1 credit. If something seems wrong, email us at ${SUPPORT_EMAIL}.`)],
      },
      {
        id: "payment-methods", status: "draft",
        q: "What payment methods do you accept?",
        a: [p("We accept major credit and debit cards through our secure payment partner, Stripe. Apple Pay and Google Pay work where your device supports them. Canadian accounts pay in Canadian dollars and US accounts in US dollars. Tax is added at checkout.")],
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    items: [
      {
        id: "where-and-how-long", landing: true, status: "draft",
        q: "Where do you deliver, and how long does it take?",
        a: [p("We print and mail cards to addresses in Canada and the United States, and you can send across the border. Delivery times depend on our print and mailing partner and the destination. We'll show an estimate at checkout where one is available. We can't guarantee arrival by a specific date, so please order early for special occasions.")],
      },
      {
        id: "cross-border", status: "draft",
        q: "Does it cost more to mail across the border?",
        a: [p("If a card is going from Canada to the US, or from the US to Canada, any postage difference is shown and added at checkout before you pay.")],
      },
      {
        id: "several-people", status: "draft",
        q: "Can I send the same card to several people?",
        a: [p("Yes. With a Big Sender pack you can send the same design to everyone, or a different card to each person. Each card uses one card from your pack.")],
      },
      {
        id: "save-addresses", status: "draft",
        q: "Can I save addresses?",
        a: [p("Yes. When you send a card you can tick \"Save this recipient\" to keep their name and mailing address in your account, then choose them next time. You can edit or delete saved recipients in Account Settings. Changes never affect a card that's already been ordered.")],
      },
      {
        id: "tracking", status: "draft",
        q: "Will I get tracking?",
        a: [p("Not yet. We email you a receipt when you pay and a confirmation when your order is placed. Tracking updates aren't available at the moment.")],
      },
    ],
  },
  {
    id: "songs-and-qr-codes",
    title: "Songs and QR codes",
    items: [
      {
        id: "song-sound", landing: true, status: "draft",
        q: "What does a personalized song sound like?",
        a: [p("Songs are optional. If you include one, it's an original 30–45 second song made from the details you share: vocal (with lyrics you write or approve), or instrumental. With Build My Card you choose the musical style. Templates come with a style chosen for that design. We print a QR code inside the card so your recipient can listen.")],
      },
      {
        id: "hear-song", status: "draft",
        q: "How does my recipient hear the song?",
        a: [p("They scan the QR code with their phone camera. A simple music page opens where they can play and download the song. They don't need an account or an app. The page shows only the song, not your card or message.")],
      },
      {
        id: "who-can-hear", status: "draft",
        q: "Who can hear the song?",
        a: [p("The song is private by link: anyone who has the QR code or its link can listen, and the page isn't listed in search engines. Please keep that in mind when choosing what goes into the lyrics.")],
      },
      {
        id: "song-availability", status: "draft",
        q: "How long does the song stay available?",
        a: [p(`For cards that have been mailed, the song stays available through its QR code indefinitely, even after the card leaves your Saved Cards & Songs or you delete your account. To have a mailed card's song removed, email ${SUPPORT_EMAIL}. Once it's removed, the QR code will stop working.`)],
      },
    ],
  },
  {
    id: "your-account",
    title: "Your cards and account",
    items: [
      {
        id: "save-finish-later", status: "draft",
        q: "Can I save my card and finish later?",
        a: [p("Yes. Your drafts and finished cards are saved automatically in Saved Cards & Songs for 12 months from the last time you edited them, and the date is shown on each one. Each time you save a change, the 12 months start again. Opening or viewing a card doesn't.")],
      },
      {
        id: "send-again", status: "draft",
        q: "Can I send a saved card again?",
        a: [p("Yes. Choose Print and send on any finished card in Saved Cards & Songs. You can change the recipient and edit the inside message for free. Reusing the artwork and song costs no credits; you just pay for the card with Print and Send or use a card from a Big Sender pack.")],
      },
      {
        id: "community-free", status: "draft",
        q: "Are Community Cards free?",
        a: [p(`Choosing a Community Card and writing your message is free and uses no AI credits. Community Cards don't include a song. You pay for the printed card with Print and Send (${cad(PRINT_AND_SEND_PRICE)} / ${usd(USD.printAndSend)}) or with a card from a Big Sender pack.`)],
      },
      {
        id: "community-share-yours", status: "draft",
        q: "Can I add my own design to Community Cards?",
        a: [p("Yes. Choose Build a card for the Community on the Community Cards page and design the front in Build My Card with your credits (a community card has no song and isn't made from photos). Then choose Share to Community Cards. Our team reviews every card against the Community Cards guidelines before it's posted, and only you can see it until then. Shared cards are posted without your name and aren't paid for. Anyone can share a Community Card's link to social media.")],
      },
      {
        id: "own-photos", status: "draft",
        q: "Can I use my own photos?",
        a: [p("Yes, in Build My Card and Personalize a Template. You can upload JPEG, PNG or WEBP photos. Before uploading, you'll confirm that you own the photo, or have permission to use it, and that everyone in it has agreed. Photos you upload but don't use are deleted after 24 hours.")],
      },
      {
        id: "account-security", status: "draft",
        q: "How do I keep my account secure?",
        a: [p(`Use a strong password. You can also turn on two-step sign-in with an authenticator app (Google Authenticator or 1Password, for example) in Account Settings. If you sign in with Google, Apple or Facebook, your password and two-step sign-in are managed by that account. If you lose access to your authenticator, email ${SUPPORT_EMAIL} and we'll help you back in after confirming it's you.`)],
      },
      {
        id: "change-country", status: "draft",
        q: "Can I change my country?",
        a: [p(`Your country is set when you sign up, and it decides your prices and currency. If you move, email ${SUPPORT_EMAIL} and we'll help. Credits and cards you've already bought keep their original value.`)],
      },
      {
        id: "delete-account", status: "draft",
        q: "How do I delete my account?",
        a: [p("Go to Account Settings, then Delete your account. This removes your profile, saved recipients, and your saved cards and songs. Songs on cards you've already mailed keep working for their recipients, and we keep the order and payment records the law requires. Any unused credits and cards are lost.")],
      },
      {
        id: "cancel-refund", status: "draft",
        q: "How do I cancel an order or get a refund?",
        a: [p(`Email ${SUPPORT_EMAIL} with the order reference from your confirmation email. We'll try to stop the order with our print partner, but once a card is in production it can't be cancelled. If your card arrives damaged or misprinted, or is confirmed lost, we'll offer a free replacement or a refund for that card. Unused credit top-ups and Big Sender packs can be refunded within 14 days. See our Refund Policy for the details.`)],
      },
      {
        id: "contact-us", status: "draft",
        q: "How do I contact you?",
        a: [p(`Email ${SUPPORT_EMAIL} or use our Contact page. We read every message and will get back to you as soon as we can.`)],
      },
    ],
  },
];

export const FAQ_ALL: FaqItem[] = FAQ_GROUPS.flatMap((group) => group.items);

/** The six questions on the landing page and signed-in home. */
export const FAQ_LANDING: FaqItem[] = FAQ_ALL.filter((item) => item.landing);

/** The answer as one plain string, for FAQPage structured data (matches the visible text). */
export function faqPlainText(item: FaqItem): string {
  return item.a.map((block) => {
    if (block.kind === "p") return block.text;
    if (block.kind === "list") return block.items.join(" ");
    return `${block.caption}: ${block.rows.map((row) => row.map((cell, index) => `${block.head[index]} ${cell}`).join(", ")).join("; ")}.`;
  }).join(" ");
}

/** schema.org FAQPage for a list of questions. */
export function faqStructuredData(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: faqPlainText(item) },
    })),
  };
}
