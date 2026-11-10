"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { fetchCardDraftById } from "../lib/api";
import { useCreditBalance } from "../lib/creditBalance";
import { readMockMvpFlowState } from "../lib/mockMvpFlow";
import { useAuth } from "./AuthProvider";
import { BmcSignUpDialog } from "./bmc/BmcDialogs";
import { Thinking } from "./bmc/ui";
import { PtGallery } from "./personalize/PtGallery";
import { savedTemplateId } from "./personalize/ptBrief";
import { PT_RETURN_PATH, SAVED_TEMPLATE_ID, isOpenTemplate } from "./personalize/templates/ids";

// The questionnaire, Review and the card files load when a card opens, not with the gallery
// (Prompt 2 flows E-F4, 2026-11-09). They are fetched in the background soon after the page
// loads, so opening a card stays quick.
const loadCard = () => import("./personalize/PtCard");
const PtCard = dynamic(loadCard, { ssr: false, loading: () => <div className="bmcq-shell"><Thinking label="Opening your card…" /></div> });

type Route = { templateId: string | null; draftId: string | null };

/** A card to open from the address: a gallery template, or a saved template with its draft. */
function routeFrom(templateId: string | null, draftId: string | null): Route | null {
  if (templateId && isOpenTemplate(templateId)) return { templateId, draftId };
  if (templateId === SAVED_TEMPLATE_ID && draftId) return { templateId, draftId };
  return null;
}

/**
 * Personalize a Template page logic: the gallery and one card's questionnaire.
 * Opening the page never checks credits (owner, 2026-11-08): like Build My Card,
 * the cards-or-credits choice opens only when Create, or a paid redo, is pressed
 * without enough credits (PtQuestionnaire). ?template= opens a card;
 * ?draftId= resumes one (old My Cards links with ?modal=1 still work); #review
 * from Delivery reopens the card that was sent there.
 */
export function PersonalizeTemplateClient() {
  const auth = useAuth();
  const signedIn = auth.status === "authenticated";
  const creditBalance = useCreditBalance({ enabled: signedIn, fallbackBalance: 0, userId: auth.user?.id });
  const [route, setRoute] = React.useState<Route | undefined>(undefined);
  const [resolving, setResolving] = React.useState(false);
  const [signUpOpen, setSignUpOpen] = React.useState(false);
  // Opening a card, "Choose a different template" and browser Back change the view without a
  // route change, so RouteFocus doesn’t run: the new view’s heading gets focus here instead
  // of <body> (design system 2.28).
  const focusViewRef = React.useRef(false);

  // ---- Read the address --------------------------------------------------------------------
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromDelivery = window.location.hash === "#review" ? readMockMvpFlowState().cardDraftId : null;
    const draftId = params.get("draftId") || fromDelivery;
    const known = routeFrom(params.get("template"), draftId);
    if (known || !draftId) { setRoute(known || { templateId: null, draftId: null }); return; }
    // A saved-card link without a known ?template= (old My Cards links, Delivery): read the draft to find its template.
    setResolving(true);
    fetchCardDraftById(draftId)
      .then((draft) => { const id = savedTemplateId(draft.creative_brief); setRoute({ templateId: isOpenTemplate(id) ? id : SAVED_TEMPLATE_ID, draftId }); })
      .catch(() => setRoute({ templateId: null, draftId: null }))
      .finally(() => setResolving(false));
  }, []);

  const openTemplate = (templateId: string) => {
    if (!signedIn) { setSignUpOpen(true); return; }
    window.history.pushState(null, "", `${PT_RETURN_PATH}?template=${encodeURIComponent(templateId)}`);
    focusViewRef.current = true;
    setRoute({ templateId, draftId: null });
    window.scrollTo({ top: 0 });
  };

  const backToGallery = () => {
    window.history.pushState(null, "", PT_RETURN_PATH);
    focusViewRef.current = true;
    setRoute({ templateId: null, draftId: null });
    window.scrollTo({ top: 0 });
  };

  React.useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      focusViewRef.current = true;
      setRoute(routeFrom(params.get("template"), params.get("draftId")) || { templateId: null, draftId: null });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  React.useEffect(() => {
    if (!focusViewRef.current) return;
    let tries = 0;
    let timer = 0;
    const attempt = () => {
      // A saved draft may still be opening; wait up to about a second for its heading.
      const heading = document.querySelector<HTMLElement>("main h1");
      if (!heading) {
        if (tries++ < 20) timer = window.setTimeout(attempt, 50);
        return;
      }
      focusViewRef.current = false;
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    };
    timer = window.setTimeout(attempt, 50);
    return () => window.clearTimeout(timer);
  }, [route]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => { void loadCard(); }, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  if (resolving || auth.status === "loading" || route === undefined) {
    return <div className="bmcq-shell"><Thinking label="Opening templates…" /></div>;
  }

  const cardOpen = Boolean(route.templateId || route.draftId);

  return (
    <>
      {cardOpen ? (
        <PtCard
          key={`${route.templateId || SAVED_TEMPLATE_ID}-${route.draftId || "new"}`}
          templateId={route.templateId}
          resumeDraftId={route.draftId}
          credits={creditBalance.balance}
          creditStatus={creditBalance.status}
          refreshCredits={creditBalance.refresh}
          requireAuth={!signedIn}
          onAuthRequired={() => setSignUpOpen(true)}
          onChangeTemplate={backToGallery}
        />
      ) : (
        <PtGallery signedIn={signedIn} email={auth.user?.email || ""} onOpen={openTemplate} onSignUp={() => setSignUpOpen(true)} />
      )}
      {signUpOpen && (
        <BmcSignUpDialog returnTo={PT_RETURN_PATH} onClose={() => setSignUpOpen(false)} heading={["Sign up to see every", "template"]}
          body="Browse the full gallery, save your answers and create cards with a free Souvenote account." />
      )}
    </>
  );
}
