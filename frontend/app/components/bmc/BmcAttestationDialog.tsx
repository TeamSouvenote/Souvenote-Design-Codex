"use client";

// Upload rights pop-up for Build My Card and Personalize a Template, on the
// berry & ivory dialog shell. Opens as soon as photos are picked. Owner
// decision 2026-11-08 (see attestationContent.ts): the photo-consent promises
// are shown in full, the full Terms of Service and Privacy Policy are linked,
// and there's no scroll-to-read gate. Both statements are unticked checkboxes
// and both must be ticked before Agree & continue. Agreeing records the
// wording version, the time and the photo count. Cancel or Escape discards the
// photos that were waiting.

import * as React from "react";
import { ATTESTATION_VERSION, ATTG_PROMISES, ATTG_STATEMENTS } from "../attestationContent";
import { FlowDialog } from "../flow/FlowDialog";
import { recordPhotoAttestation, type PhotoAttestationRecord } from "../../lib/api";
import { Icon, SectionAnnounce, useFocusOnChange, useSections } from "./ui";
import "../../styles/attestation.css";

type Props = {
  files: File[];
  onCancel: () => void;
  /** Called after both confirmations; the record is also sent to the backend (POST /attestations). */
  onAgree: (record: PhotoAttestationRecord) => void;
};

export function BmcAttestationDialog({ files, onCancel, onAgree }: Props) {
  const [consent, setConsent] = React.useState(false);
  const [terms, setTerms] = React.useState(false);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const bothChecked = consent && terms;
  // Phones (owner, 2026-11-09, audit §8 D6): two screens, the promises in full, then the two ticks,
  // so neither scrolls. The title and intro stay in the page on both (the intro is visually hidden on
  // the second), so the dialog's name and description always exist. Larger screens show everything at once.
  const sections = useSections(2);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  useFocusOnChange(sections.phone ? sections.index : null, titleRef);
  const links = (
    <p className="att-links">
      The full rules are in our{" "}
      <a href="/legal/terms-of-service" target="_blank" rel="noopener noreferrer">Terms of Service<span className="l-sr-only"> (opens in a new tab)</span></a>{" "}and{" "}
      <a href="/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy<span className="l-sr-only"> (opens in a new tab)</span></a>.
    </p>
  );

  // Small previews of the photos waiting for this agreement.
  React.useEffect(() => {
    const urls = files.slice(0, 6).map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  function agree() {
    if (!bothChecked) return;
    const record: PhotoAttestationRecord = { version: ATTESTATION_VERSION, acceptedAt: new Date().toISOString(), photoCount: files.length };
    // Recording is best-effort here: the creation flow keeps its own attested flag.
    void recordPhotoAttestation(record).catch(() => undefined);
    onAgree(record);
  }

  return (
    <FlowDialog onClose={onCancel} labelledBy="bmcq-attest-title" describedBy="bmcq-attest-lede" tone="berry" className="fd-wide bmcq-dialog bmcq-attest att-dialog" screenLabel="Modal · Image-rights attestation">
      <h2 id="bmcq-attest-title" className="fd-title" ref={titleRef} tabIndex={-1}>Your photo, your <span className="l-script">permission</span></h2>
      <p id="bmcq-attest-lede" className={sections.shows(0) ? "fd-lede" : "l-sr-only"}>Because your upload may show real people, please confirm these promises first.</p>
      {sections.phone && <SectionAnnounce index={sections.index} count={2} label={sections.index === 0 ? "The promises" : "Confirm"} />}

      {(sections.phone ? sections.shows(1) : true) && previews.length > 0 && (
        <div className="bmcq-attest-photos" aria-label={`${files.length} photo${files.length === 1 ? "" : "s"} waiting`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- local photo previews (blob URLs), which next/image can't optimise */}
          {previews.map((url, index) => <img key={url} src={url} alt={files[index]?.name ? `Photo ${index + 1}: ${files[index].name}` : `Photo ${index + 1}`} />)}
          <span>{files.length} photo{files.length === 1 ? "" : "s"} waiting</span>
        </div>
      )}

      {sections.shows(0) && <section className="att-promises" aria-labelledby="att-promises-title">
        <h3 id="att-promises-title" className="att-promises-title">By uploading, you promise that:</h3>
        <ul>
          {ATTG_PROMISES.map((promise) => <li key={promise}>{promise}</li>)}
        </ul>
        {!sections.phone && links}
      </section>}

      {sections.shows(1) && <>
      {sections.phone && links}
      <fieldset className="bmcq-attest-checks">
        <legend className="l-sr-only">Confirm both statements</legend>
        <label className={`bmcq-attest-check${consent ? " is-checked" : ""}`}>
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          <span>{ATTG_STATEMENTS.consent}</span>
        </label>
        <label className={`bmcq-attest-check${terms ? " is-checked" : ""}`}>
          <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} />
          <span>{ATTG_STATEMENTS.terms}</span>
        </label>
      </fieldset>
      <p className="bmcq-attest-status" role="status" aria-live="polite">
        {bothChecked ? "Thank you. You're all set." : "Tick both boxes to continue."}
      </p>

      </>}

      <div className="fd-actions">
        {sections.phone && !sections.first
          ? <button type="button" className="l-btn l-btn-secondary" onClick={sections.prev}>Back</button>
          : <button type="button" className="l-btn l-btn-secondary" onClick={onCancel}>Cancel</button>}
        {sections.isLast ? (
          <button type="button" className="l-btn l-btn-primary" onClick={agree} disabled={!bothChecked}>
            Agree &amp; continue <Icon name="arrow" size={16} />
          </button>
        ) : (
          <button type="button" className="l-btn l-btn-primary" onClick={sections.next}>
            Next: confirm <Icon name="arrow" size={16} />
          </button>
        )}
      </div>
    </FlowDialog>
  );
}
