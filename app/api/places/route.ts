import { NextRequest, NextResponse } from 'next/server'

// Google Places Autocomplete — server-side proxy
// Env: GMBPRO_GOOGLE_PLACES_KEY

const MOCK_SUGGESTIONS: Record<string, Array<{ name: string; address: string; placeId: string }>> = {
  res: [
    { name: 'Restaurant Le Comptoir', address: '12 Rue de la Republique, Lyon', placeId: 'mock_1' },
    { name: 'Restaurant La Belle Epoque', address: '45 Avenue Jean Jaures, Paris', placeId: 'mock_2' },
    { name: 'Restaurant Chez Marcel', address: '8 Place du Marche, Marseille', placeId: 'mock_3' },
    { name: 'Restaurant Le Bistrot du Port', address: '3 Quai des Belges, Marseille', placeId: 'mock_4' },
  ],
  bou: [
    { name: 'Boulangerie Maison Dupont', address: '22 Rue du Commerce, Toulouse', placeId: 'mock_5' },
    { name: 'Boulangerie Au Pain Dore', address: '15 Avenue Foch, Bordeaux', placeId: 'mock_6' },
    { name: 'Boutique Mode & Style', address: '7 Rue de la Paix, Paris', placeId: 'mock_7' },
  ],
  sal: [
    { name: 'Salon de Coiffure Elegance', address: '33 Boulevard Haussmann, Paris', placeId: 'mock_8' },
    { name: 'Salon Beaute & Bien-etre', address: '19 Rue de Rivoli, Lyon', placeId: 'mock_9' },
    { name: 'Salle de Sport FitZone', address: '5 Rue du Stade, Lille', placeId: 'mock_10' },
  ],
  gar: [
    { name: 'Garage Auto Plus', address: '120 Route de Paris, Nantes', placeId: 'mock_11' },
    { name: 'Garage Dupont & Fils', address: '45 Rue Nationale, Tours', placeId: 'mock_12' },
  ],
  piz: [
    { name: 'Pizzeria Da Luigi', address: '8 Rue des Italiens, Lyon', placeId: 'mock_13' },
    { name: 'Pizza Napoli', address: '25 Cours Mirabeau, Aix-en-Provence', placeId: 'mock_14' },
  ],
  cab: [
    { name: 'Cabinet Dentaire Dr Martin', address: '10 Place Bellecour, Lyon', placeId: 'mock_15' },
    { name: 'Cabinet Medical Centre Ville', address: '55 Avenue de la Gare, Rennes', placeId: 'mock_16' },
  ],
  pha: [
    { name: 'Pharmacie Centrale', address: '1 Place de la Mairie, Strasbourg', placeId: 'mock_17' },
    { name: 'Pharmacie du Marche', address: '30 Rue du Commerce, Nice', placeId: 'mock_18' },
  ],
}

function getMockSuggestions(query: string) {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return []

  // Check prefix matches
  for (const [prefix, suggestions] of Object.entries(MOCK_SUGGESTIONS)) {
    if (q.startsWith(prefix)) return suggestions
  }

  // Default: generate from query
  const cities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Lille', 'Nantes']
  return cities.slice(0, 3).map((city, i) => ({
    name: query.charAt(0).toUpperCase() + query.slice(1),
    address: `${10 + i * 12} Rue Principale, ${city}`,
    placeId: `mock_gen_${i}`,
  }))
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim()
  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  const apiKey = process.env.GMBPRO_GOOGLE_PLACES_KEY

  // If no API key, return mock data
  if (!apiKey) {
    return NextResponse.json({ suggestions: getMockSuggestions(query) })
  }

  // Real Google Places Autocomplete
  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=establishment&components=country:fr&language=fr&key=${apiKey}`
    const res = await fetch(url)
    const data = await res.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', data.status, data.error_message || '')
      // Return error info in dev so we can debug
      return NextResponse.json({ suggestions: getMockSuggestions(query), _debug: { status: data.status, error: data.error_message } })
    }

    const suggestions = (data.predictions || []).slice(0, 5).map((p: { structured_formatting: { main_text: string; secondary_text: string }; place_id: string }) => ({
      name: p.structured_formatting.main_text,
      address: p.structured_formatting.secondary_text,
      placeId: p.place_id,
    }))

    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: getMockSuggestions(query) })
  }
}
