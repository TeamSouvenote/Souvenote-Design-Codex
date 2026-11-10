// Security headers (audit E2, owner 2026-11-09) and image formats (audit E5).
//
// The Content-Security-Policy is REPORT-ONLY for now: browsers log what it would
// block, nothing is blocked. Scripts need 'unsafe-inline' because Next puts its own
// inline scripts on every page (they change per page and per build, so they can't be
// hashed). The next step, a nonce through middleware, would make every page dynamic,
// which is an owner decision. See PROMPT-2-REPORT-2026-11-09.md, Part E.
//
// If the site is served through a CDN (CloudFront), set the same headers there too:
// headers() only applies to responses that Next itself serves.

const isProd = process.env.NODE_ENV === "production";
const PRODUCTION_URL = "https://souvenote.com";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_URL).replace(/\/+$/, "");
const SITE_INDEXABLE = SITE_URL === PRODUCTION_URL && process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "false";

/** "https://x.y/path" or "x.y" -> "https://x.y"; "" when unset or invalid. */
function origin(value) {
  if (!value) return "";
  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`).origin;
  } catch {
    return "";
  }
}

const API = origin(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api");
const COGNITO_IDP = `https://cognito-idp.${process.env.NEXT_PUBLIC_COGNITO_REGION || "ca-central-1"}.amazonaws.com`;
const COGNITO_UI = origin(process.env.NEXT_PUBLIC_COGNITO_DOMAIN);
// Where card art and songs will be stored (S3/CloudFront). Not decided yet: set it then.
const ASSETS = origin(process.env.NEXT_PUBLIC_ASSET_ORIGIN);
// Add when they're connected: Stripe (script-src/frame-src https://js.stripe.com,
// connect-src https://api.stripe.com, frame-src https://hooks.stripe.com) and PostHog.

const join = (...parts) => parts.filter(Boolean).join(" ");

const csp = [
  "default-src 'self'",
  join("script-src 'self' 'unsafe-inline'", isProd ? "" : "'unsafe-eval'"),
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  join("img-src 'self' data: blob:", ASSETS),
  join("media-src 'self' blob:", ASSETS),
  join("connect-src 'self'", API, COGNITO_IDP, COGNITO_UI, isProd ? "" : "ws:"),
  "frame-src 'none'",
  // Only this site may frame its pages (stops clickjacking by other sites; same-origin
  // framing is harmless and keeps the QA tools working).
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  join("form-action 'self'", COGNITO_UI),
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  // upgrade-insecure-requests goes in when the policy is enforced: browsers ignore it in a
  // report-only policy and log an error, which Lighthouse counts against best practices.
].filter(Boolean).join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), usb=(), browsing-topics=(), payment=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // HSTS only in production (browsers ignore it over plain http anyway). No "preload" yet:
  // that's hard to undo, so add it once every subdomain is on https.
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
  // Staging and preview deploys stay out of search (audit E7). Same rule as
  // SITE_INDEXABLE in app/lib/site.ts: only the live origin may be indexed.
  ...(SITE_INDEXABLE ? [] : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
