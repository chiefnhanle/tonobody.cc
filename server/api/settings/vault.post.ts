import { vaultPathSchema } from '../../schemas/capture'
import { writeConfiguredVaultRoot } from '../../repositories/local-vault-repository'
import { fail, requestId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  const id = requestId()
  try {
    const body = await readBody(event)
    const parsed = vaultPathSchema.parse(body)
    await writeConfiguredVaultRoot(parsed.path)
    return { ok: true, selectedVaultRoot: parsed.path }
  } catch (error) {
    console.error({ requestId: id, route: '/api/settings/vault', error: error instanceof Error ? error.message : String(error) })
    fail(400, 'INVALID_VAULT_PATH', error instanceof Error ? error.message : 'Invalid vault path.', id)
  }
})
