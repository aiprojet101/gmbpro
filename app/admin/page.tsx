'use client'

import { useState, useEffect, useCallback } from 'react'

type Tab = 'overview' | 'clients' | 'prospection' | 'scans'

interface Prospect {
  id: string
  place_id: string | null
  business_name: string
  city: string
  sector: string | null
  global_score: number | null
  rating: number | null
  review_count: number | null
  status: string
  created_at: string
}

interface ProspectsResponse {
  prospects: Prospect[]
  total: number
  kpis: { total: number; avgScore: number; toContact: number }
}

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
    { key: 'prospection', label: 'Prospection' },
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

      {/* Prospection */}
      {tab === 'prospection' && <ProspectionTab />}

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

function ProspectionTab() {
  const [city, setCity] = useState('')
  const [sector, setSector] = useState('')
  const [maxResults, setMaxResults] = useState(20)
  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState('')

  const [data, setData] = useState<ProspectsResponse | null>(null)
  const [filterCity, setFilterCity] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterScore, setFilterScore] = useState<'all' | 'bad' | 'medium' | 'good'>('all')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)

  const PER_PAGE = 20

  const load = useCallback(async () => {
    const pwd = sessionStorage.getItem('gmbpro_admin')
    if (!pwd) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('authToken', pwd)
      params.set('limit', String(PER_PAGE))
      params.set('offset', String(page * PER_PAGE))
      if (filterCity) params.set('city', filterCity)
      if (filterStatus) params.set('status', filterStatus)
      if (filterScore === 'bad') params.set('scoreMax', '40')
      if (filterScore === 'medium') { params.set('scoreMin', '40'); params.set('scoreMax', '70') }
      if (filterScore === 'good') params.set('scoreMin', '70')
      const res = await fetch(`/api/admin/prospects?${params.toString()}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [page, filterCity, filterStatus, filterScore])

  useEffect(() => { load() }, [load])

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    const pwd = sessionStorage.getItem('gmbpro_admin')
    if (!pwd || !city || !sector) return
    setScanning(true)
    setScanMsg('Scan en cours... (peut prendre 30-60s)')
    try {
      const res = await fetch('/api/admin/prospect-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, sector, maxResults, adminPassword: pwd }),
      })
      const json = await res.json()
      if (res.ok) {
        setScanMsg(`${json.results} prospects trouves et sauvegardes`)
        load()
      } else {
        setScanMsg(`Erreur : ${json.error || 'inconnue'}`)
      }
    } catch {
      setScanMsg('Erreur reseau')
    } finally {
      setScanning(false)
    }
  }

  const markContacted = async (id: string) => {
    const pwd = sessionStorage.getItem('gmbpro_admin')
    if (!pwd) return
    await fetch(`/api/admin/prospects?id=${id}&authToken=${pwd}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'emailed' }),
    })
    load()
  }

  const scoreColor = (s: number | null) => {
    if (s == null) return 'text-[var(--text-muted)]'
    if (s < 40) return 'text-red-400'
    if (s < 70) return 'text-yellow-400'
    return 'text-green-400'
  }

  const kpis = data?.kpis || { total: 0, avgScore: 0, toContact: 0 }
  const totalPages = data ? Math.ceil(data.total / PER_PAGE) : 0

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-[var(--primary-light)]">{kpis.total}</div>
          <div className="text-sm text-[var(--text-muted)] mt-1">Total prospects</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-[var(--primary-light)]">{kpis.avgScore}/100</div>
          <div className="text-sm text-[var(--text-muted)] mt-1">Score moyen</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-yellow-400">{kpis.toContact}</div>
          <div className="text-sm text-[var(--text-muted)] mt-1">A contacter (score &lt; 70)</div>
        </div>
      </div>

      {/* New campaign form */}
      <form onSubmit={handleScan} className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-bold">Nouvelle campagne de prospection</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Ville (ex: Lyon)"
            required
            className="px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
          />
          <input
            type="text"
            value={sector}
            onChange={e => setSector(e.target.value)}
            placeholder="Secteur (ex: restaurant)"
            required
            className="px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
          />
          <input
            type="number"
            value={maxResults}
            onChange={e => setMaxResults(Math.min(60, Math.max(1, parseInt(e.target.value) || 20)))}
            min={1}
            max={60}
            className="px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
          />
          <button type="submit" disabled={scanning} className="btn-primary justify-center">
            {scanning ? 'Scan...' : 'Lancer le scan'}
          </button>
        </div>
        {scanMsg && (
          <p className={`text-sm ${scanning ? 'text-[var(--text-muted)]' : 'text-[var(--primary-light)]'}`}>
            {scanning && <span className="inline-block animate-spin mr-2">o</span>}
            {scanMsg}
          </p>
        )}
      </form>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={filterCity}
          onChange={e => { setFilterCity(e.target.value); setPage(0) }}
          placeholder="Filtrer par ville"
          className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm"
        />
        <select
          value={filterScore}
          onChange={e => { setFilterScore(e.target.value as 'all' | 'bad' | 'medium' | 'good'); setPage(0) }}
          className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm"
        >
          <option value="all">Tous scores</option>
          <option value="bad">Mauvais (&lt; 40)</option>
          <option value="medium">Moyen (40-70)</option>
          <option value="good">Bon (&gt; 70)</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(0) }}
          className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm"
        >
          <option value="">Tous statuts</option>
          <option value="new">Nouveau</option>
          <option value="emailed">Contacte</option>
          <option value="converted">Converti</option>
          <option value="rejected">Rejete</option>
        </select>
        <button onClick={load} className="ml-auto text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
          Rafraichir
        </button>
      </div>

      {/* Prospects list */}
      <div className="glass-card p-4 overflow-x-auto">
        {loading ? (
          <p className="text-center py-8 text-[var(--text-muted)]">Chargement...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                <th className="p-3">Business</th>
                <th className="p-3">Ville</th>
                <th className="p-3">Secteur</th>
                <th className="p-3">Score</th>
                <th className="p-3">Note</th>
                <th className="p-3">Avis</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.prospects || []).map((p, i) => (
                <tr key={p.id} className={i % 2 === 0 ? 'bg-[var(--surface)]' : ''}>
                  <td className="p-3 font-medium">{p.business_name}</td>
                  <td className="p-3">{p.city}</td>
                  <td className="p-3">{p.sector || '-'}</td>
                  <td className={`p-3 font-bold ${scoreColor(p.global_score)}`}>{p.global_score ?? '-'}</td>
                  <td className="p-3">{p.rating ?? '-'}</td>
                  <td className="p-3">{p.review_count ?? '-'}</td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-1 rounded bg-[var(--surface-elevated)]">{p.status}</span>
                  </td>
                  <td className="p-3">
                    {p.status === 'new' && (
                      <button
                        onClick={() => markContacted(p.id)}
                        className="text-xs text-[var(--primary-light)] hover:underline"
                      >
                        Marquer contacte
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(data?.prospects || []).length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-[var(--text-muted)]">Aucun prospect. Lance un scan pour en trouver.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 rounded bg-[var(--surface)] border border-[var(--border)] text-sm disabled:opacity-50"
          >
            Precedent
          </button>
          <span className="px-3 py-1 text-sm text-[var(--text-muted)]">
            Page {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 rounded bg-[var(--surface)] border border-[var(--border)] text-sm disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}
