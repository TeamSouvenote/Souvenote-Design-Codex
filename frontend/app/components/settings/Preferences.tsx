"use client";

import * as React from "react";
import { useAuth } from "../AuthProvider";
import { updateAuthenticatedUser, type UserProfileUpdate } from "../../lib/api";
import { SaveState, SettingsSection, type SaveStatus } from "./shared";
import { COUNTRY_NAMES, CURRENCY_BY_COUNTRY, toCountry } from "../../lib/priceLists";
import { SUPPORT_EMAIL } from "../../lib/support";

// Preferences: currency (read-only: it follows the account's country, owner
// decision 2026-11-08) and language. Language saves as soon as it changes and
// goes back to the saved value if the save fails, with the approved messages
// ("Saving...", "Language saved.", "Language could not be saved."; DEVELOPER_HANDOFF.md).

type PrefField = "language";

function PrefSelect({ field, label, fallback, options, savedText, failedText }: {
  field: PrefField;
  label: string;
  fallback: string;
  options: { value: string; label: string }[];
  savedText: string;
  failedText: string;
}) {
  const auth = useAuth();
  const id = React.useId();
  // While the profile is re-fetched after a save, auth.user is briefly null:
  // keep the last known value rather than flicking back to the default.
  const saved = auth.user?.[field];
  const lastSavedRef = React.useRef(saved || fallback);
  const [value, setValue] = React.useState(saved || fallback);
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<SaveStatus>(null);

  // Remembered in an effect, not during render (audit P6).
  React.useEffect(() => { if (saved) { lastSavedRef.current = saved; setValue(saved); } }, [saved]);

  async function change(next: string) {
    // The select stays enabled while saving (disabling it would drop focus to <body>);
    // a change made mid-save is ignored, and the controlled value stays put.
    if (saving) return;
    setValue(next);
    setSaving(true);
    setStatus({ tone: "info", text: "Saving…" });
    try {
      const update: UserProfileUpdate = { [field]: next };
      await updateAuthenticatedUser(update);
      await auth.refreshUser();
      setStatus({ tone: "success", text: savedText });
    } catch (error) {
      setValue(lastSavedRef.current);
      setStatus({ tone: "error", text: error instanceof Error && error.message ? error.message : failedText });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cf-field">
      <label className="cf-label" htmlFor={id}>{label}</label>
      <select id={id} className="cf-select" value={value} aria-busy={saving || undefined} onChange={(event) => void change(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <SaveState status={status} />
    </div>
  );
}

/** Prices follow the account's country: CAD for Canada, USD for the United States. */
function CurrencyReadOnly() {
  const auth = useAuth();
  const country = toCountry(auth.user?.country) || "CA";
  return (
    <div className="cf-field">
      <label className="cf-label" htmlFor="prefs-currency">Currency</label>
      <input id="prefs-currency" className="cf-input" value={`Prices in ${CURRENCY_BY_COUNTRY[country]} (${COUNTRY_NAMES[country]})`} readOnly aria-describedby="prefs-currency-note" />
      <p className="set-help" id="prefs-currency-note">Set by your country. To change your country, email {SUPPORT_EMAIL}.</p>
    </div>
  );
}

export function Preferences() {
  return (
    <SettingsSection id="preferences" title="Preferences" lede="How prices and Souvenote are shown to you.">
      <div className="set-grid-2">
        <CurrencyReadOnly />
        <PrefSelect
          field="language"
          label="Language"
          fallback="English"
          options={[{ value: "English", label: "English" }, { value: "Francais", label: "Français" }]}
          savedText="Language saved."
          failedText="Language could not be saved."
        />
      </div>
    </SettingsSection>
  );
}
