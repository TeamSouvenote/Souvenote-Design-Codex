"use client";

import * as React from "react";
import Image from "next/image";
import { HERO_SONG } from "./content";
import { SongPlayer } from "./SongPlayer";
import { Engraving } from "./Engraving";

/**
 * The hero keepsake: the comic card turns slowly and continuously, showing
 * the cover on the front and the four-panel inside on the back.
 * Tap / click / Enter / Space pauses or resumes (WCAG 2.2.2); hover with a
 * mouse and keyboard focus also hold it still.
 */
export function HeroCard() {
  const [paused, setPaused] = React.useState(false);
  const hintId = React.useId();

  return (
    <div className="l-hero-figure">
      {/* Staggered side motifs: heart high on the left, notes lower on the right */}
      <Engraving name="heart" className="l-eng l-eng-card l-eng-card-left" />
      <Engraving name="notes" className="l-eng l-eng-card l-eng-card-right" />
      <button
        type="button"
        className={`l-card ${paused ? "is-paused" : ""}`}
        aria-pressed={paused}
        aria-describedby={hintId}
        aria-label="Pause the turning Jude Mister comic card (front cover and four-panel inside)"
        onClick={() => setPaused((current) => !current)}
      >
        <span className="l-card-inner" aria-hidden="true">
          <span className="l-card-face l-card-front">
            <Image
              src="/assets/pt-comic-cover.jpg"
              alt=""
              fill
              sizes="(min-width: 960px) 288px, 58vw"
              className="l-card-art"
              priority
            />
          </span>
          <span className="l-card-face l-card-back">
            <Image
              src="/assets/pt-comic-back.jpg"
              alt=""
              fill
              sizes="(min-width: 960px) 288px, 58vw"
              className="l-card-art"
            />
          </span>
        </span>
      </button>

      <SongPlayer label={HERO_SONG.label} title={HERO_SONG.title} audioSrc={HERO_SONG.audioSrc} />

      <p id={hintId} className="l-card-hint">
        {paused ? "Tap or click the card to keep it turning" : "Tap or click the card to pause"}
      </p>
    </div>
  );
}
