import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { generateManagerRelanceEmail } from '@/app/lib/manager-relance-email'

export const maxDuration = 60

const FROM = 'GmbPro <contact@gmbpro.fr>'

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || ''
  if (process.env.GMBPRO_CRON_SECRET && auth === `Bearer ${process.env.GMBPRO_CRON_SECRET}`) return true
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true
  const qs = req.nextUrl.searchParams.get('secret')
  if (qs && process.env.GMBPRO_CRON_SECRET && qs === process.env.GMBPRO_CRON_SECRET) return true
  return false
}

interface ClientRow {
  id: string
  email: string
  business_name: string | null
  relance_count: number | null
}

async function runRelance() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.GMBPRO_SUPABASE_URL || ''
  const supabaseKey = process.env.GMBPRO_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.GMBPRO_SUPABASE_ANON_KEY || ''
  if (!supabaseUrl || !supabaseKey) {
    return { ok: false, error: 'Supabase env missing', sent: 0, errors: 0 }
  }
  const supabase = createClient(supabaseUrl, supabaseKey)

  const apiKey = process.env.GMBPRO_RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'GMBPRO_RESEND_API_KEY missing', sent: 0, errors: 0 }
  }
  const resend = new Resend(apiKey)

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // 1. clients pending depuis +24h sans relance
  const { data: neverRelanced, error: e1 } = await supabase
    .from('clients')
    .select('id, email, business_name, relance_count')
    .eq('subscription_status', 'active')
    .eq('manager_invite_status', 'pending')
    .lt('created_at', dayAgo)
    .is('last_relance_at', null)
    .limit(50)

  if (e1) return { ok: false, error: e1.message, sent: 0, errors: 0 }

  // 2. clients pending dont la derniere relance date de +7j
  const { data: oldRelanced, error: e2 } = await supabase
    .from('clients')
    .select('id, email, business_name, relance_count')
    .eq('subscription_status', 'active')
    .eq('manager_invite_status', 'pending')
    .lt('last_relance_at', weekAgo)
    .limit(50)

  if (e2) return { ok: false, error: e2.message, sent: 0, errors: 0 }

  const all: ClientRow[] = [...(neverRelanced || []), ...(oldRelanced || [])]
  const seen = new Set<string>()
  const targets = all.filter(c => {
    if (!c.email || seen.has(c.id)) return false
    seen.add(c.id)
    return true
  })

  let sent = 0
  let errors = 0
  const errorDetails: string[] = []

  for (const c of targets) {
    try {
      const { subject, html, text } = generateManagerRelanceEmail({ business_name: c.business_name || '' })
      const r = await resend.emails.send({ from: FROM, to: [c.email], subject, html, text })
      if (r.error) {
        errors++
        errorDetails.push(`${c.email}: ${r.error.message}`)
        continue
      }
      await supabase
        .from('clients')
        .update({
          last_relance_at: new Date().toISOString(),
          relance_count: (c.relance_count || 0) + 1,
        })
        .eq('id', c.id)
      sent++
    } catch (err) {
      errors++
      errorDetails.push(`${c.email}: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  return { ok: true, sent, errors, total: targets.length, errorDetails: errorDetails.slice(0, 10) }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const result = await runRelance()
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const result = await runRelance()
  return NextResponse.json(result)
}
