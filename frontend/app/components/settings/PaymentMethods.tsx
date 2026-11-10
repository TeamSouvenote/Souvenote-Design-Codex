"use client";

import * as React from "react";
import { FlowField, focusFirstInvalid } from "../flow/FlowField";
import { ConfirmDialog } from "../content/ConfirmDialog";
import {
  createPaymentMethod,
  deletePaymentMethod,
  fetchPaymentMethods,
  updatePaymentMethod,
  type PaymentMethod,
  type SavePaymentMethodRequest,
} from "../../lib/api";
import { SaveState, SettingsSection, errorText, type SaveStatus } from "./shared";

// Payment methods: card summaries only (brand, last four, expiry). Full card
// numbers are handled by Stripe at checkout. Same behaviour as before, on the
// berry & ivory forms; deleting now asks first.

const BRANDS = ["Visa", "Mastercard", "Amex", "Discover", "Other"];

function label(method: PaymentMethod) {
  return `${method.brand} ending in ${method.last4}`;
}

function expiry(method: PaymentMethod) {
  return `${String(method.exp_month).padStart(2, "0")}/${method.exp_year}`;
}

export function PaymentMethods() {
  const thisYear = new Date().getFullYear();
  const [methods, setMethods] = React.useState<PaymentMethod[]>([]);
  const [loadState, setLoadState] = React.useState<"loading" | "ready" | "error">("loading");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [brand, setBrand] = React.useState("Visa");
  const [last4, setLast4] = React.useState("");
  const [last4Error, setLast4Error] = React.useState<string | null>(null);
  const [expMonth, setExpMonth] = React.useState("01");
  const [expYear, setExpYear] = React.useState(String(thisYear + 1));
  const [billingName, setBillingName] = React.useState("");
  const [billingPostalCode, setBillingPostalCode] = React.useState("");
  const [isDefault, setIsDefault] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<SaveStatus>(null);
  const [removing, setRemoving] = React.useState<PaymentMethod | null>(null);
  const [removeError, setRemoveError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setMethods(await fetchPaymentMethods());
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  function resetForm(nextDefault = methods.length === 0) {
    setEditingId(null);
    setBrand("Visa");
    setLast4("");
    setLast4Error(null);
    setExpMonth("01");
    setExpYear(String(thisYear + 1));
    setBillingName("");
    setBillingPostalCode("");
    setIsDefault(nextDefault);
  }

  function edit(method: PaymentMethod) {
    setEditingId(method.id);
    setBrand(method.brand);
    setLast4(method.last4);
    setExpMonth(String(method.exp_month).padStart(2, "0"));
    setExpYear(String(method.exp_year));
    setBillingName(method.billing_name || "");
    setBillingPostalCode(method.billing_postal_code || "");
    setIsDefault(method.is_default);
    setLast4Error(null);
    setStatus(null);
    focusFormHeading();
  }

  const formHeadingRef = React.useRef<HTMLHeadingElement>(null);
  // Edit fills the form below and Cancel disappears once used: move focus to the
  // form's heading, so it's clear what changed and focus never falls to <body>.
  const focusFormHeading = () => window.requestAnimationFrame(() => formHeadingRef.current?.focus());

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!/^\d{4}$/.test(last4)) {
      // Shown on the field and focused, so it's read with it (audit B12 rule).
      setLast4Error("Enter the last four digits of the card.");
      setStatus(null);
      focusFirstInvalid(event.currentTarget);
      return;
    }
    setLast4Error(null);
    const payload: SavePaymentMethodRequest = {
      brand, last4, expMonth: Number(expMonth), expYear: Number(expYear), billingName, billingPostalCode, isDefault,
    };
    setSaving(true);
    setStatus({ tone: "info", text: "Saving…" });
    try {
      if (editingId) await updatePaymentMethod(editingId, payload);
      else await createPaymentMethod(payload);
      setStatus({ tone: "success", text: editingId ? "Payment method updated." : "Payment method saved." });
      await load();
      resetForm(false);
    } catch (error) {
      setStatus({ tone: "error", text: errorText(error, "The payment method couldn't be saved.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsSection id="payments" title="Payment methods" lede="Cards you've saved for faster checkout. Card numbers are kept by our payment partner, Stripe, not by Souvenote.">
      {loadState === "loading" && <p className="set-help">Loading your payment methods…</p>}
      {loadState === "error" && <p className="cf-alert" role="alert">Your payment methods couldn&apos;t be loaded. Reload the page to try again.</p>}
      {loadState === "ready" && (methods.length ? (
        <ul className="set-list">
          {methods.map((method) => (
            <li key={method.id} className="set-list-item">
              <div className="set-list-text">
                <p className="set-list-title">{label(method)}{method.is_default && <span className="set-tag">Default</span>}</p>
                <p className="set-help">Expires {expiry(method)}{method.billing_name ? ` · ${method.billing_name}` : ""}</p>
              </div>
              <div className="set-list-actions">
                <button type="button" className="cf-text-link" onClick={() => edit(method)}>Edit<span className="l-sr-only"> {label(method)}</span></button>
                <button type="button" className="cf-text-link set-danger-link" onClick={() => { setRemoveError(null); setRemoving(method); }}>Remove<span className="l-sr-only"> {label(method)}</span></button>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="set-help">No saved payment methods yet.</p>)}

      <form className="set-form set-sub" onSubmit={save} noValidate aria-busy={saving} aria-labelledby="payments-form-title">
        <h3 id="payments-form-title" ref={formHeadingRef} tabIndex={-1} className="set-sub-title">{editingId ? "Edit payment method" : "Add a payment method"}</h3>
        <div className="set-grid-2">
          <FlowField label="Card type">
            {(control) => (
              <select {...control} className="cf-select" value={brand} onChange={(event) => setBrand(event.target.value)}>
                {BRANDS.map((option) => <option key={option}>{option}</option>)}
              </select>
            )}
          </FlowField>
          <FlowField label="Last four digits" error={last4Error ?? undefined}>
            {(control) => <input {...control} className="cf-input" inputMode="numeric" maxLength={4} placeholder="1234" value={last4} onChange={(event) => { setLast4(event.target.value.replace(/\D/g, "").slice(0, 4)); setLast4Error(null); }} />}
          </FlowField>
        </div>
        <div className="set-grid-2">
          <FlowField label="Expiry month">
            {(control) => (
              <select {...control} className="cf-select" value={expMonth} onChange={(event) => setExpMonth(event.target.value)}>
                {Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")).map((month) => <option key={month}>{month}</option>)}
              </select>
            )}
          </FlowField>
          <FlowField label="Expiry year">
            {(control) => (
              <select {...control} className="cf-select" value={expYear} onChange={(event) => setExpYear(event.target.value)}>
                {Array.from({ length: 12 }, (_, index) => String(thisYear + index)).map((year) => <option key={year}>{year}</option>)}
              </select>
            )}
          </FlowField>
        </div>
        <div className="set-grid-2">
          <FlowField label="Name on card" optional>
            {(control) => <input {...control} className="cf-input" autoComplete="cc-name" value={billingName} onChange={(event) => setBillingName(event.target.value)} />}
          </FlowField>
          <FlowField label="Billing postal or ZIP code" optional>
            {(control) => <input {...control} className="cf-input" autoComplete="postal-code" value={billingPostalCode} onChange={(event) => setBillingPostalCode(event.target.value)} />}
          </FlowField>
        </div>
        <label className="set-check">
          <input type="checkbox" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} />
          <span>Use this card first at checkout</span>
        </label>
        <SaveState status={status} />
        <div className="set-actions">
          <button type="submit" className="l-btn l-btn-primary" aria-disabled={saving || undefined}>{saving ? "Saving…" : editingId ? "Save card" : "Add card"}</button>
          {editingId && <button type="button" className="l-btn l-btn-secondary" onClick={() => { resetForm(false); setStatus(null); focusFormHeading(); }} disabled={saving}>Cancel</button>}
        </div>
      </form>

      {removing && (
        <ConfirmDialog
          title={<>Remove <span className="l-script">this card</span>?</>}
          body={<p>{label(removing)} will be removed from your payment methods. You can add it again at any time.</p>}
          confirmLabel="Remove"
          busyLabel="Removing…"
          error={removeError}
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            try {
              await deletePaymentMethod(removing.id);
              if (editingId === removing.id) resetForm(false);
              setStatus({ tone: "success", text: `${label(removing)} was removed.` });
              setRemoving(null);
              await load();
              // The row (and its Remove button) is gone: focus the form heading, not <body> (audit B11).
              window.requestAnimationFrame(() => formHeadingRef.current?.focus());
            } catch (error) {
              setRemoveError(errorText(error, "It couldn't be removed. Please try again."));
            }
          }}
        />
      )}
    </SettingsSection>
  );
}
