export interface Article {
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  keyword: string;
}

export const articles: Article[] = [
  {
    title: "Comment optimiser sa fiche Google My Business en 2026 — Guide complet",
    slug: "optimiser-fiche-google-my-business",
    excerpt: "Decouvrez les 10 etapes essentielles pour optimiser votre fiche Google Business et attirer plus de clients locaux. Guide complet avec checklist.",
    date: "2026-04-10",
    readTime: "8 min",
    category: "Guide",
    keyword: "optimiser fiche google my business",
  },
  {
    title: "Referencement local Google : le guide ultime pour les commercants",
    slug: "referencement-local-google",
    excerpt: "Comprenez les 3 piliers du SEO local et apprenez a dominer Google Maps et la recherche locale dans votre zone de chalandise.",
    date: "2026-04-08",
    readTime: "9 min",
    category: "SEO Local",
    keyword: "referencement local google",
  },
  {
    title: "Avis Google : pourquoi ils font (ou defont) votre business local",
    slug: "avis-google-importance",
    excerpt: "Les avis Google influencent directement votre classement local. Decouvrez comment en obtenir plus et comment y repondre efficacement.",
    date: "2026-04-05",
    readTime: "7 min",
    category: "Reputation",
    keyword: "avis google importance",
  },
  {
    title: "Google Posts : l'arme secrete du SEO local que personne n'utilise",
    slug: "google-posts-guide",
    excerpt: "Les Google Posts sont sous-utilises par 90% des commercants. Apprenez a les maitriser pour booster votre visibilite locale.",
    date: "2026-04-03",
    readTime: "6 min",
    category: "Google Posts",
    keyword: "google posts",
  },
  {
    title: "Votre fiche Google est invisible ? Voici les 7 raisons (et comment y remedier)",
    slug: "fiche-google-invisible",
    excerpt: "Si votre fiche Google n'apparait pas dans les resultats, l'une de ces 7 causes est probablement responsable. Diagnostic et solutions.",
    date: "2026-04-01",
    readTime: "7 min",
    category: "Diagnostic",
    keyword: "fiche google invisible",
  },
];
