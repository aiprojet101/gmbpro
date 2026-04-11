import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scanner gratuit de fiche Google | GmbPro",
  description: "Analysez gratuitement votre fiche Google Business en 30 secondes. Audit complet sur 27 criteres, score detaille et recommandations personnalisees.",
  alternates: { canonical: "/scanner" },
};

export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
