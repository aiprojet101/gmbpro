'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const KEY = 'gmbpro_cookie_consent'

type Choice = 'accepted' | 'refused' | null

export default function CookieBanner() {
  const [choice, setChoice] = useState<Choice>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(KEY) as Choice | null
    if (saved === 'accepted' || saved === 'refused') setChoice(saved)
  }, [])

  const accept = () => {
    localStorage.setItem(KEY, 'accepted')
    setChoice('accepted')
  }
  const refuse = () => {
    localStorage.setItem(KEY, 'refused')
    setChoice('refused')
  }

  if (!mounted || choice) return null

  return (
    <div
      role="dialog"
      aria-label="Consentement aux cookies"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      style={{ animation: 'fadeInUp 0.4s ease' }}
    >
      <div
        className="max-w-4xl mx-auto p-5 md:p-6 rounded-2xl flex flex-col md:flex-row gap-4 md:items-center"
        style={{
          background: 'rgba(10, 14, 26, 0.95)',
          border: '1px solid var(--border)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--text)] mb-1">
            Cookies et confidentialite
          </p>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Nous utilisons uniquement des cookies essentiels au fonctionnement du site
            (session, securite). Aucun cookie publicitaire ni de tracking tiers.{' '}
            <Link href="/privacy" className="text-[var(--primary-light)] hover:underline">
              En savoir plus
            </Link>
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={refuse}
            className="px-4 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            Refuser
          </button>
          <button
            onClick={accept}
            className="btn-primary text-sm !py-2 !px-5 cursor-pointer"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}
