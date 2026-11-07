"use client";

import * as React from "react";
import Link from "next/link";
import { BmcIcon } from "./BmcShared";
import { deliveryOrderNumber, deliveryStatusLabel } from "./delivery/deliveryStatus";
import { EMPTY_FLOW_STATE, MOCK_MVP_FLOW_UPDATED_EVENT, readMockMvpFlowState } from "../lib/mockMvpFlow";
import type { MockMvpFlowState } from "../lib/mockMvpFlow";

// Delivery confirmation: reads the order stored by Delivery. Customer wording
// approved 2026-11-06; the internal IDs sit in a closed "Reference details"
// section (for support) instead of the main list.

function shortId(value: string | null | undefined) {
  return value ? value.slice(0, 12) : "Not returned";
}

function DeliveryConfirmationApp() {
  // Starts empty (same as the server render) and reads the stored order after mount.
  const [flowState, setFlowState] = React.useState<MockMvpFlowState>(EMPTY_FLOW_STATE);
  // False until the stored order has been read, so "Nothing to confirm yet"
  // doesn't flash before "On its way" (build-fixes item 22).
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const sync = () => {
      setFlowState(readMockMvpFlowState());
      setReady(true);
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(MOCK_MVP_FLOW_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(MOCK_MVP_FLOW_UPDATED_EVENT, sync);
    };
  }, []);

  const fulfilled = flowState.orderStatus === "fulfilled_mock";

  return (
    <div className={`cf-wrap dc-wrap ${ready ? "" : "is-loading"}`.trim()} data-screen-label="08 Delivery Confirmation" aria-busy={ready ? undefined : true}>
      <header className="cf-head">
        <p className="cf-eyebrow">
          <span className="cf-eyebrow-num">08</span>
          <span>Confirmation</span>
        </p>
        <h1 className="cf-title">
          {fulfilled
            ? <>On its <span className="l-script">way</span></>
            : <>Nothing to <span className="l-script">confirm</span> yet</>}
        </h1>
        <p className="cf-lede">
          {fulfilled
            ? "We're hand-writing your card now, and you'll get an email when it's posted."
            : "We don't have a sent order to show yet. Finish sending your card from Delivery first."}
        </p>
      </header>

      <section className={`dc-card ${fulfilled ? "is-done" : "is-pending"}`} aria-labelledby="dc-card-title">
        <h2 id="dc-card-title" className="dc-card-title">
          <span className="dc-card-ico" aria-hidden="true">{fulfilled ? <BmcIcon name="check" w={16} /> : "!"}</span>
          Order details
        </h2>
        <dl className="cf-rows dc-rows">
          {flowState.orderId && (
            <div><dt>Order number</dt><dd>{deliveryOrderNumber(flowState.orderId)}</dd></div>
          )}
          <div><dt>Order status</dt><dd>{flowState.orderStatus ? deliveryStatusLabel(flowState.orderStatus) : "Not started"}</dd></div>
        </dl>

        <details className="dc-ref">
          <summary>Reference details</summary>
          <dl className="cf-rows dc-ref-rows">
            <div><dt>Order ID</dt><dd>{shortId(flowState.orderId)}</dd></div>
            <div><dt>Card draft</dt><dd>{shortId(flowState.cardDraftId)}</dd></div>
            <div><dt>Selected asset</dt><dd>{shortId(flowState.selectedAssetId)}</dd></div>
            <div><dt>Checkout session</dt><dd>{shortId(flowState.checkoutSessionId)}</dd></div>
            <div><dt>Payment</dt><dd>{shortId(flowState.paymentId)}</dd></div>
            <div><dt>Fulfillment</dt><dd>{shortId(flowState.fulfillment?.mockFulfillmentId || flowState.fulfillment?.id)}</dd></div>
          </dl>
        </details>

        <div className="dc-actions">
          <Link href="/create/my-cards-and-songs" className="l-btn l-btn-secondary">
            Saved Cards &amp; Songs
          </Link>
          <Link href="/create" className="l-btn l-btn-primary">
            Create another <BmcIcon name="arrow" w={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export { DeliveryConfirmationApp };
