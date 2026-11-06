# 5. Content and voice

## Voice

Souvenote speaks like a thoughtful friend who is good with gifts: **warm, sincere, unhurried, a little poetic**, and never gushing or salesy.

| We are | We are not |
|---|---|
| Warm: "a song meant just for them" | Saccharine: "the most magical card EVER" |
| Clear: "Includes 2 free credits to create a complete card" | Vague: "Get started with bonus perks" |
| Calm and confident | Pushy: "Hurry! Limited time!" |
| Personal ("you", "them") | Corporate ("users", "recipients") |

## Writing rules

- **Headings:** a few plain words, then one script phrase that carries the feeling. "A card worth *keeping*". "Three steps, *one keepsake*".
- **Sentence case** for headings and body; **title case** for buttons and nav ("Start for Free", "Build My Card"); **spaced capitals** for labels, set in CSS rather than typed in capitals.
- **Buttons are verbs:** Start, Log In, Build, Personalize.
- **One idea per sentence.** Keep ledes under about 25 words.
- **Prices:** "$6.99" with "as low as" or "for as little as". Prices can switch between USD and CAD.
- **AI:** say what it does for the person ("composes a custom song, designs original cover art, and writes a heartfelt inside message"), not how it works.
- **Use em dashes sparingly,** with spaces around them ( — ), as in the current copy.
- **Don't promise what we can't check.** Competitor comparisons are dated and checked against each competitor's own website.

## Key copy (current)

| Place | Copy |
|---|---|
| Hero heading | A card worth *keeping* |
| Hero lede | Create custom cards with a song meant just for them. Because the card you give should be as unique as they are. |
| Free-credits line | Includes 2 free credits to create a complete card |
| Footer slogan | Because the card you give should be as unique as they are. |
| Comparison sub-line | Your artwork. Their song. Printed and delivered. |

Nav descriptions (one sentence each):

- **Personalize a Template:** "Personalize one of our pre-built cards like Comic and Horoscope."
- **Build My Card:** "Have an idea for a card? Answer a few questions and watch your card come to life."
- **Community Cards:** "Choose from our collection of ready to send cards, just add your personal message. No AI credits required."
- **Pricing:** "Choose from flexible options as low as $6.99."

All landing copy lives in `frontend/app/components/landing/content.ts`, so it can be edited without touching layout.

## Words we don't use on the landing page
- "Try risk-free", or anything about it.
- "Coming soon" on the song player.
