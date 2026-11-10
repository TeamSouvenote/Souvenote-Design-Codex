"use client";

import * as React from "react";
import { ContentPageHead } from "./content/ContentPageShell";
import { PersonalInfo } from "./settings/PersonalInfo";
import { SignInSecurity } from "./settings/SignInSecurity";
import { PaymentMethods } from "./settings/PaymentMethods";
import { SavedRecipients } from "./settings/SavedRecipients";
import { Preferences } from "./settings/Preferences";
import { DeleteAccount } from "./settings/DeleteAccount";

// Account Settings (/account/settings) on the berry & ivory system.
// The sections are plain links to #anchors (not ARIA tabs): each one has its
// own address that can be shared or bookmarked (e.g. Profile links to
// #recipients), the browser's Back button works, and the links read as
// ordinary navigation. Desktop: the list on the left, the open section on the
// right. Phones and tablets: the list first; a section opens on its own with an
// "All settings" link back.

const SECTIONS = [
  { id: "personal", label: "Personal info", Component: PersonalInfo },
  { id: "security", label: "Password & sign-in", Component: SignInSecurity },
  { id: "payments", label: "Payment methods", Component: PaymentMethods },
  { id: "recipients", label: "Saved recipients", Component: SavedRecipients },
  { id: "preferences", label: "Preferences", Component: Preferences },
  { id: "delete", label: "Delete your account", Component: DeleteAccount },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function sectionFromHash(): SectionId | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  return SECTIONS.some((section) => section.id === hash) ? hash as SectionId : null;
}

function SettingsPage() {
  const [active, setActive] = React.useState<SectionId | null>(null);
  const shown = active || "personal";
  const Section = SECTIONS.find((section) => section.id === shown)!.Component;

  React.useEffect(() => {
    const sync = (focus: boolean) => {
      const next = sectionFromHash();
      setActive(next);
      if (focus && next) window.requestAnimationFrame(() => document.getElementById(`${next}-title`)?.focus());
    };
    sync(false);
    const onHash = () => sync(true);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function showAll(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    window.history.pushState(null, "", window.location.pathname);
    setActive(null);
    window.requestAnimationFrame(() => document.querySelector<HTMLAnchorElement>(".set-nav a")?.focus());
  }

  return (
    <div className="cf-wrap acc2-wrap set-wrap" data-screen-label="Account Settings">
      <ContentPageHead
        title={<>Account <span className="l-script">settings</span></>}
        lede="Your details, sign-in, payment methods and saved recipients."
      />
      <div className={`set-layout ${active ? "has-open" : ""}`}>
        <nav className="set-nav" aria-label="Account settings">
          <ul>
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={`set-nav-link ${section.id === "delete" ? "is-delete" : ""}`}
                  aria-current={section.id === shown ? "location" : undefined}
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="set-panel">
          <a className="set-back cf-text-link" href="#all-settings" onClick={showAll}>All settings</a>
          <Section />
        </div>
      </div>
    </div>
  );
}

export { SettingsPage };
