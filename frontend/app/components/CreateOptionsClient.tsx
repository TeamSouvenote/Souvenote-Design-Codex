"use client";

import * as React from "react";
import Link from "next/link";
import { CREATE_OPTIONS, type CreateOption } from "./createOptions";
import { carouselPos, useCardCarousel } from "./useCardCarousel";
import { SongMark } from "./WelcomeSketches";

// The four create options on /create (styles in styles/create-options.css).
// Template and Build are the main two; Community and Saved come second.
// - Desktop: Template and Build as large opened 5x7 cards on top, Community and
//   Saved as smaller opened cards underneath.
// - Below 1024px: Template and Build in the Welcome-style carousel, then
//   Community and Saved as two small closed cards (front only) side by side.
//
// Every option opens straight away; none checks credits here. Personalize a
// Template and Build My Card ask for a top-up only when Create (or a paid redo)
// is pressed without enough credits (owner, 2026-11-07 for Build, 2026-11-08 for
// Personalize). Community Cards uses no AI credits.

const PRIMARY = [CREATE_OPTIONS.template, CREATE_OPTIONS.build] as const;
const SECONDARY = [CREATE_OPTIONS.community, CREATE_OPTIONS.saved] as const;
// Below 1024px wide the main two become a carousel. Must match create-options.css.
const CAROUSEL_QUERY = "(max-width: 1023px)";

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

type CardProps = {
  opt: CreateOption;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLAnchorElement>) => void;
};

/** An opened 5x7 card: title + sketch inside left, handwriting inside right. */
function OpenedCard({ opt, onClick, onFocus, size }: CardProps & { size: "primary" | "secondary" }) {
  const { Sketch } = opt;
  return (
    <Link
      className={`sv-ocard cr-card is-${size} is-${opt.key}`}
      href={opt.href}
      draggable={false}
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
        <span className="sv-ocard-foot">
          {opt.song && <SongMark />}
          <span className="sv-ocard-go cr-card-go" aria-hidden="true">
            <ArrowIcon />
          </span>
        </span>
      </span>
    </Link>
  );
}

/** A closed 5x7 card (front only), for the secondary options on phones and tablets. */
function ClosedCard({ opt }: Pick<CardProps, "opt">) {
  const { Sketch } = opt;
  return (
    <Link className={`cr-closed is-${opt.key}`} href={opt.href}>
      <span className="sv-ocard-title cr-card-title">{keepLastTwoTogether(opt.title)}</span>
      {/* The handwriting isn't shown on the small front, but screen readers still hear it. */}
      <span className="l-sr-only">{opt.sub}</span>
      <Sketch />
      <span className="sv-ocard-go cr-card-go" aria-hidden="true"><ArrowIcon /></span>
    </Link>
  );
}

export function CreateOptionsClient() {
  const count = PRIMARY.length;
  const { active, listRef, pointerHandlers, choose, onCardFocus, onCardClick } =
    useCardCarousel({ count, initial: 0, query: CAROUSEL_QUERY });

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
                onFocus={(e) => onCardFocus(e, i)}
                onClick={(e) => { onCardClick(e, i); /* a side card only moves to the centre */ }}
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
            <OpenedCard opt={opt} size="secondary" />
            <ClosedCard opt={opt} />
          </li>
        ))}
      </ul>
    </div>
  );
}
