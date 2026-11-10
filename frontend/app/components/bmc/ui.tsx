"use client";

// Small building blocks for the Build My Card questionnaire, on the berry &
// ivory design system (styles/bmc-questionnaire.css). Single choices are
// radio groups; multiple choices are toggle chips with aria-pressed.

import * as React from "react";
import Image from "next/image";

export type IconName = "arrow" | "back" | "check" | "edit" | "refresh" | "plus" | "close" | "sparkle" | "upload" | "lock" | "image" | "note" | "message" | "search";

const PATHS: Record<IconName, React.ReactNode> = {
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M15 5l-7 7 7 7" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" />,
  refresh: <path d="M20 11a8 8 0 10-2.3 5.7M20 5v6h-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />,
  upload: <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />,
  lock: <path d="M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z" />,
  image: <path d="M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />,
  note: <path d="M9 18V5l11-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z" />,
  message: <path d="M4 5h16v11H8l-4 4V5z" />,
  search: <path d="M11 17.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM20 20l-4.5-4.5" />,
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}

/** Options that let the customer write their own answer; always shown in forest green. */
const CUSTOM_OPTION_IDS = new Set(["custom", "other", "own-words", "custom-colour"]);

/** A single-choice group (radio semantics, arrow keys move between options). */
export function ChoiceGroup<T extends string>({ label, options, value, onChange, columns, render }: {
  label: string;
  options: { id: T; label: string; sub?: string; disabled?: boolean; note?: string; swatch?: string; badge?: string }[];
  value: T | null;
  onChange: (id: T) => void;
  columns?: "cards" | "chips" | "tiles";
  render?: (option: { id: T; label: string; sub?: string }) => React.ReactNode;
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.filter((option) => !option.disabled);
  const focusIndex = Math.max(0, options.findIndex((option) => option.id === value && !option.disabled));
  const move = (from: number, step: number) => {
    const order = options.map((option, index) => ({ option, index })).filter(({ option }) => !option.disabled);
    const current = order.findIndex(({ index }) => index === from);
    const next = order[(current + step + order.length) % order.length];
    if (next) { onChange(next.option.id); refs.current[next.index]?.focus(); }
  };
  return (
    <div role="radiogroup" aria-label={label} className={`bmcq-options is-${columns || "chips"}`}>
      {options.map((option, index) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            ref={(element) => { refs.current[index] = element; }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={option.disabled || undefined}
            tabIndex={(value ? selected : index === focusIndex && enabled.length > 0) ? 0 : -1}
            className={`bmcq-option${selected ? " is-selected" : ""}${option.disabled ? " is-disabled" : ""}${CUSTOM_OPTION_IDS.has(option.id) ? " is-custom" : ""}`}
            onClick={() => { if (!option.disabled) onChange(option.id); }}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); move(index, 1); }
              if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); move(index, -1); }
            }}
          >
            {option.swatch && <span className="bmcq-swatch" style={{ background: option.swatch }} aria-hidden="true" />}
            {render ? render(option) : (
              <span className="bmcq-option-text">
                {option.badge && <span className="bmcq-badge">{option.badge}</span>}
                <span className="bmcq-option-label">{option.label}</span>
                {option.sub && <span className="bmcq-option-sub">{option.sub}</span>}
                {option.note && <span className="bmcq-option-note">{option.note}</span>}
              </span>
            )}
            {selected && <span className="bmcq-option-tick" aria-hidden="true"><Icon name="check" size={16} /></span>}
          </button>
        );
      })}
    </div>
  );
}

