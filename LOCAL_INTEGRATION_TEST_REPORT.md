# Souvenote Local Integration Test Report

- **Date and time:** 2026-11-02, 07:13–07:20 PST
- **Branch / commit:** `landing-page-redesign` @ `af89d00` (working tree unchanged by testing)
- **Tester:** Claude Code (read-only test; no source, config, dependency, AWS, or Git changes)
- **Overall status:** **PARTIAL PASS**

The frontend renders cleanly, public pages and assets load, and frontend→backend public API calls work without CORS/network errors. Cognito configuration on disk is now valid (client, domain, callback, discovery, and JWKS all check out). **Authentication is blocked by a stale backend process** that is still running with the configuration it loaded before the `.env` files were edited, which produces "Could not load Cognito signing keys." Social sign-in (Google/Apple/Facebook) is also not enabled on the Cognito app client.

> Redaction policy: no environment values, client IDs, pool IDs, domains, tokens, or URLs with query strings appear in this report. Config checks report key names and booleans only.

---

## Services running

| Port | Service | PID | Started | Status |
|---|---|---|---|---|
| 3000 | Frontend — `next dev` (from `frontend/`) | 33328 (parent 18848) | 2026-11-02 07:01 | **Running**, HTTP 200 |
| 4000 | Backend — `node --enable-source-maps dist/main` (from `backend/server/`) | 38936 | 2026-11-02 05:16 | **Running**, `/api/health` 200, database connected — **but stale config (see below)** |
| 3100 | Extra frontend — `next start -p 3100` (from `frontend/`) | 34208 (parent chain 6480 → 39924 → bash 7836) | 2026-11-01 21:02 | Running, HTTP 200. Not started by this test. Left untouched. |
| 5432 | PostgreSQL | 2128 | — | Listening |

---

## Tests performed

1. Inspected `frontend/package.json` and `backend/server/package.json` scripts.
2. HTTP availability of frontend (3000), backend (4000), documented health endpoint `GET /api/health`, Swagger `/api/docs`.
3. Frontend API base URL validation (boolean checks against `.env.local`).
4. CORS preflight and cross-origin GET from `Origin: http://localhost:3000`.
5. Headless Chrome (CDP) run over 15 public routes: console errors/warnings, runtime exceptions, failed requests (incl. CORS), HTTP ≥ 400, broken images, links, backend calls.
6. Cognito key presence and frontend/backend pairing (booleans only).
7. Cognito OIDC discovery and JWKS endpoints for the configured pool.
8. Hosted-UI authorize redirect: captured in-browser by clicking **Log In → Continue with Google**, request intercepted (not completed), parameters validated; then the same request sent to Cognito without following redirects.
9. Callback-registration test using a deliberately wrong callback (negative control).
10. Investigation of "Could not load Cognito signing keys." including a diagnostic call to the running backend with a **fabricated, unsigned dummy token** (not a credential) to identify which code branch fails.
11. Lint, type-check, unit tests, and production builds using existing scripts/tools, run in an isolated temp copy of the source so the live servers' `.next` and `dist` folders were not overwritten.
12. Process/port inventory and interference analysis.
13. Final confirmation that ports 3000 and 4000 are still serving.

---

## Passed checks

