"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { rememberDeliverySource } from "./delivery/deliverySource";
import { CARD_DRAFTS_UPDATED_EVENT, deleteCardDraft, fetchCardDraftAssets, fetchUserCardDrafts } from "../lib/api";
import type { CardDraft, CardDraftAsset } from "../lib/api";
import { STAGES, briefFromCreative } from "./bmc/brief";
import { nextOpenQuestion } from "./bmc/questionBank";
import { ptBriefFromCreative, savedTemplateId } from "./personalize/ptBrief";
import { nextOpen, stagesFor } from "./personalize/ptEngine";
import { templateFor } from "./personalize/templates";
import { rememberSelectedAsset } from "../lib/mockMvpFlow";
import { useAuth } from "./AuthProvider";
import { ContentPageHead } from "./content/ContentPageShell";
import { ConfirmDialog } from "./content/ConfirmDialog";
import { SongPlayer } from "./landing/SongPlayer";
import { usePrintAndSendPrice } from "./pricing/printAndSendPrice";
import { formatMoney } from "../lib/priceLists";
import { expiresSoon, formatLongDate, storageExpiry } from "./library/storage";

// Saved Cards & Songs (/create/my-cards-and-songs, alias /my-cards) on the
// berry & ivory system. Drafts resume at their next open question, finished
// cards can be printed and sent again without new AI credits, and songs play
// here when the asset has a playable address. Storage: 12 months from the
// last saved edit (PRD §5), shown as a date on every item.

type DraftWithAssets = { draft: CardDraft; assets: CardDraftAsset[] };

type LibraryDraft = {
  id: string;
  title: string;
  flow: string;
  where: string;
  step: number;
  total: number;
  expiry: Date;
  href: string;
};

type LibraryCard = {
  id: string;
  title: string;
  imageUrl: string | null;
  imageAssetId: string | null;
  assets: CardDraftAsset[];
  hasSong: boolean;
  hasMessage: boolean;
  expiry: Date;
};

type LibrarySong = {
  id: string;
  cardTitle: string;
  audioUrl: string | null;
};

type PendingDelete = { id: string; title: string; kind: "draft" | "card" };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function assetType(asset: CardDraftAsset): string {
  return textValue(asset.assetType || asset.asset_type).toLowerCase();
}

function hasAssetType(assets: CardDraftAsset[], type: string): boolean {
  return assets.some((asset) => assetType(asset) === type);
}

/** A web address the browser can load (mock assets without one use "mock://"). */
function playableUrl(asset: CardDraftAsset | undefined): string | null {
  const url = textValue(asset?.mockUrl);
  return /^(https?:\/\/|\/)/i.test(url) ? url : null;
}

function getDraftTitle(draft: CardDraft): string {
  const brief = asRecord(draft.creative_brief);
  const basics = asRecord(brief.basics);
  const template = asRecord(brief.template);
  const community = asRecord(brief.communityCard);
  const shared = asRecord(brief.shared);
  const recipient = textValue(shared.recipientName) || textValue(basics.recipient) || textValue(brief.recipient);
  const occasion = textValue(draft.occasion) || textValue(shared.occasion) || textValue(basics.occasion) || textValue(template.occasion);
  const templateName = textValue(template.name) || textValue(community.name);
  return [templateName || occasion || "Custom Souvenote", recipient ? `for ${recipient}` : ""].filter(Boolean).join(" ");
}

function draftFlow(draft: CardDraft): string {
  return textValue(asRecord(draft.creative_brief).flow);
}

/** Personalize a Template resumes at its card's next open question (old pop-up drafts are migrated on open). */
function personalizeResumeTarget(draftId: string, brief: Record<string, unknown>) {
  const template = templateFor(savedTemplateId(brief));
  const saved = ptBriefFromCreative(brief, {
    id: template.id, name: template.name, version: template.version, occasion: template.occasion, orientation: template.defaultOrientation,
  });
  const stages = stagesFor(template, saved);
  const stage = nextOpen(template, saved)?.stage || "Review";
  return {
    href: `/create/personalize-a-template?template=${encodeURIComponent(template.id)}&draftId=${encodeURIComponent(draftId)}${saved.control.generation ? "#review" : ""}`,
    where: stage === "Review" ? "review" : stage.toLowerCase(),
    step: Math.max(1, stages.indexOf(stage) + 1),
    total: stages.length,
  };
}

