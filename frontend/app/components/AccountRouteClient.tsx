"use client";

import * as React from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

// Sign-in gate for the account screens (Profile, Settings). The page shell
// (ContentPageShell) comes from the route; this only swaps the content for a
// log-in prompt when nobody is signed in.
export function AccountRouteClient({ children }: { children: ReactNode }) {
  const auth = useAuth();
  // Once the account is showing, keep it mounted while the sign-in is
  // re-checked (e.g. refreshUser after a save sets status to "loading"), so
  // the open section and any "saved" message survive. Only a sign-in that is
  // gone or rejected swaps it for the prompt.
  // State set in an effect, not a ref written during render (audit P6).
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    if (auth.status === "authenticated") setShown(true);
    else if (auth.status !== "loading") setShown(false);
  }, [auth.status]);
  const showAccount = auth.status === "authenticated" || (auth.status === "loading" && shown);

  if (showAccount) return <>{children}</>;

  return (
    <div className="cf-wrap acc2-wrap">
      <section className="acc2-gate" aria-labelledby="acc-gate-title" aria-busy={auth.status === "loading"}>
        {/* While the sign-in is checked, a neutral heading: "Log in to see…" flashed
            for signed-in customers before their account appeared (audit I5). */}
        <h1 id="acc-gate-title" className="cf-title">
          {auth.status === "loading" ? <>Opening your <span className="l-script">account</span></> : <>Log in to see your <span className="l-script">account</span></>}
        </h1>
        <p className="cf-lede">
          {auth.status === "loading"
            ? "One moment while we check your sign-in."
            : "Your saved cards, credits and account details are kept private to you."}
        </p>
        {auth.status !== "loading" && (
          <div className="acc2-gate-actions">
            <Link className="l-btn l-btn-primary" href="/login">Log In</Link>
            <Link className="l-btn l-btn-secondary" href="/signup">Sign Up</Link>
          </div>
        )}
      </section>
    </div>
  );
}
