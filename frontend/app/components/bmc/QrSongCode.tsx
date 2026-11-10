"use client";

import * as React from "react";
import type QRCodeLib from "qrcode";
import { SITE_URL } from "../../lib/site";

/**
 * The song QR code printed inside the card, styled as the Souvenote logo:
 * round forest dots, rounded corner markers, and a large forest tile with the
 * gold S in the middle. "Scan me" sits above and "To Play Song" below.
 *
 * Scannability, checked by rendering and decoding (jsQR) at 120 to 800px:
 * error correction H, version 5 or larger, touching round dots (r = 0.5),
 * a logo tile about 30% of the width, forest on paper, and a 4-module quiet
 * zone. Smaller dots (r 0.43) did not decode reliably. Test-print and scan on
 * real phones before launch.
 *
 * The real code is generated in the print layout from the card's stable song
 * page. Here `href` defaults to a preview address and the code is labelled as
 * a preview.
 *
 * The qrcode library (about 12 kB gzipped) loads only when a code is shown (Prompt 2
 * flows E-F3, 2026-11-09). Until then the same-sized paper square holds its place,
 * so nothing shifts.
 */
export function QrSongCode({ href = `${SITE_URL}/s/preview`, preview = true, size = 200 }: { href?: string; preview?: boolean; size?: number }) {
  const [lib, setLib] = React.useState<typeof QRCodeLib | null>(null);
  React.useEffect(() => {
    let live = true;
    void import("qrcode").then((mod) => { if (live) setLib(mod.default ?? mod); });
    return () => { live = false; };
  }, []);

  const code = React.useMemo(() => {
    if (!lib) return null;
    const QRCode = lib;
    // At least version 5 (37 modules) so the logo can be large; longer addresses grow the code.
    let qr: ReturnType<typeof QRCode.create>;
    try { qr = QRCode.create(href, { errorCorrectionLevel: "H", version: 5 }); } catch { qr = QRCode.create(href, { errorCorrectionLevel: "H" }); }
    const n = qr.modules.size;
    // About 30% of the width, rounded down to an odd number so the logo sits centred on the grid.
    let t = Math.floor(n * 0.3);
    if (t % 2 === 0) t -= 1;
    const start = (n - t) / 2;
    const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
    const underLogo = (x: number, y: number) => x >= start - 0.5 && x < start + t + 0.5 && y >= start - 0.5 && y < start + t + 0.5;
    const cells: [number, number][] = [];
    for (let y = 0; y < n; y += 1) {
      for (let x = 0; x < n; x += 1) {
        if (qr.modules.get(x, y) && !inFinder(x, y) && !underLogo(x, y)) cells.push([x, y]);
      }
    }
    return { count: n, dots: cells, tile: { start, size: t } };
  }, [href, lib]);

  const quiet = 4;
  // Version 5 is 37 modules: the placeholder uses the same box as most codes.
  const count = code?.count ?? 37;
  const total = count + quiet * 2;
  const finders: [number, number][] = [[0, 0], [count - 7, 0], [0, count - 7]];

  return (
    <figure className="bmcq-qr" aria-label={preview ? "Preview of the song QR code printed inside your card" : "Song QR code"}>
      <figcaption className="bmcq-qr-top">Scan me</figcaption>
      <svg viewBox={`0 0 ${total} ${total}`} width={size} height={size} role="img" aria-label="QR code in the shape of the Souvenote logo" aria-busy={!code || undefined}>
        <rect width={total} height={total} rx={2} fill="#FFFAF3" />
        {code && (
          <>
            <g fill="#2F3E3B">
              {code.dots.map(([x, y]) => <circle key={`${x}-${y}`} cx={x + quiet + 0.5} cy={y + quiet + 0.5} r={0.5} />)}
            </g>
            {finders.map(([fx, fy]) => (
              <g key={`${fx}-${fy}`} transform={`translate(${fx + quiet} ${fy + quiet})`}>
                <rect x={0.5} y={0.5} width={6} height={6} rx={1.8} fill="none" stroke="#2F3E3B" strokeWidth={1} />
                <rect x={2} y={2} width={3} height={3} rx={0.9} fill="#2F3E3B" />
              </g>
            ))}
            <rect x={code.tile.start + quiet} y={code.tile.start + quiet} width={code.tile.size} height={code.tile.size} rx={code.tile.size * 0.24} fill="#2F3E3B" />
            <image href="/assets/logomark-gold-silver.png" x={code.tile.start + quiet + code.tile.size * 0.18} y={code.tile.start + quiet + code.tile.size * 0.1}
              width={code.tile.size * 0.64} height={code.tile.size * 0.8} preserveAspectRatio="xMidYMid meet" />
          </>
        )}
      </svg>
      <span className="bmcq-qr-bottom">To Play Song</span>
      {preview && <span className="bmcq-qr-note">Preview · your card gets its own code</span>}
    </figure>
  );
}
