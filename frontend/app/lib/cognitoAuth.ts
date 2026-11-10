import {
  AuthenticationDetails,
  CognitoAccessToken,
  CognitoIdToken,
  CognitoRefreshToken,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

// Mock data mode (see mockMode.ts for the switch). Inlined rather than
// imported so Node's unit test can still load this file directly; the mock
// Cognito module is only loaded when a mock branch actually runs.
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE !== "0" && process.env.NEXT_PUBLIC_MOCK_MODE !== "false";
const MOCK_SOCIAL_PENDING_KEY = "souv_mock_social_pending";

type MockCognitoModule = typeof import("./mockCognito");

async function runMockCognito<T>(call: (mock: MockCognitoModule) => Promise<T>): Promise<T> {
  const mock = await import("./mockCognito");
  try {
    return await call(mock);
  } catch (error) {
    if (error instanceof mock.MockAuthError) throw new CognitoClientError(error.message, error.code);
    throw error;
  }
}

export type CognitoCodeDelivery = {
  AttributeName?: string;
  DeliveryMedium?: string;
  Destination?: string;
};

export type CognitoSignUpResult = {
  confirmed: boolean;
  codeDelivery?: CognitoCodeDelivery;
};

export type CognitoSession = {
  idToken: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  email: string;
  sub: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  /** Set when the account signs in through Google, Facebook or Apple (from the id token's `identities` claim). */
  provider?: CognitoSocialProvider;
};

export type LocalUser = {
  id: string;
  cognito_user_id?: string | null;
  email: string;
  stripe_customer_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  birthday?: string | null;
  country?: string | null;
  currency?: string | null;
  language?: string | null;
  marketing_opt_in?: boolean | null;
  preferences?: Record<string, unknown> | null;
  /** When the Terms and Privacy Policy were accepted; null if never recorded (e.g. a new social sign-up). */
  terms_accepted_at?: string | null;
  terms_version?: string | null;
  created_at?: string;
  updated_at?: string;
};

type CognitoConfig = {
  region: string;
  userPoolId: string;
  clientId: string;
};

type CognitoAuthResult = {
  IdToken?: string;
  AccessToken?: string;
  RefreshToken?: string;
  ExpiresIn?: number;
};

type HostedUiTokenResponse = {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type HostedUiState = {
  state: string;
  verifier: string;
  redirectUri: string;
};

type HostedUiContext = {
  nonce: string;
  returnTo?: string;
  authPath?: string;
  provider?: CognitoSocialProvider;
};

export type HostedUiError = {
  code: string;
  message: string;
  provider?: CognitoSocialProvider;
};

export type HostedUiAttempt = {
  authPath: string;
  provider?: CognitoSocialProvider;
};

type JwtClaims = {
  sub?: string;
  email?: string;
  exp?: number;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  /** Federated sign-ins only: the identity provider(s) behind this Cognito user. */
  identities?: { providerName?: string }[];
};

export const AUTH_SESSION_STORAGE_KEY = "souv_cognito_session";
export const AUTH_LOCAL_USER_STORAGE_KEY = "souv_local_user";
export const AUTH_SESSION_UPDATED_EVENT = "souv-auth-session-updated";
const HOSTED_UI_STATE_STORAGE_KEY = "souv_cognito_oauth_state";
const HOSTED_UI_ERROR_PARAM = "souvOauthError";
const HOSTED_UI_PROVIDER_PARAM = "souvOauthProvider";
const LEGACY_HOSTED_UI_RETURN_STORAGE_KEY = "souv_cognito_oauth_return_to";
const LEGACY_HOSTED_UI_ERROR_STORAGE_KEY = "souv_cognito_oauth_error";
const LEGACY_HOSTED_UI_ATTEMPT_STORAGE_KEY = "souv_cognito_oauth_attempt";

const EXPIRY_SKEW_MS = 60_000;
let pendingHostedUiError: HostedUiError | null = null;
let pendingHostedUiAttempt: HostedUiAttempt | null = null;
let pendingHostedUiReturnTo: string | null = null;

export type CognitoSocialProvider = "Google" | "Facebook" | "SignInWithApple";

export class CognitoClientError extends Error {
  // Declared as a plain field (not a constructor parameter property) so Node's
  // built-in TypeScript type stripping can load this module in unit tests.
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "CognitoClientError";
    this.code = code;
  }
}

function toCognitoClientError(error: unknown) {
  if (error instanceof CognitoClientError) return error;

  if (error && typeof error === "object") {
    const record = error as { code?: unknown; name?: unknown; message?: unknown };
    const code = typeof record.code === "string"
      ? record.code
      : typeof record.name === "string"
        ? record.name
        : "CognitoError";
    const message = typeof record.message === "string" ? record.message : "Cognito request failed.";

    return new CognitoClientError(message, code);
  }

  return new CognitoClientError("Cognito request failed.", "CognitoError");
}

function getCognitoConfig(): CognitoConfig {
  const region = process.env.NEXT_PUBLIC_COGNITO_REGION?.trim();
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID?.trim();
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID?.trim();

  if (!region || !userPoolId || !clientId) {
    throw new CognitoClientError(
      "Cognito is not configured. Add NEXT_PUBLIC_COGNITO_REGION, NEXT_PUBLIC_COGNITO_USER_POOL_ID, and NEXT_PUBLIC_COGNITO_CLIENT_ID to frontend/.env.local.",
      "MissingCognitoConfig",
    );
  }

  return { region, userPoolId, clientId };
}

function getHostedUiConfig() {
  const { clientId } = getCognitoConfig();
  const rawDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.trim();
  const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI?.trim()
    || (typeof window !== "undefined" ? `${window.location.origin}/login` : "");
  const logoutUri = process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI?.trim()
    || (typeof window !== "undefined" ? window.location.origin : "");
  const scopes = (process.env.NEXT_PUBLIC_COGNITO_OAUTH_SCOPES || "openid email profile")
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean);

  if (!rawDomain || !redirectUri) {
    throw new CognitoClientError(
      "Cognito social sign-in is not configured. Add NEXT_PUBLIC_COGNITO_DOMAIN and NEXT_PUBLIC_COGNITO_REDIRECT_URI to frontend/.env.local, then add the same callback URL in Cognito.",
      "MissingHostedUiConfig",
    );
  }

  const domain = /^https?:\/\//i.test(rawDomain)
    ? rawDomain.replace(/\/+$/, "")
    : `https://${rawDomain.replace(/\/+$/, "")}`;

  return {
    clientId,
    domain,
    logoutUri,
    redirectUri,
    scopes: scopes.length ? scopes : ["openid", "email", "profile"],
  };
}

