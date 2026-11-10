"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { BMC_COMMUNITY_EVENT } from "./community";

/**
 * Top of Build My Card: the same title the Welcome modal and Create Options
 * show for this option. The page reads it from createOptions.ts on the server
 * and passes the words in, so that file stays out of the browser bundle.
 * Coming from Community Cards ("Build a card for the Community", ?for=community)
 * it says so instead (owner, 2026-11-09).
 *
 * ?for= is read here, in the browser, so the page itself stays static and its
 * metadata (description, noindex) is in the server HTML (Community Cards audit
 * C4). The page wraps this in Suspense with `BmcPageHeadingStatic` as the
 * fallback. A saved community draft (no ?for= in its link) fires
 * BMC_COMMUNITY_EVENT when it opens (BuildMyCardClient), and the title follows.
 */
type Words = { first: string; rest: string };

export function BmcPageHeading(words: Words) {
  const fromQuery = useSearchParams().get("for") === "community";
  const [fromDraft, setFromDraft] = React.useState(false);
  React.useEffect(() => {
    const on = () => setFromDraft(true);
    window.addEventListener(BMC_COMMUNITY_EVENT, on);
    return () => window.removeEventListener(BMC_COMMUNITY_EVENT, on);
  }, []);
  return <BmcPageHeadingStatic {...words} community={fromQuery || fromDraft} />;
}

export function BmcPageHeadingStatic({ first, rest, community = false }: Words & { community?: boolean }) {
  return (
    <header className="bmcq-page-head">
      {community
        ? <p className="bmcq-page-title">Build a card for the <span className="l-script">Community</span></p>
        : <p className="bmcq-page-title">{first} <span className="l-script">{rest}</span></p>}
    </header>
  );
}
