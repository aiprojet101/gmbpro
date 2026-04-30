'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type Tab = 'overview' | 'clients' | 'prospection' | 'scans'

interface Prospect {
  id: string
  place_id: string | null
  business_name: string
  city: string
  sector: string | null
  global_score: number | null
  failed_count: number | null
  rating: number | null
  review_count: number | null
  status: string
  email: string | null
  last_contacted_at: string | null
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

interface CitySuggestion { name: string; region: string; placeId: string }

const SECTOR_SUGGESTIONS = [
  'restaurant', 'boulangerie', 'coiffeur', 'pharmacie', 'pizzeria',
  'salon de beaute', 'garage automobile', 'fleuriste', 'cabinet dentaire',
  'opticien', 'plombier', 'electricien', 'agence immobiliere', 'bar',
  'hotel', 'cabinet medical', 'epicerie', 'boucherie', 'tabac',
]

function ProspectionTab() {
  const [city, setCity] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([])
  const [showCitySug, setShowCitySug] = useState(false)
  const cityRef = useRef<HTMLInputElement>(null)
  const cityDropRef = useRef<HTMLDivElement>(null)
  const cityDebRef = useRef<ReturnType<typeof setTimeout>>(null)

  const [sector, setSector] = useState('')
  const [showSectorSug, setShowSectorSug] = useState(false)
  const sectorRef = useRef<HTMLInputElement>(null)
  const sectorDropRef = useRef<HTMLDivElement>(null)

  const [maxResults, setMaxResults] = useState(20)
  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState('')

  const [data, setData] = useState<ProspectsResponse | null>(null)
  const [scrapingEmails, setScrapingEmails] = useState(false)
  const [scrapeMsg, setScrapeMsg] = useState('')
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

  // City autocomplete
  const fetchCities = useCallback(async (q: string) => {
    if (q.length < 2) { setCitySuggestions([]); return }
    try {
      const res = await fetch(`/api/cities?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setCitySuggestions(data.suggestions || [])
      setShowCitySug(true)
    } catch { setCitySuggestions([]) }
  }, [])

  const handleCityChange = (v: string) => {
    setCity(v)
    if (cityDebRef.current) clearTimeout(cityDebRef.current)
    cityDebRef.current = setTimeout(() => fetchCities(v), 200)
  }

  // Click outside to close dropdowns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityDropRef.current && !cityDropRef.current.contains(e.target as Node) &&
          cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCitySug(false)
      }
      if (sectorDropRef.current && !sectorDropRef.current.contains(e.target as Node) &&
          sectorRef.current && !sectorRef.current.contains(e.target as Node)) {
        setShowSectorSug(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredSectors = SECTOR_SUGGESTIONS.filter(s =>
    s.toLowerCase().includes(sector.toLowerCase())
  ).slice(0, 6)

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
        const errStr = json.errors?.length ? ` | Erreurs : ${json.errors.join(' | ')}` : ''
        setScanMsg(`${json.results}/${json.found} prospects sauvegardes${errStr}`)
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

  const handleScrapeEmails = async () => {
    const pwd = sessionStorage.getItem('gmbpro_admin')
    if (!pwd) return
    setScrapingEmails(true)
    setScrapeMsg('Recherche emails en cours... (peut prendre 30-50s)')
    try {
      const res = await fetch('/api/admin/scrape-prospect-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword: pwd, limit: 10 }),
      })
      const json = await res.json()
      if (res.ok) {
        setScrapeMsg(`${json.found} emails trouves sur ${json.processed} sites visites`)
        load()
      } else {
        setScrapeMsg(`Erreur : ${json.error || 'inconnue'}`)
      }
    } catch {
      setScrapeMsg('Erreur reseau')
    } finally {
      setScrapingEmails(false)
    }
  }

  // Email modal state
  const [emailModal, setEmailModal] = useState<Prospect | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState('')

  const openEmailModal = (p: Prospect) => {
    setEmailModal(p)
    setEmailInput(p.email || '')
    setSendMsg('')
  }

  const closeEmailModal = () => {
    setEmailModal(null)
    setEmailInput('')
    setSendMsg('')
  }

  const sendProspectEmail = async () => {
    if (!emailModal) return
    const pwd = sessionStorage.getItem('gmbpro_admin')
    if (!pwd) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      setSendMsg('Email invalide')
      return
    }
    setSending(true)
    setSendMsg('Envoi en cours...')
    try {
      const res = await fetch('/api/admin/send-prospect-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: emailModal.id,
          email: emailInput,
          adminPassword: pwd,
        }),
      })
      const json = await res.json()
      if (res.ok) {
        setSendMsg('Email envoye avec succes')
        setTimeout(() => { closeEmailModal(); load() }, 800)
      } else {
        setSendMsg(`Erreur : ${json.error || 'inconnue'}`)
      }
    } catch {
      setSendMsg('Erreur reseau')
    } finally {
      setSending(false)
    }
  }

  const previewSubject = emailModal
    ? `${emailModal.business_name}, votre fiche Google a ${emailModal.global_score ?? 0}/100 — voici comment la corriger`
    : ''

  const scoreColor = (s: number | null) => {
    if (s == null) return 'text-[var(--text-muted)]'
    if (s < 40) return 'text-red-400'
    if (s < 70) return 'text-yellow-400'
    return 'text-green-400'
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

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
          {/* City autocomplete */}
          <div className="relative">
            <input
              ref={cityRef}
              type="text"
              value={city}
              onChange={e => handleCityChange(e.target.value)}
              onFocus={() => { if (citySuggestions.length) setShowCitySug(true) }}
              placeholder="Ville (ex: Lyon)"
              required
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            />
            {showCitySug && citySuggestions.length > 0 && (
              <div ref={cityDropRef} className="absolute left-0 right-0 top-full mt-2 z-30 rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>
                {citySuggestions.map((s, i) => (
                  <button key={s.placeId} type="button"
                    onClick={() => { setCity(s.name); setShowCitySug(false) }}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-[var(--surface-elevated)] text-left cursor-pointer"
                    style={{ borderBottom: i < citySuggestions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <svg className="w-4 h-4 text-primary mt-1 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text)] truncate">{s.name}</p>
                      {s.region && <p className="text-xs text-[var(--text-muted)] truncate">{s.region}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sector autocomplete (static list) */}
          <div className="relative">
            <input
              ref={sectorRef}
              type="text"
              value={sector}
              onChange={e => { setSector(e.target.value); setShowSectorSug(true) }}
              onFocus={() => setShowSectorSug(true)}
              placeholder="Secteur (ex: restaurant)"
              required
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            />
            {showSectorSug && filteredSectors.length > 0 && (
              <div ref={sectorDropRef} className="absolute left-0 right-0 top-full mt-2 z-30 rounded-xl overflow-hidden max-h-72 overflow-y-auto" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>
                {filteredSectors.map((s, i) => (
                  <button key={s} type="button"
                    onClick={() => { setSector(s); setShowSectorSug(false) }}
                    className="w-full px-4 py-2.5 hover:bg-[var(--surface-elevated)] text-left cursor-pointer text-sm text-[var(--text)] capitalize"
                    style={{ borderBottom: i < filteredSectors.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

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
        <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleScrapeEmails}
            disabled={scrapingEmails}
            className="btn-outline justify-center"
          >
            {scrapingEmails ? 'Recherche...' : 'Trouver les emails (10 prospects)'}
          </button>
          {scrapeMsg && (
            <p className={`text-sm ${scrapingEmails ? 'text-[var(--text-muted)]' : 'text-[var(--primary-light)]'}`}>
              {scrapingEmails && <span className="inline-block animate-spin mr-2">o</span>}
              {scrapeMsg}
            </p>
          )}
        </div>
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
                <th className="p-3">Email</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.prospects || []).map((p, i) => {
                const statusIcon = p.status === 'emailed' ? '🟢' : p.status === 'rejected' ? '🔴' : '⚪'
                const statusLabel = p.status === 'emailed' && p.last_contacted_at
                  ? `emailed (${fmtDate(p.last_contacted_at)})`
                  : p.status
                return (
                <tr key={p.id} className={i % 2 === 0 ? 'bg-[var(--surface)]' : ''}>
                  <td className="p-3 font-medium">{p.business_name}</td>
                  <td className="p-3">{p.city}</td>
                  <td className="p-3">{p.sector || '-'}</td>
                  <td className={`p-3 font-bold ${scoreColor(p.global_score)}`}>{p.global_score ?? '-'}</td>
                  <td className="p-3">{p.rating ?? '-'}</td>
                  <td className="p-3">{p.review_count ?? '-'}</td>
                  <td className="p-3 text-xs text-[var(--text-muted)]">{p.email || '—'}</td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-1 rounded bg-[var(--surface-elevated)]">{statusIcon} {statusLabel}</span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => openEmailModal(p)}
                      className="text-xs text-[var(--primary-light)] hover:underline"
                    >
                      {p.status === 'emailed' ? 'Renvoyer email' : 'Envoyer email'}
                    </button>
                  </td>
                </tr>
                )
              })}
              {(data?.prospects || []).length === 0 && (
                <tr><td colSpan={9} className="p-6 text-center text-[var(--text-muted)]">Aucun prospect. Lance un scan pour en trouver.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Email modal */}
      {emailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={closeEmailModal}
        >
          <div
            className="glass-card p-6 w-full max-w-lg space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">Envoyer email de prospection</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  {emailModal.business_name} · {emailModal.city}
                </p>
              </div>
              <button
                onClick={closeEmailModal}
                className="text-[var(--text-muted)] hover:text-[var(--text)] text-xl leading-none"
              >×</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-[var(--surface)]">
                <div className="text-xs text-[var(--text-muted)]">Score</div>
                <div className={`font-bold text-lg ${scoreColor(emailModal.global_score)}`}>
                  {emailModal.global_score ?? '-'}/100
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface)]">
                <div className="text-xs text-[var(--text-muted)]">Criteres a corriger</div>
                <div className="font-bold text-lg">{emailModal.failed_count ?? '-'}</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--text-muted)]">Email destinataire</label>
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="contact@business.fr"
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs text-[var(--text-muted)]">Apercu sujet</div>
              <div className="text-sm p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] italic">
                {previewSubject}
              </div>
            </div>

            {sendMsg && (
              <p className={`text-sm ${sendMsg.startsWith('Erreur') ? 'text-red-400' : 'text-[var(--primary-light)]'}`}>
                {sendMsg}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={closeEmailModal}
                disabled={sending}
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm hover:bg-[var(--surface-elevated)] disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={sendProspectEmail}
                disabled={sending || !emailInput}
                className="btn-primary flex-1 justify-center disabled:opacity-50"
              >
                {sending ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}

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
