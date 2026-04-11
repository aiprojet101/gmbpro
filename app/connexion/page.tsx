'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ConnexionPage() {
  const [form, setForm] = useState({ email: '', password: '', remember: false });

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
          <h1 className="text-2xl font-bold text-[var(--text)]">Connectez-vous a GmbPro</h1>
          <p className="text-[var(--text-muted)] text-sm mt-2">Accedez a votre tableau de bord</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
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
                placeholder="Votre mot de passe"
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                  className="accent-[var(--accent)]"
                />
                <span className="text-sm text-[var(--text-muted)]">Se souvenir de moi</span>
              </label>
              <button type="button" className="text-sm text-[var(--primary-light)] hover:underline">Mot de passe oublie ?</button>
            </div>
            <button type="submit" className="btn-primary w-full justify-center text-base mt-2">
              Se connecter
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Pas de compte ? <Link href="/inscription" className="text-[var(--primary-light)] hover:underline font-medium">Inscrivez-vous gratuitement</Link>
        </p>
      </div>
    </div>
  );
}
