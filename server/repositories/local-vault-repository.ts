import fs from 'node:fs/promises'
import path from 'node:path'
import { APP_VERSION } from '../../shared/constants/vault'
import type { AppState } from '../../shared/types/capture'
import { safeJoin } from '../utils/path-safety'

const localSettingsPath = path.resolve(process.cwd(), '.thought-vault-local-settings.json')

export async function readConfiguredVaultRoot(runtimeRoot = '') {
  if (runtimeRoot) return runtimeRoot
  try {
    const raw = await fs.readFile(localSettingsPath, 'utf8')
    const parsed = JSON.parse(raw) as { selectedVaultRoot?: string }
    return parsed.selectedVaultRoot || ''
  } catch {
    return ''
  }
}

export async function writeConfiguredVaultRoot(root: string) {
  await fs.writeFile(localSettingsPath, JSON.stringify({ selectedVaultRoot: root }, null, 2), 'utf8')
}

export class LocalVaultRepository {
  constructor(public readonly root: string) {}

  resolve(...segments: string[]) {
    return safeJoin(this.root, ...segments)
  }

  async ensureDir(relativePath: string) {
    await fs.mkdir(this.resolve(relativePath), { recursive: true })
  }

  async exists(relativePath = '') {
    try {
      await fs.access(this.resolve(relativePath))
      return true
    } catch {
      return false
    }
  }

  async writeFileExclusive(relativePath: string, content: string | Uint8Array) {
    const target = this.resolve(relativePath)
    await fs.mkdir(path.dirname(target), { recursive: true })
    const handle = await fs.open(target, 'wx')
    try {
      await handle.writeFile(content)
    } finally {
      await handle.close()
    }
  }

  async readFile(relativePath: string) {
    return fs.readFile(this.resolve(relativePath), 'utf8')
  }

  async readBuffer(relativePath: string) {
    return fs.readFile(this.resolve(relativePath))
  }

  async listMarkdownFiles(relativePath: string) {
    const root = this.resolve(relativePath)
    const output: string[] = []
    async function walk(dir: string) {
      let entries: Array<import('node:fs').Dirent>
      try {
        entries = await fs.readdir(dir, { withFileTypes: true })
      } catch {
        return
      }
      for (const entry of entries) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) await walk(full)
        if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) output.push(full)
      }
    }
    await walk(root)
    return output.map(file => path.relative(this.root, file).replace(/\\/g, '/'))
  }

  async readAppState(): Promise<AppState | null> {
    try {
      return JSON.parse(await this.readFile('.thought-vault/app-state.json')) as AppState
    } catch {
      return null
    }
  }

  async writeAppState(state: AppState) {
    await fs.mkdir(this.resolve('.thought-vault'), { recursive: true })
    await fs.writeFile(this.resolve('.thought-vault/app-state.json'), JSON.stringify(state, null, 2), 'utf8')
  }

  emptyAppState(): AppState {
    return { appVersion: APP_VERSION, selectedVaultRoot: this.root, lastSuccessfulScanAt: null, captures: [], capturePathById: {}, warnings: [] }
  }
}
