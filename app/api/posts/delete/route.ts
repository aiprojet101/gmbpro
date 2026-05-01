import { NextResponse } from 'next/server'
import { getApiUser } from '../../../lib/auth-server'

export async function DELETE(req: Request) {
  const auth = await getApiUser(req)
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 })

  const { error } = await auth.supabase
    .from('gmb_posts')
    .delete()
    .eq('id', id)
    .eq('client_id', auth.userId)

  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
