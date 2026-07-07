import { LocalVaultRepository, readConfiguredVaultRoot } from '../repositories/local-vault-repository'
import { getIndex } from '../services/vault-index-service'
import { parseCaptureMarkdown } from '../utils/frontmatter'
import { fail } from '../utils/errors'

interface GraphNode {
  id: string
  label: string
  type: 'capture' | 'concept' | 'claim' | 'question' | 'source' | 'method'
  preview?: string
  relativePath?: string
}

interface GraphEdge {
  id: string
  source: string
  target: string
  label: string
  weight: number
}

const stopwords = new Set([
  'about',
  'after',
  'also',
  'and',
  'are',
  'before',
  'between',
  'but',
  'can',
  'for',
  'from',
  'has',
  'into',
  'may',
  'not',
  'that',
  'the',
  'this',
  'with',
  'what',
  'when',
  'where',
  'which',
  'while',
  'will'
])

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

function cleanPhrase(value: string) {
  return value
    .replace(/[`*_#[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function classify(label: string): GraphNode['type'] {
  const lower = label.toLowerCase()
  if (lower.endsWith('?') || /^(how|why|what|when|where|can|should|does)\b/.test(lower)) return 'question'
  if (/\b(claim|proposition|novelty|argument)\b/.test(lower)) return 'claim'
  if (/\b(source|evidence|paper|standard|reference)\b/.test(lower)) return 'source'
  if (/\b(method|workflow|process|algorithm|loop|construction)\b/.test(lower)) return 'method'
  return 'concept'
}

function extractTerms(markdown: string, title: string) {
  const terms = new Set<string>()
  terms.add(title)

  for (const line of markdown.split('\n')) {
    const heading = line.match(/^#{1,3}\s+(.+)$/)?.[1]
    const listItem = line.match(/^[-*]\s+(.+)$/)?.[1]
    const cleaned = cleanPhrase(heading || listItem || line)
    if (!cleaned) continue
    const candidate = heading || listItem ? cleaned : ''
    if (candidate && candidate.length >= 4 && candidate.length <= 72) terms.add(candidate)
  }

  const words = cleanPhrase(markdown).toLowerCase().split(' ').filter(word => word.length > 4 && !stopwords.has(word))
  const counts = new Map<string, number>()
  for (const word of words) counts.set(word, (counts.get(word) || 0) + 1)
  for (const [word, count] of counts) {
    if (count >= 2) terms.add(word)
  }

  return [...terms].slice(0, 16)
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const root = await readConfiguredVaultRoot(config.thoughtVaultRoot)
  if (!root) fail(400, 'NO_VAULT_SELECTED', 'No vault folder is selected.')

  const repo = new LocalVaultRepository(root)
  const index = await getIndex(repo)
  const nodes = new Map<string, GraphNode>()
  const edgeWeights = new Map<string, GraphEdge>()

  for (const capture of index.captures.filter(capture => !capture.malformed)) {
    const markdown = await repo.readFile(capture.relativePath)
    const { body } = parseCaptureMarkdown(markdown)
    const captureId = `capture:${capture.id}`
    nodes.set(captureId, {
      id: captureId,
      label: capture.title,
      type: 'capture',
      preview: capture.preview,
      relativePath: capture.relativePath
    })

    for (const term of extractTerms(body, capture.title)) {
      const label = cleanPhrase(term)
      const termSlug = slug(label)
      if (!termSlug) continue
      const termId = `term:${termSlug}`
      if (!nodes.has(termId)) nodes.set(termId, { id: termId, label, type: classify(label) })
      const edgeId = `${captureId}->${termId}`
      const existing = edgeWeights.get(edgeId)
      edgeWeights.set(edgeId, {
        id: edgeId,
        source: captureId,
        target: termId,
        label: 'mentions',
        weight: (existing?.weight || 0) + 1
      })
    }
  }

  return { nodes: [...nodes.values()], edges: [...edgeWeights.values()] }
})
