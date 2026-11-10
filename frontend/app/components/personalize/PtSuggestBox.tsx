"use client";

// "Looking for something else?" A full-width band at the end of the gallery
// (owner, 2026-11-08; it used to sit beside the search and competed with it).
// The customer suggests a template idea and leaves an email, and we tell them
// when it's built. "Can't find it? Suggest a card" by the search, and the
// no-results state, bring the customer here with the idea filled in. Stored in
// mock data only for now; no backend route or emails yet.

import * as React from "react";
import Link from "next/link";
import { submitTemplateSuggestion } from "../../lib/api";
import { Icon } from "../bmc/ui";

const IDEA_MAX = 300;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Props = {
  defaultEmail: string;
  /** Pre-fills the idea (a "no results" search, or a Coming soon template). */
  seed?: { idea: string; key: number } | null;
  searchQuery: string;
  occasionFilter: string | null;
};

export function PtSuggestBox({ defaultEmail, seed, searchQuery, occasionFilter }: Props) {
  const [idea, setIdea] = React.useState("");
  const [email, setEmail] = React.useState(defaultEmail);
  const [submitted, setSubmitted] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const ideaRef = React.useRef<HTMLTextAreaElement>(null);
  const boxRef = React.useRef<HTMLElement>(null);
  const id = "pt-idea";

  React.useEffect(() => { if (defaultEmail) setEmail((current) => current || defaultEmail); }, [defaultEmail]);
  React.useEffect(() => {
    if (!seed) return;
    // Bring in the search words when there are some; never wipe an idea already typed.
    if (seed.idea) setIdea(seed.idea.slice(0, IDEA_MAX));
    setSentTo(null);
    requestAnimationFrame(() => {
      boxRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
      ideaRef.current?.focus({ preventScroll: true });
    });
  }, [seed]);

  const ideaError = submitted && !idea.trim() ? "Tell us your idea." : null;
  const emailError = submitted && !EMAIL_PATTERN.test(email.trim()) ? "Enter an email address like name@example.com." : null;

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    // Send idea stays focusable while sending (aria-disabled, 2.28), so a second press is ignored here.
    if (sending) return;
    setSubmitted(true);
    setError(null);
    if (!idea.trim() || !EMAIL_PATTERN.test(email.trim())) return;
    setSending(true);
    try {
      await submitTemplateSuggestion({ idea: idea.trim(), email: email.trim(), searchQuery: searchQuery.trim() || null, occasionFilter });
      setSentTo(email.trim());
      setIdea("");
      setSubmitted(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your idea couldn’t be sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const heading = (
    <div className="pt-idea-copy">
      <h2 className="pt-row-title" id={`${id}-title`}>Looking for something <span className="l-script">else?</span></h2>
      <p className="pt-idea-lede">Suggest your idea for our team to build, and we’ll let you know when it’s done.</p>
    </div>
  );

  if (sentTo) {
    return (
      <section ref={boxRef} id={id} className="pt-idea is-sent" aria-labelledby={`${id}-title`}>
        {heading}
        <div className="pt-idea-done" role="status">
          <p className="pt-idea-lede"><Icon name="check" size={16} /> <b>Thanks!</b> We’ll email {sentTo} when it’s ready.</p>
          <button type="button" className="bmcq-link" onClick={() => setSentTo(null)}>Suggest another</button>
        </div>
      </section>
    );
  }

  return (
    <section ref={boxRef} id={id} className="pt-idea" aria-labelledby={`${id}-title`}>
      {heading}
        <form id={`${id}-form`} className="pt-idea-form" onSubmit={send} noValidate>
          <div className="pt-idea-fields">
            <label className="pt-idea-field">
              <span className="l-sr-only">Your idea</span>
              <textarea ref={ideaRef} rows={1} value={idea} maxLength={IDEA_MAX} placeholder="Your idea, e.g. a retirement card like a boarding pass"
                aria-invalid={ideaError ? true : undefined} aria-describedby={ideaError ? `${id}-idea-error` : undefined}
                onChange={(event) => setIdea(event.target.value)} className="bmcq-input" />
            </label>
            <label className="pt-idea-field">
              <span className="l-sr-only">Your email</span>
              <input type="email" autoComplete="email" value={email} placeholder="Your email"
                aria-invalid={emailError ? true : undefined} aria-describedby={emailError ? `${id}-email-error` : undefined}
                onChange={(event) => setEmail(event.target.value)} className="bmcq-input" />
            </label>
            <button type="submit" className="bmcq-btn is-primary is-small" aria-disabled={sending || undefined} aria-busy={sending || undefined}>
              {sending ? "Sending…" : "Send idea"}
            </button>
          </div>
          {idea.length > IDEA_MAX - 40 && <p className="bmcq-hint">{idea.length} / {IDEA_MAX} characters</p>}
          {ideaError && <p className="bmcq-error" id={`${id}-idea-error`} role="alert">{ideaError}</p>}
          {emailError && <p className="bmcq-error" id={`${id}-email-error`} role="alert">{emailError}</p>}
          {error && <p className="bmcq-error" role="alert">{error}</p>}
          <p className="pt-idea-privacy">We only use your email to tell you about this idea. <Link href="/legal/privacy-policy">Privacy Policy</Link></p>
        </form>
    </section>
  );
}
