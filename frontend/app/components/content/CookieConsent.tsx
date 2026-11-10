"use client";

import * as React from "react";
import Link from "next/link";
import { brandFontVariables } from "../../lib/brandFonts";
import {
  OPEN_COOKIE_SETTINGS_EVENT,
  openCookieSettings,
  readCookieConsent,
  writeCookieConsent,
  type CookieChoice,
} from "../../lib/consent";
// landing.css gives the banner its palette roles (--l-*) and .l-btn sizing. Every
// rule in it is scoped under .souv-landing, so loading it on pages that don't
// use it (the sign-in screens) changes nothing else there (audit B3, 2026-11-08).
import "../../styles/landing.css";
import "../../styles/cookie-consent.css";

// Cookie banner (every page, from the root layout). First visit, or a new
// Cookie Policy version: a small card at the bottom with Decline and Accept at
// equal weight and nothing pre-chosen. It doesn't block the page. The footer's
// "Cookie settings" reopens it. Analytics stays off until Accept (lib/analytics.ts).

export function CookieConsent() {
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState<CookieChoice | null>(null);
  const [reopened, setReopened] = React.useState(false);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const bannerRef = React.useRef<HTMLElement>(null);
  /** Where focus was when the footer link reopened the banner. */
  const openerRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const saved = readCookieConsent();
    setCurrent(saved?.choice ?? null);
    if (!saved) setOpen(true);
    const reopen = (event: Event) => {
      // The button that opened it, else whatever had focus, but never <body>.
      const passed = event instanceof CustomEvent && event.detail instanceof HTMLElement ? event.detail : null;
      const active = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
      openerRef.current = passed ?? active;
      setCurrent(readCookieConsent()?.choice ?? null);
      setReopened(true);
      setOpen(true);
      window.requestAnimationFrame(() => headingRef.current?.focus());
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  if (!open) return null;

  function choose(choice: CookieChoice) {
    writeCookieConsent(choice);
    setCurrent(choice);
    // The banner (and the pressed button) is about to go: don't leave focus on
    // <body> (audit B11). Back to "Cookie settings" if that opened it, else the page's heading.
    const hadFocus = Boolean(bannerRef.current?.contains(document.activeElement));
    setOpen(false);
    if (!hadFocus) return;
    window.requestAnimationFrame(() => {
      const opener = openerRef.current;
      if (opener?.isConnected) { opener.focus(); return; }
      const heading = document.querySelector<HTMLElement>("main h1");
      if (heading) {
        if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      }
    });
  }

  return (
    <section ref={bannerRef} className={`souv-landing cc-banner ${brandFontVariables}`} aria-labelledby="cc-title" aria-describedby="cc-body">
      <h2 id="cc-title" ref={headingRef} tabIndex={-1} className="cc-title">Cookies on Souvenote</h2>
      <p id="cc-body" className="cc-body">
        We use essential storage to keep you signed in and remember your cart. With your OK, we&apos;d also use analytics cookies to see how the site is used. We never record your cards, messages or photos.{" "}
        <Link href="/legal/cookie-policy">Cookie Policy</Link>
      </p>
      {reopened && current && <p className="cc-current">Your current choice: {current === "accepted" ? "analytics allowed" : "analytics declined"}.</p>}
      <div className="cc-actions">
        <button type="button" className="l-btn cc-btn" onClick={() => choose("declined")} aria-pressed={reopened ? current === "declined" : undefined}>Decline</button>
        <button type="button" className="l-btn cc-btn" onClick={() => choose("accepted")} aria-pressed={reopened ? current === "accepted" : undefined}>Accept</button>
      </div>
    </section>
  );
}

/** Footer link that reopens the banner. */
export function CookieSettingsButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" className={`cc-settings-link ${className}`.trim()} onClick={(event) => openCookieSettings(event.currentTarget)}>
      Cookie settings
    </button>
  );
}
