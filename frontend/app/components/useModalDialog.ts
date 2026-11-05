"use client";

import * as React from "react";

// Shared modal dialog behaviour (Welcome modal, Print and Send pop-up).
// Moved unchanged out of Auth.tsx so other modals behave the same way.

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Locks page scroll under a modal. Both <html> and <body> are locked: with
// `overflow-x: clip` on <html> (site.css), a body-only lock no longer reaches
// the page scroller. The body is also pinned in place, which iOS Safari needs.
// Returns the undo function, which puts the page back where it was.
function lockPageScroll() {
  const { documentElement: html, body } = document;
  const scrollY = window.scrollY;
  const previous = {
    htmlOverflow: html.style.overflow,
    bodyOverflow: body.style.overflow,
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyWidth: body.style.width,
  };
  html.style.overflow = 'hidden';
  body.style.overflow = 'hidden';
  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.width = '100%';

  return () => {
    html.style.overflow = previous.htmlOverflow;
    body.style.overflow = previous.bodyOverflow;
    body.style.position = previous.bodyPosition;
    body.style.top = previous.bodyTop;
    body.style.width = previous.bodyWidth;
    // "instant": the root layout sets smooth scrolling, which would animate this.
    window.scrollTo({ top: scrollY, behavior: 'instant' });
  };
}

// Makes everything beside the modal's root inert (no focus, no clicks, hidden
// from screen readers). Returns the undo function.
function makeSiblingsInert(modalRoot: HTMLElement | null) {
  const siblings = modalRoot?.parentElement
    ? Array.from(modalRoot.parentElement.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== modalRoot && !el.inert,
    )
    : [];
  siblings.forEach((el) => { el.inert = true; });
  return () => siblings.forEach((el) => { el.inert = false; });
}

// Where focus goes when the modal closes: back where it was, or, if the modal
// opened on page load (nothing was focused), the page's main heading.
function restoreFocus(previouslyFocused: HTMLElement | null) {
  if (previouslyFocused && previouslyFocused !== document.body && previouslyFocused.isConnected) {
    previouslyFocused.focus({ preventScroll: true });
    return;
  }
  const heading = document.querySelector<HTMLElement>('main h1');
  if (!heading) return;
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
}

// Dialog behaviour: focuses the dialog on open, keeps Tab inside it, closes on
// Escape, locks page scroll, makes the page behind inert (everything beside the
// closest `overlaySelector` ancestor), and restores focus on unmount.
function useModalDialog(onClose: () => void, overlaySelector = '.souv-auth-overlay') {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const unlockScroll = lockPageScroll();
    const restoreSiblings = makeSiblingsInert(dialog.closest<HTMLElement>(overlaySelector));
    dialog.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent) {
      if (!dialog) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((el) => el.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === dialog || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      restoreSiblings();
      unlockScroll();
      restoreFocus(previouslyFocused);
    };
  }, [overlaySelector]);

  return dialogRef;
}

export { FOCUSABLE_SELECTOR, lockPageScroll, makeSiblingsInert, restoreFocus, useModalDialog };
