import { useCallback, useEffect, useMemo, useState } from "react";
import { products, productTypes, type Product, type ProductCategory } from "./products";
import {
  GOALS, SCORE_NOTE, VALUE, ceil500, evaluate, floor500,
  priceSpan, priorityList, rank, type Fit, type Prefs, type TypeChoice,
} from "./recommend";
import "./App.css";

type View = "discover" | "saved" | "compare";
type Sort = "match" | "low" | "high" | "rating";
type Msg = { role: "assistant" | "user"; text: string };

const PREFS_KEY = "Shopura-prefs-v2";
const SAVED_KEY = "Shopura-saved";

const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const defaults = (): Prefs => ({
  type: "all", budget: ceil500(priceSpan("all")[1]), goal: GOALS[0].name, priorities: [VALUE],
});

function readPrefs(): Prefs {
  const d = defaults();
  try {
    const v = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null");
    if (!v || typeof v !== "object") return d;
    const type: TypeChoice = v.type === "all" || productTypes.includes(v.type) ? v.type : "all";
    return {
      type,
      budget: typeof v.budget === "number" ? v.budget : d.budget,
      goal: GOALS.some((g) => g.name === v.goal) ? v.goal : d.goal,
      priorities: Array.isArray(v.priorities)
        ? v.priorities.filter((x: unknown): x is string => typeof x === "string")
        : d.priorities,
    };
  } catch {
    return d;
  }
}

function readSaved(): number[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
    const ids = new Set(products.map((p) => p.id));
    return Array.isArray(v) ? v.filter((x): x is number => typeof x === "number" && ids.has(x)) : [];
  } catch {
    return [];
  }
}

function useEscape(fn: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && fn();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [fn]);
}

const TYPE_WORDS: [RegExp, ProductCategory][] = [
  [/laptop/, "Laptops"], [/phone/, "Smartphones"], [/tablet/, "Tablets"],
  [/monitor|screen/, "Monitors"], [/watch/, "Smartwatches"], [/headphone|earphone/, "Headphones"],
  [/speaker/, "Bluetooth Speakers"], [/fryer/, "Air Fryers"], [/kettle/, "Electric Kettles"],
];
const GLOSSARY: [RegExp, string][] = [
  [/\bram\b/, "RAM is working memory. More RAM (16 GB+) helps with multitasking and heavy apps."],
  [/\bssd\b|storage/, "Storage holds your files and apps. SSDs are much faster than older hard drives; 256 GB is tight, 512 GB is comfortable."],
  [/amoled|oled/, "AMOLED/OLED screens give deeper blacks and richer colour than standard LCD/IPS."],
  [/\banc\b|noise/, "ANC (active noise cancellation) uses microphones to cancel steady background noise like engines. It helps most on commutes."],
  [/refresh/, "Refresh rate is how often the screen updates. 60–75 Hz is fine for office work; 120 Hz+ feels smoother for gaming and scrolling."],
  [/\bips\b|\bva\b|panel/, "IPS panels have better colours and viewing angles; VA panels have deeper contrast but weaker angles."],
  [/mah|battery/, "Battery capacity is in mAh, but real battery life also depends on screen, chip and usage. Treat sample figures as illustrative."],
];

