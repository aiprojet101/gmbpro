import { createClient, SupabaseClient } from '@supabase/supabase-js'

const USER_AGENT = 'GmbPro-Bot/1.0 (+https://gmbpro.fr)'
const FETCH_TIMEOUT_MS = 5000
const MAX_BYTES = 1_000_000
const TOTAL_DEADLINE_MS = 50_000
const FALLBACK_PATHS = ['/contact', '/contact-us', '/contactez-nous', '/mentions-legales']

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.GMBPRO_SUPABASE_URL || ''
  const key = process.env.GMBPRO_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.GMBPRO_SUPABASE_ANON_KEY || ''
  if (!url || !key) return null
  return createClient(url, key)
}

type Prospect = {
  id: string
  business_name: string
  website: string | null
  email: string | null
  city?: string | null
}

export type ScrapeResult = {
  prospectId: string
  business_name: string
  email: string | null
  source: string
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
}

function deobfuscate(s: string): string {
  return s
    .replace(/\s*\[\s*(at|arobase|chez)\s*\]\s*/gi, '@')
    .replace(/\s*\(\s*(at|arobase|chez)\s*\)\s*/gi, '@')
    .replace(/\s*\{\s*(at|arobase|chez)\s*\}\s*/gi, '@')
    .replace(/\s+(at|arobase|chez)\s+/gi, '@')
    .replace(/\s*\[\s*dot\s*\]\s*/gi, '.')
    .replace(/\s*\(\s*dot\s*\)\s*/gi, '.')
    .replace(/\s+dot\s+/gi, '.')
}

function normalizeUrl(input: string): string | null {
  try {
    let url = input.trim()
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    const u = new URL(url)
    return u.toString()
  } catch {
    return null
  }
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return ''
  }
}

