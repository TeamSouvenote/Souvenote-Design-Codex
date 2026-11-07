"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useModalDialog } from "../useModalDialog";
import { brandFontVariables, handFontVariable } from "../../lib/brandFonts";
import "../../styles/landing.css";
import "../../styles/checkout-flow.css";

// Pop-up shell for the Cart and Delivery screens (checkout, gift offer, blank
// gift, card top-up, "On its way"). Same behaviour as the Print and Send
// pop-up: rendered into <body>, page behind made inert, Tab kept inside,
// Escape closes, page scroll locked, focus returned on close. A press closes it
// only when it starts and ends on the backdrop. A tall pop-up scrolls inside
// the overlay, so nothing is clipped on small screens.

type FlowDialogProps = {
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  /** Extra class on the dialog panel, e.g. "fd-wide". */
  className?: string;
  /** Top stripe colour: terracotta (default), berry, gold (AI/credits) or forest. */
  tone?: "terracotta" | "berry" | "gold" | "forest";
  /** Hides the x button (the "On its way" pop-up never had one). */
  hideClose?: boolean;
  /** Read by tests and the QA screenshot tool, same as the old data-screen-label. */
  screenLabel?: string;
  role?: "dialog" | "alertdialog";
  children: React.ReactNode;
};

export function FlowDialog(props: FlowDialogProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<FlowDialogPanel {...props} />, document.body);
}

function FlowDialogPanel({
  onClose,
  labelledBy,
  describedBy,
  className = "",
  tone = "terracotta",
  hideClose = false,
  screenLabel,
  role = "dialog",
  children,
}: FlowDialogProps) {
  const dialogRef = useModalDialog(onClose, ".fd-overlay");
  const pressStartedOnScrim = React.useRef(false);

  return (
    <div
      className={`souv-landing fd-overlay ${brandFontVariables} ${handFontVariable}`}
      onPointerDown={(event) => { pressStartedOnScrim.current = event.target === event.currentTarget; }}
      onPointerUp={(event) => {
        if (pressStartedOnScrim.current && event.target === event.currentTarget) onClose();
        pressStartedOnScrim.current = false;
      }}
    >
      <div className="fd-scrim" aria-hidden="true" />
      <div
        ref={dialogRef}
        className={`fd-dialog fd-tone-${tone} ${className}`.trim()}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        data-screen-label={screenLabel}
      >
        {!hideClose && (
          <button type="button" className="fd-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
