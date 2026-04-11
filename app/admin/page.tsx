'use client'

import { useState, useEffect, useCallback } from 'react'

type Tab = 'overview' | 'clients' | 'scans'

interface Stats {
  totalClients: number
  totalScans: number
  scansToday: number
  avgScore: number
  recentScans: Array<{ business_name: string; city: string; score: number; created_at: string }>
  recentClients: Array<{ email: string; business_name: string; city: string; plan: string; score: number; created_at: string }>
  clientsError: string | null
  scansError: string | null
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = useCallback(async (pwd: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${pwd}` },
      })
      if (!res.ok) {
        setError('Mot de passe incorrect')
        setAuthenticated(false)
        sessionStorage.removeItem('gmbpro_admin')
        return
      }
      const data = await res.json()
      setStats(data)
      setAuthenticated(true)
      sessionStorage.setItem('gmbpro_admin', pwd)
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem('gmbpro_admin')
    if (saved) fetchStats(saved)
  }, [fetchStats])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    fetchStats(password)
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="glass-card p-8 w-full max-w-sm space-y-4">
          <h1 className="text-xl font-bold text-center">Admin GmbPro</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            {loading ? 'Chargement...' : 'Connexion'}
          </button>
        </form>
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: "Vue d'ensemble" },
    { key: 'clients', label: 'Clients' },
    { key: 'scans', label: 'Scans' },
  ]

  const kpis = stats
    ? [
        { label: 'Total clients', value: stats.totalClients },
        { label: 'Total scans', value: stats.totalScans },
        { label: "Scans aujourd'hui", value: stats.scansToday },
        { label: 'Score moyen', value: `${stats.avgScore}/100` },
      ]
    : []

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Admin GmbPro</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] pb-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-[var(--surface-elevated)] text-[var(--primary-light)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={() => { const s = sessionStorage.getItem('gmbpro_admin'); if (s) fetchStats(s) }}
          className="ml-auto text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          Rafraichir
        </button>
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map(k => (
            <div key={k.label} className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-[var(--primary-light)]">{k.value}</div>
              <div className="text-sm text-[var(--text-muted)] mt-1">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Clients */}
      {tab === 'clients' && (
        <div className="glass-card p-4 overflow-x-auto">
          {stats?.clientsError ? (
            <p className="text-[var(--text-muted)] text-center py-8">
              Configurez la service_role key pour voir les clients<br />
              <span className="text-xs text-red-400">{stats.clientsError}</span>
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                  <th className="p-3">Email</th>
                  <th className="p-3">Business</th>
                  <th className="p-3">Ville</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentClients || []).map((c, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-[var(--surface)]' : ''}>
                    <td className="p-3">{c.email}</td>
                    <td className="p-3">{c.business_name}</td>
                    <td className="p-3">{c.city}</td>
                    <td className="p-3">{c.plan}</td>
                    <td className="p-3">{c.score ?? '-'}</td>
                    <td className="p-3">{fmtDate(c.created_at)}</td>
                  </tr>
                ))}
                {(stats?.recentClients || []).length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-[var(--text-muted)]">Aucun client</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Scans */}
      {tab === 'scans' && (
        <div className="glass-card p-4 overflow-x-auto">
          {stats?.scansError ? (
            <p className="text-[var(--text-muted)] text-center py-8">
              Erreur lors du chargement des scans<br />
              <span className="text-xs text-red-400">{stats.scansError}</span>
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                  <th className="p-3">Business</th>
                  <th className="p-3">Ville</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentScans || []).map((s, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-[var(--surface)]' : ''}>
                    <td className="p-3">{s.business_name}</td>
                    <td className="p-3">{s.city}</td>
                    <td className="p-3">{s.score ?? '-'}</td>
                    <td className="p-3">{fmtDate(s.created_at)}</td>
                  </tr>
                ))}
                {(stats?.recentScans || []).length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-[var(--text-muted)]">Aucun scan</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
