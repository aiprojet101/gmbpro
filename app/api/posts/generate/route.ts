import { NextResponse } from 'next/server'
import { getApiUser } from '../../../lib/auth-server'
import { generateText, extractJson, getClaude } from '../../../lib/claude'

interface GeneratedPost {
  title: string
  content: string
  type: string
  suggested_date: string
}

export async function POST(req: Request) {
  const auth = await getApiUser(req)
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { count?: number; context?: string } = {}
  try { body = await req.json() } catch { /* empty body ok */ }
  const count = Math.max(1, Math.min(8, body.count || 4))

  // Read client info
  const { data: client, error: clientErr } = await auth.supabase
    .from('clients')
    .select('business_name, city, plan, gmb_location_name')
    .eq('id', auth.userId)
    .single()

  if (clientErr || !client) {
    return NextResponse.json({ error: 'client_not_found' }, { status: 404 })
  }

  const businessName = client.gmb_location_name || client.business_name || 'Mon etablissement'
  const city = client.city || ''

  // If no API key, return error
  if (!getClaude()) {
    return NextResponse.json({
      error: 'Cle API Anthropic non configuree. Ajoutez GMBPRO_ANTHROPIC_API_KEY dans Vercel.',
    }, { status: 503 })
  }

  const today = new Date().toISOString().split('T')[0]
  const prompt = `Tu es un expert SEO local. Genere ${count} posts Google Business Profile pour cet etablissement francais :
- Nom: ${businessName}
- Ville: ${city}
- Secteur: commerce de proximite
- Date de reference (aujourd'hui): ${today}
${body.context ? `- Contexte additionnel: ${body.context}` : ''}

Chaque post doit avoir :
- title: accrocheur, max 60 caracteres
- content: 250-400 caracteres, en francais, engageant, avec un call-to-action
- type: une valeur parmi "update", "offer", "event", "product"
- suggested_date: date ISO (YYYY-MM-DD) dans les 4 prochaines semaines a partir d'aujourd'hui

Retourne UNIQUEMENT un tableau JSON valide, sans commentaire ni texte avant ou apres :
[{"title": "...", "content": "...", "type": "update", "suggested_date": "YYYY-MM-DD"}]`

  let posts: GeneratedPost[] = []
  try {
    const text = await generateText(prompt, 'Tu es un expert SEO local francais. Tu reponds toujours par du JSON valide uniquement.', 3000)
    posts = extractJson<GeneratedPost[]>(text)
    if (!Array.isArray(posts)) throw new Error('not_array')
  } catch (e) {
    return NextResponse.json({
      error: 'Generation IA echouee',
      detail: e instanceof Error ? e.message : String(e),
    }, { status: 500 })
  }

  // Validate + sanitize + save
  const validTypes = ['update', 'offer', 'event', 'product']
  const rows = posts
    .filter((p) => p && p.title && p.content)
    .map((p) => {
      const type = validTypes.includes(p.type) ? p.type : 'update'
      const title = String(p.title).slice(0, 100)
      const content = String(p.content).slice(0, 1500)
      let scheduledAt: string | null = null
      if (p.suggested_date) {
        const d = new Date(p.suggested_date)
        if (!isNaN(d.getTime())) scheduledAt = d.toISOString()
      }
      return {
        client_id: auth.userId,
        title: `[${type}] ${title}`.slice(0, 200),
        content,
        status: 'draft' as const,
        scheduled_at: scheduledAt,
      }
    })

  if (rows.length === 0) {
    return NextResponse.json({ error: 'no_valid_posts' }, { status: 500 })
  }

  const { data: inserted, error: insertErr } = await auth.supabase
    .from('gmb_posts')
    .insert(rows)
    .select()

  if (insertErr) {
    return NextResponse.json({ error: 'db_insert_failed', detail: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({ posts: inserted || [], count: (inserted || []).length })
}
