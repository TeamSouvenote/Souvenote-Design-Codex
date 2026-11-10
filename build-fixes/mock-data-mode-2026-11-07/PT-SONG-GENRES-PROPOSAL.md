# Proposal: a real song setup for each Personalize card

2026-11-08. **Approved and built the same day.** The owner chose option 1 ("Show the sound step"); the defaults in the table were used as proposed, and a card's own song theme is added to the preset (decision 3, as recommended).

## The problem
Personalize asks for lyrics with an **empty genre preset** (`PtQuestionnaire.tsx`, `runLyrics`). Its song request is a generic placeholder (`compileSongPrompt` in `ptPrompts.ts`).

Build My Card's lyric template needs a preset to fill in:
- `{{preset.bpm}}`
- `{{preset.vocal_summary}}`
- `{{preset.vocal_mode}}`
- `{{preset.sung_word_range}}`

Its music prompt starts with the preset's production prompt. Without a preset, the real lyric writer has nothing to fit the words to, and the music model gets only "warm and personal".

## Proposal
Each card file names a **default genre** from the ten presets in `components/bmc/catalog.ts`, optionally chosen by the card's mood. Personalize then uses the same lyric and music prompts as Build My Card.

| Card | Default genre | Why |
|---|---|---|
| **Horoscope**, mood Dreamy | Piano Ballad (`gentle-piano`, 76 BPM) | Soft and calm, matching "soft starlight" |
| **Horoscope**, mood Playful | Pop (`bright-pop`, 112 BPM) | Bright and celebratory |
| **Horoscope**, mood Heartfelt | Acoustic (`warm-acoustic-folk`, 96 BPM) | Warm, close and conversational |
| **Horoscope**, written-in mood | Pop | A safe birthday default |
| **On This Day** | Jazz Swing (`jazz-swing`, 120 BPM) | Fits the vintage newspaper; listed for "elegant birthdays" |
| **Comic Card**, memory or habit story | Pop Rock (`pop-rock`, 120 BPM) | Energetic, a good match for a punchline |
| **Comic Card**, invented adventure | Pop Rock | The same, heroic feel |
| **Saved template** (retired cards) | Pop | Neutral default |

## How the customer chooses (pick one)
1. **Recommended: show "Choose the sound".** Add Build My Card's genre step to Personalize, after "Add a song?". The card's default is pre-selected with a gold "Suits this card" badge, and all ten genres are there to change to. It costs one more step, but the customer is in control, and it matches Build My Card.
2. **Hidden default.** Use the card's default with no step. Faster, but the customer can't change the sound.

## What changes once approved
- **Card files:** each gets `songPreset: (brief) => presetId` in `types.ts` and the card files.
- **Lyrics:** `runLyrics` sends that preset ID instead of `""`.
- **Song request:** `compileSongPrompt` uses `MUSIC_PROMPT_TEMPLATE` with the preset, as Build My Card does. It keeps Personalize's own rules on using the name and the detail, and the placeholder retires.
- **Option 1 only:** the shared genre step is added to each card's question list, after `PT_song`.
- **Versions:** `PT_PROMPT_VERSION` and each card's version are bumped.

## Decisions for you
1. Approve or change the defaults in the table.
2. Option 1 (show "Choose the sound") or option 2 (hidden default).
3. Should a card's own song prompt (`songPrompt`, still null for every card) later add to the preset or replace it? My recommendation is to add to it: the preset sets the sound, and the card prompt adds its theme.
