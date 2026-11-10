"use client";

import * as React from "react";
import { BmcIcon } from "./BmcShared";
import { FlowField } from "./flow/FlowField";
import type { SavedRecipient } from "../lib/api";
import { crossBorderPostage, formatMoney, type Country, type Currency } from "../lib/priceLists";

export type DeliveryMode = "single" | "multiple";
export type DeliveryWhen = "now" | "schedule";

export type DeliveryRecipient = {
  title: string;
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  address3: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type DeliveryErrors = Partial<Record<keyof DeliveryRecipient, string>>;

type DeliveryCountry = {
  code: string;
  name: string;
  region: string;
  postal: string;
};

type DlvAddressFieldsProps = {
  value: DeliveryRecipient;
  onChange: (next: DeliveryRecipient) => void;
  errors?: DeliveryErrors;
  compact?: boolean;
  /** Prefix for autocomplete tokens ("shipping" for the recipient, "billing" for the return address). */
  autoCompleteSection?: "shipping" | "billing";
};

type DlvRecipientSectionProps = {
  mode: DeliveryMode;
  setMode: React.Dispatch<React.SetStateAction<DeliveryMode>>;
  recipients: DeliveryRecipient[];
  setRecipients: React.Dispatch<React.SetStateAction<DeliveryRecipient[]>>;
  draft: DeliveryRecipient;
  setDraft: React.Dispatch<React.SetStateAction<DeliveryRecipient>>;
  errors: DeliveryErrors;
  setErrors: React.Dispatch<React.SetStateAction<DeliveryErrors>>;
  editingIdx: number | null;
  setEditingIdx: React.Dispatch<React.SetStateAction<number | null>>;
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  /** The account's address book; empty hides the picker. */
  savedRecipients?: SavedRecipient[];
  /** "Save this recipient": the order's addresses are added to the address book after checkout starts. */
  saveToAccount?: boolean;
  setSaveToAccount?: (value: boolean) => void;
};

type DlvReturnSectionProps = {
  on: boolean;
  setOn: React.Dispatch<React.SetStateAction<boolean>>;
  sender: DeliveryRecipient;
  setSender: React.Dispatch<React.SetStateAction<DeliveryRecipient>>;
  errors?: DeliveryErrors;
};

type DlvScheduleSectionProps = {
  when: DeliveryWhen;
  setWhen: (value: DeliveryWhen) => void;
  date: string;
  setDate: (value: string) => void;
  /** Earliest date allowed (YYYY-MM-DD). */
  minDate: string;
  dateError?: string;
};

type DlvShippingSectionProps = {
  /** The recipient's country. */
  country: string;
  /** The sender's (account's) country and currency. */
  fromCountry: Country;
  currency: Currency;
};

const DLV_TITLES = ["", "Mr", "Ms", "Mrs", "Mx", "Dr"];

const DLV_COUNTRIES: DeliveryCountry[] = [
  { code: "CA", name: "Canada", region: "Province", postal: "Postal code" },
  { code: "US", name: "United States", region: "State", postal: "ZIP code" },
];

function dlvCountry(code: string) {
  return DLV_COUNTRIES.find((country) => country.code === code) || DLV_COUNTRIES[0];
}

const DLV_EMPTY_RECIP: DeliveryRecipient = {
  title: "",
  firstName: "",
  lastName: "",
  company: "",
  address1: "",
  address2: "",
  address3: "",
  city: "",
  state: "",
  postalCode: "",
  country: "CA",
};

const DLV_REQUIRED: (keyof DeliveryRecipient)[] = ["firstName", "lastName", "address1", "city", "state", "postalCode"];

function dlvValidate(recipient: DeliveryRecipient): DeliveryErrors {
  const errs: DeliveryErrors = {};
  DLV_REQUIRED.forEach((key) => {
    if (!String(recipient[key] || "").trim()) errs[key] = "Required";
  });

  const pc = String(recipient.postalCode || "").trim();
  if (pc && !errs.postalCode) {
    const ok = recipient.country === "US"
      ? /^\d{5}(-\d{4})?$/.test(pc)
      : /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(pc);
    if (!ok) errs.postalCode = recipient.country === "US" ? "Enter a valid ZIP code" : "Enter a valid postal code";
  }

  return errs;
}

function dlvSummaryLine(recipient: DeliveryRecipient) {
  const line1 = [recipient.address1, recipient.address2].filter(Boolean).join(", ");
  const line2 = [recipient.city, recipient.state, recipient.postalCode].filter(Boolean).join(" · ");
  return [line1, line2, dlvCountry(recipient.country).name].filter(Boolean).join("  —  ");
}

/** Section card with a numbered heading; `aside` sits on the right of the heading row. */
function DlvSection({ num, title, aside, children, headClassName = "", yours = false }: {
  num: number;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  headClassName?: string;
  /** The sender's own details (addresses): a terracotta edge. */
  yours?: boolean;
}) {
  const headingId = React.useId();
  return (
    <section className={`dv-section${yours ? " is-yours" : ""}`} aria-labelledby={headingId}>
      <div className={`dv-section-head ${headClassName}`.trim()}>
        <h2 id={headingId} className="dv-section-title">
          <span className="dv-section-num" aria-hidden="true">{num}</span> {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Two mutually exclusive choices drawn as pills (pressed = chosen). */
function DlvChoice<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
}) {
  return (
    <div className="dv-chips" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`dv-chip ${value === option.value ? "is-active" : ""}`}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function DlvAddressFields({ value, onChange, errors = {}, compact = false, autoCompleteSection = "shipping" }: DlvAddressFieldsProps) {
  const c = dlvCountry(value.country);
  const set = (key: keyof DeliveryRecipient) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange({ ...value, [key]: event.target.value });
  };
  const err = (key: keyof DeliveryRecipient) => errors[key] ? "is-error" : "";
  const ac = (token: string) => `section-${autoCompleteSection} ${autoCompleteSection} ${token}`;

  return (
    <div className="dv-fields">
      <div className="dv-grid-name">
        <FlowField label="Title" className="dv-f-title">
          {(control) => (
            <select {...control} className="cf-select" value={value.title} onChange={set("title")} autoComplete={ac("honorific-prefix")}>
              {DLV_TITLES.map((title) => <option key={title} value={title}>{title || "—"}</option>)}
            </select>
          )}
        </FlowField>
        <FlowField label="First name" required error={errors.firstName} className="dv-f-first">
          {(control) => <input {...control} className={`cf-input ${err("firstName")}`} data-dlv-field="firstName" value={value.firstName} onChange={set("firstName")} placeholder="Jane" autoComplete={ac("given-name")} />}
        </FlowField>
        <FlowField label="Last name" required error={errors.lastName} className="dv-f-last">
          {(control) => <input {...control} className={`cf-input ${err("lastName")}`} data-dlv-field="lastName" value={value.lastName} onChange={set("lastName")} placeholder="Wilson" autoComplete={ac("family-name")} />}
        </FlowField>
      </div>

      <FlowField label="Company" optional>
        {(control) => <input {...control} className="cf-input" value={value.company} onChange={set("company")} placeholder="Add a company or 'c/o' line" autoComplete={ac("organization")} />}
      </FlowField>

      <FlowField label="Address line 1" required error={errors.address1}>
        {(control) => <input {...control} className={`cf-input ${err("address1")}`} data-dlv-field="address1" value={value.address1} onChange={set("address1")} placeholder="123 Maple Street" autoComplete={ac("address-line1")} />}
      </FlowField>

      {!compact && (
        <div className="dv-grid-2">
          <FlowField label="Address line 2" optional>
            {(control) => <input {...control} className="cf-input" value={value.address2} onChange={set("address2")} placeholder="Apt, suite, unit" autoComplete={ac("address-line2")} />}
          </FlowField>
          <FlowField label="Address line 3" optional>
            {(control) => <input {...control} className="cf-input" value={value.address3} onChange={set("address3")} placeholder="Building, floor" autoComplete={ac("address-line3")} />}
          </FlowField>
        </div>
      )}

      <div className="dv-grid-3">
        <FlowField label="City" required error={errors.city} className="dv-f-city">
          {(control) => <input {...control} className={`cf-input ${err("city")}`} data-dlv-field="city" value={value.city} onChange={set("city")} placeholder="Vancouver" autoComplete={ac("address-level2")} />}
        </FlowField>
        <FlowField label={c.region} required error={errors.state}>
          {(control) => <input {...control} className={`cf-input ${err("state")}`} data-dlv-field="state" value={value.state} onChange={set("state")} placeholder={c.region} autoComplete={ac("address-level1")} />}
        </FlowField>
        <FlowField label={c.postal} required error={errors.postalCode}>
          {(control) => <input {...control} className={`cf-input ${err("postalCode")}`} data-dlv-field="postalCode" value={value.postalCode} onChange={set("postalCode")} placeholder={c.postal} autoComplete={ac("postal-code")} />}
        </FlowField>
      </div>

      <FlowField label="Country" required>
        {(control) => (
          <select {...control} className="cf-select" value={value.country} onChange={set("country")} autoComplete={ac("country")}>
            {DLV_COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
          </select>
        )}
      </FlowField>
    </div>
  );
}

function DlvRecipientSection({
  mode,
  setMode,
  recipients,
  setRecipients,
  draft,
  setDraft,
  errors,
  setErrors,
  editingIdx,
  setEditingIdx,
  quantity,
  setQuantity,
  savedRecipients = [],
  saveToAccount,
  setSaveToAccount,
}: DlvRecipientSectionProps) {
  const qtyId = React.useId();
  const savedId = React.useId();
  const [pickedId, setPickedId] = React.useState("");

  // Choosing a saved recipient copies their address into this order. Editing
  // the order's copy afterwards never changes the saved entry.
  function pickSaved(id: string) {
    setPickedId(id);
    const saved = savedRecipients.find((recipient) => recipient.id === id);
    if (!saved) return;
    const { title, firstName, lastName, company, address1, address2, address3, city, state, postalCode, country } = saved;
    setDraft({ title, firstName, lastName, company, address1, address2, address3, city, state, postalCode, country });
    setErrors({});
  }

  function commitDraft() {
    const nextErrors = dlvValidate(draft);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    if (editingIdx === null) setRecipients([...recipients, draft]);
    else setRecipients(recipients.map((recipient, index) => index === editingIdx ? draft : recipient));
    setDraft({ ...DLV_EMPTY_RECIP, country: draft.country });
    setEditingIdx(null);
    setErrors({});
  }

  function editRecip(index: number) {
    setDraft(recipients[index]);
    setEditingIdx(index);
    setErrors({});
  }

  function removeRecip(index: number) {
    setRecipients(recipients.filter((_, recipientIndex) => recipientIndex !== index));
    if (editingIdx === index) {
      setDraft({ ...DLV_EMPTY_RECIP, country: draft.country });
      setEditingIdx(null);
    }
  }

  return (
    <DlvSection
      num={1}
      title="Who's it going to?"
      yours
      aside={(
        <DlvChoice<DeliveryMode>
          label="Number of recipients"
          value={mode}
          onChange={setMode}
          options={[{ value: "single", label: "One recipient" }, { value: "multiple", label: "Multiple" }]}
        />
      )}
    >
      {mode === "multiple" && recipients.length > 0 && (
        <ol className="dv-recip-list">
          {recipients.map((recipient, index) => {
            const name = [recipient.title, recipient.firstName, recipient.lastName].filter(Boolean).join(" ");
            return (
              <li key={index} className={`dv-recip-item ${editingIdx === index ? "is-editing" : ""}`}>
                <span className="dv-recip-badge" aria-hidden="true">{index + 1}</span>
                <div className="dv-recip-text">
                  <p className="dv-recip-name">{name}</p>
                  <p className="dv-recip-addr">{dlvSummaryLine(recipient)}</p>
                </div>
                <div className="dv-recip-acts">
                  <button type="button" className="dv-icon-btn" onClick={() => editRecip(index)} aria-label={`Edit ${name || `recipient ${index + 1}`}`}><BmcIcon name="edit" w={16} /></button>
                  <button type="button" className="dv-icon-btn" onClick={() => removeRecip(index)} aria-label={`Remove ${name || `recipient ${index + 1}`}`}><BmcIcon name="close" w={16} /></button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {mode === "multiple" && (
        <p className="dv-subhead">
          {editingIdx === null ? `Add recipient ${recipients.length + 1}` : `Editing recipient ${editingIdx + 1}`}
        </p>
      )}

      {savedRecipients.length > 0 && (
        <div className="cf-field dv-saved-pick">
          <label className="cf-label" htmlFor={savedId}>Choose a saved recipient</label>
          <select id={savedId} className="cf-select" value={pickedId} onChange={(event) => pickSaved(event.target.value)}>
            <option value="">Type a new address below</option>
            {savedRecipients.map((recipient) => (
              <option key={recipient.id} value={recipient.id}>
                {[recipient.firstName, recipient.lastName].filter(Boolean).join(" ")} · {recipient.city}
              </option>
            ))}
          </select>
        </div>
      )}

      <DlvAddressFields value={draft} onChange={(next) => { setDraft(next); if (pickedId) setPickedId(""); }} errors={errors} />

      {setSaveToAccount && (
        <label className="dv-save-check">
          <input type="checkbox" checked={Boolean(saveToAccount)} onChange={(event) => setSaveToAccount(event.target.checked)} />
          <span>Save {mode === "multiple" ? "these recipients" : "this recipient"} to my account for next time</span>
        </label>
      )}

      {mode === "single" ? (
        <div className="dv-qty">
          <div className="dv-qty-copy">
            <label className="dv-qty-title" htmlFor={qtyId}>How many cards to this address?</label>
            <p className="dv-qty-sub" id={`${qtyId}-sub`}>Send more than one copy of this card to the same recipient.</p>
          </div>
          <div className="dv-qty-input-wrap">
            <input
              id={qtyId}
              type="number"
              min="1"
              max="99"
              inputMode="numeric"
              className="cf-input dv-qty-input"
              aria-label="Number of cards"
              aria-describedby={`${qtyId}-sub`}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Math.min(99, Number(event.target.value) || 1)))}
            />
            <span className="dv-qty-unit" aria-hidden="true">{quantity === 1 ? "card" : "cards"}</span>
          </div>
        </div>
      ) : (
        <button type="button" className="l-btn l-btn-secondary dv-add-recip" onClick={commitDraft}>
          <BmcIcon name={editingIdx === null ? "plus" : "check"} w={16} />
          {editingIdx === null ? "Add this address" : "Save changes"}
        </button>
      )}
    </DlvSection>
  );
}

function DlvReturnSection({ on, setOn, sender, setSender, errors = {} }: DlvReturnSectionProps) {
  const headingId = React.useId();
  const bodyId = React.useId();

  return (
    <section className="dv-section is-yours" aria-labelledby={headingId}>
      {/* The whole heading row toggles, as before. The switch button covers the
          row so the heading stays a real heading for screen readers. */}
      <div className="dv-section-head dv-toggle-head">
        <h2 id={headingId} className="dv-section-title">
          <span className="dv-section-num" aria-hidden="true">2</span> Return address
        </h2>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby={headingId}
          aria-controls={bodyId}
          className="dv-switch-btn"
          onClick={() => setOn(!on)}
        >
          <span className={`dv-switch ${on ? "is-on" : ""}`} aria-hidden="true" />
        </button>
      </div>
      <div id={bodyId} data-dlv-return="">
        {on ? (
          <>
            <p className="dv-help">
              Printed on the envelope flap so it can come home if it can&apos;t be delivered.
            </p>
            <DlvAddressFields value={sender} onChange={setSender} errors={errors} compact autoCompleteSection="billing" />
          </>
        ) : (
          <p className="dv-help is-flush">
            {"No return address — the envelope ships clean. Toggle on to add yours."}
          </p>
        )}
      </div>
    </section>
  );
}

function DlvScheduleSection({ when, setWhen, date, setDate, minDate, dateError }: DlvScheduleSectionProps) {
  return (
    <DlvSection
      num={3}
      title="When should it mail?"
      aside={(
        <DlvChoice<DeliveryWhen>
          label="Mailing time"
          value={when}
          onChange={setWhen}
          options={[{ value: "now", label: "Send now" }, { value: "schedule", label: "Schedule" }]}
        />
      )}
    >
      {when === "schedule" ? (
        <div className="dv-schedule">
          <FlowField label="Mail-out date" required error={dateError} className="dv-date-field">
            {(control) => <input {...control} type="date" className="cf-input" data-dlv-field="mailDate" min={minDate} value={date} onChange={(event) => setDate(event.target.value)} />}
          </FlowField>
          <p className="dv-note">
            <BmcIcon name="message" w={16} />
            <span>We hand-write and post your card on this date, timed to land right on the occasion, not before.</span>
          </p>
        </div>
      ) : (
        <p className="dv-note">
          <BmcIcon name="sparkle" w={16} />
          <span>{"We send your card to print as soon as you check out, and email you an order confirmation."}</span>
        </p>
      )}
    </DlvSection>
  );
}

// One speed today, so a plain line instead of a one-option radio list (owner,
// 2026-11-06). No delivery-time promise until the print partner confirms
// estimates (owner, 2026-11-08). Cards going across the border (Canada <-> US)
// show the cross-border postage line when it's more than $0; it's $0 until
// Scribeless confirms its rates, so today the line stays hidden.
function DlvShippingSection({ country, fromCountry, currency }: DlvShippingSectionProps) {
  const destination = dlvCountry(country);
  const crossBorder = destination.code !== fromCountry;
  const postage = crossBorderPostage(currency, fromCountry, destination.code);

  return (
    <DlvSection num={4} title="Postage">
      <p className="dv-ship-plain">
        <span className="dv-ship-name">Standard postage to {destination.name}, included</span>
        <span className="dv-ship-sub">Mailed by our print partner. We&apos;ll show an estimated delivery date here when one is available.</span>
      </p>
      {crossBorder && postage > 0 && (
        <p className="dv-ship-plain dv-ship-cross">
          <span className="dv-ship-name">Cross-border postage: {formatMoney(postage, currency)}</span>
          <span className="dv-ship-sub">Added at checkout, before you pay.</span>
        </p>
      )}
    </DlvSection>
  );
}

export {
  DLV_TITLES,
  DLV_COUNTRIES,
  DLV_EMPTY_RECIP,
  DLV_REQUIRED,
  dlvCountry,
  dlvValidate,
  dlvSummaryLine,
  DlvAddressFields,
  DlvRecipientSection,
  DlvReturnSection,
  DlvScheduleSection,
  DlvShippingSection,
};
