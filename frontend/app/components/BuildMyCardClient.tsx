"use client";

import * as React from "react";
import { useCreditBalance } from "../lib/creditBalance";
import { readMockMvpFlowState } from "../lib/mockMvpFlow";
import { useAuth } from "./AuthProvider";
import { BmcQuestionnaire } from "./bmc/BmcQuestionnaire";
import { BmcSignUpDialog } from "./bmc/BmcDialogs";
import { BMC_COMMUNITY_EVENT, BmcCommunityContext, buildMyCardPath, isCommunitySearch } from "./bmc/community";

/**
 * Build My Card page logic: the sign-up prompt and the questionnaire. There is
 * no credit check on entry (owner, 2026-11-07): customers answer every question
 * first, and the questionnaire offers cards or credits only when they press
 * Create without enough credits. A saved card opens from ?draftId=; "Back to review" from
 * Delivery (#review) reopens the card that was sent there.
 *
 * Signed-out visitors (decision 2026-11-07): they can see the first question,
 * but the first action that saves anything, uploads a photo (which needs the
 * rights agreement on their account) or asks the AI to read an answer opens
 * the sign-up prompt. AI calls and photo storage are tied to an account, and
 * the two free credits are granted at sign-up.
 *
 * ?for=community (from Community Cards, owner 2026-11-09): the same flow, with
 * a describe-only Photo step (bmc/community.ts). Sign-up and top-ups return
 * with ?for=community kept. A saved community draft (`audience: "community"`)
 * switches the mode on when it opens, and adds ?for=community to the address,
 * so Delivery's Back and Saved Cards reopen it as a community card (Community
 * Cards audit C2).
 */
export function BuildMyCardClient() {
  const auth = useAuth();
  const [resumeDraftId, setResumeDraftId] = React.useState<string | null | undefined>(undefined);
  const [authPromptOpen, setAuthPromptOpen] = React.useState(false);
  const [community, setCommunity] = React.useState(false);
  const isAuthenticated = auth.status === "authenticated";
  const creditBalance = useCreditBalance({ enabled: isAuthenticated, fallbackBalance: 0, userId: auth.user?.id });

  React.useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get("draftId");
    const fromDelivery = window.location.hash === "#review" ? readMockMvpFlowState().cardDraftId : null;
    setResumeDraftId(fromQuery || fromDelivery || null);
    setCommunity(isCommunitySearch(window.location.search));
  }, []);

  const communityDraftOpened = React.useCallback(() => {
    setCommunity(true);
    window.dispatchEvent(new CustomEvent(BMC_COMMUNITY_EVENT));
    const url = new URL(window.location.href);
    if (url.searchParams.get("for") !== "community") {
      url.searchParams.set("for", "community");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  if (resumeDraftId === undefined || auth.status === "loading") return null;

  return (
    <BmcCommunityContext.Provider value={community}>
      <BmcQuestionnaire
        key={resumeDraftId || "new"}
        resumeDraftId={resumeDraftId}
        credits={creditBalance.balance}
        creditStatus={creditBalance.status}
        refreshCredits={creditBalance.refresh}
        requireAuth={!isAuthenticated}
        onAuthRequired={() => setAuthPromptOpen(true)}
        onCommunity={communityDraftOpened}
      />
      {authPromptOpen && <BmcSignUpDialog returnTo={buildMyCardPath(community)} onClose={() => setAuthPromptOpen(false)} />}
    </BmcCommunityContext.Provider>
  );
}
