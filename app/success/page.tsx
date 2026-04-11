"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [info, setInfo] = useState<{
    ok: boolean; plan?: string; email?: string; businessName?: string; mode?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    fetch(`/api/stripe/verify?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((d) => setInfo(d))
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const isSubscription = info?.mode === "subscription";
  const planLabel = info?.plan === "starter" ? "Starter" : info?.plan === "pro" ? "Pro" : info?.plan === "premium" ? "Premium" : "";

  return (
    <main className="min-h-screen pt-24 pb-20 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-6 text-center">
        <div className="glass-card p-10 relative overflow-hidden">
          {/* Green glow background */}
          <div className="absolute inset-0 opacity-10" style={{
            background: "radial-gradient(circle at 50% 30%, var(--accent), transparent 70%)"
          }} />

          <div className="relative z-10">
            {loading ? (
              <div className="text-[var(--text-muted)]">Verification du paiement...</div>
            ) : info?.ok ? (
              <>
                {/* Animated checkmark */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center glow-accent"
                  style={{ background: "rgba(0,229,160,0.15)" }}>
                  <svg className="w-10 h-10 text-[var(--accent)]" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" style={{
                      strokeDasharray: 24,
                      strokeDashoffset: 0,
                      animation: "checkDraw 0.6s ease-out forwards"
                    }} />
                  </svg>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Paiement reussi !</h1>

                {planLabel && (
                  <div className="inline-block px-4 py-1 rounded-full text-sm font-bold mb-4"
                    style={{ background: "rgba(79,124,255,0.15)", color: "var(--primary-light)" }}>
                    Forfait {planLabel}
                  </div>
                )}

                <p className="text-[var(--text-muted)] mb-2">
                  {isSubscription
                    ? "Votre abonnement est actif. Votre fiche va etre optimisee dans les 24h."
                    : "Votre fiche va etre optimisee dans les 24h."
                  }
                </p>

                {info.email && (
                  <p className="text-sm text-[var(--text-muted)] mb-6">
                    Un email de confirmation a ete envoye a <span className="text-[var(--text)]">{info.email}</span>
                  </p>
                )}

                <Link href="/dashboard" className="btn-primary w-full justify-center">
                  Acceder a mon dashboard
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,107,53,0.15)" }}>
                  <svg className="w-10 h-10 text-[var(--accent-warm)]" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 9v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-extrabold mb-2">Paiement non confirme</h1>
                <p className="text-[var(--text-muted)] mb-6">
                  Le paiement n&apos;a pas pu etre verifie. Contactez-nous si le probleme persiste.
                </p>
                <Link href="/scanner" className="btn-outline">
                  Retour au scanner
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-[var(--text-muted)]">Chargement...</div>
        </div>
      }>
        <SuccessContent />
      </Suspense>
      <Footer />

      <style jsx global>{`
        @keyframes checkDraw {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </>
  );
}
