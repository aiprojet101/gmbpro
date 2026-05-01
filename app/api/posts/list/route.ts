import { NextResponse } from 'next/server'
import { getApiUser } from '../../../lib/auth-server'

export async function GET(req: Request) {
  const auth = await getApiUser(req)
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await auth.supabase
    .from('gmb_posts')
    .select('*')
    .eq('client_id', auth.userId)
    .order('scheduled_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })
  return NextResponse.json({ posts: data || [] })
}
