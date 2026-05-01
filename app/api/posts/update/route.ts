import { NextResponse } from 'next/server'
import { getApiUser } from '../../../lib/auth-server'

const VALID_STATUS = ['draft', 'scheduled', 'published', 'failed']

export async function PATCH(req: Request) {
  const auth = await getApiUser(req)
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 })

  let body: { status?: string; published_at?: string; scheduled_at?: string } = {}
  try { body = await req.json() } catch { /* */ }

  const update: Record<string, unknown> = {}
  if (body.status) {
    if (!VALID_STATUS.includes(body.status)) {
      return NextResponse.json({ error: 'invalid_status' }, { status: 400 })
    }
    update.status = body.status
    if (body.status === 'published' && !body.published_at) {
      update.published_at = new Date().toISOString()
    }
  }
  if (body.published_at) update.published_at = body.published_at
  if (body.scheduled_at) update.scheduled_at = body.scheduled_at

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'no_fields' }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('gmb_posts')
    .update(update)
    .eq('id', id)
    .eq('client_id', auth.userId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}
