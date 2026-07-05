import { LocalVaultRepository, readConfiguredVaultRoot } from '../repositories/local-vault-repository'
import { createCapture } from '../services/capture-service'
import { captureFieldsSchema } from '../schemas/capture'
import { fail, requestId } from '../utils/errors'

export default defineEventHandler(async (event) => {
  const id = requestId()
  try {
    const config = useRuntimeConfig()
    const root = await readConfiguredVaultRoot(config.thoughtVaultRoot)
    if (!root) fail(400, 'NO_VAULT_SELECTED', 'Choose and initialise a vault before sending captures.', id)
    const form = await readMultipartFormData(event)
    if (!form) fail(400, 'INVALID_FORM', 'Expected multipart form data.', id)
    const fields: Record<string, string> = {}
    const attachments: Array<{ filename: string, type: string, data: Buffer }> = []
    for (const part of form) {
      if (part.name === 'attachment' && part.filename) {
        attachments.push({ filename: part.filename, type: part.type || 'application/octet-stream', data: part.data })
      } else if (part.name) {
        fields[part.name] = part.data.toString('utf8')
      }
    }
    const parsed = captureFieldsSchema.parse(fields)
    const repo = new LocalVaultRepository(root)
    return { ok: true, capture: await createCapture(repo, { ...parsed, attachments, maxAttachmentBytes: Number(config.maxAttachmentBytes) }) }
  } catch (error) {
    console.error({ requestId: id, route: '/api/captures', error: error instanceof Error ? error.message : String(error) })
    fail(400, 'CAPTURE_CREATE_FAILED', error instanceof Error ? error.message : 'Could not create capture.', id)
  }
})
