import path from 'node:path'
import fs from 'node:fs/promises'
import { nanoid } from 'nanoid'
import type { AttachmentMetadata, CaptureDetail } from '../../shared/types/capture'
import { ALLOWED_ATTACHMENT_EXTENSIONS } from '../../shared/constants/vault'
import { LocalVaultRepository } from '../repositories/local-vault-repository'
import { validateAttachment } from '../schemas/capture'
import { generateCaptureId } from '../utils/capture-id'
import { buildCaptureMarkdown, parseCaptureMarkdown } from '../utils/frontmatter'
import { htmlToMarkdown, markdownPreview } from '../utils/markdown'
import { sanitizeFilename, safeJoin } from '../utils/path-safety'
import { deriveTitleFromMarkdown, slugify } from '../utils/slug'
import { filenameTimestamp, formatLocalIso } from '../utils/time'
import { getIndex, rebuildIndex } from './vault-index-service'

const mimeByExtension: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.csv': 'text/csv',
  '.json': 'application/json'
}

export function buildCaptureFilename(created: Date, title: string, id: string) {
  return `${filenameTimestamp(created)}__${slugify(title)}__${id}.md`
}

function contentTypeFor(filename: string) {
  return mimeByExtension[path.extname(filename).toLowerCase()] || 'application/octet-stream'
}

async function uniqueAttachmentName(repo: LocalVaultRepository, dir: string, filename: string) {
  const ext = path.extname(filename)
  const base = path.basename(filename, ext)
  let candidate = filename
  let counter = 1
  while (await repo.exists(`${dir}/${candidate}`)) {
    candidate = `${base}-${counter++}${ext}`
  }
  return candidate
}

export interface IncomingAttachment {
  filename: string
  type: string
  data: Buffer
}

export async function createCapture(repo: LocalVaultRepository, input: { title?: string, html: string, attachments: IncomingAttachment[], maxAttachmentBytes: number }) {
  const body = htmlToMarkdown(input.html)
  if (!body.trim()) throw new Error('Capture body is required.')
  const title = (input.title || '').trim() || deriveTitleFromMarkdown(body)
  const id = generateCaptureId()
  const created = new Date()
  const iso = formatLocalIso(created)
  const dateDir = iso.slice(0, 10)
  const attachmentDir = `00-inbox/attachments/${id}`
  const attachmentMetadata: AttachmentMetadata[] = []

  for (const attachment of input.attachments) {
    const safeName = sanitizeFilename(attachment.filename, 'attachment')
    const ext = path.extname(safeName).toLowerCase()
    if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(ext as never)) throw new Error(`Attachment ${attachment.filename} is not an allowed file type.`)
    const contentType = contentTypeFor(safeName)
    const validationError = validateAttachment(safeName, contentType, attachment.data.byteLength, input.maxAttachmentBytes)
    if (validationError) throw new Error(`${attachment.filename}: ${validationError}`)
    await repo.ensureDir(attachmentDir)
    const uniqueName = await uniqueAttachmentName(repo, attachmentDir, safeName)
    const relativePath = `${attachmentDir}/${uniqueName}`
    await repo.writeFileExclusive(relativePath, attachment.data)
    attachmentMetadata.push({ id: nanoid(10), relativePath, filename: uniqueName, contentType, sizeBytes: attachment.data.byteLength })
  }

  const filename = buildCaptureFilename(created, title, id)
  const relativePath = `00-inbox/ready/${dateDir}/${filename}`
  const markdown = buildCaptureMarkdown({ id, created: iso, title, attachments: attachmentMetadata }, body)
  await repo.writeFileExclusive(relativePath, markdown)
  await fs.appendFile(safeJoin(repo.root, '.thought-vault/capture-log.jsonl'), `${JSON.stringify({ id, created: iso, relativePath, attachmentCount: attachmentMetadata.length })}\n`, 'utf8')
  await rebuildIndex(repo)
  return { id, title, created: iso, relativePath, attachmentCount: attachmentMetadata.length }
}

export async function listCaptures(repo: LocalVaultRepository, query = '') {
  const index = await getIndex(repo)
  const q = query.trim().toLowerCase()
  if (!q) return index.captures
  return index.captures.filter(capture => `${capture.title} ${capture.preview} ${capture.id} ${capture.relativePath}`.toLowerCase().includes(q))
}

export async function getCapture(repo: LocalVaultRepository, id: string): Promise<CaptureDetail> {
  const index = await getIndex(repo)
  const relativePath = index.capturePathById[id]
  if (!relativePath) throw new Error('Capture not found.')
  const markdown = await repo.readFile(relativePath)
  const { data, body } = parseCaptureMarkdown(markdown)
  const attachments = Array.isArray(data.attachments) ? data.attachments.map((item: AttachmentMetadata, index: number) => ({ id: String(index), ...item })) : []
  return {
    id: String(data.id),
    title: String(data.title || 'Untitled capture'),
    created: String(data.created || ''),
    updated: String(data.updated || data.created || ''),
    relativePath,
    preview: markdownPreview(body),
    attachmentCount: attachments.length,
    attachments,
    markdown,
    body,
    absolutePath: repo.resolve(relativePath)
  }
}

export async function getAttachment(repo: LocalVaultRepository, captureId: string, attachmentId: string) {
  const capture = await getCapture(repo, captureId)
  const attachment = capture.attachments[Number(attachmentId)] || capture.attachments.find(item => item.id === attachmentId)
  if (!attachment) throw new Error('Attachment not found.')
  const full = safeJoin(repo.root, attachment.relativePath)
  return { attachment, full }
}
