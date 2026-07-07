import { LocalVaultRepository, readConfiguredVaultRoot } from '../../repositories/local-vault-repository'
import { seedExampleCaptures } from '../../services/example-captures-service'
import { fail, requestId } from '../../utils/errors'

export default defineEventHandler(async () => {
  const id = requestId()
  try {
    const config = useRuntimeConfig()
    const root = await readConfiguredVaultRoot(config.thoughtVaultRoot)
    if (!root) fail(400, 'NO_VAULT_SELECTED', 'Choose and initialise a vault before seeding examples.', id)
    return { ok: true, ...(await seedExampleCaptures(new LocalVaultRepository(root), Number(config.maxAttachmentBytes))) }
  } catch (error) {
    console.error({ requestId: id, route: '/api/examples/seed', error: error instanceof Error ? error.message : String(error) })
    fail(400, 'EXAMPLE_SEED_FAILED', error instanceof Error ? error.message : 'Could not seed example captures.', id)
  }
})
