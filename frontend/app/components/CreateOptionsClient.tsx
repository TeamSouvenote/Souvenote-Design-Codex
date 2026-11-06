"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { CREATE_OPTIONS, type CreateOption, type CreateOptionKey } from "./createOptions";
import { getCreateFlowGate } from "./createFlowRules";
import { goToPricingAfterPurchase } from "./PricingReturn";
import { carouselPos, useCardCarousel } from "./useCardCarousel";
import { fetchCreditBalance } from "../lib/api";
import { getStoredLocalUser } from "../lib/cognitoAuth";
import { publishCreditBalance } from "../lib/creditBalance";

// The four create options on /create (styles in styles/create-options.css).
// Template and Build are the main two; Community and Saved come second.
// - Desktop: Template and Build as large opened 5x7 cards on top, Community and
//   Saved as smaller opened cards underneath.
// - Below 1024px: Template and Build in the Welcome-style carousel, then
//   Community and Saved as two small closed cards (front only) side by side.
//
// Template and Build need AI credits. Every time one is opened, the balance is
// fetched fresh from the backend before anything happens (owner, 2026-11-04):
// with credits the option opens; without, Pricing (which returns here to the
// same option after buying); if the backend can't be reached, the user stays
// here and sees a message. Community and Saved never check credits.

const PRIMARY = [CREATE_OPTIONS.template, CREATE_OPTIONS.build] as const;
const SECONDARY = [CREATE_OPTIONS.community, CREATE_OPTIONS.saved] as const;
// Below 1024px wide the main two become a carousel. Must match create-options.css.
const CAROUSEL_QUERY = "(max-width: 1023px)";
const CHECK_FAILED_MESSAGE = "We couldn't check your credits. Please try again.";

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12 2.4l2.85 6.18 6.78.74-5.07 4.6 1.46 6.68L12 17.27 5.98 20.6l1.46-6.68-5.07-4.6 6.78-.74L12 2.4z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Keeps a title's last two words on one line ("a Template", "My Card", "& Songs"). */
function keepLastTwoTogether(title: string) {
  const words = title.split(" ");
  if (words.length < 3) return title;
  return `${words.slice(0, -2).join(" ")} ${words.slice(-2).join(" ")}`;
}

/** A plain left click (no new tab or window), which this page may take over. */
function isPlainClick(e: React.MouseEvent) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

type CardProps = {
  opt: CreateOption;
  busy: boolean;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLAnchorElement>) => void;
};

/** An opened 5x7 card: title + sketch inside left, handwriting inside right. */
function OpenedCard({ opt, busy, onClick, onFocus, size }: CardProps & { size: "primary" | "secondary" }) {
  const { Sketch } = opt;
  return (
    <Link
      className={`sv-ocard cr-card is-${size} is-${opt.key}${busy ? " is-checking" : ""}`}
      href={opt.href}
      draggable={false}
      aria-busy={busy || undefined}
      onFocus={onFocus}
      onClick={onClick}
    >
      <span className="sv-ocard-left cr-card-left">
        {opt.popular && (
          <span className="sv-ocard-badge cr-badge">
            <StarIcon />
            <em>Most popular</em>
          </span>
        )}
        <span className="sv-ocard-title cr-card-title">{keepLastTwoTogether(opt.title)}</span>
        <Sketch />
      </span>
      <span className="sv-ocard-right cr-card-right">
        <span className="sv-ocard-hand cr-card-sub">{opt.sub}</span>
        <span className="sv-ocard-go cr-card-go" aria-hidden="true">
          {busy ? <span className="cr-spinner" /> : <ArrowIcon />}
        </span>
      </span>
    </Link>
  );
}

/** A closed 5x7 card (front only), for the secondary options on phones and tablets. */
function ClosedCard({ opt, onClick }: Pick<CardProps, "opt" | "onClick">) {
  const { Sketch } = opt;
  return (
    <Link className={`cr-closed is-${opt.key}`} href={opt.href} onClick={onClick}>
      <span className="sv-ocard-title cr-card-title">{keepLastTwoTogether(opt.title)}</span>
      {/* The handwriting isn't shown on the small front, but screen readers still hear it. */}
      <span className="l-sr-only">{opt.sub}</span>
      <Sketch />
      <span className="sv-ocard-go cr-card-go" aria-hidden="true"><ArrowIcon /></span>
    </Link>
  );
}

