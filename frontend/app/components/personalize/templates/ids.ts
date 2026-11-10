// Template ids and the page address, without the card files (Prompt 2 flows E-F4,
// 2026-11-09). The gallery and the page logic import this; the card files and the
// questionnaire load only when a card opens. Keep OPEN_TEMPLATE_IDS in step with
// PT_TEMPLATES in ./index.ts (index.ts checks it in development).

export const PT_RETURN_PATH = "/create/personalize-a-template";
export const SAVED_TEMPLATE_ID = "saved-template";
export const OPEN_TEMPLATE_IDS = ["horoscope", "on-this-day", "comic-card"] as const;

export function isOpenTemplate(id: string | null | undefined) {
  return Boolean(id) && (OPEN_TEMPLATE_IDS as readonly string[]).includes(id as string);
}
