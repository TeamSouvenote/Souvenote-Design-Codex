"use client";

// Build My Card as one adaptive questionnaire. Owns the shared brief, saves it
// to the card draft, runs interviewer turns, opens the attestation as soon as
// photos are picked, generates, and hands the approved card to Delivery.

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CardDraftAsset } from "../../lib/api";
import {
  createCardDraft, createLocalIdempotencyKey, draftCaption, draftInsideMessage, draftLyrics, fetchCardDraftAssets, fetchCardDraftById,
  mockUpload, proposeInterviewTurn, recommendGenres, startGeneration, updateCardDraft,
} from "../../lib/api";
import type { CreditBalanceStatus } from "../../lib/creditBalance";
import { publishCreditBalance } from "../../lib/creditBalance";
import { rememberGeneratedAssets, rememberSelectedAsset, writeMockMvpFlowState } from "../../lib/mockMvpFlow";
import { rememberDeliverySource } from "../delivery/deliverySource";
import { goToPricingAfterPurchase } from "../PricingReturn";
import { openTopUp } from "../pricing/topUp";
import type { Brief, ReferenceImage } from "./brief";
import { briefFromCreative, creativeFromBrief, emptyBrief, generationCost, cleanDirection, hasSong, lyricHistory, photoKey, printedMessage } from "./brief";
import { assetImageUrl, latestAsset } from "./assets";
import { CATALOG_VERSION, LIMITS, genreById } from "./catalog";
import { compileImagePrompt, compileMusicPrompt, intendedFeeling, textContext } from "./compile";
import { applyProposal, buildTurnInput, decideNext, newAnswer, recordAnswer, skipQuestion, tailorPrompt, updateBrief } from "./engine";
import type { InterviewProposal } from "./engine";
import { BmcAttestationDialog } from "./BmcAttestationDialog";
import { BmcGeneratingDialog, BmcSpendDialog } from "./BmcDialogs";
import { TopUpChoiceDialog } from "../flow/TopUpChoiceDialog";
import type { GenerationProgress } from "./BmcDialogs";
import { BmcQuestion } from "./BmcQuestion";
import type { AnswerOptions, QuestionServices } from "./BmcQuestion";
import type { Approvals } from "./BmcReviewStage";
import { BmcReviewStage } from "./BmcReviewStage";
import { BmcSummary, StageRail } from "./BmcSummary";
import { acceptedPhotos, makeThumbnail, photoId } from "./photos";
import { PROMPT_TEMPLATE_VERSION } from "./prompts";
import { QUESTIONS_BY_ID, nextOpenQuestion } from "./questionBank";
import { Thinking, useFocusOnChange } from "./ui";
import { COMMUNITY_QUESTION_COPY, COMMUNITY_STAGES, COMMUNITY_STAGE_LABELS, buildMyCardPath, communitySubmitHref, useBmcCommunity } from "./community";


const CURRENT_CARD_DRAFT_ID_KEY = "souv_current_card_draft_id";

/** Questions outside the Image stage whose answers still shape the front, so they reopen its summary. */
const RESHAPES_FRONT = new Set(["P2_primary", "P3_subjects", "P4_look_hair", "P4_look_style", "P4_look_signature", "B1_occasion", "B6_orientation"]);

/**
 * A community card (?for=community) is saved with `audience: "community"`, so it
 * reopens in community mode from Delivery's Back and from Saved Cards (Community
 * Cards audit C2).
 */
function draftPayload(brief: Brief, community = false) {
  const creativeBrief = { ...creativeFromBrief(brief), ...(community ? { audience: "community" } : {}) };
  return { occasion: brief.shared.occasion || undefined, relationship: brief.shared.relationship || undefined, creativeBrief };
}

/** What a paid Create request is made of; an unchanged request reuses its action key so a retry is never charged twice. */
function requestFingerprint(parts: { image: string; music: string | null; message: string | null; photos: string | undefined }) {
  return [parts.image, parts.music || "", parts.message || "", parts.photos || ""].join("\u0000");
}

