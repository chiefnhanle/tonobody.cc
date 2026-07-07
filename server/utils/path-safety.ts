import path from 'node:path'

// Control characters are invalid in portable filenames.
// eslint-disable-next-line no-control-regex
const WINDOWS_RESERVED = /[<>:"/\\|?*\u0000-\u001f]/g

export function sanitizeFilename(input: string, fallback = 'file') {
  const ext = path.extname(input).toLowerCase()
  const base = path.basename(input, ext)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(WINDOWS_RESERVED, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-. ]+|[-. ]+$/g, '')
    .slice(0, 90)
  const safeBase = base || fallback
  return `${safeBase}${ext}`
}

export function assertInside(root: string, candidate: string) {
  const resolvedRoot = path.resolve(root)
  const resolvedCandidate = path.resolve(candidate)
  const relative = path.relative(resolvedRoot, resolvedCandidate)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Path escapes the selected vault root')
  }
  return resolvedCandidate
}

export function safeJoin(root: string, ...segments: string[]) {
  if (segments.some(segment => segment.includes('\0'))) {
    throw new Error('Invalid path segment')
  }
  return assertInside(root, path.join(root, ...segments))
}

export function toVaultRelative(root: string, absolutePath: string) {
  const safe = assertInside(root, absolutePath)
  return path.relative(path.resolve(root), safe).replace(/\\/g, '/')
}
