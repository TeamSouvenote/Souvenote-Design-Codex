# Build My Card: backend hand-off for the text models

On the `mock-data-mode` branch, Build My Card's interviewer, inside-message writer, caption, genre-recommendation and lyric tasks are answered in the browser by `frontend/app/lib/mockInterview.ts`. This note is what the backend needs to replace that mock with Claude Haiku 5.5 on Bedrock (and the open caption/lyric model), without changing the frontend.

Canonical prompt text lives in `frontend/app/components/bmc/prompts.ts` (see `PROMPT_TEMPLATE_VERSION`). Catalogues and genre presets are in `components/bmc/catalog.ts` (see `CATALOG_VERSION`). **These two files are the source of truth** (owner decision, 2026-11-08). The reference documents they began from (`reference-materials/Build My Card/`) are early drafts, out of date as of 2026-11-08; see `OUT-OF-DATE.md` there. Keep the backend copies in sync with these files, or serve them from the backend and have the frontend read them.

## Routes the frontend already calls (when `NEXT_PUBLIC_MOCK_MODE=0`)

All are `POST`, JSON, authenticated with the existing Cognito bearer token (`buildApiHeaders` in `lib/api.ts`), under `NEXT_PUBLIC_API_BASE_URL`.

| Route | Body | Response | Model |
|---|---|---|---|
| `/build-my-card/interview` | `InterviewTurnInput` (below) | `InterviewProposal` (below) | Haiku 5.5, interviewer system instruction |
| `/build-my-card/inside-message` | `{ message_context_json, previous_drafts, user_direction }` | `{ message, needsClarification[] }` | Haiku 5.5, message-writer system instruction + inside-message template |
| `/build-my-card/caption` | `{ context, previous_drafts }` | `{ caption, needsClarification[] }` | Not yet chosen (caption template) |
| `/build-my-card/genre-recommendations` | `{ occasion, vibes[], intendedFeeling, userDirection }` | `{ recommendations: [{ presetId, reason }] }` | Not yet chosen (recommendation template) |
| `/build-my-card/lyrics` | `{ story_context_json, preset_id, previous_drafts, user_direction }` | `{ lyrics, needsClarification[] }` | Not yet chosen (lyric writer template) |