async function fetchPage(url: string): Promise<string | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.5',
      },
      redirect: 'follow',
    })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('text/html') && !ct.includes('text/plain') && !ct.includes('xhtml')) return null

    const reader = res.body?.getReader()
    if (!reader) {
      const t = await res.text()
      return t.slice(0, MAX_BYTES)
    }
    const chunks: Uint8Array[] = []
    let total = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        chunks.push(value)
        total += value.byteLength
        if (total >= MAX_BYTES) {
          try { await reader.cancel() } catch {}
          break
        }
      }
    }
    const buf = new Uint8Array(total)
    let off = 0
    for (const c of chunks) { buf.set(c, off); off += c.byteLength }
    let charset = 'utf-8'
    const m = ct.match(/charset=([^;]+)/i)
    if (m) charset = m[1].trim().toLowerCase()
    try {
      return new TextDecoder(charset).decode(buf)
    } catch {
      return new TextDecoder('utf-8').decode(buf)
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

const EMAIL_REGEX = /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/gi

function extractEmails(html: string): string[] {
  const found = new Set<string>()
  const decoded = decodeHtmlEntities(html)

  const mailtoRe = /mailto:([^"'>\s?]+)/gi
  let mm: RegExpExecArray | null
  while ((mm = mailtoRe.exec(decoded)) !== null) {
    const e = mm[1].split('?')[0].trim().toLowerCase()
    if (EMAIL_REGEX.test(e)) found.add(e)
    EMAIL_REGEX.lastIndex = 0
  }

  const plain = decoded.match(EMAIL_REGEX) || []
  for (const e of plain) found.add(e.toLowerCase())

  const deob = deobfuscate(decoded)
  const deobMatches = deob.match(EMAIL_REGEX) || []
  for (const e of deobMatches) found.add(e.toLowerCase())

  return Array.from(found).filter(e => {
    if (e.length > 254) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  })
}

function scoreEmail(email: string, websiteDomain: string, businessName: string): number {
  const lc = email.toLowerCase()
  const local = lc.split('@')[0]
  const domain = lc.split('@')[1] || ''

  if (/^(no.?reply|postmaster|abuse|webmaster|hostmaster)/i.test(local)) return -100
  if (/example\.com|test\.com|sentry\.io|cloudflare|wixpress|wix\.com|godaddy|squarespace/.test(domain)) return -100
  if (/\.(png|jpg|jpeg|gif|webp|svg|css|js)$/i.test(domain)) return -100

  let score = 0
  const cleanWebDomain = websiteDomain.replace(/^www\./, '')
  if (cleanWebDomain && domain.includes(cleanWebDomain)) score += 50
  if (/(gmail|yahoo|hotmail|outlook|wanadoo|orange|free|sfr|laposte)\.(com|fr)/.test(domain)) score -= 20
  if (/^(contact|info|hello|bonjour|reservation|reservations|booking|commande|commandes)$/.test(local)) score += 30
  const cleanName = businessName.toLowerCase().replace(/[^a-z]/g, '')
  if (cleanName && cleanName.length >= 4 && local.includes(cleanName.slice(0, 6))) score += 15

  return score
}

function pickBestEmail(emails: string[], websiteDomain: string, businessName: string): string | null {
  if (emails.length === 0) return null
  const scored = emails.map(e => ({ e, s: scoreEmail(e, websiteDomain, businessName) }))
  scored.sort((a, b) => b.s - a.s)
  if (scored[0].s <= -50) return null
  return scored[0].e
}

/* ─── Pages Jaunes scraper (fallback) ─── */

const PJ_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function fetchPJ(url: string, timeoutMs = 6000): Promise<string | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': PJ_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    })
    if (!res.ok) return null
    const t = await res.text()
    return t.slice(0, 2_000_000)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function scrapePagesJaunes(businessName: string, city: string, deadline: number): Promise<{ email: string; source: string } | null> {
  if (!businessName || !city) return null
  if (Date.now() >= deadline) return null

  const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const q = `${slugify(businessName)} ${slugify(city)}`.trim()
  const searchUrl = `https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=${encodeURIComponent(q)}&ou=${encodeURIComponent(city)}`

  const searchHtml = await fetchPJ(searchUrl)
  if (!searchHtml) return null

  // Try to extract emails directly from search page
  const directEmails = extractEmails(searchHtml)
  const directBest = pickBestEmail(directEmails, '', businessName)
  if (directBest) return { email: directBest, source: 'pagesjaunes:search' }

  // Otherwise try to find a listing detail URL and scrape it
  // PJ listing URLs: /pros/123456789 or /annuaire/societe/...
  const linkRegex = /href="(\/pros\/\d+|\/annuaire\/societe\/[^"]+)"/g
  const links: string[] = []
  let lm: RegExpExecArray | null
  while ((lm = linkRegex.exec(searchHtml)) !== null) {
    if (links.length >= 3) break
    links.push('https://www.pagesjaunes.fr' + lm[1])
  }

  for (const link of links) {
    if (Date.now() >= deadline) break
    const detailHtml = await fetchPJ(link)
    if (!detailHtml) continue
    const emails = extractEmails(detailHtml)
    const best = pickBestEmail(emails, '', businessName)
    if (best) return { email: best, source: `pagesjaunes:${link}` }
  }

  return null
}

async function scrapeProspect(p: Prospect, deadline: number): Promise<ScrapeResult> {
  const result: ScrapeResult = { prospectId: p.id, business_name: p.business_name, email: null, source: '' }

  // Fallback Pages Jaunes if no website OR website doesn't yield email
  if (!p.website) {
    if (p.city) {
      const pjResult = await scrapePagesJaunes(p.business_name, p.city, deadline)
      if (pjResult) {
        result.email = pjResult.email
        result.source = pjResult.source
        return result
      }
    }
    result.source = 'no-website-no-pj'
    return result
  }

  const baseUrl = normalizeUrl(p.website)
  if (!baseUrl) { result.source = 'invalid-url'; return result }
  const domain = getDomain(baseUrl)

  const tried: { url: string; emails: string[] }[] = []

  if (Date.now() < deadline) {
    const html = await fetchPage(baseUrl)
    if (html) {
      const emails = extractEmails(html)
      tried.push({ url: baseUrl, emails })
    }
  }

  let best: { email: string; source: string } | null = null
  for (const t of tried) {
    const pick = pickBestEmail(t.emails, domain, p.business_name)
    if (pick) {
      const sc = scoreEmail(pick, domain, p.business_name)
      if (!best || sc > scoreEmail(best.email, domain, p.business_name)) {
        best = { email: pick, source: t.url }
      }
    }
  }

  if (!best || scoreEmail(best.email, domain, p.business_name) < 30) {
    for (const path of FALLBACK_PATHS) {
      if (Date.now() >= deadline) break
      try {
        const u = new URL(path, baseUrl).toString()
        const html = await fetchPage(u)
        if (!html) continue
        const emails = extractEmails(html)
        const pick = pickBestEmail(emails, domain, p.business_name)
        if (pick) {
          const sc = scoreEmail(pick, domain, p.business_name)
          if (!best || sc > scoreEmail(best.email, domain, p.business_name)) {
            best = { email: pick, source: u }
            if (sc >= 50) break
          }
        }
      } catch { continue }
    }
  }

  if (best) {
    result.email = best.email
    result.source = best.source
  } else {
    // Last resort: try Pages Jaunes
    if (p.city && Date.now() < deadline) {
      const pjResult = await scrapePagesJaunes(p.business_name, p.city, deadline)
      if (pjResult) {
        result.email = pjResult.email
        result.source = pjResult.source
        return result
      }
    }
    result.source = 'not-found'
  }
  return result
}

export interface ScrapeEmailsInput {
  prospectIds?: string[]
  limit?: number
}

export interface ScrapeEmailsResult {
  processed: number
  found: number
  total: number
  results: ScrapeResult[]
  error?: string
}

export async function scrapeProspectEmails(input: ScrapeEmailsInput): Promise<ScrapeEmailsResult> {
  const limit = Math.min(Math.max(input.limit ?? 10, 1), 20)

  const supabase = getSupabase()
  if (!supabase) return { processed: 0, found: 0, total: 0, results: [], error: 'Supabase non configure' }

  let prospects: Prospect[] = []
  if (input.prospectIds && input.prospectIds.length > 0) {
    const { data, error } = await supabase
      .from('prospects')
      .select('id, business_name, website, email, city')
      .in('id', input.prospectIds.slice(0, 20))
    if (error) return { processed: 0, found: 0, total: 0, results: [], error: error.message }
    prospects = (data || []) as Prospect[]
  } else {
    const { data, error } = await supabase
      .from('prospects')
      .select('id, business_name, website, email, city')
      .is('email', null)
      .is('email_scraped_at', null)
      .limit(limit)
    if (error) return { processed: 0, found: 0, total: 0, results: [], error: error.message }
    prospects = (data || []) as Prospect[]
  }

  const startedAt = Date.now()
  const deadline = startedAt + TOTAL_DEADLINE_MS
  const results: ScrapeResult[] = []
  let found = 0

  for (let i = 0; i < prospects.length; i++) {
    if (Date.now() >= deadline) break
    const p = prospects[i]
    try {
      const r = await scrapeProspect(p, deadline)
      results.push(r)
      const nowIso = new Date().toISOString()
      // Always mark as scraped (success or not) to avoid re-processing
      try {
        await supabase
          .from('prospects')
          .update({
            email: r.email || null,
            email_scraped_at: nowIso,
            updated_at: nowIso,
          })
          .eq('id', p.id)
      } catch {}
      if (r.email) found++
    } catch (e) {
      results.push({
        prospectId: p.id,
        business_name: p.business_name,
        email: null,
        source: `error: ${e instanceof Error ? e.message : 'unknown'}`,
      })
    }
    if (i < prospects.length - 1 && Date.now() < deadline - 500) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  return {
    processed: results.length,
    found,
    total: prospects.length,
    results,
  }
}
