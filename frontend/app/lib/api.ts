import { getActiveCognitoSession, getStoredLocalUser } from "./cognitoAuth";
import type { LocalUser } from "./cognitoAuth";
import type { PtSuggestContext } from "./mockPersonalize";
import type { InterviewProposal, InterviewTurnInput, TextContext } from "../components/bmc/engine";
import type { PtOption, StoryboardPanel } from "../components/personalize/ptBrief";
import type { PtInterviewProposal, PtInterviewTurnInput } from "../components/personalize/ptEngine";
import type { PtSuggestTask } from "../components/personalize/types";
import { MOCK_MODE } from "./mockMode";

// The mock answers load only in mock data mode (Prompt 2 flows E-F2, 2026-11-09). Imported
// statically they put about 32 kB of mock code, the seed data and Build My Card's catalogue,
// question bank, engine and prompts into the chunk every page loads, even with mock mode off.
// Every call below is already async, so `await loadMock()` costs nothing after the first time.
const loadMock = () => import("./mockApi");
const loadMockInterview = () => import("./mockInterview");
const loadMockPersonalize = () => import("./mockPersonalize");

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

export const LOCAL_MOCK_USER_ID = "ad2c7c0f-797f-4bc2-b103-91a1fc61ddef";

export type PricingOffer = {
  id: string;
  databaseId: string;
  name: string;
  type: string;
  priceCents: number;
  currency: string;
  cardCountMin: number;
  cardCountMax: number;
  creditsPerCard: number;
  shippingIncluded: boolean;
  metadata: Record<string, unknown>;
};

type PricingResponse = {
  data: PricingOffer[];
};

export type CreditBalance = {
  userId: string;
  balance: number;
};

export type CardDraft = {
  id: string;
  user_id: string;
  occasion?: string | null;
  relationship?: string | null;
  creative_brief?: Record<string, unknown> | null;
  status: string;
  created_at: string;
  updated_at: string;
  /**
   * When the creation itself was last changed and saved. Drives the 12-month
   * library storage (PRD §5): viewing a card or an order/job update doesn't
   * move it, unlike `updated_at`. Missing on older records: use `created_at`.
   */
  last_saved_edit_at?: string | null;
};

/** A name and mailing address in the account's address book (PRD §5, saved recipients). */
export type SavedRecipientFields = {
  title: string;
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  address3: string;
  city: string;
  state: string;
  postalCode: string;
  /** "CA" or "US". */
  country: string;
};

export type SavedRecipient = SavedRecipientFields & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCardDraftRequest = {
  userId?: string;
  occasion?: string;
  relationship?: string;
  creativeBrief?: Record<string, unknown>;
};

export type UpdateCardDraftRequest = {
  occasion?: string;
  relationship?: string;
  creativeBrief?: Record<string, unknown>;
};

type CardDraftResponse = {
  cardDraft: CardDraft;
};

type UserCardDraftsResponse = {
  userId: string;
  cardDrafts: CardDraft[];
};

export type CardDraftAsset = {
  id: string;
  user_id?: string;
  card_draft_id?: string | null;
  generation_job_id?: string | null;
  asset_type?: string;
  s3_key?: string | null;
  moderation_state?: string | null;
  approved_at?: string | null;
  print_asset_key?: string | null;
  qr_metadata?: Record<string, unknown> | null;
  created_at?: string;
  userId?: string;
  cardDraftId?: string | null;
  generationJobId?: string | null;
  assetType?: string;
  storageKey?: string | null;
  mockUrl?: string | null;
  moderationState?: string | null;
  approvedAt?: string | null;
  printAssetKey?: string | null;
  qrMetadata?: Record<string, unknown>;
  createdAt?: string | null;
};

export type MockUploadRequest = {
  userId?: string;
  cardDraftId: string;
  filename: string;
  mimeType: string;
  size: number;
};

export type MockUpload = {
  id: string;
  userId: string;
  cardDraftId: string;
  assetId?: string | null;
  filename: string;
  mimeType: string;
  size: number;
  status: string;
  attestationAccepted?: boolean;
  uploadedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  mockUrl?: string | null;
  storageKey?: string | null;
};

export type MockUploadResponse = {
  upload?: MockUpload;
  asset?: CardDraftAsset | null;
};

type CardDraftAssetsResponse = {
  cardDraftId: string;
  assets: CardDraftAsset[];
};

export type StartGenerationRequest = {
  userId?: string;
  cardDraftId?: string;
  idempotencyKey: string;
  /**
   * Which assets to create. Image-only costs 1 credit, image and song 2, song
   * only 1. The live backend does not accept this field yet and always makes
   * all three (2 credits), so it is sent only in mock data mode.
   */
  parts?: { image: boolean; song: boolean };
};

export type GenerationStartResponse = {
  generationJob?: {
    id?: string;
    credits_charged?: number;
    [key: string]: unknown;
  };
  savedAssets?: CardDraftAsset[];
  mockAssets?: Record<string, unknown>;
  creditDeduction?: Record<string, unknown>;
  balance?: CreditBalance;
};

