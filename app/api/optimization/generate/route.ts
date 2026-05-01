import { NextResponse } from 'next/server';
import { getApiUser } from '../../../lib/auth-server';
import { generateText, extractJson } from '../../../lib/claude';

interface GeneratedTask {
  category: string;
  task_type: string;
  title: string;
  why: string;
  instructions: string;
  content_to_copy: string | null;
  priority: number;
}

export async function POST(req: Request) {
  const auth = await getApiUser(req);
  if (!auth) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  // Read client info
  const { data: client, error: clientErr } = await auth.supabase
    .from('clients')
    .select('business_name, city, sector, description')
    .eq('id', auth.userId)
    .single();

  if (clientErr || !client) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
  }

  // Latest audit
  const { data: audits } = await auth.supabase
    .from('audits')
    .select('global_score, passed_count, failed_count, total_criteria, categories')
    .eq('client_id', auth.userId)
    .order('created_at', { ascending: false })
    .limit(1);

  const audit = audits && audits[0];

  let failedCategories = 'inconnues';
  if (audit?.categories && Array.isArray(audit.categories)) {
    const failed = (audit.categories as Array<{ name?: string; passed?: boolean }>)
      .filter((c) => c && c.passed === false)
      .map((c) => c.name || '?')
      .slice(0, 15);
    if (failed.length) failedCategories = failed.join(', ');
  }

  const globalScore = audit?.global_score ?? 'inconnu';

  const prompt = `Tu es expert en optimisation Google Business Profile. Genere un programme d'optimisation pour ce commerce francais.

Etablissement:
- Nom: ${client.business_name || 'inconnu'}
- Ville: ${client.city || 'inconnue'}
- Secteur: ${client.sector || 'non renseigne'}
- Description actuelle: ${client.description || 'aucune'}

Score audit actuel: ${globalScore}/100
Criteres echoues: ${failedCategories}

Genere 6 a 8 taches concretes a faire pour optimiser sa fiche.

Pour chaque tache, fournis:
- category: "informations" | "description" | "photos" | "posts" | "avis" | "categories"
- task_type: court (ex: "description-seo", "horaires-complets")
- title: titre court (max 60 chars)
- why: phrase courte expliquant l'impact (50-100 chars)
- instructions: etapes numerotees pour le faire dans business.google.com (200-400 chars)
- content_to_copy: contenu pret a copier-coller (description optimisee, post type, etc.) — null si non applicable
- priority: 1-5 (1 = plus urgent)

Retourne UNIQUEMENT du JSON valide, tableau d'objets:
[{"category":"...","task_type":"...","title":"...","why":"...","instructions":"...","content_to_copy":"...","priority":1}, ...]`;

  let tasks: GeneratedTask[];
  try {
    const text = await generateText(prompt, undefined, 4000);
    tasks = extractJson<GeneratedTask[]>(text);
    if (!Array.isArray(tasks)) throw new Error('Reponse non-array');
  } catch (e) {
    return NextResponse.json({ error: 'Erreur generation IA: ' + (e as Error).message }, { status: 500 });
  }

  // Save
  const rows = tasks.map((t) => ({
    client_id: auth.userId,
    category: String(t.category || 'informations').slice(0, 50),
    task_type: String(t.task_type || 'general').slice(0, 80),
    title: String(t.title || 'Tache').slice(0, 200),
    why: t.why ? String(t.why).slice(0, 500) : null,
    instructions: t.instructions ? String(t.instructions).slice(0, 2000) : null,
    content_to_copy: t.content_to_copy ? String(t.content_to_copy).slice(0, 4000) : null,
    priority: Number(t.priority) || 3,
    status: 'pending',
  }));

  const { data, error } = await auth.supabase
    .from('optimization_tasks')
    .insert(rows)
    .select('*');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, tasks: data });
}
