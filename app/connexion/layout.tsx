import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion — GmbPro | Accedez a votre tableau de bord',
  description: 'Connectez-vous a votre espace GmbPro pour gerer et optimiser votre fiche Google Business Profile.',
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
