import { NextRequest, NextResponse } from 'next/server'
import { runProspectionScan } from '@/app/lib/prospection-core'

const ADMIN_PASSWORD = process.env.GMBPRO_ADMIN_PASSWORD || 'gmbpro-admin-2026'

export const maxDuration = 60

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

  const result = await runProspectionScan({ city, sector, maxResults })
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  return NextResponse.json({
    campaignId: result.campaignId,
    results: result.results,
    found: result.found,
    errors: result.errors,
  })
}
