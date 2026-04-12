'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Veuillez saisir votre email.'); return; }

    setLoading(true);
    setError('');

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reinitialiser-mot-de-passe`,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10" opacity="0.3" />
              <circle cx="12" cy="12" r="6" opacity="0.6" />
              <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
            </svg>
            <span className="text-xl font-extrabold text-[var(--text)]">GmbPro</span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text)]">Reinitialiser votre mot de passe</h1>
          <p className="text-[var(--text-muted)] text-sm mt-2">
            Entrez votre email, nous vous enverrons un lien pour reinitialiser votre mot de passe
          </p>
        </div>

        <div className="glass-card p-8">
          {sent ? (
            <div className="flex flex-col gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[rgba(0,229,160,0.12)] flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-[var(--text)]">Si cet email existe, un lien a ete envoye.</p>
              <Link href="/connexion" className="text-sm text-[var(--primary-light)] hover:underline font-medium">
                Retour a la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@moncommerce.fr"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>
              {error && (
                <div className="text-sm text-[var(--accent-warm)] bg-[rgba(255,107,53,0.1)] px-4 py-3 rounded-xl" role="alert">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-base mt-2 cursor-pointer disabled:opacity-50">
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          <Link href="/connexion" className="text-[var(--primary-light)] hover:underline font-medium">Retour a la connexion</Link>
        </p>
      </div>
    </div>
  );
}
