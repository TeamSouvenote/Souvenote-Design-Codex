"use client";

// Controls for one Personalize question. The orchestrator (PtQuestionnaire)
// owns the brief, saving and the interviewer; each control keeps only its
// unsaved input and calls `answer` to commit. The caption, inside-message and
// lyrics controls are Build My Card's, shared as they are.

import * as React from "react";
import type { Brief } from "../bmc/brief";
import { generationCost, hasSong } from "../bmc/brief";
import type { QuestionServices } from "../bmc/BmcQuestion";
import { CaptionQuestion, GenreQuestion, LyricsQuestion, MessageQuestion } from "../bmc/BmcQuestion";
import type { SongMode } from "../bmc/catalog";
import { QrSongCode } from "../bmc/QrSongCode";
import { Actions, BusyAnnounce, ChoiceGroup, Counter, FrontWords, Icon, SectionAnnounce, TextField, Thinking, useFocusAfterRemove, useSections } from "../bmc/ui";
import type { PhotoMode, PtBrief, PtOption, StoryboardPanel } from "./ptBrief";
import { field } from "./ptBrief";
import { resolve } from "./ptEngine";
import { PHOTO_MODE_DEFAULT_COPY, PHOTO_MODE_LABELS } from "./sharedQuestions";
import { COMIC_LIMITS } from "./templates/comicCard";
import type { PtQuestion as PtQuestionDef, PtTemplate } from "./types";

export const MAX_PT_PHOTOS = 4;
/** Every AI suggestion set: the initial draft plus five more (owner, 2026-11-08). */
export const SUGGESTION_DRAFTS = 6;

export type PtAnswerOptions = { text?: string; shared?: boolean };

export type PtServices = {
  pickPhotos: (files: FileList | File[] | null) => void;
  removePhoto: (id: string) => void;
  /** Loads the first suggestion set for a question, or one more set when `more` is true. */
  suggest: (question: PtQuestionDef, more: boolean) => Promise<void>;
  research: (includeLighter: boolean) => Promise<void>;
  draftStoryboard: () => Promise<void>;
  generate: () => Promise<void>;
  update: (change: (brief: PtBrief) => void, shared?: boolean) => void;
  credits: number;
  creditsReady: boolean;
  generating: boolean;
  /** Build My Card's services, for the shared caption, message and lyrics controls. */
  shared: QuestionServices;
};

export type PtQuestionProps = {
  template: PtTemplate;
  brief: PtBrief;
  question: PtQuestionDef;
  busy: boolean;
  answer: (change: (brief: PtBrief) => void, options?: PtAnswerOptions) => void;
  skip?: () => void;
  back?: () => void;
  services: PtServices;
};

/** The card's default genre and why, shown gold and pre-selected on "Choose the sound". */
function suggestedGenre(template: PtTemplate, brief: PtBrief) {
  const mood = template.writerBrief(brief).mood;
  const reason = mood && mood.length <= 20 ? `Suits a ${mood.toLowerCase()} ${template.name} card.` : `Suits this ${template.name} card.`;
  return { id: template.songPreset(brief), reason };
}

export function PtQuestion(props: PtQuestionProps) {
  const { question, brief, busy, back, services } = props;
  // The shared Build My Card controls take a Brief; a PtBrief is one.
  const sharedAnswer = (change: (b: Brief) => void) => props.answer((b) => change(b));
  switch (question.kind) {
    case "names": return <NamesQuestion {...props} />;
    case "date": return <DateQuestion {...props} />;
    case "text": return <TextQuestion {...props} />;
    case "form": return <FormQuestion {...props} />;
    case "choice": return <ChoiceQuestion {...props} />;
    case "suggest": return <SuggestQuestion {...props} />;
    case "candidates": return <CandidatesQuestion {...props} />;
    case "storyboard": return <StoryboardQuestion {...props} />;
    case "photo-mode": return <PhotoModeQuestion {...props} />;
    case "photo": return <PhotoQuestion {...props} />;
    case "caption": return <CaptionQuestion brief={brief} busy={busy} back={back} answer={sharedAnswer} services={services.shared} />;
    case "message": return <MessageQuestion brief={brief} busy={busy} back={back} answer={sharedAnswer} services={services.shared} />;
    case "lyrics": return <LyricsQuestion brief={brief} busy={busy} back={back} answer={sharedAnswer} services={services.shared} />;
    case "song-mode": return <SongModeQuestion {...props} />;
    case "genre": return <GenreQuestion brief={brief} busy={busy} back={back} answer={sharedAnswer} services={services.shared} suggested={[suggestedGenre(props.template, brief)]} />;
    case "song-use": return <SongUseQuestion {...props} />;
    case "generate": return <GenerateQuestion {...props} />;
    default: return null;
  }
}

