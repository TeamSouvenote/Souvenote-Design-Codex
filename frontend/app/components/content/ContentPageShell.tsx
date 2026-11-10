import type { ReactNode } from "react";
import { FlowPageShell } from "../flow/FlowPageShell";
import "../../styles/content-pages.css";

// Page shell for the berry & ivory content and account screens (FAQ, Contact,
// legal, Community Cards, Saved Cards & Songs, Profile, Settings, not found).
// Same nav, backdrop, skip link, footer and page-head type as Cart, Delivery and
// Pricing (FlowPageShell + the .cf-* head in checkout-flow.css), plus the
// content-page pieces in content-pages.css (scoped under .souv-content).
// Indexing is set per route (layout.tsx / metadata), not here.
export function ContentPageShell({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <FlowPageShell className={`souv-content ${className}`.trim()}>
      {children}
    </FlowPageShell>
  );
}

/**
 * The page's one h1 and lede. `title` carries one Lobster Two phrase as
 * <span className="l-script"> (design system: one accent per heading). No
 * eyebrow or breadcrumb label above the h1 (design system: page headers).
 */
export function ContentPageHead({
  title,
  lede,
  titleId,
}: {
  title: ReactNode;
  lede?: ReactNode;
  titleId?: string;
}) {
  return (
    <header className="cf-head">
      <h1 id={titleId} className="cf-title">{title}</h1>
      {lede && <p className="cf-lede">{lede}</p>}
    </header>
  );
}
