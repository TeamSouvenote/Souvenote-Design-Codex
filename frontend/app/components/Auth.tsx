"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PasswordChangedError, useAuth } from "./AuthProvider";
import { Engraving } from "./landing/Engraving";
import { brandFontVariables, handFontVariable } from "../lib/brandFonts";
import { WELCOME_OPTION_ORDER } from "./createOptions";
import { carouselPos, useCardCarousel } from "./useCardCarousel";
import type { UserProfileUpdate } from "../lib/api";
import { TERMS_VERSION } from "../lib/legalVersions";
import {
  CognitoClientError,
  TOTP_REQUIRED_CODE,
  cleanHostedUiReturnPath,
  consumeHostedUiError,
  type CognitoSocialProvider,
  type HostedUiError,
} from "../lib/cognitoAuth";
import { useModalDialog } from "./useModalDialog";
import { strength, strengthLabel } from "../lib/passwordStrength";
import { CURRENCY_BY_COUNTRY, toCountry, type Country } from "../lib/priceLists";
import { SongMark } from "./WelcomeSketches";
import { CookieSettingsButton } from "./content/CookieConsent";
import Image from "next/image";
// Sign-in screens and the Welcome modal (audit E3: no longer global). opened-card.css first,
// as in the old global order.
import "../styles/opened-card.css";
import "../styles/auth.css";

// Auth.tsx - Souvenote auth surface (berry & ivory design system; styles in styles/auth.css).
// 7 state components: signup, login, welcome (post-signup modal), forgot, reset, verify, recover.

type AuthIconName =
  | "check"
  | "arrow"
  | "back"
  | "close"
  | "eye"
  | "eye-off"
  | "mail"
  | "lock"
  | "gift"
  | "note"
  | "image"
  | "alert"
  | "clock"
  | "play"
  | "star";

type AuthIconProps = {
  name: AuthIconName;
  w?: number;
};

type AuthCheckboxProps = {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  children: React.ReactNode;
};

type SocialButtonsProps = {
  verb?: string;
  onProvider?: (provider: CognitoSocialProvider) => void;
};

type VerifyVariant = "success" | "expired";

type VerifyViewProps = {
  variant?: VerifyVariant;
};

type AuthRouteState = "signup" | "login" |"forgot" | "reset" | "verify" | "verify-expired" | "recover" | "terms";

type AuthAppProps = {
  initialState?: AuthRouteState;
  /** Query parameters, read on the server by AuthRoute so views render in the first HTML. */
  params?: Record<string, string>;
};

// Query parameters for the current auth route. Provided by AuthApp from the
// server-read values; views read them with `.get(name)`.
const AuthParamsContext = React.createContext<Record<string, string>>({});

function useAuthParams() {
  const params = React.useContext(AuthParamsContext);
  return React.useMemo(() => ({ get: (name: string): string | null => params[name] ?? null }), [params]);
}

// ============================================================
// SHARED ICONS
// ============================================================
function AuthIcon({ name, w = 18 }: AuthIconProps) {
  const props: React.SVGProps<SVGSVGElement> = { width: w, height: w, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false };
  switch (name) {
    case 'check':   return <svg {...props}><path d="M5 12.5l4 4 10-10" /></svg>;
    case 'arrow':   return <svg {...props}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case 'back':    return <svg {...props}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
    case 'close':   return <svg {...props}><path d="M6 6l12 12M18 6L6 18" /></svg>;
    case 'eye':     return <svg {...props}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>;
    case 'eye-off': return <svg {...props}><path d="M3 3l18 18" /><path d="M10.6 6.2C11.05 6.07 11.52 6 12 6c6.5 0 10 7 10 7-.55 1.1-1.4 2.32-2.5 3.4M14 14a3 3 0 1 1-4-4" /><path d="M6.6 6.6C4.4 8.05 3 10 2 12c0 0 3.5 7 10 7 1.9 0 3.55-.55 5-1.45" /></svg>;
    case 'mail':    return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 7 9-7" /></svg>;
    case 'lock':    return <svg {...props}><rect x="5" y="11" width="14" height="9" rx="1.6" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" /></svg>;
    case 'gift':    return <svg {...props}><rect x="3.5" y="8" width="17" height="5" /><path d="M5 13v8h14v-8" /><path d="M12 8v13" /><path d="M12 8s-3-4.5-5-3 .8 4 5 3zM12 8s3-4.5 5-3-.8 4-5 3z" /></svg>;
    case 'note':    return <svg {...props}><path d="M9 17V5l11-2v12" /><circle cx="6.5" cy="17.5" r="2.5" fill="currentColor" stroke="none" /><circle cx="17.5" cy="15.5" r="2.5" fill="currentColor" stroke="none" /></svg>;
    case 'image':   return <svg {...props}><rect x="3" y="4.5" width="18" height="15" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M3.5 17 L9 12 L13 15.5 L17 11 L20.5 14.5" /></svg>;
    case 'alert':   return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.5" /></svg>;
    case 'clock':   return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>;
    case 'play':    return <svg {...props} fill="currentColor" stroke="none"><path d="M7 5v14l12-7z" /></svg>;
    case 'star':    return <svg viewBox="0 0 24 24" width={w} height={w} fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2.4l2.85 6.18 6.78.74-5.07 4.6 1.46 6.68L12 17.27 5.98 20.6l1.46-6.68-5.07-4.6 6.78-.74L12 2.4z" /></svg>;
    default:        return null;
  }
}

// Brand glyphs (kept as exact path data — match real provider marks)
function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.65 4.65-6.1 8-11.3 8-6.63 0-12-5.37-12-12s5.37-12 12-12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.05 6.05 29.27 4 24 4 12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20c0-1.34-.14-2.65-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.31 14.69l6.57 4.82C14.69 16.1 19 13 24 13c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.05 6.05 29.27 4 24 4 16.32 4 9.69 8.34 6.31 14.69z"/>
      <path fill="#4CAF50" d="M24 44c5.16 0 9.86-1.98 13.4-5.2l-6.18-5.23C29.21 35.1 26.74 36 24 36c-5.16 0-9.6-3.33-11.28-7.95l-6.52 5.02C9.6 39.55 16.24 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.79 2.24-2.23 4.16-4.08 5.57l6.18 5.23C40.99 35.78 44 30.32 44 24c0-1.34-.14-2.65-.4-3.5z"/>
    </svg>
  );
}
function AppleA() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
      <path d="M16.36 12.55c-.02-2.36 1.92-3.5 2-3.55-1.09-1.6-2.79-1.82-3.4-1.85-1.45-.15-2.83.85-3.57.85-.74 0-1.87-.83-3.07-.8-1.58.02-3.04.92-3.85 2.34-1.64 2.85-.42 7.06 1.18 9.37.78 1.13 1.71 2.4 2.93 2.35 1.18-.05 1.62-.76 3.05-.76 1.42 0 1.82.76 3.07.74 1.27-.02 2.07-1.15 2.85-2.28.9-1.31 1.27-2.58 1.29-2.65-.03-.01-2.46-.94-2.48-3.76zM14.38 5.55c.66-.8 1.1-1.91.98-3.02-.95.04-2.1.63-2.78 1.43-.61.7-1.15 1.84-1 2.93 1.06.08 2.14-.54 2.8-1.34z"/>
    </svg>
  );
}
function FacebookF() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path fill="#1877F2" d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-2.9h2.5V9.7c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5H15c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/>
    </svg>
  );
}

