"use client";

// One Personalize card as an adaptive questionnaire. Owns the brief, saves it
// to the card draft, runs interviewer turns and suggestion sets, opens the
// attestation as soon as photos are picked, generates, and hands the approved
// card to Delivery. Saving, retries and charging once follow Build My Card.

import * as React from "react";
import { useRouter } from "next/navigation";
import type { CardDraftAsset } from "../../lib/api";
import {
  createCardDraft, createLocalIdempotencyKey, draftComicStoryboard, draftInsideMessage, draftLyrics, fetchCardDraftAssets, fetchCardDraftById,
  mockUpload, proposePersonalizeTurn, researchOnThisDay, startGeneration, suggestPersonalizeOptions, updateCardDraft,
} from "../../lib/api";
import type { CreditBalanceStatus } from "../../lib/creditBalance";
import { publishCreditBalance } from "../../lib/creditBalance";
import { rememberGeneratedAssets, rememberSelectedAsset, writeMockMvpFlowState } from "../../lib/mockMvpFlow";
import type { PtSuggestContext } from "../../lib/mockPersonalize";
import { rememberDeliverySource } from "../delivery/deliverySource";
import { goToPricingAfterPurchase } from "../PricingReturn";
import { openTopUp } from "../pricing/topUp";
import { TopUpChoiceDialog } from "../flow/TopUpChoiceDialog";
import type { ReferenceImage } from "../bmc/brief";
import { generationCost, cleanDirection, hasSong, lyricHistory, photoKey, printedMessage } from "../bmc/brief";
import { latestAsset } from "../bmc/assets";
import { LIMITS } from "../bmc/catalog";
import { newAnswer, recordAnswer, skipQuestion, updateBrief } from "../bmc/engine";
import { BmcAttestationDialog } from "../bmc/BmcAttestationDialog";
import { BmcGeneratingDialog, BmcSpendDialog } from "../bmc/BmcDialogs";
import type { GenerationProgress } from "../bmc/BmcDialogs";
import type { QuestionServices } from "../bmc/BmcQuestion";
import type { Approvals } from "../bmc/BmcReviewStage";
import { BmcReviewStage } from "../bmc/BmcReviewStage";
import { acceptedPhotos, makeThumbnail, photoId } from "../bmc/photos";
import { Thinking, useFocusOnChange } from "../bmc/ui";
import type { PtBrief } from "./ptBrief";
import { creativeFromPtBrief, emptyPtBrief, field, ptBriefFromCreative } from "./ptBrief";
import type { PtInterviewProposal } from "./ptEngine";
import { applyPtProposal, buildPtTurnInput, nextOpen, questionIn, resolve, tailoredNext } from "./ptEngine";
import { compileCoverPrompt, compileSongPrompt, PT_PROMPT_VERSION, ptTextContext } from "./ptPrompts";
import type { PtAnswerOptions, PtServices } from "./PtQuestion";
import { MAX_PT_PHOTOS, PtQuestion, SUGGESTION_DRAFTS } from "./PtQuestion";
import { templateTone } from "./catalogue";
import { PtStageRail, PtSummary } from "./PtSummary";
import type { PtQuestion as PtQuestionDef, PtTemplate } from "./types";
import { signFor } from "./zodiac";

const CURRENT_CARD_DRAFT_ID_KEY = "souv_current_card_draft_id";
import { PT_RETURN_PATH } from "./templates/ids";

export { PT_RETURN_PATH };

function templateMeta(template: PtTemplate) {
  return { id: template.id, name: template.name, version: template.version, occasion: template.occasion, orientation: template.defaultOrientation };
}

function draftPayload(brief: PtBrief) {
  return { occasion: brief.shared.occasion || undefined, relationship: brief.shared.relationship || undefined, creativeBrief: creativeFromPtBrief(brief) };
}

function requestFingerprint(parts: { image: string; music: string | null; message: string | null; photos: string | undefined }) {
  return [parts.image, parts.music || "", parts.message || "", parts.photos || ""].join("\u0000");
}

type Props = {
  template: PtTemplate;
  resumeDraftId: string | null;
  credits: number;
  creditStatus: CreditBalanceStatus;
  refreshCredits?: () => Promise<unknown> | unknown;
  requireAuth: boolean;
  onAuthRequired: () => void;
  /** Back to the gallery to pick another template (the draft stays saved). */
  onChangeTemplate: () => void;
};

