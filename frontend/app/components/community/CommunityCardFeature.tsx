"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../AuthProvider";
import { COMMUNITY_CARDS, type CommunityCard } from "./catalog";
import { ShareIcon } from "./ShareIcon";

// A Community Card's own page (/community-cards/{id}, audit C11): the address
// every Share link points to, so link previews show this card's name and front.
// Anyone sees the card; Send this card opens the Send pop-up (signed in) or the
// guest pop-up, and Share link works for everyone. The pop-ups load on open.

const CommunitySendDialog = dynamic(() => import("./CommunitySendDialog").then((m) => m.CommunitySendDialog), { ssr: false });
const CommunitySignInDialog = dynamic(() => import("./CommunitySendDialog").then((m) => m.CommunitySignInDialog), { ssr: false });
const CommunityShareDialog = dynamic(() => import("./CommunityShare").then((m) => m.CommunityShareDialog), { ssr: false });

export function CommunityCardFeature({ cardId }: { cardId: string }) {
  const card = COMMUNITY_CARDS.find((item) => item.id === cardId) as CommunityCard;
  const auth = useAuth();
  const signedIn = auth.status === "authenticated";
  const [open, setOpen] = React.useState<"send" | "gate" | "share" | null>(null);

  return (
    <div className="cf-wrap cc-wrap cc-card-page">
      <article className="cc-card-feature" aria-labelledby="cc-card-title">
        <div className={`cc-card-art is-${card.orientation}`}>
          <span className="cc-tile-face">
            <Image src={card.art} alt={`${card.name}: card front (placeholder until the artwork is ready)`} fill sizes="(min-width: 720px) 320px, 70vw" priority />
          </span>
        </div>
        <div className="cc-card-body">
          <h1 id="cc-card-title" className="cc-card-title">{card.name}</h1>
          <p className="cc-card-lede">A ready-made {card.orientation} card. Write your own message inside for free, with no AI credits, and we print and mail it to Canada or the US.</p>
          <div className="cc-card-actions">
            <button type="button" className="l-btn l-btn-primary" onClick={() => setOpen(signedIn ? "send" : "gate")}>Send this card</button>
            <button type="button" className="l-btn l-btn-secondary" onClick={() => setOpen("share")}><ShareIcon size={16} /> Share link</button>
          </div>
          <p className="cc-card-more"><Link href="/community-cards">See all Community Cards</Link></p>
        </div>
      </article>

      {open === "send" && <CommunitySendDialog card={card} onClose={() => setOpen(null)} />}
      {open === "gate" && <CommunitySignInDialog card={card} onClose={() => setOpen(null)} onShare={() => setOpen("share")} />}
      {open === "share" && <CommunityShareDialog card={card} onClose={() => setOpen(null)} />}
    </div>
  );
}
