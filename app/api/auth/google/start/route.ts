import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerUser } from '../../../../lib/supabase-server';
import { getAuthUrl, getRedirectUri } from '../../../../lib/google-oauth';

export async function GET(req: Request) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.redirect(new URL('/connexion?next=/dashboard', req.url));
  }

  // Generate CSRF state
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set('gmb_oauth_state', state, {
    httpOnly: true,
    secure: !req.url.includes('localhost'),
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes
  });

  const redirectUri = getRedirectUri(req);
  const authUrl = getAuthUrl(state, redirectUri);
  return NextResponse.redirect(authUrl);
}
