import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { generateProspectEmail } from './prospect-email'

const FROM = 'GmbPro <contact@gmbpro.fr>'

interface ProspectRow {
  id: string
  business_name: string
  city: string
  email: string | null
  global_score: number | null
  failed_count: number | null
  rating: number | null
  review_count: number | null
  place_id: string | null
  status: string
}

/**
 * Send up to `limit` prospection emails to prospects with status='new' AND email IS NOT NULL.
 * Filters: only score < 70 (real opportunities) and email_count < 1 (never contacted).
 * Returns counts.
 */
export async function autoSendProspectEmails(opts: { limit?: number } = {}): Promise<{
  sent: number
  errors: number
  skipped: number
  errorDetails?: string[]
}> {
  const limit = Math.min(Math.max(opts.limit ?? 10, 1), 30)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.GMBPRO_SUPABASE_URL || ''
  const supabaseKey = process.env.GMBPRO_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.GMBPRO_SUPABASE_ANON_KEY || ''
  const resendKey = process.env.GMBPRO_RESEND_API_KEY

  if (!supabaseUrl || !supabaseKey) return { sent: 0, errors: 0, skipped: 0, errorDetails: ['supabase_not_configured'] }
  if (!resendKey) return { sent: 0, errors: 0, skipped: 0, errorDetails: ['resend_not_configured'] }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const resend = new Resend(resendKey)

  // Pick prospects: status=new, email exists, never contacted (email_count=0), score < 70
  const { data: prospects, error } = await supabase
    .from('prospects')
    .select('id, business_name, city, email, global_score, failed_count, rating, review_count, place_id, status')
    .eq('status', 'new')
    .not('email', 'is', null)
    .lt('global_score', 70)
    .limit(limit)

  if (error || !prospects) {
    return { sent: 0, errors: 0, skipped: 0, errorDetails: [error?.message || 'fetch_error'] }
  }

  let sent = 0
  let errors = 0
  let skipped = 0
  const errorDetails: string[] = []

  for (const p of prospects as ProspectRow[]) {
    if (!p.email) { skipped++; continue }
    try {
      const { subject, html, text } = generateProspectEmail({
        business_name: p.business_name,
        city: p.city,
        global_score: p.global_score ?? 0,
        failed_count: p.failed_count ?? 0,
        rating: p.rating,
        review_count: p.review_count,
        place_id: p.place_id,
      })

      const result = await resend.emails.send({
        from: FROM,
        to: [p.email],
        subject,
        html,
        text,
      })

      if (result.error) {
        errors++
        if (errorDetails.length < 3) errorDetails.push(`resend: ${result.error.message || 'unknown'}`)
        continue
      }

      // Update prospect
      const messageId = result.data?.id
      const nowIso = new Date().toISOString()
      await supabase.from('prospects').update({
        status: 'emailed',
        last_contacted_at: nowIso,
        email_count: 1,
        email_sent_at: nowIso,
        resend_email_id: messageId || null,
        updated_at: nowIso,
      }).eq('id', p.id)

      sent++

      // Throttle 600ms between sends to respect Resend rate limits
      await new Promise(r => setTimeout(r, 600))
    } catch (e) {
      errors++
      if (errorDetails.length < 3) errorDetails.push(`exception: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  return { sent, errors, skipped, errorDetails: errorDetails.length ? errorDetails : undefined }
}
