// Community Cards guidelines: what customers can and can't submit for the public
// Community Cards collection, and the grey areas our reviewers look at closely.
// Shown in the "What we can post" pop-up on /community-cards and agreed to in the
// submit pop-up. Matches Terms of Service §5 ("Cards you share to Community Cards").
//
// DRAFT for owner and lawyer review (2026-11-09), like the legal pages. It's
// plain-language guidance, not legal advice. The legal basis it follows:
// - Copyright: Canada's Copyright Act and the US Copyright Act (characters,
//   artwork, photos, lyrics and long quotes belong to their owners). Parody and
//   satire are fair dealing in Canada and can be fair use in the US, but both
//   are decided case by case, so we treat them as grey areas, not as allowed.
// - Trademarks: Canada's Trademarks Act and the US Lanham Act (brand names,
//   logos, team names and slogans on a product we sell).
// - Likeness: personality rights (Quebec Civil Code; common-law appropriation
//   of personality in other provinces; US state right-of-publicity laws) and
//   privacy law (PIPEDA): no real, identifiable people on a public card.
// - Takedowns: Canada's notice-and-notice regime and the US DMCA notice-and-
//   takedown process; we remove a card when a credible rights claim arrives.
// - AI art: the US Copyright Office won't register work made only by AI, and
//   Canada's position is unsettled, so we never promise that a design is exclusive.
// - Causes and statements (owner, 2026-11-09: political statements, social
//   justice, financial and similar cards are welcome, as long as they aren't
//   meant to hurt other groups). The one rule: a card can stand for something,
//   never against people. The lines it follows:
//   - Groups: the protected grounds in the Canadian Human Rights Act and the
//     provincial codes, and US civil-rights law. Criminal Code s. 319 (promoting
//     hatred against an identifiable group) is the legal floor; our line is
//     stricter (no mocking, stereotyping or blaming a group).
//   - Elections: third-party election advertising during an election period
//     (Canada Elections Act Part 17; provincial acts) and express advocacy (US
//     FEC and state rules), so "go vote" is fine but "vote for / against X" isn't.
//   - Money: securities rules on investment advice and promotions (Canadian
//     securities regulators, the US SEC and FINRA) and deceptive claims
//     (Competition Act; FTC Act), so milestones and encouragement are fine but
//     tips, promised returns and requests for money aren't.

export const COMMUNITY_GUIDELINES_VERSION = "community-guidelines-2026-11-09-v2";

export type GuidelineGroup = { id: string; title: string; tone: "yes" | "no" | "grey"; items: string[] };

export const COMMUNITY_GUIDELINES: GuidelineGroup[] = [
  {
    id: "can-post",
    title: "What we can post",
    tone: "yes",
    items: [
      "Original designs you made in Build My Card with your credits.",
      "Everyday occasions: birthdays, holidays, thank-yous, new babies, sympathy and more.",
      "Gentle, cheeky humour that suits a card anyone could send.",
      "Your own short wording on the front, like “Happy birthday, legend”.",
      "Generic people, animals, places, patterns and scenes that don't show a real person.",
    ],
  },
  {
    id: "causes",
    title: "Causes and statements we welcome",
    tone: "yes",
    items: [
      "Our one rule: a card can stand for something, never against people. Support a cause or a point of view without attacking, mocking or blaming anyone.",
      "Political and civic statements: “Go vote”, “Democracy needs you”, thanks to veterans, Canada Day and the Fourth of July, or a value you believe in, like “Healthcare for everyone” or “Protect our parks”.",
      "Social justice and human rights: Pride, anti-racism, gender equality, disability inclusion, refugees welcome, Black History Month, Indigenous rights and Truth and Reconciliation (Orange Shirt Day).",
      "Health and awareness: mental health, cancer survivors and awareness months, recovery and sobriety milestones, blood and organ donation.",
      "Environment and animals: climate action, Earth Day, conservation, “Adopt, don't shop”.",
      "Money milestones and encouragement: debt-free day, a first home, a new business, a raise, retirement, hitting a savings goal, “Future you says thanks”.",
      "Work and community: Labour Day, union solidarity, thanks to nurses, teachers and essential workers, volunteering and kindness.",
      "Faith and culture: Diwali, Eid, Lunar New Year, Hanukkah, Christmas, Kwanzaa, Nowruz and other celebrations, and interfaith messages of peace.",
    ],
  },
  {
    id: "cannot-post",
    title: "What we can't post",
    tone: "no",
    items: [
      "Real, recognizable people, including celebrities, public figures, friends, family and children. A card made from your own photos stays private to you.",
      "Characters, logos, brands, sports teams or artwork that belong to someone else (movies, cartoons, games, mascots, products).",
      "Song lyrics, poems, film lines or long quotes you didn't write.",
      "Names, addresses, phone numbers, handles, QR codes or anything that identifies a person.",
      "Anything that attacks, demeans, stereotypes or blames people for who they are: race, ethnicity, national origin, religion, sex, gender identity or expression, sexual orientation, age, disability or Indigenous identity. That includes slurs, “jokes” at a group's expense and conspiracy theories about a group.",
      "Hateful, harassing, sexually explicit, violent or graphic content, or anything showing drugs, weapons or self-harm in a positive way.",
      "Telling people to vote for or against a named candidate, party or ballot question, and false or misleading claims, including about how, when or where to vote.",
      "Financial advice or promotions: stock, crypto or investment tips, “guaranteed returns” or get-rich-quick claims, loans, and requests for money or donations with payment details.",
      "Health claims that promise a cure or tell people to avoid medical care.",
      "Ads for a business, product or service.",
      "Anything that breaks the law or our Terms of Service.",
    ],
  },
  {
    id: "grey-areas",
    title: "Grey areas we look at closely",
    tone: "grey",
    items: [
      "Parody and fan art: allowed under the law in some cases, but it's decided case by case, so we usually decline cards built on a character or brand.",
      "“In the style of” a living artist or studio: a general look (watercolour, retro comic) is fine; copying one artist's signature style is not.",
      "Famous quotes and sayings: short common phrases are fine; a quote tied to a known person or work may not be.",
      "Old “public domain” characters and art: free in one country can still be protected in another, or as a trademark.",
      "Landmarks and buildings: usually fine, though some modern buildings, sculptures and light shows are protected.",
      "Hot-button issues (such as abortion, immigration, gun laws, policing or conflicts abroad): a card can share a view positively and respectfully; we decline cards that insult the other side or the people affected.",
      "Protest slogans: many are fine; we decline slogans widely read as calls for violence or as aimed at a group.",
      "Named organizations, charities and movements: supporting a cause is welcome, but a group's name or logo can be a trademark, so we may ask for general wording.",
      "Civic cards near an election: “Go vote” is fine any time; during an election period we also check that a card can't count as election advertising.",
      "Religious and cultural themes: welcome when they're celebratory and respectful; we decline cards that mock a faith or culture.",
      "Money humour (taxes, budgets, “adulting”): fine as a joke, not as advice.",
      "Adult humour: a little cheek is fine; crude or sexual jokes aren't.",
    ],
  },
];

export const COMMUNITY_REVIEW_STEPS = [
  "Our team reviews every card by hand before it's posted. Until then, only you can see it, under “Your shared cards” on the Community Cards page.",
  "We approve it, ask you for a change, or decline it, and email you either way.",
  "We may also remove a posted card later, for example if someone tells us it uses their work. Rights holders can email us to report a card.",
  "AI-made art may not be protected by copyright, so we can't promise no one else will make a similar card.",
];
