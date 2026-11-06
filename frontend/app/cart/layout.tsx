import type { Metadata } from "next";
import { NOINDEX } from "../lib/site";

// Signed-in screens: keep them (and anything user-specific) out of search and AI answers.
export const metadata: Metadata = { robots: NOINDEX };

export default function SignedInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
