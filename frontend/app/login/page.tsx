import type { Metadata } from "next";
import { AuthRoute, type AuthSearchParams } from "../components/AuthRoute";
import { openGraphFor } from "../lib/site";

const TITLE = "Log in | Souvenote";
const DESCRIPTION =
  "Log in to Souvenote to get back to your saved cards and songs.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/login" },
  openGraph: openGraphFor("/login", TITLE, DESCRIPTION),
};

export default function AuthPage({ searchParams }: { searchParams: AuthSearchParams }) {
  return <AuthRoute initialState="login" searchParams={searchParams} />;
}
