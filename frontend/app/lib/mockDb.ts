/**
 * The in-browser "database" behind mock data mode. Everything lives in one
 * localStorage record so it survives reloads, and can be reset from the Mock
 * data badge (or window.__souvResetMockData(), set only in mock mode).
 *
 * Type-only imports keep this file free of runtime dependencies, so both
 * api.ts and cognitoAuth.ts can use it without import cycles.
 */
import type {
  CardDraft,
  CommunitySubmission,
  PhotoAttestationRecord,
  CardDraftAsset,
  CheckoutSession,
  FulfillmentRecord,
  MockUpload,
  Order,
  PaymentMethod,
  SavedRecipient,
} from "./api";
import type { LocalUser } from "./cognitoAuth";
import { TERMS_VERSION } from "./legalVersions";
import { MOCK_DEMO_EMAIL, MOCK_DEMO_PASSWORD } from "./mockDemo";

export type MockAccount = {
  email: string;
  password: string;
  confirmed: boolean;
  sub: string;
  provider?: string;
  user: LocalUser;
  starterCreditsGranted: boolean;
  /** Authenticator-app two-factor sign-in is on (mock of Cognito TOTP MFA). */
  totpEnabled?: boolean;
  /** Secret handed out by associateSoftwareToken, waiting to be verified. */
  totpPendingSecret?: string | null;
};

export type TemplateSuggestion = { id: string; idea: string; email: string; searchQuery: string | null; occasionFilter: string | null; createdAt: string };

export type MockDb = {
  version: number;
  accounts: Record<string, MockAccount>;
  balances: Record<string, number>;
  /** Idempotency keys already applied (credit grants, generations). */
  applied: Record<string, unknown>;
  cardDrafts: CardDraft[];
  assets: CardDraftAsset[];
  uploads: MockUpload[];
  orders: Order[];
  checkoutSessions: CheckoutSession[];
  fulfillments: FulfillmentRecord[];
  paymentMethods: PaymentMethod[];
  /** "Suggest a template" ideas from Personalize a Template (no backend route yet). */
  templateSuggestions?: TemplateSuggestion[];
  /** Upload rights pop-up acceptances (POST /attestations). */
  attestations?: (PhotoAttestationRecord & { userId: string })[];
  /** Contact-page messages (no backend route yet; POST /support/messages). */
  supportMessages?: { reference: string; name: string; email: string; topic: string; orderReference: string | null; message: string; createdAt: string }[];
  /** Cards offered to the public Community Cards collection (no backend route yet). */
  communitySubmissions?: (CommunitySubmission & { userId: string })[];
  /** Address book entries (PRD §5 saved recipients), keyed to their owner. */
  recipients?: (SavedRecipient & { userId: string })[];
};

const MOCK_DB_STORAGE_KEY = "souv_mock_db";
const MOCK_DB_VERSION = 1;
export const MOCK_DB_UPDATED_EVENT = "souv-mock-db-updated";

/**
 * Front image used for every mock generated card (a real web address, so previews render):
 * the current two-tone logo on forest. The old black card with the yellow S
 * (hero-souvenote-card-face.png) is retired (owner, 2026-11-08); saved mock cards are moved over on read.
 */
export const MOCK_CARD_IMAGE_PATH = "/assets/mock-card-front.png";
const RETIRED_CARD_IMAGE = "/assets/hero-souvenote-card-face.png";

export function mockId(prefix = "") {
  const id = globalThis.crypto?.randomUUID?.()
    || `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  return prefix ? `${prefix}_${id}` : id;
}

export function nowIso() {
  return new Date().toISOString();
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function mockAssetUrl(path: string) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function buildMockAsset(fields: {
  userId: string;
  cardDraftId: string | null;
  generationJobId?: string | null;
  type: string;
  key: string;
  url?: string | null;
  createdAt?: string;
}): CardDraftAsset {
  const id = mockId();
  const createdAt = fields.createdAt || nowIso();
  const mockUrl = fields.url ?? `mock://souvenote/${fields.key}`;
  return {
    id,
    user_id: fields.userId,
    card_draft_id: fields.cardDraftId,
    generation_job_id: fields.generationJobId ?? null,
    asset_type: fields.type,
    s3_key: fields.key,
    moderation_state: "approved_mock",
    approved_at: null,
    print_asset_key: null,
    qr_metadata: {},
    created_at: createdAt,
    userId: fields.userId,
    cardDraftId: fields.cardDraftId,
    generationJobId: fields.generationJobId ?? null,
    assetType: fields.type,
    storageKey: fields.key,
    mockUrl,
    moderationState: "approved_mock",
    approvedAt: null,
    printAssetKey: null,
    qrMetadata: {},
    createdAt,
  };
}

