"use client";

// "Top up to create your card": the customer chooses between a card (which
// comes with AI credits) and credits alone. Shared by Build My Card and
// Personalize a Template (owner, 2026-11-07 / 2026-11-08). Shown only when
// they press Create (or a paid redo) without enough credits; the card is saved
// first, so the purchase returns them to it. The "entry" variant (Personalize,
// on opening the page) was removed on 2026-11-08 (owner): no flow checks
// credits before the moment of spending. "redo" (owner, 2026-11-09, audit §8 D10) is a paid "Try again"
// on Review: the same choice, worded for a new version of a card that already exists.
// Styles: styles/bmc-dialogs.css (.bmcq-topup-*).

import * as React from "react";
import { FlowDialog } from "./FlowDialog";
import { Icon } from "../bmc/ui";

export type TopUpChoice = "cards" | "credits";

type Props = {
  variant: "create" | "redo";
  /** Credits the action needs. */
  need?: number;
  credits: number;
  onChoose: (view: TopUpChoice) => void;
  onCancel: () => void;
};

const plural = (n: number) => `${n} credit${n === 1 ? "" : "s"}`;

export function TopUpChoiceDialog({ variant, need = 1, credits, onChoose, onCancel }: Props) {
  const redo = variant === "redo";
  return (
    <FlowDialog onClose={onCancel} labelledBy="bmcq-topup-title" describedBy="bmcq-topup-body" tone="gold" className="fd-mid bmcq-dialog bmcq-topup"
      screenLabel={redo ? "Modal · Top up to make a new version" : "Modal · Top up to create"}>
      <h2 id="bmcq-topup-title" className="fd-title">
        {redo ? <>Top up to make a new <span className="l-script">version</span></> : <>Top up to create <span className="l-script">your card</span></>}
      </h2>
      <p id="bmcq-topup-body" className="fd-lede">
        {`This uses ${plural(need)} and you have ${plural(credits)}. Choose what to add:`}
      </p>
      <div className="bmcq-topup-options">
        <button type="button" className="bmcq-topup-option is-cards" onClick={() => onChoose("cards")}>
          <span className="bmcq-topup-badge">Best value</span>
          <b>Top up cards</b>
          <span>Every card includes printing, shipping and <strong>10 AI credits</strong>. {redo ? "Make the new version now, then send your card." : "Create this card now, then send it."}</span>
          <span className="bmcq-topup-go">Choose cards <Icon name="arrow" size={16} /></span>
        </button>
        <button type="button" className="bmcq-topup-option is-credits" onClick={() => onChoose("credits")}>
          <b>Top up credits only</b>
          <span>Credits for creating and editing. You can buy the printed card later, when you send it.</span>
          <span className="bmcq-topup-go">Choose credits <Icon name="arrow" size={16} /></span>
        </button>
      </div>
      <p className="bmcq-topup-saved">
        <Icon name="check" size={16} />{" "}
        {redo ? "Your card is saved. After you pay, you’ll come straight back to your review." : "Your card is saved. After you pay, you’ll come straight back here to finish it."}
      </p>
      <div className="fd-actions">
        <button type="button" className="l-btn l-btn-secondary" onClick={onCancel}>Not now</button>
      </div>
    </FlowDialog>
  );
}
