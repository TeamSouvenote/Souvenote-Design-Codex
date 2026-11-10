/**
 * The mock demo login and fixed codes (mock data mode only). Kept out of mockMode.ts so
 * they're imported only by the mock modules and the Mock data panel, which load lazily:
 * with mock mode off they never reach a customer's browser (Prompt 2 flows E-F2,
 * 2026-11-09). Before this move they shipped in the chunk every page loads.
 */

/** Seeded account that is ready to use (credits, saved card, past cards). */
export const MOCK_DEMO_EMAIL = "demo@souvenote.com";
export const MOCK_DEMO_PASSWORD = "Souvenote123!";

/** Any 6-digit code works for email confirmation and password reset. */
export const MOCK_CODE_HINT = "any 6 digits, e.g. 123456";

/**
 * The one code the mock authenticator app accepts (two-step sign-in setup and
 * sign-in). Shown in the Mock data badge; a real app would show a changing code.
 */
export const MOCK_TOTP_CODE = "246810";

/** Mock authenticator secret handed out when two-step sign-in is set up. */
export const MOCK_TOTP_SECRET = "JBSWY3DPEHPK3PXP";
