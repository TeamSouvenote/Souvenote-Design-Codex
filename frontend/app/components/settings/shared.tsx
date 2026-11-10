"use client";

import * as React from "react";

// Small pieces shared by the Account Settings sections.

export type SaveStatus = { tone: "info" | "success" | "error"; text: string } | null;

/** Polite live message under a form: "Saving…", "Saved.", or an error (announced assertively). */
export function SaveState({ status }: { status: SaveStatus }) {
  return (
    <div className="set-status" role={status?.tone === "error" ? "alert" : "status"}>
      {status && <p className={`set-status-text is-${status.tone}`}>{status.text}</p>}
    </div>
  );
}

/** Section card with its h2; `id` is the #anchor the settings nav links to. */
export function SettingsSection({ id, title, lede, children }: { id: string; title: string; lede?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="set-section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="set-section-title" tabIndex={-1}>{title}</h2>
      {lede && <p className="set-section-lede">{lede}</p>}
      {children}
    </section>
  );
}

export function errorText(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
