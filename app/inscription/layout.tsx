import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription — GmbPro | Creez votre compte',
  description: 'Creez votre compte GmbPro et optimisez votre fiche Google Business automatiquement. Essai gratuit 14 jours, sans engagement.',
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
