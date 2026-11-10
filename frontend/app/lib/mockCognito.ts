/**
 * Mock Cognito for mock data mode: accounts live in the mock database, any
 * 6-digit code confirms an email or a password reset, and social sign-in
 * signs straight into a provider test account (no redirect to AWS).
 *
 * Errors carry the same codes Cognito uses, so the auth screens show their
 * normal messages. cognitoAuth.ts turns them into CognitoClientError.
 */
import type { CognitoSession, CognitoSignUpResult, CognitoSocialProvider, LocalUser } from "./cognitoAuth";
import { getStoredCognitoSession } from "./cognitoAuth";
import { findAccountBySub, mockId, nowIso, readMockDb, updateMockDb } from "./mockDb";
import type { MockAccount, MockDb } from "./mockDb";
import { MOCK_TOTP_CODE, MOCK_TOTP_SECRET } from "./mockDemo";
import { mockDelay } from "./mockMode";

const SESSION_LENGTH_MS = 30 * 24 * 60 * 60 * 1000;

export class MockAuthError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "MockAuthError";
    this.code = code;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function checkCode(code: string) {
  if (!/^\d{6}$/.test(code.trim())) {
    throw new MockAuthError("Invalid verification code provided, please try again.", "CodeMismatchException");
  }
}

function checkPassword(password: string) {
  if (password.length < 8) {
    throw new MockAuthError("Password did not conform with policy: Password not long enough", "InvalidPasswordException");
  }
}

