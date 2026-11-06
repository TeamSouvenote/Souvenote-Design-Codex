import * as React from "react";

// Pencil-style sketches for the opened-card create options (Welcome modal and /create).
// Lines take the panel's text colour (currentColor); a light turbulence filter
// roughens them so they read as pencil rather than vector strokes. Small fills
// use design-system colours so each sketch carries more of the palette.

const C = {
  forest: "var(--sv-forest-700)",
  berry: "var(--sv-berry-500)",
  ivory: "var(--sv-ivory-100)",
  oat: "var(--sv-ivory-300)",
  terracotta: "var(--sv-terracotta-400)",
  gold: "var(--sv-gold-400)",
  platinum: "var(--sv-platinum-400)",
  ink: "var(--sv-espresso-700)",
  paper: "var(--sv-ivory-200)",
};

function usePencilId() {
  return `sv-pencil-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

function SketchSvg({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <svg
      className="auth-sketch"
      viewBox="0 0 150 124"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={1.6} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      {children}
    </svg>
  );
}

// ---------- Personalize a Template: a spread of mini 5x7 cards ----------
type Doodle = "star" | "bubble" | "calendar" | "cake" | "hearts" | "ball" | "hat" | "flower" | "paw";
type Mini = { label: string; fill: string; ink: string; doodle: Doodle };

const MINIS_LEFT: Mini[] = [
  { label: "HOROSCOPE", fill: C.forest, ink: C.paper, doodle: "star" },
  { label: "COMIC", fill: C.ivory, ink: C.berry, doodle: "bubble" },
  { label: "ON THIS DAY", fill: C.berry, ink: C.paper, doodle: "calendar" },
  { label: "BIRTHDAY", fill: C.terracotta, ink: C.ink, doodle: "cake" },
  { label: "COUPLES", fill: C.ivory, ink: C.berry, doodle: "hearts" },
];
const MINIS_RIGHT: Mini[] = [
  { label: "FORTUNE", fill: C.berry, ink: C.paper, doodle: "ball" },
  { label: "BAD SANTA", fill: C.oat, ink: C.berry, doodle: "hat" },
  { label: "70’S STYLE", fill: C.terracotta, ink: C.ink, doodle: "flower" },
  { label: "PET PARADISE", fill: C.forest, ink: C.paper, doodle: "paw" },
];

function DoodleMark({ kind }: { kind: Doodle }) {
  switch (kind) {
    case "star":
      return <path d="M0,-5 L1.5,-1.6 L5,-1.5 L2.3,0.8 L3.2,4.6 L0,2.4 L-3.2,4.6 L-2.3,0.8 L-5,-1.5 L-1.5,-1.6Z" />;
    case "bubble":
      return <path d="M-5.5,-4.5 h11 a1.8,1.8 0 0 1 1.8,1.8 v4 a1.8,1.8 0 0 1 -1.8,1.8 h-6 l-3,2.8 v-2.8 h-2 a1.8,1.8 0 0 1 -1.8,-1.8 v-4 a1.8,1.8 0 0 1 1.8,-1.8z M-2.5,-0.8 h5" />;
    case "calendar":
      return <path d="M-5,-3.5 h10 v8.5 h-10z M-5,-0.6 h10 M-2.4,-5.4 v3 M2.4,-5.4 v3 M-1,2.4 h2" />;
    case "cake":
      return <path d="M-5.5,1 h11 v4.2 h-11z M-3.8,-2.2 h7.6 v3.2 h-7.6z M0,-2.2 v-2.6 M0,-6.6 q0.9,0.9 0,1.6 q-0.9,-0.7 0,-1.6" />;
    case "hearts":
      return (
        <>
          <path d="M-2.8,3.6 C-7.8,0.4 -6.6,-4 -4.2,-3.6 C-3.4,-3.4 -2.8,-2.5 -2.8,-2 C-2.8,-2.5 -2.2,-3.4 -1.4,-3.6 C1,-4 2.2,0.4 -2.8,3.6Z" />
          <path d="M3.2,4.8 C-0.4,2.4 0.4,-0.8 2.2,-0.5 C2.7,-0.4 3.2,0.2 3.2,0.6 C3.2,0.2 3.7,-0.4 4.2,-0.5 C6,-0.8 6.8,2.4 3.2,4.8Z" />
        </>
      );
    case "ball":
      return <path d="M0,-5.2 a4.2,4.2 0 1 1 -0.01,0 M-4.6,4.8 h9.2 l-1.6,-2 h-6z M-1.6,-2.6 q-1,0.8 -0.8,2" />;
    case "hat":
      return <path d="M-5.5,3 Q-2.5,-6.5 4.2,-4.4 L2.6,-1.4 M-6.4,3 h11.6 v2.4 h-11.6z M5.4,-4.6 a1.3,1.3 0 1 1 -0.01,0" />;
    case "flower":
      return <path d="M0,-1 a1.4,1.4 0 1 1 -0.01,0 M0,-5.2 a1.8,1.8 0 1 1 -0.01,0 M3.6,-2.4 a1.8,1.8 0 1 1 -0.01,0 M2.3,1.8 a1.8,1.8 0 1 1 -0.01,0 M-2.3,1.8 a1.8,1.8 0 1 1 -0.01,0 M-3.6,-2.4 a1.8,1.8 0 1 1 -0.01,0" />;
    case "paw":
      return <path d="M0,-0.4 c2.6,0 3.6,2.4 3.2,3.4 c-0.4,1.2 -1.8,1 -3.2,1 c-1.4,0 -2.8,0.2 -3.2,-1 c-0.4,-1 0.6,-3.4 3.2,-3.4z M-3.6,-2.6 a1.1,1.1 0 1 1 -0.01,0 M-1.3,-4.8 a1.1,1.1 0 1 1 -0.01,0 M1.3,-4.8 a1.1,1.1 0 1 1 -0.01,0 M3.6,-2.6 a1.1,1.1 0 1 1 -0.01,0" />;
  }
}

const MINI_W = 56;
const MINI_H = 78; // 5:7
const MINI_STEP = 11; // only the heading strip of the cards behind shows

function MiniColumn({ minis, x, y0, tilt, pencil }: { minis: Mini[]; x: number; y0: number; tilt: number; pencil: string }) {
  return (
    <>
      {minis.map((m, i) => {
        const front = i === minis.length - 1;
        const y = y0 + i * MINI_STEP;
        const rot = (i % 2 === 0 ? -1 : 1) * 1.6 + tilt;
        const jitter = (i % 2 === 0 ? -1 : 1) * 1.5;
        return (
          <g key={m.label} transform={`translate(${x + jitter} ${y}) rotate(${rot} ${MINI_W / 2} ${MINI_H / 2})`}>
            <rect width={MINI_W} height={MINI_H} rx={2} style={{ fill: m.fill }} stroke="none" />
            <rect width={MINI_W} height={MINI_H} rx={2} filter={`url(#${pencil})`} />
            <text
              x={MINI_W / 2}
              y={7.6}
              textAnchor="middle"
              stroke="none"
              style={{ fill: m.ink, fontFamily: "var(--sv-font-sans)", fontWeight: 700, fontSize: 6.2, letterSpacing: 0.15 }}
            >
              {m.label}
            </text>
            {front && (
              <>
                <g transform={`translate(${MINI_W / 2} 34) scale(2.3)`} style={{ stroke: m.ink }} strokeWidth={0.6}>
                  <DoodleMark kind={m.doodle} />
                </g>
                <path d={`M12 56 q8 -2 16 0 t16 0 M14 63 q7 -2 14 0 t14 0`} style={{ stroke: m.ink }} strokeWidth={0.8} opacity={0.7} />
              </>
            )}
          </g>
        );
      })}
    </>
  );
}

