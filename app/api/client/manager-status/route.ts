import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getApiUser } from '../../../lib/auth-server';

const VALID = ['pending', 'sent', 'accepted', 'refused'] as const;
type Status = typeof VALID[number];

const FROM = 'GmbPro <contact@gmbpro.fr>';
const ADMIN_EMAIL = 'contact@gmbpro.fr';

interface ClientForNotif {
  business_name?: string | null;
  email?: string | null;
  phone?: string | null;
  sector?: string | null;
  city?: string | null;
}

async function notifyAdminInvite(client: ClientForNotif): Promise<void> {
  const apiKey = process.env.GMBPRO_RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[manager-status] GMBPRO_RESEND_API_KEY missing — admin notif skipped');
    return;
  }
  const businessName = client.business_name || 'Un client';
  const subject = `[GmbPro] ${businessName} vous a invite comme Manager — a accepter`;
  const text = `${businessName} a envoye l'invitation Manager.

Coordonnees client :
- Etablissement : ${businessName}
- Email : ${client.email || '-'}
- Telephone : ${client.phone || '-'}
- Secteur : ${client.sector || '-'}
- Ville : ${client.city || '-'}

Action :
1. Connectez-vous a https://business.google.com avec contact@gmbpro.fr
2. Acceptez l'invitation Manager
3. Marquez le client comme accepte dans /admin

Voir tous les invites en attente : https://gmbpro.fr/admin
`;
  const html = `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:0;background:#0A0E1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#E5E7EB;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0E1A;padding:40px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#111827;border:1px solid rgba(99,102,241,0.2);border-radius:16px;overflow:hidden;">
  <tr><td style="padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.06);"><div style="font-size:20px;font-weight:800;color:#FFFFFF;">GmbPro · Admin</div></td></tr>
  <tr><td style="padding:28px 32px;">
    <h1 style="margin:0 0 12px 0;font-size:22px;color:#FFFFFF;">Nouvelle invitation Manager</h1>
    <p style="margin:0 0 18px 0;color:#9CA3AF;font-size:14px;line-height:1.6;">
      <strong style="color:#FFFFFF;">${businessName}</strong> a envoye l&apos;invitation. Acceptez-la sur business.google.com.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;font-size:14px;color:#E5E7EB;line-height:1.8;">
        <div><span style="color:#9CA3AF;">Etablissement :</span> ${businessName}</div>
        <div><span style="color:#9CA3AF;">Email :</span> ${client.email || '-'}</div>
        <div><span style="color:#9CA3AF;">Telephone :</span> ${client.phone || '-'}</div>
        <div><span style="color:#9CA3AF;">Secteur :</span> ${client.sector || '-'}</div>
        <div><span style="color:#9CA3AF;">Ville :</span> ${client.city || '-'}</div>
      </td></tr>
    </table>
    <a href="https://business.google.com" style="display:inline-block;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#FFFFFF;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:600;font-size:14px;margin-right:8px;">Accepter sur Google →</a>
    <a href="https://gmbpro.fr/admin" style="display:inline-block;background:rgba(255,255,255,0.06);color:#E5E7EB;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:600;font-size:14px;">Ouvrir /admin</a>
  </td></tr>
  <tr><td style="padding:18px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;font-size:12px;color:#6B7280;">
    <a href="https://gmbpro.fr/admin" style="color:#6B7280;text-decoration:none;">Voir tous les invites en attente</a>
  </td></tr>
</table>
</td></tr></table></body></html>`;

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({ from: FROM, to: [ADMIN_EMAIL], subject, html, text });
    if (result.error) {
      console.error('[manager-status] admin notif error:', result.error.message);
    }
  } catch (e) {
    console.error('[manager-status] admin notif exception:', e instanceof Error ? e.message : e);
  }
}

export async function PATCH(req: Request) {
  const auth = await getApiUser(req);
  if (!auth) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  let body: { status?: string } = {};
  try { body = await req.json(); } catch {}

  const status = body.status as Status;
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    manager_invite_status: status,
  };
  if (status === 'sent') {
    update.manager_invite_at = new Date().toISOString();
    update.manager_email_used = 'contact@gmbpro.fr';
  } else if (status === 'accepted') {
    update.manager_accepted_at = new Date().toISOString();
  }

  const { error } = await auth.supabase
    .from('clients')
    .update(update)
    .eq('id', auth.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send admin notification when client marks invite as sent
  if (status === 'sent') {
    try {
      const { data: clientRow } = await auth.supabase
        .from('clients')
        .select('business_name, email, phone, sector, city')
        .eq('id', auth.userId)
        .single();
      if (clientRow) {
        // Don't fail the request if notification fails
        await notifyAdminInvite(clientRow as ClientForNotif);
      }
    } catch (e) {
      console.error('[manager-status] notif lookup failed:', e instanceof Error ? e.message : e);
    }
  }

  return NextResponse.json({ ok: true, status });
}