export function CreateOptionsClient() {
  const router = useRouter();
  const auth = useAuth();
  const count = PRIMARY.length;
  const { active, listRef, pointerHandlers, choose, onCardFocus, onCardClick } =
    useCardCarousel({ count, initial: 0, query: CAROUSEL_QUERY });
  const [checking, setChecking] = React.useState<CreateOptionKey | null>(null);
  const [checkFailed, setCheckFailed] = React.useState(false);
  const checkingRef = React.useRef(false);
  const errorRef = React.useRef<HTMLParagraphElement>(null);

  // On short screens the message can land below the fold: bring it into view.
  React.useEffect(() => {
    if (checkFailed) errorRef.current?.scrollIntoView({ block: "nearest" });
  }, [checkFailed]);

  const openWithCreditCheck = async (opt: CreateOption) => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    setChecking(opt.key);
    setCheckFailed(false);
    try {
      const userId = auth.user?.id || getStoredLocalUser()?.id;
      if (!userId) throw new Error("No signed-in user.");
      const balance = await fetchCreditBalance(userId);
      publishCreditBalance(balance); // the nav and the credits line show the fresh figure
      const gate = getCreateFlowGate({ credits: { images: balance.balance, songs: 0 }, cardBank: 0 }, "generation");
      // The page is left now, so the spinner stays until it goes.
      router.push(gate.allowed ? opt.href : goToPricingAfterPurchase(opt.href));
    } catch {
      checkingRef.current = false;
      setChecking(null);
      setCheckFailed(true);
    }
  };

  /** Runs the credit check for Template/Build on a plain click; other clicks follow the link. */
  const openCard = (e: React.MouseEvent<HTMLAnchorElement>, opt: CreateOption) => {
    if (!opt.requiresCredits || !isPlainClick(e)) return;
    // New tabs open directly: the option pages check credits themselves.
    e.preventDefault();
    void openWithCreditCheck(opt);
  };

  return (
    // Both layouts are in the HTML from the start and create-options.css shows
    // one by screen width (dots and closed cards below 1024px, small opened cards
    // from 1024px), so the page doesn't change shape when JavaScript loads.
    // Below 1024px the hook adds the carousel's tap, swipe and hold behaviour.
    <div className="cr-picker">
      <ul ref={listRef} className="cr-options cr-primary" aria-label="Create options" {...pointerHandlers}>
        {PRIMARY.map((opt, i) => {
          const pos = carouselPos(i, active, count);
          return (
            <li key={opt.key} data-pos={pos} style={{ "--pos": pos } as React.CSSProperties}>
              <OpenedCard
                opt={opt}
                size="primary"
                busy={checking === opt.key}
                onFocus={(e) => onCardFocus(e, i)}
                onClick={(e) => { if (onCardClick(e, i)) openCard(e, opt); }}
              />
            </li>
          );
        })}
      </ul>
      <div className="cr-dots">
        {PRIMARY.map((opt, i) => (
          <button
            key={opt.key}
            type="button"
            className="cr-dot"
            aria-label={`Show ${opt.title}`}
            aria-pressed={i === active}
            onClick={() => choose(i)}
          >
            <i />
          </button>
        ))}
      </div>
      <ul className="cr-options cr-secondary">
        {SECONDARY.map((opt) => (
          <li key={opt.key}>
            <OpenedCard opt={opt} size="secondary" busy={checking === opt.key} onClick={(e) => openCard(e, opt)} />
            <ClosedCard opt={opt} onClick={(e) => openCard(e, opt)} />
          </li>
        ))}
      </ul>
      <p className="l-sr-only" aria-live="polite">{checking ? "Checking your credits" : ""}</p>
      <p ref={errorRef} className="cr-error" role="alert">{checkFailed ? CHECK_FAILED_MESSAGE : ""}</p>
    </div>
  );
}
