"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { generateAudit } from "../lib/mock-score";
import { supabase } from "../lib/supabase";

/* ─── Types ─── */
interface Suggestion {
  name: string;
  address: string;
  placeId: string;
}

interface AuditResult {
  businessName: string;
  city: string;
  globalScore: number;
  categories: { name: string; criteria: { label: string; passed: boolean; detail: string; source?: string }[]; score: number; total: number }[];
  passedCount: number;
  failedCount: number;
  totalCriteria: number;
  rating?: number;
  reviewCount?: number;
  photoCount?: number;
  hasWebsite?: boolean;
}

/* ─── Scan Messages ─── */
const SCAN_MESSAGES = [
  "Recherche de votre fiche Google...",
  "Analyse des informations de base...",
  "Verification des photos et avis...",
  "Evaluation du referencement local...",
  "Calcul du score final...",
];

/* ─── Hooks ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={`reveal ${visible ? "visible" : ""} ${className}`}>
      {children}
    </div>
  );
}

/* ─── Score Gauge (mini) ─── */
function MiniGauge({ score, size = 140 }: { score: number; size?: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!started) return;
    let current = 0;
    const step = score / 50;
    const timer = setInterval(() => {
      current += step;
      if (current >= score) { setAnimatedScore(score); clearInterval(timer); }
      else setAnimatedScore(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [started, score]);

  const color = score < 40 ? "var(--accent-warm)" : score < 70 ? "#FFB800" : "var(--accent)";
  const r = (size - 16) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg className="-rotate-90" style={{ width: size, height: size }} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-elevated)" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-extrabold" style={{ color, fontSize: size * 0.28 }}>{animatedScore}</span>
        <span className="text-[var(--text-muted)]" style={{ fontSize: size * 0.09 }}>/100</span>
      </div>
    </div>
  );
}

/* ─── Plans data ─── */
const PLANS = [
  {
    name: "Starter", price: "29", unit: "one-shot", slug: "starter",
    features: ["Audit complet 27 criteres", "Refonte complete de la fiche", "Optimisation description & categories", "Rapport PDF detaille"],
    cta: "Optimiser ma fiche",
    best_for: "score > 60",
  },
  {
    name: "Pro", price: "39", unit: "/mois", slug: "pro", recommended: true,
    features: ["Tout Starter inclus", "4 posts Google/mois generes par IA", "Suivi positions en temps reel", "Dashboard + rapport mensuel"],
    cta: "Demarrer le Pro",
    best_for: "score 30-60",
  },
  {
    name: "Premium", price: "59", unit: "/mois", slug: "premium",
    features: ["Tout Pro inclus", "8 posts Google/mois", "Reponses aux avis automatiques (IA)", "Gestion des questions", "Support prioritaire"],
    cta: "Passer Premium",
    best_for: "score < 30",
  },
];