/**
 * A mailing address on an order. Lines, names, company and title are kept
 * separately because Scribeless's `POST /api/recipients` takes `firstName`,
 * `lastName` and `address{ address1, address2, address3, city, state,
 * postalCode, country }` (audit Part C, 2026-11-09). `name` stays for older
 * orders and readers; the newer fields are optional, so orders stored before
 * this change (one joined `line1`) still read correctly.
 */
export type PostalAddress = {
  name: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  line1: string;
  line2?: string;
  line3?: string;
  city: string;
  /** Province or state (required by Scribeless for Canada and the US). */
  region: string;
  postalCode: string;
  /** Two-letter code: CA or US. */
  country: string;
};

/** One address on an order and how many copies of the card go to it. */
export type OrderRecipient = {
  address: PostalAddress;
  /** Whole number, 1 to 99. */
  quantity: number;
};

/**
 * One order = one card design mailed to one or more recipients (owner,
 * 2026-11-08). Scribeless takes many recipients per send: the backend makes one
 * one-time campaign per order, posts every recipient in one
 * `POST /api/recipients` call (`data` as an array), then checks out. See
 * DEVELOPER_HANDOFF.md, "Orders with several recipients".
 */
export type CreateOrderRequest = {
  userId?: string;
  cardDraftId: string;
  selectedAssetId: string;
  /** At least one. A quantity of 2+ means copies to the same address. */
  recipients: OrderRecipient[];
  /** One return address for the whole order (Scribeless: one per campaign). Left out when the customer turns it off. */
  senderAddress?: PostalAddress;
};

/** Total cards an order mails (sum of the quantities). */
export function orderCardCount(recipients: OrderRecipient[]): number {
  return recipients.reduce((sum, recipient) => sum + recipient.quantity, 0);
}

/** Throws a readable error when the recipient list can't be sent. */
export function assertOrderRecipients(recipients: OrderRecipient[]): void {
  if (!recipients.length) throw new Error("Add at least one recipient before sending.");
  for (const recipient of recipients) {
    if (!Number.isInteger(recipient.quantity) || recipient.quantity < 1 || recipient.quantity > 99) {
      throw new Error("Each recipient needs between 1 and 99 cards.");
    }
  }
}

export type Order = {
  id: string;
  userId: string;
  cardDraftId: string | null;
  selectedAssetId: string | null;
  status: string;
  offerCode?: string | null;
  amountCents?: number;
  currency?: string;
  checkoutSessionId?: string | null;
  paymentId?: string | null;
  fulfillmentJobId?: string | null;
  mockFulfillmentId?: string | null;
  trackingUrl?: string | null;
  /** Every address on the order with its quantity (orders from 2026-11-08 on). */
  recipients?: { address: Record<string, unknown>; quantity: number }[];
  /** Older orders, and still sent as the first recipient until the backend reads `recipients`. */
  recipientAddress?: Record<string, unknown>;
  senderAddress?: Record<string, unknown>;
  qrCodeUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type OrderResponse = {
  order: Order;
};

export type CheckoutSession = {
  id: string;
  orderId: string;
  paymentId: string;
  providerMode?: string;
  status: string;
  amountCents?: number;
  currency?: string;
  checkoutUrl?: string;
  successUrl?: string | null;
  cancelUrl?: string | null;
  createdAt?: string | null;
  paidAt?: string | null;
};

export type CheckoutResponse = {
  checkoutSession: CheckoutSession;
  order: Order;
};

export type FulfillmentRecord = {
  id: string;
  orderId: string;
  userId: string;
  providerMode?: string;
  mockFulfillmentId?: string;
  status: string;
  submittedAt?: string | null;
  estimatedDelivery?: string;
  requestPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type FulfillmentSubmitResponse = {
  fulfillment: FulfillmentRecord;
  order: Order;
};

export type GrantCreditsRequest = {
  userId?: string;
  amount: number;
  source: string;
  idempotencyKey: string;
};

export type GrantCreditsResponse = {
  ledgerEntry?: Record<string, unknown>;
  balance?: CreditBalance;
};

export type AuthMeResponse = {
  user: LocalUser;
  paymentMethods?: PaymentMethod[];
  starterCredits?: {
    granted?: boolean;
    balance?: CreditBalance;
  };
};

export type UserProfileUpdate = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthday?: string;
  country?: string;
  currency?: string;
  language?: string;
  preferences?: Record<string, unknown>;
  /** Records acceptance of the Terms and Privacy Policy (the server sets the timestamp). */
  termsAccepted?: boolean;
  termsVersion?: string;
};

export type PaymentMethod = {
  id: string;
  user_id: string;
  stripe_payment_method_id?: string | null;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  billing_name?: string | null;
  billing_postal_code?: string | null;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SavePaymentMethodRequest = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  billingName?: string;
  billingPostalCode?: string;
  stripePaymentMethodId?: string;
  isDefault?: boolean;
};

type PaymentMethodsResponse = {
  paymentMethods: PaymentMethod[];
};

type PaymentMethodResponse = {
  paymentMethod: PaymentMethod;
};

export const CARD_DRAFTS_UPDATED_EVENT = "souv-card-drafts-updated";

export function getApiUserId(userId?: string) {
  return userId || getStoredLocalUser()?.id || LOCAL_MOCK_USER_ID;
}

async function buildApiHeaders(headers?: HeadersInit, json = false) {
  const nextHeaders = new Headers(headers);
  if (!nextHeaders.has("Accept")) nextHeaders.set("Accept", "application/json");
  if (json && !nextHeaders.has("Content-Type")) nextHeaders.set("Content-Type", "application/json");

  const session = await getActiveCognitoSession();
  if (session?.idToken) {
    nextHeaders.set("Authorization", `Bearer ${session.idToken}`);
  }

  return nextHeaders;
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { message?: unknown; error?: unknown };
    if (typeof payload.message === "string") return payload.message;
    if (Array.isArray(payload.message) && typeof payload.message[0] === "string") return payload.message[0];
    if (typeof payload.error === "string") return payload.error;
  } catch {
    // Keep the original fallback when the server does not return JSON.
  }

  return fallback;
}

