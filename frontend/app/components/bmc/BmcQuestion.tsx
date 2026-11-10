"use client";

// Renders the controls for one questionnaire question. The orchestrator
// (BmcQuestionnaire) owns the brief, saving and the interviewer; each control
// keeps only its unsaved input and calls `answer` to commit.

import * as React from "react";
import type { Brief } from "./brief";
import { cleanDirection, generationCost, hasPhoto, hasSong, isAiMessageStale, lyricsStaleReason, validateLyrics, validateMessage, wordCount } from "./brief";
import {
  ACCENT_GROUPS, BORDER_COLOURS, BORDER_STYLES, CUSTOM_ID, GENRE_PRESETS, GENTLE_OCCASIONS, IMAGE_MODES, LIMITS, MAX_VIBES, OCCASIONS, PATTERNS, SPARKLES, STICKERS,
  SUGGESTED_ACCENT_TYPES, VIBES, VISUAL_STYLES, WEARABLES, genreById,
} from "./catalog";
import type { ImageMode, SongMode } from "./catalog";
import type { SignoffStyle } from "./engine";
import { USER_DIRECTION_MAX_CHARS } from "./prompts";
import { decorateHasSomething, imageSummary, resolveDecorations, wearableName } from "./compile";
import type { Question } from "./questionBank";
import { LOOK_QUESTION_IDS } from "./questionBank";
import { QrSongCode } from "./QrSongCode";
import { Actions, BusyAnnounce, CardPlaceholder, ChoiceGroup, Counter, Icon, LyricBlocks, SectionAnnounce, TextField, Thinking, ToggleChips, useFocusAfterRemove, useIsPhone, useRefocusAfterBusy, useSections } from "./ui";
import { COMMUNITY_SKIPPED_QUESTIONS, useBmcCommunity } from "./community";

export type AnswerOptions = { text?: string; controls?: Record<string, unknown>; shared?: boolean };

export type QuestionServices = {
  pickPhotos: (files: FileList | File[] | null) => void;
  removePhoto: (id: string) => void;
  suggestCaption: () => Promise<string | null>;
  /** The optional note steers a redraft only. */
  draftAiMessage: (direction?: string | null) => Promise<void>;
  loadRecommendations: () => Promise<void>;
  draftLyrics: (direction?: string | null) => Promise<void>;
  generate: () => Promise<void>;
  update: (change: (brief: Brief) => void, shared?: boolean) => void;
  edit: (questionId: string) => void;
  credits: number;
  creditsReady: boolean;
  generating: boolean;
};

export type QuestionContext = {
  brief: Brief;
  question: Question;
  busy: boolean;
  answer: (change: (brief: Brief) => void, options?: AnswerOptions) => void;
  skip?: () => void;
  back?: () => void;
  services: QuestionServices;
};

/** Props for a control that does not read its bank entry; shared with Personalize a Template. */
export type SharedQuestionProps = Omit<QuestionContext, "question">;

export function BmcQuestion(ctx: QuestionContext) {
  switch (ctx.question.kind) {
    case "photo": return <PhotoQuestion {...ctx} />;
    case "primary": return <PrimaryQuestion {...ctx} />;
    case "same-subject": return <SameSubjectQuestion {...ctx} />;
    case "story": case "purpose": case "text": return <TextQuestion {...ctx} />;
    case "occasion": return <OccasionQuestion {...ctx} />;
    case "people": return <PeopleQuestion {...ctx} />;
    case "orientation": return <OrientationQuestion {...ctx} />;
    case "mode": return <ModeQuestion {...ctx} />;
    case "style": return <StyleQuestion {...ctx} />;
    case "refine": return <RefineQuestion {...ctx} />;
    case "decorate-what": return <DecorateWhatQuestion {...ctx} />;
    case "stickers": return <StickersQuestion {...ctx} />;
    case "pattern": return <PickOneQuestion {...ctx} options={PATTERNS} label="Background pattern" read={(b) => [b.image.decorations.pattern, b.image.decorations.customPattern]}
      write={(b, id, custom) => { b.image.decorations.pattern = id; b.image.decorations.customPattern = custom; }} customLabel="Describe the pattern" customPlaceholder="Describe the pattern, e.g. tiny teacups" />;
    case "sparkle": return <PickOneQuestion {...ctx} options={SPARKLES} label="Light effect" read={(b) => [b.image.decorations.sparkle, b.image.decorations.customSparkle]}
      write={(b, id, custom) => { b.image.decorations.sparkle = id; b.image.decorations.customSparkle = custom; }} customLabel="Describe the effect" customPlaceholder="Describe the effect, e.g. golden hour haze" />;
    case "accents": return <AccentsQuestion {...ctx} />;
    case "wearables": return <WearablesQuestion {...ctx} />;
    case "wearer": return <WearerQuestion {...ctx} />;
    case "border": return <BorderQuestion {...ctx} />;
    case "border-colour": return <BorderColourQuestion {...ctx} />;
    case "vibes": return <VibesQuestion {...ctx} />;
    case "caption": return <CaptionQuestion {...ctx} />;
    case "image-summary": return <ImageSummaryQuestion {...ctx} />;
    case "message": return <MessageQuestion {...ctx} />;
    case "song-mode": return <SongModeQuestion {...ctx} />;
    case "genre": return <GenreQuestion {...ctx} />;
    case "lyrics": return <LyricsQuestion {...ctx} />;
    case "generate": return <GenerateQuestion {...ctx} />;
    default: return null;
  }
}

// ---- Photo ---------------------------------------------------------------------

