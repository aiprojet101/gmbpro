import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_PASSWORD = process.env.GMBPRO_ADMIN_PASSWORD || 'gmbpro-admin-2026'

export const maxDuration = 60

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
    false, // visite virtuelle
    reviewCount >= 20,
    rating >= 4.0,
    false, // taux reponse
    hasRecentReview,
    false, // questions
    false, // posts
    types.length >= 2,
    hasHours && hasPhone,
    true, // zone
    hasDescription,
    false, // reservation
    isOperational,
    true, // doublons
    hasPhone && !!place.formatted_address,
    false, // schema
    hasWebsite,
  ]

  const total = checks.length
  const passed = checks.filter(Boolean).length
  const global = Math.round((passed / total) * 100)
  return { global, passed, failed: total - passed, total }
}

export async function POST(req: NextRequest) {
  let body: { city?: string; sector?: string; maxResults?: number; adminPassword?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { city, sector, maxResults = 20, adminPassword } = body
  if (adminPassword !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }
  if (!city || !sector) {
    return NextResponse.json({ error: 'city et sector requis' }, { status: 400 })
  }

  const apiKey = process.env.GMBPRO_GOOGLE_PLACES_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GMBPRO_GOOGLE_PLACES_KEY manquante' }, { status: 500 })
  }

  const limit = Math.min(Math.max(maxResults, 1), 60)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.GMBPRO_SUPABASE_URL || ''
  const supabaseKey = process.env.GMBPRO_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.GMBPRO_SUPABASE_ANON_KEY || ''
  const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null

  // 1. Create campaign
  let campaignId: string | null = null
  if (supabase) {
    const { data } = await supabase
      .from('prospection_campaigns')
      .insert({
        name: `${sector} - ${city}`,
        city,
        sector,
        max_results: limit,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    campaignId = data?.id || null
  }

  // 2. Text search (with pagination for >20 results)
  const query = `${sector} ${city}`
  const allResults: PlaceSearchResult[] = []
  let pageToken: string | undefined

  try {
    for (let page = 0; page < 3 && allResults.length < limit; page++) {
      const url = pageToken
        ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${pageToken}&key=${apiKey}`
        : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=fr&region=fr&key=${apiKey}`

      if (pageToken) {
        // Google requires ~2s delay before next_page_token works
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

  // 3. Fetch details + score each
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
          console.error('Upsert error:', error.message)
          if (errors.length < 3) errors.push(`upsert: ${error.message}`)
        }
      } else {
        if (errors.length < 3) errors.push('supabase_client_null')
      }
    } catch (err) {
      console.error('Detail/save error:', err)
      if (errors.length < 3) errors.push(`exception: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  // 4. Finalize campaign
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

  return NextResponse.json({
    campaignId,
    results: saved,
    found: toProcess.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
