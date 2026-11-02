import type { ReactNode } from "react";

/**
 * Decorative "engraving" motifs (greeting cards, love, connection).
 * Purely visual: hidden from assistive tech, never interactive.
 * Colour/strength come from the palette (--l-engrave-color / --l-engrave-opacity);
 * where each one appears is set in landing.css so it only uses empty space.
 */

type MotifName = "envelope" | "stamp" | "heart" | "notes" | "flower" | "gift";

const HEART = "M16 30 C16 28 0 18 0 8 C0 -1 13 -4 16 6 C19 -4 32 -1 32 8 C32 18 16 28 16 30 Z";

const MOTIFS: Record<MotifName, { viewBox: string; body: ReactNode }> = {
  envelope: {
    viewBox: "-6 -6 112 78",
    body: (
      <>
        <rect x="0" y="0" width="100" height="64" rx="3" />
        <rect x="5" y="5" width="90" height="54" rx="2" strokeWidth="0.7" />
        <polyline points="0,1.5 50,38 100,1.5" />
        <line x1="0" y1="64" x2="38" y2="33" />
        <line x1="100" y1="64" x2="62" y2="33" />
        <path d={HEART} transform="translate(42 25) scale(0.5)" />
      </>
    ),
  },
  stamp: {
    viewBox: "-4 -8 128 98",
    body: (
      <>
        <rect x="0" y="0" width="70" height="84" rx="1.5" strokeDasharray="3 3.6" />
        <rect x="8" y="8" width="54" height="68" rx="1" />
        <path d={HEART} transform="translate(19 28) scale(1)" />
        <circle cx="88" cy="16" r="21" strokeWidth="1.1" />
        <circle cx="88" cy="16" r="16" strokeWidth="0.6" />
        <path d="M58 54 q8 -6 16 0 t16 0 t16 0 t8 0 M58 63 q8 -6 16 0 t16 0 t16 0 t8 0 M58 72 q8 -6 16 0 t16 0 t16 0 t8 0" strokeWidth="1" />
      </>
    ),
  },
  heart: {
    viewBox: "-4 -4 40 38",
    body: (
      <>
        <path d={HEART} strokeWidth="0.9" />
        <path d={HEART} transform="translate(3 3) scale(0.81)" strokeWidth="0.45" />
        <path d="M7 6 L13 12 M6 11 L13 18 M8 16 L15 23 M11 21 L16 26" strokeWidth="0.45" />
      </>
    ),
  },
  notes: {
    viewBox: "-6 -14 86 62",
    body: (
      <>
        <ellipse cx="6" cy="32" rx="6.5" ry="4.6" transform="rotate(-20 6 32)" />
        <ellipse cx="32" cy="27" rx="6.5" ry="4.6" transform="rotate(-20 32 27)" />
        <line x1="12" y1="30" x2="12" y2="2" />
        <line x1="38" y1="25" x2="38" y2="-3" />
        <path d="M12 2 L38 -3 M12 7 L38 2" />
        <ellipse cx="58" cy="36" rx="5.5" ry="4" transform="rotate(-20 58 36)" />
        <line x1="63" y1="34.5" x2="63" y2="8" />
        <path d="M63 8 c0 8 10 9 10 17" strokeWidth="0.9" />
      </>
    ),
  },
  flower: {
    viewBox: "-24 -26 54 96",
    body: (
      <>
        <circle cx="0" cy="0" r="4.5" />
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse key={deg} cx="0" cy="-11" rx="5.5" ry="8" transform={`rotate(${deg})`} />
        ))}
        <path d="M2 19 q-5 22 3 44" />
        <path d="M3 40 q14 -10 22 2 q-12 8 -22 -2 Z" />
        <path d="M5 41 q8 -3 18 1" strokeWidth="0.5" />
      </>
    ),
  },
  gift: {
    viewBox: "-6 -24 84 88",
    body: (
      <>
        {/* lid and box */}
        <rect x="0" y="0" width="72" height="14" rx="2" />
        <rect x="5" y="14" width="62" height="44" rx="2" />
        <rect x="9" y="18" width="54" height="36" rx="1" strokeWidth="0.6" />
        {/* ribbon */}
        <path d="M32 0 V58 M40 0 V58" />
        {/* bow loops and tails */}
        <path d="M36 0 C26 -18 8 -15 18 -4 C23 0 30 0 36 0 Z" />
        <path d="M36 0 C46 -18 64 -15 54 -4 C49 0 42 0 36 0 Z" />
        <path d="M22 -6 C26 -9 30 -6 33 -2 M50 -6 C46 -9 42 -6 39 -2" strokeWidth="0.6" />
        <path d="M34 2 L27 12 M38 2 L45 12" />
        {/* engraved hatching on the box */}
        <path d="M13 24 L19 30 M13 32 L19 38 M13 40 L19 46 M53 24 L59 30 M53 32 L59 38 M53 40 L59 46" strokeWidth="0.6" />
      </>
    ),
  },
};

export function Engraving({ name, className = "" }: { name: MotifName; className?: string }) {
  const motif = MOTIFS[name];
  return (
    <svg className={`l-engraving ${className}`} viewBox={motif.viewBox} aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        {motif.body}
      </g>
    </svg>
  );
}
