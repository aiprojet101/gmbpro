import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_PASSWORD = process.env.GMBPRO_ADMIN_PASSWORD || 'gmbpro-admin-2026'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.GMBPRO_SUPABASE_URL || ''
  const key = process.env.GMBPRO_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.GMBPRO_SUPABASE_ANON_KEY || ''
  if (!url || !key) return null
  return createClient(url, key)
}

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  if (auth === `Bearer ${ADMIN_PASSWORD}`) return true
  const token = req.nextUrl.searchParams.get('authToken')
  return token === ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase non configure' }, { status: 500 })

  const city = req.nextUrl.searchParams.get('city')
  const status = req.nextUrl.searchParams.get('status')
  const scoreMax = req.nextUrl.searchParams.get('scoreMax')
  const scoreMin = req.nextUrl.searchParams.get('scoreMin')
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20'), 100)
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

  let query = supabase.from('prospects').select('*', { count: 'exact' })
  if (city) query = query.ilike('city', `%${city}%`)
  if (status) query = query.eq('status', status)
  if (scoreMax) query = query.lte('global_score', parseInt(scoreMax))
  if (scoreMin) query = query.gte('global_score', parseInt(scoreMin))

  const { data, count, error } = await query
    .order('global_score', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // KPIs
  const { data: allData } = await supabase.from('prospects').select('global_score, status')
  const all = allData || []
  const scored = all.filter(p => p.global_score != null)
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((s, p) => s + (p.global_score || 0), 0) / scored.length)
    : 0
  const toContact = all.filter(p => p.status === 'new' && (p.global_score || 100) < 70).length

  return NextResponse.json({
    prospects: data || [],
    total: count || 0,
    kpis: {
      total: all.length,
      avgScore,
      toContact,
    },
  })
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase non configure' }, { status: 500 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const body: { status?: string; notes?: string } = await req.json().catch(() => ({}))
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.status) update.status = body.status
  if (body.notes !== undefined) update.notes = body.notes
  if (body.status === 'emailed') {
    update.last_contacted_at = new Date().toISOString()
  }

  const { error } = await supabase.from('prospects').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase non configure' }, { status: 500 })

  const id = req.nextUrl.searchParams.get('id')
  const ids = req.nextUrl.searchParams.get('ids') // comma-separated for bulk
  if (!id && !ids) return NextResponse.json({ error: 'id ou ids requis' }, { status: 400 })

  const target = ids ? ids.split(',').map(s => s.trim()).filter(Boolean) : [id!]
  const { error, count } = await supabase.from('prospects').delete({ count: 'exact' }).in('id', target)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, deleted: count ?? 0 })
}
