"use client";

import * as React from "react";
import Link from "next/link";
import { useCreditBalance } from "../lib/creditBalance";
import { fetchCardDraftAssets, fetchUserCardDrafts } from "../lib/api";
import { useAuth } from "./AuthProvider";
import { useDemoBalance } from "./DemoBalance";
import { ContentPageHead } from "./content/ContentPageShell";
import { openTopUp } from "./pricing/topUp";

// Account Profile (/account/profile) on the berry & ivory system: who you are,
// your credit and card balances with their 12-month expiry rule, what you've
// made, and the ways back into the account. No order history (My Orders is v2).

type MadeCounts = { cards: number; songs: number };

function useMadeCounts(userId: string | undefined, enabled: boolean) {
  const [counts, setCounts] = React.useState<MadeCounts | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (!enabled || !userId) return;
    let active = true;
    fetchUserCardDrafts(userId)
      .then(async (drafts) => {
        const assetGroups = await Promise.all(drafts.map((draft) => fetchCardDraftAssets(draft.id)));
        const typeOf = (asset: { assetType?: string; asset_type?: string }) => String(asset.assetType || asset.asset_type || "").toLowerCase();
        if (!active) return;
        setCounts({
          cards: assetGroups.filter((assets) => assets.some((asset) => typeOf(asset) === "image")).length,
          songs: assetGroups.reduce((sum, assets) => sum + assets.filter((asset) => typeOf(asset) === "song").length, 0),
        });
      })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [enabled, userId]);

  return { counts, failed };
}

const PROFILE_LINKS = [
  { label: "Saved Cards & Songs", body: "Drafts, finished cards and songs.", href: "/create/my-cards-and-songs" },
  { label: "Account Settings", body: "Your details, password, two-step sign-in and payment methods.", href: "/account/settings" },
  { label: "Saved recipients", body: "Names and addresses you send to.", href: "/account/settings#recipients" },
  { label: "Pricing", body: "Print and Send, Big Sender packs and credit top-ups.", href: "/pricing" },
] as const;

function ProfilePage() {
  const auth = useAuth();
  const display = auth.displayUser;
  const isAuthenticated = auth.status === "authenticated";
  const credits = useCreditBalance({ enabled: isAuthenticated, fallbackBalance: 0, userId: auth.user?.id });
  const { cardBank } = useDemoBalance();
  const { counts, failed } = useMadeCounts(auth.user?.id, isAuthenticated);
  const joinedAt = auth.user?.created_at ? new Date(auth.user.created_at) : null;
  const memberSince = joinedAt && !Number.isNaN(joinedAt.getTime())
    ? joinedAt.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;

  const stats = [
    { label: "AI credits", value: credits.status === "loading" ? "…" : credits.status === "error" ? "—" : String(credits.balance) },
    { label: "Cards in your bank", value: String(cardBank) },
    { label: "Cards made", value: failed ? "—" : counts ? String(counts.cards) : "…" },
    { label: "Songs made", value: failed ? "—" : counts ? String(counts.songs) : "…" },
  ];

  return (
    <div className="cf-wrap acc2-wrap" data-screen-label="Profile">
      <ContentPageHead
        title={<>Your <span className="l-script">profile</span></>}
        lede="Your account at a glance: your balances, what you've made and quick ways back in."
      />

      <section className="acc2-card acc2-id" aria-labelledby="acc-id-name">
        <span className="acc2-avatar" aria-hidden="true">{display?.initials || "S"}</span>
        <div className="acc2-id-text">
          <h2 id="acc-id-name" className="acc2-id-name">{display?.name || "Your account"}</h2>
          <p className="acc2-id-meta">{auth.user?.email || display?.email}</p>
          {memberSince && <p className="acc2-id-meta">Member since {memberSince}</p>}
        </div>
        <Link className="l-btn l-btn-secondary acc2-id-edit" href="/account/settings">Edit details</Link>
      </section>

      <section className="acc2-section" aria-labelledby="acc-balances-title">
        <h2 id="acc-balances-title" className="acc2-section-title">Balances and what you&apos;ve made</h2>
        <dl className="acc2-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="acc2-stat">
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
        <p className="acc2-note">
          AI credits (your 2 free signup credits included) and unused cards expire 12 months after you buy or receive them.
        </p>
        <div className="acc2-actions">
          <button type="button" className="l-btn l-btn-primary" onClick={() => { if (!openTopUp("credits", "/account/profile")) window.location.assign("/pricing"); }}>
            Top up credits
          </button>
          <Link className="l-btn l-btn-secondary" href="/pricing">See pricing</Link>
        </div>
      </section>

      <nav className="acc2-section" aria-labelledby="acc-links-title">
        <h2 id="acc-links-title" className="acc2-section-title">Your account</h2>
        <ul className="acc2-links">
          {PROFILE_LINKS.map((link) => (
            <li key={link.href}>
              <Link className="acc2-link" href={link.href}>
                <span className="acc2-link-label">{link.label}</span>
                <span className="acc2-link-body">{link.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export { ProfilePage };
