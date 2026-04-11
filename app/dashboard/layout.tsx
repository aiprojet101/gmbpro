import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tableau de bord — GmbPro',
  description: 'Gerez votre fiche Google Business, suivez vos performances SEO local, et optimisez votre visibilite avec GmbPro.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