// ---- Names ---------------------------------------------------------------------------

function NamesQuestion({ brief, answer, back, skip, busy }: PtQuestionProps) {
  const [sender, setSender] = React.useState(brief.shared.senderName || "");
  const [recipient, setRecipient] = React.useState(brief.shared.recipientName || "");
  const [phonetic, setPhonetic] = React.useState(brief.song.pronunciation || "");
  // Who they are to the sender (owner, 2026-11-08), so the message and song can say "Mom" or "my sister".
  const [relationship, setRelationship] = React.useState(brief.shared.relationship || "");
  return (
    <>
      <div className="bmcq-fields is-pair">
        <TextField id="pt-sender" label="Your name" value={sender} onChange={setSender} maxLength={60} placeholder="Cameron" />
        <TextField id="pt-recipient" label="Their name" value={recipient} onChange={setRecipient} maxLength={60} placeholder="Maya" />
      </div>
      <div className="bmcq-fields is-pair">
        <TextField id="pt-relationship" label="They’re your… (optional)" value={relationship} onChange={setRelationship} maxLength={60}
          placeholder="Sister, mom, best friend" hint="Helps the message and song sound like you." />
        <TextField id="pt-phonetic" label="How to say their name (optional)" value={phonetic} onChange={setPhonetic} maxLength={80}
          placeholder="MY-uh" hint="Only helps the singer say it right. It’s never printed." />
      </div>
      <Actions onBack={back} onSkip={skip && !sender && !recipient && !relationship ? skip : undefined} busy={busy}
        onContinue={() => answer((b) => {
          b.shared.senderName = sender.trim() || null;
          b.shared.recipientName = recipient.trim() || null;
          b.shared.relationship = relationship.trim() || null;
          b.song.pronunciation = phonetic.trim() || null;
          // A changed name needs the song's name choice asked again.
          if (!b.shared.recipientName) b.personalize.songUse.name = null;
        }, { shared: true })} />
    </>
  );
}

// ---- Date ----------------------------------------------------------------------------

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function splitDate(value: string) {
  const match = value.match(/^(\d{4}|-)-(\d{2})-(\d{2})$/);
  return match ? { year: match[1] === "-" ? "" : match[1], month: String(Number(match[2])), day: String(Number(match[3])) } : { year: "", month: "", day: "" };
}

function DateQuestion({ brief, question, answer, back, skip, busy }: PtQuestionProps) {
  const key = question.field || "date";
  const initial = splitDate(field(brief, key));
  const [month, setMonth] = React.useState(initial.month);
  const [day, setDay] = React.useState(initial.day);
  const [year, setYear] = React.useState(initial.year);
  const [submitted, setSubmitted] = React.useState(false);
  const thisYear = new Date().getFullYear();
  const days = month ? new Date(2024, Number(month), 0).getDate() : 31;
  const yearNumber = Number(year);
  const yearError = year && (!/^\d{4}$/.test(year) || yearNumber < 1900 || yearNumber > thisYear) ? `Enter a year between 1900 and ${thisYear}.` : null;
  const missing = !month || !day || (question.yearRequired && !year);
  const dayError = month && day && Number(day) > days ? `${MONTHS[Number(month) - 1]} has ${days} days.` : null;
  const value = month && day ? `${year && !yearError ? year : "-"}-${month.padStart(2, "0")}-${day.padStart(2, "0")}` : "";
  const error = submitted ? (missing ? (question.yearRequired ? "Add the month, day and year." : "Add the month and day.") : yearError || dayError) : null;
  const note = value && !yearError && !dayError ? question.dateNote?.(value) : null;

  return (
    <>
      <fieldset className="pt-date">
        <legend className="l-sr-only">{resolve(question.heading, brief).join(" ")}</legend>
        <label className="bmcq-field">
          <span className="bmcq-label">Month</span>
          <select className="bmcq-input" value={month} onChange={(event) => setMonth(event.target.value)}>
            <option value="">Month</option>
            {MONTHS.map((name, index) => <option key={name} value={String(index + 1)}>{name}</option>)}
          </select>
        </label>
        <label className="bmcq-field">
          <span className="bmcq-label">Day</span>
          <select className="bmcq-input" value={day} onChange={(event) => setDay(event.target.value)}>
            <option value="">Day</option>
            {Array.from({ length: days }, (_, index) => <option key={index + 1} value={String(index + 1)}>{index + 1}</option>)}
          </select>
        </label>
        <label className="bmcq-field">
          <span className="bmcq-label">Year{question.yearRequired ? "" : " (optional)"}</span>
          <input className="bmcq-input" inputMode="numeric" maxLength={4} value={year} placeholder="1992" onChange={(event) => setYear(event.target.value.replace(/\D/g, ""))} />
        </label>
      </fieldset>
      {note && <p className="pt-date-note" role="status"><span className="pt-sign-chip"><Icon name="sparkle" size={14} /> {note}</span></p>}
      {error && <div className="bmcq-error" role="alert">{error}</div>}
      <Actions onBack={back} onSkip={question.optional ? skip : undefined} busy={busy}
        onContinue={() => {
          setSubmitted(true);
          if (missing || yearError || dayError) return;
          answer((b) => { b.personalize.fields[key] = value; });
        }} />
    </>
  );
}