export async function fetchPricingOffers(): Promise<PricingOffer[]> {
  if (MOCK_MODE) {
    return (await loadMock()).mockFetchPricingOffers();
  }

  const response = await fetch(`${API_BASE_URL}/pricing`, {
    headers: await buildApiHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Pricing request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as Partial<PricingResponse>;

  if (!Array.isArray(payload.data)) {
    throw new Error("Pricing response did not include a data array.");
  }

  return payload.data;
}

export async function fetchAuthenticatedUser(): Promise<LocalUser> {
  if (MOCK_MODE) {
    return (await (await loadMock()).mockFetchAuthenticatedUser()).user;
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: await buildApiHeaders(),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Authenticated user request failed with status ${response.status}.`);
    throw new Error(message);
  }

  const payload = (await response.json()) as Partial<AuthMeResponse>;
  if (typeof payload.user?.id !== "string" || typeof payload.user.email !== "string") {
    throw new Error("Authenticated user response did not include a local user id.");
  }

  return payload.user;
}

/** A failed API request, with its HTTP status (4xx = the request itself was rejected). */
export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export async function updateAuthenticatedUser(input: UserProfileUpdate): Promise<LocalUser> {
  if (MOCK_MODE) {
    return (await loadMock()).mockUpdateAuthenticatedUser(input).catch((error: { message?: string; status?: number }) => {
      throw new ApiRequestError(error.message || "Profile update failed.", error.status ?? 500);
    });
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "PATCH",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Profile update failed with status ${response.status}.`);
    throw new ApiRequestError(message, response.status);
  }

  const payload = (await response.json()) as Partial<AuthMeResponse>;
  if (typeof payload.user?.id !== "string" || typeof payload.user.email !== "string") {
    throw new Error("Profile update response did not include a local user.");
  }

  return payload.user;
}

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  if (MOCK_MODE) {
    return (await loadMock()).mockFetchPaymentMethods();
  }

  const response = await fetch(`${API_BASE_URL}/auth/payment-methods`, {
    headers: await buildApiHeaders(),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Payment methods request failed with status ${response.status}.`);
    throw new Error(message);
  }

  const payload = (await response.json()) as Partial<PaymentMethodsResponse>;
  if (!Array.isArray(payload.paymentMethods)) {
    throw new Error("Payment methods response did not include a paymentMethods array.");
  }

  return payload.paymentMethods;
}

export async function createPaymentMethod(input: SavePaymentMethodRequest): Promise<PaymentMethod> {
  if (MOCK_MODE) {
    return (await loadMock()).mockCreatePaymentMethod(input);
  }

  const response = await fetch(`${API_BASE_URL}/auth/payment-methods`, {
    method: "POST",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Payment method save failed with status ${response.status}.`);
    throw new Error(message);
  }

  const payload = (await response.json()) as Partial<PaymentMethodResponse>;
  if (!payload.paymentMethod?.id) {
    throw new Error("Payment method response did not include a saved method.");
  }

  return payload.paymentMethod;
}

export async function updatePaymentMethod(paymentMethodId: string, input: SavePaymentMethodRequest): Promise<PaymentMethod> {
  if (MOCK_MODE) {
    return (await loadMock()).mockUpdatePaymentMethod(paymentMethodId, input);
  }

  const response = await fetch(`${API_BASE_URL}/auth/payment-methods/${encodeURIComponent(paymentMethodId)}`, {
    method: "PATCH",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Payment method update failed with status ${response.status}.`);
    throw new Error(message);
  }

  const payload = (await response.json()) as Partial<PaymentMethodResponse>;
  if (!payload.paymentMethod?.id) {
    throw new Error("Payment method response did not include an updated method.");
  }

  return payload.paymentMethod;
}

export async function deletePaymentMethod(paymentMethodId: string): Promise<void> {
  if (MOCK_MODE) {
    return (await loadMock()).mockDeletePaymentMethod(paymentMethodId);
  }

  const response = await fetch(`${API_BASE_URL}/auth/payment-methods/${encodeURIComponent(paymentMethodId)}`, {
    method: "DELETE",
    headers: await buildApiHeaders(),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Payment method delete failed with status ${response.status}.`);
    throw new Error(message);
  }
}

