export interface ManagerRelanceInput {
  business_name: string
}

export function generateManagerRelanceEmail(p: ManagerRelanceInput): { subject: string; html: string; text: string } {
  const businessName = p.business_name || 'votre etablissement'
  const subject = `[GmbPro] N'oubliez pas d'activer votre automatisation`
  const ctaUrl = 'https://gmbpro.fr/dashboard?tab=acces-google'

  const text = `Bonjour ${businessName},

Vous avez souscrit a GmbPro mais nous n'avons pas encore recu l'acces Manager a votre fiche Google.

En activant cet acces (5 minutes), vous beneficiez de :
- Posts Google publies automatiquement chaque semaine
- Reponses aux avis envoyees automatiquement par notre IA
- Optimisations appliquees sans intervention de votre part
- Suivi de positions en temps reel

Vous gardez le controle : vous pouvez retirer l'acces a tout moment.

Activez votre automatisation maintenant :
${ctaUrl}

Une question ? contact@gmbpro.fr — 07 43 34 11 17

A tres vite,
L'equipe GmbPro
https://gmbpro.fr
`

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0A0E1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#E5E7EB;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0E1A;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:linear-gradient(180deg,#111827 0%,#0F172A 100%);border:1px solid rgba(99,102,241,0.2);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">GmbPro</div>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 8px 32px;">
              <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.3;color:#FFFFFF;font-weight:700;">
                N'oubliez pas d'activer votre automatisation
              </h1>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#9CA3AF;">
                Bonjour <strong style="color:#E5E7EB;">${businessName}</strong>, vous avez souscrit a GmbPro mais nous n'avons pas encore recu l'acces Manager a votre fiche Google. Sans cet acces, votre programme reste manuel.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:13px;color:#A5B4FC;font-weight:600;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">Avec l'acces Manager</div>
                    <div style="font-size:14px;color:#E5E7EB;line-height:1.8;">
                      ✓ Posts Google publies automatiquement chaque semaine<br>
                      ✓ Reponses aux avis envoyees automatiquement (IA)<br>
                      ✓ Optimisations appliquees sans intervention de votre part<br>
                      ✓ Suivi de positions en temps reel
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px 0;font-size:13px;color:#9CA3AF;line-height:1.6;font-style:italic;">
                Vous gardez le controle : vous pouvez retirer l'acces a tout moment depuis votre compte Google.
              </p>

              <div style="text-align:center;margin:0 0 12px 0;">
                <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#FFFFFF;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:700;">
                  Activer mon automatisation →
                </a>
              </div>
              <p style="margin:0 0 8px 0;font-size:12px;color:#6B7280;text-align:center;">
                Procedure de 5 minutes, guide pas-a-pas dans votre dashboard.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 32px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                <tr>
                  <td style="padding:18px;text-align:center;">
                    <div style="font-size:13px;color:#9CA3AF;margin-bottom:6px;">Une question ? Notre equipe est la.</div>
                    <a href="mailto:contact@gmbpro.fr" style="color:#A5B4FC;text-decoration:none;font-weight:600;font-size:14px;">contact@gmbpro.fr</a>
                    <span style="color:#4B5563;"> · </span>
                    <a href="tel:+33743341117" style="color:#A5B4FC;text-decoration:none;font-weight:600;font-size:14px;">07 43 34 11 17</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <div style="font-size:12px;color:#6B7280;line-height:1.6;">
                A tres vite,<br>
                <strong style="color:#9CA3AF;">L'equipe GmbPro</strong><br>
                <a href="https://gmbpro.fr" style="color:#6B7280;text-decoration:none;">gmbpro.fr</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html, text }
}
