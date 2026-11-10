/**
 * Mock versions of every backend endpoint in api.ts, answered from the
 * localStorage database in mockDb.ts. Behaviour follows the NestJS mock
 * backend (backend/server/src): same statuses, same credit cost, same errors.
 */
import type {
  AuthMeResponse,
  CardDraft,
  CardDraftAsset,
  CheckoutResponse,
  CommunityDraftInput,
  CommunitySubmission,
  CommunitySubmissionInput,
  CreateCardDraftRequest,
  CreateOrderRequest,
  CreditBalance,
  FulfillmentSubmitResponse,
  GenerationStartResponse,
  GrantCreditsRequest,
  GrantCreditsResponse,
  MockUploadRequest,
  MockUploadResponse,
  Order,
  PaymentMethod,
  PostalAddress,
  PricingOffer,
  SavePaymentMethodRequest,
  ContactMessageInput,
  PhotoAttestationRecord,
  SavedRecipient,
  SavedRecipientFields,
  StartGenerationRequest,
  UpdateCardDraftRequest,
  UserProfileUpdate,
} from "./api";
import { getStoredCognitoSession } from "./cognitoAuth";
import type { LocalUser } from "./cognitoAuth";
import {
  buildMockAsset,
  findAccountBySub,
  findAccountByUserId,
  generatedAssetSet,
  mockAssetUrl,
  mockId,
  nowIso,
  readMockDb,
  updateMockDb,
} from "./mockDb";
import type { MockDb } from "./mockDb";
import { mockDelay } from "./mockMode";
import { AI_CREDITS_PER_CARD, CURRENCY_BY_COUNTRY, PRICE_LISTS, crossBorderPostage, toCountry } from "./priceLists";

const GENERATION_COST = 2;
const STARTER_CREDITS = 2;

// The active catalog rows after migration 008 (Canada and the US), built from
// the same price lists as the frontend fallback so the two can't drift.
const PRICING: PricingOffer[] = (["CAD", "USD"] as const).flatMap((currency) => {
  const list = PRICE_LISTS[currency];
  const code = currency.toLowerCase();
  const suffix = currency === "CAD" ? "" : "_usd";
  const row = (id: string, name: string, type: string, price: number, min: number, max: number, credits: number, shipping: boolean, metadata: Record<string, unknown> = {}): PricingOffer => ({
    id, databaseId: `mock-price-${id}`, name, type, priceCents: Math.round(price * 100), currency: code,
    cardCountMin: min, cardCountMax: max, creditsPerCard: credits, shippingIncluded: shipping, metadata,
  });
  return [
    row(`print_and_send${suffix}`, "Print and Send", "print_and_send", list.printAndSend, 1, 1, AI_CREDITS_PER_CARD, true),
    ...list.bigSender.map((tier) => row(`big_sender${suffix}_${tier.min}_${tier.max}`, `Big Sender ${tier.min}-${tier.max} Cards`, "big_sender", tier.pricePerCard, tier.min, tier.max, AI_CREDITS_PER_CARD, true)),
    ...list.creditPacks.map((pack) => row(`credits_${pack.id}_${code}`, `${pack.id[0].toUpperCase()}${pack.id.slice(1)} credits`, "credit_pack", pack.price, 0, 0, 0, false, { credits: pack.tokens })),
    row(`replacement_${code}`, "Typo or wrong-address replacement", "replacement", list.replacement, 1, 1, 0, true, { per_card_limit: 1 }),
  ];
});

class MockApiError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

/** The signed-in mock account, like the backend reading the bearer token. */
function requireAccount(db: MockDb) {
  const session = getStoredCognitoSession();
  const account = session ? findAccountBySub(db, session.sub) : null;
  if (!account) throw new MockApiError("Missing or invalid authorization token.", 401);
  return account;
}

function resolveUserId(db: MockDb, userId?: string) {
  if (userId && findAccountByUserId(db, userId)) return userId;
  return requireAccount(db).user.id;
}

function balanceOf(db: MockDb, userId: string): CreditBalance {
  return { userId, balance: db.balances[userId] ?? 0 };
}

function findDraft(db: MockDb, cardDraftId: string) {
  const draft = db.cardDrafts.find((candidate) => candidate.id === cardDraftId);
  if (!draft) throw new MockApiError("Card draft not found.", 404);
  return draft;
}

