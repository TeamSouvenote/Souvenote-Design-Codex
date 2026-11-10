"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BmcIcon, BmcErrorModal, bmcError } from "./BmcShared";
import { DlvKeepsake } from "./DeliveryKeepsake";
import { completeMockCheckout, createOrder, orderCardCount, createSavedRecipient, fetchCardDraftAssets, fetchCardDraftById, fetchSavedRecipients, startCheckout, submitFulfillment } from "../lib/api";
import type { CardDraftAsset, CheckoutSession, FulfillmentRecord, Order, OrderRecipient, PostalAddress, SavedRecipient } from "../lib/api";
import {
  EMPTY_FLOW_STATE,
  findGeneratedImageAsset,
  hasGeneratedAsset,
  MOCK_MVP_FLOW_UPDATED_EVENT,
  readMockMvpFlowState,
  rememberCheckoutResult,
  rememberFulfillmentResult,
  rememberSelectedAsset,
  writeMockMvpFlowState,
} from "../lib/mockMvpFlow";
import type { MockMvpFlowState } from "../lib/mockMvpFlow";
import {
  DLV_EMPTY_RECIP,
  dlvValidate,
  DlvRecipientSection,
  DlvReturnSection,
  DlvScheduleSection,
  DlvShippingSection,
} from "./DeliveryForm";
import type { DeliveryErrors, DeliveryMode, DeliveryRecipient, DeliveryWhen } from "./DeliveryForm";
import { readDemoBalance } from "./DemoBalance";
import type { DemoBalance } from "./DemoBalance";
import type { DemoCredits } from "./DemoUser";
import { openTopUp } from "./pricing/topUp";
import { useAuth } from "./AuthProvider";
import { deliveryStatusLabel } from "./delivery/deliveryStatus";
import { useDeliveryBackHref, useDeliverySource } from "./delivery/deliverySource";
import { usePriceCountry } from "./pricing/usePriceCountry";

type BackendAction =
  | "idle"
  | "loading_assets"
  | "creating_order"
  | "starting_checkout"
  | "completing_checkout"
  | "submitting_fulfillment";

type DeliveryAppProps = {
  initialCards?: number;
  initialCredits?: DemoCredits;
};

const DELIVERY_DEFAULT_CREDITS: DemoCredits = { images: 0, songs: 0 };

// Out of cards: "Continue to checkout" opens the nav's Top up pop-up on its cards
// view (owner, 2026-11-07), and after paying the cart comes back here. Off until
// the backend owns the card count: today it lives only in this browser
// (DemoBalance), so it can be wrong or faked (build-fixes item 8).
const CARD_BALANCE_CHECK_ENABLED = false;

const DLV_DATE_MESSAGE = "Choose a mail-out date.";

/** Tomorrow as YYYY-MM-DD in the visitor's time zone: the earliest mail-out date. */
function dlvTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// The customer's own front image, only when the backend gives a real web
// address. Generation is still mocked (addresses start with mock://), so for now
// this is null and the preview shows an empty card frame, never a sample.
function dlvFrontImageUrl(assets: CardDraftAsset[], selectedId: string | null) {
  const asset = assets.find((item) => item.id === selectedId) || findGeneratedImageAsset(assets);
  const url = asset?.mockUrl || "";
  return /^https?:\/\//i.test(url) ? url : null;
}

// Only called after dlvValidate passes, so every required field is filled.
// No fallback values: a blank field must never be replaced with a made-up address.
// Each field separately, as Scribeless takes them (audit Part C); empty optional fields are left out.
function dlvPostalAddress(recipient: DeliveryRecipient): PostalAddress {
  const firstName = recipient.firstName.trim();
  const lastName = recipient.lastName.trim();
  const optional = (value: string) => value.trim() || undefined;
  const address: PostalAddress = {
    name: [firstName, lastName].filter(Boolean).join(" "),
    firstName,
    lastName,
    title: optional(recipient.title),
    company: optional(recipient.company),
    line1: recipient.address1.trim(),
    line2: optional(recipient.address2),
    line3: optional(recipient.address3),
    city: recipient.city.trim(),
    region: recipient.state.trim(),
    postalCode: recipient.postalCode.trim(),
    country: recipient.country || "CA",
  };
  return Object.fromEntries(Object.entries(address).filter(([, value]) => value !== undefined)) as PostalAddress;
}

