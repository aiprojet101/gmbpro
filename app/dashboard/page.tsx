'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUser, getClient, getClientAudits, signOut } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface AuditRow {
  id: string;
  business_name: string;
  city: string;
  global_score: number;
  passed_count: number;
  failed_count: number;
  total_criteria: number;
  created_at: string;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ClientData {
  id: string;
  business_name: string;
  city: string;
  email: string;
  plan: string;
  contact_name: string;
  google_email?: string | null;
  gmb_account_id?: string | null;
  gmb_account_name?: string | null;
  gmb_location_id?: string | null;
  gmb_location_name?: string | null;
  gmb_connected_at?: string | null;
}

interface GmbAccount {
  name: string; // "accounts/123"
  accountName?: string;
  type?: string;
}

interface GmbLocation {
  name: string; // "locations/456"
  title?: string;
  storefrontAddress?: { addressLines?: string[]; locality?: string; postalCode?: string };
  websiteUri?: string;
  phoneNumbers?: { primaryPhone?: string };
}

// ── Mock Data (fallback until VPS workers populate real data) ─────────────────
const BUSINESS_DEFAULT = { name: 'Mon etablissement', city: '' };

const KPI = [
  { label: 'Score GmbPro', value: 67, unit: '/100', change: null, type: 'gauge' as const },
  { label: 'Vues ce mois', value: 2847, unit: '', change: '+12%', type: 'number' as const },
  { label: 'Clics ce mois', value: 342, unit: '', change: '+8%', type: 'number' as const },
  { label: 'Appels ce mois', value: 89, unit: '', change: '+23%', type: 'number' as const },
];

const SCORE_HISTORY = [
  { month: 'Jan', score: 34 },
  { month: 'Fev', score: 41 },
  { month: 'Mar', score: 52 },
  { month: 'Avr', score: 58 },
  { month: 'Mai', score: 63 },
  { month: 'Jun', score: 67 },
];

const REVIEWS = [
  { stars: 5, name: 'Marie L.', text: 'Excellent restaurant, le service est impeccable et les plats delicieux. Je recommande vivement !', date: '8 juin 2026', responded: true },
  { stars: 4, name: 'Thomas D.', text: 'Tres bon rapport qualite-prix. L\'ambiance est agreable, on reviendra.', date: '5 juin 2026', responded: true },
  { stars: 2, name: 'Sophie R.', text: 'Attente trop longue pour le plat principal, dommage car la qualite etait au rendez-vous.', date: '3 juin 2026', responded: false },
];

const POSTS = [
  { date: '15 juin', title: 'Menu d\'ete : decouvrez nos nouvelles salades', status: 'programme' as const },
  { date: '12 juin', title: 'Soiree jazz ce vendredi soir', status: 'publie' as const },
  { date: '18 juin', title: 'Nos producteurs locaux a l\'honneur', status: 'brouillon' as const },
];

const ACTIONS = [
  { text: 'Repondre a 2 avis en attente', priority: 'urgent' as const },
  { text: 'Ajouter 5 photos supplementaires', priority: 'important' as const },
  { text: 'Mettre a jour les horaires de vacances', priority: 'suggestion' as const },
  { text: 'Publier un post cette semaine', priority: 'suggestion' as const },
];

const FICHE = [
  { section: 'Nom', value: 'Restaurant Le Comptoir', score: 'vert' as const },
  { section: 'Adresse', value: '42 Rue de la Republique, 69006 Lyon', score: 'vert' as const },
  { section: 'Telephone', value: '04 78 12 34 56', score: 'vert' as const },
  { section: 'Site web', value: 'www.lecomptoir-lyon.fr', score: 'vert' as const },
  { section: 'Horaires', value: 'Lun-Sam: 11h30-14h30, 18h30-22h30 | Dim: Ferme', score: 'orange' as const },
  { section: 'Description', value: 'Restaurant gastronomique au coeur du 6e arrondissement de Lyon. Cuisine francaise moderne avec des produits frais et locaux.', score: 'orange' as const },
  { section: 'Categories', value: 'Restaurant francais, Restaurant gastronomique', score: 'vert' as const },
  { section: 'Attributs', value: 'Terrasse, Wi-Fi, Accessible PMR', score: 'rouge' as const },
];

