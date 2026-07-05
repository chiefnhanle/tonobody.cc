import { readConfiguredVaultRoot, LocalVaultRepository } from '../../repositories/local-vault-repository'
import { rebuildIndex } from '../../services/vault-index-service'
import { fail } from '../../utils/errors'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const root = await readConfiguredVaultRoot(config.thoughtVaultRoot)
  if (!root) fail(400, 'NO_VAULT_SELECTED', 'No vault folder is selected.')
  const repo = new LocalVaultRepository(root)
  const state = await rebuildIndex(repo)
  return { ok: true, root, lastSuccessfulScanAt: state.lastSuccessfulScanAt, captureCount: state.captures.length, warnings: state.warnings }
})
