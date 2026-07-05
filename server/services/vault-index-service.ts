import path from 'node:path'
import type { AppState, AttachmentMetadata, CaptureSummary } from '../../shared/types/capture'
import { APP_VERSION } from '../../shared/constants/vault'
import { LocalVaultRepository } from '../repositories/local-vault-repository'
import { parseCaptureMarkdown } from '../utils/frontmatter'
import { markdownPreview } from '../utils/markdown'

function asAttachments(value: unknown): AttachmentMetadata[] {
  if (!Array.isArray(value)) return []
  return value.map((item, index) => ({
    id: String(index),
    relativePath: String(item?.relativePath || ''),
    filename: String(item?.filename || ''),
    contentType: String(item?.contentType || 'application/octet-stream'),
    sizeBytes: Number(item?.sizeBytes || 0)
  })).filter(item => item.relativePath && item.filename)
}

export async function rebuildIndex(repo: LocalVaultRepository): Promise<AppState> {
  const files = await repo.listMarkdownFiles('00-inbox/ready')
  const captures: CaptureSummary[] = []
  const warnings: AppState['warnings'] = []
  for (const relativePath of files) {
    try {
      const markdown = await repo.readFile(relativePath)
      const { data, body } = parseCaptureMarkdown(markdown)
      const id = String(data.id || path.basename(relativePath, '.md'))
      const attachments = asAttachments(data.attachments)
      captures.push({
        id,
        title: String(data.title || 'Untitled capture'),
        created: String(data.created || ''),
        updated: String(data.updated || data.created || ''),
        relativePath,
        preview: markdownPreview(body),
        attachmentCount: attachments.length,
        attachments
      })
    } catch (error) {
      warnings.push({ relativePath, message: error instanceof Error ? error.message : 'Invalid capture front matter' })
      captures.push({ id: `malformed:${relativePath}`, title: path.basename(relativePath), created: '', updated: '', relativePath, preview: '', attachmentCount: 0, attachments: [], malformed: true, warning: 'Invalid YAML front matter' })
    }
  }
  captures.sort((a, b) => String(b.created).localeCompare(String(a.created)))
  const capturePathById = Object.fromEntries(captures.filter(capture => !capture.malformed).map(capture => [capture.id, capture.relativePath]))
  const state: AppState = { appVersion: APP_VERSION, selectedVaultRoot: repo.root, lastSuccessfulScanAt: new Date().toISOString(), captures, capturePathById, warnings }
  await repo.writeAppState(state)
  return state
}

export async function getIndex(repo: LocalVaultRepository) {
  const state = await repo.readAppState()
  if (!state || !state.capturePathById || !Array.isArray(state.captures)) return rebuildIndex(repo)
  return state
}
