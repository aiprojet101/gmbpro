import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resultats d'audit Google My Business | GmbPro",
  description: "Decouvrez votre score GmbPro et les points a ameliorer sur votre fiche Google Business. Audit detaille sur 27 criteres.",
  alternates: { canonical: "/scanner/resultats" },
};

export default function ResultatsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