// ---- Text and form ---------------------------------------------------------------------

function TextQuestion({ brief, question, answer, back, skip, busy }: PtQuestionProps) {
  const key = question.field || question.id;
  const [value, setValue] = React.useState(field(brief, key));
  const required = !question.optional;
  return (
    <>
      <TextField id={`pt-${question.id}`} label={resolve(question.prompt, brief)} hideLabel multiline rows={3} value={value} onChange={setValue}
        maxLength={question.maxLength} placeholder={question.placeholder ? resolve(question.placeholder, brief) : undefined}
        hint={question.maxLength ? <Counter value={value.length} max={question.maxLength} label="characters" /> : undefined} />
      <Actions onBack={back} onSkip={question.optional && !value.trim() ? skip : undefined} busy={busy} disabled={required && !value.trim()}
        onContinue={() => answer((b) => { b.personalize.fields[key] = value.trim(); }, { text: value.trim(), shared: Boolean(question.extract?.length) })} />
    </>
  );
}

function FormQuestion({ brief, question, answer, back, busy }: PtQuestionProps) {
  const inputs = question.inputs || [];
  const [values, setValues] = React.useState<Record<string, string>>(() => Object.fromEntries(inputs.map((input) => [input.key, field(brief, input.key) || input.initial?.(brief) || ""])));
  const incomplete = inputs.some((input) => !input.optional && !values[input.key]?.trim());
  return (
    <>
      {inputs.map((input) => (
        <TextField key={input.key} id={`pt-${question.id}-${input.key}`} label={input.label} value={values[input.key] || ""} maxLength={input.maxLength}
          placeholder={input.placeholder} onChange={(value) => setValues((all) => ({ ...all, [input.key]: value }))}
          hint={input.maxLength ? <Counter value={(values[input.key] || "").length} max={input.maxLength} label="characters" /> : undefined} />
      ))}
      <Actions onBack={back} busy={busy} disabled={incomplete}
        onContinue={() => answer((b) => { for (const input of inputs) b.personalize.fields[input.key] = values[input.key]?.trim() || ""; })} />
    </>
  );
}

// ---- Choice (with a write-in) -------------------------------------------------------------

const OWN = "own-words";

function ChoiceQuestion({ brief, question, answer, back, skip, busy }: PtQuestionProps) {
  const key = question.field || question.id;
  const choices = question.choices?.(brief) || [];
  const saved = key === "occasion" ? brief.shared.occasion || "" : field(brief, key);
  const savedIsChoice = choices.some((choice) => choice.id === saved);
  const [value, setValue] = React.useState<string | null>(saved ? (savedIsChoice ? saved : OWN) : null);
  const [own, setOwn] = React.useState(saved && !savedIsChoice ? saved : "");
  const options = [...choices, ...(question.writeIn ? [{ id: OWN, label: question.writeIn.label }] : [])];
  const result = value === OWN ? own.trim() : value || "";
  return (
    <>
      <ChoiceGroup label={resolve(question.heading, brief).join(" ")} columns="cards" value={value} onChange={setValue} options={options} />
      {value === OWN && question.writeIn && (
        <TextField id={`pt-${question.id}-own`} label="Your answer" value={own} onChange={setOwn} maxLength={200} autoFocus
          placeholder={resolve(question.writeIn.placeholder, brief)} />
      )}
      <Actions onBack={back} onSkip={question.optional ? skip : undefined} busy={busy} disabled={!result}
        onContinue={() => answer((b) => {
          if (key === "occasion") b.shared.occasion = result;
          else b.personalize.fields[key] = result;
        }, { text: value === OWN ? result : undefined, shared: key === "occasion" })} />
    </>
  );
}

