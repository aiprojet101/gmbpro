import { NextRequest, NextResponse } from 'next/server'
import { runProspectionScan } from '@/app/lib/prospection-core'
import { scrapeProspectEmails } from '@/app/lib/email-scraper'
import { getNextPair, getNextDiversified } from '@/app/lib/prospection-queue'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300

const ADMIN_PASSWORD = process.env.GMBPRO_ADMIN_PASSWORD || 'gmbpro-admin-2026'

export async function POST(req: NextRequest) {
  let body: { adminPassword?: string; city?: string; sector?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  if (body.adminPassword !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const auto = await getDiversifiedFromDb()
  const city = body.city || auto.city
  const sector = body.sector || auto.sector
  const region = auto.region
  const startedAt = Date.now()

  const scan = await runProspectionScan({
    city,
    sector,
    region,
    maxResults: 20,
    campaignNamePrefix: '[AUTO]',
    campaignNameSuffix: region ? ` (${region})` : '',
  })

  let scrape: { processed: number; found: number; total: number; error?: string } = {
    processed: 0, found: 0, total: 0,
  }
  if (!scan.error && scan.results > 0) {
    const r = await scrapeProspectEmails({ limit: 10 })
    scrape = { processed: r.processed, found: r.found, total: r.total, error: r.error }
  }

  return NextResponse.json({
    ok: !scan.error,
    pair: { city, sector, region, regionLabel: auto.regionLabel, index: auto.index, total: auto.total },
    scan,
    scrape,
    durationMs: Date.now() - startedAt,
  })
}

async function getDiversifiedFromDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.GMBPRO_SUPABASE_URL || ''
  const key = process.env.GMBPRO_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.GMBPRO_SUPABASE_ANON_KEY || ''
  if (!url || !key) return getNextPair()
  const supabase = createClient(url, key)
  const { count, error } = await supabase
    .from('prospection_campaigns')
    .select('id', { count: 'exact', head: true })
    .like('name', '[AUTO]%')
  if (error || count == null) return getNextPair()
  return getNextDiversified(count)
}

export async function GET() {
  const pair = await getDiversifiedFromDb()
  return NextResponse.json({ pair })
}