function getCognitoUserPool() {
  const { userPoolId, clientId } = getCognitoConfig();
  return new CognitoUserPool({
    UserPoolId: userPoolId,
    ClientId: clientId,
    // The SDK's own token cache follows the same "Remember me" choice.
    Storage: typeof window === "undefined" ? undefined : authStorage(),
  });
}

function getCognitoUser(email: string) {
  return new CognitoUser({
    Username: email.trim().toLowerCase(),
    Pool: getCognitoUserPool(),
  });
}

function dispatchAuthUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_SESSION_UPDATED_EVENT));
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomBase64Url(byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  window.crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function pkceChallenge(verifier: string) {
  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = window.atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new TextDecoder().decode(bytes);
}

function encodeHostedUiContext(context: HostedUiContext) {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(context)));
}

function decodeHostedUiContext(value: string | null): HostedUiContext | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeBase64Url(value)) as Partial<HostedUiContext>;
    if (typeof parsed.nonce !== "string") return null;
    return {
      nonce: parsed.nonce,
      returnTo: typeof parsed.returnTo === "string"
        ? cleanHostedUiReturnPath(parsed.returnTo, "/create")
        : undefined,
      authPath: typeof parsed.authPath === "string" ? cleanAuthPath(parsed.authPath) : undefined,
      provider: cleanProvider(parsed.provider),
    };
  } catch {
    return null;
  }
}

function decodeJwtClaims(token: string): JwtClaims {
  const [, payload] = token.split(".");
  if (!payload || typeof window === "undefined") return {};

  try {
    return JSON.parse(decodeBase64Url(payload)) as JwtClaims;
  } catch {
    return {};
  }
}

function buildSession(authResult: CognitoAuthResult, previousRefreshToken?: string): CognitoSession {
  if (!authResult.IdToken || !authResult.AccessToken) {
    throw new CognitoClientError("Cognito did not return a complete session.", "MissingAuthenticationResult");
  }

  const claims = decodeJwtClaims(authResult.IdToken);
  const email = claims.email?.trim();
  const sub = claims.sub?.trim();

  if (!email || !sub) {
    throw new CognitoClientError("Cognito session did not include the expected email and sub claims.", "MissingClaims");
  }

  const expiresAt = claims.exp
    ? claims.exp * 1000
    : Date.now() + ((authResult.ExpiresIn ?? 3600) * 1000);

  return {
    idToken: authResult.IdToken,
    accessToken: authResult.AccessToken,
    refreshToken: authResult.RefreshToken || previousRefreshToken,
    expiresAt,
    email,
    sub,
    name: claims.name?.trim() || undefined,
    givenName: claims.given_name?.trim() || undefined,
    familyName: claims.family_name?.trim() || undefined,
    picture: claims.picture?.trim() || undefined,
    provider: cleanProvider(claims.identities?.[0]?.providerName),
  };
}

