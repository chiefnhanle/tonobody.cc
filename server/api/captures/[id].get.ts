import { LocalVaultRepository, readConfiguredVaultRoot } from '../../repositories/local-vault-repository'
import { getCapture } from '../../services/capture-service'
import { fail } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const root = await readConfiguredVaultRoot(config.thoughtVaultRoot)
  if (!root) fail(400, 'NO_VAULT_SELECTED', 'No vault folder is selected.')
  const id = getRouterParam(event, 'id') || ''
  try {
    return { capture: await getCapture(new LocalVaultRepository(root), id) }
  } catch {
    fail(404, 'CAPTURE_NOT_FOUND', 'Capture not found.')
  }
})
