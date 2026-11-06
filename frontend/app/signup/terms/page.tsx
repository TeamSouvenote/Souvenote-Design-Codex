import type { Metadata } from "next";
import { AuthRoute, type AuthSearchParams } from "../../components/AuthRoute";
import { NOINDEX } from "../../lib/site";

// One-time Terms step after a first social sign-in (see TERMS_CONSENT_PATH).
export const metadata: Metadata = { title: "Before you start | Souvenote", robots: NOINDEX };

export default function AuthPage({ searchParams }: { searchParams: AuthSearchParams }) {
  return <AuthRoute initialState="terms" searchParams={searchParams} />;
}