function PhotoQuestion({ brief, answer, services, busy }: QuestionContext) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  // Community cards (?for=community) never use photos: describe only, no way back to uploads.
  const community = useBmcCommunity();
  const [describeChosen, setDescribe] = React.useState(brief.control.photoSkipped === true);
  const describe = community || describeChosen;
  const [subject, setSubject] = React.useState(brief.image.subjectDescription || "");
  const [dragging, setDragging] = React.useState(false);
  const refs = brief.image.references;
  const room = LIMITS.maxReferenceImages - refs.length;
  // Focus never falls to <body> when the control that had it goes away (2.28):
  // Back from "describe" returns to its link; removing a photo moves to the next
  // remove button, or to Choose photos once none are left.
  const chooseRef = React.useRef<HTMLButtonElement>(null);
  const describeLinkRef = React.useRef<HTMLButtonElement>(null);
  const thumbsRef = React.useRef<HTMLUListElement>(null);
  const wasDescribing = React.useRef(describe);
  React.useEffect(() => {
    if (wasDescribing.current && !describe) describeLinkRef.current?.focus();
    wasDescribing.current = describe;
  }, [describe]);
  const markRemoved = useFocusAfterRemove(refs.length, thumbsRef, chooseRef);

  if (describe) {
    return (
      <>
        <TextField
          id="bmcq-subject" label={community ? "Describe the front of your card" : "Describe who or what the card is about"} multiline rows={4} value={subject} onChange={setSubject}
          placeholder={community ? "A fox in a knitted scarf, among golden autumn leaves." : "My sister Maya: curly red hair, big laugh, usually in her gardening hat."}
          hint={community
            ? "Optional. Keep it general and kind: no real people, characters, brands or names. Causes and statements are welcome when they don't target anyone."
            : "Optional. Without a photo we create original artwork from your words. We never guess what someone looks like from their name."}
          autoFocus={!community && !brief.control.photoSkipped}
        />
        <Actions
          onBack={community ? undefined : () => setDescribe(false)}
          continueLabel={community ? "Continue" : "Continue without a photo"}
          busy={busy}
          onContinue={() => answer((b) => {
            b.control.photoSkipped = true;
            b.image.subjectDescription = subject.trim() || null;
            b.image.mode = "transform";
            b.image.references = [];
            b.image.primaryReferenceId = null;
            // Community cards don't picture a particular person, so the hair / clothes follow-ups are
            // skipped, and so is "Who it's from and to" (Community Cards audit C12).
            if (community) {
              for (const id of [...Object.values(LOOK_QUESTION_IDS), ...COMMUNITY_SKIPPED_QUESTIONS]) if (!b.control.answered.includes(id)) b.control.answered.push(id);
            }
          }, { text: subject.trim() })}
        />
      </>
    );
  }

  return (
    <>
      <div
        className={`bmcq-drop${dragging ? " is-dragging" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); services.pickPhotos(event.dataTransfer.files); }}
      >
        <Icon name="upload" size={28} />
        <p className="bmcq-drop-title">Drop photos here, or</p>
        <button ref={chooseRef} type="button" className="bmcq-btn is-primary" onClick={() => { if (room > 0) inputRef.current?.click(); }} aria-disabled={room <= 0 || undefined}>
          Choose photos
        </button>
        <input
          ref={inputRef} type="file" accept={LIMITS.acceptedImageTypes.join(",")} multiple hidden
          onChange={(event) => { services.pickPhotos(event.target.files); event.target.value = ""; }}
        />
        <p className="bmcq-hint">{refs.length ? `${refs.length} of ${LIMITS.maxReferenceImages} added` : `Up to ${LIMITS.maxReferenceImages} photos`}. You’ll confirm you have the right to use them as soon as you add them.</p>
      </div>

      {refs.length > 0 && (
        <ul ref={thumbsRef} className="bmcq-thumbs" aria-label="Your photos">
          {refs.map((ref, index) => (
            <li key={ref.id} className="bmcq-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element -- a local photo preview (blob or data URL), which next/image can't optimise */}
              {ref.thumbnail ? <img src={ref.thumbnail} alt={`Photo ${index + 1} of ${refs.length}`} /> : <span className="bmcq-thumb-name">{ref.name}</span>}
              <button type="button" className="bmcq-thumb-remove" aria-label={`Remove ${ref.name}`} onClick={() => { markRemoved(index); services.removePhoto(ref.id); }}>
                <Icon name="close" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Actions
        note={<button ref={describeLinkRef} type="button" className="bmcq-link" onClick={() => setDescribe(true)}>No photo? Describe them instead</button>}
        busy={busy}
        disabled={refs.length === 0}
        onContinue={() => answer((b) => { b.control.photoSkipped = false; }, { controls: { photos: refs.length } })}
      />
    </>
  );
}

function PrimaryQuestion({ brief, answer, back, busy }: QuestionContext) {
  const [value, setValue] = React.useState(brief.image.primaryReferenceId || brief.image.references[0]?.id || null);
  return (
    <>
      <div role="radiogroup" aria-label="Main photo" className="bmcq-thumbs is-pick">
        {brief.image.references.map((ref) => (
          <button
            key={ref.id} type="button" role="radio" aria-checked={value === ref.id}
            className={`bmcq-thumb is-pickable${value === ref.id ? " is-selected" : ""}`} onClick={() => setValue(ref.id)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a local photo preview (blob or data URL), which next/image can't optimise */}
            {ref.thumbnail ? <img src={ref.thumbnail} alt="" /> : <span className="bmcq-thumb-name">{ref.name}</span>}
            <span className="l-sr-only">{ref.name}</span>
            {value === ref.id && <span className="bmcq-thumb-badge">Main</span>}
          </button>
        ))}
      </div>
      <Actions onBack={back} busy={busy} disabled={!value} onContinue={() => answer((b) => {
        b.image.primaryReferenceId = value;
        b.image.references = b.image.references.map((ref) => ({ ...ref, role: ref.id === value ? "primary" : "identity" }));
      })} />
    </>
  );
}

function SameSubjectQuestion({ brief, answer, back, busy }: QuestionContext) {
  const [value, setValue] = React.useState(brief.image.sameSubject);
  return (
    <>
      <ChoiceGroup label="Who's in the photos" columns="cards" value={value} onChange={setValue} options={[
        { id: "same", label: "The same person or pet", sub: "We'll use them all to keep one likeness." },
        { id: "different", label: "Different people or pets", sub: "We'll keep each one recognisable." },
        { id: "mix", label: "A mix", sub: "Some photos repeat someone, some don't." },
      ]} />
      <Actions onBack={back} busy={busy} disabled={!value} onContinue={() => answer((b) => { b.image.sameSubject = value; })} />
    </>
  );
}

// ---- Basics ---------------------------------------------------------------------

const TEXT_TARGET: Record<string, (b: Brief) => string | null> = {
  T1_scene: (b) => b.image.vision,
  T2_detail: (b) => b.image.sceneDetail,
  T3_options: (b) => b.image.options,
  T4_keep: (b) => b.image.keep,
  D6_own_words: (b) => b.image.decorations.customText,
  D10_lettering: (b) => b.image.decorations.lettering,
  P4_look_hair: (b) => b.image.lookDetails.hair,
  P4_look_style: (b) => b.image.lookDetails.style,
  P4_look_signature: (b) => b.image.lookDetails.signature,
};

const TEXT_SET: Record<string, (b: Brief, value: string | null) => void> = {
  T1_scene: (b, v) => { b.image.vision = v; },
  T2_detail: (b, v) => { b.image.sceneDetail = v; },
  T3_options: (b, v) => { b.image.options = v; },
  T4_keep: (b, v) => { b.image.keep = v; },
  D6_own_words: (b, v) => { b.image.decorations.customText = v; },
  D10_lettering: (b, v) => { b.image.decorations.lettering = v ? v.slice(0, 40) : null; },
  P4_look_hair: (b, v) => { b.image.lookDetails.hair = v; },
  P4_look_style: (b, v) => { b.image.lookDetails.style = v; },
  P4_look_signature: (b, v) => { b.image.lookDetails.signature = v; },
};

function TextQuestion({ brief, question, answer, skip, back, busy }: QuestionContext) {
  const initial = TEXT_TARGET[question.id]?.(brief) || "";
  const limit = question.id === "D10_lettering" ? 40 : 1000;
  const [value, setValue] = React.useState(initial);
  const required = !question.optional;
  return (
    <>
      <TextField
        id={`bmcq-${question.id}`} label={question.heading.join(" ")} hideLabel multiline rows={question.kind === "story" ? 5 : 4}
        value={value} onChange={setValue} placeholder={question.placeholder} maxLength={limit} autoFocus
        hint={question.kind === "story" || question.kind === "purpose" ? question.helper
          : question.id === "D10_lettering" ? <Counter value={value.length} max={limit} label="characters" /> : undefined}
      />
      <Actions
        onBack={back}
        onSkip={question.optional ? skip : undefined}
        busy={busy}
        disabled={required && !value.trim()}
        onContinue={() => answer((b) => TEXT_SET[question.id]?.(b, value.trim() || null), { text: value.trim(), shared: question.kind !== "text" })}
      />
    </>
  );
}

function OccasionQuestion({ brief, answer, skip, back, busy }: QuestionContext) {
  const known = OCCASIONS.find((option) => option.label === brief.shared.occasion);
  const [value, setValue] = React.useState<string | null>(known?.id || (brief.shared.occasion ? "custom" : null));
  const [custom, setCustom] = React.useState(known ? "" : brief.shared.occasion || "");
  const label = value === "custom" ? custom.trim() : OCCASIONS.find((o) => o.id === value)?.label || "";
  return (
    <>
      <ChoiceGroup label="Occasion" value={value} onChange={setValue} options={OCCASIONS} />
      {value === "custom" && (
        <TextField id="bmcq-occasion-custom" label="Your occasion" hideLabel value={custom} onChange={setCustom} placeholder="Retirement, new home, first day of school…" maxLength={60} autoFocus />
      )}
      <Actions onBack={back} onSkip={skip} busy={busy} disabled={!label} onContinue={() => answer((b) => { b.shared.occasion = label; }, { shared: true })} />
    </>
  );
}

function PeopleQuestion({ brief, answer, skip, back, busy }: QuestionContext) {
  const [recipient, setRecipient] = React.useState(brief.shared.recipientName || "");
  const [relationship, setRelationship] = React.useState(brief.shared.relationship || "");
  const [sender, setSender] = React.useState(brief.shared.senderName || "");
  const [pronunciation, setPronunciation] = React.useState(brief.song.pronunciation || "");
  return (
    <>
      <div className="bmcq-grid-people">
        <TextField id="bmcq-recipient" label="Their name" value={recipient} onChange={setRecipient} placeholder="Maya" maxLength={60} />
        <TextField id="bmcq-pronunciation" label="How to say their name (optional)" value={pronunciation} onChange={setPronunciation} placeholder="MY-uh" maxLength={80}
          hint="For the singer only. Never printed." />
        <TextField id="bmcq-relationship" label="Who they are to you" value={relationship} onChange={setRelationship} placeholder="My sister" maxLength={60} />
        <TextField id="bmcq-sender" label="Your name" value={sender} onChange={setSender} placeholder="Cam" maxLength={60} />
      </div>
      <Actions onBack={back} onSkip={skip} busy={busy} onContinue={() => answer((b) => {
        b.shared.recipientName = recipient.trim() || null;
        b.shared.relationship = relationship.trim() || null;
        b.shared.senderName = sender.trim() || null;
        b.song.pronunciation = pronunciation.trim() || null;
      }, { shared: true })} />
    </>
  );
}

function OrientationQuestion({ brief, answer, back, busy }: QuestionContext) {
  // Portrait starts chosen: the usual card, free and easy to change (owner, 2026-11-09, audit §8 D9).
  const [value, setValue] = React.useState(brief.image.orientation || "portrait");
  return (
    <>
      <ChoiceGroup label="Card shape" columns="tiles" value={value} onChange={setValue}
        options={[{ id: "portrait", label: "Portrait", sub: "5 × 7, stands tall" }, { id: "landscape", label: "Landscape", sub: "7 × 5, lies wide" }]}
        render={(option) => (
          <span className="bmcq-shape-option">
            <span className="bmcq-shape-frame"><CardPlaceholder shape={option.id === "landscape" ? "landscape" : "portrait"} /></span>
            <span className="bmcq-option-label">{option.label}</span>
            <span className="bmcq-option-sub">{option.sub}</span>
          </span>
        )}
      />
      <Actions onBack={back} busy={busy} disabled={!value} onContinue={() => answer((b) => { b.image.orientation = value; })} />
    </>
  );
}

// ---- Image ---------------------------------------------------------------------

function ModeQuestion({ brief, answer, back, busy, services }: QuestionContext) {
  const photo = hasPhoto(brief);
  const community = useBmcCommunity();
  const [value, setValue] = React.useState<ImageMode | null>(brief.image.mode);
  return (
    <>
      <ChoiceGroup label="Blueprint" columns="cards" value={value} onChange={setValue}
        options={IMAGE_MODES.map((mode) => ({
          id: mode.id, label: mode.label, sub: mode.sub, badge: mode.popular ? "Most popular" : undefined,
          disabled: mode.needsPhoto && !photo, note: mode.needsPhoto && !photo ? "Needs a photo" : undefined,
        }))}
        render={(option) => {
          const mode = IMAGE_MODES.find((m) => m.id === option.id);
          return (
            <span className="bmcq-option-text bmcq-blueprint-option">
              {mode?.popular && <span className="bmcq-badge">Most popular</span>}
              <span className="bmcq-option-label">{option.label}</span>
              <span className="bmcq-option-sub">{option.sub}</span>
              {mode?.needsPhoto && !photo && <span className="bmcq-option-note">Needs a photo</span>}
              {/* A visual example of each blueprint goes here (owner, 2026-11-08); the logo holds its place. */}
              <span className="bmcq-blueprint-example"><CardPlaceholder /></span>
            </span>
          );
        }}
      />
      {!photo && community && <p className="bmcq-hint">Enhance and Decorate work from a photo, so they aren&apos;t used for Community cards.</p>}
      {!photo && !community && (
        <p className="bmcq-hint">Enhance and Decorate work from a photo. <button type="button" className="bmcq-link is-inline" onClick={() => services.edit("P1_photo")}>Add a photo</button></p>
      )}
      <Actions onBack={back} busy={busy} disabled={!value} onContinue={() => answer((b) => { b.image.mode = value; b.control.conflicts = b.control.conflicts.filter((c) => c.field !== "image.mode"); })} />
    </>
  );
}

function StyleQuestion({ brief, answer, back, busy }: QuestionContext) {
  const [value, setValue] = React.useState(brief.image.style);
  const [custom, setCustom] = React.useState(brief.image.customStyle || "");
  const ready = Boolean(value && (value !== "custom" || custom.trim()));
  return (
    <>
      <ChoiceGroup label="Visual style" columns="chips" value={value} onChange={setValue} options={VISUAL_STYLES} />
      {value === "custom" && (
        <TextField id="bmcq-style-custom" label="Describe the style" hideLabel value={custom} onChange={setCustom} maxLength={200} autoFocus
          placeholder="Describe the style, e.g. soft pastel gouache" />
      )}
      <Actions onBack={back} busy={busy} disabled={!ready} onContinue={() => answer((b) => { b.image.style = value; b.image.customStyle = value === "custom" ? custom.trim() : null; })} />
    </>
  );
}

const FINISHES = [
  { id: "warm nostalgic light", label: "Warm and nostalgic" },
  { id: "cool dramatic light", label: "Cool and dramatic" },
  { id: "bright sunny light", label: "Bright and sunny" },
  { id: "soft dreamy light", label: "Soft and dreamy" },
  { id: "golden-hour glow", label: "Golden hour" },
  { id: "moody black and white", label: "Moody black and white" },
  { id: "rich saturated colour", label: "Rich, bold colour" },
  { id: "leave-it", label: "Leave the finish to us" },
  { id: CUSTOM_ID, label: "Custom" },
];

function RefineQuestion({ brief, answer, skip, back, busy }: QuestionContext) {
  const known = FINISHES.find((f) => f.id !== CUSTOM_ID && brief.image.refinement === f.id);
  const [value, setValue] = React.useState<string | null>(known?.id || (brief.image.refinement ? CUSTOM_ID : null));
  const [custom, setCustom] = React.useState(known ? "" : brief.image.refinement || "");
  const ready = Boolean(value && (value !== CUSTOM_ID || custom.trim()));
  return (
    <>
      <ChoiceGroup label="Finish" value={value} onChange={setValue} options={FINISHES} />
      {value === CUSTOM_ID && (
        <TextField id="bmcq-finish-custom" label="Describe the finish" hideLabel value={custom} onChange={setCustom} maxLength={200} autoFocus
          placeholder="Describe the finish, e.g. more golden, softer shadows" />
      )}
      <Actions onBack={back} onSkip={skip} busy={busy} disabled={!ready} onContinue={() => answer((b) => {
        b.image.refinement = value === CUSTOM_ID ? custom.trim() : value === "leave-it" ? "the finish left to Souvenote" : value;
      }, { text: value === CUSTOM_ID ? custom.trim() : "" })} />
    </>
  );
}

const DECORATE_WANTS = [
  { id: "accents", label: "Accents around the photo" },
  { id: "border", label: "A border" },
  { id: "wearables", label: "Something to wear" },
  { id: "stickers", label: "Stickers and doodles" },
  { id: "pattern", label: "Background pattern" },
  { id: "sparkle", label: "Sparkle and glow" },
  { id: "lettering", label: "Names and dates" },
  { id: "caption", label: "Just a caption" },
  { id: "own-words", label: "Describe in my own words" },
];

function DecorateWhatQuestion({ brief, answer, back, busy, question }: QuestionContext) {
  const [values, setValues] = React.useState(brief.image.decorations.wants);
  // "Just a caption" stands alone: picking it clears the rest, and vice versa.
  const onChange = (next: string[]) => {
    const added = next.find((id) => !values.includes(id));
    setValues(added === "caption" ? ["caption"] : next.filter((id) => id !== "caption"));
  };
  return (
    <>
      <ToggleChips label={question.heading.join(" ")} options={DECORATE_WANTS} values={values} onChange={onChange} />
      <Actions onBack={back} busy={busy} disabled={!values.length} onContinue={() => answer((b) => {
        b.image.decorations.wants = values;
        if (!values.includes("accents")) b.image.decorations.accents = [];
        if (!values.includes("wearables")) b.image.decorations.wearables = [];
        if (!values.includes("border")) b.image.decorations.border = { style: null, colour: null, customColour: null, customStyle: null };
        if (!values.includes("own-words")) b.image.decorations.customText = null;
        if (!values.includes("stickers")) { b.image.decorations.stickers = []; b.image.decorations.customSticker = null; }
        if (!values.includes("pattern")) { b.image.decorations.pattern = null; b.image.decorations.customPattern = null; }
        if (!values.includes("sparkle")) { b.image.decorations.sparkle = null; b.image.decorations.customSparkle = null; }
        if (!values.includes("lettering")) b.image.decorations.lettering = null;
      })} />
    </>
  );
}

function AccentsQuestion({ brief, answer, back, busy }: QuestionContext) {
  const [values, setValues] = React.useState(brief.image.decorations.accents);
  const [customAccent, setCustomAccent] = React.useState(brief.image.decorations.customAccent || "");
  const occasion = brief.shared.occasion || "";
  const groups = [...ACCENT_GROUPS].sort((a, b) => Number(b.occasions.includes(occasion)) - Number(a.occasions.includes(occasion)));
  const [open, setOpen] = React.useState<string>(groups[0].id);
  const types = new Set(ACCENT_GROUPS.filter((group) => group.items.some((item) => values.includes(item.id))).map((group) => group.id));
  return (
    <>
      <div className="bmcq-groups">
        {groups.map((group) => {
          const expanded = open === group.id;
          const count = group.items.filter((item) => values.includes(item.id)).length;
          return (
            <div key={group.id} className={`bmcq-group${expanded ? " is-open" : ""}`}>
              <button type="button" className="bmcq-group-head" aria-expanded={expanded} aria-controls={`bmcq-group-${group.id}`} onClick={() => setOpen(expanded ? "" : group.id)}>
                <span>{group.label}</span>
                {count > 0 && <span className="bmcq-group-count">{count} chosen</span>}
                <Icon name={expanded ? "close" : "plus"} size={14} />
              </button>
              <div id={`bmcq-group-${group.id}`} hidden={!expanded} className="bmcq-group-body">
                <ToggleChips label={group.label} options={group.items} values={values} onChange={setValues} />
              </div>
            </div>
          );
        })}
        <button type="button" aria-pressed={values.includes(CUSTOM_ID)}
          className={`bmcq-chip is-custom bmcq-group-custom${values.includes(CUSTOM_ID) ? " is-selected" : ""}`}
          onClick={() => setValues((all) => (all.includes(CUSTOM_ID) ? all.filter((id) => id !== CUSTOM_ID) : [...all, CUSTOM_ID]))}>
          Custom
        </button>
      </div>
      {values.includes(CUSTOM_ID) && (
        <TextField id="bmcq-accent-custom" label="Describe your custom accents" hideLabel value={customAccent} onChange={setCustomAccent} maxLength={200} autoFocus
          placeholder="Describe your custom accents, for example tiny paper airplanes" />
      )}
      {types.size > SUGGESTED_ACCENT_TYPES && <p className="bmcq-hint">That’s {types.size} kinds of accent. Two or three usually look cleanest, but it’s your call.</p>}
      <Actions onBack={back} busy={busy} disabled={!values.length || (values.includes(CUSTOM_ID) && !customAccent.trim())}
        onContinue={() => answer((b) => { b.image.decorations.accents = values; b.image.decorations.customAccent = values.includes(CUSTOM_ID) ? customAccent.trim() : null; }, { text: values.includes(CUSTOM_ID) ? customAccent.trim() : "" })} />
    </>
  );
}

function WearablesQuestion({ brief, answer, back, busy }: QuestionContext) {
  const [values, setValues] = React.useState(brief.image.decorations.wearables.map((w) => w.id));
  const [customLabel, setCustomLabel] = React.useState(brief.image.decorations.wearables.find((w) => w.id === CUSTOM_ID)?.label || "");
  const needsLabel = values.includes(CUSTOM_ID) && !customLabel.trim();
  return (
    <>
      <ToggleChips label="Accessories" options={[...WEARABLES, { id: CUSTOM_ID, label: "Custom" }]} values={values} onChange={setValues} />
      {values.includes(CUSTOM_ID) && (
        <TextField id="bmcq-wearable-custom" label="Describe the accessory" hideLabel value={customLabel} onChange={setCustomLabel} maxLength={80} autoFocus
          placeholder="Describe the accessory, e.g. a pirate hat" />
      )}
      <p className="bmcq-hint">We only add the accessory. Faces, expressions and outfits stay exactly as they are.</p>
      <Actions onBack={back} busy={busy} disabled={!values.length || needsLabel} onContinue={() => answer((b) => {
        const existing = new Map(b.image.decorations.wearables.map((w) => [w.id, w.target]));
        b.image.decorations.wearables = values.map((id) => ({ id, target: existing.get(id) || "", ...(id === CUSTOM_ID ? { label: customLabel.trim() } : {}) }));
      }, { text: values.includes(CUSTOM_ID) ? customLabel.trim() : "" })} />
    </>
  );
}

const WEARERS = [
  { id: "the only person or pet in the photo", label: "The only person or pet in the photo" },
  { id: "the person on the left", label: "Person on the left" },
  { id: "the person in the middle", label: "Person in the middle" },
  { id: "the person on the right", label: "Person on the right" },
  { id: "the pet", label: "The pet" },
  { id: "other", label: "Someone else" },
];

function WearerQuestion({ brief, answer, back, busy }: QuestionContext) {
  const [targets, setTargets] = React.useState<Record<string, string>>(
    Object.fromEntries(brief.image.decorations.wearables.map((w) => [w.id, WEARERS.some((o) => o.id === w.target) ? w.target : w.target ? "other" : ""])),
  );
  const [others, setOthers] = React.useState<Record<string, string>>(
    Object.fromEntries(brief.image.decorations.wearables.filter((w) => w.target && !WEARERS.some((o) => o.id === w.target)).map((w) => [w.id, w.target])),
  );
  const wearables = brief.image.decorations.wearables;
  const resolved = wearables.map((w) => ({ id: w.id, target: targets[w.id] === "other" ? (others[w.id] || "").trim() : targets[w.id] || "" }));
  const conflicts = resolveDecorations({ ...brief, image: { ...brief.image, decorations: { ...brief.image.decorations, wearables: resolved } } }).conflicts;
  // Phones: one accessory per screen. Desktop: one compact row per accessory.
  const sections = useSections(wearables.length);
  const current = resolved[sections.index];
  const setTarget = (id: string, value: string) => setTargets((t) => ({ ...t, [id]: value }));
  return (
    <>
      {sections.phone && <SectionAnnounce index={sections.index} count={wearables.length} label={`Who wears the ${wearableName(wearables[sections.index]).toLowerCase()}?`} />}
      <div className={sections.phone ? "" : "bmcq-wearer-rows"}>
        {wearables.map((w, index) => sections.shows(index) && (
          <div key={w.id} className={sections.phone ? "bmcq-subq" : "bmcq-wearer-row"}>
            {sections.phone ? (
              <>
                <p className="bmcq-subq-title">Who wears the {wearableName(w).toLowerCase()}?</p>
                <ChoiceGroup label={`Who wears the ${wearableName(w)}`} value={targets[w.id] || null} onChange={(id) => setTarget(w.id, id)} options={WEARERS} />
              </>
            ) : (
              <>
                <label className="bmcq-label" htmlFor={`bmcq-wearer-select-${w.id}`}>{wearableName(w)}</label>
                <select id={`bmcq-wearer-select-${w.id}`} className="bmcq-input is-select" value={targets[w.id] || ""} onChange={(event) => setTarget(w.id, event.target.value)}>
                  <option value="" disabled>Choose who wears it</option>
                  {WEARERS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </>
            )}
            {targets[w.id] === "other" && (
              <TextField id={`bmcq-wearer-${w.id}`} label="Describe who" hideLabel={!sections.phone} value={others[w.id] || ""} onChange={(v) => setOthers((o) => ({ ...o, [w.id]: v }))}
                placeholder="The person in the blue jacket" maxLength={80} />
            )}
          </div>
        ))}
      </div>
      {sections.isLast && conflicts.map((conflict) => <p key={conflict} className="bmcq-conflict-inline" role="alert">{conflict}</p>)}
      <Actions
        onBack={sections.first ? back : sections.prev}
        busy={busy}
        disabled={sections.isLast ? resolved.some((w) => !w.target) || conflicts.length > 0 : !current?.target}
        continueLabel={sections.isLast ? "Continue" : "Next accessory"}
        onContinue={sections.isLast ? () => answer((b) => { b.image.decorations.wearables = resolved; }) : sections.next}
      />
    </>
  );
}

/** Stickers and doodles: up to three, with Custom. */
function StickersQuestion({ brief, answer, back, busy }: QuestionContext) {
  const deco = brief.image.decorations;
  const [values, setValues] = React.useState(deco.stickers);
  const [custom, setCustom] = React.useState(deco.customSticker || "");
  return (
    <>
      <ToggleChips label="Stickers and doodles, up to three" options={STICKERS} values={values} onChange={setValues} max={3} />
      <Counter value={values.length} max={3} label="chosen" />
      {values.includes(CUSTOM_ID) && (
        <TextField id="bmcq-sticker-custom" label="Describe your stickers" hideLabel value={custom} onChange={setCustom} maxLength={80}
          placeholder="Describe your stickers, e.g. tiny teapots" autoFocus />
      )}
      <Actions onBack={back} busy={busy} disabled={!values.length || (values.includes(CUSTOM_ID) && !custom.trim())} onContinue={() => answer((b) => {
        b.image.decorations.stickers = values;
        b.image.decorations.customSticker = values.includes(CUSTOM_ID) ? custom.trim() : null;
      }, { text: values.includes(CUSTOM_ID) ? custom.trim() : "" })} />
    </>
  );
}

/** One choice from a list, with Custom opening a text field (background pattern, sparkle and glow). */
function PickOneQuestion({ brief, answer, back, busy, options, label, read, write, customLabel, customPlaceholder }: QuestionContext & {
  options: { id: string; label: string }[]; label: string;
  read: (b: Brief) => [string | null, string | null];
  write: (b: Brief, id: string | null, custom: string | null) => void;
  customLabel: string; customPlaceholder: string;
}) {
  const [initialId, initialCustom] = read(brief);
  const [value, setValue] = React.useState(initialId);
  const [custom, setCustom] = React.useState(initialCustom || "");
  return (
    <>
      <ChoiceGroup label={label} value={value} onChange={setValue} options={options} />
      {value === CUSTOM_ID && (
        <TextField id={`bmcq-${label.toLowerCase().replace(/\s+/g, "-")}-custom`} label={customLabel} hideLabel value={custom} onChange={setCustom} maxLength={120}
          placeholder={customPlaceholder} autoFocus />
      )}
      <Actions onBack={back} busy={busy} disabled={!value || (value === CUSTOM_ID && !custom.trim())} onContinue={() => answer((b) => {
        write(b, value, value === CUSTOM_ID ? custom.trim() : null);
      }, { text: value === CUSTOM_ID ? custom.trim() : "" })} />
    </>
  );
}

function BorderQuestion({ brief, answer, back, busy }: QuestionContext) {
  const [value, setValue] = React.useState(brief.image.decorations.border.style);
  const [custom, setCustom] = React.useState(brief.image.decorations.border.customStyle || "");
  return (
    <>
      <ChoiceGroup label="Border style" value={value} onChange={setValue} options={[...BORDER_STYLES, { id: CUSTOM_ID, label: "Custom" }]} />
      {value === CUSTOM_ID && (
        <TextField id="bmcq-border-custom" label="Describe the border" hideLabel value={custom} onChange={setCustom} maxLength={160} autoFocus
          placeholder="Describe the border, e.g. an ink frame with leaves" />
      )}
      <Actions onBack={back} busy={busy} disabled={!value || (value === CUSTOM_ID && !custom.trim())} onContinue={() => answer((b) => {
        b.image.decorations.border.style = value;
        b.image.decorations.border.customStyle = value === CUSTOM_ID ? custom.trim() : null;
        if (value === "no-border") b.image.decorations.border = { style: value, colour: null, customColour: null, customStyle: null };
      }, { text: value === CUSTOM_ID ? custom.trim() : "" })} />
    </>
  );
}

function BorderColourQuestion({ brief, answer, back, busy }: QuestionContext) {
  const [value, setValue] = React.useState(brief.image.decorations.border.colour || "automatic");
  const [custom, setCustom] = React.useState(brief.image.decorations.border.customColour || "#9E3D58");
  const validHex = /^#[0-9a-f]{6}$/i.test(custom);
  return (
    <>
      <ChoiceGroup label="Border colour" value={value} onChange={setValue} options={BORDER_COLOURS} />
      {value === "custom-colour" && (
        <div className="bmcq-colour">
          <label className="bmcq-label" htmlFor="bmcq-colour-picker">Custom colour</label>
          <div className="bmcq-colour-row">
            <input id="bmcq-colour-picker" type="color" value={validHex ? custom : "#9e3d58"} onChange={(event) => setCustom(event.target.value)} />
            <input aria-label="Hex value" className="bmcq-input is-hex" value={custom} maxLength={7} onChange={(event) => setCustom(event.target.value)} />
          </div>
          {!validHex && <div className="bmcq-error" role="alert">Use a hex value like #9E3D58.</div>}
        </div>
      )}
      {value !== "custom-colour" && <p className="bmcq-hint">Automatic picks a readable colour from your photo. Metallic colours are a printed look, not real foil.</p>}
      <Actions onBack={back} busy={busy} disabled={value === "custom-colour" && !validHex} onContinue={() => answer((b) => {
        b.image.decorations.border.colour = value;
        b.image.decorations.border.customColour = value === "custom-colour" ? custom.toUpperCase() : null;
      })} />
    </>
  );
}

function VibesQuestion({ brief, answer, skip, back, busy }: QuestionContext) {
  const [values, setValues] = React.useState(brief.shared.vibes);
  const [custom, setCustom] = React.useState(brief.shared.customVibe || "");
  return (
    <>
      <ToggleChips label="Vibe, up to three" options={VIBES} values={values} onChange={setValues} max={MAX_VIBES} />
      <Counter value={values.length} max={MAX_VIBES} label="chosen" />
      {values.includes("custom") && (
        <TextField id="bmcq-vibe-custom" label="Your vibe" hideLabel value={custom} onChange={setCustom} maxLength={60} placeholder="Your vibe, e.g. cosy and nostalgic" autoFocus />
      )}
      <Actions onBack={back} onSkip={skip} busy={busy} disabled={!values.length || (values.includes("custom") && !custom.trim())}
        onContinue={() => answer((b) => { b.shared.vibes = values; b.shared.customVibe = values.includes("custom") ? custom.trim() : null; }, { shared: true })} />
    </>
  );
}

export function CaptionQuestion({ brief, answer, back, busy, services }: SharedQuestionProps) {
  const caption = brief.image.caption;
  const [choice, setChoice] = React.useState(caption.choice);
  const [text, setText] = React.useState(caption.text);
  const [suggesting, setSuggesting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const used = caption.drafts.length;
  const left = Math.max(0, LIMITS.textRegenerations + 1 - used);

  const suggest = async () => {
    setSuggesting(true);
    setError(null);
    try {
      const suggestion = await services.suggestCaption();
      if (suggestion) setText(suggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "A caption couldn't be suggested. Try again.");
    } finally {
      setSuggesting(false);
    }
  };

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return (
    <>
      <ChoiceGroup label="Caption" columns="cards" value={choice} onChange={(id) => { setChoice(id); setError(null); }} options={[
        { id: "exact", label: "Write my caption", sub: "Type the exact words to print." },
        { id: "generator", label: "Suggest one for me", sub: "We'll offer wording you can edit." },
        { id: "none", label: "No caption", sub: "Artwork only, no words on the front." },
      ]} />
      {choice === "exact" && (
        <TextField id="bmcq-caption" label="Exact words to print on the front" value={text} onChange={setText} maxLength={80}
          placeholder="Happy Birthday, Maya" hint="Printed exactly as typed, including punctuation." autoFocus />
      )}
      {choice === "generator" && (
        <div className="bmcq-ai-block">
          <BusyAnnounce busy={suggesting} busyText="Finding the right words…" doneText={error || !text ? "" : `Caption suggested: ${text}`} />
          {suggesting ? <Thinking label="Finding the right words…" announce={false} />
            : text && <TextField id="bmcq-caption-ai" label="Suggested caption (edit if you like)" value={text} onChange={setText} maxLength={80} />}
          {/* The button stays on screen while it works (aria-disabled, 2.28), so focus never falls to <body>. */}
          <div className="bmcq-inline-actions">
            <button type="button" className="bmcq-btn is-ai is-small" onClick={() => { if (!suggesting && left > 0) void suggest(); }}
              aria-disabled={suggesting || left <= 0 || undefined}>
              <Icon name="sparkle" size={14} /> {used ? "Suggest another" : "Suggest a caption"}
            </button>
            <span className="bmcq-hint">{used ? `${Math.max(0, left)} more suggestions left` : "First suggestion, then up to 5 more"}</span>
          </div>
          {error && <div className="bmcq-error" role="alert">{error}</div>}
        </div>
      )}
      {choice !== "none" && words > LIMITS.captionTargetWords[1] && <p className="bmcq-hint">Short captions read best on a card. Two to eight words is ideal.</p>}
      <Actions onBack={back} busy={busy || suggesting} disabled={!choice || (choice !== "none" && !text.trim())}
        continueLabel={choice === "generator" ? "Use this caption" : "Continue"}
        onContinue={() => answer((b) => {
          b.image.caption.choice = choice;
          b.image.caption.text = choice === "none" ? "" : text.trim();
          b.image.caption.origin = choice === "generator" && caption.drafts.includes(text.trim()) ? "generated" : choice === "none" ? null : "user";
        })} />
    </>
  );
}

function ImageSummaryQuestion({ brief, answer, back, busy, services }: QuestionContext) {
  const rows = imageSummary(brief);
  const decorateEmpty = brief.image.mode === "decorate" && !decorateHasSomething(brief);
  const conflicts = brief.image.mode === "decorate" ? resolveDecorations(brief).conflicts : [];
  return (
    <>
      <dl className="bmcq-summary-list">
        {rows.map((row) => (
          <div key={row.label} className="bmcq-summary-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
            <button type="button" className="bmcq-link is-inline" onClick={() => services.edit(row.questionId)} aria-label={`Change ${row.label.toLowerCase()}`}>Change</button>
          </div>
        ))}
      </dl>
      {decorateEmpty && <p className="bmcq-conflict-inline" role="alert">Decorate needs at least one addition or a caption. Add accents, a border or a caption.</p>}
      {conflicts.map((conflict) => <p key={conflict} className="bmcq-conflict-inline" role="alert">{conflict}</p>)}
      <Actions onBack={back} busy={busy} disabled={decorateEmpty || conflicts.length > 0} continueLabel="Looks right" onContinue={() => answer((b) => { b.image.briefConfirmed = true; })} />
    </>
  );
}

// ---- Redraft note ("What should change?") ------------------------------------------
// Owner approved 2026-11-08 (REDRAFT-STEERING-PROPOSAL.md): one optional quick pick
// plus a few words, sent with the next redraft only, then cleared.

const MESSAGE_PICKS = ["Warmer", "Funnier", "Shorter", "Simpler"];
const LYRIC_PICKS = ["More upbeat", "Gentler", "Simpler words", "Funnier"];

function isGentle(brief: Brief) {
  return Boolean(brief.shared.occasion && GENTLE_OCCASIONS.has(brief.shared.occasion));
}

type Direction = { pick: string | null; setPick: (pick: string | null) => void; text: string; setText: (text: string) => void; value: string | null; clear: () => void };

function useDirection(): Direction {
  const [pick, setPick] = React.useState<string | null>(null);
  const [text, setText] = React.useState("");
  return {
    pick, setPick, text, setText,
    value: cleanDirection([pick, text.trim()].filter(Boolean).join(". ")),
    clear: () => { setPick(null); setText(""); },
  };
}

function DirectionField({ id, steer, picks, gentle, placeholder, action, children }: {
  id: string; steer: Direction; picks: string[]; gentle: boolean; placeholder: string; action: string;
  /** Extra controls on the same row (the message's sign-off select, owner 2026-11-09). */
  children?: React.ReactNode;
}) {
  // Funnier never shows for Sympathy, Get Well, Thinking of You or Apology.
  const shown = picks.filter((pick) => !(gentle && pick === "Funnier"));
  const room = USER_DIRECTION_MAX_CHARS - (steer.pick ? steer.pick.length + 2 : 0);
  return (
    <div className="bmcq-direction">
      <p className="bmcq-hint" id={`${id}-label`}>What should change? Optional: pick one, add a few words, then {action}.</p>
      <div role="group" aria-labelledby={`${id}-label`} className="bmcq-options is-chips">
        {shown.map((pick) => (
          <button key={pick} type="button" className={`bmcq-option${steer.pick === pick ? " is-selected" : ""}`} aria-pressed={steer.pick === pick}
            onClick={() => steer.setPick(steer.pick === pick ? null : pick)}>
            <span className="bmcq-option-text"><span className="bmcq-option-label">{pick}</span></span>
            {steer.pick === pick && <span className="bmcq-option-tick" aria-hidden="true"><Icon name="check" size={14} /></span>}
          </button>
        ))}
      </div>
      <TextField id={id} label="Anything else to change (optional)" hideLabel value={steer.text.slice(0, room)} onChange={steer.setText}
        maxLength={room} placeholder={placeholder} />
      {children}
    </div>
  );
}

// ---- Message ---------------------------------------------------------------------

export function MessageQuestion({ brief, answer, back, busy, services }: SharedQuestionProps) {
  const message = brief.message;
  const [blank, setBlank] = React.useState(message.mode === "blank");
  const [mine, setMine] = React.useState(message.userVersion?.text || "");
  const [ai, setAi] = React.useState(message.aiVersion?.text || "");
  // Which box is on screen: the customer's own message, or the AI writer.
  const [view, setView] = React.useState<"mine" | "ai">(message.printedChoice === "ai" && message.aiVersion ? "ai" : "mine");
  const [drafting, setDrafting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);
  const aiText = message.aiVersion?.text || "";
  const sender = brief.shared.senderName?.trim() || null;
  const stale = isAiMessageStale(brief);
  const aiUsed = message.aiVersion ? message.aiVersion.drafts.length : 0;
  const aiLeft = Math.max(0, LIMITS.aiMessageDrafts - aiUsed);

  // A fresh AI draft only ever fills the AI box, never the customer's own words.
  React.useEffect(() => { setAi(aiText); }, [aiText]);

  // The redraft note (owner approved 2026-11-08): steers the next AI draft only, then clears.
  const steer = useDirection();
  // The AI box is 4 rows on desktop and 6 on phones, and grows with its text (owner, 2026-11-09, audit §8 D1).
  const phone = useIsPhone();
  // Busy is aria-disabled, not disabled, so a focused AI writer keeps focus (2.28);
  // after "Refresh it" (swapped out while drafting) focus comes back to the AI writer.
  const writerRef = React.useRef<HTMLButtonElement>(null);
  useRefocusAfterBusy(drafting, writerRef);

  const runDraft = async (direction: string | null = null) => {
    if (drafting) return;
    setDrafting(true);
    setError(null);
    try {
      await services.draftAiMessage(direction);
      if (direction) steer.clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The message couldn’t be drafted. Try again.");
    } finally {
      setDrafting(false);
    }
  };

  const openAiWriter = () => {
    const showingAi = !blank && view === "ai";
    setBlank(false);
    setView("ai");
    setSubmitted(false);
    // Switching back to an AI draft you already have keeps it (and any edits); another press writes a new one.
    if (aiLeft > 0 && (showingAi || !ai.trim())) void runDraft(showingAi && ai.trim() ? steer.value : null);
  };
  const writeMine = () => { setBlank(false); setView("mine"); setSubmitted(false); };

  // Sign-off for AI drafts (2026-11-08): one select, on the "What should change?" row once a
  // draft exists, so the AI writer box fits one screen (owner, 2026-11-09, audit §8 D1).
  const signoff = sender ? (
    // The hint sits outside the label so it's read once, as the description (Prompt 2 flows A-F6).
    <span className="bmcq-signoff">
      <label className="bmcq-signoff-label" htmlFor="bmcq-signoff-select">Sign-off</label>
      <select id="bmcq-signoff-select" className="bmcq-input is-select" value={message.signoff || "auto"} aria-describedby={ai.trim() ? "bmcq-signoff-hint" : undefined}
        onChange={(event) => { const value = event.target.value as SignoffStyle; services.update((b) => { b.message.signoff = value; }); }}>
        <option value="auto">Writer’s choice</option>
        <option value="love">{`Love, ${sender}`}</option>
        <option value="from">{`From ${sender}`}</option>
        <option value="none">No sign-off</option>
      </select>
      {ai.trim() && <span id="bmcq-signoff-hint" className="l-sr-only">Used from the next AI draft. You can also edit the text.</span>}
    </span>
  ) : null;

  // The view on screen at Continue is the one that prints (owner decision 2026-11-07).
  const printed: "user" | "ai" = view === "ai" ? "ai" : "user";
  const chosenText = printed === "ai" ? ai : mine;
  const validation = blank ? null : validateMessage(chosenText);

  const submit = () => {
    setSubmitted(true);
    if (validation) return;
    answer((b) => {
      b.message.mode = blank ? "blank" : "text";
      const prevUser = b.message.userVersion;
      b.message.userVersion = mine.trim() ? { text: mine, version: (prevUser?.version || 0) + (prevUser?.text === mine ? 0 : 1) } : null;
      if (b.message.aiVersion && ai !== b.message.aiVersion.text) b.message.aiVersion = { ...b.message.aiVersion, text: ai, version: b.message.aiVersion.version + 1 };
      b.message.printedChoice = printed;
    });
  };

  return (
    <>
      <div className="bmcq-msg-top">
        {/* "Write a message" brings back the customer's own words; the AI writer stays the AI writer (owner, 2026-11-08). */}
        <div role="group" aria-label="Inside message" className="bmcq-options is-chips">
          <button type="button" className={`bmcq-option${!blank && view === "mine" ? " is-selected" : ""}`} aria-pressed={!blank && view === "mine"} onClick={writeMine}>
            <span className="bmcq-option-text"><span className="bmcq-option-label">Write a message</span></span>
            {!blank && view === "mine" && <span className="bmcq-option-tick" aria-hidden="true"><Icon name="check" size={14} /></span>}
          </button>
          <button type="button" className={`bmcq-option${blank ? " is-selected" : ""}`} aria-pressed={blank} onClick={() => setBlank(true)}>
            <span className="bmcq-option-text"><span className="bmcq-option-label">Leave the inside blank</span></span>
            {blank && <span className="bmcq-option-tick" aria-hidden="true"><Icon name="check" size={14} /></span>}
          </button>
        </div>
        <button ref={writerRef} type="button" className={`bmcq-btn is-ai bmcq-writer-switch${!blank && view === "ai" ? " is-on" : ""}`} onClick={drafting ? undefined : openAiWriter}
          aria-controls="bmcq-message-box" aria-pressed={!blank && view === "ai"}
          // Out of tries stays focusable too: the last draft must not drop focus to <body>.
          aria-disabled={drafting || (aiLeft <= 0 && view === "ai" && !blank) || undefined}
          aria-label={`AI writer, ${aiLeft} of ${LIMITS.aiMessageDrafts} tries left`}>
          <Icon name="sparkle" size={16} /> AI writer <span className="bmcq-writer-left">{aiLeft} left</span>
        </button>
      </div>

      {blank ? (
        <p className="bmcq-hint">Nothing will be printed inside.{brief.song.mode && brief.song.mode !== "none" ? " Your song’s QR code still goes inside." : " If you add a song, its QR code still goes inside."}</p>
      ) : view === "mine" ? (
        <section id="bmcq-message-box" className="bmcq-message-box" aria-label="Your message">
          {!blank && mine.trim() && ai.trim() && <span className="bmcq-chosen bmcq-will-print"><Icon name="check" size={14} /> This one will print</span>}
          <TextField id="bmcq-message-mine" label="Your message" hideLabel multiline rows={6} value={mine} onChange={setMine} maxLength={600}
            placeholder="Write it just as you’d say it."
            error={submitted ? validation : null}
            hint={<><Counter value={mine.length} max={LIMITS.messageMaxChars} label="characters" /> · printed exactly as you type it</>}
          />
        </section>
      ) : (
        <section id="bmcq-message-box" className="bmcq-message-box is-ai" aria-label="AI writer" aria-busy={drafting || undefined}>
          <div className="bmcq-message-box-head">
            <p className="bmcq-message-box-title"><Icon name="sparkle" size={16} /> Written for you. Edit anything you like.</p>
            {!blank && mine.trim() && ai.trim() && <span className="bmcq-chosen bmcq-will-print"><Icon name="check" size={14} /> This one will print</span>}
          </div>
          <BusyAnnounce busy={drafting} busyText="Writing your message…" doneText={error || !ai.trim() ? "" : "New draft ready in the AI-written message box."} />
          {drafting ? <Thinking label="Writing your message…" announce={false} /> : (
            <>
              {stale && <p className="bmcq-stale" role="status">Your earlier answers changed since this was written. <button type="button" className="bmcq-link is-inline" onClick={() => runDraft()} disabled={aiLeft <= 0}>Refresh it</button></p>}
              <TextField id="bmcq-message-ai" label="AI-written message" hideLabel multiline rows={phone ? 6 : 4} value={ai} onChange={setAi} maxLength={600}
                error={submitted ? validation : null}
                hint={<Counter value={ai.length} max={LIMITS.messageMaxChars} label="characters" />} />
              {ai.trim() && aiLeft > 0 ? (
                <DirectionField id="bmcq-message-direction" steer={steer} picks={MESSAGE_PICKS} gentle={isGentle(brief)}
                  placeholder="Mention our trip to Lisbon" action="press AI writer for a new draft">
                  {signoff}
                </DirectionField>
              ) : signoff && <div className="bmcq-signoff-row">{signoff}</div>}
            </>
          )}
          {error && <div className="bmcq-error" role="alert">{error}</div>}
        </section>
      )}

      <Actions onBack={back} busy={busy || drafting} disabled={!blank && !chosenText.trim()} onContinue={submit} />
    </>
  );
}


// ---- Song --------------------------------------------------------------------------

function SongModeQuestion({ brief, answer, back, busy }: QuestionContext) {
  const [value, setValue] = React.useState<SongMode | null>(brief.song.mode);
  // Phones: choose the song, then see the QR code on its own screen (skipped for no song).
  const sections = useSections(value && value !== "none" ? 2 : 1);
  const submit = () => answer((b) => {
    b.song.mode = value;
    if (value === "none") { b.song.genrePresetId = null; }
    if (value !== "vocal") { b.song.approvedLyricsVersion = null; }
  });
  return (
    <div className="bmcq-song-mode">
      {sections.phone && value && value !== "none" && <SectionAnnounce index={sections.index} count={2} label={sections.index === 0 ? "Your song" : "Your QR code"} />}
      {sections.shows(0) && (
        <div>
          <ChoiceGroup label="Song" columns="cards" value={value} onChange={setValue} options={[
            { id: "vocal", label: "A sung song", sub: "Lyrics about them, sung in the style you pick. Adds 1 credit." },
            { id: "instrumental", label: "Instrumental", sub: "Music only, no singing. Adds 1 credit." },
            { id: "none", label: "No song", sub: "No QR code inside." },
          ]} />
        </div>
      )}
      {sections.shows(1) && (
        <div className="bmcq-qr-wrap">
          {sections.phone && <p className="bmcq-hint">This is printed inside your card. They scan it to play the song.</p>}
          <QrSongCode />
        </div>
      )}
      <Actions onBack={sections.first ? back : sections.prev} busy={busy} disabled={!value}
        continueLabel={sections.isLast ? "Continue" : "Next: your QR code"}
        onContinue={sections.isLast ? submit : sections.next} />
    </div>
  );
}

/**
 * "Choose the sound". Shared with Personalize (owner, 2026-11-08), which passes
 * `suggested` (the card's default genre and why) instead of loading recommendations,
 * and has it pre-selected until the customer picks.
 */
export function GenreQuestion({ brief, answer, back, busy, services, suggested }: SharedQuestionProps & { suggested?: { id: string; reason: string }[] }) {
  const phone = useIsPhone();
  const [value, setValue] = React.useState(brief.song.genrePresetId || (suggested?.[0]?.id ?? null));
  // Build My Card: the first "Suggested" genre starts chosen once the suggestions arrive (owner, 2026-11-09,
  // audit §8 D9). Never replaces a pick; if suggestions don't load, nothing is chosen.
  const firstSuggested = brief.song.recommendedGenreIds[0]?.id || null;
  React.useEffect(() => {
    if (!suggested && firstSuggested) setValue((current) => current || firstSuggested);
  }, [suggested, firstSuggested]);
  const [loading, setLoading] = React.useState(false);
  const recommended = new Map((suggested || brief.song.recommendedGenreIds).map((r) => [r.id, r.reason]));
  const hadLyrics = Boolean(brief.song.lyrics) && brief.song.genrePresetId && value !== brief.song.genrePresetId;

  React.useEffect(() => {
    if (suggested || brief.song.recommendedGenreIds.length) return;
    let cancelled = false;
    setLoading(true);
    services.loadRecommendations().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // Recommendations load once per visit when none are saved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {brief.song.legacyGenre && !value && (
        <p className="bmcq-stale" role="status">Your earlier pick, “{brief.song.legacyGenre}”, is no longer offered. Please choose one of the styles below.</p>
      )}
      {loading && <Thinking label="Finding styles that suit your card…" />}
      {recommended.size > 0 && <p className="bmcq-hint">Gold tiles are suggested for this card, with the reason why. The choice is yours.</p>}
      <ChoiceGroup label="Music style" columns="tiles" value={value} onChange={setValue}
        options={GENRE_PRESETS.map((preset) => ({ id: preset.id, label: preset.label, sub: preset.use }))}
        render={(option) => {
          const reason = recommended.get(option.id);
          return (
            <span className={`bmcq-option-text${reason ? " is-suggested" : ""}`}>
              <span className="bmcq-option-label">
                {reason && <Icon name="sparkle" size={13} />} {option.label}
                {reason && <span className="l-sr-only">, suggested</span>}
              </span>
              {reason && <span className="bmcq-option-note is-ai">{reason}</span>}
              {(!reason || phone) && <span className="bmcq-option-sub">{option.sub}</span>}
            </span>
          );
        }}
      />
      {hadLyrics && brief.song.mode === "vocal" && <p className="bmcq-hint">Changing the style changes the rhythm, so we’ll ask you to review the lyrics again.</p>}
      <Actions onBack={back} busy={busy} disabled={!value} onContinue={() => answer((b) => {
        if (b.song.genrePresetId && b.song.genrePresetId !== value) b.song.approvedLyricsVersion = null;
        b.song.genrePresetId = value;
        b.song.legacyGenre = null;
      })} />
    </>
  );
}

export function LyricsQuestion({ brief, answer, back, busy, services }: SharedQuestionProps) {
  const song = brief.song;
  const preset = genreById(song.genrePresetId);
  const [editing, setEditing] = React.useState(false);
  const [text, setText] = React.useState(song.lyrics);
  const [drafting, setDrafting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const locked = Boolean(brief.control.generation?.includeSong);
  const left = Math.max(0, LIMITS.textRegenerations - song.regenerationCount);
  const stale = drafting ? null : lyricsStaleReason(brief);

  React.useEffect(() => { setText(song.lyrics); }, [song.lyrics]);
  // Draft once when arriving with no lyrics (the ref keeps a double-run effect from drafting twice).
  const autoDrafted = React.useRef(false);
  React.useEffect(() => {
    if (song.lyrics || autoDrafted.current) return;
    autoDrafted.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The redraft note (owner approved 2026-11-08): steers the next rewrite only, then clears.
  const steer = useDirection();
  const canSteer = Boolean(song.lyrics) && left > 0 && !locked;

  // Rewrite stays focusable while it works (2.28); "Rewrite them" is swapped out, so focus returns to Rewrite.
  const rewriteRef = React.useRef<HTMLButtonElement>(null);
  useRefocusAfterBusy(drafting, rewriteRef);

  async function run(direction: string | null = null) {
    if (drafting) return;
    setDrafting(true);
    setError(null);
    try { await services.draftLyrics(direction); if (direction) steer.clear(); } catch (err) { setError(err instanceof Error ? err.message : "Lyrics couldn't be drafted. Try again."); } finally { setDrafting(false); }
  }

  const validation = validateLyrics(text);
  const words = wordCount(text);
  const approved = song.approvedLyricsVersion !== null && song.approvedLyricsVersion === song.lyricsVersion && text === song.lyrics;

  return (
    <>
      <section className="bmcq-version is-ai" aria-busy={drafting || undefined} aria-labelledby="bmcq-lyrics-title">
        <header className="bmcq-version-head">
          <h3 id="bmcq-lyrics-title"><Icon name="note" size={16} /> {preset ? `${preset.label} lyrics` : "Lyrics"}</h3>
          <span className="bmcq-version-tools">
            {/* Rewrites left sits in the header, so the step fits one screen (owner, 2026-11-09, audit §8 D2). */}
            <span className="bmcq-hint bmcq-lyrics-left">{locked ? "AI rewrites end once a song is made. You can still edit by hand." : `${left} of ${LIMITS.textRegenerations} rewrites left`}{song.mode === "vocal" && song.pronunciation ? ` · Singer’s guide: ${brief.shared.recipientName} = ${song.pronunciation}` : ""}</span>
            {approved && <span className="bmcq-chosen"><Icon name="check" size={14} /> Approved</span>}
            <button type="button" className="bmcq-btn is-secondary is-small" onClick={() => {
              if (editing) services.update((b) => { if (b.song.lyrics !== text) { b.song.lyrics = text; b.song.lyricsVersion += 1; b.song.approvedLyricsVersion = null; } });
              setEditing(!editing);
            }}>
              <Icon name={editing ? "check" : "edit"} size={14} /> {editing ? "Done editing" : "Edit"}
            </button>
            <button ref={rewriteRef} type="button" className="bmcq-btn is-ai is-small" onClick={() => { if (!drafting && left > 0 && !locked) void run(canSteer ? steer.value : null); }}
              aria-disabled={left <= 0 || locked || drafting || undefined}>
              <Icon name="refresh" size={14} /> Rewrite
            </button>
          </span>
        </header>
        <BusyAnnounce busy={drafting} busyText="Writing your lyrics…" doneText={error || !text.trim() ? "" : "New lyrics ready."} />
        {drafting ? <Thinking label="Writing your lyrics…" announce={false} /> : editing ? (
          <TextField id="bmcq-lyrics" label="Lyrics" hideLabel multiline rows={Math.max(10, text.split("\n").length + 1)} value={text} onChange={setText} maxLength={900}
            error={validation} hint={<><Counter value={text.length} max={LIMITS.lyricMaxChars} label="characters" /> · {words} words{preset ? ` (about ${preset.words[0]}–${preset.words[1]} suits ${preset.label})` : ""}</>} />
        ) : (
          <pre className="bmcq-lyrics" aria-label="Lyrics">{text ? <LyricBlocks text={text} /> : "No lyrics yet."}</pre>
        )}
        {stale && <p className="bmcq-stale" role="status">{stale === "message" ? "Your inside message changed since these lyrics were written." : "Your earlier answers changed since these lyrics were written."}{" "}{left > 0 && !locked ? <button type="button" className="bmcq-link is-inline" onClick={() => run(steer.value)}>Rewrite them</button> : "Edit them if they no longer fit."}</p>}
        {canSteer && !drafting && !editing && (
          <DirectionField id="bmcq-lyrics-direction" steer={steer} picks={LYRIC_PICKS} gentle={isGentle(brief)}
            placeholder="Make the chorus about her garden" action="press Rewrite" />
        )}
        {error && <div className="bmcq-error" role="alert">{error}</div>}
      </section>
      <Actions onBack={back} busy={busy || drafting} disabled={Boolean(validation) || editing} continueLabel="Approve lyrics"
        onContinue={() => answer((b) => {
          if (b.song.lyrics !== text) { b.song.lyrics = text; b.song.lyricsVersion += 1; }
          b.song.approvedLyricsVersion = b.song.lyricsVersion;
        })} />
    </>
  );
}

function GenerateQuestion({ brief, back, services }: QuestionContext) {
  const songOn = hasSong(brief);
  const cost = generationCost(brief);
  const short = services.creditsReady && services.credits < cost;
  return (
    <>
      <ul className="bmcq-cost">
        <li><Icon name="image" size={16} /> Front artwork <b>1 credit</b></li>
        {songOn && <li><Icon name="note" size={16} /> {brief.song.mode === "vocal" ? "Sung song" : "Instrumental song"} <b>1 credit</b></li>}
        <li><Icon name="message" size={16} /> Inside message <b>free</b></li>
      </ul>
      <p className="bmcq-hint">
        {services.creditsReady ? `You have ${services.credits} credit${services.credits === 1 ? "" : "s"}.` : "Checking your credits…"}
        {short ? " When you create, you can top up with a card (it comes with AI credits) or credits alone, then come straight back." : " You’ll review everything before it’s sent."}
      </p>
      <Actions onBack={back} busy={services.generating} continueLabel={`Create my card · ${cost} credit${cost === 1 ? "" : "s"}`}
        onContinue={() => { void services.generate(); }} />
    </>
  );
}

