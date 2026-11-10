import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/site";
import { COMMUNITY_CARDS, communityCardPath } from "./components/community/catalog";

// Public pages meant to be found in search and cited by AI answer engines.
const PATHS = [
  "/",
  "/pricing",
  "/community-cards",
  "/faq",
  "/contact",
  "/legal/privacy-policy",
  "/legal/terms-of-service",
  "/legal/refund-policy",
  "/legal/cookie-policy",
  "/signup",
  "/login",
];

// lastModified: the build date, so search engines see when the pages were last
// published (audit E11). Each Community Card's own page is listed too (Community
// Cards audit C11); the renamed cards' old ids aren't, as they canonicalise to the new ones.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const cards = COMMUNITY_CARDS.map((card) => communityCardPath(card));
  return [...PATHS, ...cards].map((path) => ({ url: `${SITE_URL}${path}`, lastModified }));
}
