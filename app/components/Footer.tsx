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

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-12 px-6" role="contentinfo">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <RadarIcon className="w-5 h-5 text-primary" />
            <span className="font-bold text-[var(--text)]">GmbPro</span>
            <span className="text-[var(--text-muted)] text-sm ml-2">Optimisation Google Business automatique</span>
          </div>
          <nav className="flex flex-wrap gap-6 text-sm text-[var(--text-muted)]" aria-label="Liens legaux">
            <Link href="/legal" className="hover:text-[var(--text)] transition-colors">Mentions legales</Link>
            <Link href="/privacy" className="hover:text-[var(--text)] transition-colors">Confidentialite</Link>
            <Link href="/terms" className="hover:text-[var(--text)] transition-colors">CGU</Link>
            <a href="mailto:contact@gmbpro.fr" className="hover:text-[var(--text)] transition-colors">Contact</a>
          </nav>
        </div>
        <p className="text-center text-xs text-[var(--text-muted)] mt-8">Fait avec precision en France</p>
      </div>
    </footer>
  );
}
