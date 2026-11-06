"use client";

import * as React from "react";
import { ApiRequestError, fetchAuthenticatedUser, updateAuthenticatedUser } from "../lib/api";
import type { UserProfileUpdate } from "../lib/api";
import { TERMS_VERSION } from "../lib/legalVersions";
import {
  AUTH_SESSION_UPDATED_EVENT,
  CognitoClientError,
  clearCognitoAuthState,
  completeHostedUiSignIn,
  confirmCognitoPasswordReset,
  confirmCognitoSignUp,
  consumeHostedUiAttempt,
  consumeHostedUiReturnTo,
  getActiveCognitoSession,
  getHostedUiLogoutUrl,
  getStoredLocalUser,
  rememberHostedUiError,
  requestCognitoPasswordReset,
  resendCognitoSignUpCode,
  setSessionPersistence,
  signInWithCognito,
  signOutCognitoEverywhere,
  signUpWithCognito,
  startHostedUiSignIn,
  storeLocalUser,
} from "../lib/cognitoAuth";
import type { CognitoCodeDelivery, CognitoSession, CognitoSocialProvider, LocalUser } from "../lib/cognitoAuth";
import type { DemoUser } from "./DemoUser";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

type SignUpResponse = {
  needsConfirmation: boolean;
  codeDelivery?: CognitoCodeDelivery;
  user?: LocalUser;
};

