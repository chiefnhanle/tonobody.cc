import { z } from 'zod'
import { ALLOWED_ATTACHMENT_EXTENSIONS, ALLOWED_ATTACHMENT_TYPES, DEFAULT_MAX_ATTACHMENT_BYTES } from '../../shared/constants/vault'

export const vaultPathSchema = z.object({
  path: z.string().trim().min(1).max(1024)
})

export const captureFieldsSchema = z.object({
  title: z.string().trim().max(180).optional().default(''),
  html: z.string().max(2_000_000),
  timezone: z.string().max(80).optional().default('local')
})

export function validateAttachment(filename: string, contentType: string, size: number, maxBytes = DEFAULT_MAX_ATTACHMENT_BYTES) {
  const lower = filename.toLowerCase()
  const extensionOk = ALLOWED_ATTACHMENT_EXTENSIONS.some(ext => lower.endsWith(ext))
  const typeOk = ALLOWED_ATTACHMENT_TYPES.includes(contentType as never) || contentType === 'application/octet-stream'
  if (!extensionOk) return 'Attachment type is not allowed.'
  if (!typeOk) return 'Attachment MIME type is not allowed.'
  if (size > maxBytes) return 'Attachment exceeds the configured size limit.'
  return null
}
