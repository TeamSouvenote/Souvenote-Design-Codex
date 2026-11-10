"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { CREATE_OPTIONS } from "../createOptions";
import type { CreateOptionKey } from "../createOptions";
import { useModalDialog } from "../useModalDialog";
import { brandFontVariables } from "../../lib/brandFonts";
import "../../styles/landing.css";
import "../../styles/pricing.css";

// Opens over the cart's "Payment confirmed" screen right after paying for Print
// and Send (owner decision 2026-11-04), and since 2026-11-07 also after Big Sender
// and credit top-ups (CartPage.tsx handlePaid), pointing to where to use them. Copy approved 2026-11-04; title and body
// changed by the owner 2026-11-06. Since 2026-11-08 (owner) the four options are design-system option cards
// (ivory, hairline edge, berry hover) with a one-line explanation each (`short` in createOptions.ts) and a
// small decorative dot, instead of buttons filled gold, berry, forest and espresso.
//
// Rendered into <body> so everything else on the page can be made inert while
// it is open. Closes with the x button, Escape, or a press that starts and ends
// on the backdrop (same as the Welcome modal).
// Same order, names and links as the Create Options page.
const READY_OPTIONS: CreateOptionKey[] = ["template", "build", "community", "saved"];

/** "credits": only credits were bought. "cards": Print and Send or a card pack (with or without credits). */
export type PurchaseReadyKind = "cards" | "credits";

type PurchaseReadyProps = { kind?: PurchaseReadyKind; onClose: () => void };

export function PrintSendReadyModal({ kind = "cards", onClose }: PurchaseReadyProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<PrintSendReadyDialog kind={kind} onClose={onClose} />, document.body);
}

function PrintSendReadyDialog({ kind = "cards", onClose }: PurchaseReadyProps) {
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
          {/* Owner, 2026-11-07: credits only -> "Your credits are waiting"; Print and Send or a card pack -> "Your cards are waiting". */}
          {kind === "credits" ? "Your credits are" : "Your cards are"} <span className="l-script">waiting</span>
        </h2>
        <p id="pr-ready-body" className="pr-ready-body">
          Choose one of the following options to create a new card or send a saved one.
        </p>
        <div className="pr-ready-options">
          {READY_OPTIONS.map((key) => {
            const option = CREATE_OPTIONS[key];
            return (
              <Link key={key} className={`pr-ready-opt is-${key}`} href={option.href}>
                <span className="pr-ready-opt-head">
                  <i className="pr-ready-dot" aria-hidden="true" />
                  <b className="pr-ready-opt-title">{option.title}</b>
                  <svg className="pr-ready-opt-go" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
                <span className="pr-ready-opt-sub">{option.short}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
