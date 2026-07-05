import { LocalVaultRepository, readConfiguredVaultRoot } from '../repositories/local-vault-repository'
import { listCaptures } from '../services/capture-service'
import { fail } from '../utils/errors'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const root = await readConfiguredVaultRoot(config.thoughtVaultRoot)
  if (!root) fail(400, 'NO_VAULT_SELECTED', 'No vault folder is selected.')
  const query = getQuery(event)
  const search = typeof query.search === 'string' ? query.search : ''
  return { captures: await listCaptures(new LocalVaultRepository(root), search) }
})
