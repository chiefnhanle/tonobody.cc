export function slugify(input: string, fallback = 'untitled-capture') {
  const slug = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 48)
  return slug || fallback
}

export function deriveTitleFromMarkdown(markdown: string) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[#>*_\-[\]()]/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return 'Untitled capture'
  const words = text.split(' ').slice(0, 8).join(' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
