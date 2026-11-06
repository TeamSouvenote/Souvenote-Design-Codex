"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useModalDialog } from "../useModalDialog";
import { brandFontVariables } from "../../lib/brandFonts";
import { PricingCreditPacks } from "./PricingClient";
import "../../styles/landing.css";
import "../../styles/pricing.css";

// Top up credits without leaving the page (owner, 2026-11-05). Opened from the
// "Top up credits" option in the menu over the nav's Credits/Cards box.
// Shows the same three packs as the Pricing page, with the same buy flow:
// choosing one closes this, adds it to the cart and opens the cart.
// Heading and intro are the Pricing page's approved "Top up credits" copy.
//
// Rendered into <body> so the page behind can be made inert. Closes with the
// x button, Escape, or a press that starts and ends on the backdrop. Loaded
// only when first opened (next/dynamic in Navbar.tsx), so these styles don't
// load on every page.
export default function TopUpCreditsModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<TopUpCreditsDialog onClose={onClose} />, document.body);
}

function TopUpCreditsDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useModalDialog(onClose, ".tu-overlay");
  const pressStartedOnScrim = React.useRef(false);
  const pathname = usePathname();

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
        className="tu-dialog"
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
          <h2 id="tu-title" className="l-h2">
            Top up <span className="l-script">credits</span>
          </h2>
          <p id="tu-body" className="pr-lede">
            Bring your card to life.
            <br />
            1 credit = 1 action for design generation, image editing, or optional QR-song creation.
          </p>
        </header>
        <PricingCreditPacks returnTo={pathname || "/"} onChosen={onClose} />
      </div>
    </div>
  );
}