export function TemplateSketch() {
  const pencil = usePencilId();
  return (
    <SketchSvg id={pencil}>
      <MiniColumn minis={MINIS_LEFT} x={10} y0={2} tilt={-1.5} pencil={pencil} />
      <MiniColumn minis={MINIS_RIGHT} x={82} y0={2 + MINI_STEP} tilt={1.8} pencil={pencil} />
    </SketchSvg>
  );
}

// ---------- Build My Card: someone at a table drawing a card ----------
export function BuildSketch() {
  const pencil = usePencilId();
  return (
    <SketchSvg id={pencil}>
      {/* the card on its stand: ivory paper, terracotta stripe, gold heart */}
      <g transform="rotate(4 110 62)">
        <rect x={88} y={30} width={44} height={62} rx={2} style={{ fill: C.ivory }} stroke="none" />
        <rect x={88} y={30} width={44} height={5} style={{ fill: C.terracotta }} stroke="none" />
        <path d="M110 76 C96 66 99 52 106 54 C108 54.5 110 57 110 58.5" style={{ fill: C.gold, stroke: C.ink }} strokeWidth={1} />
        <path d="M110 58.5 C110 57 112 54.5 114 54 C121 52 124 66 110 76" style={{ stroke: C.ink }} strokeWidth={1} strokeDasharray="2 2.4" />
        <path d="M97 84 h26" style={{ stroke: C.ink }} strokeWidth={0.8} opacity={0.6} />
      </g>
      <g filter={`url(#${pencil})`}>
        <g transform="rotate(4 110 62)">
          <rect x={88} y={30} width={44} height={62} rx={2} />
        </g>
        {/* stand */}
        <path d="M104 92 L100 98 M120 92 L124 98 M112 36 L126 98" opacity={0.8} />
        {/* table */}
        <path d="M6 98 Q75 96.5 146 98 M8 102.5 L144 102.5 M18 102.5 L15 122 M134 102.5 L137 122" />
        {/* chair */}
        <path d="M10 52 Q12 76 16 86 M12 86 L42 86 M15 86 L12 122 M40 86 L42 104" opacity={0.8} />
        {/* person: head, hair, face */}
        <circle cx={34} cy={36} r={10} />
        <path d="M24.5 34 Q25 22 35 23.5 Q44.5 25 44 33 M27 27 Q31 30 36 28 M29 25 Q34 28 40 26" />
        <path d="M40.5 36.5 v0.4 M39 41 Q41.2 42.6 43.2 40.8" strokeWidth={1.1} />
        {/* body */}
        <path d="M30 46 Q21 60 24 86 M38 46.5 Q46 54 49 66" />
        {/* drawing arm and pencil */}
        <path d="M37 53 Q44 70 53 76 Q64 80 77 73" />
        <path d="M76 70 q4 -1 4 3 q-1 4 -5 3" />
        <path d="M78 76 L92 60 M92 60 l1.8 -2.6 M89 63.4 l2.2 1.6" strokeWidth={1.5} />
        {/* resting arm and lap */}
        <path d="M27 58 Q34 82 58 92 L66 96 M24 86 L56 88" opacity={0.85} />
        {/* scissors on the table */}
        <circle cx={60} cy={94} r={2.4} />
        <circle cx={66} cy={94.6} r={2.4} />
        <path d="M62 92.4 L74 89.6 M64 92.6 L74 92.4" />
        {/* sparkles */}
        <path d="M140 26 v5 M137.5 28.5 h5 M142 70 v4 M140 72 h4" strokeWidth={1.1} />
      </g>
      <g style={{ color: C.gold }} stroke="currentColor" strokeWidth={1.2}>
        <path d="M84 20 v6 M81 23 h6" />
      </g>
    </SketchSvg>
  );
}

