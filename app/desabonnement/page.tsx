'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function UnsubContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const email = searchParams.get('email');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [reason, setReason] = useState('');

  const submit = async () => {
    if (!id && !email) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, email, reason }),
      });
      if (res.ok) setStatus('success');
      else setStatus('error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" opacity="0.3" />
              <circle cx="12" cy="12" r="6" opacity="0.6" />
              <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
            </svg>
            <span className="text-xl font-extrabold text-[var(--text)]">GmbPro</span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text)]">Se desabonner</h1>
        </div>

        <div className="glass-card p-8">
          {status === 'success' ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[rgba(0,229,160,0.15)] mx-auto flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-[var(--text)]">Vous etes desabonne</p>
              <p className="text-sm text-[var(--text-muted)]">
                Vous ne recevrez plus aucun email de prospection de notre part.
                Nos excuses si la sollicitation etait inopportune.
              </p>
              <Link href="/" className="text-sm text-[var(--primary-light)] hover:underline">
                Retour a l&apos;accueil
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                Vous allez etre retire de notre liste de prospection.
                Aucun email ne vous sera plus envoye.
              </p>
              <div className="mb-5">
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
                  Raison (facultatif)
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="">— Selectionner —</option>
                  <option value="not_interested">Pas interesse</option>
                  <option value="not_my_business">Ce n&apos;est pas mon etablissement</option>
                  <option value="already_optimized">Fiche deja optimisee</option>
                  <option value="not_subscribed">Je ne me suis pas inscrit</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              {status === 'error' && (
                <p className="text-sm text-[var(--accent-warm)] mb-4">
                  Une erreur est survenue. Vous pouvez aussi nous ecrire directement a contact@gmbpro.fr
                </p>
              )}
              <button
                onClick={submit}
                disabled={status === 'loading'}
                className="btn-primary w-full justify-center cursor-pointer disabled:opacity-50"
              >
                {status === 'loading' ? 'En cours...' : 'Confirmer la desinscription'}
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          Pour toute question : <a href="mailto:contact@gmbpro.fr" className="text-[var(--primary-light)] hover:underline">contact@gmbpro.fr</a>
        </p>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-[var(--text-muted)]">Chargement...</p></div>}>
      <UnsubContent />
    </Suspense>
  );
}
