import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getServerSupabase } from '../../../../lib/supabase-server';
import { exchangeCodeForTokens, getUserInfo, getRedirectUri } from '../../../../lib/google-oauth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard?gmb_error=${encodeURIComponent(error)}`, req.url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard?gmb_error=missing_params', req.url));
  }

  // Verify CSRF state + retrieve user_id stored at start
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get('gmb_oauth_state')?.value;
  const userIdCookie = cookieStore.get('gmb_oauth_user')?.value;
  if (!stateCookie || stateCookie !== state) {
    return NextResponse.redirect(new URL('/dashboard?gmb_error=invalid_state', req.url));
  }
  cookieStore.delete('gmb_oauth_state');
  cookieStore.delete('gmb_oauth_user');

  // Try server-side session first; fallback to user_id cookie set by /start
  let user = null as null | { id: string };
  const ssrSupabase = await getServerSupabase();
  const { data: { user: ssrUser } } = await ssrSupabase.auth.getUser();
  if (ssrUser) {
    user = { id: ssrUser.id };
  } else if (userIdCookie) {
    user = { id: userIdCookie };
  }

  if (!user) {
    return NextResponse.redirect(new URL('/connexion?next=/dashboard', req.url));
  }

  // Use service-role-like (anon) client for DB writes (RLS allows owner via auth, but here we trust the cookie)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.GMBPRO_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.GMBPRO_SUPABASE_ANON_KEY || ''
  );

  try {
    const redirectUri = getRedirectUri(req);
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const userInfo = await getUserInfo(tokens.access_token);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const updateFields: Record<string, unknown> = {
      google_access_token: tokens.access_token,
      google_token_expires_at: expiresAt,
      google_email: userInfo.email,
      gmb_connected_at: new Date().toISOString(),
    };
    if (tokens.refresh_token) {
      updateFields.google_refresh_token = tokens.refresh_token;
    }

    const { error: updErr } = await supabase
      .from('clients')
      .update(updateFields)
      .eq('id', user.id);

    if (updErr) {
      console.error('clients update error:', updErr);
      return NextResponse.redirect(new URL('/dashboard?gmb_error=db_update', req.url));
    }

    // Try auto-detect single account/location
    try {
      const accRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (accRes.ok) {
        const accJson = await accRes.json();
        const accounts = accJson.accounts || [];
        if (accounts.length === 1) {
          const acc = accounts[0];
          const accountId = acc.name; // "accounts/123"
          const locRes = await fetch(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations?readMask=name,title,storefrontAddress,websiteUri,phoneNumbers&pageSize=100`,
            { headers: { Authorization: `Bearer ${tokens.access_token}` } }
          );
          if (locRes.ok) {
            const locJson = await locRes.json();
            const locations = locJson.locations || [];
            if (locations.length === 1) {
              const loc = locations[0];
              await supabase
                .from('clients')
                .update({
                  gmb_account_id: accountId,
                  gmb_account_name: acc.accountName || acc.name,
                  gmb_location_id: loc.name,
                  gmb_location_name: loc.title,
                })
                .eq('id', user.id);
            } else {
              // Just save account
              await supabase
                .from('clients')
                .update({
                  gmb_account_id: accountId,
                  gmb_account_name: acc.accountName || acc.name,
                })
                .eq('id', user.id);
            }
          }
        }
      }
    } catch (e) {
      console.error('auto-detect error:', e);
      // non-fatal
    }

    return NextResponse.redirect(new URL('/dashboard?tab=fiche&gmb_connected=1', req.url));
  } catch (e) {
    console.error('OAuth callback error:', e);
    return NextResponse.redirect(new URL('/dashboard?gmb_error=token_exchange', req.url));
  }
}
