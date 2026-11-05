"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthProvider";

/**
 * On the signed-in home (`/home`): if the sign-in can't be confirmed (none
 * stored, expired or rejected), send the visitor to the public landing page
 * (`/`). /home is only for signed-in users. See also SIGNED_OUT_REDIRECT_SCRIPT,
 * which does the same before paint when nothing is stored at all.
 */
export function SignedOutRedirect() {
  const router = useRouter();
  const { status } = useAuth();

  React.useEffect(() => {
    if (status === "unauthenticated" || status === "error") router.replace("/");
  }, [router, status]);

  return null;
}