export function generatedAssetSet(userId: string, cardDraftId: string | null, createdAt?: string) {
  const generationJobId = mockId();
  return [
    buildMockAsset({ userId, cardDraftId, generationJobId, type: "image", key: "mock/card-image.png", url: mockAssetUrl(MOCK_CARD_IMAGE_PATH), createdAt }),
    buildMockAsset({ userId, cardDraftId, generationJobId, type: "song", key: "mock/song.mp3", createdAt }),
    buildMockAsset({ userId, cardDraftId, generationJobId, type: "message", key: "mock/inside-message.txt", createdAt }),
  ];
}

function seedDb(): MockDb {
  const userId = "11111111-2222-4333-8444-555555555555";
  const sub = "mock-sub-demo";
  const created = daysAgo(21);

  const user: LocalUser = {
    id: userId,
    cognito_user_id: sub,
    email: MOCK_DEMO_EMAIL,
    stripe_customer_id: null,
    first_name: "Cameron",
    last_name: "Wilson",
    phone: "+1 416 555 0134",
    birthday: "1990-04-18",
    country: "CA",
    currency: "CAD",
    language: "en",
    marketing_opt_in: true,
    preferences: {},
    terms_accepted_at: created,
    terms_version: TERMS_VERSION,
    created_at: created,
    updated_at: created,
  };

  const finishedDraft: CardDraft = {
    id: "aaaaaaaa-0000-4000-8000-000000000001",
    user_id: userId,
    occasion: "Birthday",
    relationship: "Mom",
    status: "draft",
    created_at: daysAgo(6),
    updated_at: daysAgo(5),
    last_saved_edit_at: daysAgo(5),
    creative_brief: {
      flow: "build_my_card",
      basics: { recipient: "Mom", occasion: "Birthday", relationship: "Mom" },
      photo: { mode: "describe", description: "Mom in her garden with sunflowers" },
      image: { style: "Watercolour" },
      message: { tone: "Warm", text: "Happy birthday, Mom. Thank you for every garden morning." },
      song: { include: true, genre: "Acoustic" },
    },
  };

  const inProgressDraft: CardDraft = {
    id: "aaaaaaaa-0000-4000-8000-000000000002",
    user_id: userId,
    occasion: "Father's Day",
    relationship: "Dad",
    status: "draft",
    created_at: daysAgo(2),
    updated_at: daysAgo(1),
    last_saved_edit_at: daysAgo(1),
    creative_brief: {
      flow: "personalize_template",
      template: { name: "Father's Day Comic", occasion: "Father's Day" },
      photo: { mode: "describe", description: "Dad fishing on the dock" },
    },
  };

  const finishedAssets = generatedAssetSet(userId, finishedDraft.id, daysAgo(5));
  const image = finishedAssets[0];

  const orderId = "bbbbbbbb-0000-4000-8000-000000000001";
  const paymentId = mockId("mock_payment");
  const checkoutId = mockId("mock_checkout");
  const fulfillmentId = mockId();
  const recipientAddress = {
    name: "Linda Wilson",
    line1: "42 Maple Grove",
    city: "Halifax",
    region: "NS",
    postalCode: "B3H 1A1",
    country: "CA",
  };

  const order: Order = {
    id: orderId,
    userId,
    cardDraftId: finishedDraft.id,
    selectedAssetId: image.id,
    status: "fulfilled_mock",
    offerCode: "print_and_send",
    amountCents: 999,
    currency: "cad",
    checkoutSessionId: checkoutId,
    paymentId,
    fulfillmentJobId: fulfillmentId,
    mockFulfillmentId: `mock_fulfillment_${fulfillmentId}`,
    trackingUrl: null,
    recipientAddress,
    senderAddress: {},
    qrCodeUrl: null,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  };

  return {
    version: MOCK_DB_VERSION,
    accounts: {
      [MOCK_DEMO_EMAIL]: {
        email: MOCK_DEMO_EMAIL,
        password: MOCK_DEMO_PASSWORD,
        confirmed: true,
        sub,
        user,
        starterCreditsGranted: true,
      },
    },
    balances: { [userId]: 20 },
    applied: {},
    cardDrafts: [finishedDraft, inProgressDraft],
    assets: finishedAssets,
    uploads: [],
    orders: [order],
    checkoutSessions: [{
      id: checkoutId,
      orderId,
      paymentId,
      providerMode: "mock",
      status: "paid_mock",
      amountCents: 999,
      currency: "cad",
      checkoutUrl: `mock://souvenote/checkout/${checkoutId}`,
      successUrl: null,
      cancelUrl: null,
      createdAt: daysAgo(5),
      paidAt: daysAgo(5),
    }],
    fulfillments: [{
      id: fulfillmentId,
      orderId,
      userId,
      providerMode: "mock",
      mockFulfillmentId: `mock_fulfillment_${fulfillmentId}`,
      status: "fulfilled_mock",
      submittedAt: daysAgo(5),
      estimatedDelivery: "Mock delivery estimate: 5-7 business days.",
      requestPayload: {},
      responsePayload: { message: "Mock fulfillment completed locally." },
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    }],
    paymentMethods: [{
      id: "cccccccc-0000-4000-8000-000000000001",
      user_id: userId,
      stripe_payment_method_id: "pm_mock_visa",
      brand: "Visa",
      last4: "4242",
      exp_month: 12,
      exp_year: 2029,
      billing_name: "Cameron Wilson",
      billing_postal_code: "M5V 2T6",
      is_default: true,
      created_at: created,
      updated_at: created,
    }],
    recipients: [{
      id: "dddddddd-0000-4000-8000-000000000001",
      userId,
      title: "",
      firstName: "Linda",
      lastName: "Wilson",
      company: "",
      address1: "42 Maple Grove",
      address2: "",
      address3: "",
      city: "Halifax",
      state: "NS",
      postalCode: "B3H 1A1",
      country: "CA",
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    }],
  };
}