type AuthContextValue = {
  status: AuthStatus;
  session: CognitoSession | null;
  user: LocalUser | null;
  displayUser: DemoUser | null;
  error: string | null;
  login: (email: string, password: string, options?: { remember?: boolean }) => Promise<LocalUser>;
  signup: (email: string, password: string, profile?: UserProfileUpdate) => Promise<SignUpResponse>;
  confirmSignup: (email: string, confirmationCode: string, password: string) => Promise<LocalUser>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (email: string, resetCode: string, newPassword: string) => Promise<LocalUser>;
  resendSignupCode: (email: string) => Promise<void>;
  acceptTerms: (marketingOptIn: boolean) => Promise<LocalUser>;
  startSocialSignIn: (provider: CognitoSocialProvider, returnTo?: string) => Promise<void>;
  logout: (options?: { hostedUi?: boolean }) => boolean;
  refreshUser: () => Promise<LocalUser | null>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

/** Shown once after a first social sign-in that has no Terms acceptance on record. */
export const TERMS_CONSENT_PATH = "/signup/terms";

/** The new password was saved, but signing out other devices or signing in afterwards failed. */
export class PasswordChangedError extends Error {
  constructor() {
    super("Your password was changed. Log in with your new password.");
    this.name = "PasswordChangedError";
  }
}

// Profile details entered at sign-up (birthday, country, marketing choice,
// terms acceptance) are kept here until the account has a session that can
// save them. This covers accounts that need email confirmation first and
// retries a save that failed. Only written after Cognito creates the account,
// so a sign-up attempt for an existing email can never overwrite that profile.
// The record expires, is dropped after a rejected save or a few failed tries,
// and is cleared on logout, so a sign-up choice can't overwrite later changes.
const PENDING_PROFILE_STORAGE_KEY = "souv_pending_signup_profile";
const PENDING_PROFILE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const PENDING_PROFILE_MAX_ATTEMPTS = 3;

type PendingProfile = { email: string; profile: UserProfileUpdate; savedAt: number; attempts: number };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function writePendingProfile(pending: PendingProfile) {
  try {
    window.localStorage.setItem(PENDING_PROFILE_STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // Storage can be unavailable (private mode); the immediate save still runs.
  }
}

function rememberPendingProfile(email: string, profile: UserProfileUpdate) {
  writePendingProfile({ email: normalizeEmail(email), profile, savedAt: Date.now(), attempts: 0 });
}

function clearPendingProfile() {
  try {
    window.localStorage.removeItem(PENDING_PROFILE_STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

function readPendingProfile(email: string): PendingProfile | null {
  try {
    const raw = window.localStorage.getItem(PENDING_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const pending = JSON.parse(raw) as Partial<PendingProfile>;
    if (typeof pending.savedAt !== "number" || Date.now() - pending.savedAt > PENDING_PROFILE_MAX_AGE_MS) {
      clearPendingProfile();
      return null;
    }
    if (pending.email !== normalizeEmail(email) || !pending.profile) return null;
    return { email: pending.email, profile: pending.profile, savedAt: pending.savedAt, attempts: pending.attempts ?? 0 };
  } catch {
    return null;
  }
}

/** Saves a pending sign-up profile for this email. Returns the updated user, or null if there was nothing to save or the save failed. */
async function applyPendingProfile(email: string): Promise<LocalUser | null> {
  const pending = readPendingProfile(email);
  if (!pending) return null;

  try {
    const updatedUser = await updateAuthenticatedUser(pending.profile);
    clearPendingProfile();
    storeLocalUser(updatedUser);
    return updatedUser;
  } catch (unknownError) {
    // A rejected request (4xx) won't succeed on retry; anything else is
    // retried at the next login, up to the attempt limit.
    const attempts = pending.attempts + 1;
    const rejected = unknownError instanceof ApiRequestError && unknownError.status >= 400 && unknownError.status < 500;
    if (rejected || attempts >= PENDING_PROFILE_MAX_ATTEMPTS) clearPendingProfile();
    else writePendingProfile({ ...pending, attempts });
    return null;
  }
}

function initialsForEmail(email: string) {
  const namePart = email.split("@")[0] || "U";
  const pieces = namePart.split(/[._-]+/).filter(Boolean);
  const initials = pieces.length > 1
    ? `${pieces[0][0]}${pieces[1][0]}`
    : namePart.slice(0, 2);

  return initials.toUpperCase();
}

function displayNameForEmail(email: string) {
  const namePart = email.split("@")[0] || "Souvenote User";
  return namePart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((piece) => `${piece.charAt(0).toUpperCase()}${piece.slice(1)}`)
    .join(" ") || email;
}

function displayNameForSession(session: CognitoSession | null, email: string) {
  const sessionName = session?.name?.trim()
    || [session?.givenName, session?.familyName].filter(Boolean).join(" ").trim();

  return sessionName || displayNameForEmail(email);
}

function isCognitoCode(error: unknown, code: string) {
  return error instanceof CognitoClientError && error.code === code;
}

function errorMessageFromUnknown(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function toDisplayUser(user: LocalUser | null, session: CognitoSession | null): DemoUser | null {
  if (!user) return null;
  const profileName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  const name = profileName || displayNameForSession(session, user.email);
  return {
    name,
    email: user.email,
    initials: name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((piece) => piece[0])
      .join("")
      .toUpperCase() || initialsForEmail(user.email),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AuthStatus>("loading");
  const [session, setSession] = React.useState<CognitoSession | null>(null);
  const [user, setUser] = React.useState<LocalUser | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const syncLocalUser = React.useCallback(async (nextSession: CognitoSession) => {
    setSession(nextSession);
    setUser(null);
    setStatus("loading");
    setError(null);

    try {
      const localUser = await fetchAuthenticatedUser();
      storeLocalUser(localUser);
      setUser(localUser);
      setStatus("authenticated");
      return localUser;
    } catch (unknownError) {
      clearCognitoAuthState();
      setSession(null);
      setUser(null);
      setStatus("unauthenticated");
      setError(errorMessageFromUnknown(unknownError, "Could not sync your Souvenote account."));
      throw unknownError;
    }
  }, []);

  const refreshUser = React.useCallback(async () => {
    const activeSession = await getActiveCognitoSession();
    if (!activeSession) {
      setSession(null);
      setUser(null);
      setStatus("unauthenticated");
      return null;
    }

    return syncLocalUser(activeSession);
  }, [syncLocalUser]);

  React.useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const cachedUser = getStoredLocalUser();
      if (cachedUser) setUser(cachedUser);

      try {
        const hostedUiSession = await completeHostedUiSignIn();
        const activeSession = hostedUiSession || await getActiveCognitoSession();
        if (cancelled) return;

        if (!activeSession) {
          setStatus("unauthenticated");
          setSession(null);
          setUser(null);
          return;
        }

        let syncedUser: LocalUser;
        try {
          syncedUser = await syncLocalUser(activeSession);
        } catch (unknownError) {
          if (hostedUiSession) {
            const attempt = consumeHostedUiAttempt();
            const authPath = rememberHostedUiError({
              code: "HostedUiAccountSyncError",
              message: errorMessageFromUnknown(unknownError, "Could not connect that social login to your Souvenote account."),
              provider: attempt?.provider,
            }, attempt?.authPath || "/login");

            if (authPath && `${window.location.pathname}${window.location.search}` !== authPath) {
              window.location.replace(authPath);
            }
          }

          throw unknownError;
        }

        const returnTo = hostedUiSession ? consumeHostedUiReturnTo() : null;
        // Social sign-ups skip the sign-up form's Terms checkbox, so ask once.
        if (hostedUiSession && !syncedUser.terms_accepted_at) {
          if (window.location.pathname !== TERMS_CONSENT_PATH) {
            window.location.replace(`${TERMS_CONSENT_PATH}?${new URLSearchParams({ returnTo: returnTo || "/create" }).toString()}`);
          }
          return;
        }
        if (returnTo && window.location.pathname !== returnTo) {
          window.location.replace(returnTo);
        }
      } catch (unknownError) {
        if (cancelled) return;
        clearCognitoAuthState();
        setSession(null);
        setUser(null);
        setStatus("unauthenticated");
        setError(unknownError instanceof Error ? unknownError.message : "Could not restore your session.");
      }
    }

    restoreSession();

    function onAuthUpdate() {
      if (!getStoredLocalUser()) setUser(null);
    }

    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, onAuthUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, onAuthUpdate);
    };
  }, [syncLocalUser]);

  const login = React.useCallback(async (email: string, password: string, options: { remember?: boolean } = {}) => {
    setStatus("loading");
    setError(null);
    try {
      setSessionPersistence(options.remember ?? true);
      const nextSession = await signInWithCognito(email, password);
      const localUser = await syncLocalUser(nextSession);
      const profiledUser = await applyPendingProfile(email);
      if (profiledUser) setUser(profiledUser);
      return profiledUser || localUser;
    } catch (unknownError) {
      setStatus("unauthenticated");
      setError(errorMessageFromUnknown(unknownError, "Could not sign in."));
      throw unknownError;
    }
  }, [syncLocalUser]);

  const syncSignupThenSignOut = React.useCallback(async (email: string, password: string) => {
    const nextSession = await signInWithCognito(email, password);
    try {
      const localUser = await syncLocalUser(nextSession);
      return (await applyPendingProfile(email)) || localUser;
    } finally {
      clearCognitoAuthState();
      setSession(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, [syncLocalUser]);

  const signup = React.useCallback(async (email: string, password: string, profile?: UserProfileUpdate): Promise<SignUpResponse> => {
    setStatus("loading");
    setError(null);
    let result: Awaited<ReturnType<typeof signUpWithCognito>>;

    try {
      result = await signUpWithCognito(email, password);
    } catch (unknownError) {
      setStatus("unauthenticated");
      setError(errorMessageFromUnknown(unknownError, "Could not create your account."));
      throw unknownError;
    }

    if (profile) rememberPendingProfile(email, profile);

    if (!result.confirmed) {
      setStatus("unauthenticated");
      return {
        needsConfirmation: true,
        codeDelivery: result.codeDelivery,
      };
    }

    const localUser = await syncSignupThenSignOut(email, password);
    return {
      needsConfirmation: false,
      user: localUser,
    };
  }, [syncSignupThenSignOut]);

  const confirmSignup = React.useCallback(async (email: string, confirmationCode: string, password: string) => {
    setStatus("loading");
    setError(null);
    try {
      await confirmCognitoSignUp(email, confirmationCode);
      return await syncSignupThenSignOut(email, password);
    } catch (unknownError) {
      setStatus("unauthenticated");
      setError(errorMessageFromUnknown(unknownError, "Could not confirm your account."));
      throw unknownError;
    }
  }, [syncSignupThenSignOut]);

  // The forgot-password and resend screens say "if an account exists", so an
  // unknown email is treated as sent rather than revealing who has an account.
  const requestPasswordReset = React.useCallback(async (email: string) => {
    try {
      await requestCognitoPasswordReset(email);
    } catch (unknownError) {
      if (isCognitoCode(unknownError, "UserNotFoundException")) return;
      throw unknownError;
    }
  }, []);

  const resendSignupCode = React.useCallback(async (email: string) => {
    try {
      await resendCognitoSignUpCode(email);
    } catch (unknownError) {
      if (isCognitoCode(unknownError, "UserNotFoundException")) return;
      throw unknownError;
    }
  }, []);

  // Sets the new password, signs the account out on every device (revoking all
  // refresh tokens), then signs in fresh on this one. Once the password is
  // saved the reset code is used up, so a later failure says so instead of
  // inviting a retry that would report the code as wrong.
  const resetPassword = React.useCallback(async (email: string, resetCode: string, newPassword: string) => {
    await confirmCognitoPasswordReset(email, resetCode, newPassword);
    try {
      await signOutCognitoEverywhere(email, newPassword);
      return await login(email, newPassword);
    } catch {
      throw new PasswordChangedError();
    }
  }, [login]);

  // Records Terms acceptance (and the marketing choice) for a signed-in user.
  const acceptTerms = React.useCallback(async (marketingOptIn: boolean) => {
    const updatedUser = await updateAuthenticatedUser({ termsAccepted: true, termsVersion: TERMS_VERSION, marketingOptIn });
    storeLocalUser(updatedUser);
    setUser(updatedUser);
    return updatedUser;
  }, []);

  const startSocialSignIn = React.useCallback(async (provider: CognitoSocialProvider, returnTo = "/create") => {
    setStatus("loading");
    setError(null);
    try {
      await startHostedUiSignIn(provider, returnTo);
    } catch (unknownError) {
      setStatus("unauthenticated");
      setError(errorMessageFromUnknown(unknownError, "Could not start social sign in."));
      throw unknownError;
    }
  }, []);

  const logout = React.useCallback((options: { hostedUi?: boolean } = {}) => {
    let hostedUiLogoutUrl: string | null = null;
    if (options.hostedUi) {
      try {
        hostedUiLogoutUrl = getHostedUiLogoutUrl();
      } catch {
        hostedUiLogoutUrl = null;
      }
    }

    clearCognitoAuthState();
    clearPendingProfile();
    setSession(null);
    setUser(null);
    setStatus("unauthenticated");
    setError(null);

    if (hostedUiLogoutUrl) {
      window.location.assign(hostedUiLogoutUrl);
      return true;
    }

    return false;
  }, []);

  const value = React.useMemo<AuthContextValue>(() => ({
    status,
    session,
    user,
    displayUser: toDisplayUser(user, session),
    error,
    login,
    signup,
    confirmSignup,
    requestPasswordReset,
    resetPassword,
    resendSignupCode,
    acceptTerms,
    startSocialSignIn,
    logout,
    refreshUser,
  }), [acceptTerms, confirmSignup, error, login, logout, refreshUser, requestPasswordReset, resendSignupCode, resetPassword, session, signup, startSocialSignIn, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = React.useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return value;
}
