"use client";

import Link from "next/link";
import { FlowDialog } from "./flow/FlowDialog";

// "Log in before checkout" (Cart). Since 2026-11-08 (audit B10) it uses the
// shared FlowDialog shell, like every other dialog: labelled and described,
// Tab kept inside, Escape and the 44px close button close it, focus returns
// to the button that opened it, and the page behind is inert. Forest stripe,
// as Build My Card's sign-up dialog. The old .auth-gate-* styles in site.css
// are no longer used.

type AuthGatePromptProps = {
  open: boolean;
  /** Title lead words; `script` is the one Lobster Two phrase at the end. */
  title: string;
  script: string;
  body: string;
  returnTo?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onClose: () => void;
};

function authHref(path: "/login" | "/signup", returnTo = "/create") {
  return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
}

export function AuthGatePrompt({
  open,
  title,
  script,
  body,
  returnTo = "/create",
  primaryLabel = "Sign up",
  secondaryLabel = "Log in",
  onClose,
}: AuthGatePromptProps) {
  if (!open) return null;

  return (
    <FlowDialog onClose={onClose} labelledBy="auth-gate-title" describedBy="auth-gate-body" tone="forest" className="fd-narrow" screenLabel="Modal · Account required">
      <h2 id="auth-gate-title" className="fd-title">{title} <span className="l-script">{script}</span></h2>
      <p id="auth-gate-body" className="fd-lede">{body}</p>
      <div className="fd-actions">
        <Link className="l-btn l-btn-secondary" href={authHref("/login", returnTo)}>{secondaryLabel}</Link>
        <Link className="l-btn l-btn-primary" href={authHref("/signup", returnTo)}>{primaryLabel}</Link>
      </div>
      <p className="fd-note"><Link className="cf-text-link" href="/pricing">View card and credit pricing</Link></p>
    </FlowDialog>
  );
}
