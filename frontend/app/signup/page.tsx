import type { Metadata } from "next";
import { AuthRoute, type AuthSearchParams } from "../components/AuthRoute";
import { openGraphFor } from "../lib/site";

const TITLE = "Sign up | Souvenote";
const DESCRIPTION =
  "Create your Souvenote account and claim 2 free credits to design a personalized card with an original song.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/signup" },
  openGraph: openGraphFor("/signup", TITLE, DESCRIPTION),
};

export default function AuthPage({ searchParams }: { searchParams: AuthSearchParams }) {
  return <AuthRoute initialState="signup" searchParams={searchParams} />;
}
