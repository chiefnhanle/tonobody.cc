import { createReadStream } from 'node:fs'
import { basename } from 'node:path'
import { LocalVaultRepository, readConfiguredVaultRoot } from '../../../repositories/local-vault-repository'
import { getCapture } from '../../../services/capture-service'
import { fail } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const root = await readConfiguredVaultRoot(config.thoughtVaultRoot)
  if (!root) fail(400, 'NO_VAULT_SELECTED', 'No vault folder is selected.')
  const id = getRouterParam(event, 'id') || ''
  try {
    const repo = new LocalVaultRepository(root)
    const capture = await getCapture(repo, id)
    setHeader(event, 'content-type', 'text/markdown; charset=utf-8')
    setHeader(event, 'content-disposition', `attachment; filename="${basename(capture.relativePath)}"`)
    return sendStream(event, createReadStream(repo.resolve(capture.relativePath)))
  } catch {
    fail(404, 'CAPTURE_NOT_FOUND', 'Capture not found.')
  }
})
