"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SCAN_MESSAGES = [
  "Recherche de votre fiche Google...",
  "Analyse des informations de base...",
  "Verification des photos et avis...",
  "Evaluation du referencement local...",
  "Calcul du score final...",
];

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

export default function ScannerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!scanning) return;
    const duration = 4000;
    const steps = SCAN_MESSAGES.length;
    const interval = duration / steps;

    const msgTimer = setInterval(() => {
      setMsgIndex((prev) => {
        if (prev >= steps - 1) { clearInterval(msgTimer); return prev; }
        return prev + 1;
      });
    }, interval);

    const progTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(progTimer); return 100; }
        return prev + 2;
      });
    }, duration / 50);

    const redirectTimer = setTimeout(() => {
      router.push(`/scanner/resultats?name=${encodeURIComponent(name)}&city=${encodeURIComponent(city)}`);
    }, duration + 300);

    return () => {
      clearInterval(msgTimer);
      clearInterval(progTimer);
      clearTimeout(redirectTimer);
    };
  }, [scanning, name, city, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim()) return;
    setScanning(true);
    setProgress(0);
    setMsgIndex(0);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20">
        {/* Scanning overlay */}
        {scanning && (
          <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: "rgba(10,14,26,0.95)" }}>
            <div className="text-center max-w-md px-6">
              {/* Radar SVG */}
              <div className="relative w-32 h-32 mx-auto mb-8">
                <svg className="w-32 h-32" viewBox="0 0 128 128" fill="none" aria-hidden="true">
                  <circle cx="64" cy="64" r="60" stroke="var(--primary)" strokeWidth="1" opacity="0.15" />
                  <circle cx="64" cy="64" r="40" stroke="var(--primary)" strokeWidth="1" opacity="0.25" />
                  <circle cx="64" cy="64" r="20" stroke="var(--primary)" strokeWidth="1" opacity="0.35" />
                  <circle cx="64" cy="64" r="4" fill="var(--accent)" />
                  <line x1="64" y1="4" x2="64" y2="64" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" opacity="0.8">
                    <animateTransform attributeName="transform" type="rotate" from="0 64 64" to="360 64 64" dur="2s" repeatCount="indefinite" />
                  </line>
                  {/* Sweep gradient */}
                  <path d="M64 64 L64 4 A60 60 0 0 1 116 34 Z" fill="url(#sweep)" opacity="0.15">
                    <animateTransform attributeName="transform" type="rotate" from="0 64 64" to="360 64 64" dur="2s" repeatCount="indefinite" />
                  </path>
                  <defs>
                    <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <p className="text-lg font-semibold text-[var(--text)] mb-2">{SCAN_MESSAGES[msgIndex]}</p>
              <p className="text-sm text-[var(--text-muted)] mb-6">{name} - {city}</p>

              {/* Progress bar */}
              <div className="h-2 rounded-full overflow-hidden mx-auto max-w-xs" style={{ background: "var(--surface-elevated)" }}>
                <div
                  className="h-full rounded-full transition-all duration-200 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, var(--primary), var(--accent))",
                  }}
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2 font-mono">{progress}%</p>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
                Analysez votre fiche Google en{" "}
                <span className="text-primary">30 secondes</span>
              </h1>
              <p className="text-lg text-[var(--text-muted)]">
                Entrez le nom de votre etablissement et votre ville
              </p>
            </div>
          </Reveal>

          <Reveal>
            <form onSubmit={handleSubmit} className="glass-card p-8 md:p-10">
              <div className="space-y-5 mb-8">
                <div>
                  <label htmlFor="business-name" className="block text-sm font-semibold text-[var(--text)] mb-2">
                    Nom de l&apos;etablissement
                  </label>
                  <input
                    id="business-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Restaurant Le Comptoir"
                    required
                    className="w-full px-4 py-3 rounded-xl text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    style={{
                      background: "var(--surface-elevated)",
                      border: "1px solid var(--border)",
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-semibold text-[var(--text)] mb-2">
                    Ville
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Lyon"
                    required
                    className="w-full px-4 py-3 rounded-xl text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    style={{
                      background: "var(--surface-elevated)",
                      border: "1px solid var(--border)",
                    }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={scanning}
                className="btn-primary w-full justify-center text-lg !py-4 glow-accent cursor-pointer disabled:opacity-50"
              >
                Lancer l&apos;analyse
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <p className="text-center text-sm text-[var(--text-muted)] mt-4">
                Gratuit &middot; Sans inscription &middot; Resultats instantanes
              </p>
            </form>
          </Reveal>

          {/* Trust section */}
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
      </main>
      <Footer />
    </>
  );
}
