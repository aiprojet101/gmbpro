import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.GMBPRO_SUPABASE_URL || ''
  const key = process.env.GMBPRO_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.GMBPRO_SUPABASE_ANON_KEY || ''
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  let body: { id?: string; email?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'supabase_not_configured' }, { status: 500 })

  const nowIso = new Date().toISOString()
  const update = {
    status: 'rejected',
    unsubscribed_at: nowIso,
    unsubscribe_reason: body.reason || 'unsubscribed_via_link',
    updated_at: nowIso,
  }

  // Try by id first (most secure), fallback to email
  if (body.id) {
    const { error } = await supabase.from('prospects').update(update).eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (body.email) {
    const { error } = await supabase.from('prospects').update(update).eq('email', body.email)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    return NextResponse.json({ error: 'missing_id_or_email' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

// Support GET aussi (pour les liens "1 click unsubscribe" type RFC 8058)
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const email = req.nextUrl.searchParams.get('email')

  if (!id && !email) {
    return NextResponse.redirect(new URL('/desabonnement', req.url))
  }

  // Pre-fill the unsubscribe page with the id/email
  const url = new URL('/desabonnement', req.url)
  if (id) url.searchParams.set('id', id)
  if (email) url.searchParams.set('email', email)
  return NextResponse.redirect(url)
}
