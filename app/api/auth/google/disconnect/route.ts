import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../lib/supabase-server';
import { revokeToken } from '../../../../lib/google-oauth';

export async function POST() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: client } = await supabase
    .from('clients')
    .select('google_access_token, google_refresh_token')
    .eq('id', user.id)
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
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
