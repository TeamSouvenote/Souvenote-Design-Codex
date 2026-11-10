"use client";

import * as React from "react";
import { DLV_EMPTY_RECIP, DlvAddressFields, dlvSummaryLine, dlvValidate } from "../DeliveryForm";
import type { DeliveryErrors, DeliveryRecipient } from "../DeliveryForm";
import { ConfirmDialog } from "../content/ConfirmDialog";
import { focusFirstInvalid } from "../flow/FlowField";
import {
  createSavedRecipient,
  deleteSavedRecipient,
  fetchSavedRecipients,
  updateSavedRecipient,
  type SavedRecipient,
} from "../../lib/api";
import { SaveState, SettingsSection, errorText, type SaveStatus } from "./shared";

// Saved recipients (PRD §5 address book): names and mailing addresses in
// Canada or the US, the same fields and checks as Delivery. Orders keep their
// own copy of the address, so editing or deleting an entry never changes a card
// that's already been ordered.

function fullName(recipient: DeliveryRecipient) {
  return [recipient.title, recipient.firstName, recipient.lastName].filter(Boolean).join(" ");
}

function toFields(recipient: SavedRecipient): DeliveryRecipient {
  const { title, firstName, lastName, company, address1, address2, address3, city, state, postalCode, country } = recipient;
  return { title, firstName, lastName, company, address1, address2, address3, city, state, postalCode, country };
}

export function SavedRecipients() {
  const [recipients, setRecipients] = React.useState<SavedRecipient[]>([]);
  const [loadState, setLoadState] = React.useState<"loading" | "ready" | "error">("loading");
  const [form, setForm] = React.useState<DeliveryRecipient | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<DeliveryErrors>({});
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<SaveStatus>(null);
  const [deleting, setDeleting] = React.useState<SavedRecipient | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const formHeadingRef = React.useRef<HTMLHeadingElement>(null);
  const addButtonRef = React.useRef<HTMLButtonElement>(null);

  const load = React.useCallback(async () => {
    try {
      setRecipients(await fetchSavedRecipients());
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  function openForm(recipient?: SavedRecipient) {
    setEditingId(recipient?.id || null);
    setForm(recipient ? toFields(recipient) : { ...DLV_EMPTY_RECIP });
    setErrors({});
    setStatus(null);
    // Move focus to the form heading once it's on screen.
    window.requestAnimationFrame(() => formHeadingRef.current?.focus());
  }

  // The focused control (Save, or the row's Delete) is gone after a change: move
  // focus to "Add a recipient", or the open form's heading, not <body> (audit B11).
  function focusAfterChange() {
    window.requestAnimationFrame(() => (addButtonRef.current ?? formHeadingRef.current)?.focus());
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || saving) return;
    const nextErrors = dlvValidate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus({ tone: "error", text: "Check the highlighted fields." });
      // Focus the first bad field so its error is read with it (audit B12 rule).
      focusFirstInvalid(event.currentTarget);
      return;
    }
    setSaving(true);
    setStatus({ tone: "info", text: "Saving…" });
    try {
      if (editingId) await updateSavedRecipient(editingId, form);
      else await createSavedRecipient(form);
      setStatus({ tone: "success", text: `${fullName(form)} is saved.` });
      setForm(null);
      setEditingId(null);
      await load();
      focusAfterChange();
    } catch (error) {
      setStatus({ tone: "error", text: errorText(error, "The recipient couldn't be saved.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsSection id="recipients" title="Saved recipients" lede="People you send cards to. Choose them on Delivery so you don't retype their address.">
      {loadState === "loading" && <p className="set-help">Loading your saved recipients…</p>}
      {loadState === "error" && <p className="cf-alert" role="alert">Your saved recipients couldn&apos;t be loaded. Reload the page to try again.</p>}
      {loadState === "ready" && (recipients.length ? (
        <ul className="set-list">
          {recipients.map((recipient) => (
            <li key={recipient.id} className="set-list-item">
              <div className="set-list-text">
                <p className="set-list-title">{fullName(recipient)}</p>
                <p className="set-help">{dlvSummaryLine(recipient)}</p>
              </div>
              <div className="set-list-actions">
                <button type="button" className="cf-text-link" onClick={() => openForm(recipient)}>Edit<span className="l-sr-only"> {fullName(recipient)}</span></button>
                <button type="button" className="cf-text-link set-danger-link" onClick={() => { setDeleteError(null); setDeleting(recipient); }}>Delete<span className="l-sr-only"> {fullName(recipient)}</span></button>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="set-help">No saved recipients yet. You can also save one when you send a card.</p>)}

      {form ? (
        <form className="set-form set-sub" onSubmit={save} noValidate aria-busy={saving} aria-labelledby="recipients-form-title">
          <h3 id="recipients-form-title" ref={formHeadingRef} tabIndex={-1} className="set-sub-title">{editingId ? `Edit ${fullName(form) || "recipient"}` : "Add a recipient"}</h3>
          <DlvAddressFields value={form} onChange={setForm} errors={errors} />
          <SaveState status={status} />
          <div className="set-actions">
            <button type="submit" className="l-btn l-btn-primary" aria-disabled={saving || undefined}>{saving ? "Saving…" : "Save recipient"}</button>
            <button type="button" className="l-btn l-btn-secondary" onClick={() => { setForm(null); setEditingId(null); setStatus(null); focusAfterChange(); }} disabled={saving}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <SaveState status={status} />
          <div className="set-actions">
            <button type="button" ref={addButtonRef} className="l-btn l-btn-primary" onClick={() => openForm()}>Add a recipient</button>
          </div>
        </>
      )}

      {deleting && (
        <ConfirmDialog
          title={<>Delete <span className="l-script">{fullName(deleting)}</span>?</>}
          body={<p>They&apos;ll be removed from your saved recipients. Cards you&apos;ve already ordered for them aren&apos;t affected.</p>}
          confirmLabel="Delete"
          busyLabel="Deleting…"
          error={deleteError}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await deleteSavedRecipient(deleting.id);
              if (editingId === deleting.id) { setForm(null); setEditingId(null); }
              setStatus({ tone: "success", text: `${fullName(deleting)} was deleted.` });
              setDeleting(null);
              await load();
              focusAfterChange();
            } catch (error) {
              setDeleteError(errorText(error, "They couldn't be deleted. Please try again."));
            }
          }}
        />
      )}
    </SettingsSection>
  );
}
