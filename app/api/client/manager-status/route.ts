import { NextResponse } from 'next/server';
import { getApiUser } from '../../../lib/auth-server';

const VALID = ['pending', 'sent', 'accepted', 'refused'] as const;
type Status = typeof VALID[number];

export async function PATCH(req: Request) {
  const auth = await getApiUser(req);
  if (!auth) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  let body: { status?: string } = {};
  try { body = await req.json(); } catch {}

  const status = body.status as Status;
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    manager_invite_status: status,
  };
  if (status === 'sent') {
    update.manager_invite_at = new Date().toISOString();
    update.manager_email_used = 'contact@gmbpro.fr';
  } else if (status === 'accepted') {
    update.manager_accepted_at = new Date().toISOString();
  }

  const { error } = await auth.supabase
    .from('clients')
    .update(update)
    .eq('id', auth.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, status });
}
