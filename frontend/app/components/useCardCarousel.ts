"use client";

import * as React from "react";

// The opened-card carousel used below 1100px by the Welcome modal (3 cards)
// and the Create Options page (4 cards).
// - Mouse: hovering rotates it until the pointer leaves or the user clicks; a
//   turn is skipped while the pointer rests on the centre card, so the card
//   under the pointer can't change just before a click.
// - Touch: press and hold rotates it until the finger lifts; a swipe moves one card.
// - A tap on a side card brings it to the centre; a tap on the centre card opens it.
// - Keyboard focus centres the focused card.
// - Reduced motion: no auto-rotation (taps, swipes and the dots still work).

export const CARD_CAROUSEL_QUERY = "(max-width: 1099px)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const ROTATE_MS = 1700;
const HOLD_MS = 380;
const SWIPE_PX = 40;

export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
}

/**
 * Where card `i` sits relative to the active card: -1 left, 0 centre, 1 right.
 * With two cards the other one sits on its natural side (right of the first,
 * left of the second). With four or more cards the rest get 2 or more (out of
 * view, behind the centre card).
 */
export function carouselPos(i: number, active: number, count: number) {
  if (count === 2) return i - active;
  return ((i - active + count + 1) % count) - 1;
}

export function useCardCarousel({ count, initial, query = CARD_CAROUSEL_QUERY }: { count: number; initial: number; query?: string }) {
  const carousel = useMediaQuery(query);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const [active, setActive] = React.useState(initial);
  const rotateTimer = React.useRef<number | null>(null);
  const holdTimer = React.useRef<number | null>(null);
  const stoppedByClick = React.useRef(false);
  const suppressClick = React.useRef(false);
  const touch = React.useRef<{ x: number; y: number; moved: boolean; held: boolean } | null>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  // Where the mouse is while it's over the carousel (null for touch, or once it leaves).
  const mouseAt = React.useRef<{ x: number; y: number } | null>(null);
  const lastPointer = React.useRef<string>("mouse");

  const step = React.useCallback((by: number) => setActive((a) => (a + by + count) % count), [count]);
  const stopRotate = React.useCallback(() => {
    if (rotateTimer.current !== null) window.clearInterval(rotateTimer.current);
    rotateTimer.current = null;
  }, []);
  const startRotate = React.useCallback(() => {
    if (rotateTimer.current !== null || reducedMotion) return;
    rotateTimer.current = window.setInterval(() => {
      const at = mouseAt.current;
      if (at) {
        const card = document.elementFromPoint(at.x, at.y)?.closest("li[data-pos]");
        if (card && listRef.current?.contains(card) && card.getAttribute("data-pos") === "0") return;
      }
      step(1);
    }, ROTATE_MS);
  }, [reducedMotion, step]);
  const clearHold = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  React.useEffect(() => {
    if (!carousel) { stopRotate(); setActive(initial); }
  }, [carousel, initial, stopRotate]);
  React.useEffect(() => { if (reducedMotion) stopRotate(); }, [reducedMotion, stopRotate]);
  React.useEffect(() => () => { stopRotate(); clearHold(); }, [stopRotate]);

  const pointerHandlers: React.HTMLAttributes<HTMLUListElement> = carousel ? {
    onPointerEnter: (e) => {
      if (e.pointerType !== "mouse") return;
      mouseAt.current = { x: e.clientX, y: e.clientY };
      if (!stoppedByClick.current) startRotate();
    },
    onPointerLeave: (e) => {
      if (e.pointerType !== "mouse") return;
      mouseAt.current = null;
      stopRotate();
      stoppedByClick.current = false;
    },
    onPointerDown: (e) => {
      lastPointer.current = e.pointerType;
      // A swipe never produces a click, so a leftover "ignore the next click"
      // from it must not swallow this new press.
      suppressClick.current = false;
      if (e.pointerType === "mouse") return;
      touch.current = { x: e.clientX, y: e.clientY, moved: false, held: false };
      clearHold();
      holdTimer.current = window.setTimeout(() => {
        if (!touch.current || touch.current.moved) return;
        touch.current.held = true;
        step(1);
        startRotate();
      }, HOLD_MS);
    },
    onPointerMove: (e) => {
      if (e.pointerType === "mouse") mouseAt.current = { x: e.clientX, y: e.clientY };
      const t = touch.current;
      if (!t || t.moved) return;
      if (Math.abs(e.clientX - t.x) > 10 || Math.abs(e.clientY - t.y) > 10) {
        t.moved = true;
        clearHold();
      }
    },
    onPointerUp: (e) => {
      const t = touch.current;
      touch.current = null;
      clearHold();
      if (!t) return;
      if (t.held) {
        stopRotate();
        suppressClick.current = true;
        return;
      }
      const dx = e.clientX - t.x;
      if (t.moved && Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - t.y)) {
        step(dx < 0 ? 1 : -1);
        suppressClick.current = true;
      }
    },
    onPointerCancel: () => {
      touch.current = null;
      clearHold();
      stopRotate();
    },
    // Blocks the long-press menu on touch; mouse right-click ("open in new tab") still works.
    onContextMenu: (e) => { if (lastPointer.current !== "mouse") e.preventDefault(); },
  } : {};

  const choose = React.useCallback((i: number) => {
    stopRotate();
    stoppedByClick.current = true;
    setActive(i);
  }, [stopRotate]);

  /** Keyboard focus on a card brings it to the centre. */
  const onCardFocus = (e: React.FocusEvent<HTMLElement>, i: number) => {
    if (carousel && e.currentTarget.matches(":focus-visible")) setActive(i);
  };

  /**
   * Handles a click on card `i`. Returns true when the click should open the
   * card; otherwise the click has already been cancelled (the leftover click
   * after a swipe or hold, or a side card that only moves to the centre).
   */
  const onCardClick = (e: React.MouseEvent<HTMLElement>, i: number) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      e.preventDefault();
      return false;
    }
    if (!carousel) return true;
    const opens = i === active;
    if (!opens) e.preventDefault();
    choose(i);
    return opens;
  };

  return { carousel, reducedMotion, active, listRef, pointerHandlers, choose, onCardFocus, onCardClick };
}
