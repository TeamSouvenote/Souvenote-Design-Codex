"use client";

import { useAuth } from "../AuthProvider";
import { useCreditBalance } from "../../lib/creditBalance";

/**
 * "You have N credit(s)": the signed-in user's live credit balance, under the
 * Home hero and the Create Options heading. Empty while the balance loads, if
 * it can't be fetched (the nav's tooltip says so then), or when nobody is signed in. The paragraph always renders
 * so the layout doesn't jump, and screen readers hear the balance once it arrives.
 */
export function CreditsLine() {
  const auth = useAuth();
  const signedIn = auth.status === "authenticated";
  const { balance, status } = useCreditBalance({ enabled: signedIn, userId: auth.user?.id });
  const text = signedIn && status === "ready"
    ? `You have ${balance} ${balance === 1 ? "credit" : "credits"}`
    : "";

  return (
    <p className="l-hero-trial l-hero-balance l-hero-note" aria-live="polite">
      {text}
    </p>
  );
}
