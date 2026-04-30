import { NextRequest, NextResponse } from 'next/server'
import { scrapeProspectEmails } from '@/app/lib/email-scraper'

export const maxDuration = 60

const ADMIN_PASSWORD = process.env.GMBPRO_ADMIN_PASSWORD || 'gmbpro-admin-2026'

export async function POST(req: NextRequest) {
  let body: { prospectIds?: string[]; adminPassword?: string; limit?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const { prospectIds, adminPassword } = body
  if (adminPassword !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const result = await scrapeProspectEmails({ prospectIds, limit: body.limit })
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  return NextResponse.json({
    processed: result.processed,
    found: result.found,
    total: result.total,
    results: result.results,
  })
}