function App() {
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);
  const [view, setView] = useState<View>("discover");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("match");
  const [limit, setLimit] = useState(6);
  const [savedIds, setSavedIds] = useState<number[]>(readSaved);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [notice, setNotice] = useState("");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hi! Ask for a recommendation (e.g. “best laptop under 50000”), what a spec means, or how to compare." },
  ]);

  useEffect(() => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* storage unavailable */ } }, [prefs]);
  useEffect(() => { try { localStorage.setItem(SAVED_KEY, JSON.stringify(savedIds)); } catch { /* storage unavailable */ } }, [savedIds]);
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const personalised = prefs.type !== "all";
  const [lo, hi] = priceSpan(prefs.type);

  const { list, cheapest } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const match = (p: Product) =>
      !q || [p.name, p.brand, p.type, ...Object.values(p.specs)].join(" ").toLowerCase().includes(q);
    const ranked = rank(prefs).filter(({ p }) => match(p));
    const sorters: Record<Sort, (a: typeof ranked[number], b: typeof ranked[number]) => number> = {
      match: () => 0,
      low: (a, b) => a.p.price - b.p.price,
      high: (a, b) => b.p.price - a.p.price,
      rating: (a, b) => b.p.rating - a.p.rating,
    };
    const sorted = [...ranked].sort(sorters[sort]);
    const pool = products.filter((p) => (prefs.type === "all" || p.type === prefs.type) && match(p));
    const cheapest = pool.length ? pool.reduce((a, b) => (a.price <= b.price ? a : b)) : undefined;
    return { list: sorted, cheapest };
  }, [prefs, search, sort]);

  const byIds = (ids: number[]) => products.filter((p) => ids.includes(p.id));
  const savedProducts = useMemo(() => byIds(savedIds), [savedIds]);
  const compareProducts = useMemo(() => byIds(compareIds), [compareIds]);

  const toggleSaved = (id: number) =>
    setSavedIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const toggleCompare = (p: Product) => {
    if (compareIds.includes(p.id)) return setCompareIds((c) => c.filter((x) => x !== p.id));
    if (compareIds.length >= 3) return setNotice("You can compare up to 3 products. Remove one first.");
    if (compareProducts[0] && compareProducts[0].type !== p.type)
      return setNotice(`Specs only compare fairly within one type. You're comparing ${compareProducts[0].type}; clear them to compare ${p.type}.`);
    setCompareIds((c) => [...c, p.id]);
  };

  const setType = (type: TypeChoice) =>
    setPrefs((c) => ({ ...c, type, budget: ceil500(priceSpan(type)[1]), priorities: [VALUE] }));

  const reasonFor = (fit: Fit, p: Product) =>
    personalised ? fit.reasons[0] ?? fit.tradeoffs[0] ?? "Within your budget" : p.bestFor[0];

  const sendAssistant = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const lower = text.toLowerCase();
    const type = TYPE_WORDS.find(([re]) => re.test(lower))?.[1];
    const m = lower.match(/(\d[\d,]*)\s*(k)?\b/);
    const parsed = m ? parseInt(m[1].replace(/,/g, ""), 10) * (m[2] ? 1000 : 1) : 0;
    const budget = parsed >= 500 ? parsed : undefined;
    const gloss = GLOSSARY.find(([re]) => re.test(lower));
    let reply: string;

    if (gloss && /what|mean|explain|\?/.test(lower) && !budget) {
      reply = gloss[1];
    } else if (type || (budget && personalised) || /recommend|best|suggest|which/.test(lower)) {
      const t: TypeChoice | undefined = type ?? (personalised ? prefs.type : undefined);
      if (!t) {
        reply = "Which product type are you after? For example: laptops, headphones or air fryers.";
      } else {
        const same = t === prefs.type;
        const next: Prefs = {
          ...prefs, type: t,
          budget: budget ?? (same ? prefs.budget : ceil500(priceSpan(t)[1])),
          priorities: same ? prefs.priorities : [VALUE],
        };
        const top = rank(next).slice(0, 3);
        setPrefs(next);
        setView("discover");
        reply = top.length
          ? `I've set your filters to ${t} up to ${formatPrice(next.budget)}. Top picks:\n` +
            top.map(({ p, fit }, i) => `${i + 1}. ${p.name} (${formatPrice(p.price)}, ${fit.score}% match). ${fit.reasons[0] ?? "Within budget"}`).join("\n")
          : `Nothing in ${t} fits ${formatPrice(next.budget)}. The cheapest starts at ${formatPrice(priceSpan(t)[0])}.`;
      }
    } else if (/compare/.test(lower)) {
      reply = compareProducts.length >= 2
        ? `You're comparing ${compareProducts.map((p) => p.name).join(" vs ")}. Open Compare to see the differences side by side.`
        : "Tap “+ Compare” on 2–3 products of the same type, then open Compare.";
    } else if (/saved|save|wishlist/.test(lower)) {
      reply = `You have ${savedProducts.length} saved product${savedProducts.length === 1 ? "" : "s"}.`;
    } else {
      reply = "I can recommend products by type and budget, explain specs (RAM, ANC, AMOLED…), or help with comparing. I only know this demo catalogue. Try “best headphones under 3000”.";
    }
    setMessages((c) => [...c, { role: "user", text }, { role: "assistant", text: reply }]);
    setAssistantInput("");
  };

  const goTo = (v: View) => { setView(v); window.scrollTo({ top: 0 }); };
  const closeDetails = useCallback(() => setSelected(null), []);
  const closeQuiz = useCallback(() => setShowQuiz(false), []);

  const card = (p: Product, fit: Fit | undefined, badge?: string) => (
    <ProductCard
      key={p.id} product={p} badge={badge}
      score={personalised && fit ? fit.score : undefined}
      reason={fit ? reasonFor(fit, p) : p.bestFor[0]}
      saved={savedIds.includes(p.id)} compared={compareIds.includes(p.id)}
      onSave={() => toggleSaved(p.id)} onCompare={() => toggleCompare(p)} onDetails={() => setSelected(p)}
    />
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => goTo("discover")} aria-label="Shopura home">
          <span className="brand-mark">C</span>
          <span><strong>Shopura</strong><small>CHOOSE CLEARLY</small></span>
        </button>
        <nav className="main-nav" aria-label="Main navigation">
          {(["discover", "saved", "compare"] as View[]).map((v) => (
            <button key={v} className={view === v ? "nav-link active" : "nav-link"} onClick={() => goTo(v)}>
              {v[0].toUpperCase() + v.slice(1)}
              {v === "saved" && <span className="nav-count">{savedIds.length}</span>}
              {v === "compare" && <span className="nav-count">{compareIds.length}</span>}
            </button>
          ))}
        </nav>
        <button className="primary-button" onClick={() => setShowQuiz(true)}>✦ {personalised ? "Edit my answers" : "Take the quiz"}</button>
      </header>

      {notice && <div className="notice" role="status">{notice}</div>}

      <main>
        {view === "discover" && (
          <>
            <section className="hero-section">
              <div className="hero-copy">
                <span className="eyebrow">LESS BROWSING. BETTER DECISIONS.</span>
                <h1>Don’t scroll. <span>Decide.</span></h1>
                <p>Answer four quick questions and get a ranked shortlist that shows why each product fits, and where it compromises.</p>
                <div className="hero-actions">
                  <button className="primary-button" onClick={() => setShowQuiz(true)}>Start the guided quiz →</button>
                  <button className="text-button" onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}>Or browse all products ↓</button>
                </div>
              </div>
            </section>

            <section className="trust-strip" aria-label="How Shopura works">
              <div><span className="trust-icon">1</span><span><strong>Tell us what matters</strong><small>Type, budget, goal, priorities</small></span></div>
              <div><span className="trust-icon">2</span><span><strong>Get a ranked shortlist</strong><small>With reasons and trade-offs</small></span></div>
              <div><span className="trust-icon">3</span><span><strong>Compare and decide</strong><small>Side by side, same type</small></span></div>
            </section>
            <section className="catalog-section" id="catalog">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">{personalised ? "YOUR SHORTLIST" : "BROWSE THE CATALOGUE"}</span>
                  <h2>{personalised ? `${prefs.type} for you` : "Find what fits your life."}</h2>
                  <p>{personalised
                    ? `Up to ${formatPrice(prefs.budget)} · ${prefs.goal}${prefs.priorities.length ? " · " + prefs.priorities.join(", ") : ""}`
                    : "Take the quiz for a personalised ranking, or filter by yourself."}</p>
                </div>
                <button className="text-button" onClick={() => { setPrefs(defaults()); setSearch(""); setSort("match"); setLimit(6); }}>Reset all ↺</button>
              </div>

              <div className="filter-panel">
                <div className="search-wrap">
                  <span aria-hidden="true">⌕</span>
                  <input type="search" placeholder="Search products, brands or specs…" value={search}
                    onChange={(e) => { setSearch(e.target.value); setLimit(6); }} aria-label="Search products" />
                  {search && <button className="clear-search" onClick={() => setSearch("")} aria-label="Clear search">×</button>}
                </div>

                <div className="category-tabs" aria-label="Product types">
                  {(["all", ...productTypes] as TypeChoice[]).map((t) => (
                    <button key={t} aria-pressed={prefs.type === t} onClick={() => { setType(t); setLimit(6); }}>
                      {t === "all" ? "All products" : t}
                    </button>
                  ))}
                </div>

                <div className="filter-row">
                  <label>
                    <span>Budget up to </span><strong>{formatPrice(prefs.budget)}</strong>
                    <input type="range" min={floor500(lo)} max={ceil500(hi)} step={500} value={prefs.budget}
                      onChange={(e) => setPrefs((c) => ({ ...c, budget: Number(e.target.value) }))} />
                  </label>
                  <label>
                    <span>Sort by </span>
                    <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                      <option value="match">Best match</option>
                      <option value="low">Price: low to high</option>
                      <option value="high">Price: high to low</option>
                      <option value="rating">Sample rating</option>
                    </select>
                  </label>
                </div>

                <div className="priority-area">
                  <span className="priority-label">YOUR PRIORITIES</span>
                  {personalised ? (
                    <div className="priority-chips">
                      {priorityList(prefs.type).map((name) => {
                        const on = prefs.priorities.includes(name);
                        return (
                          <button key={name} className={on ? "priority-chip selected" : "priority-chip"} aria-pressed={on}
                            onClick={() => setPrefs((c) => ({ ...c, priorities: on ? c.priorities.filter((x) => x !== name) : [...c.priorities, name] }))}>
                            {on ? "✓ " : "+ "}{name}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="hint">Pick a product type above to choose priorities that make sense for it.</p>
                  )}
                </div>
              </div>

              <div className="results-heading">
                <div>
                  <h3>{personalised ? "Ranked for you" : "All matching products"} <span className="result-count">{list.length}</span></h3>
                  {personalised && <p className="hint">{SCORE_NOTE} Ratings and reviews are demo data.</p>}
                </div>
              </div>

              {list.length > 0 ? (
                <>
                  <div className="product-grid">
                    {list.slice(0, limit).map(({ p, fit }, i) =>
                      card(p, fit, personalised && sort === "match" && i === 0 ? "Top match" : undefined))}
                  </div>
                  {list.length > limit && (
                    <div className="more-results">
                      <span>Showing {limit} of {list.length}. </span>
                      <button className="outline-button" onClick={() => setLimit((l) => l + 6)}>Show 6 more</button>
                    </div>
                  )}
                </>
              ) : cheapest ? (
                <EmptyState
                  title="Nothing fits that budget."
                  description={`No ${prefs.type === "all" ? "product" : prefs.type.toLowerCase()} is priced at or below ${formatPrice(prefs.budget)}. The cheapest option is ${formatPrice(cheapest.price)}. We won't show products over your limit as if they were a match.`}
                  actionLabel={`Raise budget to ${formatPrice(ceil500(cheapest.price))}`}
                  onAction={() => setPrefs((c) => ({ ...c, budget: ceil500(cheapest.price) }))}
                />
              ) : (
                <EmptyState title="No products match your search." description="Try a different word, or clear the search." actionLabel="Clear search" onAction={() => setSearch("")} />
              )}
            </section>
          </>
        )}

        {view === "saved" && (
          <section className="secondary-page">
            <span className="eyebrow">YOUR COLLECTION</span>
            <h1>Saved products</h1>
            <p className="page-description">Keep your options together while you decide. Saved items stay on this device.</p>
            {savedProducts.length ? (
              <div className="product-grid">{savedProducts.map((p) => card(p, personalised && p.type === prefs.type ? evaluate(p, prefs) : undefined))}</div>
            ) : (
              <EmptyState title="Nothing saved yet." description="Tap the heart on any product to keep it here." actionLabel="Browse products" onAction={() => goTo("discover")} />
            )}
          </section>
        )}

        {view === "compare" && (
          <section className="secondary-page">
            <span className="eyebrow">MAKE THE DIFFERENCES CLEAR</span>
            <h1>Compare your finalists</h1>
            <p className="page-description">Pick 2–3 products of the same type. Specs are only comparable within a type.</p>
            {compareProducts.length > 0 && (
              <div className="chip-row">
                {compareProducts.map((p) => (
                  <span className="chip" key={p.id}>{p.name}<button onClick={() => toggleCompare(p)} aria-label={`Remove ${p.name}`}>×</button></span>
                ))}
                <button className="text-button" onClick={() => setCompareIds([])}>Clear all</button>
              </div>
            )}
            {compareProducts.length >= 2 ? <CompareTable items={compareProducts} prefs={prefs} /> : (
              <EmptyState title="Choose at least two products."
                description={`You've selected ${compareProducts.length} of the 2–3 needed.`}
                actionLabel="Find products" onAction={() => goTo("discover")} />
            )}
          </section>
        )}
      </main>

      <footer className="app-footer">
        <div><span className="brand-mark small">C</span><strong>Shopura</strong></div>
        <p>A shopping-decision prototype using illustrative demo data. Prices, specs and reviews are not verified; check before buying.</p>
        <span>Made for clearer choices.</span>
      </footer>

      {showQuiz && (
        <QuizModal initial={prefs} onClose={closeQuiz}
          onApply={(p) => { setPrefs(p); setLimit(6); setShowQuiz(false); setView("discover"); window.setTimeout(() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }), 50); }} />
      )}

      {selected && (
        <DetailsModal product={selected}
          fit={personalised && selected.type === prefs.type ? evaluate(selected, prefs) : undefined}
          saved={savedIds.includes(selected.id)} compared={compareIds.includes(selected.id)}
          onSave={() => toggleSaved(selected.id)} onCompare={() => toggleCompare(selected)} onClose={closeDetails} />
      )}

      <button className="assistant-launcher" onClick={() => setAssistantOpen((o) => !o)}
        aria-label={assistantOpen ? "Close shopping assistant" : "Open shopping assistant"}>
        {assistantOpen ? "×" : "✦"}{!assistantOpen && <span>Ask the assistant</span>}
      </button>

      {assistantOpen && (
        <section className="assistant-panel" aria-label="Shopping assistant">
          <header>
            <div><strong>Shopura Assistant</strong><small>Rule-based · demo catalogue only</small></div>
            <button onClick={() => setAssistantOpen(false)} aria-label="Close assistant">×</button>
          </header>
          <div className="assistant-messages" aria-live="polite">
            {messages.map((m, i) => <div key={i} className={`assistant-message ${m.role}`}>{m.text}</div>)}
            {messages.length < 2 && (
              <div className="chip-row">
                {["Best laptop under 50000", "What is ANC?", "How do I compare?"].map((s) => (
                  <button key={s} className="priority-chip" onClick={() => sendAssistant(s)}>{s}</button>
                ))}
              </div>
            )}
          </div>
          <form className="assistant-form" onSubmit={(e) => { e.preventDefault(); sendAssistant(assistantInput); }}>
            <input value={assistantInput} onChange={(e) => setAssistantInput(e.target.value)}
              placeholder="e.g. best kettle under 2000" aria-label="Message the shopping assistant" />
            <button type="submit" aria-label="Send message">↑</button>
          </form>
        </section>
      )}
    </div>
  );
}

