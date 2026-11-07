import { BmcIcon } from "./BmcShared";

type DlvKeepsakeProps = {
  /** The customer's own front image (a real web address), or null for an empty frame. */
  imageUrl?: string | null;
  /** True only when the card really has a song. */
  songIncluded?: boolean;
};

// Card preview beside the Delivery form. On phones it is a compact strip
// (small card on the left, the pieces beside it) so the form starts sooner.
//
// No sample content (owner rule 2026-11-06, build-fixes item 9): the front shows
// the customer's own image when the backend gives one, otherwise an empty frame.
// The inside message and song details aren't saved with the card yet (backend
// gap), so the handwritten message preview and the song line are not shown.
function DlvKeepsake({ imageUrl = null, songIncluded = false }: DlvKeepsakeProps) {
  return (
    <section className="dv-keepsake" aria-labelledby="dv-keepsake-title">
      <p className="dv-keepsake-eyebrow" id="dv-keepsake-title">
        <span className="dv-diamond" aria-hidden="true" />
        <span>Your keepsake is approved</span>
      </p>

      <div className="dv-keepsake-top">
        <div className={`dv-art ${imageUrl ? "has-image" : "is-empty"}`} aria-hidden="true">
          {imageUrl ? (
            <img className="dv-art-img" src={imageUrl} alt="" />
          ) : (
            <>
              <span className="dv-art-corner" />
              <span className="dv-art-corner is-bl" />
            </>
          )}
        </div>

        <ul className="dv-pieces">
          <li className="dv-piece">
            <span className="dv-piece-ico" aria-hidden="true"><BmcIcon name="image" w={17} /></span>
            <div>
              <p className="dv-piece-name">Front card</p>
              <p className="dv-piece-meta">5x7 portrait · printed</p>
            </div>
            <span className="dv-piece-check" aria-hidden="true"><BmcIcon name="check" w={18} /></span>
          </li>

          <li className="dv-piece">
            <span className="dv-piece-ico" aria-hidden="true"><BmcIcon name="message" w={17} /></span>
            <div>
              <p className="dv-piece-name">Inside message</p>
              <p className="dv-piece-meta">Hand-written by our studio</p>
            </div>
            <span className="dv-piece-check" aria-hidden="true"><BmcIcon name="check" w={18} /></span>
          </li>
        </ul>
      </div>

      <ul className="dv-ships">
        <li className="dv-ship-tag"><CheckMini /> Folded 5x7 card</li>
        <li className="dv-ship-tag"><CheckMini /> Envelope included</li>
        <li className="dv-ship-tag"><CheckMini /> Realistic handwriting</li>
        {songIncluded && <li className="dv-ship-tag"><CheckMini /> Song QR printed inside</li>}
      </ul>
    </section>
  );
}

function CheckMini() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12.5l4 4 10-10" />
    </svg>
  );
}

export { DlvKeepsake };