function findOrder(db: MockDb, orderId: string) {
  const order = db.orders.find((candidate) => candidate.id === orderId);
  if (!order) throw new MockApiError("Order not found.", 404);
  return order;
}

function assertOrderStatus(order: Order, allowed: string[], action: string) {
  if (!allowed.includes(order.status)) {
    throw new MockApiError(`Order must be in ${allowed.join(" or ")} status to ${action}. Current status: ${order.status}.`);
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- Pricing ---------------------------------------------------------------

export async function mockFetchPricingOffers(): Promise<PricingOffer[]> {
  await mockDelay(150);
  return clone(PRICING);
}

// ---- Auth / profile ----------------------------------------------------------

/** GET /auth/me: also grants the 2 starter credits once, like the backend. */
export async function mockFetchAuthenticatedUser(): Promise<AuthMeResponse> {
  await mockDelay(150);
  return updateMockDb((db) => {
    const account = requireAccount(db);
    let granted = false;
    if (!account.starterCreditsGranted) {
      account.starterCreditsGranted = true;
      db.balances[account.user.id] = (db.balances[account.user.id] ?? 0) + STARTER_CREDITS;
      granted = true;
    }
    return {
      user: clone(account.user),
      starterCredits: { granted, balance: balanceOf(db, account.user.id) },
    };
  });
}

export async function mockUpdateAuthenticatedUser(input: UserProfileUpdate): Promise<LocalUser> {
  await mockDelay();
  return updateMockDb((db) => {
    const account = requireAccount(db);
    const user = account.user;
    if (input.firstName !== undefined) user.first_name = input.firstName || null;
    if (input.lastName !== undefined) user.last_name = input.lastName || null;
    if (input.phone !== undefined) user.phone = input.phone || null;
    if (input.birthday !== undefined) user.birthday = input.birthday || null;
    if (input.country !== undefined) user.country = input.country || null;
    if (input.currency !== undefined) user.currency = input.currency || null;
    if (input.language !== undefined) user.language = input.language || null;
    if (input.preferences !== undefined) user.preferences = { ...(user.preferences || {}), ...input.preferences };
    if (input.termsAccepted) {
      user.terms_accepted_at = nowIso();
      user.terms_version = input.termsVersion || user.terms_version || null;
    }
    user.updated_at = nowIso();
    return clone(user);
  });
}

// ---- Payment methods ---------------------------------------------------------

function sortedMethods(db: MockDb, userId: string) {
  return db.paymentMethods
    .filter((method) => method.user_id === userId)
    .sort((a, b) => Number(b.is_default) - Number(a.is_default) || String(b.updated_at).localeCompare(String(a.updated_at)));
}

function cleanMethodInput(input: SavePaymentMethodRequest) {
  const last4 = String(input.last4 || "").replace(/\D/g, "");
  if (last4.length !== 4) throw new MockApiError("Payment method last4 must include exactly four digits.");
  return {
    brand: input.brand?.trim().slice(0, 40) || "Card",
    last4,
    exp_month: Number(input.expMonth),
    exp_year: Number(input.expYear),
    billing_name: input.billingName?.trim() || null,
    billing_postal_code: input.billingPostalCode?.trim() || null,
    stripe_payment_method_id: input.stripePaymentMethodId?.trim() || null,
  };
}

export async function mockFetchPaymentMethods(): Promise<PaymentMethod[]> {
  await mockDelay(150);
  const db = readMockDb();
  return clone(sortedMethods(db, requireAccount(db).user.id));
}

export async function mockCreatePaymentMethod(input: SavePaymentMethodRequest): Promise<PaymentMethod> {
  await mockDelay();
  return updateMockDb((db) => {
    const userId = requireAccount(db).user.id;
    const existing = sortedMethods(db, userId);
    const isDefault = input.isDefault ?? existing.length === 0;
    if (isDefault) existing.forEach((method) => { method.is_default = false; });
    const method: PaymentMethod = {
      id: mockId(),
      user_id: userId,
      ...cleanMethodInput(input),
      is_default: isDefault,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    db.paymentMethods.push(method);
    return clone(method);
  });
}

export async function mockUpdatePaymentMethod(paymentMethodId: string, input: SavePaymentMethodRequest): Promise<PaymentMethod> {
  await mockDelay();
  return updateMockDb((db) => {
    const userId = requireAccount(db).user.id;
    const method = db.paymentMethods.find((candidate) => candidate.id === paymentMethodId && candidate.user_id === userId);
    if (!method) throw new MockApiError("Payment method not found.", 404);
    const isDefault = input.isDefault ?? method.is_default;
    if (isDefault && !method.is_default) sortedMethods(db, userId).forEach((other) => { other.is_default = false; });
    Object.assign(method, cleanMethodInput(input), { is_default: isDefault, updated_at: nowIso() });
    return clone(method);
  });
}

export async function mockDeletePaymentMethod(paymentMethodId: string): Promise<void> {
  await mockDelay();
  updateMockDb((db) => {
    const userId = requireAccount(db).user.id;
    const method = db.paymentMethods.find((candidate) => candidate.id === paymentMethodId && candidate.user_id === userId);
    if (!method) throw new MockApiError("Payment method not found.", 404);
    db.paymentMethods = db.paymentMethods.filter((candidate) => candidate.id !== paymentMethodId);
    if (method.is_default) {
      const next = sortedMethods(db, userId)[0];
      if (next) next.is_default = true;
    }
  });
}

// ---- Saved recipients (address book) ----------------------------------------

const RECIPIENT_FIELDS: (keyof SavedRecipientFields)[] = [
  "title", "firstName", "lastName", "company", "address1", "address2", "address3", "city", "state", "postalCode", "country",
];

function cleanRecipient(input: SavedRecipientFields): SavedRecipientFields {
  const clean = {} as SavedRecipientFields;
  RECIPIENT_FIELDS.forEach((key) => { clean[key] = String(input[key] ?? "").trim(); });
  clean.country = clean.country === "US" ? "US" : "CA";
  if (!clean.firstName || !clean.lastName || !clean.address1 || !clean.city || !clean.state || !clean.postalCode) {
    throw new MockApiError("A name and a full mailing address are required.", 400);
  }
  return clean;
}

/** The signed-in customer's entries only: another account's id is simply "not found". */
function ownRecipient(db: MockDb, recipientId: string) {
  const userId = requireAccount(db).user.id;
  const recipient = (db.recipients ??= []).find((candidate) => candidate.id === recipientId && candidate.userId === userId);
  if (!recipient) throw new MockApiError("Saved recipient not found.", 404);
  return recipient;
}

/** What the API returns: the entry without its owner id. */
function publicRecipient(recipient: SavedRecipient & { userId: string }): SavedRecipient {
  const fields = {} as SavedRecipientFields;
  RECIPIENT_FIELDS.forEach((key) => { fields[key] = recipient[key]; });
  return { ...fields, id: recipient.id, createdAt: recipient.createdAt, updatedAt: recipient.updatedAt };
}

export async function mockFetchSavedRecipients(): Promise<SavedRecipient[]> {
  await mockDelay(120);
  const db = readMockDb();
  const userId = requireAccount(db).user.id;
  return (db.recipients || [])
    .filter((recipient) => recipient.userId === userId)
    .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
    .map(publicRecipient);
}

export async function mockCreateSavedRecipient(input: SavedRecipientFields): Promise<SavedRecipient> {
  await mockDelay();
  return updateMockDb((db) => {
    const userId = requireAccount(db).user.id;
    const fields = cleanRecipient(input);
    const list = (db.recipients ??= []);
    // Saving the same name and address twice keeps one entry.
    const same = list.find((candidate) => candidate.userId === userId
      && RECIPIENT_FIELDS.every((key) => candidate[key].toLowerCase() === fields[key].toLowerCase()));
    if (same) return publicRecipient(same);
    const recipient = { ...fields, id: mockId(), userId, createdAt: nowIso(), updatedAt: nowIso() };
    list.push(recipient);
    return publicRecipient(recipient);
  });
}

export async function mockUpdateSavedRecipient(recipientId: string, input: SavedRecipientFields): Promise<SavedRecipient> {
  await mockDelay();
  return updateMockDb((db) => {
    const recipient = ownRecipient(db, recipientId);
    Object.assign(recipient, cleanRecipient(input), { updatedAt: nowIso() });
    return publicRecipient(recipient);
  });
}

export async function mockDeleteSavedRecipient(recipientId: string): Promise<void> {
  await mockDelay();
  updateMockDb((db) => {
    const recipient = ownRecipient(db, recipientId);
    db.recipients = (db.recipients || []).filter((candidate) => candidate !== recipient);
  });
}

// ---- Community Cards ----------------------------------------------------------------

/**
 * Like POST /community-cards/drafts: a saved card draft for a ready-made card,
 * with the card's front as its image asset (and the message as a message asset
 * unless the inside is blank). No generation job, no credits.
 */
export async function mockCreateCommunityCardDraft(input: CommunityDraftInput): Promise<{ cardDraft: CardDraft; assets: CardDraftAsset[] }> {
  await mockDelay(300);
  const { message } = input;
  if (message !== null && (!message.trim() || message.length > 500)) {
    throw new MockApiError("Write an inside message of up to 500 characters, or choose to leave the inside blank.", 400);
  }
  return updateMockDb((db) => {
    const userId = requireAccount(db).user.id;
    const now = nowIso();
    const cardDraft: CardDraft = {
      id: mockId(),
      user_id: userId,
      occasion: input.occasion,
      relationship: null,
      status: "draft",
      created_at: now,
      updated_at: now,
      last_saved_edit_at: now,
      creative_brief: {
        flow: "community_card",
        communityCard: { id: input.cardId, version: input.cardVersion, name: input.cardName, occasion: input.occasion },
        message: { mode: message === null ? "blank" : "text", text: message },
      },
    };
    const assets: CardDraftAsset[] = [
      buildMockAsset({ userId, cardDraftId: cardDraft.id, type: "image", key: `community/${input.cardId}/v${input.cardVersion}.png`, url: mockAssetUrl(input.artUrl), createdAt: now }),
      ...(message === null ? [] : [buildMockAsset({ userId, cardDraftId: cardDraft.id, type: "message", key: `community/${cardDraft.id}/inside-message.txt`, createdAt: now })]),
    ];
    db.cardDrafts.push(cardDraft);
    db.assets.push(...assets);
    return { cardDraft: clone(cardDraft), assets: clone(assets) };
  });
}

// ---- Community Cards submissions ----------------------------------------------------

function ownSubmission(record: CommunitySubmission & { userId: string }): CommunitySubmission {
  const { userId, ...submission } = record;
  void userId;
  return clone(submission);
}

/** Like POST /community-cards/submissions: a finished Build My Card design, not made from photos, once. */
export async function mockSubmitCommunityCard(input: CommunitySubmissionInput): Promise<{ submission: CommunitySubmission }> {
  await mockDelay(450);
  const name = input.name.trim();
  if (!name || name.length > 40) throw new MockApiError("Give your card a name of up to 40 characters.", 400);
  if (!input.occasion.trim()) throw new MockApiError("Choose the card's occasion.", 400);
  if (!input.guidelinesVersion) throw new MockApiError("Agree to the Community Cards guidelines to submit.", 400);
  return updateMockDb((db) => {
    const userId = requireAccount(db).user.id;
    const draft = db.cardDrafts.find((candidate) => candidate.id === input.cardDraftId && candidate.user_id === userId);
    if (!draft) throw new MockApiError("We couldn't find that card in your saved cards.", 404);
    const brief = (draft.creative_brief || {}) as Record<string, unknown>;
    const flow = typeof brief.flow === "string" ? brief.flow : "build_my_card";
    if (flow !== "build_my_card") throw new MockApiError("Only cards you designed in Build My Card can be shared to Community Cards.", 400);
    const photo = (brief.photo || {}) as Record<string, unknown>;
    if (photo.mode && photo.mode !== "describe") throw new MockApiError("Cards made from your own photos stay private, so they can't be shared to Community Cards.", 400);
    const image = db.assets.filter((asset) => asset.cardDraftId === draft.id && (asset.assetType || asset.asset_type) === "image").at(-1);
    if (!image) throw new MockApiError("Finish the card's front in Build My Card before you share it.", 400);
    const list = db.communitySubmissions || [];
    if (list.some((item) => item.cardDraftId === draft.id && (item.status === "in_review" || item.status === "approved"))) {
      throw new MockApiError("You've already shared this card. It's in review or already posted.", 409);
    }
    const url = typeof image.mockUrl === "string" ? image.mockUrl : "";
    const submission: CommunitySubmission & { userId: string } = {
      id: mockId("submission"),
      userId,
      cardDraftId: draft.id,
      name,
      occasion: input.occasion.trim(),
      artUrl: /^(https?:\/\/|\/)/i.test(url) ? url : null,
      status: "in_review",
      reviewNote: null,
      publicCardId: null,
      guidelinesVersion: input.guidelinesVersion,
      createdAt: nowIso(),
    };
    db.communitySubmissions = [...list, submission];
    return { submission: ownSubmission(submission) };
  });
}

/** Like GET /community-cards/submissions/mine, newest first. */
export async function mockFetchMyCommunitySubmissions(): Promise<CommunitySubmission[]> {
  await mockDelay(150);
  const db = readMockDb();
  const userId = requireAccount(db).user.id;
  return (db.communitySubmissions || []).filter((item) => item.userId === userId).map(ownSubmission).reverse();
}

// ---- Contact / support messages ----------------------------------------------------

/** Stores the message (like POST /support/messages) and returns a reference such as SV-4F2A9C. */
export async function mockSubmitContactMessage(input: ContactMessageInput): Promise<{ reference: string }> {
  await mockDelay(400);
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
    throw new MockApiError("A name, a valid email and a message are needed.", 400);
  }
  return updateMockDb((db) => {
    const reference = `SV-${mockId().replace(/[^a-f0-9]/gi, "").slice(0, 6).toUpperCase()}`;
    (db.supportMessages ??= []).push({
      reference, name, email, topic: input.topic,
      orderReference: input.orderReference?.trim() || null,
      message, createdAt: nowIso(),
    });
    return { reference };
  });
}

/** Keeps each photo-consent acceptance (version, time, photo count) with its owner. */
export async function mockRecordPhotoAttestation(record: PhotoAttestationRecord): Promise<void> {
  await mockDelay(100);
  updateMockDb((db) => {
    const userId = requireAccount(db).user.id;
    (db.attestations ??= []).push({ ...record, userId });
  });
}

// ---- Account deletion ------------------------------------------------------------

/**
 * Like DELETE /auth/me: removes the profile, saved recipients, payment
 * methods, credits and the private library. Orders keep their record, and the
 * card and assets an order points at stay (a mailed card's QR song keeps working).
 */
export async function mockDeleteAuthenticatedUser(): Promise<void> {
  await mockDelay(400);
  updateMockDb((db) => {
    const account = requireAccount(db);
    const userId = account.user.id;
    const keptDraftIds = new Set(db.orders.filter((order) => order.userId === userId).map((order) => order.cardDraftId));
    db.cardDrafts = db.cardDrafts.filter((draft) => draft.user_id !== userId || keptDraftIds.has(draft.id));
    db.assets = db.assets.filter((asset) => asset.user_id !== userId || keptDraftIds.has(String(asset.card_draft_id)));
    db.uploads = db.uploads.filter((upload) => upload.userId !== userId);
    db.paymentMethods = db.paymentMethods.filter((method) => method.user_id !== userId);
    db.recipients = (db.recipients || []).filter((recipient) => recipient.userId !== userId);
    delete db.balances[userId];
    delete db.accounts[account.email];
  });
}

// ---- Credits -----------------------------------------------------------------

export async function mockFetchCreditBalance(userId?: string): Promise<CreditBalance> {
  await mockDelay(100);
  const db = readMockDb();
  return balanceOf(db, resolveUserId(db, userId));
}

export async function mockGrantCredits({ userId, amount, source, idempotencyKey }: GrantCreditsRequest): Promise<GrantCreditsResponse> {
  await mockDelay();
  return updateMockDb((db) => {
    const resolvedUserId = resolveUserId(db, userId);
    const credits = Math.floor(Number(amount));
    if (!Number.isFinite(credits) || credits <= 0) throw new MockApiError("Credit amount must be a positive whole number.");
    if (!db.applied[idempotencyKey]) {
      db.balances[resolvedUserId] = (db.balances[resolvedUserId] ?? 0) + credits;
      db.applied[idempotencyKey] = { source, amount: credits, at: nowIso() };
    }
    return {
      ledgerEntry: { id: mockId(), userId: resolvedUserId, amount: credits, source, idempotencyKey },
      balance: balanceOf(db, resolvedUserId),
    };
  });
}

// ---- Card drafts and assets --------------------------------------------------

export async function mockCreateCardDraft({ userId, occasion, relationship, creativeBrief }: CreateCardDraftRequest): Promise<CardDraft> {
  await mockDelay();
  return updateMockDb((db) => {
    const draft: CardDraft = {
      id: mockId(),
      user_id: resolveUserId(db, userId),
      occasion: occasion || null,
      relationship: relationship || null,
      creative_brief: creativeBrief ?? {},
      status: "draft",
      created_at: nowIso(),
      updated_at: nowIso(),
      last_saved_edit_at: nowIso(),
    };
    db.cardDrafts.push(draft);
    return clone(draft);
  });
}

export async function mockFetchCardDraftById(cardDraftId: string): Promise<CardDraft> {
  await mockDelay(100);
  return clone(findDraft(readMockDb(), cardDraftId));
}

export async function mockUpdateCardDraft(cardDraftId: string, { occasion, relationship, creativeBrief }: UpdateCardDraftRequest): Promise<CardDraft> {
  await mockDelay(150);
  return updateMockDb((db) => {
    const draft = findDraft(db, cardDraftId);
    const before = JSON.stringify([draft.occasion, draft.relationship, draft.creative_brief]);
    if (occasion) draft.occasion = occasion;
    if (relationship) draft.relationship = relationship;
    if (creativeBrief) draft.creative_brief = creativeBrief;
    draft.updated_at = nowIso();
    // Only a real change to the creation restarts its 12-month storage (PRD §5).
    if (JSON.stringify([draft.occasion, draft.relationship, draft.creative_brief]) !== before) draft.last_saved_edit_at = nowIso();
    return clone(draft);
  });
}

export async function mockFetchUserCardDrafts(userId?: string): Promise<CardDraft[]> {
  await mockDelay(150);
  const db = readMockDb();
  const resolvedUserId = resolveUserId(db, userId);
  return clone(
    db.cardDrafts
      .filter((draft) => draft.user_id === resolvedUserId && draft.status !== "deleted")
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
  );
}

/**
 * Removes a draft or creation from the library. A card an order points at is
 * hidden from the library but its record and assets stay, so the order (and a
 * mailed card's QR song) are never affected.
 */
export async function mockDeleteCardDraft(cardDraftId: string): Promise<void> {
  await mockDelay();
  updateMockDb((db) => {
    const userId = requireAccount(db).user.id;
    const draft = findDraft(db, cardDraftId);
    if (draft.user_id !== userId) throw new MockApiError("Card draft not found.", 404);
    const ordered = db.orders.some((order) => order.cardDraftId === cardDraftId);
    if (ordered) {
      draft.status = "deleted";
      return;
    }
    db.cardDrafts = db.cardDrafts.filter((candidate) => candidate.id !== cardDraftId);
    db.assets = db.assets.filter((asset) => asset.card_draft_id !== cardDraftId);
  });
}

export async function mockFetchCardDraftAssets(cardDraftId: string): Promise<CardDraftAsset[]> {
  await mockDelay(100);
  const db = readMockDb();
  findDraft(db, cardDraftId);
  return clone(
    db.assets
      .filter((asset) => asset.card_draft_id === cardDraftId)
      .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))),
  );
}

