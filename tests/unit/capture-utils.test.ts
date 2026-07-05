import { describe, expect, it } from 'vitest'
import { generateCaptureId } from '../../server/utils/capture-id'
import { buildCaptureMarkdown, parseCaptureMarkdown } from '../../server/utils/frontmatter'
import { htmlToMarkdown } from '../../server/utils/markdown'
import { safeJoin, sanitizeFilename } from '../../server/utils/path-safety'
import { deriveTitleFromMarkdown, slugify } from '../../server/utils/slug'
import { buildCaptureFilename } from '../../server/services/capture-service'
import { validateAttachment } from '../../server/schemas/capture'

const root = process.cwd()

describe('capture utilities', () => {
  it('converts titles to safe slugs', () => {
    expect(slugify('Candidate vector and compiled domains')).toBe('candidate-vector-and-compiled-domains')
    expect(slugify('???')).toBe('untitled-capture')
  })

  it('derives fallback titles from meaningful content', () => {
    expect(deriveTitleFromMarkdown('## candidate vector\n\nThis should continue')).toBe('Candidate vector This should continue')
  })

  it('generates capture ids with the required prefix', () => {
    expect(generateCaptureId()).toMatch(/^cap_[0-9a-z]{10}$/)
  })

  it('builds collision-resistant capture filenames', () => {
    const name = buildCaptureFilename(new Date('2026-07-05T11:45:30Z'), 'Candidate vector idea', 'cap_01jz7d2x')
    expect(name).toContain('__candidate-vector-idea__cap_01jz7d2x.md')
  })

  it('rejects path traversal', () => {
    expect(() => safeJoin(root, '..', 'outside.md')).toThrow()
  })

  it('sanitizes attachment filenames', () => {
    expect(sanitizeFilename('..\\bad:file?.pdf')).toBe('bad-file.pdf')
  })

  it('generates parseable YAML front matter', () => {
    const markdown = buildCaptureMarkdown({ id: 'cap_test0000', created: '2026-07-05T21:45:30+10:00', title: 'Title', attachments: [] }, 'Body')
    const parsed = parseCaptureMarkdown(markdown)
    expect(parsed.data.id).toBe('cap_test0000')
    expect(parsed.body).toContain('Body')
  })

  it('serialises editor HTML to readable Markdown', () => {
    expect(htmlToMarkdown('<h2>Hello</h2><p><strong>world</strong></p><ul><li>one</li></ul>')).toContain('## Hello')
    expect(htmlToMarkdown('<script>alert(1)</script><p>safe</p>')).toBe('safe')
  })

  it('validates attachment metadata', () => {
    expect(validateAttachment('paper.pdf', 'application/pdf', 12)).toBeNull()
    expect(validateAttachment('script.exe', 'application/octet-stream', 12)).toBe('Attachment type is not allowed.')
    expect(validateAttachment('paper.pdf', 'application/pdf', 200, 100)).toBe('Attachment exceeds the configured size limit.')
  })
})
