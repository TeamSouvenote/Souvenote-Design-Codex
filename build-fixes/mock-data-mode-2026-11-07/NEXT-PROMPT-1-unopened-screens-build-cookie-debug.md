# Prompt 1: unopened screens, production build, cookie settings on sign-in, debug hooks

Copy everything below the line into a new chat.

---

You're continuing the site audit of the Souvenote web app (Next.js 15 App Router, React 19, TypeScript, mock-data mode) on the branch `mock-data-mode`, in `C:\Users\wilso\Desktop\Souvenote AWS DESIGN\frontend`. The audit's Phases A–D are done. This prompt covers four follow-ups: items 1, 4, 6 and 9 of the "what else" list. List what you find, fix what's in scope, and ask before anything outside it.

## Read first (don't skip)
- `build-fixes/mock-data-mode-2026-11-07/SITE-AUDIT-2026-11-08.md`: the audit, its standards and its status.
- `build-fixes/mock-data-mode-2026-11-07/CHANGELOG.md`: read the sections from "Site audit against the BMC / Personalize standard" to the end. They record every fix made in Phases A–D and why.
- The design system:
  - `design-system/docs/01-foundations.md`: colours, contrast, type.
  - `design-system/docs/02-components.md`: especially 2.13 (logos, plus the one exception: the Welcome modal's gold wordmark on ivory is the owner's choice), 2.17–2.21, and 2.22–2.30 (content shell, settings, FAQ/legal/cookie banner, Community Cards, country and currency, after-purchase pop-up, signed-in menu and form behaviour, Phase B consistency, Phase D colours).
  - `design-system/docs/06-governance.md`: scope tables, the "Retired files" list, the version history.
  - `design-system/tokens/tokens.css`.