// ---------- Community Cards: people taking cards off a shelf ----------
type ShelfCard = { x: number; base: number; fill: string; tilt: number };
const SHELF_CARDS: ShelfCard[] = [
  // top shelf: the first slot is empty, the card is in someone's hand
  { x: 70, base: 38, fill: C.terracotta, tilt: -4 },
  { x: 82, base: 38, fill: C.ivory, tilt: 3 },
  { x: 94, base: 38, fill: C.berry, tilt: -6 },
  // middle shelf
  { x: 56, base: 70, fill: C.gold, tilt: 2 },
  { x: 68, base: 70, fill: C.platinum, tilt: -3 },
  { x: 80, base: 70, fill: C.terracotta, tilt: 5 },
  { x: 93, base: 70, fill: C.ivory, tilt: -2 },
  // bottom shelf
  { x: 58, base: 102, fill: C.berry, tilt: -5 },
  { x: 71, base: 102, fill: C.ivory, tilt: 2 },
  { x: 86, base: 102, fill: C.gold, tilt: -3 },
];

export function CommunitySketch() {
  const pencil = usePencilId();
  return (
    <SketchSvg id={pencil}>
      {SHELF_CARDS.map((c, i) => (
        <g key={i} transform={`rotate(${c.tilt} ${c.x + 5} ${c.base})`}>
          <rect x={c.x} y={c.base - 14} width={10} height={14} rx={1} style={{ fill: c.fill }} stroke="none" />
          <rect x={c.x} y={c.base - 14} width={10} height={14} rx={1} filter={`url(#${pencil})`} strokeWidth={1} />
        </g>
      ))}
      {/* cards in hand */}
      <g transform="rotate(-16 51 22)">
        <rect x={46} y={14} width={10} height={14} rx={1} style={{ fill: C.gold }} stroke="none" />
        <rect x={46} y={14} width={10} height={14} rx={1} filter={`url(#${pencil})`} strokeWidth={1} />
      </g>
      <g transform="rotate(10 118 66)">
        <rect x={112} y={58} width={11} height={15} rx={1} style={{ fill: C.terracotta }} stroke="none" />
        <rect x={112} y={58} width={11} height={15} rx={1} filter={`url(#${pencil})`} strokeWidth={1} />
      </g>
      <g filter={`url(#${pencil})`}>
        {/* shelf */}
        <path d="M51 7 L111 7 M53 7 L53 119 M109 7 L109 119" />
        <path d="M53 38 L109 38 M53 40.5 L109 40.5 M53 70 L109 70 M53 72.5 L109 72.5 M53 102 L109 102 M53 104.5 L109 104.5" />
        <path d="M58 112 l4 -4 M66 112 l4 -4 M74 112 l4 -4 M82 112 l4 -4 M90 112 l4 -4 M98 112 l4 -4" opacity={0.55} strokeWidth={0.9} />
        {/* floor */}
        <path d="M3 119.5 Q75 118 147 119.5" />
        {/* person reaching up */}
        <circle cx={26} cy={31} r={8} />
        <path d="M18.5 29 Q20 21 27 22 Q34 23 34 30 M20 25 l3 3 M24 23 l3 3.4" />
        <path d="M20 43 Q26 39 32 43 L35 80 L17 80 Z" />
        <path d="M31 46 Q39 36 47 26 M47 26 l2.4 -1.6" />
        <path d="M21 46 Q15 60 18 72" />
        <path d="M22 80 L20 117 M17 117 h4 M30 80 L33 117 M33 117 h4" />
        {/* person reading their card */}
        <circle cx={130} cy={44} r={7.5} />
        <path d="M130 36.5 a3.4 3.4 0 1 1 -0.01 0 M123 42 Q124 36.5 130 36.5 Q136.5 37 137.4 43" />
        <path d="M125.5 47.8 v0.3" strokeWidth={1.2} />
        <path d="M123 56 Q130 51.5 137 56 L140 92 L120 92 Z" />
        <path d="M124 60 Q115 66 119 71 M136 60 Q128 70 122 71" />
        <path d="M126 92 L124 117 M120.5 117 h4 M134 92 L137 117 M137 117 h4" />
      </g>
    </SketchSvg>
  );
}