const RANKINGS = [
  { keyword: 'restaurant italien lyon', position: 4, change: 3, volume: '2 400/mois' },
  { keyword: 'pizzeria lyon 6', position: 2, change: 5, volume: '890/mois' },
  { keyword: 'livraison pizza lyon', position: 12, change: -1, volume: '3 200/mois' },
  { keyword: 'restaurant lyon 6eme', position: 7, change: 2, volume: '1 800/mois' },
  { keyword: 'brunch lyon', position: 15, change: 4, volume: '4 100/mois' },
];

const REPORTS = [
  { name: 'Rapport Juin 2026', date: '30 juin 2026' },
  { name: 'Rapport Mai 2026', date: '31 mai 2026' },
  { name: 'Rapport Avril 2026', date: '30 avril 2026' },
  { name: 'Rapport Mars 2026', date: '31 mars 2026' },
];

const ALL_REVIEWS = [
  ...REVIEWS,
  { stars: 5, name: 'Jean-Pierre M.', text: 'Un vrai bijou gastronomique. Le chef est talentueux et les desserts sont a tomber.', date: '1 juin 2026', responded: true },
  { stars: 3, name: 'Camille B.', text: 'Cadre sympa mais les portions sont un peu justes pour le prix.', date: '28 mai 2026', responded: false },
];

const QUESTIONS = [
  { question: 'Est-ce que vous avez une terrasse ?', author: 'Lucas T.', date: '7 juin 2026', answer: 'Oui, nous disposons d\'une terrasse ombragee de 20 places. Reservation recommandee en soiree.' },
  { question: 'Faites-vous des menus enfants ?', author: 'Nadia K.', date: '4 juin 2026', answer: 'Absolument ! Notre menu enfant est a 12 euros et comprend entree, plat et dessert adaptes.' },
];

// ── Sidebar Items ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  { id: 'fiche', label: 'Ma fiche', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'history', label: 'Historique', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'posts', label: 'Posts Google', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { id: 'reviews', label: 'Avis & Questions', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { id: 'positions', label: 'Positions', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'reports', label: 'Rapports', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'settings', label: 'Parametres', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

// ── Components ─────────────────────────────────────────────────────────────────

function ScoreGauge({ value }: { value: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  const color = value >= 70 ? 'var(--accent)' : value >= 40 ? '#F59E0B' : 'var(--accent-warm)';

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--surface)" strokeWidth="8" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference - progress}
          style={{ transition: 'stroke-dashoffset 1.5s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold" style={{ color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      </div>
    </div>
  );
}

function ScoreChart() {
  const maxScore = 100;
  const w = 500, h = 200, pad = 40;
  const points = SCORE_HISTORY.map((d, i) => ({
    x: pad + (i / (SCORE_HISTORY.length - 1)) * (w - 2 * pad),
    y: h - pad - (d.score / maxScore) * (h - 2 * pad),
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${h - pad} L${points[0].x},${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <defs>
        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(v => {
        const y = h - pad - (v / maxScore) * (h - 2 * pad);
        return <g key={v}>
          <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="var(--border)" strokeWidth="1" />
          <text x={pad - 8} y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize="11">{v}</text>
        </g>;
      })}
      <path d={areaPath} fill="url(#scoreGrad)" />
      <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill="var(--bg)" stroke="var(--primary)" strokeWidth="2.5" />
          <text x={p.x} y={h - pad + 20} textAnchor="middle" fill="var(--text-muted)" fontSize="12">{SCORE_HISTORY[i].month}</text>
          <text x={p.x} y={p.y - 12} textAnchor="middle" fill="var(--text)" fontSize="11" fontWeight="600">{SCORE_HISTORY[i].score}</text>
        </g>
      ))}
    </svg>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className="w-4 h-4" viewBox="0 0 20 20" fill={i <= count ? '#F59E0B' : 'var(--surface-elevated)'}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const w = 80, h = 24;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-6"><polyline points={pts} fill="none" stroke="var(--primary)" strokeWidth="1.5" /></svg>;
}

function PriorityBadge({ priority }: { priority: 'urgent' | 'important' | 'suggestion' }) {
  const colors = { urgent: 'bg-orange-500/20 text-orange-400', important: 'bg-yellow-500/20 text-yellow-400', suggestion: 'bg-blue-500/20 text-blue-400' };
  const labels = { urgent: 'Urgent', important: 'Important', suggestion: 'Suggestion' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[priority]}`}>{labels[priority]}</span>;
}

function ScoreDot({ score }: { score: 'vert' | 'orange' | 'rouge' }) {
  const colors = { vert: 'bg-green-400', orange: 'bg-yellow-400', rouge: 'bg-red-400' };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[score]}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = { publie: 'bg-green-500/20 text-green-400', programme: 'bg-blue-500/20 text-blue-400', brouillon: 'bg-gray-500/20 text-gray-400' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m[status] || m.brouillon}`}>{status}</span>;
}

