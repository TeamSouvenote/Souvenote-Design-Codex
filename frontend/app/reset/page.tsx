import type { Metadata } from "next";
import { AuthRoute, type AuthSearchParams } from "../components/AuthRoute";
import { NOINDEX } from "../lib/site";

export const metadata: Metadata = { title: "Set a new password | Souvenote", robots: NOINDEX };

export default function AuthPage({ searchParams }: { searchParams: AuthSearchParams }) {
  return <AuthRoute initialState="reset" searchParams={searchParams} />;
}
