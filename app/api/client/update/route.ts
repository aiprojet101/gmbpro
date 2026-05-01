import { NextResponse } from 'next/server';
import { getApiUser } from '../../../lib/auth-server';

export async function PATCH(req: Request) {
  const auth = await getApiUser(req);
  if (!auth) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  const allowed = ['business_name', 'city', 'phone', 'description', 'sector'] as const;
  const update: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) {
      const v = body[k];
      if (v === null || typeof v === 'string') update[k] = v;
    }
  }

  if (typeof update.description === 'string' && (update.description as string).length > 500) {
    return NextResponse.json({ error: 'Description trop longue (max 500)' }, { status: 400 });
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Aucun champ a mettre a jour' }, { status: 400 });
  }

  update.updated_at = new Date().toISOString();

  const { error } = await auth.supabase
    .from('clients')
    .update(update)
    .eq('id', auth.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
