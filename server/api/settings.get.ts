import { APP_VERSION } from '../../shared/constants/vault'
import { readConfiguredVaultRoot } from '../repositories/local-vault-repository'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const selectedVaultRoot = await readConfiguredVaultRoot(config.thoughtVaultRoot)
  return { appVersion: APP_VERSION, selectedVaultRoot, maxAttachmentBytes: config.maxAttachmentBytes, hasVault: Boolean(selectedVaultRoot), serverStatus: 'online' }
})
