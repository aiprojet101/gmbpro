import Anthropic from '@anthropic-ai/sdk'

export function getClaude() {
  const apiKey = process.env.GMBPRO_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  return new Anthropic({ apiKey })
}

export async function generateText(prompt: string, system?: string, maxTokens = 2000): Promise<string> {
  const claude = getClaude()
  if (!claude) throw new Error('Cle API Anthropic non configuree. Ajoutez GMBPRO_ANTHROPIC_API_KEY dans Vercel.')

  const message = await claude.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: maxTokens,
    system: system || 'You are a helpful assistant. Always respond in French.',
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = message.content.find((b) => b.type === 'text')
  return textBlock && 'text' in textBlock ? textBlock.text : ''
}

/**
 * Extract JSON from Claude's response, handling markdown code fences.
 */
export function extractJson<T = unknown>(text: string): T {
  let cleaned = text.trim()
  // Strip ```json ... ``` or ``` ... ```
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fence) cleaned = fence[1].trim()
  // Find first [ or { and last ] or }
  const firstArr = cleaned.indexOf('[')
  const firstObj = cleaned.indexOf('{')
  let start = -1
  if (firstArr === -1) start = firstObj
  else if (firstObj === -1) start = firstArr
  else start = Math.min(firstArr, firstObj)
  const lastArr = cleaned.lastIndexOf(']')
  const lastObj = cleaned.lastIndexOf('}')
  const end = Math.max(lastArr, lastObj)
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1)
  return JSON.parse(cleaned) as T
}