function buildSessionFromCognitoUserSession(session: CognitoUserSession): CognitoSession {
  const idToken = session.getIdToken();
  const accessToken = session.getAccessToken();
  const refreshToken = session.getRefreshToken();
  const claims = idToken.decodePayload() as JwtClaims;
  const email = claims.email?.trim();
  const sub = claims.sub?.trim();

  if (!email || !sub) {
    throw new CognitoClientError("Cognito session did not include the expected email and sub claims.", "MissingClaims");
  }

  return {
    idToken: idToken.getJwtToken(),
    accessToken: accessToken.getJwtToken(),
    refreshToken: refreshToken.getToken(),
    expiresAt: idToken.getExpiration() * 1000,
    email,
    sub,
    name: claims.name?.trim() || undefined,
    givenName: claims.given_name?.trim() || undefined,
    familyName: claims.family_name?.trim() || undefined,
    picture: claims.picture?.trim() || undefined,
    provider: cleanProvider(claims.identities?.[0]?.providerName),
  };
}

function isExpired(session: CognitoSession) {
  return session.expiresAt <= Date.now() + EXPIRY_SKEW_MS;
}

export function getStoredCognitoSession(options: { allowExpired?: boolean } = {}): CognitoSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = readAuthItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CognitoSession>;
    if (
      typeof parsed.idToken !== "string"
      || typeof parsed.accessToken !== "string"
      || typeof parsed.expiresAt !== "number"
      || typeof parsed.email !== "string"
      || typeof parsed.sub !== "string"
    ) {
      return null;
    }

    const session = parsed as CognitoSession;
    if (!options.allowExpired && isExpired(session)) return null;
    return session;
  } catch {
    return null;
  }
}

function getStoredHostedUiState(): HostedUiState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(HOSTED_UI_STATE_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<HostedUiState>;
    if (
      typeof parsed.state !== "string"
      || typeof parsed.verifier !== "string"
      || typeof parsed.redirectUri !== "string"
    ) {
      return null;
    }

    return parsed as HostedUiState;
  } catch {
    return null;
  }
}

export function cleanHostedUiReturnPath(value: string | undefined, fallback: string) {
  if (
    !value
    || !value.startsWith("/")
    || value.startsWith("//")
    || value.includes("\\")
    || /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return fallback;
  }

  try {
    const baseUrl = "https://souvenote.invalid";
    const parsed = new URL(value, baseUrl);
    if (parsed.origin !== baseUrl) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

function cleanAuthPath(value: string | undefined) {
  const path = cleanHostedUiReturnPath(value, "/login");
  const pathname = new URL(path, "https://souvenote.invalid").pathname;
  return pathname === "/login" || pathname === "/signup" ? path : "/login";
}

function hostedUiErrorMessage(errorCode: string | undefined) {
  return errorCode === "access_denied"
    ? "Social sign-in was cancelled or denied. Please try again."
    : "Could not finish social sign-in. Please try again.";
}

function cleanProvider(value: string | undefined): CognitoSocialProvider | undefined {
  return value === "Google" || value === "Facebook" || value === "SignInWithApple" ? value : undefined;
}

function hostedUiErrorPath(authPath: string, error: HostedUiError) {
  const url = new URL(cleanAuthPath(authPath), "https://souvenote.invalid");
  url.searchParams.set(HOSTED_UI_ERROR_PARAM, error.code === "access_denied" ? "access_denied" : "failed");
  if (error.provider) url.searchParams.set(HOSTED_UI_PROVIDER_PARAM, error.provider);
  return `${url.pathname}${url.search}${url.hash}`;
}

function clearHostedUiState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(HOSTED_UI_STATE_STORAGE_KEY);
}

function clearLegacyHostedUiStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEGACY_HOSTED_UI_RETURN_STORAGE_KEY);
  window.sessionStorage.removeItem(LEGACY_HOSTED_UI_ERROR_STORAGE_KEY);
  window.sessionStorage.removeItem(LEGACY_HOSTED_UI_ATTEMPT_STORAGE_KEY);
}

function storeHostedUiError(error: HostedUiError) {
  pendingHostedUiError = error;
}

function storeHostedUiAttempt(attempt: HostedUiAttempt) {
  pendingHostedUiAttempt = {
    ...attempt,
    authPath: cleanAuthPath(attempt.authPath),
  };
}

function cleanHostedUiCallbackUrl(url: URL) {
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  const nextSearch = url.searchParams.toString();
  window.history.replaceState(null, "", `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${url.hash}`);
}

// "Remember me": a remembered session is kept in localStorage and survives a
// browser restart; an unremembered one is kept in sessionStorage and ends when
// the browser closes. The choice itself lives in sessionStorage, so a fresh
// browser session falls back to remembered (the default).
const SESSION_PERSISTENCE_KEY = "souv_session_persistence";

function authStorage(): Storage {
  try {
    if (window.sessionStorage.getItem(SESSION_PERSISTENCE_KEY) === "session") return window.sessionStorage;
  } catch {
    // sessionStorage unavailable: fall back to localStorage.
  }
  return window.localStorage;
}

