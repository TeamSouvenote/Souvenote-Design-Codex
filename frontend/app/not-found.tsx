import type { Metadata } from "next";
import { ContentPageHead, ContentPageShell } from "./components/content/ContentPageShell";
import { NotFoundActions } from "./components/content/NotFoundActions";

// One branded screen for every address that doesn't exist (served with a 404
// status by Next.js): mistyped URLs, old bookmarks, unknown legal slugs.
// Deliberately names no particular page or feature. Next.js adds the
// `noindex` robots tag to not-found responses itself, so it isn't repeated here.
export const metadata: Metadata = {
  title: "Page not found | Souvenote",
};

export default function NotFound() {
  return (
    <ContentPageShell className="souv-not-found">
      <div className="cf-wrap nf-wrap">
        <section className="nf-card" aria-labelledby="nf-title">
          <ContentPageHead
            titleId="nf-title"
            title={<>We couldn&apos;t find <span className="l-script">that page</span></>}
            lede="It may have moved, or the link may be mistyped."
          />
          <NotFoundActions />
        </section>
      </div>
    </ContentPageShell>
  );
}
