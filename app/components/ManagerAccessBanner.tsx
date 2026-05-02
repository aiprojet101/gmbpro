'use client'

import { useEffect, useState } from 'react'

interface Props {
  status: string | null | undefined
  onConfigure: () => void
}

const STORAGE_KEY = 'gmbpro_manager_banner_dismissed'

export default function ManagerAccessBanner({ status, onConfigure }: Props) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === '1')
    } catch { /* ignore */ }
  }, [])

  const normalized = (status || 'pending') as string
  if (normalized !== 'pending' && normalized !== 'sent') return null
  if (dismissed) return null

  const isPending = normalized === 'pending'
  const title = isPending
    ? "Activez l'automatisation : donnez-nous l'acces Manager a votre fiche Google"
    : "En attente de validation de votre invitation Manager"

  const handleDismiss = () => {
    try { window.localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
    setDismissed(true)
  }

  return (
    <div
      className="w-full border-b border-[var(--border)] flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 text-sm"
      style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.18), rgba(16,185,129,0.18))' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <svg className="w-5 h-5 shrink-0 text-[var(--primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 21a9 9 0 110-18 9 9 0 010 18z" />
        </svg>
        <span className="truncate text-[var(--text)]">{title}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onConfigure}
          className="px-3 py-1.5 rounded-md bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 transition cursor-pointer"
        >
          Configurer maintenant
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Fermer"
          className="text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer p-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
