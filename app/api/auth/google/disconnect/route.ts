import { NextResponse } from 'next/server';
import { getApiUser } from '../../../../lib/auth-server';
import { revokeToken } from '../../../../lib/google-oauth';

export async function POST(req: Request) {
  const ctx = await getApiUser(req);
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { userId, supabase } = ctx;

  const { data: client } = await supabase
    .from('clients')
    .select('google_access_token, google_refresh_token')
    .eq('id', userId)
    .single();

  if (client?.google_refresh_token) {
    await revokeToken(client.google_refresh_token);
  } else if (client?.google_access_token) {
    await revokeToken(client.google_access_token);
  }

  const { error } = await supabase
    .from('clients')
    .update({
      google_access_token: null,
      google_refresh_token: null,
      google_token_expires_at: null,
      google_email: null,
      gmb_account_id: null,
      gmb_account_name: null,
      gmb_location_id: null,
      gmb_location_name: null,
      gmb_connected_at: null,
    })
    .eq('id', userId);

  if (error) {
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
