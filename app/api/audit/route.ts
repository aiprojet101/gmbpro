import { NextRequest, NextResponse } from 'next/server'

// Real GMB audit via Google Places Details API
// Returns real data for ~15 criteria, estimates for the rest

interface PlaceDetails {
  name: string
  formatted_address: string
  formatted_phone_number?: string
  website?: string
  rating?: number
  user_ratings_total?: number
  opening_hours?: { weekday_text?: string[]; open_now?: boolean }
  photos?: { photo_reference: string }[]
  types?: string[]
  business_status?: string
  url?: string // Google Maps URL
  editorial_summary?: { overview?: string }
  reviews?: { rating: number; text: string; time: number; author_name: string; relative_time_description: string }[]
}

interface CriterionResult {
  label: string
  passed: boolean
  detail: string
  source: 'api' | 'estimate'
}

interface CategoryResult {
  name: string
  criteria: CriterionResult[]
  score: number
  total: number
}

interface AuditResult {
  businessName: string
  city: string
  globalScore: number
  categories: CategoryResult[]
  passedCount: number
  failedCount: number
  totalCriteria: number
  rating?: number
  reviewCount?: number
  photoCount?: number
  hasWebsite?: boolean
}

function extractCity(address: string): string {
  // Try to extract city from formatted address (e.g., "12 Rue X, 75001 Paris, France")
  const parts = address.split(',').map(p => p.trim())
  if (parts.length >= 2) {
    const cityPart = parts[parts.length - 2] // Usually "75001 Paris" or "Lyon"
    return cityPart.replace(/^\d{5}\s*/, '').trim() // Remove postal code
  }
  return address
}

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get('placeId')
  const name = req.nextUrl.searchParams.get('name') || ''
  const city = req.nextUrl.searchParams.get('city') || ''

  const apiKey = process.env.GMBPRO_GOOGLE_PLACES_KEY

  if (!placeId || !apiKey) {
    // Fallback to mock
    return NextResponse.json({ error: 'missing_params', fallback: true })
  }

  try {
    // Fetch place details
    const fields = [
      'name', 'formatted_address', 'formatted_phone_number', 'website',
      'rating', 'user_ratings_total', 'opening_hours', 'photos', 'types',
      'business_status', 'url', 'editorial_summary', 'reviews'
    ].join(',')

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=fr&key=${apiKey}`
    )
    const data = await res.json()

    if (data.status !== 'OK' || !data.result) {
      console.error('Places Details error:', data.status, data.error_message)
      return NextResponse.json({ error: data.status, fallback: true })
    }

    const place: PlaceDetails = data.result
    const audit = buildAudit(place, name || place.name, city || extractCity(place.formatted_address || ''))

    return NextResponse.json({ audit })
  } catch (err) {
    console.error('Audit error:', err)
    return NextResponse.json({ error: 'server_error', fallback: true })
  }
}

function buildAudit(place: PlaceDetails, businessName: string, city: string): AuditResult {
  const photoCount = place.photos?.length || 0
  const reviewCount = place.user_ratings_total || 0
  const rating = place.rating || 0
  const hasPhone = !!place.formatted_phone_number
  const hasWebsite = !!place.website
  const hasHours = !!(place.opening_hours?.weekday_text?.length)
  const hasDescription = !!(place.editorial_summary?.overview && place.editorial_summary.overview.length > 50)
  const reviews = place.reviews || []
  const hasRecentReview = reviews.length > 0 && (Date.now() / 1000 - reviews[0].time) < 30 * 24 * 3600

  // ─── Category 1: Informations de base (6 criteres — all from API) ───
  const cat1: CriterionResult[] = [
    {
      label: "Nom de l'etablissement",
      passed: !!place.name && place.name.length > 1,
      detail: place.name ? `"${place.name}" — correctement renseigne` : "Le nom n'est pas renseigne",
      source: 'api',
    },
    {
      label: "Adresse complete",
      passed: !!place.formatted_address && place.formatted_address.includes(','),
      detail: place.formatted_address ? `${place.formatted_address}` : "Adresse incomplete ou manquante",
      source: 'api',
    },
    {
      label: "Numero de telephone",
      passed: hasPhone,
      detail: hasPhone ? `${place.formatted_phone_number} — renseigne` : "Aucun numero de telephone renseigne",
      source: 'api',
    },
    {
      label: "Site web",
      passed: hasWebsite,
      detail: hasWebsite ? `${place.website} — lie a la fiche` : "Aucun site web associe a la fiche",
      source: 'api',
    },
    {
      label: "Horaires d'ouverture",
      passed: hasHours,
      detail: hasHours ? `Horaires complets renseignes (${place.opening_hours!.weekday_text!.length} jours)` : "Les horaires sont absents ou incomplets",
      source: 'api',
    },
    {
      label: "Description de l'activite",
      passed: hasDescription,
      detail: hasDescription
        ? `Description presente (${place.editorial_summary!.overview!.length} caracteres)`
        : "Description absente ou trop courte — objectif : 250+ caracteres avec mots-cles",
      source: 'api',
    },
  ]

  // ─── Category 2: Contenu visuel (5 criteres — partial API) ───
  const cat2: CriterionResult[] = [
    {
      label: "Photo de couverture",
      passed: photoCount >= 1,
      detail: photoCount >= 1 ? "Photo de couverture presente" : "Aucune photo sur la fiche",
      source: 'api',
    },
    {
      label: "Logo",
      passed: photoCount >= 3, // Heuristic: if 3+ photos, logo likely present
      detail: photoCount >= 3 ? "Logo probablement present (3+ photos detectees)" : "Peu de photos — logo probablement absent",
      source: 'estimate',
    },
    {
      label: "Photos de l'etablissement (min 10)",
      passed: photoCount >= 10,
      detail: `${photoCount} photo${photoCount > 1 ? 's' : ''} detectee${photoCount > 1 ? 's' : ''} — ${photoCount >= 10 ? 'bon volume' : 'objectif : 10 minimum'}`,
      source: 'api',
    },
    {
      label: "Photos des produits/services",
      passed: photoCount >= 5,
      detail: photoCount >= 5 ? "Volume de photos suffisant pour couvrir produits/services" : "Ajoutez des photos de vos produits et services",
      source: 'estimate',
    },
    {
      label: "Visite virtuelle",
      passed: false, // Cannot detect via API
      detail: "Non detectable automatiquement — verifiez manuellement sur votre fiche",
      source: 'estimate',
    },
  ]

  // ─── Category 3: Engagement (6 criteres — mostly API) ───
  const cat3: CriterionResult[] = [
    {
      label: "Nombre d'avis (min 20)",
      passed: reviewCount >= 20,
      detail: `${reviewCount} avis — ${reviewCount >= 20 ? 'bon volume, continuez !' : `objectif : 20 minimum (il en manque ${Math.max(0, 20 - reviewCount)})`}`,
      source: 'api',
    },
    {
      label: "Note moyenne (min 4.0)",
      passed: rating >= 4.0,
      detail: rating > 0 ? `Note : ${rating}/5 — ${rating >= 4.0 ? 'excellente note !' : 'a ameliorer, repondez aux avis negatifs'}` : "Aucune note disponible",
      source: 'api',
    },
    {
      label: "Taux de reponse aux avis",
      passed: false, // Cannot reliably detect via Places API
      detail: "Non mesurable automatiquement — GmbPro Pro analyse et repond a vos avis",
      source: 'estimate',
    },
    {
      label: "Dernier avis recent (< 30 jours)",
      passed: hasRecentReview,
      detail: hasRecentReview
        ? `Avis recent detecte — fiche active`
        : "Aucun avis recent — votre fiche parait inactive aux yeux de Google",
      source: 'api',
    },
    {
      label: "Reponse aux questions",
      passed: false, // Cannot detect via API
      detail: "Non mesurable automatiquement — GmbPro Premium gere vos questions",
      source: 'estimate',
    },
    {
      label: "Posts Google recents",
      passed: false, // Cannot detect via Places API
      detail: "Non detectable via l'API — GmbPro Pro publie 4 posts/mois pour vous",
      source: 'estimate',
    },
  ]

  // ─── Category 4: SEO Local (5 criteres — partial API) ───
  const types = place.types || []
  const hasMultipleCategories = types.length >= 2
  const cat4: CriterionResult[] = [
    {
      label: "Categories bien definies",
      passed: hasMultipleCategories,
      detail: hasMultipleCategories
        ? `${types.length} categories detectees : ${types.slice(0, 3).join(', ')}`
        : "Une seule categorie — ajoutez des categories secondaires pertinentes",
      source: 'api',
    },
    {
      label: "Attributs renseignes",
      passed: hasHours && hasPhone, // Heuristic
      detail: hasHours && hasPhone ? "Attributs de base presents (horaires, telephone)" : "Attributs incomplets — renseignez Wi-Fi, accessibilite, paiements acceptes",
      source: 'estimate',
    },
    {
      label: "Zone de chalandise",
      passed: true, // Default pass — most businesses have this
      detail: "Zone de chalandise definie par defaut par Google",
      source: 'estimate',
    },
    {
      label: "Mots-cles dans la description",
      passed: hasDescription,
      detail: hasDescription ? "Description presente — verifiez qu'elle contient vos mots-cles" : "Sans description, Google ne sait pas quels mots-cles vous associer",
      source: 'estimate',
    },
    {
      label: "Lien de reservation",
      passed: false, // Cannot detect via API, estimate false
      detail: "Aucun lien de reservation detecte — ajoutez un lien de prise de RDV",
      source: 'estimate',
    },
  ]

  // ─── Category 5: Technique (5 criteres — partial API) ───
  const isOperational = place.business_status === 'OPERATIONAL'
  const cat5: CriterionResult[] = [
    {
      label: "Fiche verifiee",
      passed: isOperational,
      detail: isOperational ? "La fiche est active et operationnelle" : "Statut de la fiche : " + (place.business_status || 'inconnu'),
      source: 'api',
    },
    {
      label: "Pas de doublons",
      passed: true, // Default pass — requires deeper analysis
      detail: "Analyse des doublons disponible avec GmbPro Pro",
      source: 'estimate',
    },
    {
      label: "NAP coherent (nom/adresse/tel)",
      passed: hasPhone && !!place.formatted_address,
      detail: hasPhone && place.formatted_address ? "Nom, adresse et telephone presents sur la fiche" : "Informations NAP incompletes sur la fiche",
      source: 'estimate',
    },
    {
      label: "Donnees structurees site",
      passed: false, // Would require crawling the website
      detail: "Analyse du site web disponible avec GmbPro — verifiez le Schema LocalBusiness",
      source: 'estimate',
    },
    {
      label: "Mobile-friendly du site",
      passed: hasWebsite, // Heuristic: if has website, likely mobile-friendly in 2026
      detail: hasWebsite ? "Site web present — test mobile recommande" : "Pas de site web a analyser",
      source: 'estimate',
    },
  ]

  // ─── Build final result ───
  const allCategories: CategoryResult[] = [
    { name: "Informations de base", criteria: cat1, score: cat1.filter(c => c.passed).length, total: cat1.length },
    { name: "Contenu visuel", criteria: cat2, score: cat2.filter(c => c.passed).length, total: cat2.length },
    { name: "Engagement", criteria: cat3, score: cat3.filter(c => c.passed).length, total: cat3.length },
    { name: "SEO Local", criteria: cat4, score: cat4.filter(c => c.passed).length, total: cat4.length },
    { name: "Technique", criteria: cat5, score: cat5.filter(c => c.passed).length, total: cat5.length },
  ]

  const passedCount = allCategories.reduce((sum, cat) => sum + cat.score, 0)
  const totalCriteria = allCategories.reduce((sum, cat) => sum + cat.total, 0)
  const globalScore = Math.round((passedCount / totalCriteria) * 100)

  return {
    businessName: businessName || place.name,
    city,
    globalScore,
    categories: allCategories,
    passedCount,
    failedCount: totalCriteria - passedCount,
    totalCriteria,
    rating,
    reviewCount,
    photoCount,
    hasWebsite,
  }
}
