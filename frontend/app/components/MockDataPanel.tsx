"use client";

/**
 * Small floating control shown only in mock data mode. Says the app is on
 * mock data, shows the demo login and code rule, and can add credits or
 * reset everything back to the seed. A developer tool, not part of the design,
 * so it keeps its own inline styles.
 *
 * Loaded by MockDataBadge only in mock mode (Prompt 2 flows E-F2, 2026-11-09), so the
 * demo login, the fixed codes and the seed data never ship to customers.
 */
import * as React from "react";
import { createLocalIdempotencyKey, grantCredits } from "../lib/api";
import { getStoredCognitoSession } from "../lib/cognitoAuth";
import { publishCreditBalance } from "../lib/creditBalance";
import { resetAllMockData } from "../lib/mockDb";
import { MOCK_CODE_HINT, MOCK_DEMO_EMAIL, MOCK_DEMO_PASSWORD, MOCK_TOTP_CODE } from "../lib/mockDemo";
import { MOCK_MODE } from "../lib/mockMode";

declare global {
  interface Window {
    __souvResetMockData?: () => void;
  }
}

const pill: React.CSSProperties = {
  position: "fixed",
  right: 12,
  bottom: 12,
  zIndex: 2147483000,
  fontFamily: "var(--font-sans, system-ui, sans-serif)",
  fontSize: 12,
  lineHeight: 1.4,
  color: "#1d1a12",
};

const buttonBase: React.CSSProperties = {
  border: "1px solid #8A7224",
  background: "#F1D074",
  color: "#1d1a12",
  borderRadius: 999,
  padding: "5px 11px",
  font: "inherit",
  fontWeight: 600,
  cursor: "pointer",
};

function resetAndReload() {
  resetAllMockData();
  window.location.assign("/");
}

export function MockDataPanel() {
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState<string | null>(null);

  // QA hook, mock mode only (never set against the real backend).
  React.useEffect(() => {
    if (!MOCK_MODE) return;
    window.__souvResetMockData = resetAndReload;
    return () => {
      delete window.__souvResetMockData;
    };
  }, []);

  if (!MOCK_MODE) return null;

  const addCredits = async () => {
    if (!getStoredCognitoSession()) {
      setNote("Log in first to add credits.");
      return;
    }
    try {
      const result = await grantCredits({ amount: 20, source: "mock_badge", idempotencyKey: createLocalIdempotencyKey("mock-badge") });
      if (result.balance) publishCreditBalance(result.balance);
      setNote(`Added 20 credits (now ${result.balance?.balance ?? "?"}).`);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Could not add credits.");
    }
  };

  if (!open) {
    return (
      <div style={pill}>
        <button type="button" style={buttonBase} onClick={() => setOpen(true)} aria-label="Mock data mode: open tools">
          Mock data
        </button>
      </div>
    );
  }

  return (
    <div style={pill}>
      <div
        role="dialog"
        aria-label="Mock data tools"
        style={{ background: "#fffaf0", border: "1px solid #8A7224", borderRadius: 12, padding: 12, width: 260, boxShadow: "0 6px 24px rgba(0,0,0,.25)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <strong>Mock data mode</strong>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ ...buttonBase, background: "transparent", border: "none", padding: "0 4px" }}>✕</button>
        </div>
        <p style={{ margin: "0 0 8px" }}>No backend or Cognito. Everything is stored in this browser.</p>
        <p style={{ margin: "0 0 4px" }}>Demo login: <code>{MOCK_DEMO_EMAIL}</code> / <code>{MOCK_DEMO_PASSWORD}</code></p>
        <p style={{ margin: "0 0 4px" }}>Email and reset codes: {MOCK_CODE_HINT}</p>
        <p style={{ margin: "0 0 4px" }}>Authenticator app code (two-step sign-in): <code>{MOCK_TOTP_CODE}</code></p>
        <p style={{ margin: "0 0 10px" }}>Payment always succeeds; a card costs 1 credit, or 2 with a song.</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button" style={buttonBase} onClick={addCredits}>+20 credits</button>
          <button type="button" style={{ ...buttonBase, background: "#fff" }} onClick={resetAndReload}>Reset all mock data</button>
        </div>
        {note ? <p style={{ margin: "8px 0 0" }} role="status">{note}</p> : null}
      </div>
    </div>
  );
}
