import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getServerUser } from '../../../../lib/supabase-server';
import { getAuthUrl, getRedirectUri } from '../../../../lib/google-oauth';

export async function GET(req: Request) {
  // Method 1: Try server-side session via cookies (@supabase/ssr)
  let user = await getServerUser();
  let userId = user?.id;

  // Method 2: Fallback — accept access_token in query string (for client-side localStorage sessions)
  let supabaseToken: string | null = null;
  if (!userId) {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    if (token) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.GMBPRO_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.GMBPRO_SUPABASE_ANON_KEY || ''
      );
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) {
        user = data.user;
        userId = data.user.id;
        supabaseToken = token;
      }
    }
  }

  if (!userId) {
    return NextResponse.redirect(new URL('/connexion?next=/dashboard', req.url));
  }

  // Generate CSRF state + persist user_id for callback
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set('gmb_oauth_state', state, {
    httpOnly: true,
    secure: !req.url.includes('localhost'),
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  cookieStore.set('gmb_oauth_user', userId, {
    httpOnly: true,
    secure: !req.url.includes('localhost'),
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  if (supabaseToken) {
    cookieStore.set('gmb_oauth_supabase_token', supabaseToken, {
      httpOnly: true,
      secure: !req.url.includes('localhost'),
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
    });
  }

  const redirectUri = getRedirectUri(req);
  const authUrl = getAuthUrl(state, redirectUri);
  return NextResponse.redirect(authUrl);
}
