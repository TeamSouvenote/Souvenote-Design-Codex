"use client";

import * as React from "react";
import { FlowDialog } from "../flow/FlowDialog";

// A small "Are you sure?" pop-up on the shared FlowDialog shell (focus kept
// inside, Escape closes, focus returned, page scroll locked). Used for
// deleting a saved card or a saved recipient.
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  busyLabel,
  onConfirm,
  onClose,
  error,
}: {
  title: React.ReactNode;
  body: React.ReactNode;
  confirmLabel: string;
  busyLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  error?: string | null;
}) {
  const id = React.useId();
  const [busy, setBusy] = React.useState(false);
  const busyRef = React.useRef(false);

  async function confirm() {
    // A ref, not just state: a fast second press would otherwise run the action twice (audit B8).
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <FlowDialog onClose={busy ? () => undefined : onClose} labelledBy={`${id}-title`} describedBy={`${id}-body`} className="fd-narrow" tone="berry" role="alertdialog">
      <h2 id={`${id}-title`} className="fd-title">{title}</h2>
      <div id={`${id}-body`} className="fd-lede">{body}</div>
      {error && <p className="cf-err cv-dialog-err" role="alert">{error}</p>}
      <div className="fd-actions">
        <button type="button" className="l-btn l-btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="button" className="l-btn l-btn-primary" onClick={() => void confirm()} aria-disabled={busy || undefined} aria-busy={busy}>
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </FlowDialog>
  );
}
