export interface WelcomeEmailInput {
  business_name: string
  email: string
  plan: 'starter' | 'pro' | 'premium'
  amount: string // "29€" or "39€/mois"
}

const PLAN_LABELS: Record<WelcomeEmailInput['plan'], string> = {
  starter: 'Starter — Audit + Refonte fiche',
  pro: 'Pro — Suivi SEO + Posts GMB IA',
  premium: 'Premium — Reputation + Posts + Reponses IA',
}

export function generateWelcomeEmail(p: WelcomeEmailInput): { subject: string; html: string; text: string } {
  const businessName = p.business_name || 'votre etablissement'
  const planLabel = PLAN_LABELS[p.plan] || p.plan
  const subject = `Bienvenue chez GmbPro, ${businessName} — votre programme demarre maintenant`

  const text = `Bienvenue chez GmbPro, ${businessName} !

Votre forfait : ${planLabel} (${p.amount})

Pour demarrer, 3 etapes simples :

1. Donner acces a votre fiche Google
   https://gmbpro.fr/dashboard?step=1

2. Verifier les informations de votre profil
   https://gmbpro.fr/dashboard?step=2

3. Generer votre programme d'optimisation personnalise
   https://gmbpro.fr/dashboard?step=3

Une question ? Notre equipe est la :
contact@gmbpro.fr — 07 43 34 11 17

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
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">
                    GmbPro
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 32px 8px 32px;">
              <h1 style="margin:0 0 12px 0;font-size:26px;line-height:1.25;color:#FFFFFF;font-weight:700;letter-spacing:-0.5px;">
                Bienvenue ${businessName}
              </h1>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#9CA3AF;">
                Merci de nous faire confiance. Votre programme d'optimisation Google demarre maintenant.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <div style="font-size:12px;color:#A5B4FC;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Votre forfait</div>
                    <div style="font-size:16px;color:#FFFFFF;font-weight:600;">${planLabel}</div>
                    <div style="font-size:13px;color:#9CA3AF;margin-top:2px;">${p.amount}</div>
                  </td>
                </tr>
              </table>

              <h2 style="margin:0 0 16px 0;font-size:18px;color:#FFFFFF;font-weight:700;">
                3 etapes pour demarrer
              </h2>
            </td>
          </tr>

          ${stepRow(1, 'Donnez-nous acces a votre fiche', 'Invitez GmbPro comme Manager sur votre Google Business Profile (5 min).', 'https://gmbpro.fr/dashboard?step=1', 'Donner acces')}
          ${stepRow(2, 'Verifiez votre profil', 'Confirmez les infos de votre etablissement pour un programme precis.', 'https://gmbpro.fr/dashboard?step=2', 'Verifier le profil')}
          ${stepRow(3, 'Generez votre programme', 'Notre IA analyse votre fiche et cree un plan d\'action personnalise.', 'https://gmbpro.fr/dashboard?step=3', 'Generer mon programme')}

          <tr>
            <td style="padding:16px 32px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                <tr>
                  <td style="padding:20px;text-align:center;">
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

function stepRow(n: number, title: string, desc: string, url: string, cta: string): string {
  return `<tr>
    <td style="padding:0 32px 16px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;">
        <tr>
          <td style="padding:20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="44" valign="top" style="padding-right:14px;">
                  <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#FFFFFF;text-align:center;line-height:36px;font-weight:700;font-size:15px;">${n}</div>
                </td>
                <td valign="top">
                  <div style="font-size:15px;font-weight:600;color:#FFFFFF;margin-bottom:4px;">${title}</div>
                  <div style="font-size:13px;color:#9CA3AF;line-height:1.5;margin-bottom:12px;">${desc}</div>
                  <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#FFFFFF;text-decoration:none;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:600;">${cta} →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}
