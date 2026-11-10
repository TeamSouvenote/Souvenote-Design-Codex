"use client";

import * as React from "react";
import Image from "next/image";
import { FlowDialog } from "../flow/FlowDialog";
import { communityCardPath, type CommunityCard } from "./catalog";
import { ShareIcon } from "./ShareIcon";

// "Share" for a Community Card: get the word out on social media. The link is
// the card's own page (/community-cards/{id}, audit C11), which shows the card
// with Send this card (or the sign-in prompt for guests). No sign-in is needed to
// share. The phone's share sheet is offered first where the browser has one
// (Instagram, TikTok, Messages and the rest live there); otherwise, and always
// on desktop, there are direct links and Copy link. Nothing here tracks people.

/**
 * The card's public link: its own page, /community-cards/{id}, which has the
 * card's title and picture for link previews (audit C11). It uses the site's
 * address when NEXT_PUBLIC_SITE_URL is set (production and previews, so a
 * www. visit still shares the real domain; audit C15), otherwise this browser's
 * origin (local). No tracking parameters.
 */
export function communityShareUrl(card: Pick<CommunityCard, "id">) {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  const origin = configured || (typeof window === "undefined" ? "" : window.location.origin);
  return `${origin}${communityCardPath(card)}`;
}

function absolute(url: string) {
  if (typeof window === "undefined" || /^https?:\/\//i.test(url)) return url;
  return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

type Network = { id: string; label: string; href: (link: string, text: string, image: string) => string };

const NETWORKS: Network[] = [
  { id: "facebook", label: "Facebook", href: (link) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
  { id: "x", label: "X", href: (link, text) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}` },
  { id: "pinterest", label: "Pinterest", href: (link, text, image) => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(link)}&media=${encodeURIComponent(image)}&description=${encodeURIComponent(text)}` },
  { id: "whatsapp", label: "WhatsApp", href: (link, text) => `https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}` },
  { id: "email", label: "Email", href: (link, text) => `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}\n\n${link}`)}` },
];

export function CommunityShareDialog({ card, onClose }: { card: CommunityCard; onClose: () => void }) {
  const link = communityShareUrl(card);
  const text = `“${card.name}” (${card.occasion}) on Souvenote: add your own message inside and it's printed and mailed for you.`;
  const [copied, setCopied] = React.useState<"yes" | "failed" | null>(null);
  const [canNativeShare, setCanNativeShare] = React.useState(false);
  const linkRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function nativeShare() {
    try {
      await navigator.share({ title: `${card.name} | Souvenote`, text, url: link });
    } catch {
      // Closed the share sheet, or the browser refused: the links below still work.
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied("yes");
    } catch {
      // No clipboard permission: select the link so Ctrl/Cmd+C works.
      linkRef.current?.select();
      setCopied("failed");
    }
  }

  return (
    <FlowDialog onClose={onClose} labelledBy="cc-share-title" describedBy="cc-share-lede" tone="forest" className="fd-mid cc-share">
      <div className="cc-share-head">
        <div className={`cc-share-art is-${card.orientation}`}>
          <Image src={card.art} alt="" fill sizes="96px" />
        </div>
        <div>
          <h2 id="cc-share-title" className="fd-title">Share <span className="l-script">{card.name}</span></h2>
        </div>
      </div>
      <p id="cc-share-lede" className="fd-lede">Get the word out. Anyone with the link can see this card and send it with their own message inside.</p>

      {canNativeShare && (
        <button type="button" className="l-btn l-btn-primary cc-share-native" onClick={nativeShare}>
          <ShareIcon /> Share from this device
        </button>
      )}

      <ul className="cc-share-networks" aria-label="Share to">
        {NETWORKS.map((network) => (
          <li key={network.id}>
            {/* The name says which card and where (audit C14); the visible word stays in it (WCAG 2.5.3). */}
            <a className="cc-share-network" href={network.href(link, text, absolute(card.art))} target={network.id === "email" ? undefined : "_blank"} rel="noopener noreferrer"
              aria-label={`${network.id === "email" ? "Email" : `Share on ${network.label}`}: ${card.name}${network.id === "email" ? "" : " (opens in a new tab)"}`}>
              {network.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="cc-share-copy">
        <label htmlFor="cc-share-link" className="l-sr-only">Card link</label>
        <input id="cc-share-link" ref={linkRef} className="cf-input" readOnly value={link} onFocus={(event) => event.currentTarget.select()} />
        <button type="button" className="l-btn l-btn-secondary" onClick={copy}>{copied === "yes" ? "Copied" : "Copy link"}</button>
      </div>
      <p className="cc-share-status" role="status">
        {copied === "yes" ? "Link copied. Paste it anywhere you like." : copied === "failed" ? "Couldn't copy automatically. The link is selected: press Ctrl+C (or Cmd+C) to copy it." : ""}
      </p>
      <p className="fd-fineprint">For Instagram or TikTok, copy the link and add it to your story, post or bio{canNativeShare ? ", or use Share from this device" : ""}.</p>
    </FlowDialog>
  );
}
