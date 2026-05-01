// Prospection diversifiee : 7 regions FR + outre-mer x 5 villes x 20 secteurs = 700 paires

export interface Region {
  id: string
  label: string
  cities: string[]
}

export const REGIONS: Region[] = [
  { id: 'IDF', label: 'Ile-de-France', cities: ['Paris', 'Versailles', 'Boulogne-Billancourt', 'Argenteuil', 'Nanterre'] },
  { id: 'NW', label: 'Nord-Ouest', cities: ['Rennes', 'Brest', 'Nantes', 'Caen', 'Le Havre'] },
  { id: 'NE', label: 'Nord-Est', cities: ['Strasbourg', 'Lille', 'Reims', 'Metz', 'Nancy'] },
  { id: 'CENTRE', label: 'Centre', cities: ['Tours', 'Orleans', 'Limoges', 'Clermont-Ferrand', 'Dijon'] },
  { id: 'SW', label: 'Sud-Ouest', cities: ['Bordeaux', 'Toulouse', 'Bayonne', 'Pau', 'La Rochelle'] },
  { id: 'SE', label: 'Sud-Est', cities: ['Marseille', 'Nice', 'Lyon', 'Montpellier', 'Aix-en-Provence'] },
  { id: 'OM', label: 'Outre-mer', cities: ['Saint-Denis Reunion', 'Fort-de-France', 'Pointe-a-Pitre', 'Cayenne', 'Mamoudzou'] },
]

// 20 secteurs prioritaires (Tier S + Tier A)
export const SECTORS = [
  'diagnostic immobilier',
  'installateur panneaux solaires',
  'installateur pompe a chaleur',
  'onglerie',
  'extension cils',
  'reparation telephone',
  'plombier',
  'electricien',
  'auto-ecole',
  'veterinaire',
  'salon de coiffure',
  'institut de beaute',
  'coach sportif',
  'kinesitherapeute',
  'osteopathe',
  'avocat',
  'notaire',
  'toiletteur animaux',
  'cabinet dentaire',
  'opticien',
]

// Total combinatoire (regions * villes * secteurs)
export const TOTAL_PAIRS = REGIONS.reduce((sum, r) => sum + r.cities.length, 0) * SECTORS.length

/**
 * Returns the next (city, sector, region) to scan based on runIndex.
 * Strategy: rotate region & sector independently for max diversification.
 * - runIndex % REGIONS.length          → region (cycle 7 runs)
 * - runIndex % SECTORS.length          → sector (cycle 20 runs)
 * - floor(runIndex / REGIONS.length) % cities.length → city in region (slower rotation)
 *
 * After 140 runs (~17 days at 8/day): every (region, sector) combo tested.
 * After 700 runs (~3 months): every (region, city, sector) covered.
 */
export function getNextDiversified(runIndex: number): { city: string; sector: string; region: string; regionLabel: string; index: number; total: number } {
  const safeIdx = ((runIndex % 1_000_000) + 1_000_000) % 1_000_000
  const region = REGIONS[safeIdx % REGIONS.length]
  const cityIdx = Math.floor(safeIdx / REGIONS.length) % region.cities.length
  const sectorIdx = safeIdx % SECTORS.length
  return {
    city: region.cities[cityIdx],
    sector: SECTORS[sectorIdx],
    region: region.id,
    regionLabel: region.label,
    index: safeIdx,
    total: TOTAL_PAIRS,
  }
}

// Flatten regions pour backward compat
export const CITIES = REGIONS.flatMap(r => r.cities)

/**
 * Backward compat: date-based pair (used as fallback).
 * Returns same shape as before but now includes region.
 */
export function getNextPair(date: Date = new Date()): { city: string; sector: string; region: string; regionLabel: string; index: number; total: number } {
  const dayIndex = Math.floor(date.getTime() / 86400000)
  return getNextDiversified(dayIndex)
}