// ---- Saved recipients (address book) ----------------------------------------
// Backend contract (not built yet; see DEVELOPER_HANDOFF.md): every route is
// owner-checked from the bearer token, so one customer can never read or change
// another's entries by guessing an id. Orders keep their own address snapshot.
//   GET    /recipients            -> { recipients: SavedRecipient[] }
//   POST   /recipients            body SavedRecipientFields -> { recipient }
//   PATCH  /recipients/:id        body SavedRecipientFields -> { recipient }
//   DELETE /recipients/:id        -> 204

async function recipientRequest<T>(path: string, init: RequestInit, fallback: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) throw new Error(await readErrorMessage(response, `${fallback} (status ${response.status}).`));
  return (response.status === 204 ? undefined : await response.json()) as T;
}

export async function fetchSavedRecipients(): Promise<SavedRecipient[]> {
  if (MOCK_MODE) return (await loadMock()).mockFetchSavedRecipients();
  const payload = await recipientRequest<{ recipients?: SavedRecipient[] }>("/recipients", { headers: await buildApiHeaders() }, "Saved recipients could not be loaded");
  return payload.recipients || [];
}

export async function createSavedRecipient(input: SavedRecipientFields): Promise<SavedRecipient> {
  if (MOCK_MODE) return (await loadMock()).mockCreateSavedRecipient(input);
  const payload = await recipientRequest<{ recipient: SavedRecipient }>("/recipients", {
    method: "POST",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify(input),
  }, "The recipient could not be saved");
  return payload.recipient;
}

export async function updateSavedRecipient(recipientId: string, input: SavedRecipientFields): Promise<SavedRecipient> {
  if (MOCK_MODE) return (await loadMock()).mockUpdateSavedRecipient(recipientId, input);
  const payload = await recipientRequest<{ recipient: SavedRecipient }>(`/recipients/${encodeURIComponent(recipientId)}`, {
    method: "PATCH",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify(input),
  }, "The recipient could not be updated");
  return payload.recipient;
}

export async function deleteSavedRecipient(recipientId: string): Promise<void> {
  if (MOCK_MODE) return (await loadMock()).mockDeleteSavedRecipient(recipientId);
  await recipientRequest<void>(`/recipients/${encodeURIComponent(recipientId)}`, {
    method: "DELETE",
    headers: await buildApiHeaders(),
  }, "The recipient could not be deleted");
}

// ---- Community Cards ------------------------------------------------------------
// Backend contract (not built yet; DEVELOPER_HANDOFF.md): POST /community-cards/drafts
// body CommunityDraftInput -> { cardDraft, assets }. The server checks the card id
// and version against its catalog, saves a card draft with creative_brief
// { flow: "community_card", communityCard, message }, and attaches the card's
// approved print file as the draft's image asset (plus a message asset when the
// inside isn't blank). No AI runs and no credits are charged.

export type CommunityDraftInput = {
  cardId: string;
  cardVersion: number;
  cardName: string;
  occasion: string;
  /** The customer's own words, saved exactly as typed; null for a blank inside. */
  message: string | null;
  /** The front shown at Delivery and in Saved Cards & Songs (the catalog art). */
  artUrl: string;
};

export async function createCommunityCardDraft(input: CommunityDraftInput): Promise<{ cardDraft: CardDraft; assets: CardDraftAsset[] }> {
  if (MOCK_MODE) return (await loadMock()).mockCreateCommunityCardDraft(input);
  const response = await fetch(`${API_BASE_URL}/community-cards/drafts`, {
    method: "POST",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, `The card couldn't be saved (status ${response.status}).`));
  return (await response.json()) as { cardDraft: CardDraft; assets: CardDraftAsset[] };
}

// ---- Community Cards submissions -----------------------------------------------
// A customer offers one of their finished Build My Card designs to the public
// Community Cards collection. Every submission is reviewed by our team before
// it's posted (components/community/communityGuidelines.ts; Terms §5).
// Backend contract (not built yet; DEVELOPER_HANDOFF.md):
//   POST /community-cards/submissions body CommunitySubmissionInput -> { submission }
//     400 not a finished Build My Card design, or made from uploaded photos;
//     409 already submitted (in review or approved).
//   GET  /community-cards/submissions/mine -> { submissions }
// The backend copies the front image at submission time (later edits to the
// draft don't change what's reviewed), stores the guidelines version and the
// agreement time, and emails the customer when the status changes.
// Mock mode keeps them in the mock database; nothing is ever approved there.

export type CommunitySubmissionStatus = "in_review" | "changes_requested" | "approved" | "declined";

export type CommunitySubmission = {
  id: string;
  cardDraftId: string;
  name: string;
  occasion: string;
  artUrl: string | null;
  status: CommunitySubmissionStatus;
  /** What the reviewer asked for, or why it was declined. */
  reviewNote: string | null;
  /** The Community Card's id once it's approved and posted. */
  publicCardId: string | null;
  guidelinesVersion: string;
  createdAt: string;
};

export type CommunitySubmissionInput = {
  cardDraftId: string;
  /** The public name on the tile, up to 40 characters. */
  name: string;
  occasion: string;
  /** COMMUNITY_GUIDELINES_VERSION (components/community/communityGuidelines.ts), agreed to in the pop-up. */
  guidelinesVersion: string;
};