// ---------- Saved Cards & Songs: someone taking a card out of an open safe ----------
// A heavy safe (thick walls, top edge, feet) with its door swung open on two
// gold hinges: the door shows its thickness and locking bolts, a silver
// combination dial with tick marks and a pointer, and a spoked handle wheel.
// Drawn for an espresso panel, so nothing that sits on the panel uses C.ink.
type SafeCard = { x: number; base: number; fill: string; tilt: number };
const SAFE_CARDS: SafeCard[] = [
  // top shelf: a gap on the left, where the card in the person's hand came from
  { x: 70, base: 57, fill: C.ivory, tilt: 3 },
  { x: 80, base: 57, fill: C.berry, tilt: -4 },
  { x: 90, base: 57, fill: C.terracotta, tilt: 2 },
  // middle shelf
  { x: 58, base: 81, fill: C.terracotta, tilt: -3 },
  { x: 68, base: 81, fill: C.gold, tilt: 2 },
  { x: 78, base: 81, fill: C.ivory, tilt: -2 },
  { x: 89, base: 81, fill: C.platinum, tilt: 4 },
];
// bottom shelf: a little stack of cards lying flat
const SAFE_STACK = [
  { y: 101.5, fill: C.terracotta },
  { y: 98, fill: C.ivory },
  { y: 94.5, fill: C.gold },
];
// combination dial on the door (an ellipse: the door is turned toward us)
const DIAL = { cx: 127, cy: 60, rx: 8.2, ry: 9.6 };
const DIAL_TICKS = Array.from({ length: 12 }, (_, k) => {
  const a = (k * Math.PI) / 6;
  const inner = k % 3 === 0 ? 0.62 : 0.74;
  const pt = (f: number) => `${(DIAL.cx + DIAL.rx * f * Math.sin(a)).toFixed(2)} ${(DIAL.cy - DIAL.ry * f * Math.cos(a)).toFixed(2)}`;
  return `M${pt(inner)} L${pt(0.92)}`;
}).join(" ");
// handle wheel below the dial: three spokes with round grips
const WHEEL = { cx: 127, cy: 87 };
const WHEEL_SPOKES = [90, 210, 330].map((deg) => {
  const a = (deg * Math.PI) / 180;
  return { x: WHEEL.cx + 7 * Math.cos(a), y: WHEEL.cy - 7.6 * Math.sin(a) };
});

