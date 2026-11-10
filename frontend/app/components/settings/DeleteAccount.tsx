"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthProvider";
import { FlowDialog } from "../flow/FlowDialog";
import { FlowField, focusFirstInvalid } from "../flow/FlowField";
import { deleteAuthenticatedUser } from "../../lib/api";
import { deleteCognitoUser } from "../../lib/cognitoAuth";
import { SettingsSection, errorText } from "./shared";
import { SUPPORT_EMAIL } from "../../lib/support";

// Delete your account (PRD §5). The pop-up explains what is removed and what is
// kept before the customer types DELETE. Order of operations: the backend
// removes the account's data (DELETE /auth/me), then the Cognito user is
// deleted, then the app signs out.

const CONFIRM_WORD = "DELETE";

function WhatHappens() {
  return (
    <div className="set-delete-explain">
      <div className="set-delete-group">
        <h3 className="set-sub-title">What&apos;s removed</h3>
        <ul>
          <li>Your profile and sign-in.</li>
          <li>Your saved recipients.</li>
          <li>Your drafts, saved cards and songs in Saved Cards &amp; Songs.</li>
          <li>Any unused credits and cards in your bank.</li>
        </ul>
      </div>
      <div className="set-delete-group">
        <h3 className="set-sub-title">What&apos;s kept</h3>
        <ul>
          <li>Songs on cards you&apos;ve already mailed keep playing from their QR codes, so your recipients don&apos;t lose them.</li>
          <li>Order and payment records we&apos;re required to keep by law.</li>
        </ul>
      </div>
      <p className="set-help">To remove the song from a card you&apos;ve already mailed, email {SUPPORT_EMAIL}. Cards already in the mail can&apos;t be recalled.</p>
    </div>
  );
}

function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const auth = useAuth();
  const router = useRouter();
  const [typed, setTyped] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const dataDeletedRef = React.useRef(false);
  const ready = typed.trim().toUpperCase() === CONFIRM_WORD;

  async function confirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Both buttons are disabled while busy, so focus is lost. After a failure,
    // focus the field: its error (the honest message below) is read with it.
    const form = event.currentTarget;
    if (busy) return;
    if (!ready) {
      setError(`Type ${CONFIRM_WORD} to confirm.`);
      focusFirstInvalid(form);
      return;
    }
    setBusy(true);
    setError(null);
    // Two steps: the account's data, then the sign-in. If only the first
    // worked, say so, and let a retry do just the second (audit B6).
    if (!dataDeletedRef.current) {
      try {
        await deleteAuthenticatedUser();
        dataDeletedRef.current = true;
      } catch (unknownError) {
        setError(errorText(unknownError, `Your account couldn't be deleted. Nothing was removed. Please try again, or email ${SUPPORT_EMAIL}.`));
        setBusy(false);
        focusFirstInvalid(form);
        return;
      }
    }
    try {
      await deleteCognitoUser();
    } catch {
      setError(`Your account's data was deleted, but your sign-in couldn't be closed yet. Press Delete my account to finish, or email ${SUPPORT_EMAIL}.`);
      setBusy(false);
      focusFirstInvalid(form);
      return;
    }
    auth.logout();
    router.push("/");
  }

  return (
    <FlowDialog onClose={busy ? () => undefined : onClose} labelledBy="delete-account-title" describedBy="delete-account-lede" tone="berry" role="alertdialog" className="set-delete-dialog">
      <h2 id="delete-account-title" className="fd-title">Delete your <span className="l-script">account</span>?</h2>
      <p id="delete-account-lede" className="fd-lede">This can&apos;t be undone.</p>
      <WhatHappens />
      <form className="set-form" onSubmit={confirm} noValidate aria-busy={busy}>
        <FlowField label={`Type ${CONFIRM_WORD} to confirm`} error={error || undefined}>
          {(control) => <input {...control} className="cf-input" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={typed} onChange={(event) => setTyped(event.target.value)} />}
        </FlowField>
        <div className="fd-actions">
          <button type="button" className="l-btn l-btn-secondary" onClick={onClose} disabled={busy}>Keep my account</button>
          <button type="submit" className="l-btn l-btn-primary set-delete-btn" disabled={!ready && !busy} aria-disabled={busy || undefined}>{busy ? "Deleting…" : "Delete my account"}</button>
        </div>
      </form>
    </FlowDialog>
  );
}

export function DeleteAccount() {
  const [open, setOpen] = React.useState(false);
  return (
    <SettingsSection id="delete" title="Delete your account" lede="Remove your account and your saved work from Souvenote.">
      <WhatHappens />
      <div className="set-actions">
        <button type="button" className="l-btn l-btn-secondary set-danger-btn" onClick={() => setOpen(true)}>Delete my account…</button>
      </div>
      {open && <DeleteAccountDialog onClose={() => setOpen(false)} />}
    </SettingsSection>
  );
}