function DeliveryApp({ initialCards = 0, initialCredits = DELIVERY_DEFAULT_CREDITS }: DeliveryAppProps) {
  const router = useRouter();
  const defaultBalance: DemoBalance = React.useMemo(
    () => ({ credits: initialCredits, cardBank: initialCards }),
    [initialCards, initialCredits],
  );

  const [mode, setMode] = React.useState<DeliveryMode>("single");
  const [quantity, setQuantity] = React.useState(1);
  const [recipients, setRecipients] = React.useState<DeliveryRecipient[]>([]);
  const auth = useAuth();
  // Both addresses start empty (no sample people).
  const [draft, setDraft] = React.useState<DeliveryRecipient>(DLV_EMPTY_RECIP);
  const [errors, setErrors] = React.useState<DeliveryErrors>({});
  const [editingIdx, setEditingIdx] = React.useState<number | null>(null);
  const [returnOn, setReturnOn] = React.useState(true);
  const [sender, setSender] = React.useState<DeliveryRecipient>(DLV_EMPTY_RECIP);
  const [senderErrors, setSenderErrors] = React.useState<DeliveryErrors>({});
  // Address book (PRD §5): pick a saved recipient, or tick "Save this recipient".
  const [savedRecipients, setSavedRecipients] = React.useState<SavedRecipient[]>([]);
  const [saveToAccount, setSaveToAccount] = React.useState(false);
  const signedIn = auth.status === "authenticated";
  React.useEffect(() => {
    if (!signedIn) return;
    let active = true;
    fetchSavedRecipients()
      .then((list) => { if (active) setSavedRecipients(list); })
      .catch(() => { /* the picker just stays hidden */ });
    return () => { active = false; };
  }, [signedIn]);
  const profileFirstName = auth.user?.first_name?.trim() || "";
  const profileLastName = auth.user?.last_name?.trim() || "";

  // Return address name comes from the signed-in profile. Profiles have no
  // mailing address yet, so the address lines stay empty (backend gap). Never
  // overwrites what the customer has already typed.
  React.useEffect(() => {
    if (!profileFirstName && !profileLastName) return;
    setSender((current) => (current.firstName || current.lastName)
      ? current
      : { ...current, firstName: profileFirstName, lastName: profileLastName });
  }, [profileFirstName, profileLastName]);
  const [when, setWhen] = React.useState<DeliveryWhen>("now");
  const [date, setDate] = React.useState("");
  const [dateError, setDateError] = React.useState<string | undefined>();
  const backHref = useDeliveryBackHref();
  const deliverySource = useDeliverySource();
  // Community Cards: no song, no AI credits; say so here (PRD §6). Read from the card itself, so a
  // Community Card sent from Saved Cards & Songs gets the same wording (Community Cards audit C6).
  const [communityDraft, setCommunityDraft] = React.useState(false);
  const fromCommunity = deliverySource === "community" || communityDraft;
  // The back link names where it goes (audit C6): the gallery, Saved Cards & Songs, or the card's review.
  const backLabel = deliverySource === "community" ? "Back to Community Cards" : deliverySource === "saved" ? "Back to Saved Cards & Songs" : "Back to review";
  // The account's country and currency price the order (Canada CAD, US USD).
  const { country: accountCountry, currency } = usePriceCountry();
  // New addresses start in the account's country (a US account starts on the
  // United States, with State and ZIP code). Only while nothing is typed yet.
  React.useEffect(() => {
    const untouched = (r: DeliveryRecipient) => !r.address1 && !r.city && !r.state && !r.postalCode;
    setDraft((current) => (untouched(current) ? { ...current, country: accountCountry } : current));
    setSender((current) => (untouched(current) ? { ...current, country: accountCountry } : current));
  }, [accountCountry]);
  // Starts empty (same as the server render) and reads the stored order after mount.
  const [flowState, setFlowState] = React.useState<MockMvpFlowState>(EMPTY_FLOW_STATE);
  const [backendOrder, setBackendOrder] = React.useState<Order | null>(null);
  /** The order made by the last Continue to checkout, and the inputs it was made from. */
  const pendingOrderRef = React.useRef<{ id: string; signature: string } | null>(null);
  const [, setCheckoutSession] = React.useState<CheckoutSession | null>(null);
  const [, setFulfillment] = React.useState<FulfillmentRecord | null>(null);
  const [backendAction, setBackendAction] = React.useState<BackendAction>("idle");
  const [backendError, setBackendError] = React.useState<string | null>(null);
  const assetLookupDraftRef = React.useRef<string | null>(null);
  // Only when the card really has a song (no sample song).
  const songIncluded = hasGeneratedAsset(flowState.generatedAssets, "song");

  const selectedImageAssetId = flowState.selectedAssetId || findGeneratedImageAsset(flowState.generatedAssets)?.id || null;
  const frontImageUrl = dlvFrontImageUrl(flowState.generatedAssets, selectedImageAssetId);
  const cardsNeeded = mode === "single" ? quantity : Math.max(recipients.length, 0);
  const orderStatus = backendOrder?.status || flowState.orderStatus;
  const hasBackendOrderInputs = Boolean(flowState.cardDraftId && selectedImageAssetId);
  const enough = hasBackendOrderInputs && cardsNeeded > 0;
  const backendBusy = backendAction !== "idle";
  const goToPricing = React.useCallback(() => {
    router.push("/pricing");
  }, [router]);

  React.useEffect(() => {
    const syncFlowState = () => setFlowState(readMockMvpFlowState());

    syncFlowState();
    window.addEventListener("storage", syncFlowState);
    window.addEventListener(MOCK_MVP_FLOW_UPDATED_EVENT, syncFlowState);
    return () => {
      window.removeEventListener("storage", syncFlowState);
      window.removeEventListener(MOCK_MVP_FLOW_UPDATED_EVENT, syncFlowState);
    };
  }, []);

  // Is the card being sent a Community Card? (audit C6; the gallery's Send sets the source, Saved Cards doesn't.)
  React.useEffect(() => {
    const id = flowState.cardDraftId;
    if (!id || deliverySource === "community") return;
    let active = true;
    fetchCardDraftById(id)
      .then((draft) => { if (active) setCommunityDraft((draft.creative_brief as Record<string, unknown> | null)?.flow === "community_card"); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [flowState.cardDraftId, deliverySource]);

  React.useEffect(() => {
    if (
      !flowState.cardDraftId
      || selectedImageAssetId
      || backendAction !== "idle"
      || assetLookupDraftRef.current === flowState.cardDraftId
    ) return;

    let active = true;
    assetLookupDraftRef.current = flowState.cardDraftId;
    setBackendAction("loading_assets");
    setBackendError(null);

    fetchCardDraftAssets(flowState.cardDraftId)
      .then((assets) => {
        if (!active || !flowState.cardDraftId) return;
        const imageAsset = findGeneratedImageAsset(assets);
        if (imageAsset?.id) {
          rememberSelectedAsset(flowState.cardDraftId, imageAsset.id, assets);
        } else {
          setBackendError("Your card's artwork isn't ready yet. Go back to Review and wait for it to finish.");
        }
      })
      .catch((error) => {
        if (!active) return;
        setBackendError(error instanceof Error ? error.message : "We couldn't load your card. Please try again.");
      })
      .finally(() => {
        if (active) setBackendAction("idle");
      });

    return () => {
      active = false;
    };
  }, [backendAction, flowState.cardDraftId, selectedImageAssetId]);

  function validateDeliveryInputs() {
    if (!flowState.cardDraftId || !selectedImageAssetId) {
      const message = "Finish your card in Review before sending it.";
      setBackendError(message);
      bmcError(message, "Card not ready");
      return false;
    }

    if (mode === "single") {
      const nextErrors = dlvValidate(draft);
      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors);
        window.scrollTo({ top: 0, behavior: "smooth" });
        bmcError(
          "Fill in the recipient's required address fields - name, street, city, province and postal code - before sending. We can't mail a card without a complete, deliverable address.",
          "Address needed",
        );
        return false;
      }
    } else if (recipients.length === 0) {
      bmcError("Add at least one recipient address before sending. Fill in the required fields and tap Add recipient.", "Address needed");
      return false;
    }

    // The return address is only checked (and sent) while its switch is on.
    if (returnOn) {
      const nextSenderErrors = dlvValidate(sender);
      setSenderErrors(nextSenderErrors);
      const firstInvalid = Object.keys(nextSenderErrors)[0];
      if (firstInvalid) {
        const field = document.querySelector<HTMLElement>(`[data-dlv-return] [data-dlv-field="${firstInvalid}"]`);
        field?.scrollIntoView({ block: "center", behavior: "smooth" });
        field?.focus({ preventScroll: true });
        return false;
      }
    } else {
      setSenderErrors({});
    }

    // Schedule needs a date, tomorrow or later.
    if (when === "schedule" && (!date || date < dlvTomorrow())) {
      setDateError(DLV_DATE_MESSAGE);
      const field = document.querySelector<HTMLElement>('[data-dlv-field="mailDate"]');
      field?.scrollIntoView({ block: "center", behavior: "smooth" });
      field?.focus({ preventScroll: true });
      return false;
    }
    setDateError(undefined);

    return true;
  }

  async function createOrderAndStartMockCheckout() {
    if (backendBusy || !validateDeliveryInputs() || !flowState.cardDraftId || !selectedImageAssetId) return;

    setBackendError(null);
    setBackendAction("creating_order");

    try {
      // Every address goes on the one order: one recipient with its copies, or
      // each recipient in the Multiple list once (owner, 2026-11-08; Scribeless
      // takes many recipients per send).
      const orderRecipients: OrderRecipient[] = mode === "single"
        ? [{ address: dlvPostalAddress(draft), quantity }]
        : recipients.map((recipient) => ({ address: dlvPostalAddress(recipient), quantity: 1 }));
      const request = {
        cardDraftId: flowState.cardDraftId,
        selectedAssetId: selectedImageAssetId,
        recipients: orderRecipients,
        ...(returnOn ? { senderAddress: dlvPostalAddress(sender) } : {}),
      };
      // A retry after "Checkout didn't start" reuses the order already created
      // for the same card and addresses, instead of making a second one (audit B5).
      const signature = JSON.stringify(request);
      const pending = pendingOrderRef.current;
      const reusable = pending && backendOrder && pending.signature === signature && backendOrder.id === pending.id && backendOrder.status === "pending" ? backendOrder : null;
      const order = reusable ?? await createOrder(request);
      pendingOrderRef.current = { id: order.id, signature };

      setBackendOrder(order);
      if (saveToAccount && !reusable) {
        // The order already has its own copy of each address; saving is a
        // convenience, so a failure here never blocks checkout.
        const toSave = mode === "single" ? [draft] : recipients;
        void Promise.all(toSave.map((recipient) => createSavedRecipient(recipient))).catch(() => undefined);
      }
      writeMockMvpFlowState({
        cardDraftId: order.cardDraftId,
        selectedAssetId: order.selectedAssetId,
        orderId: order.id,
        orderStatus: order.status,
        orderCards: { cards: orderCardCount(orderRecipients), addresses: orderRecipients.length },
      });

      setBackendAction("starting_checkout");
      const checkout = await startCheckout(order.id);
      setBackendOrder(checkout.order);
      setCheckoutSession(checkout.checkoutSession);
      rememberCheckoutResult(checkout.order, checkout.checkoutSession);
    } catch (error) {
      const message = error instanceof Error ? error.message : "We couldn't start checkout. Please try again.";
      setBackendError(message);
      bmcError(message, "Checkout didn't start");
    } finally {
      setBackendAction("idle");
    }
  }

  async function completeCheckout() {
    const orderId = backendOrder?.id || flowState.orderId;
    if (backendBusy || !orderId) return;

    setBackendError(null);
    setBackendAction("completing_checkout");

    try {
      const checkout = await completeMockCheckout(orderId);
      setBackendOrder(checkout.order);
      setCheckoutSession(checkout.checkoutSession);
      rememberCheckoutResult(checkout.order, checkout.checkoutSession);
    } catch (error) {
      const message = error instanceof Error ? error.message : "We couldn't confirm your payment. Please try again.";
      setBackendError(message);
      bmcError(message, "Payment not confirmed");
    } finally {
      setBackendAction("idle");
    }
  }

  async function submitMockFulfillment() {
    const order = backendOrder;
    const orderId = order?.id || flowState.orderId;
    const currentStatus = order?.status || flowState.orderStatus;
    if (backendBusy || !orderId) return;

    if (currentStatus !== "paid_mock") {
      const message = "Please complete checkout before we send your card to print.";
      setBackendError(message);
      bmcError(message, "Checkout needed");
      return;
    }

    setBackendError(null);
    setBackendAction("submitting_fulfillment");

    try {
      const result = await submitFulfillment(orderId);
      setBackendOrder(result.order);
      setFulfillment(result.fulfillment);
      rememberFulfillmentResult(result.order, result.fulfillment);
      router.push("/delivery/confirmation");
    } catch (error) {
      const message = error instanceof Error ? error.message : "We couldn't send your card to print. Please try again.";
      setBackendError(message);
      bmcError(message, "Couldn't send to print");
    } finally {
      setBackendAction("idle");
    }
  }

  function handlePrimaryAction() {
    // The button stays focusable while busy (aria-disabled), so ignore presses here.
    if (backendBusy) return;

    if (orderStatus === "checkout_started") {
      void completeCheckout();
      return;
    }

    if (orderStatus === "paid_mock") {
      void submitMockFulfillment();
      return;
    }

    if (orderStatus === "fulfilled_mock") {
      router.push("/delivery/confirmation");
      return;
    }

    handleSend();
  }

  function handleSend() {
    if (CARD_BALANCE_CHECK_ENABLED && readDemoBalance(defaultBalance).cardBank < cardsNeeded) {
      if (!openTopUp("cards", "/delivery")) goToPricing();
      return;
    }

    if (!validateDeliveryInputs()) return;

    void createOrderAndStartMockCheckout();
  }

  const primaryActionLabel = (() => {
    if (backendAction === "loading_assets") return "Loading your card…";
    if (backendAction === "creating_order") return "Creating order…";
    if (backendAction === "starting_checkout") return "Starting checkout…";
    if (backendAction === "completing_checkout") return "Confirming payment…";
    if (backendAction === "submitting_fulfillment") return "Sending to print…";
    if (orderStatus === "checkout_started") return "Confirm payment";
    if (orderStatus === "paid_mock") return "Send to print";
    if (orderStatus === "fulfilled_mock") return "View confirmation";
    return "Continue to checkout";
  })();

  const backendStatus = deliveryStatusLabel(orderStatus);


  return (
    <>
      <div className="cf-wrap dv-wrap" data-screen-label="06 Delivery">
        <header className="cf-head">
          <h1 className="cf-title">
            A card{" "}
            <span className="l-script">worth sending</span>
          </h1>
          <p className="cf-lede dv-lede">
            {fromCommunity
              ? "We’ll print and fold your Community Card with your message inside. Your message was free and no AI credits are used; you only pay for the printed card."
              : "We’ll print and fold your card, handwrite your message, and link your optional song to a QR code inside."}
            {" "}Just tell us where to send it, and we’ll take care of the rest.
          </p>
        </header>

        <div className="dv-grid">
          <div className="dv-keepsake-col">
            <DlvKeepsake imageUrl={frontImageUrl} songIncluded={songIncluded} />
          </div>

          <form className="dv-form" aria-label="Delivery details" noValidate onSubmit={(event) => event.preventDefault()}>
            <DlvRecipientSection
              mode={mode}
              setMode={setMode}
              quantity={quantity}
              setQuantity={setQuantity}
              recipients={recipients}
              setRecipients={setRecipients}
              draft={draft}
              setDraft={setDraft}
              errors={errors}
              setErrors={setErrors}
              editingIdx={editingIdx}
              setEditingIdx={setEditingIdx}
              savedRecipients={savedRecipients}
              saveToAccount={saveToAccount}
              setSaveToAccount={signedIn ? setSaveToAccount : undefined}
            />
            <DlvReturnSection on={returnOn} setOn={setReturnOn} sender={sender} setSender={setSender} errors={senderErrors} />
            <DlvScheduleSection
              when={when}
              setWhen={(value) => { setWhen(value); setDateError(undefined); }}
              date={date}
              setDate={(value) => { setDate(value); setDateError(undefined); }}
              minDate={dlvTomorrow()}
              dateError={dateError}
            />
            <DlvShippingSection country={mode === "single" ? draft.country : (recipients[0]?.country || draft.country)} fromCountry={accountCountry} currency={currency} />
          </form>
        </div>

        <div className="dv-actionbar">
          <div className="dv-status" aria-live="polite">
            <p className="dv-status-main">
              <BmcIcon name="message" w={15} />
              {backendStatus}
            </p>
            <p className={`dv-status-sub ${!enough || backendError ? "is-low" : ""}`}>
              {backendError
                ? backendError
                : enough
                  ? "Your card is ready to send."
                  : "Go back to Review to finish your card before sending."}
            </p>
          </div>
          <div className="dv-actionbar-right">
            <Link href={backHref} className="l-btn l-btn-secondary dv-back"><BmcIcon name="back" w={14} /> {backLabel}</Link>
            <button type="button" className="l-btn l-btn-primary dv-primary" onClick={handlePrimaryAction} disabled={!backendBusy && !enough && orderStatus !== "fulfilled_mock"} aria-disabled={backendBusy || undefined} aria-busy={backendBusy || undefined}>
              {backendBusy && <span className="cf-spin" aria-hidden="true" />}
              {primaryActionLabel} {!backendBusy && <BmcIcon name="arrow" w={16} />}
            </button>
          </div>
        </div>
      </div>

      <BmcErrorModal />
    </>
  );
}

export { DeliveryApp };
