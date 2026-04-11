'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export default function InscriptionPage() {
  const [form, setForm] = useState({ nom: '', email: '', password: '', ville: '', cgu: false });

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
          <h1 className="text-2xl font-bold text-[var(--text)]">Creez votre compte GmbPro</h1>
          <p className="text-[var(--text-muted)] text-sm mt-2">Optimisez votre fiche Google en quelques minutes</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Nom de l&apos;etablissement</label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Restaurant Le Comptoir"
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@moncommerce.fr"
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="8 caracteres minimum"
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Ville</label>
              <input
                type="text"
                value={form.ville}
                onChange={(e) => setForm({ ...form, ville: e.target.value })}
                placeholder="Lyon"
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.cgu}
                onChange={(e) => setForm({ ...form, cgu: e.target.checked })}
                className="mt-1 accent-[var(--accent)]"
              />
              <span className="text-sm text-[var(--text-muted)]">
                J&apos;accepte les <Link href="/terms" className="text-[var(--primary-light)] hover:underline">CGU</Link> et la <Link href="/privacy" className="text-[var(--primary-light)] hover:underline">politique de confidentialite</Link>
              </span>
            </label>
            <button type="submit" className="btn-primary w-full justify-center text-base mt-2">
              Creer mon compte
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Deja un compte ? <Link href="/connexion" className="text-[var(--primary-light)] hover:underline font-medium">Connectez-vous</Link>
        </p>
        <p className="text-center text-xs text-[var(--text-muted)] mt-4">
          Gratuit pendant 14 jours · Sans engagement · Sans carte bancaire
        </p>
      </div>
    </div>
  );
}
