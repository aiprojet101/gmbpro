// Deterministic mock score generator based on business name
// Uses simple hash to always return same results for same input

export interface CriterionResult {
  label: string;
  passed: boolean;
  detail: string;
}

export interface CategoryResult {
  name: string;
  criteria: CriterionResult[];
  score: number;
  total: number;
}

export interface AuditResult {
  businessName: string;
  city: string;
  globalScore: number;
  categories: CategoryResult[];
  passedCount: number;
  failedCount: number;
  totalCriteria: number;
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed + index * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

const CATEGORIES_DATA = [
  {
    name: "Informations de base",
    criteria: [
      { label: "Nom de l'etablissement", detail_pass: "Le nom est correctement renseigne", detail_fail: "Le nom contient des mots-cles non autorises" },
      { label: "Adresse complete", detail_pass: "L'adresse est complete et verifiee", detail_fail: "L'adresse est incomplete ou imprecise" },
      { label: "Numero de telephone", detail_pass: "Un numero de telephone local est renseigne", detail_fail: "Aucun numero de telephone renseigne" },
      { label: "Site web", detail_pass: "Le site web est correctement lie", detail_fail: "Aucun site web associe a la fiche" },
      { label: "Horaires d'ouverture", detail_pass: "Les horaires sont complets et a jour", detail_fail: "Les horaires sont incomplets ou absents" },
      { label: "Description de l'activite", detail_pass: "Description optimisee avec mots-cles pertinents", detail_fail: "Description absente ou trop courte (< 250 caracteres)" },
    ],
  },
  {
    name: "Contenu visuel",
    criteria: [
      { label: "Photo de couverture", detail_pass: "Photo de couverture de qualite presente", detail_fail: "Aucune photo de couverture ou qualite insuffisante" },
      { label: "Logo", detail_pass: "Logo professionnel renseigne", detail_fail: "Logo absent de la fiche" },
      { label: "Photos de l'etablissement (min 10)", detail_pass: "Plus de 10 photos de l'etablissement", detail_fail: "Moins de 10 photos de l'etablissement" },
      { label: "Photos des produits/services", detail_pass: "Photos de produits/services presentes", detail_fail: "Aucune photo de produits ou services" },
      { label: "Visite virtuelle", detail_pass: "Visite virtuelle 360 disponible", detail_fail: "Pas de visite virtuelle configuree" },
    ],
  },
  {
    name: "Engagement",
    criteria: [
      { label: "Nombre d'avis (min 20)", detail_pass: "Plus de 20 avis clients", detail_fail: "Moins de 20 avis — visibilite reduite" },
      { label: "Note moyenne (min 4.0)", detail_pass: "Note moyenne superieure a 4.0", detail_fail: "Note moyenne inferieure a 4.0" },
      { label: "Taux de reponse aux avis", detail_pass: "Plus de 80% des avis ont une reponse", detail_fail: "Trop peu d'avis ont recu une reponse" },
      { label: "Dernier avis < 30 jours", detail_pass: "Avis recent (moins de 30 jours)", detail_fail: "Aucun avis recent — fiche inactive" },
      { label: "Reponse aux questions", detail_pass: "Les questions des clients sont traitees", detail_fail: "Des questions restent sans reponse" },
      { label: "Posts Google recents", detail_pass: "Posts publies dans les 7 derniers jours", detail_fail: "Aucun post Google recent" },
    ],
  },
  {
    name: "SEO Local",
    criteria: [
      { label: "Categories bien definies", detail_pass: "Categories principales et secondaires optimisees", detail_fail: "Categories manquantes ou mal choisies" },
      { label: "Attributs renseignes", detail_pass: "Attributs de la fiche complets", detail_fail: "Attributs manquants (Wi-Fi, accessibilite, etc.)" },
      { label: "Zone de chalandise", detail_pass: "Zone de service correctement definie", detail_fail: "Zone de chalandise non configuree" },
      { label: "Mots-cles dans la description", detail_pass: "Mots-cles pertinents integres naturellement", detail_fail: "Description sans mots-cles strategiques" },
      { label: "Lien de reservation", detail_pass: "Lien de reservation ou prise de RDV actif", detail_fail: "Aucun lien de reservation configure" },
    ],
  },
  {
    name: "Technique",
    criteria: [
      { label: "Fiche verifiee", detail_pass: "La fiche est verifiee par Google", detail_fail: "La fiche n'est pas verifiee" },
      { label: "Pas de doublons", detail_pass: "Aucune fiche doublon detectee", detail_fail: "Doublons potentiels detectes" },
      { label: "NAP coherent (nom/adresse/tel)", detail_pass: "Informations coherentes partout sur le web", detail_fail: "Incoherences NAP detectees sur d'autres sites" },
      { label: "Donnees structurees site", detail_pass: "Schema LocalBusiness present sur le site", detail_fail: "Pas de donnees structurees sur le site web" },
      { label: "Mobile-friendly du site", detail_pass: "Le site est optimise mobile", detail_fail: "Le site n'est pas adapte au mobile" },
    ],
  },
];

export function generateAudit(businessName: string, city: string): AuditResult {
  const seed = hash((businessName + city).toLowerCase().trim());
  // Score between 15-85
  const globalScore = 15 + Math.floor(seededRandom(seed, 0) * 70);
  // Probability of passing a criterion based on score
  const passProb = globalScore / 100;

  let passedCount = 0;
  let totalCriteria = 0;

  const categories: CategoryResult[] = CATEGORIES_DATA.map((cat, ci) => {
    let catPassed = 0;
    const criteria: CriterionResult[] = cat.criteria.map((cr, cri) => {
      totalCriteria++;
      const r = seededRandom(seed, ci * 10 + cri + 1);
      // Bias: first criteria in each category more likely to pass (basic stuff)
      const bias = cri < 2 ? 0.2 : cri > 3 ? -0.15 : 0;
      const passed = r < passProb + bias;
      if (passed) { catPassed++; passedCount++; }
      return {
        label: cr.label,
        passed,
        detail: passed ? cr.detail_pass : cr.detail_fail,
      };
    });
    return {
      name: cat.name,
      criteria,
      score: catPassed,
      total: cat.criteria.length,
    };
  });

  return {
    businessName,
    city,
    globalScore,
    categories,
    passedCount,
    failedCount: totalCriteria - passedCount,
    totalCriteria,
  };
}
