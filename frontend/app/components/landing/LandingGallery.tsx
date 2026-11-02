"use client";

import * as React from "react";
import Image from "next/image";
import { MusicPreviewButton } from "../Hero";
import { GALLERY_TEMPLATES } from "./content";
import type { GalleryTemplate } from "./content";
import { SectionHeading } from "./SectionHeading";
import { TintedLogo } from "./TintedLogo";
import { Engraving } from "./Engraving";

// Cards are min(74vw, 290px) wide (250px on desktop), so describe the real
// maximum in px. A "vw" hint makes Next skip the 384px file the hero card
// preloads for the same comic image, which left that preload unused.
const GALLERY_IMAGE_SIZES = "(min-width: 1024px) 250px, 290px";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function PhotoSwap({ name, image, onChange }: { name: string; image: string | null; onChange: (url: string | null) => void }) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  if (image) {
    return (
      <button type="button" className="l-gcard-tool" onClick={() => onChange(null)} aria-label={`Remove your photo from ${name}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    );
  }

  return (
    <>
      <button type="button" className="l-gcard-tool" onClick={() => inputRef.current?.click()} aria-label={`Try ${name} with your own photo`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="11" r="2" />
          <path d="M3 17l5-5 4 4 3-3 6 6" />
        </svg>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="l-sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onChange(URL.createObjectURL(file));
          event.target.value = "";
        }}
      />
    </>
  );
}

function GalleryCard({ template }: { template: GalleryTemplate }) {
  const [photo, setPhoto] = React.useState<string | null>(null);
  // Touch screens have no hover, so a tap turns the card over instead.
  const [flipped, setFlipped] = React.useState(false);
  const pointerType = React.useRef<string>("");

  React.useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo);
  }, [photo]);

  return (
    <li className="l-gcard">
      <button
        type="button"
        className={`l-gcard-flip ${flipped ? "is-flipped" : ""}`}
        aria-pressed={flipped}
        aria-label={`${template.name}: show the ${flipped ? "front" : "back"} of the card`}
        onPointerDown={(event) => { pointerType.current = event.pointerType; }}
        onClick={() => {
          // Mouse users flip by hovering; taps and Enter/Space toggle.
          if (pointerType.current !== "mouse") setFlipped((current) => !current);
          pointerType.current = "";
        }}
      >
        <span className="l-gcard-inner">
          <span className={`l-gcard-face l-gcard-front l-tone-${template.tone}`}>
            {photo ? (
              // Local blob preview chosen by the visitor; next/image can't optimise it.
              <img src={photo} alt="" className="l-gcard-img" />
            ) : template.front ? (
              <Image src={template.front.src} alt="" fill sizes={GALLERY_IMAGE_SIZES} className="l-gcard-img" />
            ) : (
              <span className="l-gcard-occasion">{template.occasion}</span>
            )}
          </span>
          <span className="l-gcard-face l-gcard-back">
            {template.back ? (
              <Image src={template.back.src} alt="" fill sizes={GALLERY_IMAGE_SIZES} className="l-gcard-img" />
            ) : (
              <TintedLogo src="/assets/LogoMark.png" alt="" width={1024} height={1536} sizes="80px" className="l-gcard-logo" />
            )}
          </span>
        </span>
      </button>
      <div className="l-gcard-meta">
        <div>
          <h3 className="l-gcard-name">{template.name}</h3>
          <p className="l-gcard-label">{template.occasion}</p>
        </div>
        <div className="l-gcard-tools">
          <PhotoSwap name={template.name} image={photo} onChange={setPhoto} />
          <MusicPreviewButton label={`Preview ${template.name} song`} />
        </div>
      </div>
    </li>
  );
}

export function LandingGallery() {
  const trackRef = React.useRef<HTMLUListElement | null>(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);
  const trackId = React.useId();

  const updateEdges = React.useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setAtStart(track.scrollLeft <= 4);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4);
  }, []);

  React.useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges]);

  const step = (direction: 1 | -1) => {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>(".l-gcard");
    if (!track || !card) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({
      left: direction * (card.offsetWidth + gap),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  return (
    <section className="l-section l-gallery" aria-labelledby="gallery-title">
      <div className="l-wrap l-gallery-layout">
        <div className="l-gallery-rail">
          <SectionHeading
            id="gallery-title"
            lead="Explore the"
            accent="possibilities"
            sub="Remix our card templates to match the vibe of your loved one."
            align="start"
          />
          <div className="l-gallery-controls">
            <button type="button" className="l-arrow" onClick={() => step(-1)} disabled={atStart} aria-controls={trackId} aria-label="Previous cards">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <button type="button" className="l-arrow" onClick={() => step(1)} disabled={atEnd} aria-controls={trackId} aria-label="Next cards">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <Engraving name="stamp" className="l-eng l-eng-gallery" />
        </div>
        <ul id={trackId} ref={trackRef} className="l-gallery-track" onScroll={updateEdges} aria-label="Card templates">
          {GALLERY_TEMPLATES.map((template) => (
            <GalleryCard key={template.id} template={template} />
          ))}
        </ul>
      </div>
    </section>
  );
}
