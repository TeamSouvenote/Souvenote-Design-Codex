import { COMPARISON } from "./content";
import { TintedLogo } from "./TintedLogo";

function Mark({ yes }: { yes: boolean }) {
  return (
    <>
      {yes ? (
        <svg className="l-mark l-mark-yes" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      ) : (
        <svg className="l-mark l-mark-no" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M7 7l10 10M17 7L7 17" />
        </svg>
      )}
      <span className="l-sr-only">{yes ? "Yes" : "No"}</span>
    </>
  );
}

export function LandingComparison() {
  return (
    <section className="l-section l-compare" aria-labelledby="compare-title">
      <div className="l-wrap">
        <div className="l-head l-head-center">
          <h2 id="compare-title" className="l-h2 l-compare-title">
            How{" "}
            <TintedLogo
              src="/assets/wordmark-gold.png"
              alt="Souvenote"
              width={900}
              height={208}
              sizes="260px"
              className="l-compare-logo"
            />{" "}
            compares
          </h2>
          <p className="l-sub">Your artwork. Their song. Printed and delivered.</p>
        </div>
        <div className="l-compare-frame">
          <table className="l-compare-table">
            <caption className="l-sr-only">How Souvenote compares with other card services</caption>
            <thead>
              <tr>
                <th scope="col">Card service</th>
                {COMPARISON.features.map((feature) => (
                  <th key={feature} scope="col">{feature}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.rows.map((row) => (
                <tr key={row.service} className={row.highlight ? "is-highlight" : undefined}>
                  <th scope="row">{row.service}</th>
                  {row.values.map((value, index) => (
                    <td key={COMPARISON.features[index]}>
                      <Mark yes={value} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
