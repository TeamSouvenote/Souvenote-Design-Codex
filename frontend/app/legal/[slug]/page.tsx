import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPageShell } from "../../components/content/ContentPageShell";
import { LegalDocument } from "../../components/legal/LegalDocument";
import { LEGAL_DOCS, LEGAL_SLUGS, type LegalSlug } from "../../components/legal/legalDocs";
import { openGraphFor } from "../../lib/site";

type LegalRouteParams = { slug: string };
type LegalSlugPageProps = { params: Promise<LegalRouteParams> };

// Public pages: indexed and in the sitemap, each with its own title,
// description and canonical address. Only the four policies exist; any other
// slug is a real 404 (the branded not-found page).
export const dynamicParams = false;

export function generateStaticParams(): LegalRouteParams[] {
  return LEGAL_SLUGS.map((slug) => ({ slug }));
}

function docFor(slug: string) {
  return LEGAL_SLUGS.includes(slug as LegalSlug) ? LEGAL_DOCS[slug as LegalSlug] : null;
}

export async function generateMetadata({ params }: LegalSlugPageProps): Promise<Metadata> {
  const doc = docFor((await params).slug);
  if (!doc) return {};
  return {
    title: `${doc.lead} ${doc.accent} | Souvenote`,
    description: doc.description,
    alternates: { canonical: `/legal/${doc.slug}` },
    openGraph: openGraphFor(`/legal/${doc.slug}`, `${doc.lead} ${doc.accent} | Souvenote`, doc.description),
  };
}

export default async function LegalSlugPage({ params }: LegalSlugPageProps) {
  const doc = docFor((await params).slug);
  if (!doc) notFound();
  return (
    <ContentPageShell className="souv-legal">
      <LegalDocument doc={doc} />
    </ContentPageShell>
  );
}
