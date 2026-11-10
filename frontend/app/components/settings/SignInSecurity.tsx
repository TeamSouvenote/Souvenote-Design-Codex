"use client";

import * as React from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthProvider";
import { strength, strengthLabel } from "../../lib/passwordStrength";
import { FlowField, focusFirstInvalid } from "../flow/FlowField";
import { FlowDialog } from "../flow/FlowDialog";
import { ConfirmDialog } from "../content/ConfirmDialog";
import {
  CognitoClientError,
  changeCognitoPassword,
  confirmCognitoTotpSetup,
  disableCognitoTotp,
  fetchCognitoTotpEnabled,
  signOutCognitoAllDevices,
  startCognitoTotpSetup,
  totpSetupUri,
  type CognitoSocialProvider,
} from "../../lib/cognitoAuth";
import { SaveState, SettingsSection, errorText, type SaveStatus } from "./shared";
import { SUPPORT_EMAIL } from "../../lib/support";

// Password & sign-in, built on Amazon Cognito (researched 2026-11-08):
// - change password: ChangePassword, email-and-password accounts only;
// - two-step sign-in: optional authenticator app (TOTP), the only MFA type the
//   user pool offers (no SMS, no email codes);
// - sign out of all devices: GlobalSignOut, this device included.
// Google, Facebook and Apple accounts have neither a Cognito password nor
// Cognito two-step sign-in, so they only get the provider line and sign-out.

const PROVIDER_NAMES: Record<CognitoSocialProvider, string> = { Google: "Google", Facebook: "Facebook", SignInWithApple: "Apple" };

function cognitoMessage(error: unknown, fallback: string) {
  if (error instanceof CognitoClientError) {
    if (error.code === "NotAuthorizedException") return "That current password isn't right.";
    if (error.code === "InvalidPasswordException") return "That new password doesn't meet the rules. Use at least 8 characters with letters and numbers.";
    if (error.code === "LimitExceededException" || error.code === "TooManyRequestsException") return "Too many attempts. Please wait a few minutes and try again.";
    if (error.code === "CodeMismatchException" || error.code === "EnableSoftwareTokenMFAException") return "That code didn't match. Check your authenticator app and try the newest code.";
  }
  return errorText(error, fallback);
}

function ChangePassword({ onSignedOut }: { onSignedOut: (reason: "password") => void }) {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [signOutOthers, setSignOutOthers] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<SaveStatus>(null);
  const score = strength(next);
  const mismatch = Boolean(confirm) && confirm !== next;

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!current || !next) {
      setStatus({ tone: "error", text: "Enter your current password and a new one." });
      return;
    }
    if (next !== confirm) {
      setStatus({ tone: "error", text: "The new passwords don't match yet." });
      focusFirstInvalid(event.currentTarget);
      return;
    }
    setSaving(true);
    setStatus({ tone: "info", text: "Changing your password…" });
    try {
      await changeCognitoPassword(current, next);
    } catch (error) {
      setStatus({ tone: "error", text: cognitoMessage(error, "Your password couldn't be changed. Please try again.") });
      setSaving(false);
      return;
    }
    setCurrent(""); setNext(""); setConfirm("");
    if (signOutOthers) {
      // The password has changed by now, so a failure here must not say it didn't (audit B7).
      try {
        await signOutCognitoAllDevices();
        onSignedOut("password");
        return;
      } catch {
        setStatus({ tone: "error", text: "Your password was changed, but your other devices couldn't be signed out. Use “Sign out of all devices” below to try again." });
        setSaving(false);
        return;
      }
    }
    setStatus({ tone: "success", text: "Your password was changed." });
    setSaving(false);
  }

  return (
    <form className="set-form set-sub" onSubmit={save} noValidate aria-busy={saving} aria-labelledby="security-password-title">
      <h3 id="security-password-title" className="set-sub-title">Change password</h3>
      <FlowField label="Current password">
        {(control) => <input {...control} className="cf-input" type="password" autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} />}
      </FlowField>
      <div className="set-grid-2">
        <FlowField label="New password">
          {(control) => <input {...control} className="cf-input" type="password" autoComplete="new-password" value={next} onChange={(event) => setNext(event.target.value)} aria-describedby="security-strength" />}
        </FlowField>
        <FlowField label="Confirm new password" error={mismatch ? "Doesn't match yet" : undefined}>
          {(control) => <input {...control} className="cf-input" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />}
        </FlowField>
      </div>
      <p className="set-help" id="security-strength">Strength: {next ? strengthLabel(score) : "not set yet"}. At least 12 characters works best.</p>
      <label className="set-check">
        <input type="checkbox" checked={signOutOthers} onChange={(event) => setSignOutOthers(event.target.checked)} />
        <span>Also sign out of all devices (you&apos;ll log in again with the new password)</span>
      </label>
      <SaveState status={status} />
      <div className="set-actions">
        <button type="submit" className="l-btn l-btn-primary" aria-disabled={saving || undefined}>{saving ? "Changing…" : "Change password"}</button>
      </div>
    </form>
  );
}

