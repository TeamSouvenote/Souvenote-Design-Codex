// The app works out the star sign from the birth month and day (owner,
// 2026-11-08): Haiku never decides it. Tropical sun-sign dates; the year
// isn't needed.

export type ZodiacSign = {
  id: string;
  name: string;
  symbol: string;
  /** Short, positive associations used to tailor suggestions. Never presented as fact about the person. */
  themes: string[];
  element: "fire" | "earth" | "air" | "water";
};

const SIGNS: (ZodiacSign & { from: [number, number] })[] = [
  { id: "capricorn", name: "Capricorn", symbol: "a sea-goat", themes: ["steady ambition", "mountain peaks", "quiet determination"], element: "earth", from: [12, 22] },
  { id: "aquarius", name: "Aquarius", symbol: "a water-bearer", themes: ["big ideas", "starlit skies", "kind originality"], element: "air", from: [1, 20] },
  { id: "pisces", name: "Pisces", symbol: "two fish", themes: ["imagination", "the sea", "little wonders"], element: "water", from: [2, 19] },
  { id: "aries", name: "Aries", symbol: "a ram", themes: ["bold starts", "bright energy", "fearless fun"], element: "fire", from: [3, 21] },
  { id: "taurus", name: "Taurus", symbol: "a bull", themes: ["comfort", "gardens in bloom", "good food"], element: "earth", from: [4, 20] },
  { id: "gemini", name: "Gemini", symbol: "twins", themes: ["curiosity", "great conversation", "playful wit"], element: "air", from: [5, 21] },
  { id: "cancer", name: "Cancer", symbol: "a crab", themes: ["home", "moonlight", "big-hearted care"], element: "water", from: [6, 21] },
  { id: "leo", name: "Leo", symbol: "a lion", themes: ["sunshine", "warm-hearted confidence", "the spotlight"], element: "fire", from: [7, 23] },
  { id: "virgo", name: "Virgo", symbol: "a maiden with wheat", themes: ["thoughtful care", "harvest fields", "small details"], element: "earth", from: [8, 23] },
  { id: "libra", name: "Libra", symbol: "balanced scales", themes: ["harmony", "beautiful things", "fairness"], element: "air", from: [9, 23] },
  { id: "scorpio", name: "Scorpio", symbol: "a scorpion", themes: ["deep loyalty", "midnight colours", "quiet strength"], element: "water", from: [10, 23] },
  { id: "sagittarius", name: "Sagittarius", symbol: "an archer", themes: ["adventure", "far horizons", "big laughs"], element: "fire", from: [11, 22] },
];

/** Reads "YYYY-MM-DD" or "--MM-DD". Returns null when the month or day is missing or impossible. */
export function monthDay(value: string | null | undefined): [number, number] | null {
  const match = (value || "").match(/^(?:\d{4}|-)-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  if (month < 1 || month > 12 || day < 1 || day > new Date(2024, month, 0).getDate()) return null;
  return [month, day];
}

export function signFor(date: string | null | undefined): ZodiacSign | null {
  const md = monthDay(date);
  if (!md) return null;
  const [month, day] = md;
  // Walk the start dates in calendar order; the last one on or before the date wins.
  const ordered = [...SIGNS].sort((a, b) => a.from[0] - b.from[0] || a.from[1] - b.from[1]);
  let found = ordered[ordered.length - 1]; // Before Jan 20 is still Capricorn.
  for (const sign of ordered) {
    if (month > sign.from[0] || (month === sign.from[0] && day >= sign.from[1])) found = sign;
  }
  const { from: _from, ...sign } = found;
  void _from;
  return sign;
}
