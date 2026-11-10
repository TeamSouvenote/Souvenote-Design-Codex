// Card files that open the questionnaire. Add a card here once its question
// map exists; until then its gallery tile is "Coming soon".

import type { PtTemplate } from "../types";
import { comicCard } from "./comicCard";
import { horoscope } from "./horoscope";
import { onThisDay } from "./onThisDay";
import { SAVED_TEMPLATE_ID, savedTemplate } from "./savedTemplate";
import { OPEN_TEMPLATE_IDS } from "./ids";

export const PT_TEMPLATES: PtTemplate[] = [horoscope, onThisDay, comicCard];

/** The card file for a template id. Unknown or removed templates open as a saved template. */
export function templateFor(id: string | null | undefined): PtTemplate {
  return PT_TEMPLATES.find((template) => template.id === id) || savedTemplate;
}

export { SAVED_TEMPLATE_ID };
export { isOpenTemplate } from "./ids";

// ids.ts lists the open templates without importing the card files; keep the two in step.
if (process.env.NODE_ENV !== "production") {
  const listed = [...OPEN_TEMPLATE_IDS].sort().join(",");
  const actual = PT_TEMPLATES.map((template) => template.id).sort().join(",");
  if (listed !== actual) console.error(`templates/ids.ts OPEN_TEMPLATE_IDS (${listed}) doesn't match PT_TEMPLATES (${actual}).`);
}
