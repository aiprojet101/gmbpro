import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "./data";

export const metadata: Metadata = {
  title: "Blog GmbPro — Guides SEO Local",
  description:
    "Guides, conseils et strategies pour optimiser votre fiche Google Business et dominer le referencement local.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-40 glass">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="text-[var(--primary)]">Gmb</span>Pro
          </Link>
          <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
            <Link href="/blog" className="text-[var(--text)] font-medium">Blog</Link>
            <Link href="/scanner" className="btn-primary text-sm !py-2 !px-5">Scanner gratuit</Link>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-24 section-padding">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Blog <span className="text-[var(--primary)]">GmbPro</span>
          </h1>
          <p className="text-lg text-[var(--text-muted)] mb-12 max-w-2xl">
            Guides, strategies et conseils actionables pour optimiser votre presence Google Business
            et attirer plus de clients locaux.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="glass-card p-6 flex flex-col group"
              >
                <div className="flex items-center gap-2 mb-4 text-xs text-[var(--text-muted)]">
                  <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-medium">
                    {article.category}
                  </span>
                  <span>{article.date}</span>
                  <span>·</span>
                  <span>{article.readTime}</span>
                </div>
                <h2 className="text-lg font-bold mb-3 group-hover:text-[var(--primary)] transition-colors leading-snug">
                  {article.title}
                </h2>
                <p className="text-sm text-[var(--text-muted)] flex-1">{article.excerpt}</p>
                <span className="mt-4 text-[var(--primary)] text-sm font-semibold">
                  Lire l&apos;article →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] py-8 text-center text-sm text-[var(--text-muted)]">
        <Link href="/" className="font-bold text-[var(--text)]">
          <span className="text-[var(--primary)]">Gmb</span>Pro
        </Link>
        <span className="mx-3">·</span>
        <span>© 2026 GmbPro. Tous droits reserves.</span>
      </footer>
    </>
  );
}