export async function submitCommunityCard(input: CommunitySubmissionInput): Promise<{ submission: CommunitySubmission }> {
  if (MOCK_MODE) return (await loadMock()).mockSubmitCommunityCard(input);
  const response = await fetch(`${API_BASE_URL}/community-cards/submissions`, {
    method: "POST",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, `Your card couldn't be submitted (status ${response.status}).`));
  return (await response.json()) as { submission: CommunitySubmission };
}

export async function fetchMyCommunitySubmissions(): Promise<CommunitySubmission[]> {
  if (MOCK_MODE) return (await loadMock()).mockFetchMyCommunitySubmissions();
  const response = await fetch(`${API_BASE_URL}/community-cards/submissions/mine`, { headers: await buildApiHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, `Your submissions couldn't be loaded (status ${response.status}).`));
  const payload = (await response.json()) as { submissions?: CommunitySubmission[] };
  return Array.isArray(payload.submissions) ? payload.submissions : [];
}

// ---- Contact / support messages ------------------------------------------------
// Backend contract (not built yet; DEVELOPER_HANDOFF.md): POST /support/messages
// body ContactMessageInput -> { reference }. It should email the support inbox
// (SUPPORT_EMAIL) and keep the message for follow-up. No email provider is wired
// in the frontend; mock mode stores the message in the mock database.

export type ContactTopic = "card-or-order" | "song" | "account" | "refund-or-reprint" | "something-else";

export type ContactMessageInput = {
  name: string;
  email: string;
  topic: ContactTopic;
  orderReference?: string;
  message: string;
};

export async function submitContactMessage(input: ContactMessageInput): Promise<{ reference: string }> {
  if (MOCK_MODE) return (await loadMock()).mockSubmitContactMessage(input);
  const response = await fetch(`${API_BASE_URL}/support/messages`, {
    method: "POST",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, `Your message couldn't be sent (status ${response.status}).`));
  return (await response.json()) as { reference: string };
}

// ---- Photo-consent acceptance (upload rights pop-up) -----------------------------
// Backend contract (not built yet; DEVELOPER_HANDOFF.md): POST /attestations
// body PhotoAttestationRecord -> 204, owner from the token. Kept with the photos
// it covers (the creation flows can add cardDraftId when they save the upload).

export type PhotoAttestationRecord = {
  /** ATTESTATION_VERSION of the wording that was shown. */
  version: string;
  acceptedAt: string;
  photoCount: number;
  cardDraftId?: string | null;
};

export async function recordPhotoAttestation(record: PhotoAttestationRecord): Promise<void> {
  if (MOCK_MODE) return (await loadMock()).mockRecordPhotoAttestation(record);
  const response = await fetch(`${API_BASE_URL}/attestations`, {
    method: "POST",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify(record),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, `The photo consent couldn't be recorded (status ${response.status}).`));
}

// ---- Account deletion -----------------------------------------------------------
// Backend contract (DEVELOPER_HANDOFF.md): DELETE /auth/me removes the profile,
// saved recipients and private library, keeps songs already linked to mailed
// cards (their QR links keep working) and the order/payment records the law
// requires. The app then deletes the Cognito user and signs out.

export async function deleteAuthenticatedUser(): Promise<void> {
  if (MOCK_MODE) return (await loadMock()).mockDeleteAuthenticatedUser();
  const response = await fetch(`${API_BASE_URL}/auth/me`, { method: "DELETE", headers: await buildApiHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, `Account deletion failed with status ${response.status}.`));
}