/** Pop-up that sets up authenticator-app sign-in: QR code + copyable key, then the first code. */
function TotpSetupDialog({ email, onClose, onEnabled }: { email: string; onClose: () => void; onEnabled: () => void }) {
  const [secret, setSecret] = React.useState<string | null>(null);
  const [qr, setQr] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  // A bad or wrong code is shown on the field itself and focus moves there (audit B12 rule).
  const [codeError, setCodeError] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [busy, setBusy] = React.useState(true);
  const [status, setStatus] = React.useState<SaveStatus>({ tone: "info", text: "Getting your setup code…" });
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    startCognitoTotpSetup()
      .then(async (next) => {
        if (!active) return;
        setSecret(next);
        setQr(await QRCode.toDataURL(totpSetupUri(email, next), { errorCorrectionLevel: "M", margin: 2, width: 220, color: { dark: "#2F3E3B", light: "#FFFAF3" } }));
        setStatus(null);
      })
      .catch((error) => { if (active) setStatus({ tone: "error", text: cognitoMessage(error, "Setup couldn't start. Close this and try again.") }); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [email]);

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !secret) return;
    if (!/^\d{6}$/.test(code)) {
      setCodeError("Enter the 6-digit code your app shows for Souvenote.");
      focusFirstInvalid(formRef.current);
      return;
    }
    setCodeError(null);
    setBusy(true);
    setStatus({ tone: "info", text: "Checking the code…" });
    try {
      await confirmCognitoTotpSetup(code);
      onEnabled();
    } catch (error) {
      setStatus(null);
      setCodeError(cognitoMessage(error, "That code couldn't be checked. Please try again."));
      setBusy(false);
      focusFirstInvalid(formRef.current);
    }
  }

  return (
    <FlowDialog onClose={onClose} labelledBy="totp-title" describedBy="totp-lede" tone="forest" className="set-totp-dialog">
      <h2 id="totp-title" className="fd-title">Turn on two-step <span className="l-script">sign-in</span></h2>
      <p id="totp-lede" className="fd-lede">Each time you log in, you&apos;ll also enter a 6-digit code from an authenticator app, such as Google Authenticator or 1Password.</p>
      <ol className="set-steps">
        <li className="set-step-scan">
          <p className="set-step-text">Scan this QR code with your authenticator app.</p>
          <div className="set-qr">{qr ? <Image src={qr} alt="QR code to add Souvenote to your authenticator app" width={220} height={220} unoptimized /> : <span className="set-qr-wait" aria-hidden="true" />}</div>
          {secret && (
            <p className="set-help">
              Can&apos;t scan it? Enter this key instead: <code className="set-key">{secret}</code>{" "}
              <button type="button" className="cf-text-link" onClick={() => { void navigator.clipboard?.writeText(secret).then(() => setCopied(true)); }}>
                {copied ? "Copied" : "Copy key"}
              </button>
            </p>
          )}
        </li>
        <li>
          <form ref={formRef} className="set-form" onSubmit={verify} noValidate aria-busy={busy}>
            <FlowField label="Enter the 6-digit code from the app" error={codeError ?? undefined}>
              {(control) => <input {...control} className="cf-input set-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setCodeError(null); }} />}
            </FlowField>
            <SaveState status={status} />
            <div className="fd-actions">
              <button type="button" className="l-btn l-btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="l-btn l-btn-primary" aria-disabled={busy || !secret || undefined}>Turn on</button>
            </div>
          </form>
        </li>
      </ol>
      <p className="fd-fineprint">If you lose your phone, email {SUPPORT_EMAIL} and we&apos;ll help you back in after confirming it&apos;s you.</p>
    </FlowDialog>
  );
}

