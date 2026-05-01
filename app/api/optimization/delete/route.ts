import { NextResponse } from 'next/server';
import { getApiUser } from '../../../lib/auth-server';

export async function DELETE(req: Request) {
  const auth = await getApiUser(req);
  if (!auth) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { error } = await auth.supabase
    .from('optimization_tasks')
    .delete()
    .eq('client_id', auth.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
