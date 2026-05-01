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
  const url = new URL(req.url)
  const t = url.searchParams.get('authToken') || ''
  return t === ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase non configure' }, { status: 500 })

  const { data, error } = await supabase
    .from('clients')
    .select('id, business_name, email, phone, sector, city, manager_invite_status, manager_invite_at, manager_accepted_at')
    .in('manager_invite_status', ['sent', 'accepted', 'refused'])
    .order('manager_invite_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clients: data || [] })
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  const url = new URL(req.url)
  const clientId = url.searchParams.get('clientId') || ''
  if (!clientId) return NextResponse.json({ error: 'clientId requis' }, { status: 400 })

  let body: { status?: string } = {}
  try { body = await req.json() } catch {}
  const status = body.status
  if (status !== 'accepted' && status !== 'refused') {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase non configure' }, { status: 500 })

  const update: Record<string, unknown> = { manager_invite_status: status }
  if (status === 'accepted') update.manager_accepted_at = new Date().toISOString()

  const { error } = await supabase.from('clients').update(update).eq('id', clientId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, status })
}
