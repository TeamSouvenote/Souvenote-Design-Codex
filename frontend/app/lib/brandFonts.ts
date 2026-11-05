import { Lato, Lobster_Two, Patrick_Hand } from "next/font/google";

// Berry & ivory design-system fonts (design-system/docs/01-foundations.md):
// Lato (light headlines, regular body, bold spaced labels) + thin Lobster Two accents.
// Shared by every screen on the system so the font files are declared once.
const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-lato",
  display: "swap",
});

const lobsterTwo = Lobster_Two({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal"],
  variable: "--font-lobster-two",
  display: "swap",
});

/** Class names that expose `--font-lato` and `--font-lobster-two` to a subtree. */
export const brandFontVariables = `${lato.variable} ${lobsterTwo.variable}`;

// Patrick Hand: pencil-style handwriting for the Welcome modal's card explanations.
// Kept separate so only the Welcome modal loads it.
const patrickHand = Patrick_Hand({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-hand",
  display: "swap",
});

/** Class name that exposes `--font-hand` (Patrick Hand) to a subtree. */
export const handFontVariable = patrickHand.variable;