export async function fetchCreditBalance(userId?: string): Promise<CreditBalance> {
  if (MOCK_MODE) {
    return (await loadMock()).mockFetchCreditBalance(userId);
  }

  const resolvedUserId = getApiUserId(userId);
  const response = await fetch(`${API_BASE_URL}/credits/balance/${encodeURIComponent(resolvedUserId)}`, {
    headers: await buildApiHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Credit balance request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as Partial<CreditBalance>;

  if (typeof payload.userId !== "string" || typeof payload.balance !== "number" || !Number.isFinite(payload.balance)) {
    throw new Error("Credit balance response did not include a valid balance.");
  }

  return {
    userId: payload.userId,
    balance: payload.balance,
  };
}

export async function createCardDraft({
  userId,
  occasion,
  relationship,
  creativeBrief,
}: CreateCardDraftRequest): Promise<CardDraft> {
  if (MOCK_MODE) {
    return (await loadMock()).mockCreateCardDraft({ userId, occasion, relationship, creativeBrief });
  }

  const resolvedUserId = getApiUserId(userId);
  const response = await fetch(`${API_BASE_URL}/card-drafts`, {
    method: "POST",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify({
      userId: resolvedUserId,
      ...(occasion ? { occasion } : {}),
      ...(relationship ? { relationship } : {}),
      creativeBrief: creativeBrief ?? {},
    }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Card draft request failed with status ${response.status}.`);
    throw new Error(message);
  }

  const payload = (await response.json()) as Partial<CardDraftResponse>;
  if (!payload.cardDraft?.id) {
    throw new Error("Card draft response did not include a draft id.");
  }

  return payload.cardDraft;
}

export async function fetchCardDraftById(cardDraftId: string): Promise<CardDraft> {
  if (MOCK_MODE) {
    return (await loadMock()).mockFetchCardDraftById(cardDraftId);
  }

  const response = await fetch(`${API_BASE_URL}/card-drafts/${encodeURIComponent(cardDraftId)}`, {
    headers: await buildApiHeaders(),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Card draft request failed with status ${response.status}.`);
    throw new Error(message);
  }

  const payload = (await response.json()) as Partial<CardDraftResponse>;
  if (!payload.cardDraft?.id) {
    throw new Error("Card draft response did not include a draft id.");
  }

  return payload.cardDraft;
}

export async function updateCardDraft(
  cardDraftId: string,
  { occasion, relationship, creativeBrief }: UpdateCardDraftRequest,
): Promise<CardDraft> {
  if (MOCK_MODE) {
    return (await loadMock()).mockUpdateCardDraft(cardDraftId, { occasion, relationship, creativeBrief });
  }

  const response = await fetch(`${API_BASE_URL}/card-drafts/${encodeURIComponent(cardDraftId)}`, {
    method: "PATCH",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify({
      ...(occasion ? { occasion } : {}),
      ...(relationship ? { relationship } : {}),
      ...(creativeBrief ? { creativeBrief } : {}),
    }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Card draft update failed with status ${response.status}.`);
    throw new Error(message);
  }

  const payload = (await response.json()) as Partial<CardDraftResponse>;
  if (!payload.cardDraft?.id) {
    throw new Error("Card draft update response did not include a draft id.");
  }

  return payload.cardDraft;
}

export async function fetchUserCardDrafts(userId?: string): Promise<CardDraft[]> {
  if (MOCK_MODE) {
    return (await loadMock()).mockFetchUserCardDrafts(userId);
  }

  const resolvedUserId = getApiUserId(userId);
  const response = await fetch(`${API_BASE_URL}/card-drafts/user/${encodeURIComponent(resolvedUserId)}`, {
    headers: await buildApiHeaders(),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Card drafts request failed with status ${response.status}.`);
    throw new Error(message);
  }

  const payload = (await response.json()) as Partial<UserCardDraftsResponse>;
  if (!Array.isArray(payload.cardDrafts)) {
    throw new Error("Card drafts response did not include a cardDrafts array.");
  }

  return payload.cardDrafts;
}

/**
 * Deletes a draft or finished creation from the customer's library.
 * Backend contract (owner-checked): DELETE /card-drafts/:id -> 204. Submitted
 * orders keep their own copy of the card, and a mailed card's QR song keeps
 * working, so deleting never changes an order.
 */
export async function deleteCardDraft(cardDraftId: string): Promise<void> {
  if (MOCK_MODE) {
    await (await loadMock()).mockDeleteCardDraft(cardDraftId);
  } else {
    const response = await fetch(`${API_BASE_URL}/card-drafts/${encodeURIComponent(cardDraftId)}`, {
      method: "DELETE",
      headers: await buildApiHeaders(),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, `Card delete failed with status ${response.status}.`));
    }
  }
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(CARD_DRAFTS_UPDATED_EVENT, { detail: { cardDraftId } }));
}

export async function fetchCardDraftAssets(cardDraftId: string): Promise<CardDraftAsset[]> {
  if (MOCK_MODE) {
    return (await loadMock()).mockFetchCardDraftAssets(cardDraftId);
  }

  const response = await fetch(`${API_BASE_URL}/assets/card-draft/${encodeURIComponent(cardDraftId)}`, {
    headers: await buildApiHeaders(),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Card draft assets request failed with status ${response.status}.`);
    throw new Error(message);
  }

  const payload = (await response.json()) as Partial<CardDraftAssetsResponse>;
  if (!Array.isArray(payload.assets)) {
    throw new Error("Card draft assets response did not include an assets array.");
  }

  return payload.assets;
}

export async function mockUpload({
  userId,
  cardDraftId,
  filename,
  mimeType,
  size,
}: MockUploadRequest): Promise<MockUploadResponse> {
  if (MOCK_MODE) {
    return (await loadMock()).mockMockUpload({ userId, cardDraftId, filename, mimeType, size });
  }

  const resolvedUserId = getApiUserId(userId);
  const response = await fetch(`${API_BASE_URL}/uploads/mock`, {
    method: "POST",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify({
      userId: resolvedUserId,
      cardDraftId,
      filename,
      mimeType,
      size,
    }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Mock upload failed with status ${response.status}.`);
    throw new Error(message);
  }

  return (await response.json()) as MockUploadResponse;
}

export async function refreshCardDraftBackendState(cardDraftId: string, userId?: string) {
  const resolvedUserId = getApiUserId(userId);
  const [cardDrafts, assets] = await Promise.all([
    fetchUserCardDrafts(resolvedUserId),
    fetchCardDraftAssets(cardDraftId),
  ]);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CARD_DRAFTS_UPDATED_EVENT, {
      detail: { userId: resolvedUserId, cardDraftId, cardDrafts, assets },
    }));
  }

  return { cardDrafts, assets };
}