| Check | Method | Result |
|---|---|---|
| Frontend reachable | `curl http://localhost:3000/` | 200, renders, no runtime exceptions |
| Backend reachable + health | `curl http://localhost:4000/api/health` | 200, `status: ok`, `database: connected` |
| Swagger docs | `curl /api/docs` | 200 |
| Frontend API base URL | Boolean check of `NEXT_PUBLIC_API_BASE_URL` | Points to local backend on port 4000 with `/api` prefix; code fallback is the same |
| CORS preflight | `OPTIONS /api/pricing` with local origin | 204, origin echoed, credentials allowed, `content-type, authorization` allowed |
| Cross-origin public API in browser | CDP network log on `/pricing` | `GET /api/pricing` → 200, no CORS/network errors |
| Unauthenticated protected route | `GET /api/auth/me` with no token | 401 (correct) |
| Public pages | Browser load of `/`, `/pricing`, `/community-cards`, `/create/personalize-a-template`, `/create/build-my-card`, `/faq`, `/contact`, `/legal/privacy-policy`, `/signup`, `/login` | No exceptions, no failed requests, no 4xx/5xx |
| Internal links | `curl` on all 16 internal landing links | All 200 |
| Images | Browser `naturalWidth` check after load/scroll | 0 broken (12 on landing; all others OK) |
| Landing → Log In navigation | Clicked navbar **Log In** | Navigates to `/login`; social + email login controls render |
| Frontend Cognito keys present | Key-name check | `REGION`, `USER_POOL_ID`, `CLIENT_ID`, `DOMAIN`, `REDIRECT_URI`, `LOGOUT_URI` set, non-placeholder. `NEXT_PUBLIC_COGNITO_OAUTH_SCOPES` absent → code default `openid email profile` (acceptable) |
| Backend Cognito keys present | Key-name check | `COGNITO_REGION`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `PORT`, `DATABASE_URL` set |
| Frontend/backend pairing | Equality booleans | Pool ID, client ID, and region match between frontend and backend `.env` files |
| Format sanity | Regex booleans | Pool ID region prefix = region; domain is in the same region |
| OIDC discovery | `GET <issuer>/.well-known/openid-configuration` | 200; `issuer` matches expected; `authorization_endpoint` host equals configured domain (domain belongs to this pool) |
| JWKS | `GET <issuer>/.well-known/jwks.json` | 200; 2 keys, all RS256 |
| Authorize URL construction | In-browser intercept | Configured domain over HTTPS, path `/oauth2/authorize`, client ID = env, callback = `http://localhost:3000/login`, `response_type=code`, scope `openid email profile`, PKCE S256, state carries nonce + `returnTo=/create` + `authPath=/login` |
| Cognito accepts client + callback | Authorize request, no redirect follow | 302 to hosted `/login`, no error; hosted login page served (200) |
| Callback registration (negative control) | Same request with a wrong callback | `error=redirect_mismatch` → proves client exists and `localhost:3000/login` is registered |
| Frontend type-check | `tsc --noEmit` | 0 errors |
| Frontend production build | `next build` (temp copy) | Success |
| Backend type-check | `tsc --noEmit` | 0 errors |
| Backend unit tests | `jest` (`npm test` equivalent) | 1 suite, 5/5 passing |
| Backend production build | `nest build` (temp copy) | Success |

---

## Failed checks

| # | Check | Result | Explanation | Minimal next step |
|---|---|---|---|---|
| F1 | **Backend token verification** | **FAIL** | Running backend returns `401 "Could not load Cognito signing keys."` even though the JWKS endpoint for the current `.env` returns 200 from this same machine. The process (started 05:16) predates the `.env` edit (06:55) and has no watcher to reload it. | Restart the backend (see Exact safe next steps). |
| F2 | **Social sign-in (Google / Apple / Facebook)** | **FAIL** | Cognito's hosted page shows *"Login option is not available. Please try another one"* for all three `identity_provider` values. Only the COGNITO (email/password) provider is enabled on the app client. | In Cognito console → App client → Login pages / Identity providers: enable Google, Facebook, Sign in with Apple (each IdP must first be configured under *Social and external providers*). Or hide those buttons until configured. |
| F3 | Backend lint | **FAIL** | `eslint` (without `--fix`): 168 errors, 1 warning. 163 are `prettier/prettier` (mostly CRLF line endings). Substantive: `generation.controller.ts:1` unused `Get`, `Param`; `auth.service.ts:139,142` `no-unsafe-return`; `cognito-jwt.service.ts:58` unnecessary type assertion; `main.ts:53` floating promise (warning). Pre-existing; not an integration blocker. | Separate cleanup PR; decide on line-ending policy (`.gitattributes` / Prettier `endOfLine`) before running `--fix`. |

---

## Cognito/authentication findings

### Root cause of "Could not load Cognito signing keys."

**Classification: local app — stale backend process configuration.** Not the Cognito hosted page, not client/domain pairing, not callback configuration, not an AWS outage.

Evidence chain:

1. **Where the message comes from:** `backend/server/src/auth/cognito-jwt.service.ts:86`. It is thrown only when the backend's `fetch(<issuer>/.well-known/jwks.json)` returns a non-OK status. The issuer is built from `COGNITO_REGION` + `COGNITO_USER_POOL_ID` read once at process start (constructor, line 24–30). The Cognito hosted page never emits this text.
2. **When it fires:** after sign-in, the frontend calls `GET /api/auth/me` with the Cognito ID token (`frontend/app/lib/api.ts:343`). `CognitoAuthGuard` → `verifyToken` → `getSigningKey` → JWKS fetch.
3. **Current config is good:** discovery and JWKS for the pool in the current `backend/server/.env` both return 200 (2 RS256 keys) from this machine. So AWS and the network are fine.
4. **Running process disagrees:** a fabricated dummy token with a non-existent key ID sent to the live backend returned *"Could not load Cognito signing keys."* A backend with the current config would have fetched JWKS successfully and returned *"Cognito signing key was not found."* instead. Therefore the live process is using a different (old) pool/region.
5. **Timeline:** backend PID 38936 started **05:16**; both `backend/server/.env` and `frontend/.env.local` were modified at **06:55**; the frontend dev server was restarted at **07:01** (picked up new values) but the backend was not. The backend's `nest start --watch` parent process is **no longer running**, so nothing will reload it. `backend/server/dist` was also rebuilt at 07:01, so the running process is likely on older compiled code too.

### Other Cognito results

| Area | Result |
|---|---|
| Client ↔ domain pairing | **Correct.** Pool discovery's `authorization_endpoint` is on the configured domain; Cognito serves the login page for this client (the previous session's "Client does not exist" error is resolved). |
| Callback configuration | **Correct.** `http://localhost:3000/login` is accepted; a wrong callback is rejected with `redirect_mismatch`. |
| Logout URI | Configured to local origin (not exercised — would require a session). |
| Social IdPs | **Not enabled** on the app client (F2). |
| Email/password | Hosted page offers it; the in-app email/password form uses the Cognito API directly. Not exercised (would require credentials). |
| AWS read access | Local AWS CLI identity lacks `cognito-idp:Describe*`/`List*`; console-level settings could not be read directly. |
| Backend `AWS_REGION` vs `COGNITO_REGION` | Differ. Harmless for auth (`COGNITO_REGION` takes precedence); noted for S3/other services. |

---

## Frontend/backend integration findings

- **Clean for public traffic.** No CORS errors, no failed requests, no 4xx/5xx, no runtime exceptions on any tested route.
- The landing page (`/`) makes **no** backend calls; the API-backed public feature reached from it is `/pricing` → `GET /api/pricing` (200).
- Backend CORS is `origin: true, credentials: true` (reflects any origin) — fine for local, should be restricted before production.
- **Minor:** placeholder links `#todo-about` (footer, all pages) and `#todo-social` (inner-page footer).
- **Minor:** Next.js warning on `/` — LCP image `/assets/pt-comic-back.jpg` should have `priority`.

---

## Build, lint, type-check, and test results

Scripts available:

| Package | Scripts |
|---|---|
| `frontend` | `dev`, `build`, `start` (no `lint`, no `test`) |
| `backend/server` | `build`, `format`, `start`, `start:dev`, `start:debug`, `start:prod`, `db:migrate:phase1`, `lint`, `test`, `test:mock-flow`, `test:watch`, `test:cov`, `test:debug`, `test:e2e` |