`message_context_json`, `context` and `story_context_json` are the `TextContext` built by `textContext()` in `components/bmc/compile.ts`: only explicit facts (occasion, relationship, names, the customer's own words, motif, resolved feeling, a concept meaning labelled as imagined staging, the approved caption, the current inside message when relevant, and a `sensitive` flag for Sympathy and Get Well).

**Added 2026-11-08:**
- `language` fills `{{language}}`; it is always `"English"` for now.
- `signoff` is the customer's choice: `auto`, `love`, `from` or `none`. `signoffPolicy` is the matching sentence for `{{signoff_policy}}`, for example `End with exactly "From Jo" on its own line.` With no sender name it says to add no sign-off.
- `intendedFeeling` is the written feeling plus any chosen vibes (`"proud; humorous, heartfelt"`). This is for the writers only; the image and music prompts keep the written feeling alone.
- `conceptMeaning` now includes the T2 scene detail. For Decorate it describes the customer's real photo with their accessories and lettering (`a crown on Grandma and the lettering "Linda · 12 May 2026"`); it is not labelled as staging.
- Lyric rewrites send every earlier draft (`song.lyricDrafts`) as `previous_drafts`, not just the current one.

**Redraft note (`user_direction`, owner approved 2026-11-08; see `REDRAFT-STEERING-PROPOSAL.md`):**
- The customer's optional "What should change?" note. It is sent only on a redraft (null on the first draft), already cleaned by `cleanDirection()`: one line, no control characters, at most 120 characters. Re-check this on the server.
- When it is present, fill `{{user_direction}}`. When it is null, remove the steering sentences with `stripUserDirection()` (`components/bmc/prompts.ts`) so no empty slot reaches the model. The lyric template's "meaningfully different from {{previous_drafts}}" sentence always stays.
- Validate the output exactly as before. The note never becomes a card fact. The app saves it alongside the draft it produced (`message.aiVersion.direction`, `song.lyricsDirection`) for support.
- Prompt version: `bmc-prompts-2026-11-08b`.

## Interviewer

- Model: `global.anthropic.claude-haiku-5-5`, Bedrock Converse, thinking disabled.
- System prompt: `INTERVIEWER_SYSTEM_INSTRUCTION` (verbatim).
- Structured output: `outputConfig.textFormat` with `INTERVIEW_RESPONSE_SCHEMA` from `components/bmc/engine.ts` (every object closed, every key required). Prewarm the schema; the first compilation is slow.
- Per-turn input (`InterviewTurnInput` in `engine.ts`): `current_step`, `brief_snapshot` (compact: no answer history, no photo thumbnails), `latest_answer { id, question_id, text, controls }`, `missing_fields`, `conflicts`, `allowed_fields`, `allowed_controls`, `skipped_optional_fields`, `task`, `catalog_version`. `question_id` is a small addition to the canonical input so the server knows which question was answered.
- Response (`InterviewProposal`): `updates[{ field, value_json, source_answer_id, evidence_quote }]`, `conflicts[{ field, explanation, source_answer_ids }]`, `question { text, target_step, control_ids }`, `suggested_action: ask | advance | review`.
- The frontend already enforces the app-side rules in `applyProposal()` and `decideNext()`: allow-listed fields only, `value_json` decoded and type-checked, `evidence_quote` must be an exact excerpt of the answer, never overwrite a value the customer set, never change the mode, drop stale proposals, and only use tailored wording when it targets the question the app would ask anyway. The backend should validate the same way before returning, and record latency, tokens and errors per task.
- The interviewer is called only after a free-text answer (deterministic controls don't need a model call). One retry, then the frontend falls back to the bank's wording; a failure never becomes a question.
**No-photo look follow-ups (2026-11-08):** `P4_look_hair`, `P4_look_style` and `P4_look_signature` are chosen by the app (`bmc/lookDetails.ts`): only after a description of a person, only for details it leaves out, at most two, and a skip ends them. Haiku may reword them only. It must never suggest a look, or infer one from a name, and can replace the mock's person-or-pet keyword check with its own classification of the description.


## Inside message

- Separate request from interviewing. Initial draft is automatic on reaching the message question once a purpose exists; the frontend keys it so revisits and refreshes don't draft twice.
- Initial draft plus 5 successful regenerations; failures and manual edits don't count.
- The "Also create an AI version" toggle asks for a meaningfully different suggestion while the customer's own text stays untouched. Late results only ever fill the AI slot.

## Generation (one backend change needed)

`startGeneration` now sends `parts: { image: boolean; song: boolean }` from Build My Card so an image-only card costs 1 credit and a front or audio replacement costs 1. **The live NestJS DTO rejects unknown fields (`forbidNonWhitelisted`)**, so `lib/api.ts` only sends `parts` in mock mode. To finish:

1. Add optional `parts` to `StartGenerationDto` and charge `image + song` credits (keep 2 when absent, for Personalize).
2. Stop creating a `message` asset for Build My Card: the inside message is text on the brief (`creative_brief.message`), chosen by `printedChoice`.
3. Remove the `MOCK_MODE` condition around `parts` in `startGeneration`.

The frontend freezes a snapshot before every paid request in `creative_brief.control.generation`: action key, brief version, template and catalog versions, `compiledImagePrompt`, `compiledMusicPrompt`, and the printed message. Repeat clicks reuse the action key while the compiled prompts are unchanged.

**Review approvals (2026-11-09):** `creative_brief.control.approvals` = `{ front, message, song }`. Each holds the exact version approved: the front's asset id, the printed message's key (`ai:5:82` = version, edit number and length), and `songAssetId:lyricsVersion`. Personalize uses the same field. The frontend treats an approval as valid only while it still matches, so the server can store it as-is. If the server ever checks "approved before send" itself, it should compare the same keys.

## Print and QR

- The compiled image prompt uses the provisional 6% inset (`PRINT_PROFILE` in `compile.ts`) until the printer's bleed and safe area are confirmed.
- The custom QR (`components/bmc/QrSongCode.tsx`): error correction H, 4-module quiet zone, the two-tone mini logo on a forest tile at 20% of the code width, "Scan me" above and "To Play Song" below. The live code must point at the stable, application-owned song page and be test-printed and scanned on iPhone Safari and Android Chrome.

## Photos

Up to 16 reference images, the limit of `fal-ai/gpt-image-2.5-flare/edit` (`image_urls` maxItems 16, OpenAPI schema checked 2026-11-07). The frontend still sends only file metadata to `/uploads/mock`; real signed-URL upload is unchanged backend work.
