import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASSWORD = process.env.GMBPRO_ADMIN_PASSWORD || 'gmbpro-admin-2026'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.GMBPRO_SUPABASE_URL || ''
  const key = process.env.GMBPRO_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.GMBPRO_SUPABASE_ANON_KEY || ''

  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase non configure' }, { status: 500 })
  }

  const supabase = createClient(url, key)

  const today = new Date().toISOString().split('T')[0]

  const [clientsRes, scansRes, scansTodayRes, recentScansRes, recentClientsRes] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('scans').select('*', { count: 'exact', head: true }),
    supabase.from('scans').select('*', { count: 'exact', head: true }).gte('created_at', today),
    supabase.from('scans').select('business_name, city, score, created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('clients').select('email, business_name, city, plan, score, created_at').order('created_at', { ascending: false }).limit(100),
  ])

  // Compute avg score from recent scans
  const scans = recentScansRes.data || []
  const scored = scans.filter((s: { score?: number | null }) => s.score != null)
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((sum: number, s: { score: number }) => sum + s.score, 0) / scored.length)
    : 0

  return NextResponse.json({
    totalClients: clientsRes.count ?? 0,
    totalScans: scansRes.count ?? 0,
    scansToday: scansTodayRes.count ?? 0,
    avgScore,
    recentScans: recentScansRes.data || [],
    recentClients: recentClientsRes.data || [],
    clientsError: clientsRes.error?.message || null,
    scansError: scansRes.error?.message || null,
  })
}