export async function startGeneration({
  userId,
  cardDraftId,
  idempotencyKey,
  parts,
}: StartGenerationRequest): Promise<GenerationStartResponse> {
  if (MOCK_MODE) {
    return (await loadMock()).mockStartGeneration({ userId, cardDraftId, idempotencyKey, parts });
  }

  const resolvedUserId = getApiUserId(userId);
  const response = await fetch(`${API_BASE_URL}/generation/start`, {
    method: "POST",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify({
      userId: resolvedUserId,
      ...(cardDraftId ? { cardDraftId } : {}),
      idempotencyKey,
    }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Generation request failed with status ${response.status}.`);
    throw new Error(message);
  }

  return (await response.json()) as GenerationStartResponse;
}

export async function createOrder({
  userId,
  cardDraftId,
  selectedAssetId,
  recipients,
  senderAddress,
}: CreateOrderRequest): Promise<Order> {
  assertOrderRecipients(recipients);
  if (MOCK_MODE) {
    return (await loadMock()).mockCreateOrder({ userId, cardDraftId, selectedAssetId, recipients, senderAddress });
  }

  const resolvedUserId = getApiUserId(userId);
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify({
      userId: resolvedUserId,
      cardDraftId,
      selectedAssetId,
      recipients,
      // Transitional: today's backend reads one `recipientAddress`. Remove once
      // POST /orders accepts `recipients` (DEVELOPER_HANDOFF.md).
      recipientAddress: recipients[0].address,
      senderAddress,
    }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Order creation failed with status ${response.status}.`);
    throw new Error(message);
  }

  const payload = (await response.json()) as Partial<OrderResponse>;
  if (!payload.order?.id) {
    throw new Error("Order response did not include an order id.");
  }

  return payload.order;
}

export async function startCheckout(orderId: string): Promise<CheckoutResponse> {
  if (MOCK_MODE) {
    return (await loadMock()).mockStartCheckout(orderId);
  }

  const response = await fetch(`${API_BASE_URL}/checkout/start`, {
    method: "POST",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Checkout start failed with status ${response.status}.`);
    throw new Error(message);
  }

  const payload = (await response.json()) as Partial<CheckoutResponse>;
  if (!payload.checkoutSession?.id || !payload.order?.id) {
    throw new Error("Checkout response did not include a checkout session and order.");
  }

  return {
    checkoutSession: payload.checkoutSession,
    order: payload.order,
  };
}

export async function completeMockCheckout(orderId: string): Promise<CheckoutResponse> {
  if (MOCK_MODE) {
    return (await loadMock()).mockCompleteMockCheckout(orderId);
  }

  const response = await fetch(`${API_BASE_URL}/checkout/mock-success`, {
    method: "POST",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Mock checkout completion failed with status ${response.status}.`);
    throw new Error(message);
  }

  const payload = (await response.json()) as Partial<CheckoutResponse>;
  if (!payload.checkoutSession?.id || !payload.order?.id) {
    throw new Error("Mock checkout response did not include a checkout session and order.");
  }

  return {
    checkoutSession: payload.checkoutSession,
    order: payload.order,
  };
}

export async function submitFulfillment(orderId: string): Promise<FulfillmentSubmitResponse> {
  if (MOCK_MODE) {
    return (await loadMock()).mockSubmitFulfillment(orderId);
  }

  const response = await fetch(`${API_BASE_URL}/fulfillment/submit`, {
    method: "POST",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Fulfillment submit failed with status ${response.status}.`);
    throw new Error(message);
  }

  const payload = (await response.json()) as Partial<FulfillmentSubmitResponse>;
  if (!payload.fulfillment?.id || !payload.order?.id) {
    throw new Error("Fulfillment response did not include a fulfillment record and order.");
  }

  return {
    fulfillment: payload.fulfillment,
    order: payload.order,
  };
}

export async function grantCredits({
  userId,
  amount,
  source,
  idempotencyKey,
}: GrantCreditsRequest): Promise<GrantCreditsResponse> {
  if (MOCK_MODE) {
    return (await loadMock()).mockGrantCredits({ userId, amount, source, idempotencyKey });
  }

  const resolvedUserId = getApiUserId(userId);
  const response = await fetch(`${API_BASE_URL}/credits/grant`, {
    method: "POST",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify({
      userId: resolvedUserId,
      amount,
      source,
      idempotencyKey,
    }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, `Credit grant request failed with status ${response.status}.`);
    throw new Error(message);
  }

  return (await response.json()) as GrantCreditsResponse;
}

export function createLocalIdempotencyKey(prefix: string) {
  const secureCrypto = globalThis.crypto;
  if (secureCrypto && typeof secureCrypto.randomUUID === "function") {
    return `${prefix}-${secureCrypto.randomUUID()}`;
  }

  if (secureCrypto && typeof secureCrypto.getRandomValues === "function") {
    const randomBytes = new Uint8Array(16);
    secureCrypto.getRandomValues(randomBytes);
    const randomValue = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${prefix}-${randomValue}`;
  }

  throw new Error("Secure randomness is unavailable; an idempotency key could not be created.");
}

// ---- Build My Card text models ---------------------------------------------
// The adaptive interviewer and inside-message writer (Claude Haiku 5.5 on
// Bedrock), plus caption, genre-recommendation and lyric tasks. These run on
// the backend so model credentials never reach the browser. The routes below
// are the proposed contract in build-fixes/mock-data-mode-2026-11-07/
// BMC-BEDROCK-HANDOFF.md; on the mock-data-mode branch the mock answers them.

async function postBuildMyCard<T>(path: string, body: unknown, fallback: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/build-my-card/${path}`, {
    method: "POST",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `${fallback} (status ${response.status}).`));
  }
  return (await response.json()) as T;
}

export async function proposeInterviewTurn(input: InterviewTurnInput): Promise<InterviewProposal> {
  if (MOCK_MODE) return (await loadMockInterview()).mockProposeInterviewTurn(input);
  return postBuildMyCard<InterviewProposal>("interview", input, "The next question could not be prepared");
}

/** `userDirection`: the customer's optional note for this redraft only (already cleaned; null on the first draft). */
export async function draftInsideMessage(context: TextContext, previousDrafts: string[], userDirection: string | null = null): Promise<{ message: string; needsClarification: string[] }> {
  if (MOCK_MODE) return (await loadMockInterview()).mockDraftInsideMessage(context, previousDrafts, userDirection);
  return postBuildMyCard("inside-message", { message_context_json: context, previous_drafts: previousDrafts, user_direction: userDirection }, "The message could not be drafted");
}

export async function draftCaption(context: TextContext, previousDrafts: string[]): Promise<{ caption: string; needsClarification: string[] }> {
  if (MOCK_MODE) return (await loadMockInterview()).mockDraftCaption(context, previousDrafts);
  return postBuildMyCard("caption", { context, previous_drafts: previousDrafts }, "A caption could not be suggested");
}

export async function recommendGenres(input: { occasion: string | null; vibes: string[]; intendedFeeling: string; userDirection: string | null }): Promise<{ recommendations: { presetId: string; reason: string }[] }> {
  if (MOCK_MODE) return (await loadMockInterview()).mockRecommendGenres(input);
  return postBuildMyCard("genre-recommendations", input, "Music suggestions could not be loaded");
}

export async function draftLyrics(context: TextContext, presetId: string, previousDrafts: string[], userDirection: string | null = null): Promise<{ lyrics: string; needsClarification: string[] }> {
  if (MOCK_MODE) return (await loadMockInterview()).mockDraftLyrics(context, presetId, previousDrafts, userDirection);
  return postBuildMyCard("lyrics", { story_context_json: context, preset_id: presetId, previous_drafts: previousDrafts, user_direction: userDirection }, "Lyrics could not be drafted");
}

// ---- Personalize a Template text models -------------------------------------
// Each card's interviewer and suggestion sets (Claude Haiku 5.5 on Bedrock),
// On This Day's story research (needs a web-search tool on the backend), the
// comic storyboard and the "Suggest a template" box. Proposed routes:
// build-fixes/mock-data-mode-2026-11-07/PERSONALIZE-BEDROCK-HANDOFF.md. On the
// mock-data-mode branch the mock answers them (lib/mockPersonalize.ts).

async function postPersonalize<T>(path: string, body: unknown, fallback: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/personalize/${path}`, {
    method: "POST",
    headers: await buildApiHeaders(undefined, true),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `${fallback} (status ${response.status}).`));
  }
  return (await response.json()) as T;
}

