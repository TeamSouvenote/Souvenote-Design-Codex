"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useModalDialog } from "./useModalDialog";

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

export type BmcStepId = "photo" | "basics" | "image" | "message" | "song" | "review";

type BmcIconProps = {
  name: BmcIconName;
  w?: number;
};

type BmcStep = {
  id: BmcStepId;
  label: string;
};

type BmcNavContextValue = {
  activeId: BmcStepId;
  onChange: (id: BmcStepId) => void;
};

type BmcStepperProps = BmcNavContextValue;

type BmcHeadProps = {
  num: string;
  eyebrow: string;
  title: string;
  lede?: React.ReactNode;
  italicWord?: string;
  accent?: "gold" | "rose" | "silver";
  center?: boolean;
  titleStyle?: React.CSSProperties;
  titleClassName?: string;
  italicAccent?: boolean;
};

type BmcFootProps = {
  costLabel: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void | Promise<void>;
  nextLabel?: string;
  secondary?: React.ReactNode;
  disabled?: boolean;
};

type CreditCostProps = {
  n: number;
  label?: string;
};

type BmcCheckProps = {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  error?: boolean;
  children: React.ReactNode;
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

const STEPS: BmcStep[] = [
  { id: "photo", label: "Photo" },
  { id: "basics", label: "Basics" },
  { id: "image", label: "Image Flow" },
  { id: "message", label: "Inside Message" },
  { id: "song", label: "QR Song" },
  { id: "review", label: "Review" },
];

const BmcNavContext = React.createContext<BmcNavContextValue | null>(null);

function BmcStepper({ activeId, onChange }: BmcStepperProps) {
  const idx = STEPS.findIndex((step) => step.id === activeId);

  return (
    <div className="bmc-stepper" data-count={STEPS.length}>
      {STEPS.map((step, index) => (
        <div
          key={step.id}
          className={`bmc-step ${index === idx ? "is-active" : ""} ${index < idx ? "is-done" : ""}`}
          onClick={() => onChange(step.id)}
        >
          <span className="bmc-step-dot">{index < idx ? <BmcIcon name="check" w={14} /> : (index + 1)}</span>
          <span className="bmc-step-name">{step.label}</span>
        </div>
      ))}
    </div>
  );
}

function BmcHead({
  num,
  eyebrow,
  title,
  lede,
  italicWord,
  accent = "gold",
  center = false,
  titleStyle,
  titleClassName = "",
  italicAccent = true,
}: BmcHeadProps) {
  const nav = React.useContext(BmcNavContext);
  const accentClass = accent === "rose" ? "text-metallic-rose-gold" : "text-metallic-rose-gold";
  const accentClassName = italicAccent ? `souv-hero-italic ${accentClass}` : accentClass;
  let pre = title;
  let post = "";

  if (italicWord && title.includes(italicWord)) {
    [pre, post] = title.split(italicWord);
  }

  return (
    <>
      <div className="bmc-head" style={center ? { textAlign: "center", margin: "0 auto 36px" } : undefined}>
        <div className="bmc-eyebrow" style={center ? { justifyContent: "center" } : undefined}>
          <span className="bmc-eyebrow-num">{num}</span>
          <span>{eyebrow}</span>
        </div>
        <h1 className={`bmc-title ${titleClassName}`.trim()} style={titleStyle}>
          {pre}
          {italicWord && <span className={accentClassName}>{italicWord}</span>}
          {post}
        </h1>
        {lede && <p className="bmc-lede" style={center ? { margin: "0 auto" } : undefined}>{lede}</p>}
      </div>
      {nav && <BmcStepper activeId={nav.activeId} onChange={nav.onChange} />}
    </>
  );
}

function BmcFoot({ costLabel, onBack, onNext, nextLabel = "Continue", secondary, disabled = false }: BmcFootProps) {
  return (
    <div className="bmc-foot">
      <div className="bmc-foot-cost">{costLabel}</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {onBack && (
          <button type="button" className="bmc-cta-secondary" onClick={onBack}>
            <BmcIcon name="back" w={14} /> Back
          </button>
        )}
        {secondary}
        <button
          type="button"
          className="bmc-cta"
          onClick={onNext}
          style={disabled ? { opacity: 0.5, pointerEvents: "none" } : undefined}
        >
          {nextLabel} <BmcIcon name="arrow" w={16} />
        </button>
      </div>
    </div>
  );
}

function FreeCost() {
  return <><BmcIcon name="check" w={13} /> Free step <span className="bmc-foot-cost-sep">{"\u00b7"}</span> no credits</>;
}

function CreditCost({ n, label = "on generate" }: CreditCostProps) {
  return <>{label} <span className="bmc-foot-cost-sep">{"\u00b7"}</span> <b>{n}</b> {n === 1 ? "credit" : "credits"}</>;
}

function BmcCheck({ checked, onChange, error = false, children }: BmcCheckProps) {
  return (
    <label className={`bmc-check ${checked ? "is-checked" : ""} ${error ? "is-error" : ""}`}>
      <span className="bmc-check-box">
        <BmcIcon name="check" w={14} />
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
      />
      <span className="bmc-check-text">{children}</span>
    </label>
  );
}

function bmcError(message: React.ReactNode, title: React.ReactNode = "One more thing") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<BmcErrorDetail>("bmc-error", { detail: { message, title } }));
}

// Shared error pop-up (Build My Card, Personalize, Delivery). Dark look kept
// until the Build My Card redesign; behaviour matches the other pop-ups
// (build-fixes item 27): focus moves in, Tab stays inside, Escape closes, page
// scroll locked, page behind inert, focus returns to where it was.
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
  return createPortal(<BmcErrorDialog state={state} onClose={() => setState(null)} />, document.body);
}

function BmcErrorDialog({ state, onClose }: { state: BmcErrorDetail; onClose: () => void }) {
  const dialogRef = useModalDialog(onClose, ".bmc-modal-wrap");
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();
  const messageId = React.useId();

  // Runs after useModalDialog has focused the dialog: start on "Got it".
  React.useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="bmc-modal-wrap" data-screen-label="Modal · Error">
      <div className="bmc-modal-scrim" onClick={onClose} />
      <div
        ref={dialogRef}
        className="bmc-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={state.message ? messageId : undefined}
        tabIndex={-1}
        style={{ width: "min(440px, 100%)" }}
      >
        <span className="bmc-error-icon" aria-hidden="true"><BmcIcon name="warn" w={26} /></span>
        <h2 id={titleId} className="bmc-modal-title" style={{ fontSize: "clamp(1.4rem, 2.2vw, 1.8rem)" }}>{state.title}</h2>
        <p id={messageId} className="bmc-modal-sub">{state.message}</p>
        <div className="bmc-modal-acts">
          <button ref={buttonRef} type="button" className="bmc-cta" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}

export {
  BmcIcon,
  STEPS,
  BmcStepper,
  BmcHead,
  BmcFoot,
  FreeCost,
  CreditCost,
  BmcCheck,
  BmcNavContext,
  BmcErrorModal,
  bmcError,
};