let memoryDb: MockDb | null = null;

export function readMockDb(): MockDb {
  if (typeof window === "undefined") return memoryDb || seedDb();

  try {
    const raw = window.localStorage.getItem(MOCK_DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw.split(RETIRED_CARD_IMAGE).join(MOCK_CARD_IMAGE_PATH)) as MockDb;
      if (parsed?.version === MOCK_DB_VERSION) return parsed;
    }
  } catch {
    // Unreadable record: fall through to a fresh seed.
  }

  const seeded = seedDb();
  writeMockDb(seeded);
  return seeded;
}

export function writeMockDb(db: MockDb) {
  memoryDb = db;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Private mode: the in-memory copy still works for this tab.
  }
  window.dispatchEvent(new CustomEvent(MOCK_DB_UPDATED_EVENT));
}

/** Read, change and save the mock database in one step. */
export function updateMockDb<T>(change: (db: MockDb) => T): T {
  const db = readMockDb();
  const result = change(db);
  writeMockDb(db);
  return result;
}

/**
 * Wipes every Souvenote key from local and session storage (mock database,
 * sign-in session, cart, demo balance, flow state) so the app starts fresh.
 */
export function resetAllMockData() {
  if (typeof window === "undefined") return;
  for (const storage of [window.localStorage, window.sessionStorage]) {
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && (key.startsWith("souv") || key.startsWith("CognitoIdentityServiceProvider"))) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
  }
  memoryDb = null;
}

export function findAccountBySub(db: MockDb, sub: string) {
  return Object.values(db.accounts).find((account) => account.sub === sub) || null;
}

export function findAccountByUserId(db: MockDb, userId: string) {
  return Object.values(db.accounts).find((account) => account.user.id === userId) || null;
}
