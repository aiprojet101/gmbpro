// Liste des villes francaises a prospecter (par taille decroissante)
export const CITIES = [
  'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Montpellier',
  'Strasbourg', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Saint-Etienne',
  'Toulon', 'Le Havre', 'Grenoble', 'Dijon', 'Angers', 'Nimes', 'Villeurbanne',
  'Saint-Denis', 'Le Mans', 'Aix-en-Provence', 'Clermont-Ferrand', 'Brest',
  'Tours', 'Limoges', 'Amiens', 'Perpignan', 'Metz', 'Besancon', 'Boulogne-Billancourt',
  'Orleans', 'Rouen', 'Mulhouse', 'Caen', 'Nancy', 'Argenteuil', 'Saint-Paul',
  'Roubaix', 'Tourcoing', 'Nanterre', 'Avignon', 'Vitry-sur-Seine', 'Creteil',
  'Dunkerque', 'Poitiers', 'Asnieres-sur-Seine', 'Versailles', 'Courbevoie',
]

// Secteurs avec emails frequemment trouvables et besoin SEO local fort
export const SECTORS = [
  'restaurant', 'boulangerie', 'coiffeur', 'pharmacie', 'pizzeria',
  'salon de beaute', 'garage automobile', 'fleuriste', 'cabinet dentaire',
  'opticien', 'plombier', 'electricien', 'agence immobiliere', 'bar',
  'hotel', 'cabinet medical', 'epicerie', 'boucherie', 'institut de beaute',
  'auto-ecole',
]

/**
 * Returns the next (city, sector) pair to scan.
 * Strategy: deterministic based on day-of-year so each day has a unique pair,
 * cycling through SECTORS first then CITIES (so we cover sectors faster per city).
 * 1000 unique pairs / 1 per day = ~3 years coverage.
 */
export function getNextPair(date: Date = new Date()): { city: string; sector: string; index: number; total: number } {
  // Day index since epoch (deterministic, doesn't reset)
  const dayIndex = Math.floor(date.getTime() / 86400000)
  const total = CITIES.length * SECTORS.length
  const i = ((dayIndex % total) + total) % total
  const cityIdx = Math.floor(i / SECTORS.length)
  const sectorIdx = i % SECTORS.length
  return { city: CITIES[cityIdx], sector: SECTORS[sectorIdx], index: i, total }
}
