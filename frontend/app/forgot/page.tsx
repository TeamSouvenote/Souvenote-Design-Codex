import type { Metadata } from "next";
import { AuthRoute } from "../components/AuthRoute";
import { NOINDEX } from "../lib/site";

export const metadata: Metadata = { title: "Reset your password | Souvenote", robots: NOINDEX };

export default function AuthPage() {
  return <AuthRoute initialState="forgot" />;
}
