/**
 * Mock data mode (mock-data-mode branch).
 *
 * When on, every backend call in api.ts and every Cognito call in
 * cognitoAuth.ts is answered in the browser from a localStorage "database"
 * (see mockDb.ts / mockApi.ts). No backend, Postgres or Cognito is needed, so
 * the whole flow (sign up, verify, create, generate, cart, checkout, delivery,
 * account) can be walked end to end.
 *
 * On by default on this branch. Set NEXT_PUBLIC_MOCK_MODE=0 in .env.local to
 * talk to the real backend again.
 */
export const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE !== "0" && process.env.NEXT_PUBLIC_MOCK_MODE !== "false";

// The demo login and fixed codes live in mockDemo.ts (imported only by the lazy mock modules).

/** Small pause so loading states are visible, like a real network call. */
export function mockDelay(ms = 250) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
