import { spawn } from 'node:child_process'
import { LocalVaultRepository, readConfiguredVaultRoot } from '../repositories/local-vault-repository'
import { safeJoin } from '../utils/path-safety'
import { fail } from '../utils/errors'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const root = await readConfiguredVaultRoot(config.thoughtVaultRoot)
  if (!root) fail(400, 'NO_VAULT_SELECTED', 'No vault folder is selected.')
  const body = await readBody<{ relativePath?: string }>(event)
  const target = body?.relativePath ? safeJoin(root, body.relativePath) : root
  const repo = new LocalVaultRepository(root)
  await repo.exists(body?.relativePath || '')
  if (process.platform === 'win32') spawn('explorer.exe', ['/select,', target], { detached: true, stdio: 'ignore' }).unref()
  else if (process.platform === 'darwin') spawn('open', [target], { detached: true, stdio: 'ignore' }).unref()
  else spawn('xdg-open', [target], { detached: true, stdio: 'ignore' }).unref()
  return { ok: true }
})
