"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { COMMUNITY_CARDS_HREF } from "../landing/content";
import { useModalDialog } from "../useModalDialog";
import { brandFontVariables } from "../../lib/brandFonts";
import "../../styles/landing.css";
import "../../styles/pricing.css";

// Opens over the cart's "Payment confirmed" screen right after a Print and Send
// purchase (owner decision 2026-11-04) and explains how to use the card that
// was just added to the card bank. Copy approved 2026-11-04.
//
// Rendered into <body> so everything else on the page can be made inert while
// it is open. Closes with the x button, Escape, or a press that starts and ends
// on the backdrop (same as the Welcome modal).
export function PrintSendReadyModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<PrintSendReadyDialog onClose={onClose} />, document.body);
}

function PrintSendReadyDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useModalDialog(onClose, ".pr-ready-overlay");
  const pressStartedOnScrim = React.useRef(false);

  return (
    <div className={`souv-landing pr-ready-overlay ${brandFontVariables}`}>
      <div
        className="pr-ready-scrim"
        aria-hidden="true"
        onPointerDown={(event) => { pressStartedOnScrim.current = event.target === event.currentTarget; }}
        onPointerUp={(event) => {
          if (pressStartedOnScrim.current && event.target === event.currentTarget) onClose();
          pressStartedOnScrim.current = false;
        }}
      />
      <div
        ref={dialogRef}
        className="pr-ready"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pr-ready-title"
        aria-describedby="pr-ready-body"
        tabIndex={-1}
      >
        <button type="button" className="pr-ready-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <h2 id="pr-ready-title" className="pr-ready-title">
          Your card is <span className="l-script">ready to send</span>
        </h2>
        <p id="pr-ready-body" className="pr-ready-body">
          You have 1 card to send in your card bank. Pick a card from Saved Cards &amp; Songs or Community Cards,
          add your message and the mailing address, and we&apos;ll print it and ship it for you.
        </p>
        <div className="pr-ready-actions">
          <Link className="l-btn l-btn-primary" href="/create/my-cards-and-songs">Saved Cards &amp; Songs</Link>
          <Link className="l-btn l-btn-secondary" href={COMMUNITY_CARDS_HREF}>Community Cards</Link>
        </div>
      </div>
    </div>
  );
}
