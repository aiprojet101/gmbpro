import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/resend/webhook?secret=xxx
// Resend envoie : email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained
// Payload : { type, created_at, data: { email_id, ... } }

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.GMBPRO_SUPABASE_URL || ''
  const key = process.env.GMBPRO_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.GMBPRO_SUPABASE_ANON_KEY || ''
  if (!url || !key) return null
  return createClient(url, key)
}

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.GMBPRO_RESEND_WEBHOOK_SECRET || process.env.GMBPRO_CRON_SECRET || ''
  if (!expected) return false
  const qs = req.nextUrl.searchParams.get('secret')
  if (qs && qs === expected) return true
  const auth = req.headers.get('authorization') || ''
  if (auth === `Bearer ${expected}`) return true
  return false
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let payload: { type?: string; created_at?: string; data?: { email_id?: string } }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const eventType = payload.type
  const emailId = payload.data?.email_id
  const ts = payload.created_at || new Date().toISOString()

  if (!eventType || !emailId) {
    return NextResponse.json({ ok: true, ignored: 'missing type or email_id' })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'supabase not configured' }, { status: 500 })
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  switch (eventType) {
    case 'email.delivered':
      // pas de colonne dediee — on garde email_sent_at deja pose a l'envoi
      break
    case 'email.opened':
      update.email_opened_at = ts
      break
    case 'email.clicked':
      update.email_clicked_at = ts
      break
    case 'email.bounced':
      update.email_bounced = true
      update.status = 'invalid'
      break
    case 'email.complained':
      update.status = 'rejected'
      break
    default:
      return NextResponse.json({ ok: true, ignored: eventType })
  }

  if (Object.keys(update).length <= 1) {
    return NextResponse.json({ ok: true, noop: eventType })
  }

  const { error } = await supabase
    .from('prospects')
    .update(update)
    .eq('resend_email_id', emailId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, type: eventType })
}

export async function GET() {
  return NextResponse.json({ ok: true, info: 'GmbPro Resend webhook endpoint' })
}