/* ─── Main Page ─── */
export default function ScannerPage() {
  // Form state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const [selectedPlaceId, setSelectedPlaceId] = useState("");

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);

  // Results state
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  /* ─── Autocomplete ─── */
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedName("");
    setSelectedAddress("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
  };

  const handleSelect = (s: Suggestion) => {
    setSelectedName(s.name);
    setSelectedAddress(s.address);
    setSelectedPlaceId(s.placeId);
    setQuery(`${s.name} — ${s.address}`);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ─── Scanning ─── */
  const auditFetchRef = useRef(false);

  useEffect(() => {
    if (!scanning) return;
    auditFetchRef.current = false;

    const steps = SCAN_MESSAGES.length;
    const msgTimer = setInterval(() => {
      setMsgIndex((prev) => {
        if (prev >= steps - 1) { clearInterval(msgTimer); return prev; }
        return prev + 1;
      });
    }, 900);

    const progTimer = setInterval(() => {
      setProgress((prev) => {
        // Slow down near 90% to wait for API
        if (auditFetchRef.current) return prev >= 100 ? 100 : prev + 3;
        return prev >= 85 ? 85 : prev + 1.5;
      });
    }, 80);

    // Call real audit API
    const city = selectedAddress.split(",").pop()?.trim() || "France";
    const name = selectedName || query.split("—")[0]?.trim() || query;

    const doAudit = async () => {
      try {
        if (selectedPlaceId) {
          const res = await fetch(`/api/audit?placeId=${encodeURIComponent(selectedPlaceId)}&name=${encodeURIComponent(name)}&city=${encodeURIComponent(city)}`);
          const data = await res.json();
          if (data.audit && !data.fallback) {
            auditFetchRef.current = true;
            // Wait for progress bar to finish
            await new Promise(r => setTimeout(r, 800));
            setProgress(100);
            await new Promise(r => setTimeout(r, 400));
            setAudit(data.audit);
            setScanning(false);
            setShowResults(true);
            return;
          }
        }
        // Fallback to mock
        auditFetchRef.current = true;
        await new Promise(r => setTimeout(r, 1500));
        setProgress(100);
        await new Promise(r => setTimeout(r, 400));
        const result = generateAudit(name, city);
        setAudit(result);
        setScanning(false);
        setShowResults(true);
      } catch {
        auditFetchRef.current = true;
        await new Promise(r => setTimeout(r, 1000));
        setProgress(100);
        await new Promise(r => setTimeout(r, 400));
        const result = generateAudit(name, city);
        setAudit(result);
        setScanning(false);
        setShowResults(true);
      }
    };

    doAudit();

    return () => {
      clearInterval(msgTimer);
      clearInterval(progTimer);
    };
  }, [scanning, selectedName, selectedAddress, selectedPlaceId, query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setScanning(true);
    setProgress(0);
    setMsgIndex(0);
    setAudit(null);
    setShowResults(false);
  };

  /* ─── Save scan to Supabase (decoupled from main flow) ─── */
  useEffect(() => {
    if (!audit || !showResults) return;
    try {
      supabase.from('scans').insert({
        place_id: selectedPlaceId || null,
        business_name: audit.businessName,
        city: audit.city,
        global_score: audit.globalScore,
        email: null,
      }).then(() => {});
    } catch { /* never block UI */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResults]);

  /* ─── Recommended plan based on score ─── */
  const getRecommendedIndex = (score: number) => {
    if (score < 30) return 2; // Premium
    if (score < 60) return 1; // Pro
    return 0; // Starter
  };

  /* ─── Render ─── */
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20">

        {/* ═══ Scanning overlay ═══ */}
        {scanning && (
          <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: "rgba(10,14,26,0.97)" }}>
            <div className="text-center max-w-md px-6">
              {/* Radar */}
              <div className="relative w-36 h-36 mx-auto mb-8">
                <svg className="w-36 h-36" viewBox="0 0 144 144" fill="none" aria-hidden="true">
                  <circle cx="72" cy="72" r="66" stroke="var(--primary)" strokeWidth="1" opacity="0.12" />
                  <circle cx="72" cy="72" r="44" stroke="var(--primary)" strokeWidth="1" opacity="0.2" />
                  <circle cx="72" cy="72" r="22" stroke="var(--primary)" strokeWidth="1" opacity="0.3" />
                  <circle cx="72" cy="72" r="5" fill="var(--accent)" />
                  <line x1="72" y1="6" x2="72" y2="72" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" opacity="0.8">
                    <animateTransform attributeName="transform" type="rotate" from="0 72 72" to="360 72 72" dur="2s" repeatCount="indefinite" />
                  </line>
                  <path d="M72 72 L72 6 A66 66 0 0 1 129 38 Z" fill="url(#sweep2)" opacity="0.12">
                    <animateTransform attributeName="transform" type="rotate" from="0 72 72" to="360 72 72" dur="2s" repeatCount="indefinite" />
                  </path>
                  <defs>
                    <linearGradient id="sweep2" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <p className="text-lg font-semibold text-[var(--text)] mb-2" key={msgIndex} style={{ animation: "fadeInUp 0.4s ease" }}>
                {SCAN_MESSAGES[msgIndex]}
              </p>
              <p className="text-sm text-[var(--text-muted)] mb-8">{selectedName || query}</p>

              <div className="h-2 rounded-full overflow-hidden mx-auto max-w-xs" style={{ background: "var(--surface-elevated)" }}>
                <div
                  className="h-full rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${progress}%`, background: "linear-gradient(90deg, var(--primary), var(--accent))" }}
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-3 font-mono">{progress}%</p>
            </div>
          </div>
        )}

        {/* ═══ Step 1: Form (hidden when results showing) ═══ */}
        {!showResults && (
          <div className="max-w-2xl mx-auto px-6">
            <Reveal>
              <div className="text-center mb-12">
                <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
                  Analysez votre fiche Google en{" "}
                  <span className="text-primary">30 secondes</span>
                </h1>
                <p className="text-lg text-[var(--text-muted)]">
                  Entrez le nom de votre etablissement pour decouvrir votre score
                </p>
              </div>
            </Reveal>

            <Reveal>
              <form onSubmit={handleSubmit} className="glass-card p-8 md:p-10">
                <div className="mb-6 relative">
                  <label htmlFor="business-search" className="block text-sm font-semibold text-[var(--text)] mb-2">
                    Nom de votre etablissement
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      ref={inputRef}
                      id="business-search"
                      type="text"
                      value={query}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
                      placeholder="Ex: Restaurant Le Comptoir, Boulangerie Dupont..."
                      required
                      autoComplete="off"
                      className="w-full pl-12 pr-4 py-4 rounded-xl text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-base"
                      style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
                    />
                  </div>

                  {/* Autocomplete dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute left-0 right-0 top-full mt-2 z-30 rounded-xl overflow-hidden"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
                        backdropFilter: "blur(20px)",
                      }}
                    >
                      {suggestions.map((s, i) => (
                        <button
                          key={s.placeId}
                          type="button"
                          onClick={() => handleSelect(s)}
                          className="w-full px-5 py-3.5 flex items-start gap-3 hover:bg-[var(--surface-elevated)] transition-colors text-left cursor-pointer"
                          style={{ borderBottom: i < suggestions.length - 1 ? "1px solid var(--border)" : "none" }}
                        >
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(79,124,255,0.1)" }}>
                            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                              <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--text)] truncate">{s.name}</p>
                            <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{s.address}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={scanning || !query.trim()}
                  className="btn-primary w-full justify-center text-lg !py-4 glow-accent cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
                  </svg>
                  Scanner ma fiche
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>

                <p className="text-center text-sm text-[var(--text-muted)] mt-4">
                  Gratuit &middot; Sans inscription &middot; Resultats instantanes
                </p>
              </form>
            </Reveal>

            <Reveal>
              <div className="mt-12 grid grid-cols-3 gap-6 text-center">
                {[
                  { value: "500+", label: "fiches analysees" },
                  { value: "27", label: "criteres verifies" },
                  { value: "30s", label: "temps d'analyse" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="text-2xl font-mono font-extrabold text-primary">{item.value}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        )}

        {/* ═══ Step 2: Mini-rapport inline ═══ */}
        {showResults && audit && (
          <div className="max-w-3xl mx-auto px-6" style={{ animation: "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>

            {/* Score header */}
            <div className="text-center mb-10">
              <p className="text-sm text-[var(--text-muted)] uppercase tracking-widest mb-3">Resultats de l&apos;analyse</p>
              <h1 className="text-2xl md:text-3xl font-extrabold mb-1">{audit.businessName}</h1>
              <p className="text-[var(--text-muted)] mb-8">{audit.city}</p>

              <MiniGauge score={audit.globalScore} />

              <div
                className="inline-block px-5 py-2 rounded-full text-sm font-semibold mt-6"
                style={{
                  background: audit.globalScore < 40 ? "rgba(255,107,53,0.12)" : audit.globalScore < 70 ? "rgba(255,184,0,0.12)" : "rgba(0,229,160,0.12)",
                  color: audit.globalScore < 40 ? "var(--accent-warm)" : audit.globalScore < 70 ? "#FFB800" : "var(--accent)",
                }}
              >
                {audit.globalScore < 40
                  ? "Optimisation urgente recommandee"
                  : audit.globalScore < 70
                  ? "Des ameliorations importantes sont possibles"
                  : "Votre fiche est plutot bien optimisee"}
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="glass-card p-5 text-center">
                <div className="text-3xl font-mono font-extrabold text-[var(--accent)]">{audit.passedCount}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">criteres valides</div>
              </div>
              <div className="glass-card p-5 text-center">
                <div className="text-3xl font-mono font-extrabold text-[var(--accent-warm)]">{audit.failedCount}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">a corriger</div>
              </div>
              {audit.rating !== undefined && audit.rating > 0 && (
                <div className="glass-card p-5 text-center">
                  <div className="text-3xl font-mono font-extrabold text-yellow-400">{audit.rating}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">note moyenne /5</div>
                </div>
              )}
              {audit.reviewCount !== undefined && audit.reviewCount > 0 && (
                <div className="glass-card p-5 text-center">
                  <div className="text-3xl font-mono font-extrabold text-[var(--primary)]">{audit.reviewCount}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">avis Google</div>
                </div>
              )}
            </div>

            {/* Category summary cards */}
            <div className="space-y-4 mb-10">
              <h2 className="text-lg font-bold mb-2">Resume par categorie</h2>
              {audit.categories.map((cat, i) => {
                const pct = Math.round((cat.score / cat.total) * 100);
                const color = pct < 40 ? "var(--accent-warm)" : pct < 70 ? "#FFB800" : "var(--accent)";
                // Show top 2 failed criteria
                const topFails = cat.criteria.filter(c => !c.passed).slice(0, 2);

                return (
                  <div
                    key={i}
                    className="glass-card p-5"
                    style={{ animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s both` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold">{cat.name}</h3>
                      <span className="text-sm font-mono font-bold" style={{ color }}>
                        {cat.score}/{cat.total}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "var(--surface-elevated)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: color,
                          transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                      />
                    </div>
                    {/* Top failed criteria */}
                    {topFails.length > 0 && (
                      <div className="space-y-1.5">
                        {topFails.map((f, fi) => (
                          <div key={fi} className="flex items-center gap-2 text-xs">
                            <svg className="w-3.5 h-3.5 text-[var(--accent-warm)] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                              <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-[var(--text-muted)]">{f.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {topFails.length === 0 && (
                      <p className="text-xs text-[var(--accent)] flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        Tous les criteres sont valides
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* See full report CTA */}
            <div className="text-center mb-12">
              <Link
                href={`/scanner/resultats?name=${encodeURIComponent(audit.businessName)}&city=${encodeURIComponent(audit.city)}`}
                className="btn-outline inline-flex cursor-pointer"
              >
                Voir le rapport complet (27 criteres)
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* ─── Separator ─── */}
            <div className="flex items-center gap-4 mb-10">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Nos solutions</span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>

            {/* ─── Pricing recommendation ─── */}
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
                GmbPro peut corriger{" "}
                <span className="text-primary">{audit.failedCount} probleme{audit.failedCount > 1 ? "s" : ""}</span>{" "}
                automatiquement
              </h2>
              <p className="text-[var(--text-muted)]">
                {audit.globalScore < 40
                  ? "Votre fiche a besoin d'une prise en charge complete. Nous vous recommandons le forfait Premium."
                  : audit.globalScore < 60
                  ? "Un suivi regulier boostera votre visibilite. Le forfait Pro est ideal pour vous."
                  : "Votre fiche a besoin de quelques corrections. Le forfait Starter suffit pour commencer."}
              </p>
            </div>

            {/* Plans */}
            <div className="grid md:grid-cols-3 gap-5 mb-12">
              {PLANS.map((plan, i) => {
                const isRecommended = i === getRecommendedIndex(audit.globalScore);
                return (
                  <div
                    key={i}
                    className={`glass-card p-6 flex flex-col relative ${isRecommended ? "ring-2 ring-primary" : ""}`}
                    style={{
                      animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.6 + i * 0.12}s both`,
                      ...(isRecommended ? { boxShadow: "0 0 30px rgba(79,124,255,0.15)" } : {}),
                    }}
                  >
                    {isRecommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-[#0A0E1A] text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                        RECOMMANDE POUR VOUS
                      </div>
                    )}
                    <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-mono font-extrabold">{plan.price}&euro;</span>
                      <span className="text-[var(--text-muted)] text-sm">{plan.unit}</span>
                    </div>
                    <ul className="space-y-2 mb-6 flex-1">
                      {plan.features.map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                          <svg className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/inscription?plan=${plan.slug}&name=${encodeURIComponent(audit.businessName)}&city=${encodeURIComponent(audit.city)}`}
                      className={`w-full justify-center text-center cursor-pointer ${isRecommended ? "btn-primary glow-accent" : "btn-outline"}`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Scanner another */}
            <div className="text-center">
              <button
                onClick={() => { setShowResults(false); setAudit(null); setQuery(""); setSelectedName(""); setSelectedAddress(""); setSelectedPlaceId(""); }}
                className="text-sm text-primary hover:underline cursor-pointer"
              >
                Scanner une autre fiche
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