function otherAuthStorage(): Storage {
  return authStorage() === window.localStorage ? window.sessionStorage : window.localStorage;
}

function readAuthItem(key: string) {
  return authStorage().getItem(key) ?? otherAuthStorage().getItem(key);
}

function writeAuthItem(key: string, value: string) {
  authStorage().setItem(key, value);
  otherAuthStorage().removeItem(key);
}

function removeAuthItems() {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    storage.removeItem(AUTH_SESSION_STORAGE_KEY);
    storage.removeItem(AUTH_LOCAL_USER_STORAGE_KEY);
  }
}

// The Cognito SDK caches its own copy of the tokens under these keys.
function removeCognitoSdkCache() {
  const prefix = "CognitoIdentityServiceProvider.";
  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (const key of Object.keys(storage)) {
      if (key.startsWith(prefix)) storage.removeItem(key);
    }
  }
}

/** Call before an email/password sign-in. `false` ends the session when the browser closes. */
export function setSessionPersistence(remember: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (remember) window.sessionStorage.removeItem(SESSION_PERSISTENCE_KEY);
    else window.sessionStorage.setItem(SESSION_PERSISTENCE_KEY, "session");
  } catch {
    // Without sessionStorage the session is always remembered.
  }
}

export function storeCognitoSession(session: CognitoSession) {
  if (typeof window === "undefined") return;
  writeAuthItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  dispatchAuthUpdate();
}

export function getStoredLocalUser(): LocalUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = readAuthItem(AUTH_LOCAL_USER_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<LocalUser>;
    if (typeof parsed.id !== "string" || typeof parsed.email !== "string") return null;
    return parsed as LocalUser;
  } catch {
    return null;
  }
}

export function storeLocalUser(user: LocalUser) {
  if (typeof window === "undefined") return;
  writeAuthItem(AUTH_LOCAL_USER_STORAGE_KEY, JSON.stringify(user));
  dispatchAuthUpdate();
}

export function clearCognitoAuthState() {
  if (typeof window === "undefined") return;
  removeAuthItems();
  removeCognitoSdkCache();
  pendingHostedUiError = null;
  pendingHostedUiAttempt = null;
  pendingHostedUiReturnTo = null;
  clearLegacyHostedUiStorage();
  clearHostedUiState();
  dispatchAuthUpdate();
}

export function rememberHostedUiError(error: HostedUiError, authPath?: string) {
  storeHostedUiError(error);
  return authPath ? hostedUiErrorPath(authPath, error) : undefined;
}

export async function startHostedUiSignIn(provider?: CognitoSocialProvider, returnTo = "/create") {
  if (typeof window === "undefined") return;

  if (MOCK_MODE) {
    // No AWS redirect: remember the attempt, reload, and let
    // completeHostedUiSignIn finish it like a returning OAuth callback.
    const currentPath = `${window.location.pathname}${window.location.search}`;
    setSessionPersistence(true);
    removeAuthItems();
    pendingHostedUiError = null;
    pendingHostedUiAttempt = null;
    pendingHostedUiReturnTo = null;
    dispatchAuthUpdate();
    window.localStorage.setItem(MOCK_SOCIAL_PENDING_KEY, JSON.stringify({
      provider,
      returnTo: cleanHostedUiReturnPath(returnTo, "/create"),
      authPath: cleanAuthPath(currentPath.startsWith("/login") || currentPath.startsWith("/signup") ? currentPath : "/login"),
    }));
    window.location.reload();
    return;
  }

  const config = getHostedUiConfig();
  const verifier = randomBase64Url(64);
  const nonce = randomBase64Url(32);
  const challenge = await pkceChallenge(verifier);
  const currentAuthPath = `${window.location.pathname}${window.location.search}`;
  const authPath = cleanAuthPath(currentAuthPath.startsWith("/login") || currentAuthPath.startsWith("/signup")
    ? currentAuthPath
    : "/login");

  // Social sign-ins are always remembered.
  setSessionPersistence(true);
  removeAuthItems();
  pendingHostedUiError = null;
  pendingHostedUiAttempt = null;
  pendingHostedUiReturnTo = null;
  clearLegacyHostedUiStorage();
  clearHostedUiState();
  dispatchAuthUpdate();

  const state = encodeHostedUiContext({
    nonce,
    returnTo: cleanHostedUiReturnPath(returnTo, "/create"),
    authPath,
    provider,
  });
  window.localStorage.setItem(HOSTED_UI_STATE_STORAGE_KEY, JSON.stringify({
    state: nonce,
    verifier,
    redirectUri: config.redirectUri,
  } satisfies HostedUiState));

  const params = new URLSearchParams({
    client_id: config.clientId,
    code_challenge: challenge,
    code_challenge_method: "S256",
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state,
  });

  if (provider) params.set("identity_provider", provider);
  if (provider === "Google") params.set("prompt", "select_account");

  window.location.assign(`${config.domain}/oauth2/authorize?${params.toString()}`);
}