export function PtQuestionnaire({ template, resumeDraftId, credits, creditStatus, refreshCredits, requireAuth, onAuthRequired, onChangeTemplate }: Props) {
  const router = useRouter();
  const [brief, setBrief] = React.useState<PtBrief>(() => emptyPtBrief(templateMeta(template)));
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
  const [topUpNeed, setTopUpNeed] = React.useState<{ need: number; fromReview: boolean } | null>(null);
  const [assets, setAssets] = React.useState<CardDraftAsset[]>([]);
  const [view, setView] = React.useState<"questions" | "review">("questions");
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const lastAttemptRef = React.useRef<{ key: string; fingerprint: string } | null>(null);
  const saveChainRef = React.useRef<Promise<unknown>>(Promise.resolve());

  const commit = React.useCallback((next: PtBrief) => {
    briefRef.current = next;
    setBrief(next);
  }, []);

  // ---- Load a saved draft -----------------------------------------------------------
  React.useEffect(() => {
    if (!resumeDraftId) return;
    let cancelled = false;
    (async () => {
      try {
        const draft = await fetchCardDraftById(resumeDraftId);
        const loaded = ptBriefFromCreative(draft.creative_brief, templateMeta(template));
        if (cancelled) return;
        draftIdRef.current = draft.id;
        const generation = loaded.control.generation;
        const saved = generation ? await fetchCardDraftAssets(draft.id) : [];
        if (cancelled) return;
        if (generation && !latestAsset(saved, "image")) {
          // Create was interrupted: offer it again with the same action key, so it's never charged twice.
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
  }, [commit, resumeDraftId, template]);

  // ---- Saving -----------------------------------------------------------------------------
  const ensureDraft = React.useCallback(async () => {
    if (draftIdRef.current) return draftIdRef.current;
    if (!creatingRef.current) {
      creatingRef.current = createCardDraft(draftPayload(briefRef.current)).then((draft) => {
        draftIdRef.current = draft.id;
        try { window.localStorage.setItem(CURRENT_CARD_DRAFT_ID_KEY, draft.id); } catch { /* storage unavailable */ }
        writeMockMvpFlowState({ cardDraftId: draft.id });
        const url = new URL(window.location.href);
        url.searchParams.set("draftId", draft.id);
        url.searchParams.set("template", template.id);
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
        return draft.id;
      }).finally(() => { creatingRef.current = null; });
    }
    return creatingRef.current;
  }, [template.id]);

  const saveDraft = React.useCallback((snapshot: PtBrief) => {
    const run = saveChainRef.current.catch(() => undefined).then(async () => {
      const id = await ensureDraft();
      await updateCardDraft(id, draftPayload(snapshot));
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

  // ---- Current question -------------------------------------------------------------------
  const question = editingId ? questionIn(template, editingId) : nextOpen(template, brief);
  const prompt = question ? tailored[question.id] || resolve(question.prompt, brief) : "";
  const helper = question?.helper ? resolve(question.helper, brief) : null;

  // Focus moves to the new heading when the question or view changes, but not on first load,
  // including a saved draft that opens on a later question. On Review the key stays put.
  useFocusOnChange(loading ? null : view === "review" ? "review" : `q:${question?.id || "done"}`, headingRef);

  const update = React.useCallback((change: (draft: PtBrief) => void, shared = false) => {
    commit(updateBrief(briefRef.current, change, shared));
  }, [commit]);

  // Review approvals live in the brief, so they're saved with the draft (owner, 2026-11-09, audit §8 D8).
  const approvals = brief.control.approvals;
  const setApprovals = React.useCallback((next: Approvals | ((current: Approvals) => Approvals)) => {
    update((draft) => { draft.control.approvals = typeof next === "function" ? next(draft.control.approvals) : next; });
  }, [update]);

  // ---- Answering ------------------------------------------------------------------------------
  const answer = React.useCallback(async (change: (draft: PtBrief) => void, options: PtAnswerOptions = {}) => {
    if (!question) return;
    if (requireAuth) { onAuthRequired(); return; }
    const answerRecord = newAnswer(question.id, options.text || "", {});
    let next = recordAnswer(briefRef.current, answerRecord, (draft) => { change(draft); question.onAnswer?.(draft); }, options.shared);
    commit(next);
    setEditingId(null);
    setNotice(null);
    if (!options.text?.trim() || !question.extract?.length) return;

    // Interviewer turn: pull supported facts from the answer and tailor the next question.
    setThinking(true);
    const sourceVersion = next.control.briefVersion;
    const input = buildPtTurnInput(template, next, question, answerRecord);
    let proposal: PtInterviewProposal | null = null;
    for (let attempt = 0; attempt < 2 && !proposal; attempt += 1) {
      try { proposal = await proposePersonalizeTurn(input); } catch { proposal = null; }
    }
    setThinking(false);
    if (!proposal) return; // Every answer is kept; the card file's wording is used.
    const current = briefRef.current;
    if (current.control.briefVersion !== sourceVersion) return; // A newer edit wins.
    next = applyPtProposal(current, proposal, answerRecord, question, sourceVersion);
    commit(next);
    const upcoming = tailoredNext(template, next, proposal);
    if (upcoming) setTailored((all) => ({ ...all, [upcoming.id]: upcoming.text }));
  }, [commit, onAuthRequired, question, requireAuth, template]);

  const skip = question?.optional ? () => { commit(skipQuestion(briefRef.current, question.id)); setEditingId(null); } : undefined;

  const answeredOrder = template.questions.filter((q) => q.applies(brief) && brief.control.answered.includes(q.id)).map((q) => q.id);
  const back = (() => {
    const currentIndex = question ? answeredOrder.indexOf(question.id) : -1;
    const previous = currentIndex > 0 ? answeredOrder[currentIndex - 1] : currentIndex === -1 ? answeredOrder.at(-1) : null;
    return previous ? () => setEditingId(previous) : undefined;
  })();

  // ---- Photos and attestation ------------------------------------------------------------------
  const pickPhotos = (list: FileList | File[] | null) => {
    if (requireAuth) { onAuthRequired(); return; }
    const room = MAX_PT_PHOTOS - briefRef.current.image.references.length;
    const files = acceptedPhotos(list).slice(0, Math.max(0, room));
    if (!files.length) { setNotice(room <= 0 ? `You can add up to ${MAX_PT_PHOTOS} photos.` : "Please choose JPEG, PNG or WEBP photos."); return; }
    setPendingPhotos(files); // The attestation opens straight away, before any upload.
  };

  const agreeToAttestation = async () => {
    const files = pendingPhotos;
    setPendingPhotos([]);
    const refs: ReferenceImage[] = await Promise.all(files.map(async (file) => ({
      id: photoId(), name: file.name, mimeType: file.type, size: file.size, thumbnail: await makeThumbnail(file), role: "identity" as const,
    })));
    update((draft) => {
      draft.image.references = [...draft.image.references, ...refs].slice(0, MAX_PT_PHOTOS);
      if (!draft.image.primaryReferenceId) draft.image.primaryReferenceId = draft.image.references[0]?.id || null;
      draft.image.references = draft.image.references.map((ref) => ({ ...ref, role: ref.id === draft.image.primaryReferenceId ? "primary" : "identity" }));
      draft.control.attestedBatches += 1;
      draft.control.photoSkipped = false;
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
    draft.image.references = draft.image.references.map((ref) => ({ ...ref, role: ref.id === draft.image.primaryReferenceId ? "primary" : "identity" }));
  });

  // ---- Suggestions and writers -----------------------------------------------------------------
  const suggestContext = (current: PtBrief): PtSuggestContext => {
    const sign = signFor(field(current, "birthDate"));
    return {
      templateId: template.id,
      recipientName: current.shared.recipientName,
      occasion: current.shared.occasion,
      sign: template.id === "horoscope" && sign ? { name: sign.name, symbol: sign.symbol, themes: sign.themes, element: sign.element } : null,
      fields: current.personalize.fields,
      facts: current.shared.userFacts.map((fact) => fact.text),
      mood: field(current, "mood") || current.shared.intendedFeeling,
    };
  };

  const suggest = async (target: PtQuestionDef, more: boolean) => {
    if (!target.task) return;
    if (requireAuth) { onAuthRequired(); return; }
    const current = briefRef.current;
    const set = current.personalize.suggestions[target.id];
    if (set && (!more || set.drafts >= SUGGESTION_DRAFTS)) return;
    const previous = set ? set.options.map((option) => option.label) : [];
    const result = await suggestPersonalizeOptions(target.task, suggestContext(current), previous);
    if (!result.options.length) throw new Error("No suggestions came back this time. Try again, or write your own.");
    update((draft) => {
      draft.personalize.suggestions[target.id] = { options: result.options, drafts: (set?.drafts || 0) + 1, sourceVersion: draft.control.sharedVersion };
    });
  };

  const research = async (includeLighter: boolean) => {
    if (requireAuth) { onAuthRequired(); return; }
    const current = briefRef.current;
    const result = await researchOnThisDay({ date: field(current, "birthDate"), location: field(current, "location") || null, includeLighter });
    if (!result.candidates.length) throw new Error(result.note || "No stories were found for that day.");
    update((draft) => {
      const prior = draft.personalize.suggestions.O_story;
      draft.personalize.suggestions.O_story = {
        options: result.candidates.map((candidate) => ({ ...candidate, recommended: candidate.id === result.recommendedId })),
        drafts: (prior?.drafts || 0) + 1, sourceVersion: draft.control.sharedVersion,
      };
      draft.personalize.fields.researchNote = result.note;
    });
  };

  const draftStoryboard = async () => {
    if (requireAuth) { onAuthRequired(); return; }
    const current = briefRef.current;
    const prior = current.personalize.storyboard;
    if (prior && prior.drafts >= SUGGESTION_DRAFTS) return;
    const result = await draftComicStoryboard({
      recipientName: current.shared.recipientName,
      story: field(current, "storyDetail") || field(current, "premise") || field(current, "storyType"),
      ending: field(current, "ending") || null, occasion: current.shared.occasion,
    }, prior?.drafts || 0);
    update((draft) => {
      const version = (prior?.version || 0) + 1;
      draft.personalize.storyboard = { panels: result.panels.slice(0, 4), version, drafts: (prior?.drafts || 0) + 1, approvedVersion: null };
    });
  };

  const suggestCaption = async () => {
    const current = briefRef.current;
    const task = question?.task;
    if (!task || current.image.caption.drafts.length > LIMITS.textRegenerations) return null;
    const result = await suggestPersonalizeOptions(task, suggestContext(current), current.image.caption.drafts);
    const caption = result.options[0]?.label.trim();
    if (!caption) return null;
    update((draft) => {
      draft.image.caption.drafts = [...draft.image.caption.drafts, caption];
      draft.image.caption.successfulRegenerations = Math.max(0, draft.image.caption.drafts.length - 1);
    });
    return caption;
  };

  const draftAiMessage = React.useCallback(async (note?: unknown) => {
    const current = briefRef.current;
    // A note only steers a redraft; the first draft never takes one.
    const direction = current.message.aiVersion ? cleanDirection(note) : null;
    const previous = current.message.aiVersion?.drafts || [];
    if (previous.length >= LIMITS.aiMessageDrafts) return;
    const sharedVersion = current.control.sharedVersion;
    const result = await draftInsideMessage({ ...ptTextContext(template, current, "message"), insideMessage: current.message.userVersion?.text || null }, previous, direction);
    if (!result.message.trim()) throw new Error(result.needsClarification[0] || "We need a little more about the card before we can write a message.");
    // AI text goes to the AI slot only; it never replaces the customer's words or a blank choice.
    update((draft) => {
      const prior = draft.message.aiVersion;
      draft.message.aiVersion = {
        text: result.message, version: (prior?.version || 0) + 1, sourceSharedVersion: sharedVersion,
        successfulRegenerations: Math.max(0, previous.length), drafts: [...previous, result.message], direction,
      };
    });
  }, [template, update]);

  const runLyrics = async (note?: unknown) => {
    const current = briefRef.current;
    const direction = current.song.lyrics ? cleanDirection(note) : null;
    const previous = lyricHistory(current);
    // The chosen genre, or the card's suggested one if the sound step hasn't been answered yet.
    const result = await draftLyrics(ptTextContext(template, current, "lyrics"), current.song.genrePresetId || template.songPreset(current), previous, direction);
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

  // ---- Generation --------------------------------------------------------------------------------
  const outOfCredits = (need: number, fromReview = false) => setTopUpNeed({ need, fromReview });

  const chooseTopUp = async (choice: "cards" | "credits") => {
    const fromReview = topUpNeed?.fromReview || false;
    setTopUpNeed(null);
    let returnTo = PT_RETURN_PATH;
    try {
      const id = await saveDraft(briefRef.current);
      returnTo = `${PT_RETURN_PATH}?template=${encodeURIComponent(template.id)}&draftId=${encodeURIComponent(id)}${fromReview ? "#review" : ""}`;
    } catch {
      setNotice("Your latest answer couldn't be saved. We'll try again with your next one.");
    }
    if (!openTopUp(choice, returnTo)) router.push(goToPricingAfterPurchase(returnTo));
  };

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
    if (generatingRef.current) return; // Repeat clicks while a request is in flight do nothing.
    generatingRef.current = true;
    setGenerating(true);
    setNotice(null);
    const fingerprint = requestFingerprint({ image: compileCoverPrompt(template, current), music: compileSongPrompt(template, current), message: printedMessage(current), photos: photoKey(current) });
    const actionKey = lastAttemptRef.current?.fingerprint === fingerprint ? lastAttemptRef.current.key : createLocalIdempotencyKey("pt-generate");
    lastAttemptRef.current = { key: actionKey, fingerprint };
    let accepted = false;
    try {
      // Freeze what was approved, with the card and prompt versions, before the paid request.
      update((draft) => {
        draft.control.generation = {
          actionKey, at: new Date().toISOString(), briefVersion: draft.control.briefVersion, promptTemplateVersion: PT_PROMPT_VERSION,
          catalogVersion: template.version, includeSong: songOn, compiledImagePrompt: compileCoverPrompt(template, draft),
          compiledMusicPrompt: compileSongPrompt(template, draft), printedMessage: printedMessage(draft), photoKey: photoKey(draft),
        };
        if (draft.song.mode === "vocal") draft.song.audioLyricsVersion = draft.song.lyricsVersion;
      });
      setProgress({
        front: "working", song: songOn ? "working" : "off", songLabel: current.song.mode === "instrumental" ? "Instrumental song" : "Song",
        message: current.message.mode === "blank" ? "blank" : "ready", error: null,
      });
      await runGeneration({ image: true, song: songOn }, actionKey);
      accepted = true;
      lastAttemptRef.current = null;
      setProgress((p) => p && { ...p, front: "ready", song: songOn ? "ready" : "off" });
      await new Promise((resolveWait) => setTimeout(resolveWait, 900));
      setProgress(null);
      setApprovals({ front: null, message: null, song: null });
      setView("review");
      window.location.hash = "review";
    } catch (error) {
      if (accepted) { setProgress(null); setView("review"); }
      else {
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
        if (draft.control.generation && parts.image) draft.control.generation = { ...draft.control.generation, compiledImagePrompt: compileCoverPrompt(template, draft), photoKey: photoKey(draft), at: new Date().toISOString() };
        if (draft.control.generation && parts.song) draft.control.generation = { ...draft.control.generation, compiledMusicPrompt: compileSongPrompt(template, draft) };
        if (parts.song && draft.song.mode === "vocal") draft.song.audioLyricsVersion = draft.song.lyricsVersion;
      });
      await runGeneration(parts, createLocalIdempotencyKey(parts.image ? "pt-front" : "pt-audio"));
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
    rememberDeliverySource("personalize");
    router.push("/delivery");
  };

  const editFromReview = (questionId: string) => {
    setView("questions");
    setEditingId(questionId);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  };

  const sharedServices: QuestionServices = {
    pickPhotos, removePhoto, suggestCaption, draftAiMessage, loadRecommendations: async () => undefined, draftLyrics: runLyrics, generate,
    update: (change, shared) => update((draft) => change(draft), shared), edit: (id) => setEditingId(id),
    credits, creditsReady: creditStatus === "ready", generating,
  };
  const services: PtServices = {
    pickPhotos, removePhoto, suggest, research, draftStoryboard, generate, update,
    credits, creditsReady: creditStatus === "ready", generating, shared: sharedServices,
  };

  const templateName = template.id === "saved-template" ? brief.personalize.templateName : template.name;
  const header = (
    <header className="pt-flow-head">
      <p className="pt-flow-name"><span className={`pt-flow-swatch is-tone-${templateTone(template.id)}`} aria-hidden="true" />{templateName}</p>
      <button type="button" className="bmcq-link" onClick={onChangeTemplate}>Choose a different template</button>
    </header>
  );

  // ---- Render ---------------------------------------------------------------------------------------
  if (loading) return <div className="bmcq-shell"><Thinking label="Opening your card…" /></div>;

  if (view === "review" && brief.control.generation) {
    const firstDesign = template.questions.find((q) => q.stage === "Design" && q.applies(brief))?.id || "PT_photo_mode";
    return (
      <div className="bmcq-shell is-review pt-flow">
        {header}
        {notice && <p className="bmcq-notice" role="alert">{notice}</p>}
        <BmcReviewStage brief={brief} assets={assets} approvals={approvals} setApprovals={setApprovals} update={(change) => update((draft) => change(draft))}
          regenerate={async (parts) => { if (creditStatus === "ready" && credits < 1) outOfCredits(1, true); else setPendingSpend(parts); }}
          editAnswers={editFromReview} toDelivery={toDelivery} writeAi={draftAiMessage} working={working} headingRef={headingRef}
          frontPrompt={compileCoverPrompt(template, brief)} frontNotes={template.frontNotes(brief)} frontWords={template.writerBrief(brief).frontText.map((item) => item.text)} frontEditQuestionId={firstDesign}
          songLabel={`${templateName} song`} />
        {pendingSpend && (
          <BmcSpendDialog part={pendingSpend.image ? "front" : "song"} credits={credits} onCancel={() => setPendingSpend(null)}
            onConfirm={() => { const parts = pendingSpend; setPendingSpend(null); void regenerate(parts); }} />
        )}
        {topUpNeed && <TopUpChoiceDialog variant={topUpNeed.fromReview ? "redo" : "create"} need={topUpNeed.need} credits={credits} onCancel={() => setTopUpNeed(null)} onChoose={(choice) => { void chooseTopUp(choice); }} />}
      </div>
    );
  }

  const stage = question?.stage || "Review";
  const heading = question ? resolve(question.heading, brief) : null;

  return (
    <div className="bmcq-shell pt-flow">
      {header}
      <PtStageRail template={template} brief={brief} current={stage} onJump={(id) => setEditingId(id)} />
      <div className="bmcq-layout">
        <section className={`bmcq-card${question ? ` is-${question.kind}` : ""}`} data-stage={stage.toLowerCase()} aria-labelledby="bmcq-question-title">
          {notice && <p className="bmcq-notice" role="alert">{notice}</p>}
          {question && heading ? (
            <>
              <div className="bmcq-qhead">
                <h1 id="bmcq-question-title" className="bmcq-title" ref={headingRef} tabIndex={-1}>
                  {heading[0]} <span className="l-script">{heading[1]}</span>
                </h1>
              </div>
              {thinking ? <Thinking label="Reading your answer…" /> : <p className="bmcq-prompt">{prompt}</p>}
              {helper && <p className="bmcq-helper">{helper}</p>}
              <div className="bmcq-controls">
                <PtQuestion key={`${question.id}-${editingId ? "edit" : "flow"}`} template={template} brief={brief} question={question} busy={thinking}
                  answer={answer} skip={skip} back={back} services={services} />
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
        <PtSummary template={template} brief={brief} onEdit={(id) => setEditingId(id)} current={stage} />
      </div>

      {pendingPhotos.length > 0 && <BmcAttestationDialog files={pendingPhotos} onCancel={() => setPendingPhotos([])} onAgree={() => { void agreeToAttestation(); }} />}
      {progress && <BmcGeneratingDialog progress={progress} onClose={() => setProgress(null)} />}
      {topUpNeed && <TopUpChoiceDialog variant={topUpNeed.fromReview ? "redo" : "create"} need={topUpNeed.need} credits={credits} onCancel={() => setTopUpNeed(null)} onChoose={(choice) => { void chooseTopUp(choice); }} />}
    </div>
  );
}

