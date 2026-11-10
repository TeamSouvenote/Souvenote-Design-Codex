"use client";

// One Personalize card: resolves the card file and opens its questionnaire. Loaded with
// next/dynamic by PersonalizeTemplateClient, so the gallery's first load doesn't carry the
// questionnaire, Review and the card files (Prompt 2 flows E-F4, 2026-11-09).

import * as React from "react";
import { PtQuestionnaire } from "./PtQuestionnaire";
import { templateFor } from "./templates";

type Props = Omit<React.ComponentProps<typeof PtQuestionnaire>, "template"> & { templateId: string | null };

export default function PtCard({ templateId, ...rest }: Props) {
  const template = templateFor(templateId);
  return <PtQuestionnaire key={`${template.id}-${rest.resumeDraftId || "new"}`} template={template} {...rest} />;
}
