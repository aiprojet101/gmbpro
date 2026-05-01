import { NextRequest, NextResponse } from 'next/server'
import { runProspectionScan } from '@/app/lib/prospection-core'
import { scrapeProspectEmails } from '@/app/lib/email-scraper'
import { getNextPair, CITIES, SECTORS } from '@/app/lib/prospection-queue'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300

async function getNextUnscannedPair() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.GMBPRO_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.GMBPRO_SUPABASE_ANON_KEY || ''
  if (!supabaseUrl || !supabaseKey) return getNextPair()

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data } = await supabase
    .from('prospection_campaigns')
    .select('city, sector')
    .like('name', '[AUTO]%')

  const scanned = new Set((data || []).map(c => `${c.city}|${c.sector}`))

  // Walk through queue index sequentially, return first not-yet-scanned pair
  for (let i = 0; i < CITIES.length * SECTORS.length; i++) {
    const cityIdx = Math.floor(i / SECTORS.length)
    const sectorIdx = i % SECTORS.length
    const city = CITIES[cityIdx]
    const sector = SECTORS[sectorIdx]
    if (!scanned.has(`${city}|${sector}`)) {
      return { city, sector, index: i }
    }
  }
  // All scanned, fallback to date-based (cycle restart)
  return getNextPair()
}

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || ''
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true
  if (process.env.GMBPRO_CRON_SECRET && auth === `Bearer ${process.env.GMBPRO_CRON_SECRET}`) return true
  // Allow secret in query string too (some cron services don't support headers)
  const qsSecret = req.nextUrl.searchParams.get('secret')
  if (qsSecret && process.env.GMBPRO_CRON_SECRET && qsSecret === process.env.GMBPRO_CRON_SECRET) return true
  return false
}

async function runOnce() {
  const pair = await getNextUnscannedPair()
  const startedAt = Date.now()

  const scan = await runProspectionScan({
    city: pair.city,
    sector: pair.sector,
    maxResults: 20,
    campaignNamePrefix: '[AUTO]',
  })

  let scrape: { processed: number; found: number; total: number; error?: string } = {
    processed: 0, found: 0, total: 0,
  }
  if (!scan.error && scan.results > 0) {
    const r = await scrapeProspectEmails({ limit: 10 })
    scrape = { processed: r.processed, found: r.found, total: r.total, error: r.error }
  }

  return { ok: !scan.error, pair, scan, scrape, durationMs: Date.now() - startedAt }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const result = await runOnce()
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const result = await runOnce()
  return NextResponse.json(result)
}
