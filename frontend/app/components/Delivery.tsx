"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BmcIcon, BmcErrorModal, bmcError } from "./BmcShared";
import { DlvKeepsake } from "./DeliveryKeepsake";
import { consumeBlankSouvenoteGift, useBlankSouvenoteGiftCount } from "./GiftAddon";
import { completeMockCheckout, createOrder, fetchCardDraftAssets, startCheckout, submitFulfillment } from "../lib/api";
import type { CardDraftAsset, CheckoutSession, FulfillmentRecord, Order, PostalAddress } from "../lib/api";
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
import { readDemoBalance, useDemoBalance } from "./DemoBalance";
import type { DemoBalance } from "./DemoBalance";
import type { DemoCredits } from "./DemoUser";
import { openTopUp } from "./pricing/topUp";
import { FlowDialog } from "./flow/FlowDialog";
import { FlowField } from "./flow/FlowField";
import { useAuth } from "./AuthProvider";
import { deliveryStatusLabel } from "./delivery/deliveryStatus";
import { useDeliveryBackHref } from "./delivery/deliverySource";

type BackendAction =
  | "idle"
  | "loading_assets"
  | "creating_order"
  | "starting_checkout"
  | "completing_checkout"
  | "submitting_fulfillment";

type DlvBlankGiftModalProps = {
  open: boolean;
  count: number;
  name: string;
  contact: string;
  onNameChange: (value: string) => void;
  onContactChange: (value: string) => void;
  onClose: () => void;
  onKeepLater: () => void;
  onSaveGift: () => void;
};

type DeliveryAppProps = {
  initialCards?: number;
  initialCredits?: DemoCredits;
};

declare global {
  interface Window {
    __dlvSetCards?: React.Dispatch<React.SetStateAction<number>>;
    __dlvOpenCheckout?: () => void;
  }
}

function DlvBlankGiftModal({
  open,
  count,
  name,
  contact,
  onNameChange,
  onContactChange,
  onClose,
  onKeepLater,
  onSaveGift,
}: DlvBlankGiftModalProps) {
  if (!open || count <= 0) return null;

  const canSave = contact.trim().length > 3;

  return (
    <FlowDialog
      onClose={onClose}
      labelledBy="dlv-blank-gift-title"
      describedBy="dlv-blank-gift-sub"
      className="fd-wide"
      tone="berry"
      screenLabel="Delivery · Blank gift reminder"
    >
      <div className="fd-split">
        <div className="fd-split-main">
          <p className="fd-eyebrow">
            <BmcIcon name="spark2" w={14} />
            <span>Blank Souvenote Gift</span>
          </p>
          <h2 id="dlv-blank-gift-title" className="fd-title">
            You have a blank <span className="l-script">Souvenote</span> to give.
          </h2>
          <p id="dlv-blank-gift-sub" className="fd-lede">
            Before you send this card, choose who should receive the blank Souvenote or keep it in your account for later.
          </p>
          <div className="fd-fields">
            <FlowField label="Recipient name">
              {(control) => <input {...control} className="cf-input" value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="Who should receive it?" autoComplete="off" />}
            </FlowField>
            <FlowField label="Email or phone">
              {(control) => <input {...control} className="cf-input" value={contact} onChange={(event) => onContactChange(event.target.value)} placeholder="name@example.com or phone" autoComplete="off" />}
            </FlowField>
          </div>
        </div>
        <aside className="fd-aside" aria-label="Blank Souvenote Gift">
          <div className="fd-token" aria-hidden="true">
            <span>A Souvenote,<br />on you</span>
          </div>
          <p className="fd-aside-name">Blank Souvenote Gift</p>
          <dl className="cf-rows">
            <div><dt>Available</dt><dd>{count} {count === 1 ? "gift" : "gifts"}</dd></div>
            <div><dt>Recipient</dt><dd>{contact.trim() ? "Ready to save" : "Choose now or later"}</dd></div>
            <div><dt>Reminder</dt><dd>Delivery step</dd></div>
          </dl>
        </aside>
      </div>
      <div className="fd-actions">
        <button type="button" className="l-btn l-btn-secondary" onClick={onKeepLater}>Keep for later</button>
        <button type="button" className="l-btn l-btn-primary" onClick={onSaveGift} disabled={!canSave}>
          Save gift &amp; send card <BmcIcon name="arrow" w={15} />
        </button>
      </div>
    </FlowDialog>
  );
}

const DELIVERY_DEFAULT_CREDITS: DemoCredits = { images: 0, songs: 0 };

// Blank Souvenote Gift reminder + pop-up on Delivery: off until version 2
// (owner, 2026-11-06). Choosing a gift recipient isn't built, so there's nothing
// to do here yet. The gift stays in the account.
const GIFT_AT_DELIVERY_ENABLED = false;

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
function dlvPostalAddress(recipient: DeliveryRecipient): PostalAddress {
  return {
    name: [recipient.firstName, recipient.lastName].map((part) => part.trim()).filter(Boolean).join(" "),
    line1: [recipient.address1, recipient.address2, recipient.address3].map((part) => part.trim()).filter(Boolean).join(", "),
    city: recipient.city.trim(),
    region: recipient.state.trim(),
    postalCode: recipient.postalCode.trim(),
    country: recipient.country || "CA",
  };
}

