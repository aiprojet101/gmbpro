import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_PASSWORD = process.env.GMBPRO_ADMIN_PASSWORD || 'gmbpro-admin-2026'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.GMBPRO_SUPABASE_URL || ''
  const key = process.env.GMBPRO_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.GMBPRO_SUPABASE_ANON_KEY || ''
  if (!url || !key) return null
  return createClient(url, key)
}

interface ProspectRow {
  sector: string | null
  region: string | null
  email_sent_at: string | null
  email_opened_at: string | null
  email_clicked_at: string | null
  email_bounced: boolean | null
  global_score: number | null
  converted_at: string | null
}

interface AggStats {
  key: string
  prospects: number
  emailsSent: number
  opened: number
  clicked: number
  bounced: number
  converted: number
  scoreSum: number
  openRate: number
  clickRate: number
  avgScore: number
}

function aggregate(rows: ProspectRow[], keyFn: (r: ProspectRow) => string | null): AggStats[] {
  const map = new Map<string, AggStats>()
  for (const r of rows) {
    const key = keyFn(r)
    if (!key) continue
    const cur = map.get(key) || {
      key, prospects: 0, emailsSent: 0, opened: 0, clicked: 0,
      bounced: 0, converted: 0, scoreSum: 0, openRate: 0, clickRate: 0, avgScore: 0,
    }
    cur.prospects++
    if (r.email_sent_at) cur.emailsSent++
    if (r.email_opened_at) cur.opened++
    if (r.email_clicked_at) cur.clicked++
    if (r.email_bounced) cur.bounced++
    if (r.converted_at) cur.converted++
    if (r.global_score != null) cur.scoreSum += r.global_score
    map.set(key, cur)
  }
  return Array.from(map.values()).map(s => ({
    ...s,
    openRate: s.emailsSent > 0 ? Math.round((s.opened / s.emailsSent) * 1000) / 10 : 0,
    clickRate: s.emailsSent > 0 ? Math.round((s.clicked / s.emailsSent) * 1000) / 10 : 0,
    avgScore: s.prospects > 0 ? Math.round(s.scoreSum / s.prospects) : 0,
  }))
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const pwd = auth.replace(/^Bearer\s+/i, '')
  if (pwd !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase non configure' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('prospects')
    .select('sector, region, email_sent_at, email_opened_at, email_clicked_at, email_bounced, global_score, converted_at')
    .limit(50000)

  if (error) {
    // Si colonnes manquantes, message clair
    return NextResponse.json({
      error: error.message,
      hint: 'Lance la migration SQL (region, email_sent_at, email_opened_at, email_clicked_at, email_bounced, converted_at).',
    }, { status: 500 })
  }

  const rows = (data || []) as ProspectRow[]
  const bySector = aggregate(rows, r => r.sector).sort((a, b) => b.prospects - a.prospects)
  const byRegion = aggregate(rows, r => r.region).sort((a, b) => b.prospects - a.prospects)

  // Combos (sector, region) — top par taux de clic, min 5 emails envoyes
  const byCombo = aggregate(rows, r => (r.sector && r.region ? `${r.sector}||${r.region}` : null))
  const topCombos = byCombo
    .filter(c => c.emailsSent >= 5)
    .sort((a, b) => b.clickRate - a.clickRate || b.openRate - a.openRate)
    .slice(0, 5)
    .map(c => {
      const [sector, region] = c.key.split('||')
      return { ...c, sector, region }
    })

  return NextResponse.json({
    bySector,
    byRegion,
    topCombos,
    totals: {
      prospects: rows.length,
      emailsSent: rows.filter(r => r.email_sent_at).length,
      opened: rows.filter(r => r.email_opened_at).length,
      clicked: rows.filter(r => r.email_clicked_at).length,
      bounced: rows.filter(r => r.email_bounced).length,
      converted: rows.filter(r => r.converted_at).length,
    },
  })
}
