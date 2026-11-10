import type { MetadataRoute } from "next";
import { SITE_INDEXABLE, SITE_URL } from "./lib/site";

// Everything stays crawlable: pages that must not appear in search or AI
// answers say so with a `noindex` robots meta tag, which crawlers can only
// read if they are allowed to fetch the page.
// A staging or preview deploy (SITE_INDEXABLE false) disallows everything (audit E7).
// No `host` line: it isn't part of the robots standard (audit E11).
export default function robots(): MetadataRoute.Robots {
  if (!SITE_INDEXABLE) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
