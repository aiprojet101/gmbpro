import { NextResponse } from 'next/server';
import { getApiUser } from '../../../lib/auth-server';

const VALID = ['pending', 'done', 'skipped'] as const;
type Status = typeof VALID[number];

export async function PATCH(req: Request) {
  const auth = await getApiUser(req);
  if (!auth) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 });

  let body: { status?: string } = {};
  try { body = await req.json(); } catch {}

  const status = body.status as Status;
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
  }

  const update: Record<string, unknown> = { status };
  update.done_at = status === 'done' ? new Date().toISOString() : null;

  const { error } = await auth.supabase
    .from('optimization_tasks')
    .update(update)
    .eq('id', id)
    .eq('client_id', auth.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
