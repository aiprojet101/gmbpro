import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CookieBanner from "./components/CookieBanner";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GmbPro - Optimisation automatique de votre fiche Google Business",
  description:
    "GmbPro detecte, corrige et optimise votre fiche Google Business automatiquement. Plus de clients locaux, zero effort. Audit gratuit en 30 secondes.",
  keywords: [
    "Google Business Profile",
    "fiche Google",
    "SEO local",
    "optimisation GMB",
    "Google My Business",
    "referencement local",
    "GmbPro",
  ],
  metadataBase: new URL("https://gmbpro.fr"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://gmbpro.fr",
    siteName: "GmbPro",
    title: "GmbPro - Votre fiche Google optimisee automatiquement",
    description:
      "Detecte, corrige et optimise votre presence Google Business. Plus de clients, zero effort.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "GmbPro" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GmbPro - Optimisation Google Business automatique",
    description: "Plus de clients locaux, zero effort. Audit gratuit.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "GmbPro",
                url: "https://gmbpro.fr",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                description:
                  "Optimisation automatique de fiches Google Business Profile pour le SEO local.",
                offers: [
                  {
                    "@type": "Offer",
                    name: "Starter",
                    price: "29",
                    priceCurrency: "EUR",
                  },
                  {
                    "@type": "Offer",
                    name: "Pro",
                    price: "39",
                    priceCurrency: "EUR",
                    priceSpecification: {
                      "@type": "UnitPriceSpecification",
                      billingDuration: "P1M",
                    },
                  },
                  {
                    "@type": "Offer",
                    name: "Premium",
                    price: "59",
                    priceCurrency: "EUR",
                    priceSpecification: {
                      "@type": "UnitPriceSpecification",
                      billingDuration: "P1M",
                    },
                  },
                ],
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: "4.8",
                  reviewCount: "127",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "GmbPro",
                url: "https://gmbpro.fr",
                logo: "https://gmbpro.fr/favicon.svg",
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "customer service",
                  availableLanguage: "French",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "Comment GmbPro optimise ma fiche ?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "GmbPro analyse 27 criteres de votre fiche Google Business, identifie les points faibles et applique automatiquement les corrections : description optimisee, categories pertinentes, horaires complets, attributs manquants.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Est-ce que j'ai besoin de donner acces a mon compte Google ?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Oui, un acces en lecture/ecriture a votre fiche Google Business est necessaire pour appliquer les optimisations. La connexion se fait via OAuth Google, securisee et revocable a tout moment.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Combien de temps pour voir des resultats ?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Les optimisations sont appliquees sous 24h. Les premiers resultats en termes de visibilite apparaissent generalement entre 2 et 4 semaines.",
                    },
                  },
                ],
              },
            ]),
          }}
        />
      </head>
      <body className="grain-overlay min-h-screen">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