function ProductCard({ product, badge, score, reason, saved, compared, onSave, onCompare, onDetails }: {
  product: Product; badge?: string; score?: number; reason?: string; saved: boolean; compared: boolean;
  onSave: () => void; onCompare: () => void; onDetails: () => void;
}) {
  return (
    <article className="product-card">
      <div className="product-image-wrap" onClick={onDetails}>
        <img className="product-image" src={product.image} alt={product.name} loading="lazy"
          onError={(e) => { e.currentTarget.style.display = "none"; }} />
        {badge && <span className="recommendation-badge">{badge}</span>}
      </div>
      <button className={saved ? "save-button saved" : "save-button"} onClick={onSave}
        aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save product"}>{saved ? "♥" : "♡"}</button>
      <div className="product-card-body">
        <div className="product-meta"><span>{product.brand}</span><span>★ {product.rating.toFixed(1)} (demo)</span></div>
        <h3>{product.name}</h3>
        <p className="card-type">{product.type}</p>
        <p className="card-reason">{reason}</p>
        <div className="product-price">
          <strong>{formatPrice(product.price)}</strong>
          {score !== undefined && <span>{score}% match</span>}
        </div>
        <div className="card-actions">
          <button className="primary-button compact" onClick={onDetails}>View details</button>
          <button className={compared ? "compare-button selected" : "compare-button"} onClick={onCompare} aria-pressed={compared}>
            {compared ? "✓ Added" : "+ Compare"}
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ title, description, actionLabel, onAction }: {
  title: string; description: string; actionLabel: string; onAction: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">⌕</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="primary-button" onClick={onAction}>{actionLabel}</button>
    </div>
  );
}

