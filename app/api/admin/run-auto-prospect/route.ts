import { NextRequest, NextResponse } from 'next/server'
import { runProspectionScan } from '@/app/lib/prospection-core'
import { scrapeProspectEmails } from '@/app/lib/email-scraper'
import { getNextPair } from '@/app/lib/prospection-queue'

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

  const auto = getNextPair()
  const city = body.city || auto.city
  const sector = body.sector || auto.sector
  const startedAt = Date.now()

  const scan = await runProspectionScan({
    city,
    sector,
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

  return NextResponse.json({
    ok: !scan.error,
    pair: { city, sector, index: auto.index, total: auto.total },
    scan,
    scrape,
    durationMs: Date.now() - startedAt,
  })
}

export async function GET() {
  const pair = getNextPair()
  return NextResponse.json({ pair })
}
