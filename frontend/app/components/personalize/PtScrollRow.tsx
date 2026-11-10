"use client";

// A sideways-scrolling row with no visible scrollbar (owner, 2026-11-08): an
// arrow on the left and one on the right. Hovering an arrow glides the row
// that way until the pointer leaves; pressing it (mouse, touch or keyboard)
// jumps most of a screen. An arrow fades out when there's nothing more that
// way. Swiping and trackpads still scroll the row directly.

import * as React from "react";
import { Icon } from "../bmc/ui";

/** Pixels per second while an arrow is hovered. */
const GLIDE_SPEED = 420;

type Props = {
  /** Used in the arrows' names ("Scroll Most popular forward"). */
  label: string;
  /** The row's own accessible name, when it differs from `label`. */
  listLabel?: string;
  className?: string;
  /** The scrolling element: a list (cards) or a group (chips). */
  as?: "ul" | "div";
  role?: string;
  children: React.ReactNode;
};

export function PtScrollRow({ label, listLabel, className = "", as = "ul", role, children }: Props) {
  const scrollerRef = React.useRef<HTMLElement | null>(null);
  const frameRef = React.useRef<number | null>(null);
  const [edges, setEdges] = React.useState({ start: true, end: true });
  // Which arrow has focus: at the edge it stays focusable (aria-disabled, not disabled,
  // so focus doesn't drop to <body>) but leaves the tab order once focus moves on.
  const [focusedArrow, setFocusedArrow] = React.useState<1 | -1 | null>(null);

  const measure = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft <= 1, end: el.scrollLeft >= max - 1 });
  }, []);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => { observer.disconnect(); el.removeEventListener("scroll", measure); };
  }, [measure]);

  const stop = React.useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }, []);
  React.useEffect(() => stop, [stop]);

  // Reduced motion (Prompt 2 flows A-F9, 2026-11-09): no hover glide, and a press jumps
  // without the smooth scroll.
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const glide = (direction: 1 | -1) => {
    stop();
    if (reduced()) return;
    let last = performance.now();
    const step = (now: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollLeft += direction * GLIDE_SPEED * ((now - last) / 1000);
      last = now;
      const max = el.scrollWidth - el.clientWidth;
      if ((direction < 0 && el.scrollLeft <= 0) || (direction > 0 && el.scrollLeft >= max)) { stop(); return; }
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
  };

  const jump = (direction: 1 | -1) => {
    stop();
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: direction * Math.max(200, el.clientWidth * 0.8), behavior: reduced() ? "auto" : "smooth" });
  };

  const arrow = (direction: 1 | -1) => {
    const atEdge = direction < 0 ? edges.start : edges.end;
    return (
      <button type="button" className={`pt-arrow is-${direction < 0 ? "back" : "forward"}`} aria-label={`Scroll ${label} ${direction < 0 ? "back" : "forward"}`}
        aria-disabled={atEdge || undefined} tabIndex={atEdge && focusedArrow !== direction ? -1 : undefined}
        onFocus={() => setFocusedArrow(direction)} onBlur={() => setFocusedArrow(null)}
        onClick={() => { if (!atEdge) jump(direction); }}
        // Hover-glide is for mouse and pen; touch uses tap (jump) or swipe.
        onPointerEnter={(event) => { if (event.pointerType !== "touch" && !atEdge) glide(direction); }}
        onPointerLeave={stop}>
        <Icon name={direction < 0 ? "back" : "arrow"} size={16} />
      </button>
    );
  };

  const Scroller = as;
  return (
    <div className={`pt-scroll${edges.start && edges.end ? " is-static" : ""}`}>
      {arrow(-1)}
      <Scroller ref={(el: HTMLElement | null) => { scrollerRef.current = el; }} className={`pt-scroll-track ${className}`} aria-label={listLabel || label} role={role}>
        {children}
      </Scroller>
      {arrow(1)}
    </div>
  );
}