function CompareTable({ items, prefs }: { items: Product[]; prefs: Prefs }) {
  const sameType = prefs.type === items[0].type;
  const fits = items.map((p) => (sameType ? evaluate(p, prefs) : undefined));
  const cheapest = Math.min(...items.map((p) => p.price));
  const bestScore = Math.max(...fits.map((f) => f?.score ?? -1));
  const skip = new Set(["Product type", "Data status", "Variant"]);
  const keys = Array.from(new Set(items.flatMap((p) => Object.keys(p.specs)))).filter((k) => !skip.has(k));
  return (
    <div className="comparison-wrap">
      <table className="comparison-table">
        <thead>
          <tr><th>Specification</th>{items.map((p) => <th key={p.id}><div>{p.name}</div><small>{p.brand}</small></th>)}</tr>
        </thead>
        <tbody>
          <tr><th>Price</th>{items.map((p) => <td key={p.id} className={p.price === cheapest ? "best-cell" : ""}>{formatPrice(p.price)}{p.price === cheapest && " · lowest"}</td>)}</tr>
          <tr><th>Match for you</th>{fits.map((f, i) => (
            <td key={items[i].id} className={f && f.score === bestScore ? "best-cell" : ""}>
              {f ? <>{f.score}%<br /><small>{f.reasons[0] ?? f.tradeoffs[0] ?? ""}</small></> : "Take the quiz for this type"}
            </td>
          ))}</tr>
          <tr><th>Sample rating</th>{items.map((p) => <td key={p.id}>★ {p.rating.toFixed(1)} (demo)</td>)}</tr>
          {keys.map((k) => (
            <tr key={k}><th>{k}</th>{items.map((p) => <td key={p.id}>{p.specs[k] ?? "Not specified"}</td>)}</tr>
          ))}
          <tr><th>Trade-offs</th>{items.map((p, i) => (
            <td key={p.id}><ul>{(fits[i]?.tradeoffs.length ? fits[i]!.tradeoffs : p.cons.slice(0, 2)).map((c) => <li key={c}>{c}</li>)}</ul></td>
          ))}</tr>
        </tbody>
      </table>
    </div>
  );
}

