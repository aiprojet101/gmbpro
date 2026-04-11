import Link from "next/link";
import ReadingProgress from "./ReadingProgress";
import { articles } from "../data";

export default function ArticleLayout({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const article = articles.find((a) => a.slug === slug)!;

  return (
    <>
      <ReadingProgress />
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-40 glass">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="text-[var(--primary)]">Gmb</span>Pro
          </Link>
          <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
            <Link href="/blog" className="hover:text-[var(--text)] transition-colors">Blog</Link>
            <Link href="/scanner" className="btn-primary text-sm !py-2 !px-5">Scanner gratuit</Link>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-24 px-4">
        <article className="max-w-[720px] mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4 text-sm text-[var(--text-muted)]">
              <span className="px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-medium">
                {article.category}
              </span>
              <span>{article.date}</span>
              <span>·</span>
              <span>{article.readTime} de lecture</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
              {article.title}
            </h1>
            <p className="text-lg text-[var(--text-muted)]">{article.excerpt}</p>
          </div>

          {/* Content */}
          <div className="prose-dark">{children}</div>

          {/* CTA */}
          <div className="mt-16 glass-card p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Scannez votre fiche gratuitement</h2>
            <p className="text-[var(--text-muted)] mb-6">
              Decouvrez en 30 secondes les points a ameliorer sur votre fiche Google Business.
            </p>
            <Link href="/scanner" className="btn-primary text-lg">
              Lancer le scan gratuit →
            </Link>
          </div>

          {/* Related articles */}
          <div className="mt-16">
            <h3 className="text-xl font-bold mb-6">Articles similaires</h3>
            <div className="grid gap-4">
              {articles
                .filter((a) => a.slug !== slug)
                .slice(0, 3)
                .map((a) => (
                  <Link
                    key={a.slug}
                    href={`/blog/${a.slug}`}
                    className="glass-card p-5 flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-semibold group-hover:text-[var(--primary)] transition-colors">
                        {a.title}
                      </div>
                      <div className="text-sm text-[var(--text-muted)] mt-1">{a.readTime} · {a.category}</div>
                    </div>
                    <span className="text-[var(--primary)] text-xl ml-4">→</span>
                  </Link>
                ))}
            </div>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 text-center text-sm text-[var(--text-muted)]">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/" className="font-bold text-[var(--text)]">
            <span className="text-[var(--primary)]">Gmb</span>Pro
          </Link>
          <span className="mx-3">·</span>
          <span>© 2026 GmbPro. Tous droits reserves.</span>
          <span className="mx-3">·</span>
          <Link href="/legal" className="hover:text-[var(--text)]">Mentions legales</Link>
        </div>
      </footer>
    </>
  );
}
