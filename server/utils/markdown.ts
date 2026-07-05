import sanitizeHtml from 'sanitize-html'

const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'hr']

export function sanitizeEditorHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes: { a: ['href', 'title', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      b: 'strong',
      i: 'em',
      a: sanitizeHtml.simpleTransform('a', { rel: 'noreferrer noopener' })
    }
  }).trim()
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function inlineMarkdown(html: string) {
  return decodeEntities(html)
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<u>([\s\S]*?)<\/u>/gi, '<u>$1</u>')
    .replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}

export function htmlToMarkdown(html: string) {
  const clean = sanitizeEditorHtml(html)
  if (!clean) return ''
  let markdown = clean
    .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => `\n\n\`\`\`\n${decodeEntities(code).trim()}\n\`\`\`\n\n`)
    .replace(/<h1>([\s\S]*?)<\/h1>/gi, (_, text) => `\n# ${inlineMarkdown(text)}\n`)
    .replace(/<h2>([\s\S]*?)<\/h2>/gi, (_, text) => `\n## ${inlineMarkdown(text)}\n`)
    .replace(/<h3>([\s\S]*?)<\/h3>/gi, (_, text) => `\n### ${inlineMarkdown(text)}\n`)
    .replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, (_, text) => `\n${inlineMarkdown(text).split('\n').map(line => `> ${line}`).join('\n')}\n`)
    .replace(/<ul>([\s\S]*?)<\/ul>/gi, (_, items) => `\n${items.replace(/<li>([\s\S]*?)<\/li>/gi, (_li: string, text: string) => `- ${inlineMarkdown(text)}\n`)}\n`)
    .replace(/<ol>([\s\S]*?)<\/ol>/gi, (_, items) => {
      let index = 0
      return `\n${items.replace(/<li>([\s\S]*?)<\/li>/gi, (_li: string, text: string) => `${++index}. ${inlineMarkdown(text)}\n`)}\n`
    })
    .replace(/<hr\s*\/?\s*>/gi, '\n---\n')
    .replace(/<p>([\s\S]*?)<\/p>/gi, (_, text) => `\n${inlineMarkdown(text)}\n`)
  markdown = inlineMarkdown(markdown)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return markdown
}

export function markdownPreview(markdown: string, max = 220) {
  const text = markdown
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`\-[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? `${text.slice(0, max - 1).trim()}...` : text
}
