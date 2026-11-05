import type { Metadata } from "next";
import { AuthRoute } from "../components/AuthRoute";
import { NOINDEX } from "../lib/site";

export const metadata: Metadata = { title: "Email verified | Souvenote", robots: NOINDEX };

export default function AuthPage() {
  return <AuthRoute initialState="verify" />;
}
