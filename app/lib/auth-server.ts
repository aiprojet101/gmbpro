import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from './supabase-server';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.GMBPRO_SUPABASE_URL || '';
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.GMBPRO_SUPABASE_ANON_KEY || '';

/**
 * Resolve current user + authenticated supabase client (RLS-aware).
 * Tries 1) @supabase/ssr cookies, 2) Authorization Bearer header.
 * Returns null if not authenticated.
 */
export async function getApiUser(req: Request): Promise<{ userId: string; supabase: SupabaseClient } | null> {
  // Method 1: SSR cookies
  try {
    const ssr = await getServerSupabase();
    const { data: { user } } = await ssr.auth.getUser();
    if (user) {
      return { userId: user.id, supabase: ssr };
    }
  } catch { /* ignore */ }

  // Method 2: Authorization Bearer header
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (m) {
    const token = m[1];
    const tmp = createClient(URL, KEY);
    const { data, error } = await tmp.auth.getUser(token);
    if (!error && data.user) {
      const supabase = createClient(URL, KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      return { userId: data.user.id, supabase };
    }
  }
  return null;
}
