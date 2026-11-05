import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/site";

// Everything stays crawlable: pages that must not appear in search or AI
// answers say so with a `noindex` robots meta tag, which crawlers can only
// read if they are allowed to fetch the page.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
