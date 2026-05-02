'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type Tab = 'overview' | 'clients' | 'prospection' | 'performance' | 'scans' | 'manager'

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
    { key: 'performance', label: 'Performance' },
    { key: 'scans', label: 'Scans' },
    { key: 'manager', label: 'Acces Manager' },
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

      {tab === 'performance' && <PerformanceTab />}

      {tab === 'manager' && <ManagerTab />}

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
  const [cronRunning, setCronRunning] = useState(false)
  const [cronMsg, setCronMsg] = useState('')
  const [nextPair, setNextPair] = useState<{ city: string; sector: string; region?: string; regionLabel?: string; index: number; total: number } | null>(null)
  const [filterCity, setFilterCity] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterScore, setFilterScore] = useState<'all' | 'bad' | 'medium' | 'good'>('all')
  const [sortEmailFirst, setSortEmailFirst] = useState(false)
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
      if (sortEmailFirst) params.set('sort', 'email_first')
      const res = await fetch(`/api/admin/prospects?${params.toString()}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [page, filterCity, filterStatus, filterScore, sortEmailFirst])

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
    let totalFound = 0
    let totalProcessed = 0
    let batch = 0
    const MAX_BATCHES = 30 // safety: max 30 batches × 10 = 300 prospects per session
    try {
      while (batch < MAX_BATCHES) {
        batch++
        setScrapeMsg(`Lot ${batch} en cours... ${totalFound} emails trouves sur ${totalProcessed} sites`)
        const res = await fetch('/api/admin/scrape-prospect-emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminPassword: pwd, limit: 10 }),
        })
        const json = await res.json()
        if (!res.ok) {
          setScrapeMsg(`Erreur : ${json.error || 'inconnue'}`)
          break
        }
        totalFound += json.found || 0
        totalProcessed += json.processed || 0
        // No more prospects to scrape
        if ((json.processed || 0) === 0) break
        // Small delay between batches
        await new Promise(r => setTimeout(r, 500))
      }
      setScrapeMsg(`Termine : ${totalFound} emails trouves sur ${totalProcessed} sites visites (${batch} lots)`)
      load()
    } catch {
      setScrapeMsg('Erreur reseau')
    } finally {
      setScrapingEmails(false)
    }
  }

  // Load next auto-prospection pair
  useEffect(() => {
    fetch('/api/admin/run-auto-prospect')
      .then(r => r.json())
      .then(j => { if (j.pair) setNextPair(j.pair) })
      .catch(() => {})
  }, [])

  const handleRunCronNow = async () => {
    const pwd = sessionStorage.getItem('gmbpro_admin')
    if (!pwd) return
    setCronRunning(true)
    setCronMsg('Cron en cours... (peut prendre 60-90s)')
    try {
      const res = await fetch('/api/admin/run-auto-prospect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword: pwd }),
      })
      const json = await res.json()
      if (res.ok) {
        const p = json.pair
        const s = json.scan || {}
        const sc = json.scrape || {}
        setCronMsg(`${s.results || 0} prospects ajoutes pour ${p.city}/${p.sector} | ${sc.found || 0} emails trouves`)
        load()
      } else {
        setCronMsg(`Erreur : ${json.error || 'inconnue'}`)
      }
    } catch {
      setCronMsg('Erreur reseau')
    } finally {
      setCronRunning(false)
    }
  }

  // Email modal state
  const [emailModal, setEmailModal] = useState<Prospect | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState('')

  // Bulk send state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; currentName: string } | null>(null)
  const [bulkResult, setBulkResult] = useState<{ sent: number; errors: number } | null>(null)

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const visibleSelectable = (data?.prospects || []).filter(p => p.email && p.status === 'new')
  const allVisibleSelected = visibleSelectable.length > 0 && visibleSelectable.every(p => selectedIds.has(p.id))

  const toggleSelectAllVisible = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        visibleSelectable.forEach(p => next.delete(p.id))
      } else {
        visibleSelectable.forEach(p => next.add(p.id))
      }
      return next
    })
  }

  const bulkSend = async () => {
    const pwd = sessionStorage.getItem('gmbpro_admin')
    if (!pwd) return
    const ids = Array.from(selectedIds)
    const prospects = (data?.prospects || []).filter(p => ids.includes(p.id) && p.email)
    setBulkConfirmOpen(false)
    setBulkResult(null)
    let sent = 0, errors = 0
    for (let i = 0; i < prospects.length; i++) {
      const p = prospects[i]
      setBulkProgress({ current: i + 1, total: prospects.length, currentName: p.business_name })
      try {
        const res = await fetch('/api/admin/send-prospect-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prospectId: p.id, email: p.email, adminPassword: pwd }),
        })
        if (res.ok) sent++; else errors++
      } catch { errors++ }
      if (i < prospects.length - 1) await new Promise(r => setTimeout(r, 600))
    }
    setBulkProgress(null)
    setBulkResult({ sent, errors })
    setSelectedIds(new Set())
    load()
  }

  const selectedProspects = (data?.prospects || []).filter(p => selectedIds.has(p.id))

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
          <button
            type="button"
            onClick={handleRunCronNow}
            disabled={cronRunning}
            className="btn-outline justify-center"
            title="Execute le meme job que le cron nocturne"
          >
            {cronRunning ? 'Cron...' : 'Test cron auto-prospection'}
          </button>
          {scrapeMsg && (
            <p className={`text-sm ${scrapingEmails ? 'text-[var(--text-muted)]' : 'text-[var(--primary-light)]'}`}>
              {scrapingEmails && <span className="inline-block animate-spin mr-2">o</span>}
              {scrapeMsg}
            </p>
          )}
          {cronMsg && (
            <p className={`text-sm ${cronRunning ? 'text-[var(--text-muted)]' : 'text-[var(--primary-light)]'}`}>
              {cronRunning && <span className="inline-block animate-spin mr-2">o</span>}
              {cronMsg}
            </p>
          )}
        </div>
        {nextPair && (
          <div className="pt-3 border-t border-[var(--border)] text-sm text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text)]">Prochaine campagne automatique :</span>{' '}
            <span className="capitalize">{nextPair.sector}</span> a {nextPair.city}{' '}
            {nextPair.regionLabel && <span className="text-xs">[{nextPair.regionLabel}]</span>}{' '}
            <span className="text-xs">(run #{nextPair.index + 1}/{nextPair.total}, cron 03:00 UTC)</span>
          </div>
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

      {/* Sticky action bar (bulk send) */}
      {selectedIds.size > 0 && (
        <div
          className="sticky top-0 z-20 mb-4 glass-card p-4 flex items-center justify-between"
          style={{ animation: 'slideDown 0.3s ease' }}
        >
          <div className="text-sm">
            <strong>{selectedIds.size}</strong> prospect{selectedIds.size > 1 ? 's' : ''} selectionne{selectedIds.size > 1 ? 's' : ''}
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              Annuler la selection
            </button>
            <button
              onClick={() => setBulkConfirmOpen(true)}
              className="btn-primary text-sm !py-2 !px-4"
            >
              Envoyer email a la selection ({selectedIds.size})
            </button>
          </div>
        </div>
      )}

      {/* Prospects list */}
      <div className="glass-card p-4 overflow-x-auto">
        {loading ? (
          <p className="text-center py-8 text-[var(--text-muted)]">Chargement...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    disabled={visibleSelectable.length === 0}
                    aria-label="Tout selectionner"
                    className="cursor-pointer"
                  />
                </th>
                <th className="p-3">Business</th>
                <th className="p-3">Ville</th>
                <th className="p-3">Secteur</th>
                <th className="p-3">Score</th>
                <th className="p-3">Note</th>
                <th className="p-3">Avis</th>
                <th
                  className="p-3 cursor-pointer select-none hover:text-[var(--text)]"
                  onClick={() => setSortEmailFirst(s => !s)}
                  title="Trier les prospects avec email en premier"
                >
                  Email {sortEmailFirst ? '↓' : '↕'}
                </th>
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
                const canSelect = !!p.email && p.status === 'new'
                return (
                <tr key={p.id} className={i % 2 === 0 ? 'bg-[var(--surface)]' : ''}>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      disabled={!canSelect}
                      title={!p.email ? "Pas d'email" : p.status !== 'new' ? 'Deja contacte' : ''}
                      className={`cursor-pointer ${!canSelect ? 'opacity-30 cursor-not-allowed' : ''}`}
                    />
                  </td>
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
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => openEmailModal(p)}
                        className="text-xs text-[var(--primary-light)] hover:underline text-left"
                      >
                        {p.status === 'emailed' ? 'Renvoyer email' : 'Envoyer email'}
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Supprimer ${p.business_name} ?`)) return
                          const pwd = sessionStorage.getItem('gmbpro_admin')
                          if (!pwd) return
                          await fetch(`/api/admin/prospects?id=${p.id}&authToken=${pwd}`, { method: 'DELETE' })
                          load()
                        }}
                        className="text-xs text-red-400 hover:underline text-left"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
                )
              })}
              {(data?.prospects || []).length === 0 && (
                <tr><td colSpan={10} className="p-6 text-center text-[var(--text-muted)]">Aucun prospect. Lance un scan pour en trouver.</td></tr>
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

      {/* Bulk confirm modal */}
      {bulkConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setBulkConfirmOpen(false)}
        >
          <div
            className="glass-card p-6 w-full max-w-lg space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Confirmer l&apos;envoi groupe</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Vous allez envoyer un email a <strong className="text-[var(--text)]">{selectedProspects.length}</strong> prospect{selectedProspects.length > 1 ? 's' : ''}.
            </p>
            <div className="p-3 rounded-lg bg-[var(--surface)] text-sm space-y-1">
              {selectedProspects.slice(0, 3).map(p => (
                <div key={p.id} className="text-[var(--text)]">- {p.business_name}</div>
              ))}
              {selectedProspects.length > 3 && (
                <div className="text-[var(--text-muted)] italic">...et {selectedProspects.length - 3} autre{selectedProspects.length - 3 > 1 ? 's' : ''}</div>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Envoi sequentiel avec un delai de 600ms entre chaque email (rate limit Resend).
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setBulkConfirmOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm hover:bg-[var(--surface-elevated)]"
              >
                Annuler
              </button>
              <button
                onClick={bulkSend}
                className="btn-primary flex-1 justify-center"
              >
                Confirmer l&apos;envoi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk progress modal */}
      {bulkProgress && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
        >
          <div className="glass-card p-6 w-full max-w-lg space-y-5">
            <h3 className="text-lg font-bold">Envoi en cours...</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Progression</span>
                <span className="font-bold">{bulkProgress.current} / {bulkProgress.total}</span>
              </div>
              <div className="w-full h-3 rounded-full bg-[var(--surface)] overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-300"
                  style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-sm">
              <div className="text-[var(--text-muted)] mb-1">Envoi a :</div>
              <div className="font-medium text-[var(--primary-light)] truncate">{bulkProgress.currentName}</div>
            </div>
            <p className="text-xs text-[var(--text-muted)] italic">
              Merci de ne pas fermer cette fenetre pendant l&apos;envoi.
            </p>
          </div>
        </div>
      )}

      {/* Bulk result modal */}
      {bulkResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setBulkResult(null)}
        >
          <div
            className="glass-card p-6 w-full max-w-md space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Resultat de l&apos;envoi</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-[var(--surface)] text-center">
                <div className="text-3xl font-bold text-green-400">{bulkResult.sent}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Envoye{bulkResult.sent > 1 ? 's' : ''}</div>
              </div>
              <div className="p-4 rounded-lg bg-[var(--surface)] text-center">
                <div className="text-3xl font-bold text-red-400">{bulkResult.errors}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Erreur{bulkResult.errors > 1 ? 's' : ''}</div>
              </div>
            </div>
            <button
              onClick={() => setBulkResult(null)}
              className="btn-primary w-full justify-center"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (() => {
        const current = page + 1
        const last = totalPages
        const pages: (number | '...')[] = []
        const add = (n: number) => { if (!pages.includes(n)) pages.push(n) }

        add(1)
        if (current > 4) pages.push('...')
        for (let i = Math.max(2, current - 1); i <= Math.min(last - 1, current + 1); i++) add(i)
        if (current < last - 3) pages.push('...')
        if (last > 1) add(last)

        const btn = (label: string | number, target: number, disabled = false, active = false) => (
          <button
            key={`${label}-${target}`}
            onClick={() => setPage(target)}
            disabled={disabled}
            className={`min-w-[38px] h-9 px-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-[var(--primary)] text-[#0A0E1A]'
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)] disabled:opacity-30 disabled:cursor-not-allowed'
            }`}
          >
            {label}
          </button>
        )

        return (
          <div className="flex justify-center items-center gap-1.5 flex-wrap">
            {btn('« Premiere', 0, current === 1)}
            {btn('‹', page - 1, current === 1)}
            {pages.map((p, i) =>
              p === '...'
                ? <span key={`dots-${i}`} className="px-2 text-[var(--text-muted)]">...</span>
                : btn(p, p - 1, false, p === current)
            )}
            {btn('›', page + 1, current === last)}
            {btn('Derniere »', last - 1, current === last)}
          </div>
        )
      })()}
    </div>
  )
}

