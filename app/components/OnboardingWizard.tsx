'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface ClientData {
  id: string
  business_name: string
  city: string
  email: string
  plan: string
  contact_name: string
  phone?: string | null
  description?: string | null
  sector?: string | null
  manager_invite_status?: string | null
  manager_invite_at?: string | null
  manager_accepted_at?: string | null
  onboarding_step?: number | null
  onboarding_completed?: boolean | null
}

interface Props {
  client: ClientData
  initialStep?: number
  onComplete: () => void | Promise<void>
  onRefresh: () => Promise<void>
}

const SECTORS = [
  'restaurant', 'boulangerie', 'coiffeur', 'pharmacie', 'pizzeria',
  'salon de beaute', 'garage automobile', 'fleuriste', 'cabinet dentaire',
  'opticien', 'plombier', 'electricien', 'agence immobiliere', 'bar', 'hotel',
  'cabinet medical', 'epicerie', 'boucherie', 'institut de beaute', 'auto-ecole',
  'autre',
]

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' }
}

export default function OnboardingWizard({ client, initialStep = 1, onComplete, onRefresh }: Props) {
  const [step, setStep] = useState<number>(
    Math.min(3, Math.max(1, initialStep || client.onboarding_step || 1))
  )

  const persistStep = useCallback(async (n: number) => {
    try {
      const headers = await getAuthHeaders()
      await fetch('/api/client/onboarding', { method: 'PATCH', headers, body: JSON.stringify({ step: n }) })
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { persistStep(step) }, [step, persistStep])

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-8 md:py-12" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" opacity="0.3" /><circle cx="12" cy="12" r="6" opacity="0.6" /><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
            </svg>
            <span className="text-lg font-extrabold text-[var(--text)]">GmbPro</span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">Bienvenue {client.business_name || ''}, configurons votre compte</p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>Etape {step} sur 3</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--surface)] overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary), var(--primary-light))' }}
            />
          </div>
        </div>

        {/* Step content */}
        {step === 1 && (
          <Step1Manager
            client={client}
            onRefresh={onRefresh}
            onNext={() => setStep(2)}
            onSkip={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step2Profile
            client={client}
            onRefresh={onRefresh}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3Generate
            onComplete={onComplete}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  )
}

// ── Step 1: Manager access ──────────────────────────────────────────────
function Step1Manager({
  client, onRefresh, onNext, onSkip,
}: {
  client: ClientData
  onRefresh: () => Promise<void>
  onNext: () => void
  onSkip: () => void
}) {
  const status = (client.manager_invite_status || 'pending') as 'pending' | 'sent' | 'accepted' | 'refused'
  const [updating, setUpdating] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const canProceed = status === 'sent' || status === 'accepted'

  const markSent = async () => {
    setUpdating(true)
    setMsg(null)
    try {
      const headers = await getAuthHeaders()
      const r = await fetch('/api/client/manager-status', {
        method: 'PATCH', headers, body: JSON.stringify({ status: 'sent' }),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        setMsg(`Erreur : ${j.error || 'inconnue'}`)
      } else {
        await onRefresh()
        setMsg('Invitation enregistree. Notre equipe a ete notifiee.')
      }
    } catch {
      setMsg('Erreur reseau')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="glass-card p-6 md:p-8 space-y-5">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-[var(--text)]">Etape 1 sur 3 — Donnez-nous acces a votre fiche</h2>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          GmbPro a besoin d&apos;un acces &laquo; Manager &raquo; sur votre fiche Google Business pour publier vos posts et repondre a vos avis automatiquement.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text)]">Procedure (5 minutes)</h3>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-[var(--text-muted)]">
          <li>Rendez-vous sur <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="text-[var(--primary-light)] underline">business.google.com</a> et connectez-vous</li>
          <li>Selectionnez votre fiche, puis ouvrez le menu &laquo; Utilisateurs &raquo;</li>
          <li>Cliquez sur &laquo; Ajouter des utilisateurs &raquo;</li>
          <li>Saisissez l&apos;email : <code className="bg-[var(--surface-elevated)] px-2 py-0.5 rounded text-[var(--primary-light)]">contact@gmbpro.fr</code></li>
          <li>Choisissez le role &laquo; <strong>Gestionnaire</strong> &raquo; (Manager) — <strong>important</strong>, pas Owner</li>
          <li>Cliquez sur &laquo; Inviter &raquo;</li>
        </ol>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-[var(--text-muted)]">Statut :</span>
          {status === 'pending' && <span className="px-3 py-1 rounded-full bg-[var(--surface-elevated)] text-[var(--text-muted)]">En attente</span>}
          {status === 'sent' && <span className="px-3 py-1 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">Invitation envoyee — en attente d&apos;acceptation</span>}
          {status === 'accepted' && <span className="px-3 py-1 rounded-full bg-green-500/15 text-green-300 border border-green-500/30">Acces accepte</span>}
          {status === 'refused' && <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">Refuse</span>}
          {client.manager_invite_at && (
            <span className="text-xs text-[var(--text-muted)]">le {new Date(client.manager_invite_at).toLocaleDateString('fr-FR')}</span>
          )}
        </div>

        {status !== 'sent' && status !== 'accepted' && (
          <button
            onClick={markSent}
            disabled={updating}
            className="btn-primary justify-center disabled:opacity-50"
          >
            {updating ? 'Enregistrement...' : "J'ai envoye l'invitation"}
          </button>
        )}
        {msg && <p className="text-sm text-[var(--primary-light)]">{msg}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
        <button
          onClick={onSkip}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] underline"
        >
          Sauter cette etape
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="btn-primary justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Suivant →
        </button>
      </div>
    </div>
  )
}

// ── Step 2: Profile ──────────────────────────────────────────────────────
function Step2Profile({
  client, onRefresh, onNext, onBack,
}: {
  client: ClientData
  onRefresh: () => Promise<void>
  onNext: () => void
  onBack: () => void
}) {
  const [businessName, setBusinessName] = useState(client.business_name || '')
  const [city, setCity] = useState(client.city || '')
  const [phone, setPhone] = useState(client.phone || '')
  const [description, setDescription] = useState(client.description || '')
  const [sector, setSector] = useState(client.sector || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const headers = await getAuthHeaders()
      const r = await fetch('/api/client/update', {
        method: 'PATCH', headers,
        body: JSON.stringify({
          business_name: businessName,
          city, phone, description, sector,
        }),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        setMsg(`Erreur : ${j.error || 'inconnue'}`)
        return false
      }
      await onRefresh()
      return true
    } catch {
      setMsg('Erreur reseau')
      return false
    } finally {
      setSaving(false)
    }
  }

  const onClickNext = async () => {
    const ok = await save()
    if (ok) onNext()
  }

  return (
    <div className="glass-card p-6 md:p-8 space-y-5">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-[var(--text)]">Etape 2 sur 3 — Confirmons votre profil</h2>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Plus on a d&apos;infos sur votre etablissement, plus votre programme sera precis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nom de l'etablissement" value={businessName} onChange={setBusinessName} placeholder="Restaurant Le Comptoir" />
        <Field label="Ville" value={city} onChange={setCity} placeholder="Lyon" />
        <Field label="Telephone" value={phone} onChange={setPhone} placeholder="04 78 12 34 56" />
        <div className="space-y-1.5">
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Secteur</label>
          <select
            value={sector}
            onChange={e => setSector(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
          >
            <option value="">— Selectionner —</option>
            {SECTORS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="Decrivez votre etablissement en quelques lignes..."
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {msg && <p className="text-sm text-red-400">{msg}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
        <button onClick={onBack} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
          ← Precedent
        </button>
        <button onClick={onClickNext} disabled={saving} className="btn-primary justify-center disabled:opacity-50">
          {saving ? 'Sauvegarde...' : 'Suivant →'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
      />
    </div>
  )
}

// ── Step 3: Generate program ─────────────────────────────────────────────
interface GeneratedTask {
  id?: string
  title?: string
  category?: string
  priority?: number
}

function Step3Generate({ onComplete, onBack }: { onComplete: () => void | Promise<void>; onBack: () => void }) {
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)
  const [tasks, setTasks] = useState<GeneratedTask[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)

  const generate = async () => {
    setGenerating(true)
    setMsg(null)
    try {
      const headers = await getAuthHeaders()
      const r = await fetch('/api/optimization/generate', { method: 'POST', headers })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setMsg(`Erreur : ${j.error || 'la generation a echoue'}`)
        return
      }
      const list: GeneratedTask[] = Array.isArray(j.tasks) ? j.tasks : Array.isArray(j.created) ? j.created : []
      setTasks(list)
      setDone(true)
    } catch {
      setMsg('Erreur reseau pendant la generation')
    } finally {
      setGenerating(false)
    }
  }

  const finish = async () => {
    setFinishing(true)
    try {
      const headers = await getAuthHeaders()
      await fetch('/api/client/onboarding', {
        method: 'PATCH', headers,
        body: JSON.stringify({ completed: true, step: 4 }),
      })
      await onComplete()
    } finally {
      setFinishing(false)
    }
  }

  return (
    <div className="glass-card p-6 md:p-8 space-y-5">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-[var(--text)]">Etape 3 sur 3 — Votre programme personnalise</h2>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Notre IA va analyser votre fiche Google et creer un plan d&apos;action sur mesure.
        </p>
      </div>

      {!done && (
        <div className="text-center py-8">
          {!generating ? (
            <button onClick={generate} className="btn-primary justify-center text-base !py-4 !px-8">
              Generer mon programme
            </button>
          ) : (
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[var(--text-muted)]">L&apos;IA analyse votre etablissement...</p>
              <p className="text-xs text-[var(--text-muted)]">Cela peut prendre 20 a 60 secondes.</p>
            </div>
          )}
          {msg && <p className="text-sm text-red-400 mt-4">{msg}</p>}
        </div>
      )}

      {done && (
        <div className="space-y-4">
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-5">
            <p className="text-sm text-green-300">
              <strong>{tasks.length}</strong> tache{tasks.length > 1 ? 's' : ''} generee{tasks.length > 1 ? 's' : ''} pour votre programme.
            </p>
          </div>
          {tasks.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 max-h-64 overflow-y-auto">
              <ul className="space-y-2 text-sm">
                {tasks.slice(0, 8).map((t, i) => (
                  <li key={t.id || i} className="flex items-start gap-2">
                    <span className="text-[var(--primary-light)] mt-0.5">•</span>
                    <span className="text-[var(--text)]">{t.title || `Tache ${i + 1}`}</span>
                  </li>
                ))}
                {tasks.length > 8 && (
                  <li className="text-xs text-[var(--text-muted)] italic pt-2">...et {tasks.length - 8} autres</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
        <button onClick={onBack} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
          ← Precedent
        </button>
        {done ? (
          <button onClick={finish} disabled={finishing} className="btn-primary justify-center disabled:opacity-50">
            {finishing ? 'Chargement...' : 'Acceder a mon dashboard →'}
          </button>
        ) : (
          <button
            onClick={async () => { await finish() }}
            disabled={finishing}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] underline"
          >
            Sauter et acceder au dashboard
          </button>
        )}
      </div>
    </div>
  )
}
