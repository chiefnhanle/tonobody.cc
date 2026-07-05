import { initialiseVault } from '../../services/vault-initialisation-service'
import { vaultPathSchema } from '../../schemas/capture'
import { fail, requestId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  const id = requestId()
  try {
    const body = await readBody(event)
    const parsed = vaultPathSchema.parse(body)
    return { ok: true, ...(await initialiseVault(parsed.path)) }
  } catch (error) {
    console.error({ requestId: id, route: '/api/vault/initialise', error: error instanceof Error ? error.message : String(error) })
    fail(400, 'VAULT_INITIALISE_FAILED', error instanceof Error ? error.message : 'Could not initialise vault.', id)
  }
})
