import { AUTH_SESSION_STORAGE_KEY } from "../../lib/cognitoAuth";

/**
 * Stops signed-in users briefly seeing the public landing page before
 * SignedInRedirect moves them to /home.
 *
 * An inline script on `/` runs before the page paints. If the browser holds a
 * stored sign-in, it adds a style that hides the page (the background stays).
 * SignedInRedirect removes the style if the sign-in turns out to be invalid;
 * the style also lifts itself after 3s in case anything stalls. Visitors with
 * no stored sign-in (including crawlers) never get the style.
 */
export const SIGNED_IN_HOLD_STYLE_ID = "souv-signed-in-hold";

const HOLD_CSS = [
  ".souv-landing-public > :not(.l-backdrop) { visibility: hidden; animation: souv-hold-reveal 0s linear 3s forwards; }",
  "@keyframes souv-hold-reveal { to { visibility: visible; } }",
].join(" ");

export const SIGNED_IN_HOLD_SCRIPT = `(function () {
  try {
    var key = ${JSON.stringify(AUTH_SESSION_STORAGE_KEY)};
    if (!localStorage.getItem(key) && !sessionStorage.getItem(key)) return;
    var style = document.createElement("style");
    style.id = ${JSON.stringify(SIGNED_IN_HOLD_STYLE_ID)};
    style.textContent = ${JSON.stringify(HOLD_CSS)};
    document.head.appendChild(style);
  } catch (error) {}
})();`;

/**
 * The reverse, for the signed-in home (`/home`): an inline script that runs
 * before the page paints and, when the browser holds no stored sign-in,
 * replaces the URL with the public landing page (`/`), so signed-out visitors
 * never see /home. A stored sign-in that turns out to be invalid is handled
 * after load by SignedOutRedirect.
 */
export const SIGNED_OUT_REDIRECT_SCRIPT = `(function () {
  try {
    var key = ${JSON.stringify(AUTH_SESSION_STORAGE_KEY)};
    if (localStorage.getItem(key) || sessionStorage.getItem(key)) return;
    document.documentElement.style.visibility = "hidden";
    location.replace("/");
  } catch (error) {}
})();`;

/**
 * Every page (root layout): marks <html> before the first paint when the
 * browser holds a stored sign-in, so the nav doesn't flash "Log In / Start for
 * Free" while the sign-in is being checked (audit I5, 2026-11-08). landing.css
 * hides the signed-out nav buttons while the mark is there (lifting itself
 * after 3s); AuthProvider removes the mark if the sign-in turns out invalid.
 */
export const SESSION_HINT_ATTR = "data-souv-session";

export const SESSION_HINT_SCRIPT = `(function () {
  try {
    var key = ${JSON.stringify(AUTH_SESSION_STORAGE_KEY)};
    if (localStorage.getItem(key) || sessionStorage.getItem(key)) {
      document.documentElement.setAttribute(${JSON.stringify(SESSION_HINT_ATTR)}, "1");
    }
  } catch (error) {}
})();`;