| Check | Command | Result |
|---|---|---|
| Frontend lint | — | **NOT TESTABLE** — no script, ESLint not installed |
| Frontend type-check | `npx tsc --noEmit` | **PASS** |
| Frontend tests | `node --test app/lib/cognitoAuth.test.mjs` (no `test` script exists) | **NOT TESTABLE** — Node 26 strip-only TS mode rejects a parameter property in `cognitoAuth.ts` (`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`) |
| Frontend build | `npx next build` | **PASS** |
| Backend lint | `npx eslint "{src,apps,libs,test}/**/*.ts"` (the `lint` script's `--fix` was deliberately omitted) | **FAIL** — see F3 |
| Backend type-check | `npx tsc --noEmit` | **PASS** |
| Backend unit tests | `npx jest` | **PASS** (5/5) |
| Backend e2e | `test:e2e` | **NOT RUN** — boots against the real database and asserts `GET /` returns "Hello World" (Nest scaffold); the app serves 404 at `/`, so it would fail regardless |
| Backend build | `npx nest build` | **PASS** |

Isolation note: lint/type-check/test/build ran in a temporary copy at `%TEMP%\souv-e2e-xzASnv` (source verified byte-identical to the repo via `diff -rq`/`cmp`; `.env*` files not copied; `node_modules` linked read-only by junction). Running `next build` / `nest build` in place would have overwritten `.next` / `dist` used by the live servers.

---

## Process/port findings

1. **Stale, orphaned backend (high impact).** PID 38936 on :4000 runs `dist/main` from 05:16; its parent process no longer exists, so there is no watch/reload. It predates the 06:55 `.env` change and the 07:01 `dist` rebuild. This is the direct cause of F1.
2. **Extra production server on :3100 (medium risk).** `next start -p 3100` (PID 34208, started 2026-11-01 21:02 from a Git Bash shell) serves from the same `frontend/.next` directory that `next dev` on :3000 now writes to. `.next` currently contains only dev artifacts (no `BUILD_ID`); :3100 still answers 200 from in-memory state but may serve stale or broken pages, and any future `next build` would conflict with the dev server. It does not bind :3000 or :4000 and does not affect the backend. **Left running as instructed.**
3. No duplicate listeners on :3000 or :4000. PostgreSQL on :5432 is up and the backend reports it connected.
4. Unrelated Codex/OpenAI node processes are present; they do not bind any of the project ports.

---

## Required fixes, ordered by priority

1. **P0 — Restart the backend** so it loads the current `backend/server/.env` and current code (resolves "Could not load Cognito signing keys."). No code change needed.
2. **P1 — Enable or hide social providers.** Either configure Google / Facebook / Sign in with Apple in Cognito and enable them on the app client, or temporarily hide those buttons on `/login` and `/signup`.
3. **P2 — Decide on the :3100 server.** Its owner should stop it if unneeded, or run it from a separate build directory so it doesn't share `frontend/.next` with `next dev`.
4. **P3 — Backend lint debt.** Fix the 5 substantive ESLint issues; agree on line endings before applying Prettier fixes.
5. **P3 — Test hygiene.** Add a frontend `test` script that can run `cognitoAuth.test.mjs` on Node 26 (or replace the parameter property in `cognitoAuth.ts`); update or remove the scaffold backend e2e test.
6. **P4 — Polish.** Replace `#todo-about` / `#todo-social` links; add `priority` to the landing LCP image; restrict backend CORS origins before deployment.

---

## Manual tests still required

These require a real user session or credentials and were intentionally not performed:

1. After restarting the backend: sign in with email/password (in-app form and Cognito hosted page) and confirm `/api/auth/me` returns 200 and the navbar switches to the signed-in state.
2. Hosted-UI round trip: callback to `/login`, code exchange at `/oauth2/token`, redirect to `/create`.
3. Logout: confirm Cognito logout returns to the configured local logout URI and local session state is cleared.
4. Social sign-in for each provider once enabled.
5. Authenticated flows (credits balance, card drafts, cart/checkout mock) against the restarted backend.
6. Read-only Cognito console review (app client: identity providers, callback/logout URLs, OAuth flows/scopes), since the local AWS identity cannot read Cognito.

---

## Exact safe next steps

1. **Restart the backend** (in a terminal you control; the current process has no parent and must be stopped by you, PID 38936):
   ```
   cd "C:\Users\wilso\Desktop\Souvenote AWS DESIGN\backend\server"
   npm run start:dev
   ```
   Then confirm: `curl http://localhost:4000/api/health` → `status: ok`, `database: connected`.
2. **Re-verify the key fix** (optional, no credentials): sending a dummy unsigned bearer token to `GET /api/auth/me` should now return *"Cognito signing key was not found."* instead of *"Could not load Cognito signing keys."*
3. **Manually sign in** with email/password at `http://localhost:3000/login` and confirm the signed-in state.
4. If the frontend on :3000 ever stops, restart it with:
   ```
   cd "C:\Users\wilso\Desktop\Souvenote AWS DESIGN\frontend"
   npm run dev
   ```
5. In the Cognito console (read-only first), check which identity providers are enabled on the app client, then decide on P1.
6. Decide whether the `next start -p 3100` process (PID 34208 / 39924) should keep running; only its owner should stop it.

### End-of-test service status

- **Frontend :3000 — running** (HTTP 200, PID 33328).
- **Backend :4000 — running** (`/api/health` 200, database connected, PID 38936) — but stale; restart recommended.
- **:3100 — running**, untouched.
