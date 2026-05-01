import { NextResponse } from 'next/server';
import { getApiUser } from '../../../lib/auth-server';

export async function GET(req: Request) {
  const auth = await getApiUser(req);
  if (!auth) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { data, error } = await auth.supabase
    .from('optimization_tasks')
    .select('*')
    .eq('client_id', auth.userId)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data || [] });
}
