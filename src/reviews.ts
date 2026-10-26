import type { Product } from "./products";
import { products } from "./products";

/** All reviews are generated DEMO content. Names, dates, votes are not real customer data. */
export type Review = {
  id: string;
  productId: number;
  reviewerName: string;
  rating: number; // 1-5
  title: string;
  text: string;
  date: string; // ISO yyyy-mm-dd
  verifiedPurchase: boolean | null; // null = unknown. Demo data never claims verification.
  purchaseVerificationSource?: string;
  helpfulCount: number;
  reviewSource: "demo";
  topic: string;
};

export const SPEC_META = new Set(["Product type", "Variant", "Price tier", "Data status"]);
const NAMES = ["Aarav", "Meera", "Rohan", "Isha", "Kabir", "Anaya", "Vikram", "Sana", "Dev", "Tara", "Neil", "Priya"];
const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
type Draft = { rating: number; title: string; text: string; topic: string };

function drafts(p: Product): Record<string, Draft> {
  const specs = Object.entries(p.specs).filter(([k]) => !SPEC_META.has(k));
  const [k1, v1] = specs[0] ?? ["Build", "as listed"];
  const [k2, v2] = specs[1] ?? [k1, v1];
  const con1 = p.cons[p.id % p.cons.length];
  const con2 = p.cons[(p.id + 1) % p.cons.length];
  return {
    A: { rating: 5, title: "Solid for the price", topic: k1,
      text: `I've used the ${k1.toLowerCase()} (${v1}) every day for a few weeks and it does what I needed. Good value for what you get.` },
    B: { rating: 4, title: "Good overall, with caveats", topic: k2,
      text: `The ${k2.toLowerCase()} (${v2}) is fine for my use, but ${lc(con1)}. Worth knowing before you buy.` },
    C: { rating: 3, title: "Decent, with trade-offs", topic: "Trade-offs",
      text: `Works as described for ${p.bestFor[0].toLowerCase()}. However, ${lc(con2)}, so I would wait for a discount.` },
    D: { rating: 2, title: "Not for me", topic: "Trade-offs",
      text: `${con1} was a bigger issue than I expected, and the ${k1.toLowerCase()} (${v1}) did not make up for it.` },
    E: { rating: 5, title: "Best product ever!!!", topic: "General praise",
      text: "Best product ever! Amazing quality, must buy, highly recommend to everyone. Five stars!" },
    E2: { rating: 5, title: "Amazing, must buy", topic: "General praise",
      text: "Best product ever! Amazing quality, must buy, highly recommend. Five stars!" },
    F: { rating: 4, title: "Good", topic: "General praise", text: "Good product." },
    G: { rating: 5, title: "Perfect, love it", topic: "Reliability",
      text: "Love it, perfect in every way. It stopped working after a week though and support never replied." },
    I: { rating: 4, title: "Matches the listing", topic: k2,
      text: `Bought it for ${p.bestFor[1 % p.bestFor.length].toLowerCase()}. The ${k2.toLowerCase()} (${v2}) matches what was listed and setup was simple.` },
  };
}

// Deterministic mix: every product gets A, B, D plus two of these (id % 5).
const EXTRA: string[][] = [["E", "E2"], ["F", "I"], ["G", "I"], ["E", "F"], ["I", "C"]];

const cache = new Map<number, Review[]>();
export function getReviews(p: Product): Review[] {
  const hit = cache.get(p.id);
  if (hit) return hit;
  const d = drafts(p);
  const keys = ["A", "B", "D", ...EXTRA[p.id % 5]];
  const list = keys.map((k, i): Review => ({
    id: `r-${p.id}-${i + 1}`,
    productId: p.id,
    reviewerName: `${NAMES[(p.id + i * 5) % NAMES.length]} (demo)`,
    rating: d[k].rating,
    title: d[k].title,
    text: d[k].text,
    date: new Date(Date.UTC(2026, 5, 30) - ((p.id * 7 + i * 37) % 400) * 864e5).toISOString().slice(0, 10),
    verifiedPurchase: null,
    helpfulCount: (p.id * 3 + i * 7) % 40,
    reviewSource: "demo",
    topic: d[k].topic,
  }));
  cache.set(p.id, list);
  return list;
}

export const allReviewCount = () => products.reduce((n, p) => n + getReviews(p).length, 0);