// Share the OAuth token exchange across concurrent auth-restoration calls.
// In React development Strict Mode, effects can run twice on mount.
let hostedUiSignInInFlight: Promise<CognitoSession | null> | null = null;

export function completeHostedUiSignIn(
  currentUrl?: string
): Promise<CognitoSession | null> {
  if (hostedUiSignInInFlight) return hostedUiSignInInFlight;

  hostedUiSignInInFlight = completeHostedUiSignInOnce(currentUrl).finally(() => {
    hostedUiSignInInFlight = null;
  });

  return hostedUiSignInInFlight;
}

async function completeHostedUiSignInOnce(
  currentUrl?: string
): Promise<CognitoSession | null> {

  if (typeof window === "undefined") return null;

  if (MOCK_MODE) {
    const raw = window.localStorage.getItem(MOCK_SOCIAL_PENDING_KEY);
    if (!raw) return null;
    window.localStorage.removeItem(MOCK_SOCIAL_PENDING_KEY);
    const pending = JSON.parse(raw) as { provider?: CognitoSocialProvider; returnTo?: string; authPath?: string };
    const session = await runMockCognito(async (mock) => mock.mockSocialSession(cleanProvider(pending.provider)));
    storeHostedUiAttempt({ authPath: cleanAuthPath(pending.authPath), provider: cleanProvider(pending.provider) });
    storeCognitoSession(session);
    pendingHostedUiReturnTo = pending.returnTo ? cleanHostedUiReturnPath(pending.returnTo, "/create") : null;
    return session;
  }

  const url = new URL(currentUrl || window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const storedState = getStoredHostedUiState();
  const decodedContext = decodeHostedUiContext(state);
  const hostedUiContext = storedState && decodedContext?.nonce === storedState.state ? decodedContext : null;

  if (oauthError) {
    const error = {
      code: oauthError === "access_denied" ? "access_denied" : "HostedUiError",
      message: hostedUiErrorMessage(oauthError),
      provider: hostedUiContext?.provider,
    } satisfies HostedUiError;
    storeHostedUiError(error);
    clearHostedUiState();
    cleanHostedUiCallbackUrl(url);
    const authPath = hostedUiErrorPath(cleanAuthPath(hostedUiContext?.authPath), error);
    if (`${window.location.pathname}${window.location.search}` !== authPath) {
      window.location.replace(authPath);
    }
    throw new CognitoClientError(hostedUiErrorMessage(oauthError), "HostedUiError");
  }

  if (!code || !state) return null;

  if (!storedState || !hostedUiContext) {
    const error = {
      code: "InvalidHostedUiState",
      message: "The social sign-in response could not be verified. Please try again.",
      provider: undefined,
    } satisfies HostedUiError;
    storeHostedUiError(error);
    clearHostedUiState();
    cleanHostedUiCallbackUrl(url);
    const authPath = hostedUiErrorPath("/login", error);
    if (`${window.location.pathname}${window.location.search}` !== authPath) {
      window.location.replace(authPath);
    }
    throw new CognitoClientError("The social sign-in response could not be verified. Please try again.", "InvalidHostedUiState");
  }

  const config = getHostedUiConfig();
  const response = await fetch(`${config.domain}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      code,
      code_verifier: storedState.verifier,
      grant_type: "authorization_code",
      redirect_uri: storedState.redirectUri,
    }),
  });

  const payload = await response.json().catch(() => ({})) as HostedUiTokenResponse;
  if (!response.ok) {
    const error = {
      code: payload.error === "access_denied" ? "access_denied" : "HostedUiTokenError",
      message: hostedUiErrorMessage(payload.error),
      provider: hostedUiContext.provider,
    } satisfies HostedUiError;
    storeHostedUiError(error);
    clearHostedUiState();
    cleanHostedUiCallbackUrl(url);
    const authPath = hostedUiErrorPath(cleanAuthPath(hostedUiContext.authPath), error);
    if (`${window.location.pathname}${window.location.search}` !== authPath) {
      window.location.replace(authPath);
    }
    throw new CognitoClientError(
      "Could not finish social sign-in. Please try again.",
      "HostedUiTokenError",
    );
  }

  const session = buildSession({
    IdToken: payload.id_token,
    AccessToken: payload.access_token,
    RefreshToken: payload.refresh_token,
    ExpiresIn: payload.expires_in,
  });

  clearHostedUiState();
  cleanHostedUiCallbackUrl(url);
  storeHostedUiAttempt({
    authPath: cleanAuthPath(hostedUiContext.authPath),
    provider: hostedUiContext.provider,
  });
  storeCognitoSession(session);
  pendingHostedUiReturnTo = hostedUiContext.returnTo
    ? cleanHostedUiReturnPath(hostedUiContext.returnTo, "/create")
    : null;
  return session;
}

export function consumeHostedUiError(): HostedUiError | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const errorCode = url.searchParams.get(HOSTED_UI_ERROR_PARAM) || undefined;
  const provider = cleanProvider(url.searchParams.get(HOSTED_UI_PROVIDER_PARAM) || undefined);
  const error = pendingHostedUiError || (errorCode ? {
    code: errorCode === "access_denied" ? "access_denied" : "HostedUiError",
    message: hostedUiErrorMessage(errorCode),
    provider,
  } : null);
  pendingHostedUiError = null;
  if (errorCode) {
    url.searchParams.delete(HOSTED_UI_ERROR_PARAM);
    url.searchParams.delete(HOSTED_UI_PROVIDER_PARAM);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }
  return error;
}

export function consumeHostedUiAttempt(): HostedUiAttempt | null {
  const attempt = pendingHostedUiAttempt;
  pendingHostedUiAttempt = null;
  return attempt;
}

export function consumeHostedUiReturnTo() {
  const returnTo = pendingHostedUiReturnTo;
  pendingHostedUiReturnTo = null;
  return returnTo;
}

export function getHostedUiLogoutUrl() {
  // Mock mode has no hosted UI to sign out of; logout() then just clears local state.
  if (MOCK_MODE) throw new CognitoClientError("No hosted UI in mock data mode.", "MockMode");
  const config = getHostedUiConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    logout_uri: config.logoutUri,
  });

  return `${config.domain}/logout?${params.toString()}`;
}

export async function signUpWithCognito(email: string, password: string): Promise<CognitoSignUpResult> {
  if (MOCK_MODE) return runMockCognito((mock) => mock.mockSignUp(email, password));
  const username = email.trim().toLowerCase();
  const userPool = getCognitoUserPool();

  return new Promise((resolve, reject) => {
    userPool.signUp(
      username,
      password,
      [new CognitoUserAttribute({ Name: "email", Value: username })],
      [],
      (error, result) => {
        if (error || !result) {
          reject(toCognitoClientError(error));
          return;
        }

        resolve({
          confirmed: Boolean(result.userConfirmed),
          codeDelivery: result.codeDeliveryDetails,
        });
      },
    );
  });
}

export async function confirmCognitoSignUp(email: string, confirmationCode: string) {
  if (MOCK_MODE) return runMockCognito((mock) => mock.mockConfirmSignUp(email, confirmationCode));
  const user = getCognitoUser(email);

  await new Promise<void>((resolve, reject) => {
    user.confirmRegistration(confirmationCode.trim(), true, (error) => {
      if (error) {
        reject(toCognitoClientError(error));
        return;
      }

      resolve();
    });
  });
}

/** Error code when the password was right and an authenticator-app code is needed next. */
export const TOTP_REQUIRED_CODE = "SOFTWARE_TOKEN_MFA";

let pendingTotpSignIn: { user: CognitoUser; email: string } | null = null;

function authenticateCognitoUser(user: CognitoUser, email: string, password: string) {
  const authenticationDetails = new AuthenticationDetails({
    Username: email.trim().toLowerCase(),
    Password: password,
  });

  return new Promise<CognitoUserSession>((resolve, reject) => {
    user.authenticateUser(authenticationDetails, {
      onSuccess: (cognitoSession) => {
        resolve(cognitoSession);
      },
      onFailure: (error) => {
        reject(toCognitoClientError(error));
      },
      newPasswordRequired: () => {
        reject(new CognitoClientError("A new password is required for this Cognito user.", "NEW_PASSWORD_REQUIRED"));
      },
      mfaRequired: () => {
        reject(new CognitoClientError("MFA is required for this Cognito user, but this local UI does not support MFA yet.", "SMS_MFA"));
      },
      totpRequired: () => {
        // Two-step sign-in is on: keep this half-signed-in user so the Log In
        // page can send the 6-digit code (completeCognitoTotpSignIn).
        pendingTotpSignIn = { user, email: email.trim().toLowerCase() };
        reject(new CognitoClientError("Enter the 6-digit code from your authenticator app.", TOTP_REQUIRED_CODE));
      },
      selectMFAType: () => {
        reject(new CognitoClientError("MFA selection is required for this Cognito user, but this local UI does not support MFA yet.", "SELECT_MFA_TYPE"));
      },
    });
  });
}

export async function signInWithCognito(email: string, password: string): Promise<CognitoSession> {
  if (MOCK_MODE) {
    const mockSession = await runMockCognito((mock) => mock.mockSignIn(email, password));
    storeCognitoSession(mockSession);
    return mockSession;
  }
  pendingTotpSignIn = null;
  const cognitoSession = await authenticateCognitoUser(getCognitoUser(email), email, password);
  const session = buildSessionFromCognitoUserSession(cognitoSession);
  storeCognitoSession(session);
  return session;
}

/**
 * Finishes a sign-in that stopped at TOTP_REQUIRED_CODE: sends the 6-digit
 * authenticator code for the same attempt. A wrong code can be retried; after
 * five wrong codes Cognito locks sign-in for a while.
 */
export async function completeCognitoTotpSignIn(code: string): Promise<CognitoSession> {
  const clean = code.replace(/\s+/g, "");
  if (MOCK_MODE) {
    const mockSession = await runMockCognito((mock) => mock.mockCompleteTotpSignIn(clean));
    storeCognitoSession(mockSession);
    return mockSession;
  }
  const pending = pendingTotpSignIn;
  if (!pending) throw new CognitoClientError("Your sign-in timed out. Enter your email and password again.", "NotAuthorizedException");

  const cognitoSession = await new Promise<CognitoUserSession>((resolve, reject) => {
    pending.user.sendMFACode(clean, {
      onSuccess: (result) => resolve(result),
      onFailure: (error) => reject(toCognitoClientError(error)),
    }, "SOFTWARE_TOKEN_MFA");
  });
  pendingTotpSignIn = null;
  const session = buildSessionFromCognitoUserSession(cognitoSession);
  storeCognitoSession(session);
  return session;
}

/** Drops a sign-in that is waiting for its authenticator code (Back on the code step). */
export function cancelCognitoTotpSignIn() {
  pendingTotpSignIn = null;
  if (MOCK_MODE) void runMockCognito(async (mock) => mock.mockCancelTotpSignIn());
}

/** Sends a password-reset code to the account's verified email. */
export async function requestCognitoPasswordReset(email: string) {
  if (MOCK_MODE) return runMockCognito((mock) => mock.mockRequestPasswordReset(email));
  const user = getCognitoUser(email);

  await new Promise<void>((resolve, reject) => {
    user.forgotPassword({
      onSuccess: () => resolve(),
      inputVerificationCode: () => resolve(),
      onFailure: (error) => reject(toCognitoClientError(error)),
    });
  });
}

/** Sets a new password using the code from the reset email. */
export async function confirmCognitoPasswordReset(email: string, resetCode: string, newPassword: string) {
  if (MOCK_MODE) return runMockCognito((mock) => mock.mockConfirmPasswordReset(email, resetCode, newPassword));
  const user = getCognitoUser(email);

  await new Promise<void>((resolve, reject) => {
    user.confirmPassword(resetCode.trim(), newPassword, {
      onSuccess: () => resolve(),
      onFailure: (error) => reject(toCognitoClientError(error)),
    });
  });
}

/** Sends a fresh sign-up confirmation code. */
export async function resendCognitoSignUpCode(email: string) {
  if (MOCK_MODE) return runMockCognito((mock) => mock.mockResendSignUpCode(email));
  const user = getCognitoUser(email);

  await new Promise<void>((resolve, reject) => {
    user.resendConfirmationCode((error) => {
      if (error) {
        reject(toCognitoClientError(error));
        return;
      }

      resolve();
    });
  });
}

/** Revokes every refresh token for the account, signing it out on all devices. */
export async function signOutCognitoEverywhere(email: string, password: string) {
  if (MOCK_MODE) return runMockCognito((mock) => mock.mockSignOutEverywhere(email, password));
  const user = getCognitoUser(email);
  await authenticateCognitoUser(user, email, password);

  await new Promise<void>((resolve, reject) => {
    user.globalSignOut({
      onSuccess: () => resolve(),
      onFailure: (error) => reject(toCognitoClientError(error)),
    });
  });
}

// ---- Signed-in account actions (Account Settings) --------------------------------
// These run on the current session's tokens (the SDK needs a signed-in
// CognitoUser). Google, Facebook and Apple accounts have no Cognito password and
// no Cognito two-step sign-in: their provider manages both, so Settings hides
// those controls (session.provider).

async function signedInCognitoUser(): Promise<CognitoUser> {
  const session = await getActiveCognitoSession();
  if (!session) throw new CognitoClientError("Your session has ended. Log in again.", "NotAuthorizedException");
  const user = getCognitoUser(session.email);
  user.setSignInUserSession(new CognitoUserSession({
    IdToken: new CognitoIdToken({ IdToken: session.idToken }),
    AccessToken: new CognitoAccessToken({ AccessToken: session.accessToken }),
    RefreshToken: new CognitoRefreshToken({ RefreshToken: session.refreshToken || "" }),
  }));
  return user;
}

function cognitoCallback(resolve: () => void, reject: (error: unknown) => void) {
  return (error?: Error | null) => {
    if (error) reject(toCognitoClientError(error));
    else resolve();
  };
}

/** Changes the password for an email-and-password account (ChangePassword). */
export async function changeCognitoPassword(currentPassword: string, newPassword: string) {
  if (MOCK_MODE) return runMockCognito((mock) => mock.mockChangePassword(currentPassword, newPassword));
  const user = await signedInCognitoUser();
  await new Promise<void>((resolve, reject) => {
    user.changePassword(currentPassword, newPassword, cognitoCallback(resolve, reject));
  });
}

/** Revokes every refresh token for the signed-in account (GlobalSignOut), this device included. */
export async function signOutCognitoAllDevices() {
  if (MOCK_MODE) {
    await runMockCognito((mock) => mock.mockGlobalSignOut());
  } else {
    const user = await signedInCognitoUser();
    await new Promise<void>((resolve, reject) => {
      user.globalSignOut({ onSuccess: () => resolve(), onFailure: (error) => reject(toCognitoClientError(error)) });
    });
  }
  clearCognitoAuthState();
}

/** Whether authenticator-app two-step sign-in is on for the signed-in account. */
export async function fetchCognitoTotpEnabled(): Promise<boolean> {
  if (MOCK_MODE) return runMockCognito((mock) => mock.mockTotpEnabled());
  const user = await signedInCognitoUser();
  return new Promise<boolean>((resolve, reject) => {
    user.getUserData((error, data) => {
      if (error || !data) {
        reject(toCognitoClientError(error));
        return;
      }
      resolve(data.PreferredMfaSetting === "SOFTWARE_TOKEN_MFA" || Boolean(data.UserMFASettingList?.includes("SOFTWARE_TOKEN_MFA")));
    }, { bypassCache: true });
  });
}

/** Step 1 of turning two-step sign-in on: a new secret for the authenticator app (AssociateSoftwareToken). */
export async function startCognitoTotpSetup(): Promise<string> {
  if (MOCK_MODE) return runMockCognito((mock) => mock.mockStartTotpSetup());
  const user = await signedInCognitoUser();
  return new Promise<string>((resolve, reject) => {
    user.associateSoftwareToken({
      associateSecretCode: (secret) => resolve(secret),
      onFailure: (error) => reject(toCognitoClientError(error)),
    });
  });
}

/** Step 2: checks the app's first code (VerifySoftwareToken), then makes it the sign-in step (SetUserMFAPreference). */
export async function confirmCognitoTotpSetup(code: string) {
  const clean = code.replace(/\s+/g, "");
  if (MOCK_MODE) return runMockCognito((mock) => mock.mockConfirmTotpSetup(clean));
  const user = await signedInCognitoUser();
  await new Promise<void>((resolve, reject) => {
    user.verifySoftwareToken(clean, "Souvenote", {
      onSuccess: () => resolve(),
      onFailure: (error) => reject(toCognitoClientError(error)),
    });
  });
  await new Promise<void>((resolve, reject) => {
    user.setUserMfaPreference(null, { Enabled: true, PreferredMfa: true }, cognitoCallback(resolve, reject));
  });
}

/** Turns authenticator-app two-step sign-in off. */
export async function disableCognitoTotp() {
  if (MOCK_MODE) return runMockCognito((mock) => mock.mockDisableTotp());
  const user = await signedInCognitoUser();
  await new Promise<void>((resolve, reject) => {
    user.setUserMfaPreference(null, { Enabled: false, PreferredMfa: false }, cognitoCallback(resolve, reject));
  });
}

/** The otpauth:// address an authenticator app scans to add the account. */
export function totpSetupUri(email: string, secret: string) {
  const label = encodeURIComponent(`Souvenote:${email}`);
  return `otpauth://totp/${label}?secret=${encodeURIComponent(secret)}&issuer=Souvenote`;
}

/** Deletes the signed-in Cognito user (DeleteUser). Run after the backend has removed the account's data. */
export async function deleteCognitoUser() {
  if (MOCK_MODE) {
    clearCognitoAuthState();
    return;
  }
  const user = await signedInCognitoUser();
  await new Promise<void>((resolve, reject) => {
    user.deleteUser((error) => (error ? reject(toCognitoClientError(error)) : resolve()));
  });
  clearCognitoAuthState();
}

async function refreshCognitoSession(session: CognitoSession): Promise<CognitoSession | null> {
  if (!session.refreshToken) return null;

  const user = getCognitoUser(session.email);
  const refreshToken = new CognitoRefreshToken({ RefreshToken: session.refreshToken });

  const nextSession = await new Promise<CognitoSession>((resolve, reject) => {
    user.refreshSession(refreshToken, (error, cognitoSession) => {
      if (error) {
        reject(toCognitoClientError(error));
        return;
      }

      resolve(buildSessionFromCognitoUserSession(cognitoSession as CognitoUserSession));
    });
  });

  storeCognitoSession(nextSession);
  return nextSession;
}

export async function getActiveCognitoSession(): Promise<CognitoSession | null> {
  const session = getStoredCognitoSession({ allowExpired: true });
  if (!session) return null;
  if (!isExpired(session)) return session;

  try {
    return await refreshCognitoSession(session);
  } catch {
    clearCognitoAuthState();
    return null;
  }
}