export function SavedSketch() {
  const pencil = usePencilId();
  return (
    <SketchSvg id={pencil}>
      {/* solid walls of the safe and the door face, in light card stock */}
      <path d="M50 30 L110 30 L110 112 L50 112 Z M56 36 L56 106 L104 106 L104 36 Z" style={{ fill: C.oat }} stroke="none" opacity={0.22} fillRule="evenodd" />
      <path d="M50 30 L55 25 L114 25 L110 30 Z" style={{ fill: C.oat }} stroke="none" opacity={0.32} />
      <path d="M110 31 L142 37 L142 107 L110 111 Z" style={{ fill: C.oat }} stroke="none" opacity={0.3} />
      <path d="M142 37 L146 39 L146 105 L142 107 Z" style={{ fill: C.oat }} stroke="none" opacity={0.5} />
      {SAFE_CARDS.map((c, i) => (
        <g key={i} transform={`rotate(${c.tilt} ${c.x + 4} ${c.base})`}>
          <rect x={c.x} y={c.base - 12} width={8} height={12} rx={1} style={{ fill: c.fill }} stroke="none" />
          <rect x={c.x} y={c.base - 12} width={8} height={12} rx={1} filter={`url(#${pencil})`} strokeWidth={1} />
        </g>
      ))}
      {SAFE_STACK.map((c, i) => (
        <g key={i}>
          <rect x={59} y={c.y} width={20} height={3.5} rx={0.8} style={{ fill: c.fill }} stroke="none" />
          <rect x={59} y={c.y} width={20} height={3.5} rx={0.8} filter={`url(#${pencil})`} strokeWidth={0.9} />
        </g>
      ))}
      {/* a record among the cards, for the songs */}
      <circle cx={93} cy={99.5} r={5.4} style={{ fill: C.berry }} stroke="none" />
      <circle cx={93} cy={99.5} r={1.8} style={{ fill: C.gold }} stroke="none" />
      {/* gold hinges, silver dial */}
      <rect x={107.5} y={42} width={5} height={8} rx={1.5} style={{ fill: C.gold }} stroke="none" />
      <rect x={107.5} y={92} width={5} height={8} rx={1.5} style={{ fill: C.gold }} stroke="none" />
      <ellipse cx={DIAL.cx} cy={DIAL.cy} rx={DIAL.rx} ry={DIAL.ry} style={{ fill: C.platinum }} stroke="none" />
      <ellipse cx={DIAL.cx} cy={DIAL.cy} rx={2.6} ry={3} style={{ fill: C.ink }} stroke="none" />
      <g style={{ stroke: C.ink }} strokeWidth={0.8}>
        <path d={DIAL_TICKS} />
      </g>
      {/* the card in hand, just pulled out */}
      <g transform="rotate(-14 47 50)">
        <rect x={42} y={42} width={10} height={14} rx={1} style={{ fill: C.gold }} stroke="none" />
        <rect x={42} y={42} width={10} height={14} rx={1} filter={`url(#${pencil})`} strokeWidth={1} />
      </g>
      <g filter={`url(#${pencil})`}>
        {/* safe: outer body, top edge, inner opening (thick walls), shelves, feet, corner rivets */}
        <path d="M50 30 L110 30 L110 112 L50 112 Z" strokeWidth={1.5} />
        <path d="M50 30 L55 25 L114 25 L110 30" />
        <path d="M56 36 L104 36 L104 106 L56 106 Z" />
        <path d="M56 58 L104 58 M56 82 L104 82" />
        <path d="M54 112 L54 117 L63 117 L63 112 M97 112 L97 117 L106 117 L106 112" />
        <path d="M52.6 32.8 v0.3 M107.4 32.8 v0.3 M52.6 109 v0.3 M107.4 109 v0.3" strokeWidth={1.8} />
        <circle cx={93} cy={99.5} r={5.4} strokeWidth={1} />
        {/* door: face, thickness, locking bolts on its edge */}
        <path d="M110 31 L142 37 L142 107 L110 111 Z" strokeWidth={1.5} />
        <path d="M142 37 L146 39 L146 105 L142 107" />
        <path d="M146 50 h3 M146 72 h3 M146 94 h3" strokeWidth={2.2} />
        <path d="M114 41 L138 45.5 L138 101 L114 104 Z" opacity={0.6} strokeWidth={0.9} />
        {/* hinges */}
        <rect x={107.5} y={42} width={5} height={8} rx={1.5} strokeWidth={1} />
        <rect x={107.5} y={92} width={5} height={8} rx={1.5} strokeWidth={1} />
        {/* combination dial: ring, knob, pointer above it */}
        <ellipse cx={DIAL.cx} cy={DIAL.cy} rx={DIAL.rx} ry={DIAL.ry} strokeWidth={1.3} />
        <path d={`M${DIAL.cx - 2} ${DIAL.cy - DIAL.ry - 3.4} L${DIAL.cx + 2} ${DIAL.cy - DIAL.ry - 3.4} L${DIAL.cx} ${DIAL.cy - DIAL.ry - 0.6} Z`} strokeWidth={1} />
        {/* handle wheel */}
        <circle cx={WHEEL.cx} cy={WHEEL.cy} r={2.2} />
        {WHEEL_SPOKES.map((s, i) => (
          <g key={i}>
            <path d={`M${WHEEL.cx} ${WHEEL.cy} L${s.x.toFixed(2)} ${s.y.toFixed(2)}`} strokeWidth={1.4} />
            <circle cx={s.x} cy={s.y} r={1.6} />
          </g>
        ))}
        {/* floor */}
        <path d="M3 119.5 Q75 118 147 119.5" />
        {/* person: head, hair, smile */}
        <circle cx={20} cy={40} r={8} />
        <path d="M12.2 38 Q13 29.5 21 30.4 Q28.4 31.4 28.2 38.6 M14 33 l3 3 M18 31 l3 3.4" />
        <path d="M23 43.2 Q25 44.6 26.6 43" strokeWidth={1.1} />
        {/* body */}
        <path d="M14 52 Q20 48 26 52 L29 88 L11 88 Z" />
        {/* arm reaching out with the card */}
        <path d="M25 56 Q34 60 43 54" />
        <path d="M42.5 51.5 q3 0.6 2.4 3.4" />
        {/* other arm, legs */}
        <path d="M15 56 Q8 68 11 80" />
        <path d="M16 88 L14 117 M10.5 117 h4 M24 88 L26 117 M26 117 h4" />
        {/* sparkles */}
        <path d="M36 32 v4 M34 36 h4 M142 16 v5 M139.5 18.5 h5" strokeWidth={1.1} />
      </g>
      <g style={{ color: C.gold }} stroke="currentColor" strokeWidth={1.2}>
        <path d="M44 25 v6 M41 28 h6" />
      </g>
    </SketchSvg>
  );
}
