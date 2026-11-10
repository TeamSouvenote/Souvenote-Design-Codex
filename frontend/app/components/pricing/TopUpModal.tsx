"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useModalDialog } from "../useModalDialog";
import { brandFontVariables } from "../../lib/brandFonts";
import { rememberPricingReturn } from "../PricingReturn";
import { PricingCardPacks, PricingCreditPacks } from "./PricingClient";
import type { TopUpView } from "./topUp";
import "../../styles/landing.css";
import "../../styles/pricing.css";

// Top up without leaving the page. Two views in one pop-up (owner, 2026-11-05 /
// 2026-11-07):
// - "cards":   the Pricing page's Print and Send + Big Sender boxes, with a
//              "Buy only credits" button that swaps to the credits view;
// - "credits": the Pricing page's three credit packs, with a
//              "Buy a full card + credits" button that swaps to the cards view.
// Opened from the nav (hamburger "Top Up Cards" / "Top Up Credits", Credits box
// menu) and, through openTopUp() in topUp.ts, mid-creation when someone is out
// of credits or cards. Choosing a pack closes this, adds it to the cart and opens
// the cart; with `returnTo`, the cart sends them back there after paying.
//
// Rendered into <body> so the page behind can be made inert. Closes with the x
// button, Escape, or a press that starts and ends on the backdrop. Loaded only
// when first opened (next/dynamic in Navbar.tsx).

type TopUpModalProps = {
  initialView: TopUpView;
  /** Where to come back to after paying (set when opened mid-creation). */
  returnTo?: string;
  onClose: () => void;
};

export default function TopUpModal(props: TopUpModalProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<TopUpDialog {...props} />, document.body);
}

const VIEWS: Record<TopUpView, { heading: string; script: string; switchTo: TopUpView; switchLabel: string }> = {
  cards: { heading: "Top up", script: "cards", switchTo: "credits", switchLabel: "Buy only credits" },
  credits: { heading: "Top up", script: "credits", switchTo: "cards", switchLabel: "Buy a full card + credits" },
};

function TopUpDialog({ initialView, returnTo, onClose }: TopUpModalProps) {
  const dialogRef = useModalDialog(onClose, ".tu-overlay");
  const pressStartedOnScrim = React.useRef(false);
  const pathname = usePathname();
  const [view, setView] = React.useState<TopUpView>(initialView);
  // Phones show one card offer at a time (audit Part B); the switch is hidden from 600px.
  const [offer, setOffer] = React.useState<"single" | "big">("single");
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  const swapped = React.useRef(false);
  const copy = VIEWS[view];

  // After a swap: back to the top, and focus the new heading so screen readers
  // announce it. (On first open, useModalDialog focuses the dialog itself.)
  React.useEffect(() => {
    if (!swapped.current) return;
    dialogRef.current?.closest(".tu-overlay")?.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [view, dialogRef]);

  const onChosen = () => {
    if (returnTo) rememberPricingReturn(returnTo);
    onClose();
  };
  const signupReturn = pathname || "/";

  return (
    <div className={`souv-landing souv-pricing tu-overlay ${brandFontVariables}`}>
      <div
        className="tu-scrim"
        aria-hidden="true"
        onPointerDown={(event) => { pressStartedOnScrim.current = event.target === event.currentTarget; }}
        onPointerUp={(event) => {
          if (pressStartedOnScrim.current && event.target === event.currentTarget) onClose();
          pressStartedOnScrim.current = false;
        }}
      />
      <div
        ref={dialogRef}
        className={`tu-dialog is-${view}`}
        data-offer={view === "cards" ? offer : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tu-title"
        aria-describedby="tu-body"
        tabIndex={-1}
      >
        <button type="button" className="tu-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <header className="pr-head tu-head">
          <h2 id="tu-title" className="l-h2" ref={headingRef} tabIndex={-1}>
            {copy.heading} <span className="l-script">{copy.script}</span>
          </h2>
          {view === "credits" ? (
            <p id="tu-body" className="pr-lede">
              Bring your card to life.
              <br />
              1 credit = 1 action for design generation, image editing, or optional QR-song creation.
            </p>
          ) : (
            <p id="tu-body" className="pr-lede">
              Every card includes postage + <span className="pr-lede-mark">10 AI credits</span>. Buy just one or stock
              up on more to save.
            </p>
          )}
        </header>
        {view === "cards" && (
          <div className="tu-offer-switch" role="group" aria-label="Choose an offer">
            <button type="button" aria-pressed={offer === "single"} onClick={() => setOffer("single")}>Print and Send</button>
            <button type="button" aria-pressed={offer === "big"} onClick={() => setOffer("big")}>Big Sender</button>
          </div>
        )}
        {view === "credits"
          ? <PricingCreditPacks idPrefix="tu" returnTo={signupReturn} onChosen={onChosen} />
          : <PricingCardPacks idPrefix="tu" returnTo={signupReturn} onChosen={onChosen} compactHow />}
        <div className="tu-switch">
          <button
            type="button"
            className="l-btn l-btn-secondary"
            onClick={() => { swapped.current = true; setView(copy.switchTo); }}
          >
            {copy.switchLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
