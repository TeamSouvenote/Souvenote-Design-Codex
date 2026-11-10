"use client";

import * as React from "react";
import { useAuth } from "../AuthProvider";
import { FlowField } from "../flow/FlowField";
import { updateAuthenticatedUser } from "../../lib/api";
import { SaveState, SettingsSection, errorText, type SaveStatus } from "./shared";
import { COUNTRY_NAMES, CURRENCY_BY_COUNTRY, toCountry } from "../../lib/priceLists";
import { SUPPORT_EMAIL } from "../../lib/support";

// Personal info: name, phone, birthday and country on the Souvenote profile
// (PATCH /auth/me). The login email is the Cognito username, so it's read-only.
// No email preferences: MVP only sends purchase and order confirmations.
export function PersonalInfo() {
  const auth = useAuth();
  const profile = auth.user;
  const [firstName, setFirstName] = React.useState(profile?.first_name || "");
  const [lastName, setLastName] = React.useState(profile?.last_name || "");
  const [phone, setPhone] = React.useState(profile?.phone || "");
  const [birthday, setBirthday] = React.useState(profile?.birthday?.slice(0, 10) || "");
  const [status, setStatus] = React.useState<SaveStatus>(null);
  const [saving, setSaving] = React.useState(false);
  const accountCountry = toCountry(profile?.country) || "CA";

  React.useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name || "");
    setLastName(profile.last_name || "");
    setPhone(profile.phone || "");
    setBirthday(profile.birthday?.slice(0, 10) || "");
  }, [profile]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The button stays focusable while saving (aria-disabled), so ignore a second press.
    if (saving) return;
    setSaving(true);
    setStatus({ tone: "info", text: "Saving…" });
    try {
      await updateAuthenticatedUser({ firstName, lastName, phone, birthday });
      await auth.refreshUser();
      setStatus({ tone: "success", text: "Your details are saved." });
    } catch (error) {
      setStatus({ tone: "error", text: errorText(error, "Your details couldn't be saved. Please try again.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsSection id="personal" title="Personal info" lede="How your account, receipts and cards are personalized.">
      <form className="set-form" onSubmit={save} noValidate aria-busy={saving}>
        <div className="set-grid-2">
          <FlowField label="First name">
            {(control) => <input {...control} className="cf-input" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" />}
          </FlowField>
          <FlowField label="Last name">
            {(control) => <input {...control} className="cf-input" value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" />}
          </FlowField>
        </div>
        <FlowField label="Login email">
          {(control) => <input {...control} className="cf-input" value={profile?.email || ""} readOnly aria-describedby="personal-email-note" />}
        </FlowField>
        <p className="set-help" id="personal-email-note">We email your purchase and order confirmations to this address.</p>
        <div className="set-grid-2">
          <FlowField label="Phone" optional>
            {(control) => <input {...control} className="cf-input" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" placeholder="(555) 012-3456" />}
          </FlowField>
          <FlowField label="Birthday" optional>
            {(control) => <input {...control} className="cf-input" type="date" value={birthday} onChange={(event) => setBirthday(event.target.value)} autoComplete="bday" />}
          </FlowField>
        </div>
        {/* The country is set at sign-up and decides prices and currency (owner
            decision 2026-11-08), so it's read-only here; support can change it. */}
        <FlowField label="Country">
          {(control) => <input {...control} className="cf-input" value={COUNTRY_NAMES[accountCountry]} readOnly aria-describedby="personal-country-note" />}
        </FlowField>
        <p className="set-help" id="personal-country-note">Your prices are in {CURRENCY_BY_COUNTRY[accountCountry]}. To change your country, email {SUPPORT_EMAIL}.</p>
        <SaveState status={status} />
        <div className="set-actions">
          <button type="submit" className="l-btn l-btn-primary" aria-disabled={saving || undefined}>{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </form>
    </SettingsSection>
  );
}
