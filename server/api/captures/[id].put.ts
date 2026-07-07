import { LocalVaultRepository, readConfiguredVaultRoot } from '../../repositories/local-vault-repository'
import { updateCapture } from '../../services/capture-service'
import { captureFieldsSchema } from '../../schemas/capture'
import { fail, requestId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  const request = requestId()
  try {
    const config = useRuntimeConfig()
    const root = await readConfiguredVaultRoot(config.thoughtVaultRoot)
    if (!root) fail(400, 'NO_VAULT_SELECTED', 'Choose and initialise a vault before editing captures.', request)
    const id = getRouterParam(event, 'id') || ''
    const form = await readMultipartFormData(event)
    if (!form) fail(400, 'INVALID_FORM', 'Expected multipart form data.', request)
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
    return { ok: true, capture: await updateCapture(new LocalVaultRepository(root), id, { ...parsed, attachments, maxAttachmentBytes: Number(config.maxAttachmentBytes) }) }
  } catch (error) {
    console.error({ requestId: request, route: '/api/captures/[id]', error: error instanceof Error ? error.message : String(error) })
    fail(400, 'CAPTURE_UPDATE_FAILED', error instanceof Error ? error.message : 'Could not update capture.', request)
  }
})