export async function proposePersonalizeTurn(input: PtInterviewTurnInput): Promise<PtInterviewProposal> {
  if (MOCK_MODE) return (await loadMockPersonalize()).mockProposePersonalizeTurn(input);
  return postPersonalize<PtInterviewProposal>("interview", input, "The next question could not be prepared");
}

export async function suggestPersonalizeOptions(task: PtSuggestTask, context: PtSuggestContext, previous: string[]): Promise<{ options: PtOption[] }> {
  if (MOCK_MODE) return (await loadMockPersonalize()).mockSuggestOptions(task, context, previous);
  return postPersonalize("suggestions", { task, context, previous }, "Suggestions could not be loaded");
}

export async function researchOnThisDay(input: { date: string; location: string | null; includeLighter: boolean }): Promise<{ candidates: PtOption[]; recommendedId: string | null; note: string }> {
  if (MOCK_MODE) return (await loadMockPersonalize()).mockResearchOnThisDay(input);
  return postPersonalize("on-this-day/research", input, "Stories from that day could not be found");
}

export async function draftComicStoryboard(input: { recipientName: string | null; story: string; ending: string | null; occasion: string | null }, previousDrafts: number): Promise<{ panels: StoryboardPanel[] }> {
  if (MOCK_MODE) return (await loadMockPersonalize()).mockDraftStoryboard(input, previousDrafts);
  return postPersonalize("comic/storyboard", { ...input, previous_drafts: previousDrafts }, "The storyboard could not be drafted");
}

export async function submitTemplateSuggestion(input: { idea: string; email: string; searchQuery?: string | null; occasionFilter?: string | null }): Promise<{ ok: true; duplicate: boolean }> {
  if (MOCK_MODE) return (await loadMockPersonalize()).mockSubmitTemplateSuggestion(input);
  return postPersonalize("template-suggestions", input, "Your idea could not be sent");
}