interface AggStats {
  key: string
  prospects: number
  emailsSent: number
  opened: number
  clicked: number
  bounced: number
  converted: number
  openRate: number
  clickRate: number
  avgScore: number
}

interface ComboStats extends AggStats {
  sector: string
  region: string
}

interface PerfData {
  bySector: AggStats[]
  byRegion: AggStats[]
  topCombos: ComboStats[]
  totals: { prospects: number; emailsSent: number; opened: number; clicked: number; bounced: number; converted: number }
}

interface ManagerClient {
  id: string
  business_name: string
  email: string | null
  phone: string | null
  sector: string | null
  city: string | null
  manager_invite_status: 'sent' | 'accepted' | 'refused'
  manager_invite_at: string | null
  manager_accepted_at: string | null
}

function ManagerTab() {
  const [rows, setRows] = useState<ManagerClient[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    const pwd = sessionStorage.getItem('gmbpro_admin')
    if (!pwd) return
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch(`/api/admin/manager-status?authToken=${encodeURIComponent(pwd)}`)
      const j = await res.json()
      if (!res.ok) {
        setErr(j.error || 'Erreur')
      } else {
        setRows(j.clients || [])
      }
    } catch {
      setErr('Erreur reseau')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: 'accepted' | 'refused') => {
    const pwd = sessionStorage.getItem('gmbpro_admin')
    if (!pwd) return
    setUpdating(id)
    try {
      const res = await fetch(`/api/admin/manager-status?clientId=${encodeURIComponent(id)}&authToken=${encodeURIComponent(pwd)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) await load()
    } finally {
      setUpdating(null)
    }
  }

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'

  const statusBadge = (s: string) => {
    if (s === 'accepted') return <span className="text-xs px-2 py-1 rounded bg-green-500/15 text-green-300 border border-green-500/30">Accepte</span>
    if (s === 'sent') return <span className="text-xs px-2 py-1 rounded bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">En attente</span>
    if (s === 'refused') return <span className="text-xs px-2 py-1 rounded bg-red-500/15 text-red-300 border border-red-500/30">Refuse</span>
    return <span className="text-xs px-2 py-1 rounded bg-[var(--surface-elevated)]">{s}</span>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">
          Clients ayant envoye une invitation Manager. Acceptez sur <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="text-[var(--primary-light)] underline">business.google.com</a> puis marquez accepte ici.
        </p>
        <button onClick={load} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">Rafraichir</button>
      </div>

      <div className="glass-card p-4 overflow-x-auto">
        {loading ? (
          <p className="text-center py-8 text-[var(--text-muted)]">Chargement...</p>
        ) : err ? (
          <p className="text-center py-8 text-red-400">{err}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                <th className="p-3">Etablissement</th>
                <th className="p-3">Email</th>
                <th className="p-3">Secteur</th>
                <th className="p-3">Ville</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Invite le</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={c.id} className={i % 2 === 0 ? 'bg-[var(--surface)]' : ''}>
                  <td className="p-3 font-medium">{c.business_name || '-'}</td>
                  <td className="p-3 text-xs">{c.email || '-'}</td>
                  <td className="p-3">{c.sector || '-'}</td>
                  <td className="p-3">{c.city || '-'}</td>
                  <td className="p-3">{statusBadge(c.manager_invite_status)}</td>
                  <td className="p-3 text-xs">{fmtDate(c.manager_invite_at)}</td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      {c.manager_invite_status === 'sent' && (
                        <>
                          <button
                            onClick={() => updateStatus(c.id, 'accepted')}
                            disabled={updating === c.id}
                            className="text-xs text-green-400 hover:underline text-left disabled:opacity-50"
                          >
                            Marquer accepte
                          </button>
                          <button
                            onClick={() => updateStatus(c.id, 'refused')}
                            disabled={updating === c.id}
                            className="text-xs text-red-400 hover:underline text-left disabled:opacity-50"
                          >
                            Marquer refuse
                          </button>
                        </>
                      )}
                      {c.manager_invite_status === 'accepted' && (
                        <button
                          onClick={() => updateStatus(c.id, 'refused')}
                          disabled={updating === c.id}
                          className="text-xs text-red-400 hover:underline text-left disabled:opacity-50"
                        >
                          Marquer refuse
                        </button>
                      )}
                      {c.manager_invite_status === 'refused' && (
                        <button
                          onClick={() => updateStatus(c.id, 'accepted')}
                          disabled={updating === c.id}
                          className="text-xs text-green-400 hover:underline text-left disabled:opacity-50"
                        >
                          Marquer accepte
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-[var(--text-muted)]">Aucune invitation Manager pour le moment.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function PerformanceTab() {
  const [data, setData] = useState<PerfData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'prospects' | 'emailsSent' | 'openRate' | 'clickRate' | 'avgScore'>('prospects')

  useEffect(() => {
    const pwd = sessionStorage.getItem('gmbpro_admin') || ''
    fetch('/api/admin/performance', { headers: { Authorization: `Bearer ${pwd}` } })
      .then(async r => {
        const j = await r.json()
        if (!r.ok) {
          setErr(j.error || 'Erreur')
          if (j.hint) setHint(j.hint)
        } else {
          setData(j)
        }
      })
      .catch(e => setErr(String(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-[var(--text-muted)] text-sm">Chargement...</div>
  if (err) return (
    <div className="glass-card p-6 space-y-2">
      <p className="text-red-400 text-sm">Erreur : {err}</p>
      {hint && <p className="text-[var(--text-muted)] text-xs">{hint}</p>}
    </div>
  )
  if (!data) return null

  const sortRows = (rows: AggStats[]) => [...rows].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number))

  const renderTable = (title: string, rows: AggStats[], firstColLabel: string) => (
    <div className="glass-card p-4 space-y-3">
      <h3 className="font-semibold">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
              <th className="py-2 pr-3">{firstColLabel}</th>
              <th className="py-2 pr-3 cursor-pointer" onClick={() => setSortBy('prospects')}>Prospects</th>
              <th className="py-2 pr-3 cursor-pointer" onClick={() => setSortBy('emailsSent')}>Envoyes</th>
              <th className="py-2 pr-3">Ouverts</th>
              <th className="py-2 pr-3">Cliques</th>
              <th className="py-2 pr-3 cursor-pointer" onClick={() => setSortBy('openRate')}>% Ouv.</th>
              <th className="py-2 pr-3 cursor-pointer" onClick={() => setSortBy('clickRate')}>% Click</th>
              <th className="py-2 pr-3 cursor-pointer" onClick={() => setSortBy('avgScore')}>Score moy.</th>
            </tr>
          </thead>
          <tbody>
            {sortRows(rows).map(r => (
              <tr key={r.key} className="border-b border-[var(--border)]/50">
                <td className="py-2 pr-3 capitalize">{r.key}</td>
                <td className="py-2 pr-3">{r.prospects}</td>
                <td className="py-2 pr-3">{r.emailsSent}</td>
                <td className="py-2 pr-3">{r.opened}</td>
                <td className="py-2 pr-3">{r.clicked}</td>
                <td className="py-2 pr-3">{r.openRate}%</td>
                <td className="py-2 pr-3">{r.clickRate}%</td>
                <td className="py-2 pr-3">{r.avgScore}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="py-3 text-[var(--text-muted)]">Aucune donnee.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          ['Prospects', data.totals.prospects],
          ['Emails envoyes', data.totals.emailsSent],
          ['Ouverts', data.totals.opened],
          ['Cliques', data.totals.clicked],
          ['Bounced', data.totals.bounced],
          ['Convertis', data.totals.converted],
        ].map(([l, v]) => (
          <div key={l as string} className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-[var(--primary-light)]">{v as number}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">{l as string}</div>
          </div>
        ))}
      </div>

      {renderTable('Performance par secteur', data.bySector, 'Secteur')}
      {renderTable('Performance par region', data.byRegion, 'Region')}

      <div className="glass-card p-4 space-y-3">
        <h3 className="font-semibold">Top 5 combos (secteur, region) — par taux de clic</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                <th className="py-2 pr-3">Secteur</th>
                <th className="py-2 pr-3">Region</th>
                <th className="py-2 pr-3">Envoyes</th>
                <th className="py-2 pr-3">% Ouv.</th>
                <th className="py-2 pr-3">% Click</th>
                <th className="py-2 pr-3">Score moy.</th>
              </tr>
            </thead>
            <tbody>
              {data.topCombos.map(c => (
                <tr key={c.key} className="border-b border-[var(--border)]/50">
                  <td className="py-2 pr-3 capitalize">{c.sector}</td>
                  <td className="py-2 pr-3">{c.region}</td>
                  <td className="py-2 pr-3">{c.emailsSent}</td>
                  <td className="py-2 pr-3">{c.openRate}%</td>
                  <td className="py-2 pr-3">{c.clickRate}%</td>
                  <td className="py-2 pr-3">{c.avgScore}</td>
                </tr>
              ))}
              {data.topCombos.length === 0 && (
                <tr><td colSpan={6} className="py-3 text-[var(--text-muted)]">Pas encore assez de donnees (min 5 envois par combo).</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