// ============================================================
// SHELL
// ============================================================
function AuthTopbar() {
  return (
    <header className="auth-topbar">
      <Link className="auth-topbar-logo" href="/">
        <Image className="auth-topbar-logo-img" src="/assets/wordmark-gold.png" alt="Souvenote" width={900} height={208} sizes="190px" priority />
      </Link>
      <Link className="auth-topbar-back" href="/">
        <AuthIcon name="back" w={16} /> Back to site
      </Link>
    </header>
  );
}

function AuthFooter() {
  return (
    <footer className="auth-foot">
      <span>© 2026 Souvenote · Made with care in Canada</span>
      <span className="auth-foot-links">
        <Link href="/legal/privacy-policy">Privacy</Link>
        <Link href="/legal/terms-of-service">Terms</Link>
        <Link href="/faq">Help</Link>
        {/* Reopens the cookie banner, so a visitor who declined it here can change their mind. */}
        <CookieSettingsButton className="auth-foot-cookie" />
      </span>
    </footer>
  );
}

function AuthCheckbox({ checked, onChange, children }: AuthCheckboxProps) {
  return (
    <label className={`auth-check ${checked ? 'is-checked' : ''}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange && onChange(e.target.checked)} />
      <span className="auth-check-box" aria-hidden="true"><AuthIcon name="check" w={14} /></span>
      <span>{children}</span>
    </label>
  );
}

function SocialButtons({ verb = 'Continue', onProvider }: SocialButtonsProps) {
  return (
    <div className="auth-socials">
      <button type="button" className="auth-social" onClick={() => onProvider?.("Google")}>
        <span className="auth-social-icon"><GoogleG /></span>
        <span className="auth-social-label">{verb} with Google</span>
      </button>
      <button type="button" className="auth-social" onClick={() => onProvider?.("SignInWithApple")}>
        <span className="auth-social-icon"><AppleA /></span>
        <span className="auth-social-label">{verb} with Apple</span>
      </button>
      <button type="button" className="auth-social" onClick={() => onProvider?.("Facebook")}>
        <span className="auth-social-icon"><FacebookF /></span>
        <span className="auth-social-label">{verb} with Facebook</span>
      </button>
    </div>
  );
}

// Live regions for form feedback: success/info is polite, errors are assertive.
// Both containers stay mounted so screen readers announce text as it appears.
// `feedbackKey` changes on every submit, re-inserting the text so the same
// message is announced again when the same mistake is repeated.
function AuthFeedback({ message, error, feedbackKey = 0 }: { message: string | null; error: string | null; feedbackKey?: number }) {
  return (
    <div className="auth-feedback">
      <div aria-live="polite">
        {message && <p key={feedbackKey} className="auth-hint is-success">{message}</p>}
      </div>
      <div role="alert">
        {error && <p key={feedbackKey} className="auth-hint is-error">{error}</p>}
      </div>
    </div>
  );
}

/** Counts submit attempts; pass the count to AuthFeedback as `feedbackKey`. */
function useSubmitCount() {
  return React.useReducer((count: number) => count + 1, 0);
}

// "Resend code" for the sign-up confirmation step. After a send (or straight
// away when a code has just gone out) it waits RESEND_WAIT_SECONDS.
function ResendCodeButton({ email, startWaiting = false }: { email: string; startWaiting?: boolean }) {
  const { resendSignupCode } = useAuth();
  const countdown = useResendCountdown(startWaiting ? RESEND_WAIT_SECONDS : 0);
  const [sending, setSending] = React.useState(false);
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [attempt, countAttempt] = useSubmitCount();

  const resend = async () => {
    if (sending || countdown.secondsLeft > 0) return;
    countAttempt();
    setError(null);
    setSending(true);
    try {
      await resendSignupCode(email);
      setSentTo(email.trim().toLowerCase());
      countdown.start();
    } catch (unknownError) {
      setSentTo(null);
      setError(friendlyAuthError(unknownError));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth-resend-code">
      <button type="button" className="auth-link" onClick={() => void resend()} aria-disabled={sending || countdown.secondsLeft > 0 || undefined}>
        {countdown.secondsLeft > 0 ? `You can resend in ${countdown.secondsLeft}s` : 'Resend code'}
      </button>
      <AuthFeedback message={sentTo ? `A new code is on its way to ${sentTo}.` : null} error={error} feedbackKey={attempt} />
    </div>
  );
}

// Password strength estimator (simple, visual only)
function strengthTone(s: number) {
  if (s >= 3) return 'is-strong';
  if (s === 0) return 'is-short';
  return '';
}

function StrengthMeter({ score, label, id }: { score: number; label: string; id: string }) {
  return (
    <>
      <div className={`auth-meter s${score}`} aria-hidden="true"><span /><span /><span /><span /></div>
      <div className="auth-meter-label" id={id}>
        <span>{label}</span>
        <span className={strengthTone(score)}>{strengthLabel(score)}</span>
      </div>
    </>
  );
}

function friendlyAuthError(error: unknown) {
  if (error instanceof CognitoClientError) {
    if (error.code === "UserNotConfirmedException") return "Confirm your email before logging in.";
    if (error.code === "NotAuthorizedException") return "That email and password did not match.";
    if (error.code === "UsernameExistsException") return "An account already exists for that email. Try logging in.";
    if (error.code === "InvalidPasswordException") return error.message;
    if (error.code === "CodeMismatchException") return "That confirmation code did not match.";
    if (error.code === "ExpiredCodeException") return "That confirmation code expired. Use Resend code to get a new one.";
    if (error.code === "LimitExceededException" || error.code === "TooManyRequestsException") return "Too many attempts. Please wait a few minutes and try again.";
  }

  return error instanceof Error ? error.message : "Authentication failed. Please try again.";
}

// Password-reset codes come from /forgot, so their errors point back there.
function friendlyResetError(error: unknown) {
  if (error instanceof CognitoClientError) {
    if (error.code === "CodeMismatchException") return "That reset code did not match.";
    if (error.code === "ExpiredCodeException") return "That reset code expired. Request a new one from the forgot password page.";
  }
  return friendlyAuthError(error);
}


// After the user presses "send", the resend button waits this long (the
// forgot-password copy promises "You can resend after 60 seconds").
const RESEND_WAIT_SECONDS = 60;

function useResendCountdown(initialSeconds = 0) {
  const [secondsLeft, setSecondsLeft] = React.useState(initialSeconds);
  React.useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);
  return { secondsLeft, start: () => setSecondsLeft(RESEND_WAIT_SECONDS) };
}

function socialProviderLabel(provider?: CognitoSocialProvider) {
  if (provider === "Google") return "Google";
  if (provider === "Facebook") return "Facebook";
  if (provider === "SignInWithApple") return "Apple";
  return "that social provider";
}

function socialAuthFailureMessage(error: HostedUiError) {
  const provider = socialProviderLabel(error.provider);
  if (error.code === "access_denied") {
    return `${provider} sign-in was cancelled or blocked. Choose a ${provider} account that can sign in, then try again below, or use email and password.`;
  }

  if (error.code === "HostedUiAccountSyncError") {
    const detail = error.message ? ` ${error.message}` : "";
    return `${provider} signed in, but Souvenote could not connect that login to your account.${detail} You can try again below.`;
  }

  return `${provider} could not finish sign-in. If that email is not connected to ${provider}, choose a different ${provider} account or use email and password. You can try again below.`;
}

// Same-site paths only: rejects "//host", backslashes ("/\host" resolves to
// another site), control characters, and anything resolving off-origin.
function cleanReturnTo(value: string | null, fallback: string) {
  return cleanHostedUiReturnPath(value ?? undefined, fallback);
}

function loginHrefAfterSignup(email: string, returnTo: string, reason: "created" | "exists") {
  const params = new URLSearchParams({
    returnTo,
    signup: reason,
  });
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail) params.set("email", normalizedEmail);
  return `/login?${params.toString()}`;
}

function signupLoginMessage(reason: string | null) {
  if (reason === "created") return "Account created. Log in with your email and password to continue.";
  if (reason === "exists") return "That email already has an account. Log in with your email and password instead.";
  // From Account Settings: password change, or "Sign out of all devices".
  if (reason === "password") return "Your password was changed and you were signed out everywhere. Log in with your new password.";
  if (reason === "signed-out") return "You were signed out on all devices. Log in again to continue.";
  return null;
}

// Moves focus to the confirmation-code field when the code step appears.
function useFocusWhen(condition: boolean) {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (condition) ref.current?.focus();
  }, [condition]);
  return ref;
}

// ============================================================
// SIGN UP (00a)
// ============================================================
// True while the viewport is phone-sized (the auth.css <600px layout). False on
// the server and first render, so the HTML always carries the full labels.
const PHONE_QUERY = '(max-width: 599px)';
function subscribePhone(onChange: () => void) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
function useIsPhone() {
  return React.useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches, () => false);
}

function SignUpView() {
  const router = useRouter();
  // Phones pair Birthday and Country, so country names drop the currency there.
  const isPhone = useIsPhone();
  const searchParams = useAuthParams();
  const { signup, confirmSignup, startSocialSignIn, error: authContextError } = useAuth();
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [pw2, setPw2] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [dob, setDob] = React.useState('');
  // Canada or the United States only (owner decision 2026-11-08): it sets the
  // account's prices and currency. Always starts on Canada (owner decision 2026-11-09).
  const [country, setCountry] = React.useState<Country>('CA');
  const [terms, setTerms] = React.useState(false);
  const [confirmationCode, setConfirmationCode] = React.useState('');
  const [needsConfirmation, setNeedsConfirmation] = React.useState(false);
  const [authMessage, setAuthMessage] = React.useState<string | null>(null);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const s = strength(pw);
  const returnTo = cleanReturnTo(searchParams.get("returnTo"), "/welcome");
  const id = React.useId();
  const codeRef = useFocusWhen(needsConfirmation);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const [attempt, countAttempt] = useSubmitCount();
  const pwMismatch = Boolean(pw2) && pw2 !== pw;

  React.useEffect(() => {
    const hostedUiError = consumeHostedUiError();
    if (!hostedUiError) return;
    setSubmitting(false);
    setAuthMessage(null);
    setAuthError(socialAuthFailureMessage(hostedUiError));
  }, [authContextError]);

  // "Use a different email": back to the full form with every field kept.
  const changeEmail = () => {
    setNeedsConfirmation(false);
    setConfirmationCode('');
    setAuthMessage(null);
    setAuthError(null);
    window.requestAnimationFrame(() => emailRef.current?.focus());
  };

  const handleSignup = React.useCallback(async () => {
    setAuthError(null);
    setAuthMessage(null);

    if (!email.trim() || !pw) {
      setAuthError("Enter an email and password to create your account.");
      return;
    }

    if (pw !== pw2) {
      setAuthError("Passwords don't match yet.");
      return;
    }

    if (!terms) {
      setAuthError("Accept the terms before creating your account.");
      return;
    }

    setSubmitting(true);
    try {
      const profile: UserProfileUpdate = {
        ...(dob ? { birthday: dob } : {}),
        country,
        currency: CURRENCY_BY_COUNTRY[country],
        termsAccepted: true,
        termsVersion: TERMS_VERSION,
      };
      const result = await signup(email, pw, profile);
      if (result.needsConfirmation) {
        setNeedsConfirmation(true);
        setAuthMessage("Check your email for a 6-digit confirmation code, then enter it below.");
        return;
      }

      router.push(loginHrefAfterSignup(email, returnTo, "created"));
    } catch (error) {
      if (error instanceof CognitoClientError && error.code === "UsernameExistsException") {
        router.push(loginHrefAfterSignup(email, returnTo, "exists"));
        return;
      }
      setAuthError(friendlyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  }, [country, dob, email, pw, pw2, returnTo, router, signup, terms]);

  const handleConfirm = React.useCallback(async () => {
    setAuthError(null);
    setAuthMessage(null);

    if (!confirmationCode.trim()) {
      setAuthError("Enter the confirmation code from your email.");
      return;
    }

    setSubmitting(true);
    try {
      await confirmSignup(email, confirmationCode, pw);
      router.push(loginHrefAfterSignup(email, returnTo, "created"));
    } catch (error) {
      if (error instanceof CognitoClientError && error.code === "UsernameExistsException") {
        router.push(loginHrefAfterSignup(email, returnTo, "exists"));
        return;
      }
      setAuthError(friendlyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  }, [confirmSignup, confirmationCode, email, pw, returnTo, router]);

  const handleSocialSignUp = React.useCallback(async (provider: CognitoSocialProvider) => {
    setAuthError(null);
    setAuthMessage(null);
    setSubmitting(true);
    try {
      await startSocialSignIn(provider, returnTo);
    } catch (error) {
      setSubmitting(false);
      setAuthError(friendlyAuthError(error));
    }
  }, [returnTo, startSocialSignIn]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Busy buttons stay focusable (aria-disabled), so a press while busy is ignored here.
    if (submitting) return;
    countAttempt();
    if (needsConfirmation) void handleConfirm();
    else void handleSignup();
  };

  return (
    <div className="auth-stage">
      <div className="auth-card auth-card-compact">
        <Engraving name="heart" className="auth-eng auth-eng-left" />
        <Engraving name="envelope" className="auth-eng auth-eng-right" />
        <div className="auth-compact">
          <div className="auth-compact-intro">
            <h1 className="auth-title">
              Sign up and claim <span className="auth-script">2 free credits</span>
            </h1>
          </div>

          {!needsConfirmation && (
            <>
              <section aria-labelledby={`${id}-social`}>
                <div className="auth-method-head">
                  <h2 className="auth-method-title" id={`${id}-social`}>Sign up with social</h2>
                  <p className="auth-method-sub">Use an existing account and we&apos;ll open your welcome credits right away.</p>
                </div>
                <SocialButtons verb="Continue" onProvider={handleSocialSignUp} />
              </section>

              <div className="auth-or" aria-hidden="true"><span>or</span></div>
            </>
          )}

          <section aria-labelledby={`${id}-email-title`}>
            <div className="auth-method-head">
              <h2 className="auth-method-title" id={`${id}-email-title`}>Sign up with email</h2>
              <p className="auth-method-sub">Set your login details.</p>
            </div>

            {needsConfirmation ? (
              // Code step: only what's needed to confirm, so it fits one screen.
              <form className="auth-email-fields" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
                <AuthFeedback message={authMessage} error={authError} feedbackKey={attempt} />

                <div className="auth-field">
                  <label className="auth-label" htmlFor={`${id}-code`}>Confirmation code</label>
                  <input ref={codeRef} id={`${id}-code`} className="auth-input" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" value={confirmationCode} onChange={(e) => setConfirmationCode(e.target.value)} />
                </div>

                <button type="submit" className="auth-submit" aria-disabled={submitting || undefined}>
                  {submitting ? "Confirming…" : "Confirm & Go to Login"} <AuthIcon name="arrow" w={16} />
                </button>

                <div className="auth-code-acts">
                  <ResendCodeButton email={email} startWaiting />
                  <button type="button" className="auth-link" onClick={changeEmail}>Use a different email</button>
                </div>

                <div className="auth-cardfoot">
                  Already have an account?{' '}
                  <Link href="/login">Log in →</Link>
                </div>
              </form>
            ) : (
              <form className="auth-email-fields auth-email-fields-signup" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
                <div className="auth-field auth-field-full">
                  <label className="auth-label" htmlFor={`${id}-email`}>Email</label>
                  <input ref={emailRef} id={`${id}-email`} className="auth-input" type="text" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor={`${id}-pw`}>Password</label>
                  <div className="auth-input-wrap">
                    <input id={`${id}-pw`} className="auth-input" type={show ? 'text' : 'password'} autoComplete="new-password" aria-describedby={`${id}-strength`} placeholder="At least 12 characters" value={pw} onChange={(e) => setPw(e.target.value)} />
                    <button type="button" className="auth-input-reveal" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                      <AuthIcon name={show ? 'eye-off' : 'eye'} />
                    </button>
                  </div>
                  <StrengthMeter score={s} label="Password strength" id={`${id}-strength`} />
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor={`${id}-pw2`}>Confirm password</label>
                  <input id={`${id}-pw2`} className={`auth-input ${pwMismatch ? 'is-error' : ''}`} type={show ? 'text' : 'password'} autoComplete="new-password" aria-invalid={pwMismatch || undefined} aria-describedby={pwMismatch ? `${id}-pw2-hint` : undefined} placeholder="Type it again" value={pw2} onChange={(e) => setPw2(e.target.value)} />
                  {pwMismatch && <p className="auth-hint is-error" id={`${id}-pw2-hint`}>Passwords don&apos;t match yet.</p>}
                </div>

                <div className="auth-field-row">
                  <div className="auth-field">
                    <label className="auth-label" htmlFor={`${id}-dob`}>Birthday <em>· optional</em></label>
                    <input id={`${id}-dob`} className="auth-input" type="date" autoComplete="bday" aria-describedby={`${id}-dob-hint`} value={dob} onChange={(e) => setDob(e.target.value)} />
                    <p className="auth-hint auth-optional" id={`${id}-dob-hint`}>Optional. Only used to personalize your account.</p>
                  </div>
                  <div className="auth-field">
                    <label className="auth-label" htmlFor={`${id}-country`}>Country</label>
                    <select id={`${id}-country`} className="auth-select" autoComplete="country" aria-describedby={`${id}-country-hint`} value={country} onChange={(e) => setCountry(toCountry(e.target.value) || 'CA')}>
                      <option value="CA">{isPhone ? 'Canada' : 'Canada (CAD)'}</option>
                      <option value="US">{isPhone ? 'United States' : 'United States (USD)'}</option>
                    </select>
                    <p className="auth-hint auth-optional" id={`${id}-country-hint`}>Sets your prices and currency. To change it later, contact us.</p>
                  </div>
                </div>

                <AuthCheckbox checked={terms} onChange={setTerms}>
                  I agree to the <Link href="/legal/terms-of-service">Terms of Service</Link> and the <Link href="/legal/privacy-policy">Privacy Policy</Link>.
                </AuthCheckbox>

                <AuthFeedback message={authMessage} error={authError} feedbackKey={attempt} />

                <button type="submit" className="auth-submit" aria-disabled={submitting || undefined}>
                  {submitting ? "Creating…" : "Create Account"} <AuthIcon name="arrow" w={16} />
                </button>

                <div className="auth-cardfoot">
                  Already have an account?{' '}
                  <Link href="/login">Log in →</Link>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LOG IN (00b)
// ============================================================
function LoginView() {
  const router = useRouter();
  const searchParams = useAuthParams();
  const { login, completeTotpLogin, cancelTotpLogin, confirmSignup, startSocialSignIn, error: authContextError } = useAuth();
  const [email, setEmail] = React.useState(() => searchParams.get("email") || '');
  const [pw, setPw] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [confirmationCode, setConfirmationCode] = React.useState('');
  const [needsConfirmation, setNeedsConfirmation] = React.useState(false);
  // Two-step sign-in: the password was right, the authenticator code comes next.
  const [needsTotp, setNeedsTotp] = React.useState(false);
  const [totpCode, setTotpCode] = React.useState('');
  // A short or wrong code marks the field invalid and focuses it (the alert line still says why).
  const [totpInvalid, setTotpInvalid] = React.useState(false);
  const [authMessage, setAuthMessage] = React.useState<string | null>(() => signupLoginMessage(searchParams.get("signup")));
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const returnTo = cleanReturnTo(searchParams.get("returnTo"), "/create");
  const id = React.useId();
  const codeRef = useFocusWhen(needsConfirmation);
  const totpRef = useFocusWhen(needsTotp);
  const pwRef = React.useRef<HTMLInputElement>(null);
  const [attempt, countAttempt] = useSubmitCount();

  React.useEffect(() => {
    const hostedUiError = consumeHostedUiError();
    if (!hostedUiError) return;
    setSubmitting(false);
    setAuthMessage(null);
    setAuthError(socialAuthFailureMessage(hostedUiError));
  }, [authContextError]);

  const handleLogin = React.useCallback(async () => {
    setAuthError(null);
    setAuthMessage(null);

    if (!email.trim() || !pw) {
      setAuthError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email, pw, { remember });
      router.push(returnTo);
    } catch (error) {
      if (error instanceof CognitoClientError && error.code === TOTP_REQUIRED_CODE) {
        setNeedsTotp(true);
        setTotpCode('');
        setAuthMessage("Enter the 6-digit code from your authenticator app.");
        return;
      }
      if (error instanceof CognitoClientError && error.code === "UserNotConfirmedException") {
        setNeedsConfirmation(true);
      }
      setAuthError(friendlyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  }, [email, login, pw, remember, returnTo, router]);

  // Back to email and password: drop the code step's message and error, and put
  // focus on the (now empty) password field instead of letting it fall to <body>.
  // The timed-out path below sets its own error after calling this.
  const leaveTotp = React.useCallback(() => {
    cancelTotpLogin();
    setNeedsTotp(false);
    setTotpCode('');
    setTotpInvalid(false);
    setPw('');
    setAuthError(null);
    setAuthMessage(null);
    window.requestAnimationFrame(() => pwRef.current?.focus());
  }, [cancelTotpLogin]);

  const handleTotp = React.useCallback(async () => {
    setAuthError(null);
    setAuthMessage(null);
    const code = totpCode.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(code)) {
      setAuthError("Enter the 6-digit code from your authenticator app.");
      setTotpInvalid(true);
      totpRef.current?.focus();
      return;
    }
    setTotpInvalid(false);

    setSubmitting(true);
    try {
      await completeTotpLogin(code);
      router.push(returnTo);
    } catch (error) {
      if (error instanceof CognitoClientError && error.code === "CodeMismatchException") {
        setAuthError("That code didn't match. Check your authenticator app and try the newest code.");
        setTotpInvalid(true);
        window.requestAnimationFrame(() => totpRef.current?.focus());
      } else if (error instanceof CognitoClientError && (error.code === "TooManyFailedAttemptsException" || error.code === "NotAuthorizedException")) {
        leaveTotp();
        setAuthError(error.code === "TooManyFailedAttemptsException"
          ? "Too many wrong codes. Wait a few minutes, then log in again."
          : "Your sign-in timed out. Enter your email and password again.");
      } else {
        setAuthError(friendlyAuthError(error));
      }
    } finally {
      setSubmitting(false);
    }
  }, [completeTotpLogin, leaveTotp, returnTo, router, totpCode, totpRef]);

  const handleConfirm = React.useCallback(async () => {
    setAuthError(null);
    setAuthMessage(null);

    if (!confirmationCode.trim()) {
      setAuthError("Enter the confirmation code from your email.");
      return;
    }

    setSubmitting(true);
    try {
      await confirmSignup(email, confirmationCode, pw);
      await login(email, pw, { remember });
      router.push(returnTo);
    } catch (error) {
      setAuthError(friendlyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  }, [confirmSignup, confirmationCode, email, login, pw, remember, returnTo, router]);

  const handleSocialLogin = React.useCallback(async (provider: CognitoSocialProvider) => {
    setAuthError(null);
    setAuthMessage(null);
    setSubmitting(true);
    try {
      await startSocialSignIn(provider, returnTo);
    } catch (error) {
      setSubmitting(false);
      setAuthError(friendlyAuthError(error));
    }
  }, [returnTo, startSocialSignIn]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Busy buttons stay focusable (aria-disabled), so a press while busy is ignored here.
    if (submitting) return;
    countAttempt();
    if (needsTotp) void handleTotp();
    else if (needsConfirmation) void handleConfirm();
    else void handleLogin();
  };

  return (
    <div className="auth-stage">
      <div className="auth-card auth-card-compact auth-card-login">
        <Engraving name="notes" className="auth-eng auth-eng-left" />
        <Engraving name="heart" className="auth-eng auth-eng-right" />
        <div className="auth-compact">
          <div className="auth-compact-intro">
            <h1 className="auth-title">
              Pick up where you{' '}
              <span className="auth-script">left off</span>
            </h1>
            <p className="auth-sub auth-optional">Sessions roll for thirty days when you tick remember-me.</p>
          </div>

            <section aria-labelledby={`${id}-social`}>
              <div className="auth-method-head">
                <h2 className="auth-method-title" id={`${id}-social`}>Log in with social</h2>
                <p className="auth-method-sub">Continue with the same provider you used to create your Souvenote account.</p>
              </div>
              <SocialButtons verb="Continue" onProvider={handleSocialLogin} />
            </section>

            <div className="auth-or" aria-hidden="true"><span>or</span></div>

            <section aria-labelledby={`${id}-email-title`}>
              <div className="auth-method-head">
                <h2 className="auth-method-title" id={`${id}-email-title`}>Log in with email</h2>
                <p className="auth-method-sub">Use your email and password to get back to your saved cards and songs.</p>
              </div>

              <form className="auth-email-fields" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
                {needsTotp ? (
                  <div className="auth-field">
                    <label className="auth-label" htmlFor={`${id}-totp`}>Authenticator code</label>
                    <p className="auth-hint" id={`${id}-totp-hint`}>Open your authenticator app and enter the 6-digit code for Souvenote ({email.trim()}).</p>
                    <input ref={totpRef} id={`${id}-totp`} className={`auth-input ${totpInvalid ? 'is-error' : ''}`} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6} aria-describedby={`${id}-totp-hint`} aria-invalid={totpInvalid || undefined} placeholder="123456" value={totpCode} onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setTotpInvalid(false); }} />
                    <button type="button" className="auth-link" onClick={leaveTotp}>Back to email and password</button>
                  </div>
                ) : (
                <>
                <div className="auth-field">
                  <label className="auth-label" htmlFor={`${id}-email`}>Email</label>
                  <input id={`${id}-email`} className="auth-input" type="text" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="auth-field">
                  <div className="auth-row-between">
                    <label className="auth-label" htmlFor={`${id}-pw`}>Password</label>
                    <Link className="auth-link" href="/forgot">Forgot?</Link>
                  </div>
                  <div className="auth-input-wrap">
                    <input ref={pwRef} id={`${id}-pw`} className="auth-input" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Your password" value={pw} onChange={(e) => setPw(e.target.value)} />
                    <button type="button" className="auth-input-reveal" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                      <AuthIcon name={show ? 'eye-off' : 'eye'} />
                    </button>
                  </div>
                </div>

                <AuthCheckbox checked={remember} onChange={setRemember}>
                  Remember me on this device · 30-day rolling session
                </AuthCheckbox>
                </>
                )}

                <AuthFeedback message={authMessage} error={authError} feedbackKey={attempt} />

                {needsConfirmation && (
                  <div className="auth-field">
                    <label className="auth-label" htmlFor={`${id}-code`}>Confirmation code</label>
                    <input ref={codeRef} id={`${id}-code`} className="auth-input" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" value={confirmationCode} onChange={(e) => setConfirmationCode(e.target.value)} />
                    {/* Logging in doesn't send a code, so resend is available straight away. */}
                    <ResendCodeButton email={email} />
                  </div>
                )}

                {needsTotp ? (
                  <button type="submit" className="auth-submit" aria-disabled={submitting || undefined}>
                    {submitting ? "Checking…" : "Verify & Log In"} <AuthIcon name="arrow" w={16} />
                  </button>
                ) : needsConfirmation ? (
                  <button type="submit" className="auth-submit" aria-disabled={submitting || undefined}>
                    {submitting ? "Confirming…" : "Confirm & Log In"} <AuthIcon name="arrow" w={16} />
                  </button>
                ) : (
                  <button type="submit" className="auth-submit" aria-disabled={submitting || undefined}>
                    {submitting ? "Logging in…" : "Log In"} <AuthIcon name="arrow" w={16} />
                  </button>
                )}

                <div className="auth-cardfoot">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup">Sign up →</Link>
                </div>
              </form>
            </section>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// WELCOME MODAL (00c)
// ============================================================
// Dialog behaviour (focus, Tab trap, Escape, scroll lock, inert page, focus
// return) lives in useModalDialog.ts, shared with the Print and Send pop-up.

// The three create options, drawn as opened 5x7 cards: option + sketch on the
// inside left, explanation on the inside right. Template is the middle card
// (larger and in front on desktop, centred first in the carousel). The option
// data and the carousel behaviour are shared with the Create Options page.
const WELCOME_OPTIONS = WELCOME_OPTION_ORDER;
const WELCOME_FEATURED = WELCOME_OPTIONS.findIndex((o) => o.popular);

function WelcomeOptions() {
  const count = WELCOME_OPTIONS.length;
  const { carousel, active, listRef, pointerHandlers, choose, onCardFocus, onCardClick } =
    useCardCarousel({ count, initial: WELCOME_FEATURED });

  return (
    <div className={`auth-welcome-picker${carousel ? ' is-carousel' : ''}`}>
      <ul ref={listRef} className="auth-welcome-options" aria-label="Create options" {...pointerHandlers}>
        {WELCOME_OPTIONS.map((opt, i) => {
          const pos = carouselPos(i, active, count); // -1 left, 0 centre, 1 right
          const { Sketch } = opt;
          return (
            <li key={opt.key} data-pos={carousel ? pos : undefined} style={{ '--pos': pos } as React.CSSProperties}>
              <Link
                className={`sv-ocard auth-welcome-option is-${opt.key}`}
                href={opt.href}
                draggable={false}
                onFocus={(e) => onCardFocus(e, i)}
                onClick={(e) => { onCardClick(e, i); }}
              >
                <span className="sv-ocard-left auth-wcard-left">
                  {opt.popular && (
                    <span className="sv-ocard-badge auth-welcome-badge">
                      <AuthIcon name="star" w={12} />
                      <em>Most popular</em>
                    </span>
                  )}
                  <span className="sv-ocard-title auth-welcome-option-title">{opt.title}</span>
                  <Sketch />
                </span>
                <span className="sv-ocard-right auth-wcard-right">
                  <span className="sv-ocard-hand auth-welcome-option-sub">{opt.sub}</span>
                  <span className="sv-ocard-foot">
                    {opt.song && <SongMark />}
                    <span className="sv-ocard-go auth-wcard-go" aria-hidden="true">
                      <AuthIcon name="arrow" w={18} />
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {carousel && (
        <div className="auth-welcome-dots">
          {WELCOME_OPTIONS.map((opt, i) => (
            <button
              key={opt.key}
              type="button"
              className="auth-welcome-dot"
              aria-label={`Show ${opt.title}`}
              aria-pressed={i === active}
              onClick={() => choose(i)}
            >
              <i />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Rendered on top of the signed-in Home page (/home?welcome=1) so the scrim dims
// the real page; closing removes the query and leaves the user on Home.
export function WelcomeModal() {
  const router = useRouter();
  const id = React.useId();
  const close = React.useCallback(() => router.replace('/home', { scroll: false }), [router]);
  const dialogRef = useModalDialog(close);
  // A click on the dimmed background closes the modal, but only when the
  // press also started there, so a swipe or text selection that begins in
  // the modal and ends outside it doesn't close it.
  const pressedScrim = React.useRef(false);

  return (
    <div className={`souv-auth souv-auth-overlay ${brandFontVariables} ${handFontVariable}`}>
      <div className="auth-modal-wrap">
        <div
          className="auth-modal-scrim"
          aria-hidden="true"
          onPointerDown={() => { pressedScrim.current = true; }}
          onClick={() => {
            if (pressedScrim.current) close();
            pressedScrim.current = false;
          }}
        />
        <div
          ref={dialogRef}
          className="auth-modal auth-welcome-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-sub`}
          tabIndex={-1}
        >
          <button type="button" className="auth-modal-close" onClick={close} aria-label="Close">
            <AuthIcon name="close" w={20} />
          </button>
          <div className="auth-modal-confetti" aria-hidden="true">
            {Array.from({ length: 20 }, (_, i) => <i key={i} />)}
          </div>

          <h2 className="auth-modal-title auth-welcome-title" id={`${id}-title`}>
            <span>Welcome to</span>
            <span className="auth-welcome-mark">
              <Image src="/assets/wordmark-gold.png" alt="Souvenote" width={900} height={208} sizes="320px" />
            </span>
          </h2>
          <span className="auth-modal-pill auth-welcome-pill">
            <AuthIcon name="gift" w={16} /> <b>2 CREDITS</b> in your account.
          </span>
          <p className="auth-modal-sub auth-welcome-sub" id={`${id}-sub`}>
            Pick a card to get started.
          </p>
          <WelcomeOptions />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FORGOT PASSWORD (00d)
// ============================================================
function ForgotView() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const resend = useResendCountdown();
  const id = React.useId();
  const sentRef = React.useRef<HTMLDivElement>(null);
  const [attempt, countAttempt] = useSubmitCount();

  // When the sent state replaces the form, move focus to its message.
  React.useEffect(() => {
    if (sent) sentRef.current?.focus();
  }, [sent]);

  const sendCode = async () => {
    if (sending) return;
    countAttempt();
    setAuthError(null);
    if (!email.trim()) {
      setAuthError("Enter your account email.");
      return;
    }

    setSending(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
      resend.start();
    } catch (error) {
      setAuthError(friendlyAuthError(error));
    } finally {
      setSending(false);
    }
  };

  const normalizedEmail = email.trim().toLowerCase();

  return (
    <div className="auth-stage">
      <div className="auth-card auth-card-secondary">
        <h1 className="auth-title">
          Reset your{' '}
          <span className="auth-script">password</span>
        </h1>
        <p className="auth-sub">
          Enter your account email and we&apos;ll send a one-time reset code. It&apos;s valid for one hour.
        </p>

        {sent ? (
          <div className="auth-sent" ref={sentRef} tabIndex={-1}>
            <span className="auth-sent-pill">
              <AuthIcon name="check" w={14} /> Check your inbox
            </span>
            <p className="auth-hint">
              If an account exists for <b>{email || 'that email'}</b>,
              a reset code is on its way. The code expires in one hour. You can resend after 60 seconds.
            </p>
            <div className="auth-sent-acts">
              <Link className="auth-submit" href={`/reset?${new URLSearchParams({ email: normalizedEmail }).toString()}`}>
                Enter reset code <AuthIcon name="arrow" w={16} />
              </Link>
              <button type="button" className="auth-submit-secondary" onClick={() => { if (resend.secondsLeft <= 0) void sendCode(); }} aria-disabled={sending || resend.secondsLeft > 0 || undefined}>
                Resend reset code
              </button>
            </div>
            <AuthFeedback message={null} error={authError} feedbackKey={attempt} />
          </div>
        ) : (
          <form className="auth-email-fields" onSubmit={(e) => { e.preventDefault(); void sendCode(); }} noValidate aria-busy={sending}>
            <div className="auth-field">
              <label className="auth-label" htmlFor={`${id}-email`}>Account email</label>
              <input id={`${id}-email`} className="auth-input" type="text" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <AuthFeedback message={null} error={authError} feedbackKey={attempt} />
            <button type="submit" className="auth-submit" aria-disabled={sending || undefined}>
              Send reset code <AuthIcon name="mail" w={16} />
            </button>
          </form>
        )}

        <div className="auth-cardfoot">
          Remembered it?{' '}
          <Link href="/login">Back to log in →</Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RESET PASSWORD (00e)
// ============================================================
function ResetView() {
  const router = useRouter();
  const searchParams = useAuthParams();
  const { resetPassword } = useAuth();
  const [email, setEmail] = React.useState(() => searchParams.get("email") || '');
  const [resetCode, setResetCode] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [pw2, setPw2] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  // The password was saved but the sign-in after it failed; the code is used up.
  const [passwordChanged, setPasswordChanged] = React.useState(false);
  const [attempt, countAttempt] = useSubmitCount();
  const s = strength(pw);
  const match = pw && pw2 && pw === pw2;
  const pwMismatch = Boolean(pw2) && pw2 !== pw;
  const id = React.useId();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    countAttempt();
    setAuthError(null);

    if (!email.trim() || !resetCode.trim()) {
      setAuthError("Enter your account email and the reset code from your email.");
      return;
    }
    if (!pw) {
      setAuthError("Enter a new password.");
      return;
    }
    if (pw !== pw2) {
      setAuthError("Passwords don't match yet.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email, resetCode, pw);
      router.push("/create");
    } catch (error) {
      if (error instanceof PasswordChangedError) setPasswordChanged(true);
      else setAuthError(friendlyResetError(error));
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-stage">
      <div className="auth-card auth-card-secondary">
        <h1 className="auth-title">
          Set a{' '}
          <span className="auth-script">new password</span>
        </h1>
        <p className="auth-sub">
          Twelve characters or more, with at least one number and one letter. After you save,
          we&apos;ll sign you out everywhere and bring you back here.
        </p>

        <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
          <div className="auth-field">
            <label className="auth-label" htmlFor={`${id}-email`}>Account email</label>
            <input id={`${id}-email`} className="auth-input" type="text" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor={`${id}-code`}>Reset code</label>
            <input id={`${id}-code`} className="auth-input" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" value={resetCode} onChange={(e) => setResetCode(e.target.value)} />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor={`${id}-pw`}>New password</label>
            <div className="auth-input-wrap">
              <input id={`${id}-pw`} className="auth-input" type={show ? 'text' : 'password'} autoComplete="new-password" aria-describedby={`${id}-strength`} placeholder="At least 12 characters" value={pw} onChange={(e) => setPw(e.target.value)} />
              <button type="button" className="auth-input-reveal" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                <AuthIcon name={show ? 'eye-off' : 'eye'} />
              </button>
            </div>
            <StrengthMeter score={s} label="Strength" id={`${id}-strength`} />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor={`${id}-pw2`}>Confirm password</label>
            <input
              id={`${id}-pw2`}
              className={`auth-input ${pwMismatch ? 'is-error' : ''}`}
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              aria-invalid={pwMismatch || undefined}
              aria-describedby={pw2 ? `${id}-pw2-hint` : undefined}
              placeholder="Type it again"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
            />
            {pwMismatch && <p className="auth-hint is-error" id={`${id}-pw2-hint`}>Passwords don&apos;t match yet.</p>}
            {match && <p className="auth-hint is-success" id={`${id}-pw2-hint`}>Matched.</p>}
          </div>

          <AuthFeedback message={null} error={authError} feedbackKey={attempt} />
          <div aria-live="polite">
            {passwordChanged && (
              <p className="auth-hint is-success">
                Your password was changed. Log in with your new password.{' '}
                <Link className="auth-link" href={`/login?${new URLSearchParams({ email: email.trim().toLowerCase() }).toString()}`}>Log in →</Link>
              </p>
            )}
          </div>

          <button type="submit" className="auth-submit" disabled={passwordChanged} aria-disabled={submitting || undefined}>
            Set new password &amp; sign in <AuthIcon name="arrow" w={16} />
          </button>
        </form>

        {!passwordChanged && (
          <p className="auth-hint auth-hint-center">
            For safety, this signs you out on every other device.
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// EMAIL VERIFICATION (00f)
// ============================================================
function ResendVerificationForm() {
  const { resendSignupCode } = useAuth();
  const [email, setEmail] = React.useState('');
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [attempt, countAttempt] = useSubmitCount();
  const id = React.useId();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    countAttempt();
    setAuthError(null);
    setSentTo(null);
    if (!email.trim()) {
      setAuthError("Enter your account email.");
      return;
    }

    setSending(true);
    try {
      await resendSignupCode(email);
      setSentTo(email.trim().toLowerCase());
    } catch (error) {
      setAuthError(friendlyAuthError(error));
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="auth-email-fields auth-resend-form" onSubmit={handleSubmit} noValidate aria-busy={sending}>
      <div className="auth-field">
        <label className="auth-label" htmlFor={`${id}-email`}>Account email</label>
        <input id={`${id}-email`} className="auth-input" type="text" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <button type="submit" className="auth-submit" aria-disabled={sending || undefined}>
        Resend verification email <AuthIcon name="mail" w={16} />
      </button>
      <div className="auth-feedback">
        <div aria-live="polite">
          {sentTo && (
            <p key={attempt} className="auth-hint is-success">
              A new code is on its way to {sentTo}. Log in to enter it.{' '}
              <Link className="auth-link" href={`/login?${new URLSearchParams({ email: sentTo }).toString()}`}>Back to log in →</Link>
            </p>
          )}
        </div>
        <div role="alert">
          {authError && <p key={attempt} className="auth-hint is-error">{authError}</p>}
        </div>
      </div>
    </form>
  );
}

function VerifyView({ variant = 'success' }: VerifyViewProps) {
  return (
    <div className="auth-stage">
      <div className="auth-card auth-card-secondary auth-status-center">
        {variant === 'success' && (
          <>
            <span className="auth-status-icon">
              <AuthIcon name="check" w={36} />
            </span>
            <h1 className="auth-title">
              Email{' '}
              <span className="auth-script">verified</span>
            </h1>
            <p className="auth-sub">
              Your inbox checks out. Card-pack purchases are unlocked and your two starter credits
              are ready to use.
            </p>
            <Link href="/create" className="auth-submit">
              Continue to Souvenote <AuthIcon name="arrow" w={16} />
            </Link>
          </>
        )}
        {variant === 'expired' && (
          <>
            <span className="auth-status-icon is-rose">
              <AuthIcon name="alert" w={36} />
            </span>
            <h1 className="auth-title">
              That code{' '}
              <span className="auth-script">timed out</span>
            </h1>
            <p className="auth-sub">
              Verification codes last twenty-four hours. We can send a fresh one to the same email.
            </p>
            <ResendVerificationForm />
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ACCOUNT RECOVERY (00g)
// ============================================================
function RecoverView() {
  return (
    <div className="auth-stage">
      <div className="auth-card auth-card-secondary auth-status-center">
        <span className="auth-status-icon is-rose">
          <AuthIcon name="clock" w={36} />
        </span>
        <h1 className="auth-title">
          Welcome back. Want to{' '}
          <span className="auth-script">restore</span>{' '}
          your account?
        </h1>
        <p className="auth-sub">
          Your Souvenote account is scheduled for permanent deletion. You have a few days left to
          bring everything back.
        </p>
        <div className="auth-countdown">
          <span className="auth-countdown-num">3</span>
          <span className="auth-countdown-label">days remaining</span>
        </div>

        <ul className="auth-restore-list">
          <li><AuthIcon name="image" w={16} /> Saved card images and songs</li>
          <li><AuthIcon name="gift" w={16} /> Active card packs</li>
          <li><AuthIcon name="note" w={16} /> Drafts, recipient list, and order history</li>
        </ul>

        <div className="auth-recover-acts">
          <button type="button" className="auth-submit">
            Restore my account <AuthIcon name="arrow" w={16} />
          </button>
          <button type="button" className="auth-link is-danger">
            No, finalize deletion now
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TERMS CONSENT (after a first social sign-in)
// ============================================================
// Social sign-ups skip the sign-up form, so the Terms checkbox and the
// country (Canada or United States: prices and currency) are asked once here. AuthProvider sends a
// signed-in social user here when no acceptance is on record.
function TermsView() {
  const router = useRouter();
  const searchParams = useAuthParams();
  const { acceptTerms, status, user } = useAuth();
  // Always starts on Canada (owner decision 2026-11-09).
  const [country, setCountry] = React.useState<Country>('CA');
  const [terms, setTerms] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const countryId = React.useId();
  const [attempt, countAttempt] = useSubmitCount();
  const returnTo = cleanReturnTo(searchParams.get("returnTo"), "/create");

  // Nothing to record without a session, or when acceptance is already saved.
  React.useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "authenticated" && user?.terms_accepted_at) router.replace(returnTo);
  }, [returnTo, router, status, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    countAttempt();
    setAuthError(null);
    if (!terms) {
      setAuthError("Accept the terms to continue.");
      return;
    }

    setSubmitting(true);
    try {
      await acceptTerms(country);
      router.push(returnTo);
    } catch {
      setAuthError("We couldn't save that. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-stage">
      <div className="auth-card auth-card-secondary">
        <h1 className="auth-title">
          Before you <span className="auth-script">start</span>
        </h1>
        <p className="auth-sub">
          Please confirm a couple of things to finish setting up your account.
        </p>

        <form className="auth-email-fields" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
          <div className="auth-field">
            <label className="auth-label" htmlFor={countryId}>Country</label>
            <select id={countryId} className="auth-select" autoComplete="country" aria-describedby={`${countryId}-hint`} value={country} onChange={(e) => setCountry(toCountry(e.target.value) || 'CA')}>
              <option value="CA">Canada (CAD)</option>
              <option value="US">United States (USD)</option>
            </select>
            <p className="auth-hint auth-optional" id={`${countryId}-hint`}>Sets your prices and currency. To change it later, contact us.</p>
          </div>

          <AuthCheckbox checked={terms} onChange={setTerms}>
            I agree to the <Link href="/legal/terms-of-service">Terms of Service</Link> and the <Link href="/legal/privacy-policy">Privacy Policy</Link>.
          </AuthCheckbox>

          <AuthFeedback message={null} error={authError} feedbackKey={attempt} />

          <button type="submit" className="auth-submit" disabled={status !== "authenticated"} aria-disabled={submitting || undefined}>
            Continue <AuthIcon name="arrow" w={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// TOP-LEVEL
// ============================================================
function AuthApp({ initialState = 'signup', params = {} }: AuthAppProps) {
  const state = initialState;

  return (
    <AuthParamsContext.Provider value={params}>
      <div className="auth-page">
        <AuthTopbar />

        <main id="main" className="auth-main" tabIndex={-1}>
          {state === 'signup'         && <SignUpView />}
          {state === 'login'          && <LoginView />}
          {state === 'forgot'         && <ForgotView />}
          {state === 'reset'          && <ResetView />}
          {state === 'verify'         && <VerifyView variant="success" />}
          {state === 'verify-expired' && <VerifyView variant="expired" />}
          {state === 'recover'        && <RecoverView />}
          {state === 'terms'          && <TermsView />}
        </main>

        <AuthFooter />
      </div>
    </AuthParamsContext.Provider>
  );
}

export { AuthApp };
