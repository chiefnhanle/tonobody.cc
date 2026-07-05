import matter from 'gray-matter'
import type { AttachmentMetadata } from '../../shared/types/capture'
import { APP_SOURCE, CAPTURE_SCHEMA_VERSION } from '../../shared/constants/vault'

function yamlScalar(value: string) {
  return JSON.stringify(value)
}

export interface CaptureFrontmatterInput {
  id: string
  created: string
  title: string
  attachments: AttachmentMetadata[]
}

export function buildCaptureMarkdown(input: CaptureFrontmatterInput, body: string) {
  const attachmentYaml = input.attachments.length
    ? input.attachments.map(item => [
        `  - relativePath: ${yamlScalar(item.relativePath)}`,
        `    filename: ${yamlScalar(item.filename)}`,
        `    contentType: ${yamlScalar(item.contentType)}`,
        `    sizeBytes: ${item.sizeBytes}`
      ].join('\n')).join('\n')
    : '  []'
  return `---\nid: ${input.id}\ntype: raw-capture\nstatus: ready-for-codex\ncreated: ${input.created}\nupdated: ${input.created}\ntitle: ${yamlScalar(input.title)}\ntags: []\nprojects: []\nattachments:\n${attachmentYaml}\nsource: ${APP_SOURCE}\nschemaVersion: ${CAPTURE_SCHEMA_VERSION}\n---\n\n# ${input.title}\n\n${body.trim()}\n`
}

export function parseCaptureMarkdown(markdown: string) {
  const parsed = matter(markdown)
  return { data: parsed.data, body: parsed.content.trim() }
}
