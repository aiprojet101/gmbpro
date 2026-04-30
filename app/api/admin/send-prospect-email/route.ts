import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { generateProspectEmail } from '../../../lib/prospect-email'

const ADMIN_PASSWORD = process.env.GMBPRO_ADMIN_PASSWORD || 'gmbpro-admin-2026'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.GMBPRO_SUPABASE_URL || ''
  const key = process.env.GMBPRO_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.GMBPRO_SUPABASE_ANON_KEY || ''
  if (!url || !key) return null
  return createClient(url, key)
}

const FROM = 'GmbPro <contact@gmbpro.fr>'

export async function POST(req: NextRequest) {
  let body: { prospectId?: string; email?: string; adminPassword?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const { prospectId, email, adminPassword } = body
  if (adminPassword !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }
  if (!prospectId || !email) {
    return NextResponse.json({ error: 'prospectId et email requis' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  }

  const apiKey = process.env.GMBPRO_RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GMBPRO_RESEND_API_KEY manquant' }, { status: 500 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase non configure' }, { status: 500 })
  }

  const { data: prospect, error: fetchErr } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', prospectId)
    .single()

  if (fetchErr || !prospect) {
    return NextResponse.json({ error: 'Prospect introuvable' }, { status: 404 })
  }

  const { subject, html, text } = generateProspectEmail({
    business_name: prospect.business_name,
    city: prospect.city,
    global_score: prospect.global_score ?? 0,
    failed_count: prospect.failed_count ?? 0,
    rating: prospect.rating,
    review_count: prospect.review_count,
    place_id: prospect.place_id,
  })

  const resend = new Resend(apiKey)
  let messageId: string | undefined
  try {
    const result = await resend.emails.send({
      from: FROM,
      to: [email],
      subject,
      html,
      text,
    })
    if (result.error) {
      return NextResponse.json({ error: `Resend: ${result.error.message}` }, { status: 500 })
    }
    messageId = result.data?.id
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur Resend'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const currentCount = (prospect.email_count as number) ?? 0
  const update: Record<string, unknown> = {
    status: 'emailed',
    last_contacted_at: new Date().toISOString(),
    email,
    email_count: currentCount + 1,
    updated_at: new Date().toISOString(),
  }

  const { error: updErr } = await supabase.from('prospects').update(update).eq('id', prospectId)
  if (updErr) {
    // Email envoye, mais update echoue — tenter sans email_count si colonne manquante
    const fallback: Record<string, unknown> = {
      status: 'emailed',
      last_contacted_at: new Date().toISOString(),
      email,
      updated_at: new Date().toISOString(),
    }
    await supabase.from('prospects').update(fallback).eq('id', prospectId)
  }

  return NextResponse.json({ success: true, messageId })
}