/** Build My Card resumes at its next open question; the stage says where it stopped. */
function buildMyCardResumeTarget(draftId: string, brief: Record<string, unknown>) {
  const saved = briefFromCreative(brief);
  const stage = nextOpenQuestion(saved)?.stage || "Review";
  return {
    href: `/create/build-my-card?draftId=${encodeURIComponent(draftId)}${saved.control.generation ? "#review" : ""}`,
    where: stage === "Review" ? "review" : stage.toLowerCase(),
    step: STAGES.indexOf(stage) + 1,
    total: STAGES.length,
  };
}

function toLibraryDraft(draft: CardDraft): LibraryDraft {
  const isTemplate = draftFlow(draft) === "personalize_template";
  const brief = asRecord(draft.creative_brief);
  const resume = isTemplate ? personalizeResumeTarget(draft.id, brief) : buildMyCardResumeTarget(draft.id, brief);
  return {
    id: draft.id,
    title: getDraftTitle(draft),
    flow: isTemplate ? "Personalize a Template" : "Build My Card",
    where: resume.where,
    step: resume.step,
    total: resume.total,
    expiry: storageExpiry(draft),
    href: resume.href,
  };
}

function toLibraryCard({ draft, assets }: DraftWithAssets): LibraryCard {
  const image = assets.filter((asset) => assetType(asset) === "image").at(-1);
  return {
    id: draft.id,
    title: getDraftTitle(draft),
    imageUrl: playableUrl(image),
    imageAssetId: image?.id || null,
    assets,
    hasSong: hasAssetType(assets, "song"),
    hasMessage: hasAssetType(assets, "message"),
    expiry: storageExpiry(draft),
  };
}

function toLibrarySongs({ draft, assets }: DraftWithAssets): LibrarySong[] {
  const cardTitle = getDraftTitle(draft);
  return assets.filter((asset) => assetType(asset) === "song").map((asset, index) => ({
    id: asset.id || `${draft.id}-song-${index}`,
    cardTitle,
    audioUrl: playableUrl(asset),
  }));
}

function SavedUntil({ expiry }: { expiry: Date }) {
  const soon = expiresSoon(expiry);
  return (
    <p className={`lib-expiry ${soon ? "is-soon" : ""}`}>
      {soon ? "Expires soon: saved until " : "Saved until "}
      <time dateTime={expiry.toISOString().slice(0, 10)}>{formatLongDate(expiry)}</time>
    </p>
  );
}

/** Placeholder front for drafts and cards without a loadable image: the logo on forest. */
function LogoTile() {
  return (
    <span className="lib-logo-tile" aria-hidden="true">
      <Image src="/assets/logomark-gold-silver.png" alt="" width={400} height={600} sizes="64px" />
    </span>
  );
}

function SectionHead({ id, title, count }: { id: string; title: string; count: number }) {
  return (
    <div className="lib-section-head">
      <h2 id={id} className="lib-section-title" tabIndex={-1}>{title}</h2>
      {count > 0 && <span className="lib-count">{count} {count === 1 ? "item" : "items"}</span>}
    </div>
  );
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="lib-empty">
      <p className="lib-empty-title">{title}</p>
      <p className="lib-empty-body">{body}</p>
      {action}
    </div>
  );
}

function SignedOutLibrary() {
  return (
    <section className="lib-empty lib-signed-out" aria-labelledby="lib-signin-title">
      <h2 id="lib-signin-title" className="lib-empty-title">Log in to see your saved cards</h2>
      <p className="lib-empty-body">Your drafts, finished cards and songs are kept in your account. Log in, or create a free account to get 2 free credits.</p>
      <div className="lib-actions">
        <Link className="l-btn l-btn-primary" href="/login?returnTo=/create/my-cards-and-songs">Log In</Link>
        <Link className="l-btn l-btn-secondary" href="/signup?returnTo=/create/my-cards-and-songs">Sign Up</Link>
      </div>
    </section>
  );
}

