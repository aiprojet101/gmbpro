import { NextResponse } from 'next/server'
import { getApiUser } from '../../../lib/auth-server'
import { generateText, getClaude } from '../../../lib/claude'

export async function POST(req: Request) {
  const auth = await getApiUser(req)
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { reviewAuthor?: string; reviewRating?: number; reviewText?: string } = {}
  try { body = await req.json() } catch { /* */ }
  const author = (body.reviewAuthor || '').trim() || 'Client'
  const rating = Math.max(1, Math.min(5, Number(body.reviewRating) || 5))
  const text = (body.reviewText || '').trim()
  if (!text) return NextResponse.json({ error: 'review_text_required' }, { status: 400 })

  const { data: client } = await auth.supabase
    .from('clients')
    .select('business_name, gmb_location_name')
    .eq('id', auth.userId)
    .single()

  const businessName = client?.gmb_location_name || client?.business_name || 'notre etablissement'

  if (!getClaude()) {
    return NextResponse.json({
      error: 'Cle API Anthropic non configuree. Ajoutez GMBPRO_ANTHROPIC_API_KEY dans Vercel.',
    }, { status: 503 })
  }

  const tone = rating >= 4
    ? 'amical et reconnaissant'
    : rating === 3
      ? 'cordial, nuance et constructif'
      : 'empathique, professionnel et constructif (sans etre defensif)'

  const prompt = `Genere une reponse professionnelle en francais a cet avis Google laisse pour "${businessName}".

Auteur de l'avis: ${author}
Note: ${rating}/5
Avis: "${text}"

Ton attendu: ${tone}.

Regles :
- Reponse de 250 a 500 caracteres
- Commencer par remercier le client (par son prenom si fourni)
- Si negatif: reconnaitre, ne pas etre defensif, proposer une suite (contact direct, amelioration)
- Si positif: remercier sincerement, inviter a revenir
- Pas d'emoji
- INTERDIT : inventer un prenom de gerant, signer avec un prenom imaginaire, ou ajouter "et toute l'equipe"
- Signer uniquement avec "L'equipe ${businessName}" ou simplement "${businessName}" — JAMAIS un prenom

Retourne UNIQUEMENT le texte de la reponse, sans guillemets, sans prefixe, sans commentaire.`

  let responseText = ''
  try {
    responseText = (await generateText(prompt, 'Tu es un expert en relation client. Tu rediges des reponses professionnelles aux avis Google en francais.', 800)).trim()
    // Strip surrounding quotes if any
    responseText = responseText.replace(/^["'`]+|["'`]+$/g, '').trim()
  } catch (e) {
    return NextResponse.json({
      error: 'Generation IA echouee',
      detail: e instanceof Error ? e.message : String(e),
    }, { status: 500 })
  }

  if (!responseText) return NextResponse.json({ error: 'empty_response' }, { status: 500 })

  const { data: inserted, error: insertErr } = await auth.supabase
    .from('review_responses')
    .insert({
      client_id: auth.userId,
      review_author: author,
      review_rating: rating,
      review_text: text,
      response_text: responseText,
      status: 'draft',
    })
    .select()
    .single()

  if (insertErr) {
    return NextResponse.json({ error: 'db_insert_failed', detail: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({ response: inserted })
}