/** Multiple choice as toggle chips. `max` limits how many can be on. */
export function ToggleChips({ label, options, values, onChange, max }: {
  label: string;
  options: { id: string; label: string; swatch?: string }[];
  values: string[];
  onChange: (values: string[]) => void;
  max?: number;
}) {
  const full = typeof max === "number" && values.length >= max;
  return (
    <div role="group" aria-label={label} className="bmcq-options is-chips">
      {options.map((option) => {
        const on = values.includes(option.id);
        const blocked = !on && full;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={on}
            aria-disabled={blocked || undefined}
            className={`bmcq-chip${on ? " is-selected" : ""}${blocked ? " is-disabled" : ""}${CUSTOM_OPTION_IDS.has(option.id) ? " is-custom" : ""}`}
            onClick={() => {
              if (on) onChange(values.filter((value) => value !== option.id));
              else if (!blocked) onChange([...values, option.id]);
            }}
          >
            {option.swatch && <span className="bmcq-swatch" style={{ background: option.swatch }} aria-hidden="true" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function TextField({ id, label, value, onChange, placeholder, multiline, maxLength, rows = 4, hint, error, autoFocus, hideLabel }: {
  id: string; label: string; hideLabel?: boolean; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean;
  maxLength?: number; rows?: number; hint?: React.ReactNode; error?: string | null; autoFocus?: boolean;
}) {
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  const props = {
    id, value, placeholder, maxLength, autoFocus,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
    className: `bmcq-input${multiline ? " is-multiline" : ""}${error ? " is-error" : ""}`,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
  };
  return (
    <div className="bmcq-field">
      <label className={hideLabel ? "l-sr-only" : "bmcq-label"} htmlFor={id}>{label}</label>
      {multiline ? <textarea rows={rows} {...props} /> : <input type="text" {...props} />}
      {hint && <div className="bmcq-hint" id={`${id}-hint`}>{hint}</div>}
      {error && <div className="bmcq-error" id={`${id}-error`} role="alert">{error}</div>}
    </div>
  );
}

/** Sticky action bar under the question. Never covers inputs: the card reserves room for it. */
export function Actions({ onBack, onSkip, onContinue, continueLabel = "Continue", disabled, busy, note }: {
  onBack?: () => void; onSkip?: () => void; onContinue?: () => void; continueLabel?: string; disabled?: boolean; busy?: boolean; note?: React.ReactNode;
}) {
  return (
    <div className="bmcq-actions">
      <div className="bmcq-actions-left">
        {onBack && (
          <button type="button" className="bmcq-btn is-quiet" onClick={onBack}>
            <Icon name="back" size={16} /> Back
          </button>
        )}
        {note && <span className="bmcq-actions-note">{note}</span>}
      </div>
      <div className="bmcq-actions-right">
        {onSkip && <button type="button" className="bmcq-btn is-secondary" onClick={onSkip}>Skip</button>}
        {onContinue && (
          // Busy stays focusable (aria-disabled plus a guard), so focus never falls to <body>
          // (design system 2.28); `disabled` is only for "can't yet".
          <button type="button" className="bmcq-btn is-primary" onClick={busy ? undefined : onContinue} disabled={disabled && !busy}
            aria-disabled={busy || undefined} aria-busy={busy || undefined}>
            {busy ? "One moment…" : continueLabel} {!busy && <Icon name="arrow" size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

/** Calm gold state while the interviewer or a writer is working. */
export function Thinking({ label, announce = true }: { label: string; announce?: boolean }) {
  return (
    <div className="bmcq-thinking" {...(announce ? { role: "status", "aria-live": "polite" as const } : {})}>
      <span className="bmcq-thinking-dots" aria-hidden="true"><i /><i /><i /></span>
      {label}
    </div>
  );
}

/**
 * Says when an AI writer starts and when its result is ready (Prompt 2 flows A-F2,
 * 2026-11-09). It stays in the page, so screen readers hear both lines; a status that
 * appears with its text already in it, then vanishes, is often skipped. Pair it with
 * `<Thinking announce={false} />`. Pass an empty `doneText` when the call failed: the
 * error's own alert is read instead.
 */
export function BusyAnnounce({ busy, busyText, doneText }: { busy: boolean; busyText: string; doneText: string }) {
  const [text, setText] = React.useState("");
  const wasBusy = React.useRef(busy);
  React.useEffect(() => {
    if (busy) setText(busyText);
    else if (wasBusy.current) setText(doneText);
    wasBusy.current = busy;
  }, [busy, busyText, doneText]);
  return <p className="l-sr-only" role="status" aria-live="polite">{text}</p>;
}

export function Counter({ value, max, label }: { value: number; max: number; label: string }) {
  return <span className={`bmcq-counter${value > max ? " is-over" : ""}`}>{value} / {max} {label}</span>;
}

const PHONE_QUERY = "(max-width: 599px)";

/** True on phones (under 600px), where each section of a step gets its own screen. */
export function useIsPhone() {
  return React.useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(PHONE_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}

/**
 * Phone sections: on phones a step with several sections shows one per screen,
 * with Next and Back moving between them; on larger screens every section shows
 * at once. `count` can change (for example when an AI version appears).
 */
export function useSections(count: number) {
  const phone = useIsPhone();
  const [index, setIndex] = React.useState(0);
  const safe = Math.min(index, Math.max(0, count - 1));
  return {
    phone,
    index: safe,
    /** Whether a section should render now. */
    shows: (section: number) => !phone || section === safe,
    isLast: !phone || safe >= count - 1,
    next: () => setIndex(Math.min(count - 1, safe + 1)),
    prev: () => setIndex(Math.max(0, safe - 1)),
    first: !phone || safe === 0,
  };
}

/**
 * Phones: says which section is on screen after Next or Back, for screen readers only.
 * The visible "Part N of M" line was removed (owner, 2026-11-09); this keeps the
 * announcement without a label beside the heading. Polite, so it never interrupts.
 */
export function SectionAnnounce({ index, count, label }: { index: number; count: number; label: string }) {
  return <p className="l-sr-only" aria-live="polite">{count > 1 ? `Part ${index + 1} of ${count}: ${label}` : ""}</p>;
}

/**
 * Puts focus back on `ref` when a busy state ends and focus fell to <body> while it ran
 * (the control was swapped for a "thinking" line). Never takes focus from anywhere else.
 */
export function useRefocusAfterBusy(busy: boolean, ref: React.RefObject<HTMLElement | null>) {
  const wasBusy = React.useRef(busy);
  React.useEffect(() => {
    if (wasBusy.current && !busy) {
      const active = document.activeElement;
      if (!active || active === document.body) ref.current?.focus();
    }
    wasBusy.current = busy;
  }, [busy, ref]);
}

/**
 * Moves focus to `ref` when `key` changes after the first render (a phone section or a
 * view change). Safe under React Strict Mode: a repeated run with the same key does nothing.
 */
export function useFocusOnChange(key: string | number | null, ref: React.RefObject<HTMLElement | null>) {
  const last = React.useRef<string | number | null>(null);
  React.useEffect(() => {
    if (key === null) return;
    if (last.current === null) { last.current = key; return; }
    if (last.current === key) return;
    last.current = key;
    ref.current?.focus({ preventScroll: false });
  }, [key, ref]);
}

/**
 * Photo thumbnails: after a remove button takes its photo away, focus moves to the next
 * remove button (or the last one), or to `fallback` (Choose photos) once none are left.
 * Call the returned function with the removed photo's index just before removing it.
 */
export function useFocusAfterRemove(count: number, list: React.RefObject<HTMLElement | null>, fallback: React.RefObject<HTMLElement | null>) {
  const removedAt = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (removedAt.current === null) return;
    const buttons = list.current?.querySelectorAll<HTMLButtonElement>(".bmcq-thumb-remove");
    const next = buttons?.length ? buttons[Math.min(removedAt.current, buttons.length - 1)] : fallback.current;
    removedAt.current = null;
    next?.focus();
  }, [count, list, fallback]);
  return (index: number) => { removedAt.current = index; };
}

/**
 * Every word printed on the front, behind a closed "Check the spelling (N)" disclosure, so a long
 * list never pushes Review's buttons off screen (owner, 2026-11-09, audit §8 D5).
 */
export function FrontWords({ words }: { words: string[] }) {
  const shown = words.map((word) => word.trim()).filter(Boolean);
  if (!shown.length) return null;
  return (
    <details className="bmcq-front-words">
      <summary>Check the spelling ({shown.length})</summary>
      <ul>{shown.map((word, index) => <li key={`${index}-${word}`}>“{word}”</li>)}</ul>
    </details>
  );
}

/** Lyrics split at blank lines, so a section heading never sits apart from its lines. */
export function LyricBlocks({ text }: { text: string }) {
  return <>{text.split(/\n\s*\n/).map((block, index) => <span key={index} className="bmcq-lyrics-block">{block.trim()}</span>)}</>;
}

/**
 * A greeting-card-shaped placeholder: the current two-tone logo (gold S,
 * platinum note) on forest, the only approved way to show the gold logo.
 * Swapped for real visual examples later (owner, 2026-11-08).
 */
export function CardPlaceholder({ shape = "portrait" }: { shape?: "portrait" | "landscape" }) {
  return (
    <span className={`bmcq-card-placeholder is-${shape}`} aria-hidden="true">
      <Image src="/assets/logomark-gold-silver.png" alt="" width={400} height={600} sizes="80px" />
    </span>
  );
}
