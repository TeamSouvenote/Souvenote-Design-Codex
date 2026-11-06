import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/site";

// Public pages meant to be found in search and cited by AI answer engines.
// /community-cards is left out while it is a noindex "coming soon"
// placeholder; add it here when the page goes live and drops noindex.
const PATHS = [
  "/",
  "/pricing",
  "/faq",
  "/contact",
  "/legal/privacy-policy",
  "/legal/terms-of-service",
  "/legal/refund-policy",
  "/legal/cookie-policy",
  "/signup",
  "/login",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({ url: `${SITE_URL}${path}` }));
}
