'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { supabase } from '../lib/supabase';

function InscriptionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan') || '';
  const nameParam = searchParams.get('name') || '';
  const cityParam = searchParams.get('city') || '';

  const [form, setForm] = useState({ nom: nameParam, email: '', password: '', ville: cityParam, cgu: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cgu) { setError('Vous devez accepter les CGU.'); return; }
    if (!form.nom || !form.email || !form.password || !form.ville) { setError('Tous les champs sont requis.'); return; }
    if (form.password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caracteres.'); return; }

    setLoading(true);
    setError('');

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { business_name: form.nom, city: form.ville },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Cet email est deja utilise. Connectez-vous ou utilisez un autre email.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Erreur lors de la creation du compte.');
        setLoading(false);
        return;
      }

      // 2. Create client row
      const { error: clientError } = await supabase.from('clients').insert({
        id: authData.user.id,
        email: form.email,
        business_name: form.nom,
        city: form.ville,
        plan: planParam || 'starter',
      });

      if (clientError) {
        console.error('Client insert error:', clientError);
        // Not blocking — user is created, we can fix client row later
      }

      // 3. Redirect to dashboard
      router.push('/dashboard');
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Nom de l&apos;etablissement</label>
              <input
                type="text" required
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Restaurant Le Comptoir"
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Email</label>
              <input
                type="email" required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@moncommerce.fr"
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Mot de passe</label>
              <input
                type="password" required minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="8 caracteres minimum"
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Ville</label>
              <input
                type="text" required
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
            {error && (
              <div className="text-sm text-[var(--accent-warm)] bg-[rgba(255,107,53,0.1)] px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-base mt-2 cursor-pointer disabled:opacity-50">
              {loading ? 'Creation en cours...' : 'Creer mon compte'}
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

export default function InscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-[var(--text-muted)]">Chargement...</div></div>}>
      <InscriptionForm />
    </Suspense>
  );
}