function newLocalUser(email: string, sub: string): LocalUser {
  return {
    id: mockId(),
    cognito_user_id: sub,
    email,
    stripe_customer_id: null,
    first_name: null,
    last_name: null,
    phone: null,
    birthday: null,
    country: null,
    currency: null,
    language: null,
    marketing_opt_in: false,
    preferences: {},
    terms_accepted_at: null,
    terms_version: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

function sessionFor(account: MockAccount): CognitoSession {
  const name = [account.user.first_name, account.user.last_name].filter(Boolean).join(" ") || undefined;
  return {
    idToken: `mock-id-token.${account.sub}.${Date.now()}`,
    accessToken: `mock-access-token.${account.sub}.${Date.now()}`,
    refreshToken: `mock-refresh-token.${account.sub}`,
    expiresAt: Date.now() + SESSION_LENGTH_MS,
    email: account.email,
    sub: account.sub,
    name,
    givenName: account.user.first_name || undefined,
    familyName: account.user.last_name || undefined,
    provider: account.provider as CognitoSocialProvider | undefined,
  };
}

function knownAccount(email: string) {
  const account = readMockDb().accounts[normalizeEmail(email)];
  if (!account) throw new MockAuthError("Username/client id combination not found.", "UserNotFoundException");
  return account;
}

export async function mockSignUp(email: string, password: string): Promise<CognitoSignUpResult> {
  await mockDelay(400);
  const username = normalizeEmail(email);
  checkPassword(password);
  return updateMockDb((db) => {
    if (db.accounts[username]) {
      throw new MockAuthError("An account with the given email already exists.", "UsernameExistsException");
    }
    const sub = mockId("mock-sub");
    db.accounts[username] = {
      email: username,
      password,
      confirmed: false,
      sub,
      user: newLocalUser(username, sub),
      starterCreditsGranted: false,
    };
    db.balances[db.accounts[username].user.id] = 0;
    return {
      confirmed: false,
      codeDelivery: { AttributeName: "email", DeliveryMedium: "EMAIL", Destination: username.replace(/^(.).*(@.*)$/, "$1***$2") },
    };
  });
}

export async function mockConfirmSignUp(email: string, confirmationCode: string) {
  await mockDelay(300);
  knownAccount(email);
  checkCode(confirmationCode);
  updateMockDb((db) => {
    db.accounts[normalizeEmail(email)].confirmed = true;
  });
}

export async function mockSignIn(email: string, password: string): Promise<CognitoSession> {
  await mockDelay(400);
  const account = readMockDb().accounts[normalizeEmail(email)];
  if (!account || account.password !== password) {
    throw new MockAuthError("Incorrect username or password.", "NotAuthorizedException");
  }
  if (!account.confirmed) {
    throw new MockAuthError("User is not confirmed.", "UserNotConfirmedException");
  }
  if (account.totpEnabled) {
    pendingTotp = { email: account.email, failures: 0 };
    throw new MockAuthError("Enter the 6-digit code from your authenticator app.", "SOFTWARE_TOKEN_MFA");
  }
  return sessionFor(account);
}

// ---- Two-step sign-in (TOTP) and signed-in account actions --------------------

/** A sign-in waiting for its authenticator code, like Cognito's MFA session. */
let pendingTotp: { email: string; failures: number } | null = null;
const MAX_TOTP_FAILURES = 5;

function checkTotp(code: string) {
  if (code.trim() !== MOCK_TOTP_CODE) {
    throw new MockAuthError("Invalid code received for user", "CodeMismatchException");
  }
}

export async function mockCompleteTotpSignIn(code: string): Promise<CognitoSession> {
  await mockDelay(300);
  if (!pendingTotp) throw new MockAuthError("Invalid session for the user, session is expired.", "NotAuthorizedException");
  try {
    checkTotp(code);
  } catch (error) {
    pendingTotp.failures += 1;
    if (pendingTotp.failures >= MAX_TOTP_FAILURES) {
      pendingTotp = null;
      throw new MockAuthError("Password attempts exceeded", "TooManyFailedAttemptsException");
    }
    throw error;
  }
  const account = knownAccount(pendingTotp.email);
  pendingTotp = null;
  return sessionFor(account);
}

export async function mockCancelTotpSignIn() {
  pendingTotp = null;
}

/** The signed-in mock account, found from the stored session like a real access token. */
function signedInAccount(db: MockDb): MockAccount {
  const session = getStoredCognitoSession({ allowExpired: true });
  const account = session ? findAccountBySub(db, session.sub) : null;
  if (!account) throw new MockAuthError("Access Token has been revoked", "NotAuthorizedException");
  return account;
}

export async function mockChangePassword(currentPassword: string, newPassword: string) {
  await mockDelay(350);
  updateMockDb((db) => {
    const account = signedInAccount(db);
    if (account.password !== currentPassword) throw new MockAuthError("Incorrect username or password.", "NotAuthorizedException");
    checkPassword(newPassword);
    account.password = newPassword;
  });
}

export async function mockGlobalSignOut() {
  await mockDelay(300);
  signedInAccount(readMockDb());
}

export async function mockTotpEnabled(): Promise<boolean> {
  await mockDelay(120);
  return Boolean(signedInAccount(readMockDb()).totpEnabled);
}

export async function mockStartTotpSetup(): Promise<string> {
  await mockDelay(300);
  return updateMockDb((db) => {
    const account = signedInAccount(db);
    account.totpPendingSecret = MOCK_TOTP_SECRET;
    return MOCK_TOTP_SECRET;
  });
}

export async function mockConfirmTotpSetup(code: string) {
  await mockDelay(300);
  updateMockDb((db) => {
    const account = signedInAccount(db);
    if (!account.totpPendingSecret) throw new MockAuthError("Software token has not been associated.", "EnableSoftwareTokenMFAException");
    checkTotp(code);
    account.totpEnabled = true;
    account.totpPendingSecret = null;
  });
}

export async function mockDisableTotp() {
  await mockDelay(300);
  updateMockDb((db) => {
    const account = signedInAccount(db);
    account.totpEnabled = false;
    account.totpPendingSecret = null;
  });
}

export async function mockRequestPasswordReset(email: string) {
  await mockDelay(300);
  knownAccount(email);
}

export async function mockConfirmPasswordReset(email: string, resetCode: string, newPassword: string) {
  await mockDelay(300);
  knownAccount(email);
  checkCode(resetCode);
  checkPassword(newPassword);
  updateMockDb((db) => {
    const account = db.accounts[normalizeEmail(email)];
    account.password = newPassword;
    account.confirmed = true;
  });
}

export async function mockResendSignUpCode(email: string) {
  await mockDelay(300);
  knownAccount(email);
}

export async function mockSignOutEverywhere(email: string, password: string) {
  await mockSignIn(email, password);
}

/** Signs in to (or creates) the test account for a social provider. New ones have no Terms acceptance yet, like a real first social sign-in. */
export function mockSocialSession(provider: CognitoSocialProvider | undefined): CognitoSession {
  const label = (provider || "social").toLowerCase();
  const email = `${label}.tester@souvenote.test`;
  const account = updateMockDb((db) => {
    if (!db.accounts[email]) {
      const sub = mockId(`mock-sub-${label}`);
      const user = newLocalUser(email, sub);
      user.first_name = provider === "SignInWithApple" ? "Apple" : provider || "Social";
      user.last_name = "Tester";
      db.accounts[email] = {
        email,
        password: mockId(),
        confirmed: true,
        sub,
        provider,
        user,
        starterCreditsGranted: false,
      };
      db.balances[user.id] = 0;
    }
    return db.accounts[email];
  });
  return sessionFor(account);
}