// ---- AI suggestions (with a write-in) ------------------------------------------------------

function useAutoSuggest(question: PtQuestionDef, set: unknown, run: () => Promise<void>) {
  const started = React.useRef(false);
  React.useEffect(() => {
    if (set || started.current) return;
    started.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per question, when it has no suggestions yet
  }, [question.id]);
}

function SuggestQuestion({ brief, question, answer, back, skip, busy, services }: PtQuestionProps) {
  const key = question.field || question.id;
  const set = brief.personalize.suggestions[question.id];
  const [working, setWorking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const saved = field(brief, key);
  const options: PtOption[] = set?.options || [];
  const savedOption = options.find((option) => option.label === saved);
  const [value, setValue] = React.useState<string | null>(savedOption ? savedOption.id : saved ? OWN : null);
  const [own, setOwn] = React.useState(saved && !savedOption ? saved : "");
  const left = Math.max(0, SUGGESTION_DRAFTS - (set?.drafts || 0));

  const run = async (more: boolean) => {
    setWorking(true);
    setError(null);
    try { await services.suggest(question, more); } catch (err) { setError(err instanceof Error ? err.message : "Suggestions couldn’t load. Try again, or write your own."); } finally { setWorking(false); }
  };
  useAutoSuggest(question, set, () => run(false));

  const chosen = value === OWN ? own.trim() : options.find((option) => option.id === value)?.label || "";
  return (
    <>
      <div className="bmcq-ai-block pt-suggest" aria-busy={working || undefined}>
        <BusyAnnounce busy={working} busyText="Finding ideas for you…" doneText={error || !options.length ? "" : `${options.length} ideas ready.`} />
        {working ? <Thinking label="Finding ideas for you…" announce={false} /> : (
          <ChoiceGroup label={resolve(question.heading, brief).join(" ")} columns="cards" value={value} onChange={setValue}
            options={[
              ...options.map((option) => ({ id: option.id, label: option.label, sub: option.sub, badge: option.recommended ? "Suggested" : undefined })),
              ...(question.writeIn ? [{ id: OWN, label: question.writeIn.label }] : []),
            ]} />
        )}
        <div className="bmcq-inline-actions">
          <button type="button" className="bmcq-btn is-ai is-small" onClick={() => { if (!working && left > 0 && set) void run(true); }}
            aria-disabled={working || left <= 0 || !set || undefined}>
            <Icon name="refresh" size={14} /> Suggest more
          </button>
          <span className="bmcq-hint">{set ? `${left} more suggestion${left === 1 ? "" : "s"} left` : "First suggestions, then up to 5 more"}</span>
        </div>
        {error && <div className="bmcq-error" role="alert">{error}</div>}
      </div>
      {value === OWN && question.writeIn && (
        <TextField id={`pt-${question.id}-own`} label="Your own" value={own} onChange={setOwn} maxLength={240} autoFocus placeholder={resolve(question.writeIn.placeholder, brief)} />
      )}
      <Actions onBack={back} onSkip={question.optional ? skip : undefined} busy={busy || working} disabled={!chosen}
        onContinue={() => answer((b) => { b.personalize.fields[key] = chosen; }, { text: value === OWN ? chosen : undefined })} />
    </>
  );
}

// ---- On This Day: verified story candidates -------------------------------------------------

const STORIES_SHOWN = 3;

function CandidatesQuestion({ brief, question, answer, back, busy, services }: PtQuestionProps) {
  const set = brief.personalize.suggestions[question.id];
  const [working, setWorking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lighter, setLighter] = React.useState(Boolean(set?.options.some((option) => option.tone && option.tone !== "positive")));
  const options = set?.options || [];
  const [value, setValue] = React.useState<string | null>(field(brief, "storyId") || options.find((option) => option.recommended)?.id || null);

  const run = async (includeLighter: boolean) => {
    setWorking(true);
    setError(null);
    try { await services.research(includeLighter); } catch (err) { setError(err instanceof Error ? err.message : "We couldn’t look up that day just now. Try again."); } finally { setWorking(false); }
  };
  useAutoSuggest(question, set, () => run(false));

  // Until the customer picks, the recommended story is selected.
  const selectedId = value || options.find((option) => option.recommended)?.id || null;
  const chosen = options.find((option) => option.id === selectedId) || null;
  // Three stories first, then "Show N more stories" (owner, 2026-11-09, audit §8 D4). The chosen
  // story always shows. After Show more, focus moves to the first story it revealed.
  const [showAll, setShowAll] = React.useState(false);
  const firstThree = options.slice(0, STORIES_SHOWN).map((option) => option.id);
  const visible = showAll ? options : options.filter((option) => firstThree.includes(option.id) || option.id === selectedId);
  const hiddenCount = options.length - visible.length;
  const revealRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!revealRef.current) return;
    document.querySelector<HTMLElement>(`[data-story-id="${revealRef.current}"]`)?.focus();
    revealRef.current = null;
  }, [showAll]);
  const note = brief.personalize.fields.researchNote;
  return (
    <>
      <BusyAnnounce busy={working} busyText="Looking up that day…" doneText={error || !options.length ? "" : `${options.length} stories found.`} />
      {working ? <Thinking label="Looking up that day…" announce={false} /> : (
        <div role="radiogroup" aria-label="Stories from that day" className="pt-stories">
          {visible.map((option) => {
            const selected = option.id === selectedId;
            return (
              <div key={option.id} className={`pt-story${selected ? " is-selected" : ""}`}>
                <button type="button" role="radio" aria-checked={selected} className="pt-story-pick" data-story-id={option.id} onClick={() => setValue(option.id)}>
                  <span className="pt-story-text">
                    {option.recommended && <span className="bmcq-badge">Recommended</span>}
                    <span className="pt-story-title">{option.label}</span>
                    {option.sub && <span className="pt-story-sub">{option.sub}</span>}
                  </span>
                  {selected && <span className="bmcq-option-tick" aria-hidden="true"><Icon name="check" size={16} /></span>}
                </button>
                {option.source && (
                  <a className="pt-story-source" href={option.source.url} target="_blank" rel="noopener noreferrer">
                    {option.source.name}<span className="l-sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
      {!working && hiddenCount > 0 && (
        <button type="button" className="bmcq-link pt-stories-more" onClick={() => {
          revealRef.current = options.find((option) => !visible.includes(option))?.id || null;
          setShowAll(true);
        }}>Show {hiddenCount} more {hiddenCount === 1 ? "story" : "stories"}</button>
      )}
      {/* The research note and the lighter-stories option share a line on desktop (D4). */}
      <div className="pt-stories-foot">
        {note && !working && <p className="bmcq-hint">{note}</p>}
        <label className="pt-check">
          <input type="checkbox" checked={lighter} aria-disabled={working || undefined}
            onChange={(event) => { if (working) return; setLighter(event.target.checked); void run(event.target.checked); }} />
          <span>Also show lighter or neutral stories</span>
        </label>
      </div>
      {error && <div className="bmcq-error" role="alert">{error}</div>}
      <Actions onBack={back} busy={busy || working} disabled={!chosen}
        onContinue={() => chosen && answer((b) => {
          const changed = b.personalize.fields.storyId !== chosen.id;
          b.personalize.fields.storyId = chosen.id;
          b.personalize.fields.storyHeadline = chosen.label;
          b.personalize.fields.storySummary = chosen.sub || "";
          b.personalize.fields.storySource = chosen.source?.name || "";
          b.personalize.fields.storyUrl = chosen.source?.url || "";
          // A new lead story needs new headlines: the old ones were about the other story.
          if (changed) { delete b.personalize.fields.headline; delete b.personalize.suggestions.O_headline; }
        }, { shared: true })} />
    </>
  );
}

// ---- Comic storyboard ----------------------------------------------------------------------

const wordsIn = (line: string) => line.trim().split(/\s+/).filter(Boolean).length;

function StoryboardQuestion({ brief, answer, back, busy, services }: PtQuestionProps) {
  const board = brief.personalize.storyboard;
  const [panels, setPanels] = React.useState<StoryboardPanel[]>(board?.panels || []);
  const [working, setWorking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const left = Math.max(0, SUGGESTION_DRAFTS - (board?.drafts || 0));

  React.useEffect(() => { setPanels(board?.panels || []); }, [board?.panels]);
  const run = async () => {
    setWorking(true);
    setError(null);
    try { await services.draftStoryboard(); } catch (err) { setError(err instanceof Error ? err.message : "The storyboard couldn’t be drafted. Try again."); } finally { setWorking(false); }
  };
  const started = React.useRef(false);
  React.useEffect(() => {
    if (board || started.current) return;
    started.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drafts once on arrival when there's no storyboard
  }, []);

  const setPanel = (index: number, change: (panel: StoryboardPanel) => StoryboardPanel) => setPanels((all) => all.map((panel, i) => (i === index ? change(panel) : panel)));
  const invalid = (panel: StoryboardPanel) => !panel.action.trim() || panel.lettering.some((line) => wordsIn(line) > COMIC_LIMITS.wordsPerLettering);
  const tooLong = panels.some((panel) => panel.lettering.some((line) => wordsIn(line) > COMIC_LIMITS.wordsPerLettering));
  const emptyAction = panels.some((panel) => !panel.action.trim());
  // Phones: one panel per screen, Next checks that panel (owner, 2026-11-09, audit §8 D3).
  // Desktop: all four panels at once, one row each (personalize.css).
  const sections = useSections(panels.length);
  // Rewrite storyboard: under the panel on phones, in the action bar on larger screens so all four
  // panels fit one desktop screen (owner, 2026-11-09, audit §8 D3).
  const rewrite = (
    <div className="bmcq-inline-actions pt-board-rewrite">
      <button type="button" className="bmcq-btn is-ai is-small" onClick={() => { if (!working && left > 0) void run(); }}
        aria-disabled={working || left <= 0 || undefined}>
        <Icon name="refresh" size={14} /> Rewrite storyboard
      </button>
      <span className="bmcq-hint">{left} rewrite{left === 1 ? "" : "s"} left · editing by hand is free</span>
    </div>
  );
  const currentInvalid = sections.phone && panels[sections.index] ? invalid(panels[sections.index]) : false;

  return (
    <>
      {working ? <Thinking label="Drawing up your storyboard…" /> : (
        <ol className="pt-board" aria-label="Storyboard, four panels in reading order">
          {sections.phone && <SectionAnnounce index={sections.index} count={panels.length} label={`Panel ${sections.index + 1}`} />}
          {panels.map((panel, index) => sections.shows(index) && (
            <li key={index} className="pt-board-panel">
              <p className="pt-board-num"><span className="pt-board-word">Panel </span>{index + 1}</p>
              <TextField id={`pt-panel-${index}`} label={`Panel ${index + 1}: what happens`} multiline rows={3} maxLength={300} value={panel.action}
                placeholder="What happens in this panel"
                onChange={(action) => setPanel(index, (p) => ({ ...p, action }))} />
              {Array.from({ length: COMIC_LIMITS.letteringPerPanel }, (_, line) => {
                const text = panel.lettering[line] || "";
                const words = wordsIn(text);
                return (
                  <TextField key={line} id={`pt-panel-${index}-line-${line}`} label={`Bubble or caption ${line + 1} (optional)`} value={text} maxLength={70}
                    // A one-line box that wraps and grows, so a whole bubble is readable in a narrow column; no line breaks.
                    multiline rows={1} placeholder={`Bubble ${line + 1} (optional)`}
                    onChange={(value) => setPanel(index, (p) => { const lettering = [...p.lettering]; lettering[line] = value.replace(/\s*\n\s*/g, " "); return { ...p, lettering }; })}
                    hint={<Counter value={words} max={COMIC_LIMITS.wordsPerLettering} label="words" />}
                    error={words > COMIC_LIMITS.wordsPerLettering ? `Keep it to about ${COMIC_LIMITS.wordsPerLettering} words so it fits the bubble.` : null} />
                );
              })}
            </li>
          ))}
        </ol>
      )}
      {sections.phone && rewrite}
      {error && <div className="bmcq-error" role="alert">{error}</div>}
      {sections.phone && !sections.isLast ? (
        <Actions onBack={sections.first ? back : sections.prev} busy={busy || working} disabled={currentInvalid}
          continueLabel={`Next: panel ${sections.index + 2}`} onContinue={sections.next} />
      ) : (
      <Actions onBack={sections.phone && !sections.first ? sections.prev : back} busy={busy || working} disabled={!panels.length || tooLong || emptyAction} continueLabel="Approve storyboard"
        note={sections.phone ? undefined : rewrite}
        onContinue={() => answer((b) => {
          const current = b.personalize.storyboard;
          if (!current) return;
          const cleaned = panels.map((panel) => ({ action: panel.action.trim(), lettering: panel.lettering.map((line) => line.trim()).filter(Boolean) }));
          const changed = JSON.stringify(cleaned) !== JSON.stringify(current.panels);
          b.personalize.storyboard = { ...current, panels: cleaned, version: current.version + (changed ? 1 : 0), approvedVersion: current.version + (changed ? 1 : 0) };
        }, { shared: true })} />
      )}
    </>
  );
}

// ---- Photo -------------------------------------------------------------------------------

/**
 * Photo or no photo (owner, 2026-11-08). The customer chose this card for its
 * example, so a photo gets the card's own treatment; there's no menu of modes.
 * Where the card allows it, a quiet link keeps the photo exactly as it is.
 */
function PhotoModeQuestion({ template, brief, answer, back, busy }: PtQuestionProps) {
  const saved = brief.personalize.photoMode;
  const [choice, setChoice] = React.useState<"photo" | "none" | null>(saved === null ? null : saved === "none" ? "none" : "photo");
  const [keep, setKeep] = React.useState(template.keepOriginal && saved === "decorate");
  const copy = template.photoModeCopy(brief);
  const photoMode: PhotoMode = keep ? "decorate" : template.photoTreatment;
  const value: PhotoMode | null = choice === null ? null : choice === "none" ? "none" : photoMode;
  const options = [
    { id: "photo" as const, label: PHOTO_MODE_LABELS[photoMode], sub: copy[photoMode] || PHOTO_MODE_DEFAULT_COPY[photoMode] },
    { id: "none" as const, label: PHOTO_MODE_LABELS.none, sub: copy.none || PHOTO_MODE_DEFAULT_COPY.none, badge: template.recommendNoPhoto ? "Recommended" : undefined },
  ];
  return (
    <>
      <ChoiceGroup<"photo" | "none"> label="Use a photo" columns="cards" value={choice} onChange={setChoice} options={options} />
      {template.keepOriginal && (
        <p className="bmcq-hint">
          {keep ? "Your photo stays exactly as it is. " : "Prefer your photo untouched? "}
          <button type="button" className="bmcq-link is-inline is-hit" onClick={() => { setKeep(!keep); setChoice("photo"); }}>
            {keep ? "Reimagine it in this card’s style instead" : "Keep it as it is, framed with artwork"}
          </button>
        </p>
      )}
      <Actions onBack={back} busy={busy} disabled={!value}
        onContinue={() => answer((b) => {
          b.personalize.photoMode = value;
          b.control.photoSkipped = value === "none";
          b.image.mode = value && value !== "none" ? value : null;
        })} />
    </>
  );
}

function PhotoQuestion({ brief, answer, back, busy, services }: PtQuestionProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const refs = brief.image.references;
  const room = MAX_PT_PHOTOS - refs.length;
  // Removing a photo moves focus to the next remove button, or Choose photos (never <body>).
  const chooseRef = React.useRef<HTMLButtonElement>(null);
  const thumbsRef = React.useRef<HTMLUListElement>(null);
  const markRemoved = useFocusAfterRemove(refs.length, thumbsRef, chooseRef);
  return (
    <>
      <div className={`bmcq-drop${dragging ? " is-dragging" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); services.pickPhotos(event.dataTransfer.files); }}>
        <Icon name="upload" size={28} />
        <p className="bmcq-drop-title">Drop a photo here, or</p>
        <button ref={chooseRef} type="button" className="bmcq-btn is-primary" onClick={() => { if (room > 0) inputRef.current?.click(); }} aria-disabled={room <= 0 || undefined}>Choose photos</button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden aria-label="Choose photos"
          onChange={(event) => { services.pickPhotos(event.target.files); event.target.value = ""; }} />
        <p className="bmcq-hint">{refs.length ? `${refs.length} of ${MAX_PT_PHOTOS} added` : `Up to ${MAX_PT_PHOTOS} photos`}. You’ll confirm you have the right to use them as soon as you add them.</p>
      </div>
      {refs.length > 0 && (
        <ul ref={thumbsRef} className="bmcq-thumbs" aria-label="Your photos">
          {refs.map((ref, index) => (
            <li key={ref.id} className="bmcq-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element -- a local photo preview (data URL), which next/image can't optimise */}
              {ref.thumbnail ? <img src={ref.thumbnail} alt={`Photo ${index + 1} of ${refs.length}`} /> : <span className="bmcq-thumb-name">{ref.name}</span>}
              <button type="button" className="bmcq-thumb-remove" aria-label={`Remove ${ref.name}`} onClick={() => { markRemoved(index); services.removePhoto(ref.id); }}>
                <Icon name="close" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Actions onBack={back} busy={busy} disabled={refs.length === 0 || brief.control.attestedBatches === 0}
        onContinue={() => answer((b) => { b.control.photoSkipped = false; })} />
    </>
  );
}

// ---- Song ----------------------------------------------------------------------------------

function SongModeQuestion({ brief, answer, back, busy }: PtQuestionProps) {
  const [value, setValue] = React.useState(brief.song.mode);
  return (
    <>
      <ChoiceGroup<SongMode> label="Song" columns="cards" value={value} onChange={setValue} options={[
        { id: "vocal", label: "A sung song", sub: "Lyrics written from your answers, for you to approve. Adds 1 credit." },
        { id: "instrumental", label: "Instrumental", sub: "Music only, no singing. Adds 1 credit." },
        { id: "none", label: "No song", sub: "No QR code inside." },
      ]} />
      {value !== "none" && (
        <div className="bmcq-qr-wrap">
          <QrSongCode />
          <p className="bmcq-hint">This card’s music style is set by the template.{brief.message.mode === "blank" ? " Your inside stays blank apart from the QR code." : ""}</p>
        </div>
      )}
      <Actions onBack={back} busy={busy} disabled={!value}
        onContinue={() => answer((b) => {
          b.song.mode = value;
          if (value !== "vocal") b.song.approvedLyricsVersion = null;
        })} />
    </>
  );
}

function SongUseQuestion({ template, brief, answer, back, busy }: PtQuestionProps) {
  const name = brief.shared.recipientName;
  const detail = template.detail(brief);
  // Both start on Yes, the usual choice (owner, 2026-11-09, audit §8 D9); a saved answer wins.
  const [useName, setUseName] = React.useState<"yes" | "no" | null>(brief.personalize.songUse.name === null ? "yes" : brief.personalize.songUse.name ? "yes" : "no");
  const [useDetail, setUseDetail] = React.useState<"yes" | "no" | null>(brief.personalize.songUse.detail === null ? "yes" : brief.personalize.songUse.detail ? "yes" : "no");
  return (
    <>
      {name && (
        <ChoiceGroup<"yes" | "no"> label={`Use ${name} in the song?`} columns="chips" value={useName} onChange={setUseName}
          options={[{ id: "yes", label: `Yes, sing “${name}”` }, { id: "no", label: "No name in the song" }]} />
      )}
      <ChoiceGroup<"yes" | "no"> label={`Mention ${template.detailLabel}?`} columns="chips" value={useDetail} onChange={setUseDetail}
        options={[{ id: "yes", label: `Yes, mention ${template.detailLabel}` }, { id: "no", label: "Keep it general" }]} />
      {detail && <p className="bmcq-hint">The song could mention {detail.replace(/[.!?]+$/, "")}.</p>}
      <Actions onBack={back} busy={busy} disabled={!useDetail || (Boolean(name) && !useName)}
        onContinue={() => answer((b) => {
          const before = JSON.stringify(b.personalize.songUse);
          b.personalize.songUse = { name: name ? useName === "yes" : null, detail: useDetail === "yes" };
          // Lyrics written under different choices need writing again.
          if (before !== JSON.stringify(b.personalize.songUse) && b.song.lyrics) { b.song.lyrics = ""; b.song.approvedLyricsVersion = null; }
        })} />
    </>
  );
}

// ---- Create --------------------------------------------------------------------------------

function GenerateQuestion({ template, brief, back, services }: PtQuestionProps) {
  const songOn = hasSong(brief);
  const cost = generationCost(brief);
  const short = services.creditsReady && services.credits < cost;
  const notes = template.frontNotes(brief);
  return (
    <>
      <ChoiceGroup<"portrait" | "landscape"> label="Card shape" columns="chips" value={brief.image.orientation || template.defaultOrientation}
        onChange={(orientation) => services.update((b) => { b.image.orientation = orientation; })}
        options={[{ id: "portrait", label: "Portrait 5 × 7" }, { id: "landscape", label: "Landscape 7 × 5" }]} />
      <ul className="bmcq-cost">
        <li><Icon name="image" size={16} /> Front artwork <b>1 credit</b></li>
        {songOn && <li><Icon name="note" size={16} /> {brief.song.mode === "vocal" ? "Sung song" : "Instrumental song"} <b>1 credit</b></li>}
        <li><Icon name="message" size={16} /> Inside message <b>free</b></li>
      </ul>
      {notes.length > 0 && <ul className="pt-front-notes">{notes.map((note) => <li key={note}>{note}</li>)}</ul>}
      <FrontWords words={template.writerBrief(brief).frontText.map((item) => item.text)} />
      <p className="bmcq-hint">
        {services.creditsReady ? `You have ${services.credits} credit${services.credits === 1 ? "" : "s"}.` : "Checking your credits…"}
        {short ? " When you create, you can top up with a card (it comes with AI credits) or credits alone, then come straight back." : " You’ll review everything, including the spelling on the front, before it’s sent."}
      </p>
      <Actions onBack={back} busy={services.generating} continueLabel={`Create my card · ${cost} credit${cost === 1 ? "" : "s"}`}
        onContinue={() => { void services.generate(); }} />
    </>
  );
}
