"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "../AuthProvider";
import { FlowField, focusFirstInvalid } from "../flow/FlowField";
import { submitContactMessage, type ContactTopic } from "../../lib/api";
import { SUPPORT_REPLY_LINE } from "../../lib/support";

// Contact form (/contact). Stores the message through submitContactMessage
// (mock database today; POST /support/messages for the backend) and shows a
// reference number. No email provider, no marketing opt-in, no reply-time promise.

const TOPICS: { value: ContactTopic; label: string }[] = [
  { value: "card-or-order", label: "A card or an order" },
  { value: "song", label: "A song or QR code" },
  { value: "account", label: "My account" },
  { value: "refund-or-reprint", label: "A refund, cancellation or reprint" },
  { value: "something-else", label: "Something else" },
];

const MESSAGE_LIMIT = 2000;
const NEEDS_ORDER_REFERENCE: ContactTopic[] = ["card-or-order", "refund-or-reprint"];

type Errors = Partial<Record<"name" | "email" | "message", string>>;

export function ContactForm() {
  const auth = useAuth();
  const profileName = [auth.user?.first_name, auth.user?.last_name].filter(Boolean).join(" ");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [topic, setTopic] = React.useState<ContactTopic>("card-or-order");
  const [orderReference, setOrderReference] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [errors, setErrors] = React.useState<Errors>({});
  const [sending, setSending] = React.useState(false);
  const sendingRef = React.useRef(false);
  const [failure, setFailure] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState<{ reference: string; name: string } | null>(null);
  const doneRef = React.useRef<HTMLHeadingElement>(null);
  const formTitleRef = React.useRef<HTMLHeadingElement>(null);

  // Signed in: start with the account's name and email (both stay editable).
  React.useEffect(() => {
    if (auth.user?.email) setEmail((current) => current || auth.user?.email || "");
    if (profileName) setName((current) => current || profileName);
  }, [auth.user?.email, profileName]);

  React.useEffect(() => { if (sent) doneRef.current?.focus(); }, [sent]);

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};
    if (!name.trim()) next.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email address";
    if (!message.trim()) next.message = "Write your message";
    else if (message.length > MESSAGE_LIMIT) next.message = `Keep it under ${MESSAGE_LIMIT} characters`;
    setErrors(next);
    setFailure(null);
    if (Object.keys(next).length) { focusFirstInvalid(event.currentTarget); return; }
    // A ref, not just state: a fast second press arrives before the re-render disables the button (audit B8).
    if (sendingRef.current) return;
    sendingRef.current = true;

    setSending(true);
    try {
      const result = await submitContactMessage({
        name, email, topic, message,
        orderReference: NEEDS_ORDER_REFERENCE.includes(topic) ? orderReference : undefined,
      });
      setSent({ reference: result.reference, name: name.trim().split(/\s+/)[0] });
    } catch (error) {
      setFailure(error instanceof Error && error.message ? error.message : "Your message couldn't be sent. Please try again.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  if (sent) {
    return (
      <section className="ct2-form ct2-done" aria-labelledby="contact-done-title">
        <h2 id="contact-done-title" ref={doneRef} tabIndex={-1} className="ct2-form-title">Thanks, {sent.name}. Your message is <span className="l-script">on its way</span>.</h2>
        <p>Your reference is <strong>{sent.reference}</strong>. {SUPPORT_REPLY_LINE}</p>
        <div className="ct2-actions">
          <button type="button" className="l-btn l-btn-secondary" onClick={() => { setSent(null); setMessage(""); setOrderReference(""); window.requestAnimationFrame(() => formTitleRef.current?.focus()); }}>Send another message</button>
          <Link className="l-btn l-btn-primary" href="/faq">Read the FAQ</Link>
        </div>
      </section>
    );
  }

  const remaining = MESSAGE_LIMIT - message.length;

  return (
    <form className="ct2-form" onSubmit={send} noValidate aria-busy={sending} aria-labelledby="contact-form-title">
      <h2 id="contact-form-title" ref={formTitleRef} tabIndex={-1} className="ct2-form-title">Send us a message</h2>
      <p className="ct2-form-sub">{SUPPORT_REPLY_LINE}</p>
      <div className="ct2-grid-2">
        <FlowField label="Your name" required error={errors.name}>
          {(control) => <input {...control} className={`cf-input ${errors.name ? "is-error" : ""}`} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />}
        </FlowField>
        <FlowField label="Email" required error={errors.email}>
          {(control) => <input {...control} className={`cf-input ${errors.email ? "is-error" : ""}`} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />}
        </FlowField>
      </div>
      <FlowField label="What's it about?">
        {(control) => (
          <select {...control} className="cf-select" value={topic} onChange={(event) => setTopic(event.target.value as ContactTopic)}>
            {TOPICS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        )}
      </FlowField>
      {NEEDS_ORDER_REFERENCE.includes(topic) && (
        <FlowField label="Order reference" optional>
          {(control) => <input {...control} className="cf-input" value={orderReference} onChange={(event) => setOrderReference(event.target.value)} placeholder="From your confirmation email" aria-describedby="contact-order-help" />}
        </FlowField>
      )}
      {NEEDS_ORDER_REFERENCE.includes(topic) && <p className="ct2-help" id="contact-order-help">It&apos;s in your order confirmation email and helps us find your card quickly.</p>}
      <FlowField label="Message" required error={errors.message}>
        {(control) => (
          <textarea {...control} className={`cf-input ct2-textarea ${errors.message ? "is-error" : ""}`} rows={6} value={message} onChange={(event) => setMessage(event.target.value)} aria-describedby={`${control["aria-describedby"] ? `${control["aria-describedby"]} ` : ""}contact-count`} />
        )}
      </FlowField>
      <p className={`ct2-help ${remaining < 0 ? "is-over" : ""}`} id="contact-count" aria-live="polite">
        {remaining >= 0 ? `${remaining} characters left` : `${-remaining} characters over the limit`}
      </p>
      {failure && <p className="cf-alert" role="alert">{failure}</p>}
      <p className="ct2-privacy">We use your details only to answer this message. See our <Link href="/legal/privacy-policy">Privacy Policy</Link>.</p>
      <div className="ct2-actions">
        <button type="submit" className="l-btn l-btn-primary" aria-disabled={sending || undefined}>{sending ? "Sending…" : "Send message"}</button>
      </div>
    </form>
  );
}
