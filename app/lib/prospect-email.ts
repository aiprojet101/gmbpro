// Email de prospection GmbPro — design premium sombre
// Pret a etre envoye via Resend

export interface ProspectEmailInput {
  business_name: string
  city: string
  global_score: number
  failed_count: number
  rating?: number | null
  review_count?: number | null
  place_id?: string | null
}

export interface GeneratedEmail {
  subject: string
  html: string
  text: string
}

export function generateProspectEmail(p: ProspectEmailInput): GeneratedEmail {
  const score = p.global_score ?? 0
  const placeParam = p.place_id ? `&placeId=${encodeURIComponent(p.place_id)}` : ''
  const scannerUrl = `https://gmbpro.fr/scanner/resultats?name=${encodeURIComponent(p.business_name)}&city=${encodeURIComponent(p.city)}${placeParam}`
  const unsubUrl = `https://gmbpro.fr/desabonnement?email=prospect`

  const subject = `${p.business_name}, votre fiche Google a ${score}/100 — voici comment la corriger`

  const ratingLine = p.rating != null
    ? `<li><strong>Note Google :</strong> ${p.rating}/5 (${p.review_count || 0} avis)</li>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5ea;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;padding:8px 16px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:8px;color:#fff;font-weight:700;letter-spacing:0.5px;">GmbPro</div>
    </div>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;">

      <h1 style="margin:0 0 16px;font-size:24px;color:#fff;font-weight:700;line-height:1.3;">
        Bonjour,
      </h1>

      <p style="margin:0 0 20px;color:#a1a1aa;line-height:1.6;font-size:15px;">
        Nous avons analyse la fiche Google My Business de <strong style="color:#fff;">${p.business_name}</strong> a ${p.city}.
        Voici le resultat :
      </p>

      <div style="text-align:center;padding:24px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.3);border-radius:12px;margin:24px 0;">
        <div style="font-size:48px;font-weight:800;background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;">
          ${score}<span style="font-size:24px;color:#a1a1aa;">/100</span>
        </div>
        <div style="margin-top:8px;color:#a1a1aa;font-size:14px;">
          ${p.failed_count} criteres a corriger
        </div>
      </div>

      <p style="margin:0 0 12px;color:#e5e5ea;line-height:1.6;font-size:15px;">
        <strong>Ce que cela vous coute chaque mois :</strong>
      </p>
      <ul style="color:#a1a1aa;line-height:1.8;font-size:14px;padding-left:20px;margin:0 0 20px;">
        <li>Moins de visibilite sur Google Maps</li>
        <li>Des clients qui passent chez vos concurrents</li>
        <li>Un manque a gagner de plusieurs milliers d'euros par an</li>
        ${ratingLine}
      </ul>

      <p style="margin:0 0 24px;color:#e5e5ea;line-height:1.6;font-size:15px;">
        <strong>Bonne nouvelle :</strong> on peut corriger tout ca. Chez GmbPro, on optimise votre fiche, on publie du contenu chaque semaine et on gere votre reputation — automatiquement.
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${scannerUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
          Voir mon rapport detaille
        </a>
      </div>

      <p style="margin:24px 0 0;color:#71717a;line-height:1.6;font-size:13px;font-style:italic;">
        A partir de 29 euros. Sans engagement. Premier audit offert.
      </p>

    </div>

    <div style="text-align:center;margin-top:24px;color:#71717a;font-size:12px;line-height:1.6;">
      <p style="margin:0 0 8px;">GmbPro — SEO local automatise</p>
      <p style="margin:0;">
        <a href="${unsubUrl}" style="color:#71717a;text-decoration:underline;">Se desabonner</a>
      </p>
    </div>

  </div>
</body>
</html>`

  const text = `${p.business_name} — votre fiche Google a ${score}/100

Nous avons analyse la fiche Google My Business de ${p.business_name} a ${p.city}.

Score : ${score}/100
Criteres a corriger : ${p.failed_count}
${p.rating != null ? `Note : ${p.rating}/5 (${p.review_count || 0} avis)\n` : ''}
Chez GmbPro, on optimise votre fiche, on publie du contenu chaque semaine et on gere votre reputation — automatiquement.

Voir votre rapport detaille : ${scannerUrl}

A partir de 29 euros. Sans engagement.

---
GmbPro — SEO local automatise
Se desabonner : ${unsubUrl}`

  return { subject, html, text }
}
