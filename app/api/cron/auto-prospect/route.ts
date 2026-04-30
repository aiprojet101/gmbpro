import { NextRequest, NextResponse } from 'next/server'
import { runProspectionScan } from '@/app/lib/prospection-core'
import { scrapeProspectEmails } from '@/app/lib/email-scraper'
import { getNextPair } from '@/app/lib/prospection-queue'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const pair = getNextPair()
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

  return NextResponse.json({
    ok: !scan.error,
    pair,
    scan,
    scrape,
    durationMs: Date.now() - startedAt,
  })
}
