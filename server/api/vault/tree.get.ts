import { readConfiguredVaultRoot, LocalVaultRepository } from '../../repositories/local-vault-repository'
import { fail } from '../../utils/errors'

interface VaultTreeItem {
  name: string
  relativePath: string
  type: 'directory' | 'file'
  children?: VaultTreeItem[]
}

const maxDepth = 3
const hiddenNames = new Set(['.DS_Store'])

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const root = await readConfiguredVaultRoot(config.thoughtVaultRoot)
  if (!root) fail(400, 'NO_VAULT_SELECTED', 'No vault folder is selected.')
  const repo = new LocalVaultRepository(root)
  const fs = await import('node:fs/promises')
  const path = await import('node:path')

  async function list(relativePath = '', depth = 0): Promise<VaultTreeItem[]> {
    if (depth > maxDepth) return []
    const dir = repo.resolve(relativePath)
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const items: VaultTreeItem[] = []
    for (const entry of entries) {
      if (hiddenNames.has(entry.name)) continue
      const childPath = relativePath ? `${relativePath}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        items.push({
          name: entry.name,
          relativePath: childPath,
          type: 'directory',
          children: await list(childPath, depth + 1)
        })
      } else if (entry.isFile()) {
        items.push({ name: entry.name, relativePath: childPath, type: 'file' })
      }
    }
    return items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }

  return { ok: true, root: path.resolve(root), tree: await list() }
})