type Props = {
  resumeDraftId: string | null;
  credits: number;
  creditStatus: CreditBalanceStatus;
  refreshCredits?: () => Promise<unknown> | unknown;
  requireAuth: boolean;
  onAuthRequired: () => void;
  /** A saved draft turned out to be a community card: switch community mode on. */
  onCommunity?: () => void;
};

export function BmcQuestionnaire({ resumeDraftId, credits, creditStatus, refreshCredits, requireAuth, onAuthRequired, onCommunity }: Props) {
  const router = useRouter();
  const community = useBmcCommunity();
  // Refs, so saving and loading always see the latest without re-running their effects.
  const communityRef = React.useRef(community);
  communityRef.current = community;
  const onCommunityRef = React.useRef(onCommunity);
  onCommunityRef.current = onCommunity;
  const [brief, setBrief] = React.useState<Brief>(emptyBrief);
  const briefRef = React.useRef(brief);
  const draftIdRef = React.useRef<string | null>(null);
  const creatingRef = React.useRef<Promise<string> | null>(null);
  const [loading, setLoading] = React.useState(Boolean(resumeDraftId));
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [tailored, setTailored] = React.useState<Record<string, string>>({});
  const [thinking, setThinking] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [pendingPhotos, setPendingPhotos] = React.useState<File[]>([]);
  const [generating, setGenerating] = React.useState(false);
  const generatingRef = React.useRef(false);
  const [working, setWorking] = React.useState<"image" | "song" | null>(null);
  const [progress, setProgress] = React.useState<GenerationProgress | null>(null);
  const [pendingSpend, setPendingSpend] = React.useState<{ image: boolean; song: boolean } | null>(null);
  // Out of credits at Create (or a paid redo on Review): how many are needed.
  const [topUpNeed, setTopUpNeed] = React.useState<{ need: number; fromReview: boolean } | null>(null);
  const [assets, setAssets] = React.useState<CardDraftAsset[]>([]);
  const [view, setView] = React.useState<"questions" | "review">("questions");
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  // The last Create attempt (its action key and what it asked for), kept until it succeeds.
  const lastAttemptRef = React.useRef<{ key: string; fingerprint: string } | null>(null);
  // Saves run one after another, so an older save can never land after a newer one.
  const saveChainRef = React.useRef<Promise<unknown>>(Promise.resolve());

  const commit = React.useCallback((next: Brief) => {
    briefRef.current = next;
    setBrief(next);
  }, []);

  // ---- Load a saved draft ----------------------------------------------------
  React.useEffect(() => {
    if (!resumeDraftId) return;
    let cancelled = false;
    (async () => {
      try {
        const draft = await fetchCardDraftById(resumeDraftId);
        const loaded = briefFromCreative(draft.creative_brief);
        if (cancelled) return;
        draftIdRef.current = draft.id;
        if ((draft.creative_brief as Record<string, unknown> | null)?.audience === "community") onCommunityRef.current?.();
        const generation = loaded.control.generation;
        const saved = generation ? await fetchCardDraftAssets(draft.id) : [];
        if (cancelled) return;
        if (generation && !latestAsset(saved, "image")) {
          // Create was interrupted (for example a reload mid-generation): offer Create again,
          // reusing the same action key so the server never charges twice.
          lastAttemptRef.current = {
            key: generation.actionKey,
            fingerprint: requestFingerprint({ image: generation.compiledImagePrompt, music: generation.compiledMusicPrompt, message: generation.printedMessage, photos: generation.photoKey }),
          };
          loaded.control.generation = null;
        }
        commit(loaded);
        setAssets(saved);
        if (loaded.control.generation && window.location.hash === "#review") setView("review");
      } catch {
        if (!cancelled) setNotice("We couldn't open that saved card, so you're starting a new one.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [commit, resumeDraftId]);

  // Community cards (?for=community) have no song (owner, 2026-11-09): the Song
  // question is answered "none" up front, so its questions never show and Create costs one credit.
  React.useEffect(() => {
    if (!community || loading) return;
    const current = briefRef.current;
    if (current.song.mode === "none") return;
    commit({ ...current, song: { ...current.song, mode: "none" } });
  }, [community, loading, brief.song.mode, commit]);

  // ---- Saving --------------------------------------------------------------------
  const ensureDraft = React.useCallback(async () => {
    if (draftIdRef.current) return draftIdRef.current;
    if (!creatingRef.current) {
      const current = briefRef.current;
      creatingRef.current = createCardDraft(draftPayload(current, communityRef.current)).then((draft) => {
        draftIdRef.current = draft.id;
        try { window.localStorage.setItem(CURRENT_CARD_DRAFT_ID_KEY, draft.id); } catch { /* storage unavailable */ }
        writeMockMvpFlowState({ cardDraftId: draft.id });
        const url = new URL(window.location.href);
        url.searchParams.set("draftId", draft.id);
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
        return draft.id;
      }).finally(() => { creatingRef.current = null; });
    }
    return creatingRef.current;
  }, []);

  const saveDraft = React.useCallback((snapshot: Brief) => {
    const run = saveChainRef.current.catch(() => undefined).then(async () => {
      const id = await ensureDraft();
      await updateCardDraft(id, draftPayload(snapshot, communityRef.current));
      return id;
    });
    saveChainRef.current = run;
    return run;
  }, [ensureDraft]);

  React.useEffect(() => {
    if (requireAuth || loading || brief.control.briefVersion === 0) return;
    const timer = window.setTimeout(() => {
      saveDraft(brief).catch(() => setNotice("Your latest answer couldn't be saved. We'll try again with your next one."));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [brief, saveDraft, loading, requireAuth]);

  // ---- Current question ------------------------------------------------------------
  const baseQuestion = editingId ? QUESTIONS_BY_ID.get(editingId) || null : nextOpenQuestion(brief);
  // A community card (?for=community) has its own wording for a few questions: it describes its front
  // instead of using photos, and its story and inside message are written for anyone (bmc/community.ts).
  const communityCopy = community && baseQuestion ? COMMUNITY_QUESTION_COPY[baseQuestion.id] : undefined;
  const question = React.useMemo(() => (communityCopy && baseQuestion ? { ...baseQuestion, ...communityCopy } : baseQuestion), [communityCopy, baseQuestion]);
  const prompt = question ? (communityCopy?.prompt || tailored[question.id] || tailorPrompt(question.id, brief) || question.prompt) : "";

  // Focus moves to the new heading when the question or view changes, but not on first load,
  // including a saved draft that opens on a later question (the key starts once it's loaded).
  // On Review the key stays put, so edits there (which can change the next open question) never move focus.
  useFocusOnChange(loading ? null : view === "review" ? "review" : `q:${question?.id || "done"}`, headingRef);

  // ---- Answering ------------------------------------------------------------------
  const answer = React.useCallback(async (change: (draft: Brief) => void, options: AnswerOptions = {}) => {
    if (!question) return;
    if (requireAuth) { onAuthRequired(); return; }
    const answerRecord = newAnswer(question.id, options.text || "", options.controls || {});
    let next = recordAnswer(briefRef.current, answerRecord, (draft) => {
      change(draft);
      // Any change to the front's answers needs a fresh look at the summary.
      if ((question.stage === "Image" && question.id !== "I5_summary") || RESHAPES_FRONT.has(question.id)) draft.image.briefConfirmed = false;
    }, options.shared);
    commit(next);
    setEditingId(null);
    setNotice(null);

    if (!options.text?.trim() || question.fields.length === 0) return;

    // Interviewer turn: extract supported updates, propose the next question.
    setThinking(true);
    const sourceVersion = next.control.briefVersion;
    const input = buildTurnInput(next, question, answerRecord);
    let proposal: InterviewProposal | null = null;
    for (let attempt = 0; attempt < 2 && !proposal; attempt += 1) {
      try { proposal = await proposeInterviewTurn(input); } catch { proposal = null; }
    }
    setThinking(false);
    if (!proposal) return; // Keep every answer; the bank's own wording is used.
    const current = briefRef.current;
    if (current.control.briefVersion !== sourceVersion) return; // A newer edit wins.
    next = applyProposal(current, proposal, answerRecord, question, sourceVersion).brief;
    commit(next);
    const upcoming = decideNext(next, proposal);
    if (upcoming.question) setTailored((all) => ({ ...all, [upcoming.question.id]: upcoming.text }));
  }, [commit, onAuthRequired, question, requireAuth]);

  const skip = question?.optional ? () => { commit(skipQuestion(briefRef.current, question.id)); setEditingId(null); } : undefined;

  const answeredOrder = brief.control.answered.filter((id) => QUESTIONS_BY_ID.get(id)?.applies(brief));
  const back = (() => {
    const currentIndex = question ? answeredOrder.indexOf(question.id) : -1;
    const previous = currentIndex > 0 ? answeredOrder[currentIndex - 1] : currentIndex === -1 ? answeredOrder.at(-1) : null;
    return previous ? () => setEditingId(previous) : undefined;
  })();

  const update = React.useCallback((change: (draft: Brief) => void, shared = false) => {
    commit(updateBrief(briefRef.current, change, shared));
  }, [commit]);

  // Review approvals live in the brief, so they're saved with the draft (owner, 2026-11-09, audit §8 D8).
  const approvals = brief.control.approvals;
  const setApprovals = React.useCallback((next: Approvals | ((current: Approvals) => Approvals)) => {
    update((draft) => { draft.control.approvals = typeof next === "function" ? next(draft.control.approvals) : next; });
  }, [update]);

  // ---- Photos and attestation -----------------------------------------------------
  const pickPhotos = (list: FileList | File[] | null) => {
    if (requireAuth) { onAuthRequired(); return; }
    const room = LIMITS.maxReferenceImages - briefRef.current.image.references.length;
    const files = acceptedPhotos(list).slice(0, Math.max(0, room));
    if (!files.length) { setNotice(room <= 0 ? `You can add up to ${LIMITS.maxReferenceImages} photos.` : "Please choose JPEG, PNG or WEBP photos."); return; }
    setPendingPhotos(files); // The attestation opens straight away.
  };

  const agreeToAttestation = async () => {
    const files = pendingPhotos;
    setPendingPhotos([]);
    const refs: ReferenceImage[] = await Promise.all(files.map(async (file) => ({
      id: photoId(), name: file.name, mimeType: file.type, size: file.size, thumbnail: await makeThumbnail(file), role: "identity" as const,
    })));
    update((draft) => {
      draft.image.references = [...draft.image.references, ...refs].slice(0, LIMITS.maxReferenceImages);
      if (!draft.image.primaryReferenceId) draft.image.primaryReferenceId = draft.image.references[0]?.id || null;
      draft.image.references = draft.image.references.map((ref) => ({ ...ref, role: ref.id === draft.image.primaryReferenceId ? "primary" : "identity" }));
      draft.control.attestedBatches += 1;
      draft.control.photoSkipped = false;
      draft.image.subjectDescription = null;
      draft.image.lookDetails = { hair: null, style: null, signature: null };
      draft.image.briefConfirmed = false;
    });
    try {
      const id = await ensureDraft();
      await Promise.all(files.map((file) => mockUpload({ cardDraftId: id, filename: file.name, mimeType: file.type, size: file.size })));
    } catch {
      setNotice("Your photos are added, but the upload didn't finish. We'll keep them for this card and you can try again.");
    }
  };

  const removePhoto = (id: string) => update((draft) => {
    draft.image.references = draft.image.references.filter((ref) => ref.id !== id);
    if (draft.image.primaryReferenceId === id) draft.image.primaryReferenceId = draft.image.references[0]?.id || null;
    if (!draft.image.references.length && draft.image.mode !== "transform") draft.image.mode = null;
    draft.image.references = draft.image.references.map((ref) => ({ ...ref, role: ref.id === draft.image.primaryReferenceId ? "primary" : "identity" }));
    draft.image.briefConfirmed = false;
  });

  // ---- Writers --------------------------------------------------------------------
  const suggestCaption = async () => {
    const current = briefRef.current;
    if (current.image.caption.drafts.length > LIMITS.textRegenerations) return null;
    const result = await draftCaption(textContext(current), current.image.caption.drafts);
    if (!result.caption.trim()) return null;
    update((draft) => {
      draft.image.caption.drafts = [...draft.image.caption.drafts, result.caption];
      draft.image.caption.successfulRegenerations = Math.max(0, draft.image.caption.drafts.length - 1);
    });
    return result.caption;
  };

  const draftAiMessage = React.useCallback(async (note?: unknown) => {
    const current = briefRef.current;
    // A note only steers a redraft; the first draft never takes one.
    const direction = current.message.aiVersion ? cleanDirection(note) : null;
    const previous = current.message.aiVersion?.drafts || [];
    if (previous.length >= LIMITS.aiMessageDrafts) return;
    const sharedVersion = current.control.sharedVersion;
    const result = await draftInsideMessage(textContext(current, current.message.userVersion?.text || null), previous, direction);
    if (!result.message.trim()) {
      throw new Error(result.needsClarification[0] || "We need a little more about the card before we can write a message.");
    }
    // Results go to the AI slot only; they never replace the customer's words or a blank choice.
    update((draft) => {
      const prior = draft.message.aiVersion;
      draft.message.aiVersion = {
        text: result.message,
        version: (prior?.version || 0) + 1,
        sourceSharedVersion: sharedVersion,
        successfulRegenerations: Math.max(0, previous.length),
        drafts: [...previous, result.message],
        direction,
      };
    });
  }, [update]);

  const loadRecommendations = async () => {
    const current = briefRef.current;
    try {
      const result = await recommendGenres({ occasion: current.shared.occasion, vibes: current.shared.vibes, intendedFeeling: intendedFeeling(current), userDirection: null });
      const valid = result.recommendations.filter((r) => genreById(r.presetId)).slice(0, 3);
      update((draft) => { draft.song.recommendedGenreIds = valid.map((r) => ({ id: r.presetId, reason: r.reason })); });
    } catch {
      // Suggestions are optional; the full list is always there.
    }
  };

  const runLyrics = async (note?: unknown) => {
    const current = briefRef.current;
    const direction = current.song.lyrics ? cleanDirection(note) : null;
    const preset = current.song.genrePresetId;
    if (!preset) return;
    const previous = lyricHistory(current);
    const result = await draftLyrics(textContext(current, printedMessage(current)), preset, previous, direction);
    if (!result.lyrics.trim()) throw new Error(result.needsClarification[0] || "Lyrics couldn't be written from the details so far.");
    update((draft) => {
      const regeneration = Boolean(draft.song.lyrics);
      draft.song.lyrics = result.lyrics;
      draft.song.lyricsVersion += 1;
      draft.song.lyricsSourceVersion = draft.control.sharedVersion;
      draft.song.lyricDrafts = [...previous, result.lyrics].slice(-(LIMITS.textRegenerations + 1));
      draft.song.lyricsMessage = printedMessage(current) || "";
      draft.song.lyricsDirection = direction;
      draft.song.approvedLyricsVersion = null;
      if (regeneration) draft.song.regenerationCount += 1;
    });
  };

  // ---- Generation ---------------------------------------------------------------
  // Credits are only checked when something is about to be spent (owner, 2026-11-07):
  // the customer can answer every question first, then choose cards or credits here.
  const outOfCredits = (need: number, fromReview = false) => setTopUpNeed({ need, fromReview });

  const chooseTopUp = async (view: "cards" | "credits") => {
    const fromReview = topUpNeed?.fromReview || false;
    setTopUpNeed(null);
    let returnTo = buildMyCardPath(community);
    try {
      // Save the latest answers now (after any save in flight), so the purchase comes back to this exact card.
      const id = await saveDraft(briefRef.current);
      returnTo = `${buildMyCardPath(community, { draftId: id })}${fromReview ? "#review" : ""}`;
    } catch {
      setNotice("Your latest answer couldn't be saved. We'll try again with your next one.");
    }
    if (!openTopUp(view, returnTo)) router.push(goToPricingAfterPurchase(returnTo));
  };

  /** Runs a paid generation. Resolves once the server has accepted (and charged) it; loading the new assets afterwards can't undo that. */
  const runGeneration = async (parts: { image: boolean; song: boolean }, actionKey: string) => {
    const id = await ensureDraft();
    const response = await startGeneration({ cardDraftId: id, idempotencyKey: actionKey, parts });
    if (response.balance) publishCreditBalance(response.balance);
    else await Promise.resolve(refreshCredits?.()).catch(() => undefined);
    try {
      const saved = await fetchCardDraftAssets(id);
      setAssets(saved);
      rememberGeneratedAssets(id, saved);
    } catch {
      setNotice("Your card was made, but its preview couldn't load. Reload the page to see it; you won't be charged again.");
    }
    return id;
  };

  const generate = async () => {
    const current = briefRef.current;
    const songOn = hasSong(current);
    const cost = generationCost(current);
    if (creditStatus === "ready" && credits < cost) { outOfCredits(cost); return; }
    // Repeat clicks while a request is in flight do nothing.
    if (generatingRef.current) return;
    generatingRef.current = true;
    setGenerating(true);
    setNotice(null);
    // An unchanged request reuses its action key, so a retry (or one after a failed response) never charges twice.
    const fingerprint = requestFingerprint({ image: compileImagePrompt(current), music: compileMusicPrompt(current), message: printedMessage(current), photos: photoKey(current) });
    const actionKey = lastAttemptRef.current?.fingerprint === fingerprint ? lastAttemptRef.current.key : createLocalIdempotencyKey("bmc-generate");
    lastAttemptRef.current = { key: actionKey, fingerprint };
    let accepted = false;
    try {
      // Freeze what was approved before the paid request.
      update((draft) => {
        draft.control.generation = {
          actionKey, at: new Date().toISOString(), briefVersion: draft.control.briefVersion, promptTemplateVersion: PROMPT_TEMPLATE_VERSION,
          catalogVersion: CATALOG_VERSION, includeSong: songOn, compiledImagePrompt: compileImagePrompt(draft),
          compiledMusicPrompt: compileMusicPrompt(draft), printedMessage: printedMessage(draft), photoKey: photoKey(draft),
        };
        if (draft.song.mode === "vocal") draft.song.audioLyricsVersion = draft.song.lyricsVersion;
      });
      setProgress({
        front: "working", song: songOn ? "working" : "off",
        songLabel: current.song.mode === "instrumental" ? "Instrumental song" : "Song",
        message: current.message.mode === "blank" ? "blank" : "ready", error: null,
      });
      await runGeneration({ image: true, song: songOn }, actionKey);
      accepted = true;
      lastAttemptRef.current = null;
      setProgress((p) => p && { ...p, front: "ready", song: songOn ? "ready" : "off" });
      // A short pause so the "Ready" ticks are seen, then on to Review.
      await new Promise((resolve) => setTimeout(resolve, 900));
      setProgress(null);
      setApprovals({ front: null, message: null, song: null });
      setView("review");
      window.location.hash = "review";
    } catch (error) {
      if (accepted) {
        // Made and charged; only the hand-off to Review failed. Keep the card and go on.
        setProgress(null);
        setView("review");
      } else {
        update((draft) => { draft.control.generation = null; });
        const message = error instanceof Error ? error.message : "";
        if (/insufficient credits/i.test(message)) { setProgress(null); lastAttemptRef.current = null; outOfCredits(cost); }
        else setProgress((p) => p && { ...p, front: "failed", song: p.song === "off" ? "off" : "failed", error: "Your card couldn’t be created just now. Your answers are saved, and trying again won’t charge you twice." });
      }
      await Promise.resolve(refreshCredits?.()).catch(() => undefined);
    } finally {
      generatingRef.current = false;
      setGenerating(false);
    }
  };

  const regenerate = async (parts: { image: boolean; song: boolean }) => {
    if (creditStatus === "ready" && credits < 1) { outOfCredits(1, true); return; }
    if (generatingRef.current) return;
    generatingRef.current = true;
    setWorking(parts.image ? "image" : "song");
    const before = { generation: briefRef.current.control.generation, audioLyricsVersion: briefRef.current.song.audioLyricsVersion };
    try {
      update((draft) => {
        if (draft.control.generation && parts.image) draft.control.generation = { ...draft.control.generation, compiledImagePrompt: compileImagePrompt(draft), photoKey: photoKey(draft), at: new Date().toISOString() };
        if (draft.control.generation && parts.song) draft.control.generation = { ...draft.control.generation, compiledMusicPrompt: compileMusicPrompt(draft) };
        if (parts.song && draft.song.mode === "vocal") draft.song.audioLyricsVersion = draft.song.lyricsVersion;
      });
      await runGeneration(parts, createLocalIdempotencyKey(parts.image ? "bmc-front" : "bmc-audio"));
      // The new version needs its own approval.
      setApprovals((current) => ({ ...current, ...(parts.image ? { front: null } : {}), ...(parts.song ? { song: null } : {}) }));
    } catch (error) {
      update((draft) => { draft.control.generation = before.generation; draft.song.audioLyricsVersion = before.audioLyricsVersion; });
      const message = error instanceof Error ? error.message : "";
      if (/insufficient credits/i.test(message)) outOfCredits(1, true);
      else setNotice("That didn't work this time. Your current version is kept; please try again.");
    } finally {
      generatingRef.current = false;
      setWorking(null);
    }
  };

  const toDelivery = (imageAssetId: string) => {
    const id = draftIdRef.current;
    if (!id) return;
    rememberSelectedAsset(id, imageAssetId, assets);
    rememberDeliverySource("build");
    router.push("/delivery");
  };

  const editFromReview = (questionId: string) => {
    setView("questions");
    setEditingId(questionId);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  };

  const services: QuestionServices = {
    pickPhotos, removePhoto, suggestCaption, draftAiMessage, loadRecommendations, draftLyrics: runLyrics, generate, update,
    edit: (id) => setEditingId(id), credits, creditsReady: creditStatus === "ready", generating,
  };

  // ---- Render ------------------------------------------------------------------------
  if (loading) return <div className="bmcq-shell"><Thinking label="Opening your card…" /></div>;

  if (view === "review" && brief.control.generation) {
    return (
      <div className="bmcq-shell is-review">
        {notice && <p className="bmcq-notice" role="alert">{notice}</p>}
        {/* Community cards: the step that puts the card up for review (Community Cards audit C1). */}
        {community && draftIdRef.current && (
          <p className="bmcq-community-share">
            <span>Happy with your front? Share it with the Community: our team reviews it before anyone else can send it.</span>
            <Link className="bmcq-btn is-secondary is-small" href={communitySubmitHref(draftIdRef.current)}>Share to Community Cards</Link>
          </p>
        )}
        <BmcReviewStage brief={brief} assets={assets} approvals={approvals} setApprovals={setApprovals} update={update}
          regenerate={async (parts) => { if (creditStatus === "ready" && credits < 1) outOfCredits(1, true); else setPendingSpend(parts); }} editAnswers={editFromReview} toDelivery={toDelivery} writeAi={draftAiMessage} working={working} headingRef={headingRef} />
        {pendingSpend && (
          <BmcSpendDialog part={pendingSpend.image ? "front" : "song"} credits={credits} onCancel={() => setPendingSpend(null)}
            onConfirm={() => { const parts = pendingSpend; setPendingSpend(null); void regenerate(parts); }} />
        )}
        {topUpNeed && <TopUpChoiceDialog variant={topUpNeed.fromReview ? "redo" : "create"} need={topUpNeed.need} credits={credits} onCancel={() => setTopUpNeed(null)} onChoose={(view) => { void chooseTopUp(view); }} />}
      </div>
    );
  }

  // Community cards have no Song step: "Ready to make it" (stage Song) shows under Message.
  const rawStage = question?.stage || "Review";
  const stage = community && rawStage === "Song" ? "Message" : rawStage;
  const stages = community ? COMMUNITY_STAGES : undefined;
  const stageLabels = community ? COMMUNITY_STAGE_LABELS : undefined;

  return (
    <div className="bmcq-shell">
      <StageRail brief={brief} current={stage} stages={stages} labels={stageLabels} onJump={(id) => setEditingId(id)} />
      <div className="bmcq-layout">
        <section className={`bmcq-card${question ? ` is-${question.kind}` : ""}`} data-stage={stage.toLowerCase()} aria-labelledby="bmcq-question-title">
          {notice && <p className="bmcq-notice" role="alert">{notice}</p>}
          {brief.control.conflicts.map((conflict) => (
            <div key={conflict.field} className="bmcq-conflict" role="alert">
              <p>{conflict.explanation}</p>
              <div className="bmcq-inline-actions">
                {conflict.offer === "switch_to_transform" && (
                  <button type="button" className="bmcq-btn is-primary is-small" onClick={() => update((draft) => {
                    draft.image.mode = "transform";
                    draft.image.vision = draft.image.vision || draft.image.refinement;
                    draft.image.briefConfirmed = false;
                    draft.control.conflicts = draft.control.conflicts.filter((c) => c.field !== conflict.field);
                  })}>Switch to Transform</button>
                )}
                <button type="button" className="bmcq-btn is-secondary is-small" onClick={() => update((draft) => {
                  draft.control.conflicts = draft.control.conflicts.filter((c) => c.field !== conflict.field);
                })}>{conflict.offer ? "Keep my choice" : "Got it"}</button>
              </div>
            </div>
          ))}

          {question ? (
            <>
              <div className="bmcq-qhead">
                <h1 id="bmcq-question-title" className="bmcq-title" ref={headingRef} tabIndex={-1}>
                  {question.heading[0]} <span className="l-script">{question.heading[1]}</span>
                </h1>
              </div>
              {thinking ? <Thinking label="Reading your answer…" /> : <p className="bmcq-prompt">{prompt}</p>}
              {question.helper && question.kind !== "story" && question.kind !== "purpose" && <p className="bmcq-helper">{question.helper}</p>}
              <div className="bmcq-controls">
                <BmcQuestion key={`${question.id}-${editingId ? "edit" : "flow"}`} brief={brief} question={question} busy={thinking} answer={answer} skip={skip} back={back} services={services} />
              </div>
            </>
          ) : (
            <>
              <h1 className="bmcq-title" ref={headingRef} tabIndex={-1}>All <span className="l-script">set</span></h1>
              <p className="bmcq-prompt">Your card is ready to review.</p>
              <button type="button" className="bmcq-btn is-primary" onClick={() => setView("review")}>Go to review</button>
            </>
          )}
        </section>
        <BmcSummary brief={brief} onEdit={(id) => setEditingId(id)} frontUrl={assetImageUrl(latestAsset(assets, "image"))} current={stage} stages={stages} labels={stageLabels} />
      </div>

      {pendingPhotos.length > 0 && <BmcAttestationDialog files={pendingPhotos} onCancel={() => setPendingPhotos([])} onAgree={() => { void agreeToAttestation(); }} />}
      {progress && <BmcGeneratingDialog progress={progress} onClose={() => setProgress(null)} />}
      {topUpNeed && <TopUpChoiceDialog variant={topUpNeed.fromReview ? "redo" : "create"} need={topUpNeed.need} credits={credits} onCancel={() => setTopUpNeed(null)} onChoose={(view) => { void chooseTopUp(view); }} />}
    </div>
  );
}

