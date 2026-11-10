import type { CardDraft } from "../../lib/api";

/**
 * Library storage (PRD §5): drafts and finished creations are kept for 12
 * calendar months from the creation's last saved edit, or from when it was
 * first saved if it was never edited. Viewing it, or an order or job update,
 * doesn't move the date. There's no Extend control.
 */
export const LIBRARY_STORAGE_MONTHS = 12;

/** Shown as "expires soon" inside this many days. */
const SOON_DAYS = 30;

export function lastSavedEdit(draft: CardDraft): Date {
  const stamp = draft.last_saved_edit_at || draft.created_at;
  const date = new Date(stamp);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

/** 12 calendar months after the last saved edit (31 Jan becomes the end of the next year's January). */
export function storageExpiry(draft: CardDraft): Date {
  const from = lastSavedEdit(draft);
  const expiry = new Date(from);
  expiry.setMonth(expiry.getMonth() + LIBRARY_STORAGE_MONTHS);
  // setMonth rolls 29 Feb / 31st into the next month; pull back to that month's last day.
  if (expiry.getDate() !== from.getDate()) expiry.setDate(0);
  return expiry;
}

export function expiresSoon(expiry: Date, now = new Date()): boolean {
  return expiry.getTime() - now.getTime() <= SOON_DAYS * 24 * 60 * 60 * 1000;
}

/** A long date in the visitor's own locale order: "8 November 2027" (en-CA, en-GB) or "November 8, 2027" (en-US). */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}
