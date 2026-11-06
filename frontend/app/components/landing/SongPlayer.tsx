"use client";

import * as React from "react";

type SongPlayerProps = {
  label: string;
  title: string;
  /** MP3 URL. When null, the button is still clickable but plays nothing yet (no status text). */
  audioSrc: string | null;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Vinyl mark; spins while playing (not under reduced motion). */
function VinylMark() {
  return (
    <svg className="l-song-vinyl" viewBox="0 0 48 48" aria-hidden="true">
      {/* Colours come from the active palette in landing.css */}
      <circle className="l-vinyl-disc" cx="24" cy="24" r="22" />
      <circle className="l-vinyl-groove" cx="24" cy="24" r="17" fill="none" strokeWidth=".8" />
      <circle className="l-vinyl-groove" cx="24" cy="24" r="13" fill="none" strokeWidth=".8" />
      <circle className="l-vinyl-label" cx="24" cy="24" r="8" />
      <circle className="l-vinyl-note" cx="24" cy="24" r="1.6" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5z" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6.5" y="5" width="3.6" height="14" rx="1" />
      <rect x="13.9" y="5" width="3.6" height="14" rx="1" />
    </svg>
  );
}

/**
 * MP3 player for the hero card's song. Uses a native <audio> element
 * (preload="none", so nothing downloads until the visitor presses play).
 */
export function SongPlayer({ label, title, audioSrc }: SongPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const available = Boolean(audioSrc) && !failed;

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audioSrc) {
      // TODO: connect the song here (no audio file yet). Intentionally a no-op.
      return;
    }
    if (!audio || !available) return;
    if (audio.paused) {
      setLoading(true);
      try {
        await audio.play();
      } catch {
        // Autoplay rules or a missing/corrupt file.
        if (audio.error) setFailed(true);
      } finally {
        setLoading(false);
      }
    } else {
      audio.pause();
    }
  };

  // Some servers stream audio without a length (duration = Infinity/NaN);
  // then show elapsed time only.
  const knownDuration = Number.isFinite(duration) && duration > 0;

  const status = !audioSrc
    ? ""
    : failed
      ? "Song unavailable"
      : playing || current > 0
        ? knownDuration ? `${formatTime(current)} / ${formatTime(duration)}` : formatTime(current)
        : "Tap to play";

  const progress = knownDuration ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div className={`l-song ${playing ? "is-playing" : ""} ${failed ? "is-unavailable" : ""}`} role="group" aria-label={`${label}: ${title}`}>
      <button
        type="button"
        className="l-song-btn"
        onClick={toggle}
        disabled={failed}
        aria-pressed={playing}
        aria-label={failed ? `${title}: song unavailable` : playing ? `Pause ${title}` : `Play ${title}`}
      >
        <VinylMark />
        <span className="l-song-btn-icon">{playing ? <IconPause /> : <IconPlay />}</span>
      </button>
      <span className="l-song-text">
        <span className="l-song-label">{label}</span>
        <span className="l-song-title">{title}</span>
        {audioSrc && <span className="l-song-status" aria-live="polite">{loading ? "Loading…" : status}</span>}
      </span>
      {available && knownDuration && (
        <span className="l-song-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </span>
      )}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setCurrent(0); }}
          onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
          onDurationChange={(event) => setDuration(event.currentTarget.duration)}
          onError={() => { setFailed(true); setPlaying(false); setLoading(false); }}
        />
      )}
    </div>
  );
}