export async function mockMockUpload({ userId, cardDraftId, filename, mimeType, size }: MockUploadRequest): Promise<MockUploadResponse> {
  await mockDelay(300);
  return updateMockDb((db) => {
    const resolvedUserId = resolveUserId(db, userId);
    findDraft(db, cardDraftId);
    const key = `uploads/${cardDraftId}/${Date.now()}-${filename.replace(/[^\w.-]+/g, "_")}`;
    const asset = buildMockAsset({ userId: resolvedUserId, cardDraftId, type: "upload", key });
    const upload = {
      id: mockId(),
      userId: resolvedUserId,
      cardDraftId,
      assetId: asset.id,
      filename,
      mimeType,
      size,
      status: "uploaded",
      attestationAccepted: true,
      uploadedAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      mockUrl: asset.mockUrl,
      storageKey: key,
    };
    db.assets.push(asset);
    db.uploads.push(upload);
    return clone({ upload, asset });
  });
}

// ---- Generation --------------------------------------------------------------

/**
 * Like the backend, saves image, song and message assets and charges credits.
 * When `parts` is given (Build My Card), only the chosen parts are made and
 * charged: 1 credit each for the image and the song. Without it, all three are
 * made for 2 credits, as the live backend does today.
 */
export async function mockStartGeneration({ userId, cardDraftId, idempotencyKey, parts }: StartGenerationRequest): Promise<GenerationStartResponse> {
  await mockDelay(900);
  return updateMockDb((db) => {
    const resolvedUserId = resolveUserId(db, userId);
    if (cardDraftId) findDraft(db, cardDraftId);

    const previous = db.applied[`${idempotencyKey}-generation`] as GenerationStartResponse | undefined;
    if (previous) return clone({ ...previous, balance: balanceOf(db, resolvedUserId) });

    const wanted = parts ?? { image: true, song: true };
    const cost = parts ? Number(wanted.image) + Number(wanted.song) : GENERATION_COST;
    if (cost <= 0) throw new MockApiError("Choose at least one part to generate.");
    const balance = db.balances[resolvedUserId] ?? 0;
    if (balance < cost) throw new MockApiError("Insufficient credits.");
    db.balances[resolvedUserId] = balance - cost;

    const allAssets = generatedAssetSet(resolvedUserId, cardDraftId ?? null);
    const savedAssets = parts
      ? allAssets.filter((asset) => (asset.asset_type === "image" && wanted.image) || (asset.asset_type === "song" && wanted.song))
      : allAssets;
    db.assets.push(...savedAssets);
    const image = savedAssets.find((asset) => asset.asset_type === "image");

    const response: GenerationStartResponse = {
      generationJob: {
        id: savedAssets[0]?.generation_job_id || mockId(),
        user_id: resolvedUserId,
        card_draft_id: cardDraftId ?? null,
        image_status: wanted.image ? "ready" : "skipped",
        song_status: wanted.song ? "ready" : "skipped",
        message_status: parts ? "skipped" : "ready",
        provider_mode: "mock",
        credits_charged: cost,
        created_at: nowIso(),
      },
      savedAssets,
      mockAssets: {
        ...(image ? { image: { status: "ready", mockUrl: image.mockUrl } } : {}),
        ...(wanted.song ? { song: { status: "ready", mockUrl: "mock://souvenote/song.mp3" } } : {}),
      },
      creditDeduction: { amount: -cost, source: "mock_generation" },
      balance: balanceOf(db, resolvedUserId),
    };
    db.applied[`${idempotencyKey}-generation`] = response;
    return clone(response);
  });
}

