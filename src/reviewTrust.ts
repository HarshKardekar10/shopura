import type { Product } from "./products";
import { SPEC_META, getReviews, type Review } from "./reviews";

export type TrustClass = "trustworthy" | "suspicious" | "insufficient";
export const TRUST_LABEL: Record<TrustClass, string> = {
  trustworthy: "Appears More Trustworthy",
  suspicious: "Suspicious Signals Detected",
  insufficient: "Not Enough Information",
};

export type ReviewSignal = {
  kind: "positive" | "negative" | "inconclusive";
  label: string;
  detail: string;
  weight: number;
};
export type TrustAnalysis = { score: number; cls: TrustClass; signals: ReviewSignal[]; explanation: string };
export type AnalyzedReview = Review & { analysis: TrustAnalysis };
export type ReviewFilterState = {
  cls: TrustClass | "all";
  sort: "recent" | "high" | "low" | "trust";
  q: string;
};
export type ProductReviewSummary = {
  total: number;
  avg: number;
  counts: Record<TrustClass, number>;
  verified: number;
  repeated: number;
  praised: string[];
  concerns: string[];
  text: string;
};

/**
 * SCORING RULES (evidence score, 0-100, NOT a probability of authenticity)
 * Start at 50. Add/subtract the weights below, clamp to 0-100.
 * - "suspicious"    : negative weights sum to -20 or worse (one weak signal alone is not enough).
 * - "trustworthy"   : documented verification, OR score >= 65 with at least 2 positive signals.
 * - "insufficient"  : everything else. Missing verification is NOT penalised.
 * Limits: text heuristics only. Cannot prove a reviewer is real or fake.
 */
export const WEIGHTS = { verified: 25, specific: 15, measurable: 5, balanced: 10, duplicate: -35, promo: -20, contradiction: -25 };
const BASE = 50;
const SUSPICIOUS_AT = -20;
const SIMILAR_AT = 0.7;
const PROMO_RE = /best product ever|must buy|highly recommend|amazing|five stars|perfect in every way/gi;

const words = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
export const normalize = (t: string) => words(t).join(" ");

/** Jaccard similarity of word sets (0-1). */
export function similarity(a: string, b: string): number {
  const A = new Set(words(a));
  const B = new Set(words(b));
  if (!A.size || !B.size) return 0;
  let shared = 0;
  A.forEach((w) => { if (B.has(w)) shared++; });
  return shared / (A.size + B.size - shared);
}

function analyze(r: Review, all: Review[], specValues: string[]): TrustAnalysis {
  const text = r.text.toLowerCase();
  const signals: ReviewSignal[] = [];
  const add = (kind: ReviewSignal["kind"], label: string, detail: string, weight = 0) =>
    signals.push({ kind, label, detail, weight });

  if (r.verifiedPurchase === true && r.purchaseVerificationSource)
    add("positive", "Documented purchase", `Verified via ${r.purchaseVerificationSource}.`, WEIGHTS.verified);
  else add("inconclusive", "Purchase not verified", "Purchase verification information is not available for this review.");

  const twin = all.find((o) => o.id !== r.id && similarity(r.text, o.text) >= SIMILAR_AT);
  if (twin) add("negative", "Near-identical text", `This text is very similar to another review for this product ("${twin.title}").`, WEIGHTS.duplicate);

  const specific = specValues.some((v) => v.length > 2 && text.includes(v));
  if (specific) add("positive", "Specific product details", "Mentions a feature value that matches the product's listed specifications.", WEIGHTS.specific);
  if (/\d/.test(text) && specific) add("positive", "Measurable detail", "Includes a concrete figure rather than only general praise.", WEIGHTS.measurable);
  if (/\b(but|however|though)\b/.test(text)) add("positive", "Balanced feedback", "Mentions both strengths and limitations.", WEIGHTS.balanced);

  if ((text.match(PROMO_RE)?.length ?? 0) >= 2 && !specific)
    add("negative", "Generic promotional wording", "Broad promotional wording without specific product-use details.", WEIGHTS.promo);

  const contradicts =
    (r.rating >= 4 && /stopped working|broke|waste of money|returned it/.test(text)) ||
    (r.rating <= 2 && /love it|perfect|excellent/.test(text));
  if (contradicts) add("negative", "Rating and text disagree", "The star rating conflicts with what the text says.", WEIGHTS.contradiction);

  if (words(r.text).length < 8) add("inconclusive", "Very short review", "Too little text to assess.");

  const score = Math.max(0, Math.min(100, BASE + signals.reduce((s, x) => s + x.weight, 0)));
  const negSum = signals.filter((s) => s.kind === "negative").reduce((s, x) => s + x.weight, 0);
  const pos = signals.filter((s) => s.kind === "positive");
  const verified = signals.some((s) => s.label === "Documented purchase");
  const cls: TrustClass =
    negSum <= SUSPICIOUS_AT ? "suspicious" : verified || (score >= 65 && pos.length >= 2) ? "trustworthy" : "insufficient";

  const explanation =
    cls === "suspicious"
      ? `Review warrants further checking: ${signals.filter((s) => s.kind === "negative").map((s) => s.label.toLowerCase()).join("; ")}. This is a pattern flag, not proof of manipulation.`
      : cls === "trustworthy"
        ? `Several consistency signals (${pos.map((s) => s.label.toLowerCase()).join(", ")}). Indicative only: purchase can't be confirmed from this data.`
        : "Not enough supporting evidence to judge this review either way.";
  return { score, cls, signals, explanation };
}