function MyCardsApp() {
  const router = useRouter();
  const auth = useAuth();
  const price = usePrintAndSendPrice();
  const [items, setItems] = React.useState<DraftWithAssets[]>([]);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [pendingDelete, setPendingDelete] = React.useState<PendingDelete | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const isAuthenticated = auth.status === "authenticated";
  const userId = auth.user?.id;

  const load = React.useCallback(async () => {
    if (!isAuthenticated || !userId) return;
    try {
      const drafts = await fetchUserCardDrafts(userId);
      const withAssets = await Promise.all(drafts.map(async (draft) => ({ draft, assets: await fetchCardDraftAssets(draft.id) })));
      setItems(withAssets);
      setStatus("ready");
    } catch {
      setItems([]);
      setStatus("error");
    }
  }, [isAuthenticated, userId]);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      setStatus(auth.status === "loading" ? "loading" : "ready");
      return;
    }
    setStatus("loading");
    void load();
    window.addEventListener(CARD_DRAFTS_UPDATED_EVENT, load);
    return () => window.removeEventListener(CARD_DRAFTS_UPDATED_EVENT, load);
  }, [auth.status, isAuthenticated, load]);

  const drafts = items.filter(({ assets }) => !hasAssetType(assets, "image")).map(({ draft }) => toLibraryDraft(draft));
  const cards = items.filter(({ assets }) => hasAssetType(assets, "image")).map(toLibraryCard);
  const songs = items.flatMap(toLibrarySongs);
  const priceText = formatMoney(price.price, price.currency);

  function printAndSend(card: LibraryCard) {
    if (card.imageAssetId) rememberSelectedAsset(card.id, card.imageAssetId, card.assets);
    rememberDeliverySource("saved");
    router.push("/delivery");
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleteError(null);
    try {
      await deleteCardDraft(pendingDelete.id);
      const { title, kind } = pendingDelete;
      setPendingDelete(null);
      setNotice(`"${title}" was deleted.`);
      // Focus goes back to the section the item was in.
      window.requestAnimationFrame(() => document.getElementById(kind === "draft" ? "lib-drafts-title" : "lib-cards-title")?.focus());
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "We couldn't delete it. Please try again.");
    }
  }

  return (
    <div className="cf-wrap lib-wrap" data-screen-label="Saved Cards & Songs">
      <ContentPageHead
        title={<>Everything you&apos;ve <span className="l-script">made</span></>}
        lede="Drafts and finished cards are saved for 12 months from your last edit. Pick up a draft, print and send a card, or play its song."
      />

      {!isAuthenticated && auth.status !== "loading" ? <SignedOutLibrary /> : (
        <>
          <p className="l-sr-only" role="status">{notice}</p>
          {status === "error" && (
            <p className="cf-alert lib-alert" role="alert">
              We couldn&apos;t load your saved cards. Check your connection and{" "}
              <button type="button" className="cf-text-link" onClick={() => { setStatus("loading"); void load(); }}>try again</button>.
            </p>
          )}

          <section className="lib-section" aria-labelledby="lib-drafts-title" aria-busy={status === "loading"}>
            <SectionHead id="lib-drafts-title" title="In progress" count={drafts.length} />
            {status === "loading" ? <p className="lib-loading">Loading your drafts…</p> : drafts.length ? (
              <ul className="lib-drafts">
                {drafts.map((draft) => (
                  <li key={draft.id} className="lib-draft">
                    <LogoTile />
                    <div className="lib-draft-text">
                      <h3 className="lib-item-title">{draft.title}</h3>
                      <p className="lib-item-meta">{draft.flow} · stopped at {draft.where}</p>
                      <div className="lib-progress" role="img" aria-label={`Step ${draft.step} of ${draft.total}`}>
                        <span className="lib-progress-bar"><i style={{ width: `${(draft.step / draft.total) * 100}%` }} /></span>
                        <span className="lib-progress-label" aria-hidden="true">Step {draft.step} of {draft.total}</span>
                      </div>
                      <SavedUntil expiry={draft.expiry} />
                    </div>
                    <div className="lib-item-actions">
                      <Link className="l-btn l-btn-primary" href={draft.href}>Resume<span className="l-sr-only"> {draft.title}</span></Link>
                      <button type="button" className="lib-delete" onClick={() => { setDeleteError(null); setPendingDelete({ id: draft.id, title: draft.title, kind: "draft" }); }}>
                        Delete<span className="l-sr-only"> {draft.title}</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Nothing in progress"
                body="Start a card and we'll save your spot here as you go."
                action={<Link className="l-btn l-btn-primary" href="/create">Create a Card</Link>}
              />
            )}
          </section>

          <section className="lib-section" aria-labelledby="lib-cards-title">
            <SectionHead id="lib-cards-title" title="Finished cards" count={cards.length} />
            {status === "loading" ? <p className="lib-loading">Loading your cards…</p> : cards.length ? (
              <ul className="lib-cards">
                {cards.map((card) => (
                  <li key={card.id} className="lib-card">
                    <div className="lib-card-art">
                      {card.imageUrl
                        ? <Image src={card.imageUrl} alt={`Front of ${card.title}`} fill sizes="(min-width: 1024px) 260px, (min-width: 600px) 40vw, 80vw" unoptimized />
                        : <LogoTile />}
                    </div>
                    <div className="lib-card-body">
                      <h3 className="lib-item-title">{card.title}</h3>
                      <p className="lib-item-meta">
                        {[card.hasMessage ? "Inside message" : "", card.hasSong ? "QR song" : ""].filter(Boolean).join(" · ") || "Card front"}
                      </p>
                      <SavedUntil expiry={card.expiry} />
                      <div className="lib-item-actions">
                        <button type="button" className="l-btn l-btn-primary" onClick={() => printAndSend(card)}>
                          Print and send, {priceText}<span className="l-sr-only"> {card.title}</span>
                        </button>
                        <button type="button" className="lib-delete" onClick={() => { setDeleteError(null); setPendingDelete({ id: card.id, title: card.title, kind: "card" }); }}>
                          Delete<span className="l-sr-only"> {card.title}</span>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No finished cards yet"
                body="Cards you create land here, ready to print and send whenever you like."
                action={<Link className="l-btn l-btn-primary" href="/create">Create a Card</Link>}
              />
            )}
            {cards.length > 0 && (
              <p className="lib-note">Sending a saved card again uses the same artwork and song, so it needs no new AI credits. You can change the recipient and edit the inside message for free.</p>
            )}
          </section>

          <section className="lib-section" aria-labelledby="lib-songs-title">
            <SectionHead id="lib-songs-title" title="Songs" count={songs.length} />
            {status === "loading" ? <p className="lib-loading">Loading your songs…</p> : songs.length ? (
              <ul className="lib-songs">
                {songs.map((song) => (
                  <li key={song.id} className="lib-song">
                    {song.audioUrl
                      ? <SongPlayer label="QR song" title={song.cardTitle} audioSrc={song.audioUrl} />
                      : (
                        <div className="lib-song-static">
                          <p className="lib-item-title">{song.cardTitle}</p>
                          <p className="lib-item-meta">QR song · ready to print on the card</p>
                        </div>
                      )}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No songs yet" body="Add an optional song to a card and it will wait for you here." />
            )}
            <p className="lib-note">A song on a mailed card keeps playing from its QR code, even after the card leaves Saved Cards &amp; Songs.</p>
          </section>
        </>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={<>Delete <span className="l-script">&ldquo;{pendingDelete.title}&rdquo;</span>?</>}
          body={<p>It will be removed from Saved Cards &amp; Songs. Cards you&apos;ve already ordered aren&apos;t affected, and a mailed card&apos;s song keeps playing from its QR code.</p>}
          confirmLabel="Delete"
          busyLabel="Deleting…"
          error={deleteError}
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

export { MyCardsApp };