// ---- Orders, checkout, fulfillment ------------------------------------------

export async function mockCreateOrder({ userId, cardDraftId, selectedAssetId, recipients, senderAddress }: CreateOrderRequest): Promise<Order> {
  await mockDelay(300);
  return updateMockDb((db) => {
    const resolvedUserId = resolveUserId(db, userId);
    findDraft(db, cardDraftId);
    if (!db.assets.some((asset) => asset.id === selectedAssetId && asset.card_draft_id === cardDraftId)) {
      throw new MockApiError("Selected asset not found for this card draft.", 404);
    }
    if (!recipients?.length) throw new MockApiError("Add at least one recipient before sending.", 400);
    // Priced per card from the account's country (Canada CAD, US USD), plus any
    // cross-border postage for each card going to the other country.
    const account = findAccountByUserId(db, resolvedUserId);
    const country = toCountry(account?.user.country) || "CA";
    const currency = CURRENCY_BY_COUNTRY[country];
    const amount = recipients.reduce(
      (sum, recipient) => sum + recipient.quantity * (PRICE_LISTS[currency].printAndSend + crossBorderPostage(currency, country, String(recipient.address.country || country))),
      0,
    );
    const order: Order = {
      id: mockId(),
      userId: resolvedUserId,
      cardDraftId,
      selectedAssetId,
      status: "pending",
      offerCode: currency === "CAD" ? "print_and_send" : "print_and_send_usd",
      amountCents: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      checkoutSessionId: null,
      paymentId: null,
      fulfillmentJobId: null,
      mockFulfillmentId: null,
      trackingUrl: null,
      recipients: recipients.map((recipient) => ({ address: { ...recipient.address }, quantity: recipient.quantity })),
      recipientAddress: { ...recipients[0].address },
      senderAddress: senderAddress ? { ...senderAddress } : {},
      qrCodeUrl: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.orders.push(order);
    return clone(order);
  });
}

export async function mockStartCheckout(orderId: string): Promise<CheckoutResponse> {
  await mockDelay(400);
  return updateMockDb((db) => {
    const order = findOrder(db, orderId);
    assertOrderStatus(order, ["pending", "checkout_started"], "start checkout");
    const checkoutSessionId = mockId("mock_checkout");
    const paymentId = mockId("mock_payment");
    const checkoutSession = {
      id: checkoutSessionId,
      orderId,
      paymentId,
      providerMode: "mock",
      status: "checkout_started",
      amountCents: order.amountCents,
      currency: order.currency,
      checkoutUrl: `mock://souvenote/checkout/${checkoutSessionId}`,
      successUrl: null,
      cancelUrl: null,
      createdAt: nowIso(),
      paidAt: null,
    };
    db.checkoutSessions.push(checkoutSession);
    Object.assign(order, { status: "checkout_started", checkoutSessionId, paymentId, updatedAt: nowIso() });
    return clone({ checkoutSession, order });
  });
}

export async function mockCompleteMockCheckout(orderId: string): Promise<CheckoutResponse> {
  await mockDelay(500);
  return updateMockDb((db) => {
    const order = findOrder(db, orderId);
    assertOrderStatus(order, ["checkout_started"], "complete mock checkout");
    const checkoutSession = db.checkoutSessions.find((session) => session.id === order.checkoutSessionId);
    if (!checkoutSession) throw new MockApiError("Checkout session not found.", 404);
    Object.assign(checkoutSession, { status: "paid_mock", paidAt: nowIso() });
    Object.assign(order, { status: "paid_mock", updatedAt: nowIso() });
    return clone({ checkoutSession, order });
  });
}

/**
 * One entry of Scribeless's `POST /api/recipients` `data` array, built the way the
 * backend should build it (DEVELOPER_HANDOFF.md, "Orders with several recipients").
 * Older orders have only `name` and a joined `line1`: the name is split at the
 * first space as a fallback. Company and title go in `variables` until the
 * campaign template's field names are confirmed in the Scribeless account.
 */
function scribelessRecipient(stored: Record<string, unknown>, externalId: string) {
  // Orders are stored loosely (older ones predate the separate fields), so read each
  // field as a string and fall back where a field is missing.
  const text = (key: keyof PostalAddress) => (typeof stored[key] === "string" ? (stored[key] as string) : "");
  const [first = "", ...rest] = text("name").trim().split(/s+/);
  const variables: Record<string, string> = { externalId };
  if (text("company")) variables.company = text("company");
  if (text("title")) variables.title = text("title");
  return {
    firstName: text("firstName") || first,
    lastName: text("lastName") || rest.join(" "),
    address: {
      address1: text("line1"),
      address2: text("line2"),
      address3: text("line3"),
      city: text("city"),
      state: text("region"),
      postalCode: text("postalCode"),
      country: text("country"),
    },
    variables,
  };
}

export async function mockSubmitFulfillment(orderId: string): Promise<FulfillmentSubmitResponse> {
  await mockDelay(500);
  return updateMockDb((db) => {
    const order = findOrder(db, orderId);
    assertOrderStatus(order, ["paid_mock"], "submit fulfillment");
    const id = mockId();
    const fulfillment = {
      id,
      orderId,
      userId: order.userId,
      providerMode: "mock",
      mockFulfillmentId: `mock_fulfillment_${id}`,
      status: "fulfilled_mock",
      submittedAt: nowIso(),
      estimatedDelivery: "Mock delivery estimate: 5-7 business days.",
      // Shaped like the Scribeless call the backend will make: one campaign,
      // every recipient in `data` (copies repeated), one return address.
      requestPayload: (() => {
        const recipients = order.recipients ?? (order.recipientAddress ? [{ address: order.recipientAddress, quantity: 1 }] : []);
        return {
          recipients,
          senderAddress: order.senderAddress,
          // The exact `POST /api/recipients` body: one entry per copy.
          scribeless: {
            data: recipients.flatMap((recipient, index) =>
              Array.from({ length: recipient.quantity }, (_, copy) => scribelessRecipient(recipient.address, `${order.id}-${index + 1}-${copy + 1}`))),
          },
        };
      })(),
      responsePayload: { message: "Mock fulfillment completed locally." },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.fulfillments.push(fulfillment);
    Object.assign(order, {
      status: "fulfilled_mock",
      fulfillmentJobId: id,
      mockFulfillmentId: fulfillment.mockFulfillmentId,
      updatedAt: nowIso(),
    });
    return clone({ fulfillment, order });
  });
}
