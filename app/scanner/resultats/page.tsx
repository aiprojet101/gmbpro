"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { generateAudit, type AuditResult } from "../../lib/mock-score";

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

/* ─── Score Gauge ─── */
function ScoreGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const { ref, visible } = useInView(0.3);

  useEffect(() => {
    if (!visible) return;
    let current = 0;
    const step = score / 60;
    const timer = setInterval(() => {
      current += step;
      if (current >= score) { setAnimatedScore(score); clearInterval(timer); }
      else setAnimatedScore(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, score]);

  const color = score < 40 ? "var(--accent-warm)" : score < 70 ? "#FFB800" : "var(--accent)";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div ref={ref} className="relative w-48 h-48 mx-auto">
      <svg className="w-48 h-48 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--surface-elevated)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="54" fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-mono font-extrabold" style={{ color }}>{animatedScore}</span>
        <span className="text-xs text-[var(--text-muted)] mt-1">/100</span>
      </div>
    </div>
  );
}

/* ─── Category Icons ─── */
const CATEGORY_ICONS: Record<string, string> = {
  "Informations de base": "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  "Contenu visuel": "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  "Engagement": "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  "SEO Local": "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  "Technique": "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
};

/* ─── Pricing mini ─── */
const PLANS = [
  {
    name: "Starter", price: "29", unit: "one-shot",
    features: ["Audit complet 27 criteres", "Refonte complete de la fiche", "Rapport PDF detaille"],
    cta: "Optimiser ma fiche",
  },
  {
    name: "Pro", price: "39", unit: "/mois", recommended: true,
    features: ["Tout Starter inclus", "4 posts Google/mois (IA)", "Suivi positions + dashboard"],
    cta: "Demarrer le Pro",
  },
  {
    name: "Premium", price: "59", unit: "/mois",
    features: ["Tout Pro inclus", "Reponses avis automatiques", "8 posts/mois + support prioritaire"],
    cta: "Passer Premium",
  },
];

/* ─── Main Results Content ─── */
function ResultsContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "Mon etablissement";
  const city = searchParams.get("city") || "Paris";
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setAudit(generateAudit(name, city));
  }, [name, city]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  if (!audit) return null;

  const { globalScore } = audit;
  const scoreColor = globalScore < 40 ? "text-[var(--accent-warm)]" : globalScore < 70 ? "text-yellow-400" : "text-[var(--accent)]";
  const verdict = globalScore < 40
    ? "Votre fiche necessite une optimisation urgente"
    : globalScore < 70
    ? "Votre fiche peut etre amelioree"
    : "Votre fiche est bien optimisee";
  const verdictBg = globalScore < 40
    ? "rgba(255,107,53,0.1)"
    : globalScore < 70
    ? "rgba(255,184,0,0.1)"
    : "rgba(0,229,160,0.1)";

  const recommendedPlan = globalScore > 70 ? 0 : 1; // Starter if good, Pro otherwise

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">

        {/* Header + Score */}
        <Reveal>
          <div className="text-center mb-12">
            <p className="text-sm text-[var(--text-muted)] mb-2 uppercase tracking-wider">Resultats d&apos;audit</p>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-1">{audit.businessName}</h1>
            <p className="text-[var(--text-muted)] mb-8">{audit.city}</p>

            <ScoreGauge score={globalScore} />

            <p className="text-sm text-[var(--text-muted)] mt-4 mb-2">Votre score GmbPro</p>
            <div
              className="inline-block px-5 py-2 rounded-full text-sm font-semibold"
              style={{ background: verdictBg, color: globalScore < 40 ? "var(--accent-warm)" : globalScore < 70 ? "#FFB800" : "var(--accent)" }}
            >
              {verdict}
            </div>

            <div className="flex justify-center gap-8 mt-6 text-sm">
              <div>
                <span className="text-[var(--accent)] font-mono font-bold text-lg">{audit.passedCount}</span>
                <span className="text-[var(--text-muted)] ml-1">passes</span>
              </div>
              <div>
                <span className="text-[var(--accent-warm)] font-mono font-bold text-lg">{audit.failedCount}</span>
                <span className="text-[var(--text-muted)] ml-1">a corriger</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Audit Categories */}
        <div className="space-y-6 mb-16">
          {audit.categories.map((cat, ci) => (
            <Reveal key={ci}>
              <div className="glass-card p-6 md:p-8">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(79,124,255,0.1)" }}>
                      <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={CATEGORY_ICONS[cat.name] || CATEGORY_ICONS["Technique"]} />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold">{cat.name}</h2>
                  </div>
                  <div className="text-sm font-mono font-bold">
                    <span className={cat.score === cat.total ? "text-[var(--accent)]" : cat.score >= cat.total / 2 ? "text-yellow-400" : "text-[var(--accent-warm)]"}>
                      {cat.score}
                    </span>
                    <span className="text-[var(--text-muted)]">/{cat.total}</span>
                  </div>
                </div>

                {/* Sub-progress bar */}
                <div className="h-1.5 rounded-full overflow-hidden mb-5" style={{ background: "var(--surface-elevated)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(cat.score / cat.total) * 100}%`,
                      background: cat.score === cat.total
                        ? "var(--accent)"
                        : cat.score >= cat.total / 2
                        ? "linear-gradient(90deg, #FFB800, var(--accent))"
                        : "linear-gradient(90deg, var(--accent-warm), #FF4444)",
                    }}
                  />
                </div>

                <div className="space-y-3">
                  {cat.criteria.map((cr, cri) => (
                    <div key={cri} className="flex items-start gap-3 py-2 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        cr.passed ? "bg-[rgba(0,229,160,0.15)]" : "bg-[rgba(255,107,53,0.15)]"
                      }`}>
                        {cr.passed ? (
                          <svg className="w-3.5 h-3.5 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 text-[var(--accent-warm)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                            <path d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${cr.passed ? "text-[var(--text)]" : "text-[var(--accent-warm)]"}`}>
                          {cr.label}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{cr.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Comparison section */}
        <Reveal>
          <div className="glass-card p-6 md:p-8 mb-16">
            <h2 className="text-xl font-extrabold mb-6">Vs. la moyenne de votre secteur</h2>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--text)]">Votre score</span>
                  <span className={`font-mono font-bold ${scoreColor}`}>{globalScore}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--surface-elevated)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${globalScore}%`,
                      background: globalScore < 40
                        ? "linear-gradient(90deg, var(--accent-warm), #FF4444)"
                        : globalScore < 70
                        ? "linear-gradient(90deg, #FFB800, var(--accent))"
                        : "linear-gradient(90deg, var(--accent), var(--primary-light))",
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--text-muted)]">Moyenne du secteur</span>
                  <span className="font-mono font-bold text-[var(--text-muted)]">65%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--surface-elevated)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "65%",
                      background: "rgba(136,146,168,0.4)",
                    }}
                  />
                </div>
              </div>
            </div>
            {globalScore < 65 && (
              <p className="text-sm text-[var(--accent-warm)] mt-4 font-semibold">
                Votre fiche est en dessous de la moyenne. Vos concurrents attirent les clients que vous perdez.
              </p>
            )}
          </div>
        </Reveal>

        {/* CTA + Pricing */}
        <Reveal>
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
              GmbPro peut corriger{" "}
              <span className="text-primary">{audit.failedCount} problemes</span>{" "}
              automatiquement
            </h2>
            <p className="text-[var(--text-muted)]">
              Choisissez le forfait adapte a vos besoins
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6 mb-16 stagger">
          {PLANS.map((plan, i) => (
            <Reveal key={i}>
              <div className={`glass-card p-6 h-full flex flex-col relative ${
                i === recommendedPlan ? "pricing-recommended" : ""
              }`} style={i === recommendedPlan ? { borderColor: "var(--primary)" } : {}}>
                {i === recommendedPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-[#0A0E1A] text-xs font-bold px-4 py-1 rounded-full">
                    RECOMMANDE
                  </div>
                )}
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-3xl font-mono font-extrabold">{plan.price}&#8364;</span>
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
                <button className={`w-full justify-center cursor-pointer ${i === recommendedPlan ? "btn-primary" : "btn-outline"}`}>
                  {plan.cta}
                </button>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Share + back */}
        <Reveal>
          <div className="text-center">
            <button
              onClick={handleCopy}
              className="btn-outline cursor-pointer mb-4"
            >
              {copied ? "Lien copie !" : "Partager votre score"}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
            <p className="text-sm text-[var(--text-muted)]">
              <Link href="/scanner" className="text-primary hover:underline">
                Scannez d&apos;autres fiches
              </Link>
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}

export default function ResultatsPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-[var(--text-muted)]">Chargement...</div>
        </div>
      }>
        <ResultsContent />
      </Suspense>
      <Footer />
    </>
  );
}
