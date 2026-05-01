import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { runProspectionScan } from '@/app/lib/prospection-core'
import { scrapeProspectEmails } from '@/app/lib/email-scraper'
import { autoSendProspectEmails } from '@/app/lib/auto-send-prospects'
import { getNextDiversified, getNextPair } from '@/app/lib/prospection-queue'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300

async function getRunIndexFromDb(): Promise<number | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.GMBPRO_SUPABASE_URL || ''
  const supabaseKey = process.env.GMBPRO_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.GMBPRO_SUPABASE_ANON_KEY || ''
  if (!supabaseUrl || !supabaseKey) return null
  const supabase = createClient(supabaseUrl, supabaseKey)
  const { count, error } = await supabase
    .from('prospection_campaigns')
    .select('id', { count: 'exact', head: true })
    .like('name', '[AUTO]%')
  if (error) return null
  return count ?? 0
}

async function getNextDiversifiedFromDb() {
  const runIndex = await getRunIndexFromDb()
  if (runIndex == null) return getNextPair()
  return getNextDiversified(runIndex)
}

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || ''
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true
  if (process.env.GMBPRO_CRON_SECRET && auth === `Bearer ${process.env.GMBPRO_CRON_SECRET}`) return true
  const qsSecret = req.nextUrl.searchParams.get('secret')
  if (qsSecret && process.env.GMBPRO_CRON_SECRET && qsSecret === process.env.GMBPRO_CRON_SECRET) return true
  return false
}

async function runOnce() {
  const pair = await getNextDiversifiedFromDb()
  const startedAt = Date.now()

  const scan = await runProspectionScan({
    city: pair.city,
    sector: pair.sector,
    region: pair.region,
    maxResults: 20,
    campaignNamePrefix: `[AUTO]`,
    campaignNameSuffix: pair.region ? ` (${pair.region})` : '',
  })

  let scrape: { processed: number; found: number; total: number; error?: string } = {
    processed: 0, found: 0, total: 0,
  }
  if (!scan.error && scan.results > 0) {
    const r = await scrapeProspectEmails({ limit: 10 })
    scrape = { processed: r.processed, found: r.found, total: r.total, error: r.error }
  }

  // Auto-send up to 10 prospection emails to scraped prospects with score < 70
  let autosend: { sent: number; errors: number; skipped: number; errorDetails?: string[] } = {
    sent: 0, errors: 0, skipped: 0,
  }
  try {
    autosend = await autoSendProspectEmails({ limit: 10 })
  } catch (e) {
    console.error('[cron] autoSend error:', e)
  }

  return { ok: !scan.error, pair, scan, scrape, autosend, durationMs: Date.now() - startedAt }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  // Sync mode: ?sync=1 attend la fin (pour test admin)
  // Async mode (defaut): retourne immediatement, continue en background (cron-job.org timeout 30s)
  if (req.nextUrl.searchParams.get('sync') === '1') {
    const result = await runOnce()
    return NextResponse.json(result)
  }
  waitUntil(runOnce().catch(err => console.error('[cron] runOnce error:', err)))
  return NextResponse.json({ ok: true, message: 'Started in background' })
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (req.nextUrl.searchParams.get('sync') === '1') {
    const result = await runOnce()
    return NextResponse.json(result)
  }
  waitUntil(runOnce().catch(err => console.error('[cron] runOnce error:', err)))
  return NextResponse.json({ ok: true, message: 'Started in background' })
}
