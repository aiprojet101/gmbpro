import { NextResponse } from 'next/server';
import { getApiUser } from '../../../lib/auth-server';
import { getValidAccessToken } from '../../../lib/google-oauth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const accountId = url.searchParams.get('accountId');
  if (!accountId) {
    return NextResponse.json({ error: 'missing_accountId' }, { status: 400 });
  }

  const ctx = await getApiUser(req);
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { userId, supabase } = ctx;

  const { data: client } = await supabase
    .from('clients')
    .select('id, google_access_token, google_refresh_token, google_token_expires_at')
    .eq('id', userId)
    .single();

  if (!client || !client.google_refresh_token) {
    return NextResponse.json({ error: 'not_connected' }, { status: 400 });
  }

  try {
    const accessToken = await getValidAccessToken(client, async (id, fields) => {
      await supabase.from('clients').update(fields).eq('id', id);
    });

    const readMask = 'name,title,storefrontAddress,websiteUri,phoneNumbers,categories';
    const res = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations?readMask=${encodeURIComponent(readMask)}&pageSize=100`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) {
      const txt = await res.text();
      console.error('locations fetch error:', res.status, txt);
      return NextResponse.json({ error: 'google_api_error', status: res.status, detail: txt }, { status: 500 });
    }
    const json = await res.json();
    return NextResponse.json({ locations: json.locations || [] });
  } catch (e) {
    console.error('locations route error:', e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