- My memory notes in `C:\Users\wilso\.claude\projects\C--Users-wilso-Desktop-Souvenote-AWS-DESIGN\memory\`, especially `crlf-and-shared-dev-server.md`.

## The four tasks

### 1. Open and measure every screen the audit never opened
These were reviewed in code only. Open each one in the browser at 1280×720, 1024×768, 768×1024 and 375×812, and measure it to the audit's standards (listed under "Standards" below):
- **Delivery's checkout pop-up and the "On its way" pop-up.**
  - Path: Saved Cards & Songs → "Print and send" on a finished card → Delivery.
  - Pick the saved recipient "Linda Wilson" from the picker and fill a return address.
  - Then Continue to checkout → Confirm payment → Send to print. Press only real action-bar buttons.
- **The two-step log-in code step.**
  - In Settings → Password & sign-in, turn two-step sign-in on. In mock mode the code is `246810`; the Mock data badge shows it.
  - Sign out, then log in as `demo@souvenote.com` / `Souvenote123!`. Check the code step: a wrong code, the right code, and "Back to email and password".
- **The two-step setup dialog** (QR code, key, verify) and **turning it off**.
- **The Delete account dialog.** Check the typed-DELETE gate and the two-step failure messages from audit B6. Don't actually delete the demo account unless you reset the mock data afterwards with the Mock data badge's "Reset all mock data".
- **The Settings edit states:**
  - Personal info edit;
  - Saved recipients add and edit (including an invalid ZIP);
  - Payment methods add and edit, and the Remove confirm;
  - Change password with mismatched passwords.
- **Contact:** a successful send on a phone.

For each one, check: the dialog is labelled and described by elements that exist; Tab stays inside; Escape closes it; focus returns to the opener. Also check that no box scrolls on its own, nothing is clipped or spills past its card, and nothing scrolls sideways. Take a screenshot of each distinct state.

### 4. Production build
`next build` hasn't been run since the Remaining Screens phases. **Don't run it in `frontend/`**: another chat's dev server may use its `.next`, and a build there causes random 404s. Instead:
- Copy `frontend/` (excluding `node_modules` and `.next`) into a fresh, uniquely named `%TEMP%` folder.
- Add a `node_modules` junction: PowerShell `New-Item -ItemType Junction`.
- Run `npm run build` there.
- Report errors, warnings, the route table (static or dynamic), and the first-load JS size per route. Flag any route over about 200 kB.
- Fix build errors in the real `frontend/`, re-sync the copy, and rebuild until it's clean.

### 6. "Cookie settings" on the sign-in screens
The cookie banner (`components/content/CookieConsent.tsx`) can be reopened only from the landing footer's "Cookie settings" link (`CookieSettingsButton`). The sign-in screens (`/login`, `/signup`, `/forgot`, `/verify`, `/verify/expired`, `/reset`, `/recover`, `/signup/terms`) use their own small footer (`AuthFooter` in `components/Auth.tsx`, styles in `styles/auth.css`) and have no such link. So someone who declines the banner there can't reopen it.
- Add a "Cookie settings" button to that footer, styled to match its existing links: 44px targets, the same type.
- Check that it reopens the banner focused, with the current choice shown, and that focus returns to it after Accept or Decline. Note: the browser pane may not run `requestAnimationFrame` when the window is hidden. If focus checks fail, swap `requestAnimationFrame` for a 16ms timer in the test page only, and say so.
- Update design-system 2.24 (cookie banner).

### 9. Debug hooks in the bundle
`components/DemoBalance.ts` still sets `window.__souvSetDemoBalance` and `window.__souvZeroDemoBalance` in `useDemoBalance`.
- Search the whole repo, including test and QA scripts and `build-fixes/`, for any use of them.
- If nothing uses them, remove them and their `declare global` lines.
- If something does use them, keep them but only set them when `MOCK_MODE` is on (`lib/mockMode.ts`), and say what uses them.
- Also search for any other `window.__…` assignments outside `components/bmc/*` and `components/personalize/*`, and report them.

## Standards (the same as the audit)
- **Colour:** design-system tokens only (no raw hex). Each colour keeps its meaning:
  - gold = AI only, with espresso text on it;
  - berry = emphasis (one script word per heading), labels, hovers;
  - forest = actions and structure; on forest, text is ivory, muted text is oat, accents are gold (never berry);
  - terracotta = decoration and "yours", never text; text on terracotta fills is deep espresso.
- **Logo:** the gold logo goes only on forest (the Welcome modal is the owner's exception). `hero-souvenote-card-face.png` and `logomark-gold.png` are retired.
- **Layout and fit:**
  - No box scrolls on its own. The exceptions are the legal tables on phones, which scroll sideways in a named, focusable region.
  - Nothing clipped or spilling past its card; no sideways page scroll.
  - Even grids; tile titles share a top line; action buttons the same size, on one line, labels not wrapping.
- **Credits:** no credit check before the moment of spending (Create or a paid redo).
- **Accessibility:**
  - Toggles use `aria-pressed`; a radio group always has a checked item.
  - Dialogs are labelled and described, Tab is trapped, Escape closes, focus returns.
  - Focus moves to the new heading on a view change but not on first load, and never falls to `<body>`.
  - Every field has a label.
  - Targets are at least 44px (never under 24px).
  - Reduced motion is respected.
- **Text:** named days keep their capitals; second person in drafts; no control characters.
- **Code:**
  - `next/image` for static assets; `<img>` only for blob, data or remote URLs, with a reasoned eslint-disable.
  - No unused state, exports, props or imports.
  - No react-hooks eslint-disable unless it's a documented run-once effect.
  - Shared helpers instead of duplicates.
  - Paid actions are idempotent, and failure messages are honest.

## Tools and method
- **Browser:** use a temp copy of `frontend/` on its own port. Another chat may serve the real `frontend/`, and a separate origin keeps its localStorage apart.
  - **Make a fresh copy for this session:** a new, uniquely named `%TEMP%` folder plus a `node_modules` junction, and a new `.claude/launch.json` entry pointing at it (local only, never commit it). Start it with `preview_start`.
  - **An earlier copy exists** at `%TEMP%\souv-audit2-copy-190833` (launch config `frontend-audit2-copy`, port 3150). Don't edit or reuse it.
  - **Re-sync** changed files into your copy before each check.
- **Measuring script:** `%TEMP%\souv-audit-20261108\install.js`. Copy it into the temp copy's `public/` and load it with `fetch('/__audit-install.js').then(r => r.text()).then(eval)`.
  - It defines `window.__run(urls, sizes, wait, actScript)`, which measures each page in fixed-size iframes, and `window.__wait()`.
  - It reports page height and width, boxes that scroll, clipped text, offscreen elements, spills and small targets.
  - Use a fresh, uniquely named temp folder for your own copies of these scripts and for screenshots.
- **Proving a CSS change does nothing:** use `%TEMP%\souv-audit-20261108\` `__audit-fp2.js` (or the copy in the old temp copy's `public/`). It records computed-style fingerprints across 24 targets at two sizes.
  - Run a baseline twice to measure noise. It already skips `template`/`title`/`meta`/`link` elements and forces images to load.
- **Mock data:**
  - Demo login: `demo@souvenote.com` / `Souvenote123!`.
  - The Mock data badge (bottom right) can add credits or reset all mock data.
  - Credits live in `localStorage.souv_mock_db.balances["11111111-2222-4333-8444-555555555555"]`.
- **Scripted edits:**
  - Many files are CRLF; normalise to LF in scripts and write back the original ending.
  - **JS `replace()` turns `$$` into `$`.** It dropped the dollar sign from prices twice. Use `split/join`, a replacer function, or the Edit tool for anything containing `$`.
  - Bash heredocs with apostrophes and inline `node -e` with backticks or `\d` break. Write script files with the Write tool instead.

## Rules
- **Don't change Build My Card or Personalize a Template** (`components/bmc/*`, `components/personalize/*`, `bmc-*.css`, `personalize.css`, and their `page.tsx`). If a shared component needs changing, tell me first.
- **Never delete anything:**
  - Don't `rm` files; retire them in the docs (governance "Retired files" table).
  - Put screenshots and scratch scripts in a new, uniquely named temp folder outside the repo.
  - Back up any file before a scripted rewrite.
- **Other sessions may be working in this folder:**
  - Check file modification times before editing, and don't edit files changed in the last few minutes without asking.
  - Don't run `next build` in `frontend/`.
- **Log every change** in `build-fixes/mock-data-mode-2026-11-07/CHANGELOG.md` as a new section: request, what changed, files, verified, not covered. Update `SITE-AUDIT-2026-11-08.md`'s status and the design-system docs (with a governance version entry) whenever a UI pattern changes.
- **Don't commit or push.** Everything goes out together at the end, and only when I say so.
- **Report honestly.** Say what you couldn't check. Don't present a check as done if you only partly did it.

## Deliver
1. A short findings list for task 1 (severity, screen, size, what's wrong, proposed fix). Fix clear bugs in scope straight away; ask before anything bigger.
2. The build result (task 4).
3. Tasks 6 and 9 built and verified.
4. A recap: what changed, what was verified, what wasn't, and anything that needs my decision.