function TwoStepSignIn({ email }: { email: string }) {
  const [enabled, setEnabled] = React.useState<boolean | null>(null);
  const [setupOpen, setSetupOpen] = React.useState(false);
  const [disableOpen, setDisableOpen] = React.useState(false);
  const [disableError, setDisableError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<SaveStatus>(null);
  // Turn on and Turn off replace each other: focus the new one, not <body> (audit B11).
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const focusToggle = () => window.requestAnimationFrame(() => toggleRef.current?.focus());

  React.useEffect(() => {
    let active = true;
    fetchCognitoTotpEnabled()
      .then((value) => { if (active) setEnabled(value); })
      .catch(() => { if (active) setStatus({ tone: "error", text: "We couldn't check your two-step sign-in. Reload the page to try again." }); });
    return () => { active = false; };
  }, []);

  return (
    <div className="set-sub" aria-labelledby="security-totp-title" role="group">
      <h3 id="security-totp-title" className="set-sub-title">Two-step sign-in</h3>
      <p className="set-help">
        {enabled === null ? "Checking…" : enabled
          ? "On. You enter a code from your authenticator app each time you log in."
          : "Off. Add a code from an authenticator app to every log-in for extra security."}
      </p>
      <SaveState status={status} />
      {enabled !== null && (
        <div className="set-actions">
          {enabled
            ? <button type="button" ref={toggleRef} className="l-btn l-btn-secondary" onClick={() => { setDisableError(null); setDisableOpen(true); }}>Turn off</button>
            : <button type="button" ref={toggleRef} className="l-btn l-btn-primary" onClick={() => setSetupOpen(true)}>Turn on</button>}
        </div>
      )}
      {setupOpen && (
        <TotpSetupDialog
          email={email}
          onClose={() => setSetupOpen(false)}
          onEnabled={() => { setSetupOpen(false); setEnabled(true); setStatus({ tone: "success", text: "Two-step sign-in is on." }); focusToggle(); }}
        />
      )}
      {disableOpen && (
        <ConfirmDialog
          title={<>Turn off two-step <span className="l-script">sign-in</span>?</>}
          body={<p>You&apos;ll log in with just your email and password again.</p>}
          confirmLabel="Turn off"
          busyLabel="Turning off…"
          error={disableError}
          onClose={() => setDisableOpen(false)}
          onConfirm={async () => {
            try {
              await disableCognitoTotp();
              setDisableOpen(false);
              setEnabled(false);
              setStatus({ tone: "success", text: "Two-step sign-in is off." });
              focusToggle();
            } catch (error) {
              setDisableError(cognitoMessage(error, "It couldn't be turned off. Please try again."));
            }
          }}
        />
      )}
    </div>
  );
}

function SignOutEverywhere({ onSignedOut }: { onSignedOut: (reason: "signed-out") => void }) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  return (
    <div className="set-sub" role="group" aria-labelledby="security-signout-title">
      <h3 id="security-signout-title" className="set-sub-title">Sign out of all devices</h3>
      <p className="set-help">Signs your account out everywhere it&apos;s logged in, including this device.</p>
      <div className="set-actions">
        <button type="button" className="l-btn l-btn-secondary" onClick={() => { setError(null); setOpen(true); }}>Sign out of all devices</button>
      </div>
      {open && (
        <ConfirmDialog
          title={<>Sign out of <span className="l-script">all devices</span>?</>}
          body={<p>You&apos;ll be signed out everywhere, including here, and will need to log in again.</p>}
          confirmLabel="Sign out everywhere"
          busyLabel="Signing out…"
          error={error}
          onClose={() => setOpen(false)}
          onConfirm={async () => {
            try {
              await signOutCognitoAllDevices();
              onSignedOut("signed-out");
            } catch (unknownError) {
              setError(cognitoMessage(unknownError, "You couldn't be signed out everywhere. Please try again."));
            }
          }}
        />
      )}
    </div>
  );
}

export function SignInSecurity() {
  const auth = useAuth();
  const router = useRouter();
  const provider = auth.session?.provider;
  const email = auth.user?.email || auth.session?.email || "";

  function afterSignOut(reason: "password" | "signed-out") {
    auth.logout();
    router.push(`/login?signup=${reason}`);
  }

  return (
    <SettingsSection id="security" title="Password & sign-in" lede="Keep your account safe.">
      {provider ? (
        <p className="set-provider">
          You sign in with {PROVIDER_NAMES[provider]}. Manage your password and two-step sign-in in your {PROVIDER_NAMES[provider]} account.
        </p>
      ) : (
        <>
          <ChangePassword onSignedOut={afterSignOut} />
          <TwoStepSignIn email={email} />
        </>
      )}
      <SignOutEverywhere onSignedOut={afterSignOut} />
    </SettingsSection>
  );
}
