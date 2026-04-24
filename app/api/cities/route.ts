import { NextRequest, NextResponse } from 'next/server'

// French cities autocomplete via Google Places API (types=(cities))
// Returns: { suggestions: [{ name, region, placeId }] }

const MOCK_CITIES = [
  { name: 'Paris', region: 'Ile-de-France', placeId: 'mock_paris' },
  { name: 'Lyon', region: 'Auvergne-Rhone-Alpes', placeId: 'mock_lyon' },
  { name: 'Marseille', region: 'Provence-Alpes-Cote d\'Azur', placeId: 'mock_marseille' },
  { name: 'Toulouse', region: 'Occitanie', placeId: 'mock_toulouse' },
  { name: 'Bordeaux', region: 'Nouvelle-Aquitaine', placeId: 'mock_bordeaux' },
  { name: 'Lille', region: 'Hauts-de-France', placeId: 'mock_lille' },
  { name: 'Nantes', region: 'Pays de la Loire', placeId: 'mock_nantes' },
  { name: 'Strasbourg', region: 'Grand Est', placeId: 'mock_strasbourg' },
  { name: 'Montpellier', region: 'Occitanie', placeId: 'mock_montpellier' },
  { name: 'Rennes', region: 'Bretagne', placeId: 'mock_rennes' },
  { name: 'Nice', region: 'Provence-Alpes-Cote d\'Azur', placeId: 'mock_nice' },
  { name: 'Reims', region: 'Grand Est', placeId: 'mock_reims' },
  { name: 'Le Havre', region: 'Normandie', placeId: 'mock_lehavre' },
  { name: 'Saint-Etienne', region: 'Auvergne-Rhone-Alpes', placeId: 'mock_saintetienne' },
  { name: 'Toulon', region: 'Provence-Alpes-Cote d\'Azur', placeId: 'mock_toulon' },
  { name: 'Grenoble', region: 'Auvergne-Rhone-Alpes', placeId: 'mock_grenoble' },
  { name: 'Dijon', region: 'Bourgogne-Franche-Comte', placeId: 'mock_dijon' },
  { name: 'Angers', region: 'Pays de la Loire', placeId: 'mock_angers' },
  { name: 'Nimes', region: 'Occitanie', placeId: 'mock_nimes' },
  { name: 'Villeurbanne', region: 'Auvergne-Rhone-Alpes', placeId: 'mock_villeurbanne' },
]

function getMockCities(query: string) {
  const q = query.toLowerCase().trim()
  if (q.length < 1) return []
  return MOCK_CITIES.filter(c => c.name.toLowerCase().startsWith(q)).slice(0, 6)
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim()
  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  const apiKey = process.env.GMBPRO_GOOGLE_PLACES_KEY

  if (!apiKey) {
    return NextResponse.json({ suggestions: getMockCities(query) })
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&components=country:fr&language=fr&key=${apiKey}`
    const res = await fetch(url)
    const data = await res.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return NextResponse.json({ suggestions: getMockCities(query) })
    }

    const suggestions = (data.predictions || []).slice(0, 6).map((p: { structured_formatting: { main_text: string; secondary_text?: string }; place_id: string }) => ({
      name: p.structured_formatting.main_text,
      region: p.structured_formatting.secondary_text || '',
      placeId: p.place_id,
    }))

    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: getMockCities(query) })
  }
}