function QuizModal({ initial, onApply, onClose }: {
  initial: Prefs; onApply: (p: Prefs) => void; onClose: () => void;
}) {
  useEscape(onClose);
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Prefs>(initial);
  const [lo, hi] = priceSpan(d.type);
  const options = priorityList(d.type);
  const valid = [d.type !== "all", d.budget >= floor500(lo), true, d.priorities.length > 0][step];
  const last = step === 3;
  const togglePriority = (name: string) =>
    setD((c) => c.priorities.includes(name)
      ? { ...c, priorities: c.priorities.filter((x) => x !== name) }
      : c.priorities.length >= 3 ? c : { ...c, priorities: [...c.priorities, name] });

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="preferences-modal" role="dialog" aria-modal="true" aria-labelledby="quiz-title">
        <div className="modal-heading">
          <div>
            <span className="eyebrow">STEP {step + 1} OF 4</span>
            <h2 id="quiz-title">{["What are you shopping for?", "What’s your maximum budget?", "What’s your goal?", "What matters most? (pick up to 3)"][step]}</h2>
            <div className="quiz-progress" aria-hidden="true"><span style={{ width: `${((step + 1) / 4) * 100}%` }} /></div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close quiz">×</button>
        </div>

        <div className="quiz-body">
          {step === 0 && (
            <div className="type-grid">
              {productTypes.map((t) => (
                <button key={t} className={d.type === t ? "type-option selected" : "type-option"} aria-pressed={d.type === t}
                  onClick={() => setD({ ...d, type: t, budget: ceil500(priceSpan(t)[1]), priorities: [VALUE] })}>{t}</button>
              ))}
            </div>
          )}
          {step === 1 && (
            <div className="quiz-field">
              <div className="range-heading"><label htmlFor="q-budget">Maximum budget for {d.type}</label><strong>{formatPrice(d.budget)}</strong></div>
              <input id="q-budget" type="range" min={floor500(lo)} max={ceil500(hi)} step={500} value={d.budget}
                onChange={(e) => setD({ ...d, budget: Number(e.target.value) })} />
              <div className="range-labels"><span>{formatPrice(floor500(lo))}</span><span>{formatPrice(ceil500(hi))}</span></div>
              <p className="hint">Products above this are never shown as matches.</p>
            </div>
          )}
          {step === 2 && (
            <div className="type-grid one-col">
              {GOALS.map((g) => (
                <button key={g.name} className={d.goal === g.name ? "type-option selected" : "type-option"} aria-pressed={d.goal === g.name}
                  onClick={() => setD({ ...d, goal: g.name })}>
                  <strong>{g.name}</strong><small>{g.hint}</small>
                </button>
              ))}
            </div>
          )}
          {step === 3 && (
            <>
              <div className="priority-chips">
                {options.map((name) => {
                  const on = d.priorities.includes(name);
                  return <button key={name} type="button" className={on ? "priority-chip selected" : "priority-chip"} aria-pressed={on} onClick={() => togglePriority(name)}>{on ? "✓ " : "+ "}{name}</button>;
                })}
              </div>
              {d.priorities.length === 0 && <p className="hint">Choose at least one so we can rank for you.</p>}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="text-button" onClick={() => (step === 0 ? onClose() : setStep(step - 1))}>{step === 0 ? "Cancel" : "← Back"}</button>
          <button className="primary-button" disabled={!valid} onClick={() => (last ? onApply(d) : setStep(step + 1))}>
            {last ? "Show my shortlist →" : "Next →"}
          </button>
        </div>
      </section>
    </div>
  );
}

function DetailsModal({ product: p, fit, saved, compared, onSave, onCompare, onClose }: {
  product: Product; fit?: Fit; saved: boolean; compared: boolean;
  onSave: () => void; onCompare: () => void; onClose: () => void;
}) {
  useEscape(onClose);
  const good = p.reviews.filter((r) => r.sentiment === "positive");
  const bad = p.reviews.filter((r) => r.sentiment === "negative");
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="details-modal" role="dialog" aria-modal="true" aria-labelledby="details-title">
        <div className="details-topbar">
          <span className="eyebrow">PRODUCT OVERVIEW</span>
          <button className="modal-close" onClick={onClose} aria-label="Close product details">×</button>
        </div>

        <div className="details-head">
          <div className="details-image"><img src={p.image} alt={p.name} /></div>
          <div>
            <span className="details-type">{p.brand} · {p.type}</span>
            <h2 id="details-title">{p.name}</h2>
            <div className="details-rating">★ {p.rating.toFixed(1)} <small>demo rating · {p.reviewCount.toLocaleString("en-IN")} sample reviews</small></div>
            <strong className="details-price">{formatPrice(p.price)}</strong>
            {fit && <p className="match-pill">{fit.score}% match for your answers</p>}
            <div className="details-actions">
              <button className="primary-button" onClick={onSave}>{saved ? "♥ Saved" : "♡ Save"}</button>
              <button className="outline-button" onClick={onCompare}>{compared ? "✓ In comparison" : "+ Compare"}</button>
            </div>
          </div>
        </div>

        {fit && (fit.reasons.length > 0 || fit.tradeoffs.length > 0) && (
          <div className="two-col">
            <div className="details-section"><h3>Why it fits you</h3>
              {fit.reasons.length ? <ul className="pros-list">{fit.reasons.map((r) => <li key={r}>{r}</li>)}</ul> : <p>No standout strengths on your priorities.</p>}
            </div>
            <div className="details-section"><h3>Where it compromises</h3>
              {fit.tradeoffs.length ? <ul className="cons-list">{fit.tradeoffs.map((r) => <li key={r}>{r}</li>)}</ul> : <p>No weak spots on your priorities.</p>}
            </div>
          </div>
        )}

        <div className="details-section">
          <h3>Specifications</h3>
          <dl className="spec-list">
            {Object.entries(p.specs).filter(([k]) => k !== "Data status").map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </div>

        <div className="two-col">
          <div className="details-section"><h3>Potential strengths</h3><ul className="pros-list">{p.pros.map((x) => <li key={x}>{x}</li>)}</ul></div>
          <div className="details-section"><h3>Trade-offs to consider</h3><ul className="cons-list">{p.cons.map((x) => <li key={x}>{x}</li>)}</ul></div>
        </div>

        <div className="details-section">
          <h3>Review themes</h3>
          <p className="review-disclaimer">{p.reviewSource}</p>
          {p.reviews.length ? (
            <div className="two-col flush">
              <div><strong>What reviewers like</strong><ul className="pros-list">{good.map((r) => <li key={r.text}>{r.text}</li>)}</ul></div>
              <div><strong>What to watch</strong><ul className="cons-list">{bad.map((r) => <li key={r.text}>{r.text}</li>)}</ul></div>
            </div>
          ) : <p>No review examples for this product.</p>}
        </div>

        <p className="data-source-note">Source: {p.dataSource}. Verify specifications, prices and availability before purchasing.</p>
      </section>
    </div>
  );
}

export default App;