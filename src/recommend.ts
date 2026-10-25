import { products, type Product, type ProductCategory } from "./products";

export type TypeChoice = "all" | ProductCategory;
export type Prefs = {
  type: TypeChoice;
  budget: number;
  goal: string;
  priorities: string[];
};
export type Fit = { score: number; reasons: string[]; tradeoffs: string[] };

export const VALUE = "Value for money";
export const GOALS = [
  { name: "Best overall", hint: "A balanced pick that leans on ratings" },
  { name: "Best value", hint: "The most capability for the price" },
  { name: "Premium experience", hint: "Top-end features; price matters less" },
];
export const SCORE_NOTE =
  "Match score = 65% your priorities, 20% your goal, 15% sample rating. Only products within your budget are ranked.";

type Rule = { key: string; invert?: boolean; re?: RegExp };
const N = (key: string, invert = false): Rule => ({ key, invert });
const T = (key: string, re: RegExp): Rule => ({ key, re });

// Priority label -> the spec that decides it, per product type.
export const RULES: Record<ProductCategory, Record<string, Rule>> = {
  Laptops: {
    Performance: N("RAM"),
    "Storage space": N("Storage"),
    Portability: N("Display", true),
    "Display quality": T("Display", /2K|QHD|4K/),
  },
  Smartphones: {
    Performance: N("RAM"),
    "Battery life": N("Battery"),
    "Storage space": N("Storage"),
    Camera: T("Camera", /dual|Multi/),
    "Display quality": T("Display", /AMOLED/),
  },
  Tablets: {
    Performance: N("RAM"),
    "Battery life": N("Battery"),
    "Storage space": N("Storage"),
    "Screen size": N("Display"),
  },
  Monitors: {
    "Display quality": T("Display", /QHD|4K/),
    "Smooth motion": N("RefreshRate"),
    Connectivity: T("Connectivity", /USB-C/),
    Ergonomics: T("Adjustment", /swivel/),
  },
  Smartwatches: {
    "Battery life": N("Battery"),
    "Display quality": T("Display", /AMOLED/),
    "Health sensors": T("Sensors", /Multiple|motion/),
    "Water resistance": T("WaterResistance", /ATM|Water resistant/),
  },
  Headphones: {
    "Battery life": N("Battery"),
    "Noise cancellation": T("NoiseControl", /Active|Hybrid/),
    "Fast charging": T("Charging", /fast/),
    Portability: T("Design", /Foldable|Lightweight/),
  },
  "Bluetooth Speakers": {
    "Sound power": N("Output"),
    "Battery life": N("Battery"),
    "Water resistance": T("WaterResistance", /Water-resistant|Splash/),
    Portability: T("Design", /Compact|Rugged/),
  },
  "Air Fryers": {
    Capacity: N("Capacity"),
    "Cooking power": N("Power"),
    "Easy cleaning": T("Cleaning", /dishwasher|Non-stick/),
    "Ease of use": T("Controls", /Digital/),
  },
  "Electric Kettles": {
    Capacity: N("Capacity"),
    "Fast boiling": N("Power"),
    Safety: T("Safety", /protection/),
    "Build quality": T("Body", /Stainless|Double/),
  },
};

export const priorityList = (type: TypeChoice): string[] =>
  type === "all" ? [VALUE] : [VALUE, ...Object.keys(RULES[type])];

export const ceil500 = (n: number) => Math.ceil(n / 500) * 500;
export const floor500 = (n: number) => Math.floor(n / 500) * 500;

const num = (v = ""): number => {
  const m = v.replace(/,/g, "").match(/[\d.]+/);
  if (!m) return 0;
  return /TB/i.test(v) ? parseFloat(m[0]) * 1000 : parseFloat(m[0]);
};

const spans = new Map<string, [number, number]>();
const span = (
  type: TypeChoice,
  key: string,
  get: (p: Product) => number,
): [number, number] => {
  const id = `${type}|${key}`;
  let found = spans.get(id);
  if (!found) {
    const values = products
      .filter((p) => type === "all" || p.type === type)
      .map(get);
    found = [Math.min(...values), Math.max(...values)];
    spans.set(id, found);
  }
  return found;
};

export const priceSpan = (type: TypeChoice) =>
  span(type, "price", (p) => p.price);

const unit = (v: number, [lo, hi]: [number, number]) =>
  hi === lo ? 0.5 : (v - lo) / (hi - lo);

export function evaluate(p: Product, prefs: Prefs): Fit {
  const value = 1 - unit(p.price, priceSpan(p.type));
  const ratingN = Math.min(1, Math.max(0, (p.rating - 3.5) / 1.4));
  const reasons: string[] = [];
  const tradeoffs: string[] = [];
  const parts: number[] = [];

  const note = (name: string, s: number, detail: string) => {
    parts.push(s);
    if (s >= 0.66) reasons.push(`Strong on ${name.toLowerCase()}: ${detail}`);
    else if (s < 0.4) tradeoffs.push(`Weaker on ${name.toLowerCase()}: ${detail}`);
  };

  for (const name of prefs.priorities) {
    if (name === VALUE) {
      note(
        name,
        value,
        value >= 0.5
          ? "priced lower than most similar options"
          : "priced above most similar options",
      );
      continue;
    }
    const rule = RULES[p.type][name];
    if (!rule) continue;
    const raw = p.specs[rule.key] ?? "";
    let s: number;
    if (rule.re) s = rule.re.test(raw) ? 1 : 0.2;
    else {
      const u = unit(num(raw), span(p.type, rule.key, (q) => num(q.specs[rule.key])));
      s = rule.invert ? 1 - u : u;
    }
    note(name, s, `${rule.key} ${raw || "not listed"}`);
  }

  const goalN =
    prefs.goal === "Best value"
      ? value
      : prefs.goal === "Premium experience"
        ? (1 - value + ratingN) / 2
        : ratingN;
  const prio = parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : ratingN;
  if (p.rating >= 4.3) reasons.push(`Rated ${p.rating.toFixed(1)} in the sample data`);

  return {
    score: Math.round(100 * (0.65 * prio + 0.2 * goalN + 0.15 * ratingN)),
    reasons,
    tradeoffs,
  };
}

/** Hard constraints (type, budget) filter first; the rest is ranked. */
export const rank = (prefs: Prefs) =>
  products
    .filter(
      (p) => (prefs.type === "all" || p.type === prefs.type) && p.price <= prefs.budget,
    )
    .map((p) => ({ p, fit: evaluate(p, prefs) }))
    .sort((a, b) => b.fit.score - a.fit.score || a.p.price - b.p.price);