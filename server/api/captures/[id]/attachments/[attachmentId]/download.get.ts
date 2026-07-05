import { createReadStream } from 'node:fs'
import { LocalVaultRepository, readConfiguredVaultRoot } from '../../../../../repositories/local-vault-repository'
import { getAttachment } from '../../../../../services/capture-service'
import { fail } from '../../../../../utils/errors'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const root = await readConfiguredVaultRoot(config.thoughtVaultRoot)
  if (!root) fail(400, 'NO_VAULT_SELECTED', 'No vault folder is selected.')
  const id = getRouterParam(event, 'id') || ''
  const attachmentId = getRouterParam(event, 'attachmentId') || ''
  try {
    const { attachment, full } = await getAttachment(new LocalVaultRepository(root), id, attachmentId)
    setHeader(event, 'content-type', attachment.contentType)
    setHeader(event, 'content-disposition', `attachment; filename="${attachment.filename}"`)
    return sendStream(event, createReadStream(full))
  } catch {
    fail(404, 'ATTACHMENT_NOT_FOUND', 'Attachment not found.')
  }
})
