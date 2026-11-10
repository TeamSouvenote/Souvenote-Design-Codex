"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

// After a client-side page change (not on first load), move focus to the new
// page's main heading, so keyboard and screen-reader users start at the top of
// the new page instead of on <body> or the link they pressed (audit O1,
// owner 2026-11-09).
//
// It leaves focus alone when the new page has already put it somewhere on
// purpose: inside <main> (a code field, a questionnaire heading) or inside a
// dialog (the Welcome modal). The heading can render a little after the route
// (auth loading), so it waits up to about a second for one.

const DIALOG = "[role=dialog], [role=alertdialog], [aria-modal=true]";

function focusIsPlaced(main: HTMLElement | null) {
  const active = document.activeElement;
  if (!active || active === document.body || !active.isConnected) return false;
  return Boolean(active.closest(DIALOG)) || Boolean(main?.contains(active));
}

export function RouteFocus() {
  const pathname = usePathname();
  const firstRender = React.useRef(true);

  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    let tries = 0;
    let timer = 0;
    const attempt = () => {
      const main = document.querySelector<HTMLElement>("main");
      if (focusIsPlaced(main)) return;
      const heading = main?.querySelector<HTMLElement>("h1");
      if (!heading) {
        if (tries++ < 20) timer = window.setTimeout(attempt, 50);
        return;
      }
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    };
    timer = window.setTimeout(attempt, 50);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
