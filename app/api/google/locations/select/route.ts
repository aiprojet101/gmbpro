import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../lib/supabase-server';

export async function POST(req: Request) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { accountId?: string; accountName?: string; locationId?: string; locationName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { accountId, accountName, locationId, locationName } = body;
  if (!accountId || !locationId) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const { error } = await supabase
    .from('clients')
    .update({
      gmb_account_id: accountId,
      gmb_account_name: accountName || accountId,
      gmb_location_id: locationId,
      gmb_location_name: locationName || locationId,
    })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