function DeliveryApp({ initialCards = 0, initialCredits = DELIVERY_DEFAULT_CREDITS }: DeliveryAppProps) {
  const router = useRouter();
  const defaultBalance: DemoBalance = React.useMemo(
    () => ({ credits: initialCredits, cardBank: initialCards }),
    [initialCards, initialCredits],
  );
  const demoBalance = useDemoBalance(defaultBalance);

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
  // The count itself is no longer shown (the "On its way" pop-up was removed, item 16).
  const [, setCardBank] = React.useState(demoBalance.cardBank);
  const backHref = useDeliveryBackHref();
  // Starts empty (same as the server render) and reads the stored order after mount.
  const [flowState, setFlowState] = React.useState<MockMvpFlowState>(EMPTY_FLOW_STATE);
  const [backendOrder, setBackendOrder] = React.useState<Order | null>(null);
  const [, setCheckoutSession] = React.useState<CheckoutSession | null>(null);
  const [, setFulfillment] = React.useState<FulfillmentRecord | null>(null);
  const [backendAction, setBackendAction] = React.useState<BackendAction>("idle");
  const [backendError, setBackendError] = React.useState<string | null>(null);
  const assetLookupDraftRef = React.useRef<string | null>(null);
  // Only when the card really has a song (no sample song).
  const songIncluded = hasGeneratedAsset(flowState.generatedAssets, "song");
  const blankGiftCount = useBlankSouvenoteGiftCount();
  const [giftReminderDismissed, setGiftReminderDismissed] = React.useState(false);
  const [giftModalOpen, setGiftModalOpen] = React.useState(false);
  const [giftRecipientName, setGiftRecipientName] = React.useState("");
  const [giftRecipientContact, setGiftRecipientContact] = React.useState("");

  React.useEffect(() => {
    setCardBank(demoBalance.cardBank);
  }, [demoBalance.cardBank]);

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

  React.useEffect(() => {
    window.__dlvSetCards = setCardBank;
    window.__dlvOpenCheckout = goToPricing;
  }, [goToPricing]);

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
      const primaryRecipient = mode === "single" ? draft : recipients[0];
      const order = await createOrder({
        cardDraftId: flowState.cardDraftId,
        selectedAssetId: selectedImageAssetId,
        recipientAddress: dlvPostalAddress(primaryRecipient),
        ...(returnOn ? { senderAddress: dlvPostalAddress(sender) } : {}),
      });

      setBackendOrder(order);
      writeMockMvpFlowState({
        cardDraftId: order.cardDraftId,
        selectedAssetId: order.selectedAssetId,
        orderId: order.id,
        orderStatus: order.status,
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

    if (GIFT_AT_DELIVERY_ENABLED && blankGiftCount > 0) {
      setGiftModalOpen(true);
      return;
    }

    void createOrderAndStartMockCheckout();
  }

  function keepGiftForLaterAndSend() {
    setGiftModalOpen(false);
    setGiftReminderDismissed(true);
    void createOrderAndStartMockCheckout();
  }

  function saveGiftRecipientAndSend() {
    consumeBlankSouvenoteGift();
    setGiftModalOpen(false);
    setGiftReminderDismissed(true);
    void createOrderAndStartMockCheckout();
  }

  const primaryActionLabel = (() => {
    if (backendAction === "loading_assets") return "Loading your card...";
    if (backendAction === "creating_order") return "Creating order...";
    if (backendAction === "starting_checkout") return "Starting checkout...";
    if (backendAction === "completing_checkout") return "Confirming payment...";
    if (backendAction === "submitting_fulfillment") return "Sending to print...";
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
          <p className="cf-eyebrow">
            <span className="cf-eyebrow-num">07</span>
            <span>Delivery</span>
          </p>
          <h1 className="cf-title">
            A card{" "}
            <span className="l-script">worth sending</span>
          </h1>
          <p className="cf-lede dv-lede">
            We’ll print and fold your card, handwrite your message, and link your optional song to a QR code inside.
            Just tell us where to send it, and we’ll take care of the rest.
          </p>
        </header>

        {GIFT_AT_DELIVERY_ENABLED && blankGiftCount > 0 && !giftReminderDismissed && (
          <div className="dv-gift-reminder" role="status">
            <span className="dv-gift-reminder-ico" aria-hidden="true"><BmcIcon name="spark2" w={18} /></span>
            <div>
              <p className="dv-gift-reminder-title">You have a blank Souvenote to give</p>
              <p>We&apos;ll remind you when you send this card. You have {blankGiftCount} {blankGiftCount === 1 ? "blank gift" : "blank gifts"} ready.</p>
            </div>
            <button
              type="button"
              className="l-btn l-btn-secondary dv-gift-reminder-dismiss"
              onClick={() => setGiftReminderDismissed(true)}
            >
              Dismiss
            </button>
          </div>
        )}

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
            <DlvShippingSection country={draft.country} />
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
            <Link href={backHref} className="l-btn l-btn-secondary dv-back"><BmcIcon name="back" w={14} /> Back to review</Link>
            <button type="button" className="l-btn l-btn-primary dv-primary" onClick={handlePrimaryAction} disabled={backendBusy || (!enough && orderStatus !== "fulfilled_mock")} aria-busy={backendBusy || undefined}>
              {backendBusy && <span className="cf-spin" aria-hidden="true" />}
              {primaryActionLabel} {!backendBusy && <BmcIcon name="arrow" w={16} />}
            </button>
          </div>
        </div>
      </div>

      <DlvBlankGiftModal
        open={giftModalOpen}
        count={blankGiftCount}
        name={giftRecipientName}
        contact={giftRecipientContact}
        onNameChange={setGiftRecipientName}
        onContactChange={setGiftRecipientContact}
        onClose={() => setGiftModalOpen(false)}
        onKeepLater={keepGiftForLaterAndSend}
        onSaveGift={saveGiftRecipientAndSend}
      />
      <BmcErrorModal />
    </>
  );
}

export { DeliveryApp };
