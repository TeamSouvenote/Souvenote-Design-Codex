// Cookie consent (owner decision 2026-11-08): analytics cookies only after the
// visitor says yes. The choice is stored with its date and the Cookie Policy
// version; a new version asks again. Essential storage (sign-in, cart) never
// needs consent and isn't controlled here.

export const COOKIE_CONSENT_KEY = "souv_cookie_consent";
/** Bump when the Cookie Policy's analytics wording changes: everyone is asked again. */
export const COOKIE_POLICY_VERSION = "2026-11-08-draft";
const CONSENT_LIFETIME_MS = 365 * 24 * 60 * 60 * 1000;

export const OPEN_COOKIE_SETTINGS_EVENT = "souv-open-cookie-settings";
export const COOKIE_CONSENT_CHANGED_EVENT = "souv-cookie-consent-changed";

export type CookieChoice = "accepted" | "declined";
export type CookieConsent = { choice: CookieChoice; decidedAt: string; version: string };

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(COOKIE_CONSENT_KEY) || "null") as Partial<CookieConsent> | null;
    if (!parsed || (parsed.choice !== "accepted" && parsed.choice !== "declined") || typeof parsed.decidedAt !== "string") return null;
    if (parsed.version !== COOKIE_POLICY_VERSION) return null;
    if (Date.now() - new Date(parsed.decidedAt).getTime() > CONSENT_LIFETIME_MS) return null;
    return parsed as CookieConsent;
  } catch {
    return null;
  }
}

export function writeCookieConsent(choice: CookieChoice): CookieConsent {
  const consent: CookieConsent = { choice, decidedAt: new Date().toISOString(), version: COOKIE_POLICY_VERSION };
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // Private mode: the choice holds for this visit only.
  }
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: consent }));
  return consent;
}

/**
 * Reopens the banner (footer "Cookie settings"). `opener` is where focus goes
 * back after Accept or Decline. It's passed in because Safari doesn't focus a
 * button on click, so document.activeElement can't be relied on.
 */
export function openCookieSettings(opener?: HTMLElement | null) {
  window.dispatchEvent(new CustomEvent<HTMLElement | null>(OPEN_COOKIE_SETTINGS_EVENT, { detail: opener ?? null }));
}
