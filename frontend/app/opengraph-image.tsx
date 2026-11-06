import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SHARE_IMAGE } from "./lib/site";

// Site-wide share image (Open Graph / link previews), generated at build time.
// The landing page's hero card art is portrait, so it is composed onto a
// 1200x630 ivory canvas instead of being cropped by each platform. The gold
// wordmark sits on forest, per the design system's logo rule.
export const alt = SHARE_IMAGE.alt;
export const size = { width: SHARE_IMAGE.width, height: SHARE_IMAGE.height };
export const contentType = "image/png";

const CARD_HEIGHT = 540;
const CARD_WIDTH = Math.round((CARD_HEIGHT * 1488) / 2096);

async function assetDataUrl(file: string, mime: string) {
  const bytes = await readFile(join(process.cwd(), "public", "assets", file));
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

export default async function OpengraphImage() {
  const [card, wordmark] = await Promise.all([
    assetDataUrl("pt-comic-cover.jpg", "image/jpeg"),
    assetDataUrl("wordmark-gold.png", "image/png"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 96,
          backgroundColor: "#F7F0E8",
          backgroundImage:
            "radial-gradient(circle at 88% 8%, rgba(201,138,118,0.28), transparent 55%), radial-gradient(circle at 6% 92%, rgba(216,182,90,0.22), transparent 55%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "34px 48px",
            background: "#2F3E3B",
            borderRadius: 28,
            boxShadow: "0 18px 40px rgba(74,59,57,0.18)",
          }}
        >
          <img src={wordmark} width={450} height={104} alt="" />
        </div>
        <img
          src={card}
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
          alt=""
          style={{ borderRadius: 16, boxShadow: "0 24px 48px rgba(74,59,57,0.28)" }}
        />
      </div>
    ),
    size,
  );
}
