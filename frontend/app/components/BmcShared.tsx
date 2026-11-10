"use client";

import * as React from "react";
import { FlowDialog } from "./flow/FlowDialog";

export type BmcIconName =
  | "check"
  | "arrow"
  | "back"
  | "upload"
  | "sparkle"
  | "edit"
  | "play"
  | "pause"
  | "refresh"
  | "image"
  | "note"
  | "message"
  | "close"
  | "plus"
  | "spark2"
  | "lock"
  | "coin"
  | "warn"
  | "chevron";

type BmcIconProps = {
  name: BmcIconName;
  w?: number;
};

type BmcErrorDetail = {
  title: React.ReactNode;
  message: React.ReactNode;
};

function BmcIcon({ name, w = 18 }: BmcIconProps) {
  const props = {
    width: w,
    height: w,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;

  switch (name) {
    case "check": return <svg {...props}><path d="M5 12.5l4 4 10-10" /></svg>;
    case "arrow": return <svg {...props}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case "back": return <svg {...props}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
    case "upload": return <svg {...props}><path d="M12 4v12M6 10l6-6 6 6" /><path d="M4 18v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>;
    case "sparkle": return <svg {...props}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></svg>;
    case "edit": return <svg {...props}><path d="M4 20h4l11-11-4-4L4 16v4z" /><path d="M14 6l4 4" /></svg>;
    case "play": return <svg {...props} fill="currentColor" stroke="none"><path d="M7 5v14l12-7z" /></svg>;
    case "pause": return <svg {...props} fill="currentColor" stroke="none"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>;
    case "refresh": return <svg {...props}><path d="M21 12a9 9 0 0 1-15.36 6.36L3 16" /><path d="M3 12a9 9 0 0 1 15.36-6.36L21 8" /><path d="M21 4v4h-4M3 20v-4h4" /></svg>;
    case "image": return <svg {...props}><rect x="3" y="4.5" width="18" height="15" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M3.5 17 L9 12 L13 15.5 L17 11 L20.5 14.5" /></svg>;
    case "note": return <svg {...props}><path d="M9 17V5l11-2v12" /><circle cx="6.5" cy="17.5" r="2.5" fill="currentColor" stroke="none" /><circle cx="17.5" cy="15.5" r="2.5" fill="currentColor" stroke="none" /></svg>;
    case "message": return <svg {...props}><path d="M4 5h16v12H8l-4 4z" /></svg>;
    case "close": return <svg {...props}><path d="M6 6l12 12M18 6L6 18" /></svg>;
    case "plus": return <svg {...props}><path d="M12 5v14M5 12h14" /></svg>;
    case "spark2": return <svg {...props}><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" /></svg>;
    case "lock": return <svg {...props}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
    case "coin": return <svg {...props}><circle cx="12" cy="12" r="8" /><path d="M12 8v8M9.5 10.5h3.5a1.5 1.5 0 0 1 0 3H9.5h4" /></svg>;
    case "warn": return <svg {...props}><path d="M12 3 2.5 20h19z" /><path d="M12 10v4" /><circle cx="12" cy="17.2" r="0.4" fill="currentColor" stroke="currentColor" /></svg>;
    case "chevron": return <svg {...props}><path d="M6 9l6 6 6-6" /></svg>;
    default: return null;
  }
}

function bmcError(message: React.ReactNode, title: React.ReactNode = "One more thing") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<BmcErrorDetail>("bmc-error", { detail: { message, title } }));
}

// Error pop-up for Delivery ("Address needed", "Checkout didn't start", ...), opened
// with bmcError(). Since 2026-11-09 it is the design-system FlowDialog (owner): ivory
// card with a berry stripe, Lato, one "Got it" button. Build My Card and Personalize
// have their own error handling and don't use it. FlowDialog gives it the usual
// behaviour: labelled and described, Tab kept inside, Escape and the x close it, page
// behind inert, focus returned to where it was.
function BmcErrorModal() {
  const [state, setState] = React.useState<BmcErrorDetail | null>(null);

  React.useEffect(() => {
    const onErr = (event: Event) => {
      const detail = (event as CustomEvent<Partial<BmcErrorDetail>>).detail || {};
      setState({
        title: detail.title || "One more thing",
        message: detail.message || "",
      });
    };

    window.addEventListener("bmc-error", onErr);
    return () => window.removeEventListener("bmc-error", onErr);
  }, []);

  if (!state) return null;
  return <BmcErrorDialog state={state} onClose={() => setState(null)} />;
}

function BmcErrorDialog({ state, onClose }: { state: BmcErrorDetail; onClose: () => void }) {
  const titleId = React.useId();
  const messageId = React.useId();
  return (
    <FlowDialog onClose={onClose} labelledBy={titleId} describedBy={state.message ? messageId : undefined} tone="berry" role="alertdialog" className="fd-narrow" screenLabel="Modal · Error">
      <h2 id={titleId} className="fd-title">{state.title}</h2>
      {state.message ? <div id={messageId} className="fd-lede">{state.message}</div> : null}
      <div className="fd-actions">
        <GotItButton onClose={onClose} />
      </div>
    </FlowDialog>
  );
}

/** Starts with focus, so Enter or Space closes the message straight away. */
function GotItButton({ onClose }: { onClose: () => void }) {
  const ref = React.useRef<HTMLButtonElement>(null);
  // FlowDialog focuses its panel in its own effect, which runs after this one,
  // so move focus to the button just after that.
  React.useEffect(() => {
    const timer = window.setTimeout(() => ref.current?.focus({ preventScroll: true }), 0);
    return () => window.clearTimeout(timer);
  }, []);
  return <button ref={ref} type="button" className="l-btn l-btn-primary" onClick={onClose}>Got it</button>;
}

export {
  BmcIcon,
  BmcErrorModal,
  bmcError,
};
