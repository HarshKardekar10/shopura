import { useMemo, useState } from "react";
import type { Product } from "./products";
import {
  TRUST_LABEL, analyzeProduct, filterReviews, summarize,
  type ReviewFilterState, type TrustClass,
} from "./reviewTrust";

const ICON: Record<TrustClass, string> = { trustworthy: "✓", suspicious: "!", insufficient: "?" };
const KIND: Record<string, string> = { positive: "Positive", negative: "Warning", inconclusive: "Inconclusive" };
const INIT: ReviewFilterState = { cls: "all", sort: "recent", q: "" };

export default function ReviewTrustPanel({ product }: { product: Product }) {
  const all = useMemo(() => analyzeProduct(product), [product]);
  const s = useMemo(() => summarize(product), [product]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<ReviewFilterState>(INIT);
  const shown = useMemo(() => filterReviews(all, f), [all, f]);
  const tabs: (TrustClass | "all")[] = ["all", "trustworthy", "suspicious", "insufficient"];
  const countOf = (c: TrustClass | "all") => (c === "all" ? s.total : s.counts[c]);

  return (
    <div className="details-section trust-panel">
      <h3>Review Trust Analysis</h3>
      <p className="review-disclaimer">
        All reviews here are generated demo content. This shows how the Trust Filter works; it does not measure real
        customer-review authenticity. A high evidence score means more supporting signals, not proof of a real buyer.
      </p>

      <div className="trust-summary">
        <div><strong>{s.total}</strong><small>reviews</small></div>
        <div><strong>★ {s.avg.toFixed(1)}</strong><small>avg sample rating</small></div>
        <div><strong>{s.counts.trustworthy}</strong><small>✓ more trustworthy</small></div>
        <div><strong>{s.counts.suspicious}</strong><small>! suspicious signals</small></div>
        <div><strong>{s.counts.insufficient}</strong><small>? not enough info</small></div>
      </div>
      <p>{s.text}</p>
      <ul className="trust-facts">
        {s.praised.length > 0 && <li>Commonly praised: {s.praised.join(", ")}</li>}
        {s.concerns.length > 0 && <li>Common concerns: {s.concerns.join(", ")}</li>}
        {s.repeated > 0 && <li>{s.repeated} reviews share near-identical wording.</li>}
        <li>Purchase verification available for {s.verified} of {s.total} reviews.</li>
      </ul>

      <button className="outline-button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? "Hide individual reviews" : `Show ${s.total} individual reviews`}
      </button>

      {open && (
        <>
          <div className="review-controls">
            <div className="review-tabs" role="group" aria-label="Filter reviews by trust classification">
              {tabs.map((c) => (
                <button key={c} className="priority-chip" aria-pressed={f.cls === c} onClick={() => setF({ ...f, cls: c })}>
                  {c === "all" ? "All reviews" : TRUST_LABEL[c]} ({countOf(c)})
                </button>
              ))}
            </div>
            <div className="review-row">
              <input type="search" value={f.q} placeholder="Search within reviews…" aria-label="Search within reviews"
                onChange={(e) => setF({ ...f, q: e.target.value })} />
              <select value={f.sort} aria-label="Sort reviews" onChange={(e) => setF({ ...f, sort: e.target.value as ReviewFilterState["sort"] })}>
                <option value="recent">Most recent</option>
                <option value="high">Highest rating</option>
                <option value="low">Lowest rating</option>
                <option value="trust">Highest evidence score</option>
              </select>
              <button className="text-button" onClick={() => setF(INIT)}>Clear filters</button>
            </div>
            <small aria-live="polite">Showing {shown.length} of {s.total} reviews</small>
          </div>

          {shown.length === 0 ? (
            <p className="hint">No reviews match these filters. Try clearing them.</p>
          ) : (
            <div className="review-list">
              {shown.map((r) => (
                <article key={r.id} className={`review-card ${r.analysis.cls}`}>
                  <div className="review-top">
                    <strong>{r.reviewerName}</strong>
                    <span className="demo-tag">Demo review</span>
                    <span className="stars" role="img" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  </div>
                  <h4>{r.title}</h4>
                  <p>{r.text}</p>
                  <small>{r.date} · {r.helpfulCount} found helpful (demo) · {r.verifiedPurchase === true ? "Verified purchase" : "Purchase not verified"}</small>
                  <div className="trust-row">
                    <span className={`trust-badge ${r.analysis.cls}`}>{ICON[r.analysis.cls]} {TRUST_LABEL[r.analysis.cls]}</span>
                    <span>Evidence score {r.analysis.score}/100</span>
                  </div>
                  <details>
                    <summary>Why this classification?</summary>
                    <p>{r.analysis.explanation}</p>
                    <ul className="signal-list">
                      {r.analysis.signals.map((g) => (
                        <li key={g.label} className={g.kind}><strong>{KIND[g.kind]}:</strong> {g.label}. {g.detail}</li>
                      ))}
                    </ul>
                    <p className="hint">This analysis cannot confirm whether the reviewer is a real customer, and it does not call any review fake.</p>
                  </details>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}