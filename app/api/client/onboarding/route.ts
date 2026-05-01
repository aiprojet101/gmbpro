import { NextResponse } from 'next/server'
import { getApiUser } from '../../../lib/auth-server'

export async function PATCH(req: Request) {
  const auth = await getApiUser(req)
  if (!auth) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  let body: { step?: number; completed?: boolean } = {}
  try { body = await req.json() } catch {}

  const update: Record<string, unknown> = {}
  if (typeof body.step === 'number' && body.step >= 1 && body.step <= 4) {
    update.onboarding_step = body.step
  }
  if (typeof body.completed === 'boolean') {
    update.onboarding_completed = body.completed
    if (body.completed) update.onboarding_step = 4
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Rien a mettre a jour' }, { status: 400 })
  }

  const { error } = await auth.supabase
    .from('clients')
    .update(update)
    .eq('id', auth.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, ...update })
}