const cache = new Map<number, AnalyzedReview[]>();
/** Analysis is per product, so comparisons are small (5 reviews). Nothing is stored on the dataset. */
export function analyzeProduct(p: Product): AnalyzedReview[] {
  const hit = cache.get(p.id);
  if (hit) return hit;
  const rs = getReviews(p);
  const vals = Object.entries(p.specs).filter(([k]) => !SPEC_META.has(k)).map(([, v]) => v.toLowerCase());
  const out = rs.map((r) => ({ ...r, analysis: analyze(r, rs, vals) }));
  cache.set(p.id, out);
  return out;
}

const uniq = (a: string[]) => Array.from(new Set(a));

export function summarize(p: Product): ProductReviewSummary {
  const rs = analyzeProduct(p);
  const counts: Record<TrustClass, number> = { trustworthy: 0, suspicious: 0, insufficient: 0 };
  rs.forEach((r) => { counts[r.analysis.cls]++; });
  const verified = rs.filter((r) => r.verifiedPurchase === true).length;
  const repeated = rs.filter((r) => r.analysis.signals.some((s) => s.label === "Near-identical text")).length;
  const praised = uniq(rs.filter((r) => r.rating >= 4 && r.analysis.cls !== "suspicious" && r.topic !== "General praise").map((r) => r.topic)).slice(0, 3);
  const concerns = uniq(rs.filter((r) => r.rating <= 3).map((r) => r.topic)).slice(0, 3);
  const avg = rs.reduce((s, r) => s + r.rating, 0) / Math.max(rs.length, 1);
  const text =
    `${counts.trustworthy} of ${rs.length} reviews show specific, consistent detail` +
    (counts.suspicious ? `, and ${counts.suspicious} show patterns worth a closer look` : "") +
    `. ${verified === 0 ? "No review has documented purchase verification." : `${verified} have documented verification.`} Treat findings as indicative, not conclusive.`;
  return { total: rs.length, avg, counts, verified, repeated, praised, concerns, text };
}

export function filterReviews(list: AnalyzedReview[], f: ReviewFilterState): AnalyzedReview[] {
  const q = f.q.trim().toLowerCase();
  const sorts: Record<ReviewFilterState["sort"], (a: AnalyzedReview, b: AnalyzedReview) => number> = {
    recent: (a, b) => b.date.localeCompare(a.date),
    high: (a, b) => b.rating - a.rating,
    low: (a, b) => a.rating - b.rating,
    trust: (a, b) => b.analysis.score - a.analysis.score,
  };
  return list
    .filter((r) => (f.cls === "all" || r.analysis.cls === f.cls) && (!q || `${r.title} ${r.text}`.toLowerCase().includes(q)))
    .sort(sorts[f.sort]);
}