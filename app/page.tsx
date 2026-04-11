"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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

function CountUp({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const { ref, visible } = useInView();
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target]);
  return <span ref={ref} className="font-mono font-extrabold">{prefix}{val}{suffix}</span>;
}

/* ─── Icons (inline SVG) ─── */

function RadarIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" opacity="0.3" />
      <circle cx="12" cy="12" r="6" opacity="0.6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <line x1="12" y1="2" x2="12" y2="12" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="3s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

function IconCard({ d }: { d: string }) {
  return (
    <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  incomplete: "M9 12h6M12 9v6M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  posts: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2",
  reviews: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  scan: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  optimize: "M13 10V3L4 14h7v7l9-11h-7z",
  chart: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  smart: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  content: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  reply: "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6",
  tracking: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  report: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  check: "M5 13l4 4L19 7",
  chevron: "M19 9l-7 7-7-7",
  star: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
};

/* ─── Star Rating ─── */
function Stars({ count, color = "text-accent-warm" }: { count: number; color?: string }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} etoiles sur 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`w-4 h-4 ${i <= count ? color : "text-gray-600"}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d={ICONS.star} />
        </svg>
      ))}
    </div>
  );
}

/* ─── GMB Card (WOW moment) ─── */
function GmbCard() {
  const { ref, visible } = useInView(0.3);
  const [optimized, setOptimized] = useState(false);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setOptimized(true), 1500);
      return () => clearTimeout(t);
    }
  }, [visible]);

  return (
    <div ref={ref} className="gmb-card w-full max-w-md mx-auto" role="img" aria-label="Transformation d'une fiche Google Business de mauvaise a optimisee">
      <div
        className={`gmb-card-inner rounded-2xl overflow-hidden transition-all duration-1000 ${
          optimized ? "glow-accent" : ""
        }`}
        style={{ background: optimized ? "rgba(0,229,160,0.05)" : "rgba(255,107,53,0.05)", border: `1px solid ${optimized ? "rgba(0,229,160,0.3)" : "rgba(255,107,53,0.3)"}` }}
      >
        {/* Header */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Restaurant Le Comptoir</h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Restaurant francais</p>
            </div>
            <div className={`text-xs font-bold px-3 py-1 rounded-full transition-all duration-700 ${
              optimized ? "bg-accent/20 text-accent" : "bg-accent-warm/20 text-accent-warm"
            }`}>
              {optimized ? "Optimisee" : "Non optimisee"}
            </div>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-2 mb-4">
            <Stars count={optimized ? 5 : 2} color={optimized ? "text-accent" : "text-accent-warm"} />
            <span className="text-sm font-mono transition-all duration-700" style={{ color: optimized ? "var(--accent)" : "var(--accent-warm)" }}>
              {optimized ? "4.8" : "2.1"}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              ({optimized ? "127 avis" : "3 avis"})
            </span>
          </div>

          {/* Score bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: "var(--text-muted)" }}>Score d&apos;optimisation</span>
              <span className="font-mono font-bold transition-all duration-700" style={{ color: optimized ? "var(--accent)" : "var(--accent-warm)" }}>
                {optimized ? "94%" : "23%"}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-elevated)" }}>
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: optimized ? "94%" : "23%",
                  background: optimized
                    ? "linear-gradient(90deg, var(--accent), var(--primary-light))"
                    : "linear-gradient(90deg, var(--accent-warm), #FF4444)",
                }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            {[
              { label: "Description complete", bad: false, good: true },
              { label: "Horaires renseignes", bad: false, good: true },
              { label: "Photos ajoutees", bad: false, good: true },
              { label: "Categories optimisees", bad: false, good: true },
              { label: "Posts recents", bad: false, good: true },
              { label: "Avis avec reponses", bad: false, good: true },
            ].map((item, i) => {
              const active = optimized ? item.good : item.bad;
              return (
                <div key={i} className="flex items-center gap-2 text-sm transition-all duration-500" style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                    active ? "bg-accent/20" : "bg-accent-warm/20"
                  }`}>
                    {active ? (
                      <svg className="w-3 h-3 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d={ICONS.check} /></svg>
                    ) : (
                      <span className="text-accent-warm text-xs font-bold">!</span>
                    )}
                  </div>
                  <span style={{ color: active ? "var(--text)" : "var(--text-muted)" }}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── FAQ Item ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
        aria-expanded={open}
      >
        <span className="font-semibold text-[var(--text)] pr-4">{q}</span>
        <svg
          className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"
        >
          <path d={ICONS.chevron} />
        </svg>
      </button>
      <div className={`faq-content ${open ? "open" : ""}`}>
        <p className="px-5 pb-5 text-[var(--text-muted)] leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Home() {
  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 glass" role="banner">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between" aria-label="Navigation principale">
          <button onClick={() => scrollTo("hero")} className="flex items-center gap-2 cursor-pointer" aria-label="GmbPro accueil">
            <RadarIcon className="w-7 h-7 text-primary" />
            <span className="text-xl font-extrabold text-[var(--text)]">GmbPro</span>
          </button>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo("features")} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer">Fonctionnalites</button>
            <button onClick={() => scrollTo("pricing")} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer">Tarifs</button>
            <button onClick={() => scrollTo("faq")} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer">FAQ</button>
            <button onClick={() => scrollTo("hero")} className="btn-primary text-sm !py-2 !px-5 cursor-pointer">Scanner ma fiche</button>
          </div>
          {/* Mobile menu button */}
          <button
            className="md:hidden text-[var(--text)] cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {menuOpen
                ? <path d="M6 18L18 6M6 6l12 12" />
                : <path d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </nav>
        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden glass border-t border-[var(--border)] px-6 py-4 flex flex-col gap-3">
            <button onClick={() => { scrollTo("features"); setMenuOpen(false); }} className="text-sm text-[var(--text-muted)] text-left cursor-pointer">Fonctionnalites</button>
            <button onClick={() => { scrollTo("pricing"); setMenuOpen(false); }} className="text-sm text-[var(--text-muted)] text-left cursor-pointer">Tarifs</button>
            <button onClick={() => { scrollTo("faq"); setMenuOpen(false); }} className="text-sm text-[var(--text-muted)] text-left cursor-pointer">FAQ</button>
            <button onClick={() => { scrollTo("hero"); setMenuOpen(false); }} className="btn-primary text-sm !py-2 text-center cursor-pointer">Scanner ma fiche</button>
          </div>
        )}
      </header>

      <main id="main-content" role="main">
        {/* ── Hero ── */}
        <section id="hero" className="section-padding pt-32 md:pt-40 pb-20" aria-labelledby="hero-title">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 id="hero-title" className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 animate-fade-in-up">
                  Votre fiche Google est{" "}
                  <span className="text-primary">invisible</span> ?
                </h1>
                <p className="text-lg md:text-xl text-[var(--text-muted)] mb-8 leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                  GmbPro detecte, corrige et optimise votre presence Google automatiquement.{" "}
                  <strong className="text-[var(--text)]">Plus de clients, zero effort.</strong>
                </p>
                <div className="flex flex-wrap gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                  <button onClick={() => scrollTo("pricing")} className="btn-primary text-base cursor-pointer">
                    Scanner ma fiche gratuitement
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </button>
                  <button onClick={() => scrollTo("how")} className="btn-outline text-base cursor-pointer">Voir la demo</button>
                </div>
                {/* Trust badges */}
                <div className="flex flex-wrap gap-6 animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
                  {[
                    { value: "500+", label: "fiches optimisees" },
                    { value: "+47%", label: "score moyen" },
                    { value: "100%", label: "automatique" },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-primary font-mono font-bold text-lg">{b.value}</span>
                      <span className="text-sm text-[var(--text-muted)]">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="animate-fade-in-up animate-float" style={{ animationDelay: "0.3s" }}>
                <GmbCard />
              </div>
            </div>
          </div>
        </section>

        {/* ── Problem ── */}
        <section id="problem" className="section-padding" style={{ background: "var(--surface)" }} aria-labelledby="problem-title">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <h2 id="problem-title" className="text-3xl md:text-4xl font-extrabold text-center mb-4">
                Pourquoi vos clients ne vous trouvent pas
              </h2>
              <p className="text-center text-[var(--text-muted)] mb-16 max-w-2xl mx-auto">
                La majorite des fiches Google Business sont mal configurees. Resultat : vous perdez des clients chaque jour.
              </p>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-8 stagger">
              {[
                {
                  icon: ICONS.incomplete,
                  title: "Fiche incomplete",
                  desc: "82% des fiches Google manquent d'informations essentielles. Description absente, horaires manquants, categories incorrectes.",
                  stat: "82%",
                },
                {
                  icon: ICONS.posts,
                  title: "Zero posts",
                  desc: "Google favorise les fiches actives. Sans posts reguliers, votre fiche est invisible face a la concurrence.",
                  stat: "0",
                },
                {
                  icon: ICONS.reviews,
                  title: "Avis sans reponse",
                  desc: "53% des clients evitent les commerces qui ignorent les avis. Chaque avis sans reponse est un client perdu.",
                  stat: "53%",
                },
              ].map((card, i) => (
                <Reveal key={i}>
                  <article className="glass-card p-8 h-full">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: "rgba(255,107,53,0.1)" }}>
                      <IconCard d={card.icon} />
                    </div>
                    <div className="text-3xl font-mono font-extrabold text-accent-warm mb-2">{card.stat}</div>
                    <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                    <p className="text-[var(--text-muted)] leading-relaxed">{card.desc}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="section-padding" aria-labelledby="how-title">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <h2 id="how-title" className="text-3xl md:text-4xl font-extrabold text-center mb-4">
                Comment ca marche
              </h2>
              <p className="text-center text-[var(--text-muted)] mb-16 max-w-2xl mx-auto">
                Trois etapes simples pour transformer votre visibilite locale.
              </p>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-8 stagger">
              {[
                { icon: ICONS.scan, num: "01", title: "On scanne votre fiche", desc: "Notre IA analyse 27 criteres de votre fiche Google Business et identifie chaque point d'amelioration." },
                { icon: ICONS.optimize, num: "02", title: "On optimise automatiquement", desc: "Description, categories, horaires, attributs, photos — tout est corrige et optimise en moins de 24h." },
                { icon: ICONS.chart, num: "03", title: "Vos clients vous trouvent", desc: "Votre fiche remonte dans les resultats. Plus de visites, plus d'appels, plus de clients." },
              ].map((step, i) => (
                <Reveal key={i}>
                  <article className="relative text-center p-8">
                    <div className="text-6xl font-mono font-extrabold text-primary/10 mb-4">{step.num}</div>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(79,124,255,0.1)" }}>
                      <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={step.icon} />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-[var(--text-muted)] leading-relaxed">{step.desc}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="section-padding" style={{ background: "var(--surface)" }} aria-labelledby="features-title">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <h2 id="features-title" className="text-3xl md:text-4xl font-extrabold text-center mb-4">
                Tout est automatique
              </h2>
              <p className="text-center text-[var(--text-muted)] mb-16 max-w-2xl mx-auto">
                GmbPro gere votre presence Google de A a Z. Vous n&apos;avez rien a faire.
              </p>
            </Reveal>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
              {[
                { icon: ICONS.smart, title: "Scanner intelligent", desc: "Analyse 27 criteres de votre fiche : description, categories, horaires, photos, attributs, et plus." },
                { icon: ICONS.content, title: "Refonte complete", desc: "Description optimisee pour le SEO, categories pertinentes, horaires complets, attributs manquants ajoutes." },
                { icon: ICONS.posts, title: "Posts Google hebdo", desc: "Contenu genere par IA et publie automatiquement sur votre fiche. Votre fiche reste active et visible." },
                { icon: ICONS.reply, title: "Reponses aux avis", desc: "Notre IA repond a chaque avis client en votre nom, avec le bon ton et les mots cles pertinents." },
                { icon: ICONS.tracking, title: "Suivi positions", desc: "Suivez votre classement local en temps reel. Voyez exactement ou vous apparaissez sur Google Maps." },
                { icon: ICONS.report, title: "Rapports mensuels", desc: "Evolution detaillee de vos performances envoyee par email chaque mois. Resultats clairs et mesurables." },
              ].map((f, i) => (
                <Reveal key={i}>
                  <article className="glass-card p-7 h-full">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(79,124,255,0.1)" }}>
                      <IconCard d={f.icon} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                    <p className="text-[var(--text-muted)] leading-relaxed text-sm">{f.desc}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="section-padding" aria-labelledby="pricing-title">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <h2 id="pricing-title" className="text-3xl md:text-4xl font-extrabold text-center mb-4">
                Choisissez votre forfait
              </h2>
              <p className="text-center text-[var(--text-muted)] mb-16 max-w-2xl mx-auto">
                Un investissement minimal pour un impact maximal sur votre visibilite locale.
              </p>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-8 stagger max-w-5xl mx-auto">
              {/* Starter */}
              <Reveal>
                <article className="glass-card p-8 h-full flex flex-col">
                  <h3 className="text-xl font-bold mb-1">Starter</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-mono font-extrabold text-[var(--text)]">29&#8364;</span>
                    <span className="text-[var(--text-muted)] text-sm">one-shot</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1" role="list">
                    {[
                      "Audit complet de votre fiche",
                      "Score detaille sur 27 criteres",
                      "Refonte complete (description, categories, horaires)",
                      "Optimisation des attributs",
                      "Rapport PDF detaille",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                        <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={ICONS.check} /></svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button className="btn-outline w-full justify-center cursor-pointer">Optimiser ma fiche</button>
                </article>
              </Reveal>

              {/* Pro */}
              <Reveal>
                <article className="pricing-recommended glass-card p-8 h-full flex flex-col relative" style={{ borderColor: "var(--primary)" }}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-[#0A0E1A] text-xs font-bold px-4 py-1 rounded-full">RECOMMANDE</div>
                  <h3 className="text-xl font-bold mb-1">Pro</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-mono font-extrabold text-[var(--text)]">39&#8364;</span>
                    <span className="text-[var(--text-muted)] text-sm">/mois</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1" role="list">
                    {[
                      "Tout Starter inclus",
                      "4 posts Google par mois (IA)",
                      "Suivi positions local",
                      "Rapport mensuel par email",
                      "Dashboard en temps reel",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                        <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={ICONS.check} /></svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button className="btn-primary w-full justify-center cursor-pointer">Demarrer le Pro</button>
                </article>
              </Reveal>

              {/* Premium */}
              <Reveal>
                <article className="glass-card p-8 h-full flex flex-col">
                  <h3 className="text-xl font-bold mb-1">Premium</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-mono font-extrabold text-[var(--text)]">59&#8364;</span>
                    <span className="text-[var(--text-muted)] text-sm">/mois</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1" role="list">
                    {[
                      "Tout Pro inclus",
                      "8 posts Google par mois",
                      "Reponses aux avis automatiques",
                      "Gestion des questions",
                      "Relance avis clients",
                      "Support prioritaire",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                        <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={ICONS.check} /></svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button className="btn-outline w-full justify-center cursor-pointer">Passer Premium</button>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="section-padding" style={{ background: "var(--surface)" }} aria-labelledby="stats-title">
          <div className="max-w-6xl mx-auto">
            <h2 id="stats-title" className="sr-only">Statistiques GmbPro</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { target: 500, suffix: "+", label: "fiches optimisees" },
                { target: 47, prefix: "+", suffix: "%", label: "score moyen" },
                { target: 2.3, suffix: "x", label: "plus de clients" },
                { target: 24, prefix: "< ", suffix: "h", label: "delai d'optimisation" },
              ].map((s, i) => (
                <Reveal key={i}>
                  <div className="text-center">
                    <div className="text-4xl md:text-5xl font-extrabold text-primary mb-2">
                      {s.target === 2.3 ? (
                        <span className="font-mono">{s.prefix}2.3{s.suffix}</span>
                      ) : (
                        <CountUp target={s.target} suffix={s.suffix} prefix={s.prefix || ""} />
                      )}
                    </div>
                    <p className="text-[var(--text-muted)] text-sm">{s.label}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="section-padding" aria-labelledby="faq-title">
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <h2 id="faq-title" className="text-3xl md:text-4xl font-extrabold text-center mb-4">
                Questions frequentes
              </h2>
              <p className="text-center text-[var(--text-muted)] mb-12">
                Tout ce que vous devez savoir sur GmbPro.
              </p>
            </Reveal>
            <div>
              <FaqItem
                q="Comment GmbPro optimise ma fiche ?"
                a="GmbPro analyse 27 criteres de votre fiche Google Business, identifie les points faibles et applique automatiquement les corrections : description optimisee pour le SEO local, categories pertinentes, horaires complets, attributs manquants, et plus encore."
              />
              <FaqItem
                q="Est-ce que j'ai besoin de donner acces a mon compte Google ?"
                a="Oui, un acces en lecture/ecriture a votre fiche Google Business est necessaire pour appliquer les optimisations. La connexion se fait via OAuth Google, securisee et revocable a tout moment depuis vos parametres Google."
              />
              <FaqItem
                q="Combien de temps pour voir des resultats ?"
                a="Les optimisations sont appliquees sous 24h. Les premiers resultats en termes de visibilite et de classement apparaissent generalement entre 2 et 4 semaines, selon la concurrence dans votre zone."
              />
              <FaqItem
                q="Puis-je annuler a tout moment ?"
                a="Oui, les forfaits Pro et Premium sont sans engagement. Vous pouvez annuler a tout moment depuis votre dashboard. Les optimisations deja appliquees restent en place."
              />
              <FaqItem
                q="Est-ce legal et conforme RGPD ?"
                a="Absolument. GmbPro utilise les API officielles de Google. Toutes vos donnees sont hebergees en Europe et traitees conformement au RGPD. Aucune donnee n'est partagee avec des tiers."
              />
              <FaqItem
                q="Que se passe-t-il si je choisis le forfait Starter ?"
                a="Le forfait Starter est un audit et une optimisation one-shot. Nous analysons votre fiche, corrigeons tous les points faibles et vous livrons un rapport PDF detaille. C'est ideal pour un coup de boost ponctuel."
              />
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="section-padding relative overflow-hidden" aria-labelledby="cta-title">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(79,124,255,0.08) 0%, transparent 70%)" }} aria-hidden="true" />
          <div className="max-w-3xl mx-auto text-center relative">
            <Reveal>
              <h2 id="cta-title" className="text-3xl md:text-5xl font-extrabold mb-6">
                Pret a dominer votre zone ?
              </h2>
              <p className="text-lg text-[var(--text-muted)] mb-10">
                Scannez votre fiche gratuitement en 30 secondes. Decouvrez votre score et les points a ameliorer.
              </p>
              <button onClick={() => scrollTo("pricing")} className="btn-primary text-lg !py-4 !px-10 glow-accent cursor-pointer">
                Scanner ma fiche gratuitement
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </button>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border)] py-12 px-6" role="contentinfo">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <RadarIcon className="w-5 h-5 text-primary" />
              <span className="font-bold text-[var(--text)]">GmbPro</span>
              <span className="text-[var(--text-muted)] text-sm ml-2">Optimisation Google Business automatique</span>
            </div>
            <nav className="flex flex-wrap gap-6 text-sm text-[var(--text-muted)]" aria-label="Liens legaux">
              <a href="/legal" className="hover:text-[var(--text)] transition-colors">Mentions legales</a>
              <a href="/privacy" className="hover:text-[var(--text)] transition-colors">Confidentialite</a>
              <a href="/terms" className="hover:text-[var(--text)] transition-colors">CGU</a>
              <a href="mailto:contact@gmbpro.fr" className="hover:text-[var(--text)] transition-colors">Contact</a>
            </nav>
          </div>
          <p className="text-center text-xs text-[var(--text-muted)] mt-8">Fait avec precision en France</p>
        </div>
      </footer>
    </>
  );
}
