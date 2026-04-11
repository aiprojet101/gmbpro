"use client";

import { useState } from "react";
import Link from "next/link";

function RadarIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" opacity="0.3" />
      <circle cx="12" cy="12" r="6" opacity="0.6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <line x1="12" y1="2" x2="12" y2="12" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="3s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass" role="banner">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between" aria-label="Navigation principale">
        <Link href="/" className="flex items-center gap-2" aria-label="GmbPro accueil">
          <RadarIcon className="w-7 h-7 text-primary" />
          <span className="text-xl font-extrabold text-[var(--text)]">GmbPro</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Fonctionnalites</Link>
          <Link href="/#pricing" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Tarifs</Link>
          <Link href="/#faq" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">FAQ</Link>
          <Link href="/scanner" className="btn-primary text-sm !py-2 !px-5">Scanner ma fiche</Link>
        </div>
        <button
          className="md:hidden text-[var(--text)] cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {menuOpen
              ? <path d="M6 18L18 6M6 6l12 12" />
              : <path d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </nav>
      {menuOpen && (
        <div className="md:hidden glass border-t border-[var(--border)] px-6 py-4 flex flex-col gap-3">
          <Link href="/#features" onClick={() => setMenuOpen(false)} className="text-sm text-[var(--text-muted)] text-left">Fonctionnalites</Link>
          <Link href="/#pricing" onClick={() => setMenuOpen(false)} className="text-sm text-[var(--text-muted)] text-left">Tarifs</Link>
          <Link href="/#faq" onClick={() => setMenuOpen(false)} className="text-sm text-[var(--text-muted)] text-left">FAQ</Link>
          <Link href="/scanner" onClick={() => setMenuOpen(false)} className="btn-primary text-sm !py-2 text-center">Scanner ma fiche</Link>
        </div>
      )}
    </header>
  );
}
