"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthProvider";
import { SIGNED_IN_HOLD_STYLE_ID } from "./signedInHold";

/**
 * On the public landing page (`/`): once a sign-in is confirmed, move the
 * user to their home (`/home`). Signed-out visitors and crawlers stay on `/`.
 * Also lifts the signed-in hold (see signedInHold.ts) when the stored sign-in
 * turns out to be invalid, and when leaving the page.
 */
export function SignedInRedirect() {
  const router = useRouter();
  const { status } = useAuth();

  React.useEffect(() => {
    if (status === "authenticated") router.replace("/home");
    else if (status !== "loading") document.getElementById(SIGNED_IN_HOLD_STYLE_ID)?.remove();
  }, [router, status]);

  React.useEffect(() => () => document.getElementById(SIGNED_IN_HOLD_STYLE_ID)?.remove(), []);

  return null;
}
