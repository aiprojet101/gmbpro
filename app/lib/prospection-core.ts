import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface PlaceSearchResult {
  place_id: string
  name: string
  formatted_address?: string
  rating?: number
  user_ratings_total?: number
  types?: string[]
  business_status?: string
}

interface PlaceDetails {
  name?: string
  formatted_address?: string
  formatted_phone_number?: string
  website?: string
  rating?: number
  user_ratings_total?: number
  opening_hours?: { weekday_text?: string[] }
  photos?: { photo_reference: string }[]
  types?: string[]
  business_status?: string
  editorial_summary?: { overview?: string }
  reviews?: { time: number }[]
}

function computeScore(place: PlaceDetails): { global: number; passed: number; failed: number; total: number } {
  const photoCount = place.photos?.length || 0
  const reviewCount = place.user_ratings_total || 0
  const rating = place.rating || 0
  const hasPhone = !!place.formatted_phone_number
  const hasWebsite = !!place.website
  const hasHours = !!(place.opening_hours?.weekday_text?.length)
  const hasDescription = !!(place.editorial_summary?.overview && place.editorial_summary.overview.length > 50)
  const reviews = place.reviews || []
  const hasRecentReview = reviews.length > 0 && (Date.now() / 1000 - reviews[0].time) < 30 * 24 * 3600
  const types = place.types || []
  const isOperational = place.business_status === 'OPERATIONAL'

  const checks = [
    !!place.name && place.name.length > 1,
    !!place.formatted_address && place.formatted_address.includes(','),
    hasPhone,
    hasWebsite,
    hasHours,
    hasDescription,
    photoCount >= 1,
    photoCount >= 3,
    photoCount >= 10,
    photoCount >= 5,
    false,
    reviewCount >= 20,
    rating >= 4.0,
    false,
    hasRecentReview,
    false,
    false,
    types.length >= 2,
    hasHours && hasPhone,
    true,
    hasDescription,
    false,
    isOperational,
    true,
    hasPhone && !!place.formatted_address,
    false,
    hasWebsite,
  ]

  const total = checks.length
  const passed = checks.filter(Boolean).length
  const global = Math.round((passed / total) * 100)
  return { global, passed, failed: total - passed, total }
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.GMBPRO_SUPABASE_URL || ''
  const key = process.env.GMBPRO_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.GMBPRO_SUPABASE_ANON_KEY || ''
  if (!url || !key) return null
  return createClient(url, key)
}

export interface ProspectionScanInput {
  city: string
  sector: string
  region?: string
  maxResults?: number
  campaignNamePrefix?: string
  campaignNameSuffix?: string
}

export interface ProspectionScanResult {
  campaignId: string | null
  results: number
  found: number
  errors?: string[]
  error?: string
}

export async function runProspectionScan(input: ProspectionScanInput): Promise<ProspectionScanResult> {
  const { city, sector, region, campaignNamePrefix, campaignNameSuffix } = input
  const apiKey = process.env.GMBPRO_GOOGLE_PLACES_KEY
  if (!apiKey) {
    return { campaignId: null, results: 0, found: 0, error: 'GMBPRO_GOOGLE_PLACES_KEY manquante' }
  }
  if (!city || !sector) {
    return { campaignId: null, results: 0, found: 0, error: 'city et sector requis' }
  }

  const limit = Math.min(Math.max(input.maxResults ?? 20, 1), 60)
  const supabase = getSupabase()

  const baseName = campaignNamePrefix
    ? `${campaignNamePrefix} ${sector} - ${city}`
    : `${sector} - ${city}`
  const campaignName = campaignNameSuffix ? `${baseName}${campaignNameSuffix}` : baseName

  let campaignId: string | null = null
  if (supabase) {
    const baseInsert: Record<string, unknown> = {
      name: campaignName,
      city,
      sector,
      max_results: limit,
      status: 'running',
      started_at: new Date().toISOString(),
    }
    const { data, error: insErr } = await supabase
      .from('prospection_campaigns')
      .insert({ ...baseInsert, region: region || null })
      .select('id')
      .single()
    if (insErr) {
      // Fallback sans region
      const { data: data2 } = await supabase
        .from('prospection_campaigns')
        .insert(baseInsert)
        .select('id')
        .single()
      campaignId = data2?.id || null
    } else {
      campaignId = data?.id || null
    }
  }

  const query = `${sector} ${city}`
  const allResults: PlaceSearchResult[] = []
  let pageToken: string | undefined

  try {
    for (let page = 0; page < 3 && allResults.length < limit; page++) {
      const url = pageToken
        ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${pageToken}&key=${apiKey}`
        : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=fr&region=fr&key=${apiKey}`

      if (pageToken) {
        await new Promise(r => setTimeout(r, 2100))
      }

      const res = await fetch(url)
      const data = await res.json()

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('TextSearch error:', data.status, data.error_message)
        break
      }

      allResults.push(...(data.results || []))
      pageToken = data.next_page_token
      if (!pageToken) break
    }
  } catch (err) {
    console.error('Search error:', err)
  }

  const toProcess = allResults.slice(0, limit)
  let saved = 0
  const errors: string[] = []

  for (const result of toProcess) {
    try {
      const fields = [
        'name', 'formatted_address', 'formatted_phone_number', 'website',
        'rating', 'user_ratings_total', 'opening_hours', 'photos', 'types',
        'business_status', 'editorial_summary', 'reviews'
      ].join(',')

      const detailsRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${result.place_id}&fields=${fields}&language=fr&key=${apiKey}`
      )
      const detailsData = await detailsRes.json()
      if (detailsData.status !== 'OK' || !detailsData.result) {
        errors.push(`details_${detailsData.status || 'unknown'}`)
        continue
      }

      const place: PlaceDetails = detailsData.result
      const score = computeScore(place)

      const prospect = {
        place_id: result.place_id,
        business_name: place.name || result.name,
        city,
        sector,
        region: region || null,
        address: place.formatted_address || null,
        phone: place.formatted_phone_number || null,
        website: place.website || null,
        global_score: score.global,
        passed_count: score.passed,
        failed_count: score.failed,
        rating: place.rating || null,
        review_count: place.user_ratings_total || 0,
        photo_count: place.photos?.length || 0,
        status: 'new',
        source: 'google_places',
        updated_at: new Date().toISOString(),
      }

      if (supabase) {
        const { error } = await supabase
          .from('prospects')
          .upsert(prospect, { onConflict: 'place_id' })
        if (!error) saved++
        else {
          // Fallback : si la colonne region n'existe pas encore, retenter sans
          const isMissingCol = /column .* (region|does not exist)/i.test(error.message)
          if (isMissingCol) {
            const { region: _drop, ...prospectFallback } = prospect
            void _drop
            const { error: e2 } = await supabase
              .from('prospects')
              .upsert(prospectFallback, { onConflict: 'place_id' })
            if (!e2) saved++
            else if (errors.length < 3) errors.push(`upsert: ${e2.message}`)
          } else {
            console.error('Upsert error:', error.message)
            if (errors.length < 3) errors.push(`upsert: ${error.message}`)
          }
        }
      } else {
        if (errors.length < 3) errors.push('supabase_client_null')
      }
    } catch (err) {
      console.error('Detail/save error:', err)
      if (errors.length < 3) errors.push(`exception: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  if (supabase && campaignId) {
    await supabase
      .from('prospection_campaigns')
      .update({
        status: 'completed',
        results_count: saved,
        completed_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
  }

  return {
    campaignId,
    results: saved,
    found: toProcess.length,
    errors: errors.length > 0 ? errors : undefined,
  }
}
