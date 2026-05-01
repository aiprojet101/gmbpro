// Google Business Profile OAuth helpers
// Server-side only — uses GMBPRO_GOOGLE_CLIENT_ID/SECRET

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/business.manage',
];

function getClientId(): string {
  return process.env.GMBPRO_GOOGLE_CLIENT_ID || '';
}
function getClientSecret(): string {
  return process.env.GMBPRO_GOOGLE_CLIENT_SECRET || '';
}

export function getAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
    include_granted_scopes: 'true',
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<GoogleTokens> {
  const body = new URLSearchParams({
    code,
    client_id: getClientId(),
    client_secret: getClientSecret(),
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: getClientId(),
    client_secret: getClientSecret(),
    grant_type: 'refresh_token',
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function getUserInfo(accessToken: string): Promise<{ email: string; id: string; verified_email?: boolean }> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Userinfo failed: ${res.status} ${txt}`);
  }
  return res.json();
}

interface ClientRow {
  id: string;
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expires_at: string | null;
}

/**
 * Returns valid access token, refreshing via DB if expired.
 * Requires service-role-or-RLS-able supabase client to update.
 */
export async function getValidAccessToken(
  client: ClientRow,
  supabaseUpdate: (id: string, fields: Record<string, unknown>) => Promise<void>
): Promise<string> {
  if (!client.google_refresh_token) {
    throw new Error('NOT_CONNECTED');
  }
  const now = Date.now();
  const expiresAt = client.google_token_expires_at ? new Date(client.google_token_expires_at).getTime() : 0;
  // Refresh if expires within 60s or no token
  if (client.google_access_token && expiresAt - now > 60_000) {
    return client.google_access_token;
  }
  const fresh = await refreshAccessToken(client.google_refresh_token);
  const newExpiresAt = new Date(Date.now() + fresh.expires_in * 1000).toISOString();
  await supabaseUpdate(client.id, {
    google_access_token: fresh.access_token,
    google_token_expires_at: newExpiresAt,
  });
  return fresh.access_token;
}

export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch {
    /* ignore */
  }
}

export function getRedirectUri(req: Request): string {
  // Always use production domain when deployed; respect VERCEL env
  const envUrl = process.env.GMBPRO_OAUTH_REDIRECT_URI;
  if (envUrl) return envUrl;
  const url = new URL(req.url);
  // Force https in production
  const host = url.host;
  const proto = host.includes('localhost') ? 'http' : 'https';
  return `${proto}://${host}/api/auth/google/callback`;
}