// ── Tab Views ──────────────────────────────────────────────────────────────────

function OverviewTab() {
  return (
    <div className="flex flex-col gap-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI.map((k) => (
          <div key={k.label} className="glass-card p-5">
            <p className="text-sm text-[var(--text-muted)] mb-2">{k.label}</p>
            {k.type === 'gauge' ? <ScoreGauge value={k.value} /> : (
              <div>
                <p className="text-3xl font-bold text-[var(--text)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {k.value.toLocaleString('fr-FR')}<span className="text-base font-normal text-[var(--text-muted)]">{k.unit}</span>
                </p>
                {k.change && <p className="text-sm text-green-400 mt-1">{k.change}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Score Chart */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Evolution du score</h3>
        <ScoreChart />
      </div>

      {/* Reviews + Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Derniers avis</h3>
          <div className="flex flex-col gap-4">
            {REVIEWS.map((r, i) => (
              <div key={i} className="flex flex-col gap-1.5 pb-4 border-b border-[var(--border)] last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Stars count={r.stars} />
                    <span className="text-sm font-medium text-[var(--text)]">{r.name}</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{r.date}</span>
                </div>
                <p className="text-sm text-[var(--text-muted)] line-clamp-2">{r.text}</p>
                <span className={`text-xs ${r.responded ? 'text-green-400' : 'text-orange-400'}`}>
                  {r.responded ? 'Repondu' : 'En attente'}
                </span>
              </div>
            ))}
          </div>
          <button className="text-sm text-[var(--primary-light)] hover:underline mt-4">Voir tous les avis</button>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Posts planifies</h3>
          <div className="flex flex-col gap-4">
            {POSTS.map((p, i) => (
              <div key={i} className="flex items-center justify-between pb-4 border-b border-[var(--border)] last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{p.title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{p.date}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
          <button className="text-sm text-[var(--primary-light)] hover:underline mt-4">Gerer les posts</button>
        </div>
      </div>

      {/* Actions */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Actions recommandees</h3>
        <div className="flex flex-col gap-3">
          {ACTIONS.map((a, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <span className="text-sm text-[var(--text)]">{a.text}</span>
              <PriorityBadge priority={a.priority} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FicheTab({ client, onRefresh }: { client: ClientData | null; onRefresh: () => void }) {
  const [locations, setLocations] = useState<GmbLocation[] | null>(null);
  const [accounts, setAccounts] = useState<GmbAccount[] | null>(null);
  const [loadingLocs, setLoadingLocs] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(client?.gmb_account_id || null);

  const isConnected = !!client?.google_email;
  const hasLocation = !!client?.gmb_location_id;

  // Auto-load accounts/locations when connected but no location
  useEffect(() => {
    if (!isConnected || hasLocation) return;
    (async () => {
      setLoadingLocs(true);
      setError(null);
      try {
        // If we have account already, skip account fetch
        let accountId = client?.gmb_account_id || selectedAccountId;
        if (!accountId) {
          const aRes = await fetch('/api/google/accounts');
          const aJson = await aRes.json();
          if (!aRes.ok) throw new Error(aJson.error || 'accounts_error');
          setAccounts(aJson.accounts || []);
          if ((aJson.accounts || []).length === 1) {
            accountId = aJson.accounts[0].name;
            setSelectedAccountId(accountId);
          }
        }
        if (accountId) {
          const lRes = await fetch(`/api/google/locations?accountId=${encodeURIComponent(accountId)}`);
          const lJson = await lRes.json();
          if (!lRes.ok) throw new Error(lJson.error || 'locations_error');
          setLocations(lJson.locations || []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur de chargement');
      } finally {
        setLoadingLocs(false);
      }
    })();
  }, [isConnected, hasLocation, client?.gmb_account_id, selectedAccountId]);

  const handleSelectAccount = async (accountId: string, accountName?: string) => {
    setSelectedAccountId(accountId);
    setLoadingLocs(true);
    setError(null);
    try {
      const lRes = await fetch(`/api/google/locations?accountId=${encodeURIComponent(accountId)}`);
      const lJson = await lRes.json();
      if (!lRes.ok) throw new Error(lJson.error || 'locations_error');
      setLocations(lJson.locations || []);
      // Stash account info for later select call
      sessionStorage.setItem('gmb_account_name', accountName || accountId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoadingLocs(false);
    }
  };

  const handleSelectLocation = async (loc: GmbLocation) => {
    if (!selectedAccountId) return;
    setSelecting(loc.name);
    setError(null);
    try {
      const accountName = sessionStorage.getItem('gmb_account_name') || selectedAccountId;
      const res = await fetch('/api/google/locations/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccountId,
          accountName,
          locationId: loc.name,
          locationName: loc.title,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || 'select_error');
      }
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setSelecting(null);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Deconnecter votre fiche Google ? Vous devrez la reconnecter pour reactiver les fonctionnalites.')) return;
    setDisconnecting(true);
    try {
      await fetch('/api/auth/google/disconnect', { method: 'POST' });
      onRefresh();
    } finally {
      setDisconnecting(false);
    }
  };

  const formatLocationAddress = (loc: GmbLocation): string => {
    const a = loc.storefrontAddress;
    if (!a) return '';
    const lines = a.addressLines || [];
    return [...lines, [a.postalCode, a.locality].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  };

  // ─── State 1: Not connected ───
  if (!isConnected) {
    return (
      <div className="flex flex-col gap-6">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
            <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-[var(--text)] mb-3">Connectez votre fiche Google</h3>
          <p className="text-sm text-[var(--text-muted)] max-w-lg mx-auto mb-6">
            GmbPro a besoin d&apos;acceder a votre fiche Google My Business pour l&apos;optimiser automatiquement, publier vos posts, et repondre a vos avis.
          </p>
          <button
            onClick={async () => {
              const { data: { session } } = await supabase.auth.getSession();
              const token = session?.access_token || '';
              window.location.href = `/api/auth/google/start?token=${encodeURIComponent(token)}`;
            }}
            className="btn-primary inline-flex items-center gap-2 !py-3 !px-6 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
            Connecter ma fiche Google
          </button>
          <p className="text-xs text-[var(--text-muted)] mt-6 max-w-md mx-auto">
            Nous n&apos;avons acces qu&apos;a votre fiche Google Business Profile, jamais a votre Gmail, Drive, ou autres services Google.
          </p>
        </div>

        <div className="glass-card p-5 border border-orange-500/20 bg-orange-500/5">
          <p className="text-xs text-orange-300">
            <strong>Mode test :</strong> L&apos;application est actuellement en validation Google. Seuls les comptes testeurs autorises peuvent se connecter pour le moment.
          </p>
        </div>
      </div>
    );
  }

  // ─── State 2: Connected but no location selected ───
  if (!hasLocation) {
    return (
      <div className="flex flex-col gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <p className="text-sm text-[var(--text)]">
              Connecte avec <span className="font-semibold">{client?.google_email}</span>
            </p>
          </div>
          <h3 className="text-xl font-bold text-[var(--text)] mt-3 mb-2">Selectionnez votre fiche</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Choisissez la fiche Google Business Profile que GmbPro doit gerer.
          </p>
        </div>

        {error && (
          <div className="glass-card p-4 border border-red-500/30 bg-red-500/5">
            <p className="text-sm text-red-400">Erreur : {error}</p>
            <button onClick={onRefresh} className="text-xs text-[var(--primary-light)] hover:underline mt-2">Reessayer</button>
          </div>
        )}

        {loadingLocs && (
          <div className="glass-card p-10 text-center">
            <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[var(--text-muted)]">Chargement de vos fiches Google...</p>
          </div>
        )}

        {!loadingLocs && accounts && accounts.length > 1 && !selectedAccountId && (
          <div className="glass-card p-6">
            <h4 className="text-sm font-semibold text-[var(--text)] mb-4">Choisissez un compte Google Business</h4>
            <div className="flex flex-col gap-2">
              {accounts.map(a => (
                <button
                  key={a.name}
                  onClick={() => handleSelectAccount(a.name, a.accountName)}
                  className="text-left p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all cursor-pointer"
                >
                  <p className="text-sm font-medium text-[var(--text)]">{a.accountName || a.name}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{a.type || 'Compte'}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {!loadingLocs && locations && locations.length === 0 && (
          <div className="glass-card p-8 text-center">
            <p className="text-sm text-[var(--text)] font-medium mb-2">Aucune fiche trouvee</p>
            <p className="text-sm text-[var(--text-muted)]">Ce compte Google ne possede aucune fiche Business Profile.</p>
          </div>
        )}

        {!loadingLocs && locations && locations.length > 0 && (
          <div className="glass-card p-6">
            <h4 className="text-sm font-semibold text-[var(--text)] mb-4">{locations.length} fiche{locations.length > 1 ? 's' : ''} trouvee{locations.length > 1 ? 's' : ''}</h4>
            <div className="flex flex-col gap-2">
              {locations.map(loc => (
                <button
                  key={loc.name}
                  onClick={() => handleSelectLocation(loc)}
                  disabled={selecting !== null}
                  className="text-left p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text)]">{loc.title || 'Sans nom'}</p>
                      {formatLocationAddress(loc) && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatLocationAddress(loc)}</p>
                      )}
                      {loc.phoneNumbers?.primaryPhone && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{loc.phoneNumbers.primaryPhone}</p>
                      )}
                    </div>
                    {selecting === loc.name ? (
                      <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-xs text-[var(--primary-light)] font-medium">Selectionner →</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card p-5">
          <button onClick={handleDisconnect} disabled={disconnecting} className="text-xs text-red-400 hover:underline">
            {disconnecting ? 'Deconnexion...' : 'Annuler et deconnecter'}
          </button>
        </div>
      </div>
    );
  }

  // ─── State 3: Connected + location selected ───
  const connectedDate = client?.gmb_connected_at
    ? new Date(client.gmb_connected_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="flex flex-col gap-6">
      {/* Status banner */}
      <div className="glass-card p-5 border border-green-500/20 bg-green-500/5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Fiche connectee</p>
              <p className="text-xs text-[var(--text-muted)]">
                <span className="font-medium">{client?.gmb_location_name}</span> · via {client?.google_email}
                {connectedDate && ` · depuis le ${connectedDate}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs text-red-400 border border-red-500/30 rounded-lg px-3 py-1.5 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            {disconnecting ? 'Deconnexion...' : 'Deconnecter'}
          </button>
        </div>
      </div>

      {/* Fiche info (real location info + placeholder details) */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-6">Informations de votre fiche</h3>
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between pb-5 border-b border-[var(--border)]">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <ScoreDot score="vert" />
                <span className="text-sm font-semibold text-[var(--text)]">Nom</span>
              </div>
              <p className="text-sm text-[var(--text-muted)] ml-4">{client?.gmb_location_name || '—'}</p>
            </div>
          </div>
          {FICHE.slice(1).map((f, i) => (
            <div key={i} className="flex items-start justify-between pb-5 border-b border-[var(--border)] last:border-0 last:pb-0">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <ScoreDot score={f.score} />
                  <span className="text-sm font-semibold text-[var(--text)]">{f.section}</span>
                </div>
                <p className="text-sm text-[var(--text-muted)] ml-4">{f.value}</p>
              </div>
              <button className="text-xs text-[var(--text-muted)] border border-[var(--border)] rounded-lg px-3 py-1.5 opacity-50 cursor-not-allowed" title="Bientot disponible">
                Modifier
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-6 italic">
          Les details complets (horaires, photos, attributs) seront synchronises lors du premier audit automatique.
        </p>
      </div>
    </div>
  );
}

function PostsTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text)]">Posts Google</h3>
        <button className="btn-primary text-sm !py-2 !px-4">Generer un nouveau post (IA)</button>
      </div>
      {/* Weekly grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {POSTS.map((p, i) => (
          <div key={i} className="glass-card p-5">
            <div className="w-full h-32 rounded-lg bg-[var(--surface-elevated)] mb-3 flex items-center justify-center">
              <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--text)] mb-1">{p.title}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">{p.date}</span>
              <StatusBadge status={p.status} />
            </div>
          </div>
        ))}
      </div>
      {/* Phone preview */}
      <div className="glass-card p-6">
        <h4 className="text-sm font-semibold text-[var(--text)] mb-4">Apercu du prochain post</h4>
        <div className="mx-auto w-72 rounded-3xl border-2 border-[var(--border)] p-4 bg-[var(--surface)]">
          <div className="w-full h-40 rounded-xl bg-[var(--surface-elevated)] mb-3" />
          <p className="text-sm font-semibold text-[var(--text)]">{POSTS[0].title}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Publie par Restaurant Le Comptoir</p>
          <button className="w-full mt-3 text-xs py-2 rounded-lg bg-[var(--primary)] text-white font-medium">En savoir plus</button>
        </div>
      </div>
    </div>
  );
}

function ReviewsTab() {
  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-lg font-semibold text-[var(--text)]">Avis clients</h3>
      <div className="flex flex-col gap-4">
        {ALL_REVIEWS.map((r, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Stars count={r.stars} />
                <span className="text-sm font-medium text-[var(--text)]">{r.name}</span>
              </div>
              <span className="text-xs text-[var(--text-muted)]">{r.date}</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-3">{r.text}</p>
            {r.responded ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <p className="text-xs text-green-400 font-medium mb-1">Reponse generee par IA</p>
                <p className="text-sm text-[var(--text-muted)]">Merci pour votre avis ! Nous sommes ravis que vous ayez apprecie votre experience.</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <button className="btn-primary text-xs !py-1.5 !px-3">Publier la reponse</button>
                <button className="btn-outline text-xs !py-1.5 !px-3">Modifier</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <h3 className="text-lg font-semibold text-[var(--text)] mt-4">Questions</h3>
      <div className="flex flex-col gap-4">
        {QUESTIONS.map((q, i) => (
          <div key={i} className="glass-card p-5">
            <p className="text-sm font-medium text-[var(--text)] mb-1">{q.question}</p>
            <p className="text-xs text-[var(--text-muted)] mb-3">Par {q.author} · {q.date}</p>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-blue-400 font-medium mb-1">Reponse suggeree</p>
              <p className="text-sm text-[var(--text-muted)]">{q.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PositionsTab() {
  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-lg font-semibold text-[var(--text)]">Votre classement pour 5 mots-cles principaux</h3>
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left p-4 text-[var(--text-muted)] font-medium">Mot-cle</th>
              <th className="text-center p-4 text-[var(--text-muted)] font-medium">Position</th>
              <th className="text-center p-4 text-[var(--text-muted)] font-medium">Evolution</th>
              <th className="text-center p-4 text-[var(--text-muted)] font-medium">Tendance</th>
              <th className="text-right p-4 text-[var(--text-muted)] font-medium">Volume</th>
            </tr>
          </thead>
          <tbody>
            {RANKINGS.map((r, i) => (
              <tr key={i} className="border-b border-[var(--border)] last:border-0">
                <td className="p-4 text-[var(--text)] font-medium">{r.keyword}</td>
                <td className="p-4 text-center text-[var(--text)] font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>#{r.position}</td>
                <td className="p-4 text-center">
                  <span className={r.change > 0 ? 'text-green-400' : 'text-red-400'} style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {r.change > 0 ? '+' : ''}{r.change}
                  </span>
                </td>
                <td className="p-4 flex justify-center">
                  <Sparkline data={[r.position + 5, r.position + 3, r.position + 1, r.position, r.position - (r.change > 0 ? 1 : -1)].map(v => Math.max(1, v))} />
                </td>
                <td className="p-4 text-right text-[var(--text-muted)]" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.volume}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsTab() {
  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-lg font-semibold text-[var(--text)]">Rapports mensuels</h3>
      {/* Latest report preview */}
      <div className="glass-card p-6">
        <h4 className="text-sm font-semibold text-[var(--text)] mb-4">Apercu — {REPORTS[0].name}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[{ label: 'Score', val: '67/100' }, { label: 'Vues', val: '2 847' }, { label: 'Clics', val: '342' }, { label: 'Appels', val: '89' }].map(m => (
            <div key={m.label} className="text-center">
              <p className="text-2xl font-bold text-[var(--text)]" style={{ fontVariantNumeric: 'tabular-nums' }}>{m.val}</p>
              <p className="text-xs text-[var(--text-muted)]">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {REPORTS.map((r, i) => (
          <div key={i} className="glass-card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text)]">{r.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{r.date}</p>
            </div>
            <button className="btn-outline text-xs !py-1.5 !px-3">Telecharger PDF</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryTab({ audits, loading }: { audits: AuditRow[]; loading: boolean }) {
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return iso; }
  };

  const scoreColor = (s: number) => s < 40 ? 'var(--accent-warm)' : s < 70 ? '#F59E0B' : 'var(--accent)';
  const scoreBg = (s: number) => s < 40 ? 'rgba(255,107,53,0.12)' : s < 70 ? 'rgba(245,158,11,0.12)' : 'rgba(0,229,160,0.12)';

  if (loading) {
    return (
      <div className="glass-card p-10 text-center">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-[var(--text-muted)]">Chargement de l&apos;historique...</p>
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h3 className="text-lg font-semibold text-[var(--text)]">Historique des audits</h3>
        <div className="glass-card p-10 text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h4m0 0V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h11a2 2 0 002-2v-4m-2-4l-4 4m0 0l-4-4m4 4V3" />
          </svg>
          <p className="text-sm text-[var(--text)] font-medium mb-2">Aucun audit realise</p>
          <p className="text-sm text-[var(--text-muted)] mb-5">Lancez votre premier scan.</p>
          <Link href="/scanner" className="btn-primary text-sm inline-flex !py-2 !px-4">
            Nouveau scan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text)]">Historique des audits</h3>
        <Link href="/scanner" className="btn-primary text-sm !py-2 !px-4">Nouveau scan</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {audits.map(a => (
          <div key={a.id} className="glass-card p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--text)] truncate">{a.business_name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{a.city}</p>
              </div>
              <div
                className="px-3 py-1.5 rounded-full text-sm font-mono font-bold shrink-0"
                style={{ background: scoreBg(a.global_score), color: scoreColor(a.global_score) }}
              >
                {a.global_score}/100
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
                {a.passed_count} valides
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-orange-400" />
                {a.failed_count} a corriger
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <span className="text-xs text-[var(--text-muted)]">{formatDate(a.created_at)}</span>
              <Link
                href={`/scanner/resultats?name=${encodeURIComponent(a.business_name)}&city=${encodeURIComponent(a.city)}`}
                className="text-xs text-[var(--primary-light)] hover:underline font-medium"
              >
                Voir le detail
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab({ client, onSignOut }: { client: ClientData | null; onSignOut: () => void }) {
  const planLabels: Record<string, string> = {
    starter: 'Starter — 29 euros (one-shot)',
    pro: 'Pro — 39 euros/mois',
    premium: 'Premium — 59 euros/mois',
  };

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-lg font-semibold text-[var(--text)]">Parametres</h3>

      <div className="glass-card p-6">
        <h4 className="text-sm font-semibold text-[var(--text)] mb-4">Profil</h4>
        <div className="flex flex-col gap-4">
          {[
            { label: 'Nom', value: client?.contact_name || client?.business_name || '—' },
            { label: 'Email', value: client?.email || '—' },
            { label: 'Etablissement', value: client?.business_name || '—' },
            { label: 'Ville', value: client?.city || '—' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs text-[var(--text-muted)] mb-1">{f.label}</label>
              <input type="text" defaultValue={f.value} className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm" readOnly />
            </div>
          ))}
          <button className="btn-outline text-sm !py-2 w-fit">Changer le mot de passe</button>
        </div>
      </div>

      <div className="glass-card p-6">
        <h4 className="text-sm font-semibold text-[var(--text)] mb-4">Abonnement</h4>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm text-[var(--text)]">Forfait actuel :</span>
          <span className="text-sm font-bold text-[var(--primary)]">{planLabels[client?.plan || ''] || client?.plan || 'Aucun'}</span>
        </div>
        <button className="btn-outline text-sm !py-2">Changer de forfait</button>
      </div>

      <div className="glass-card p-6">
        <h4 className="text-sm font-semibold text-[var(--text)] mb-4">Notifications</h4>
        <div className="flex flex-col gap-3">
          {['Nouvel avis recu', 'Rapport mensuel pret', 'Changement de position'].map(n => (
            <label key={n} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-[var(--text)]">{n}</span>
              <div className="w-10 h-5 rounded-full bg-[var(--accent)] relative">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white" />
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <button
          onClick={onSignOut}
          className="text-sm text-red-400 border border-red-500/30 rounded-lg px-4 py-2 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          Deconnexion
        </button>
      </div>

      <div className="glass-card p-6 border-red-500/30">
        <h4 className="text-sm font-semibold text-red-400 mb-2">Zone dangereuse</h4>
        <p className="text-xs text-[var(--text-muted)] mb-3">Cette action est irreversible.</p>
        <button className="text-sm text-red-400 border border-red-500/30 rounded-lg px-4 py-2 hover:bg-red-500/10 transition-colors">
          Supprimer mon compte
        </button>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientData | null>(null);
  const [businessName, setBusinessName] = useState(BUSINESS_DEFAULT.name);
  const [businessCity, setBusinessCity] = useState(BUSINESS_DEFAULT.city);
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(true);

  const loadClient = async () => {
    const clientData = await getClient();
    if (clientData) {
      setClient(clientData);
      setBusinessName(clientData.business_name || BUSINESS_DEFAULT.name);
      setBusinessCity(clientData.city || BUSINESS_DEFAULT.city);
    }
  };

  // Auth check + load client data
  useEffect(() => {
    (async () => {
      const user = await getUser();
      if (!user) {
        router.replace('/connexion');
        return;
      }
      await loadClient();
      setLoading(false);

      // Handle URL params from OAuth callback
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && ['overview', 'fiche', 'history', 'posts', 'reviews', 'positions', 'reports', 'settings'].includes(tab)) {
          setActiveTab(tab);
        }
      }

      try {
        const rows = await getClientAudits();
        setAudits(rows as AuditRow[]);
      } catch { /* ignore */ }
      setAuditsLoading(false);
    })();
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[var(--text-muted)]">Chargement...</p>
        </div>
      </div>
    );
  }

  const tabContent: Record<string, React.ReactNode> = {
    overview: <OverviewTab />,
    fiche: <FicheTab client={client} onRefresh={loadClient} />,
    history: <HistoryTab audits={audits} loading={auditsLoading} />,
    posts: <PostsTab />,
    reviews: <ReviewsTab />,
    positions: <PositionsTab />,
    reports: <ReportsTab />,
    settings: <SettingsTab client={client} onSignOut={handleSignOut} />,
  };

  const initials = (client?.contact_name || client?.business_name || 'U').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-[#0A0E1A] border-r border-[var(--border)] z-50 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-16 flex items-center gap-2 px-5 border-b border-[var(--border)]">
          <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" opacity="0.3" /><circle cx="12" cy="12" r="6" opacity="0.6" /><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
          </svg>
          <span className="text-lg font-extrabold text-[var(--text)]">GmbPro</span>
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setSidebarOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === t.id ? 'bg-[var(--primary)]/10 text-[var(--primary-light)] border-l-2 border-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5'}`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[var(--border)]">
          <Link href="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Retour au site</Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-60">
        {/* Top bar */}
        <header className="h-16 glass flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-[var(--text)] cursor-pointer" onClick={() => setSidebarOpen(true)}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">{businessName}</p>
              <p className="text-xs text-[var(--text-muted)]">{businessCity}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/scanner" className="btn-primary text-sm !py-2 !px-4 hidden sm:inline-flex">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nouveau scan
            </Link>
            <Link href="/scanner" aria-label="Nouveau scan" className="sm:hidden text-[var(--primary)]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </Link>
            <button className="relative text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--accent-warm)] rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-sm font-bold text-white">{initials}</div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 max-w-6xl">
          {tabContent[activeTab]}
        </main>
      </div>
    </div>
  );
}
