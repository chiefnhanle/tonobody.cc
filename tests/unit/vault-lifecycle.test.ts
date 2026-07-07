import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LocalVaultRepository } from '../../server/repositories/local-vault-repository'
import { createCapture, updateCapture } from '../../server/services/capture-service'
import { seedExampleCaptures } from '../../server/services/example-captures-service'
import { initialiseVault } from '../../server/services/vault-initialisation-service'
import { rebuildIndex } from '../../server/services/vault-index-service'

let tmp = ''

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'thought-vault-test-'))
})

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true })
})

describe('vault filesystem lifecycle', () => {
  it('initialises the required vault files and folders', async () => {
    await initialiseVault(tmp)
    await expect(fs.access(path.join(tmp, '00-inbox/ready'))).resolves.toBeUndefined()
    await expect(fs.access(path.join(tmp, 'AGENTS.md'))).resolves.toBeUndefined()
    await expect(fs.access(path.join(tmp, '.thought-vault/app-state.json'))).resolves.toBeUndefined()
  })

  it('creates immutable raw captures without overwriting', async () => {
    await initialiseVault(tmp)
    const repo = new LocalVaultRepository(tmp)
    const first = await createCapture(repo, { title: 'Vector note', html: '<p>body text</p>', attachments: [], maxAttachmentBytes: 1000 })
    const second = await createCapture(repo, { title: 'Vector note', html: '<p>body text</p>', attachments: [], maxAttachmentBytes: 1000 })
    expect(first.relativePath).not.toBe(second.relativePath)
    await expect(fs.readFile(path.join(tmp, first.relativePath), 'utf8')).resolves.toContain('status: ready-for-codex')
  })

  it('updates an existing capture in place when reopened as a draft', async () => {
    await initialiseVault(tmp)
    const repo = new LocalVaultRepository(tmp)
    const capture = await createCapture(repo, { title: 'Original note', html: '<p>old body</p>', attachments: [], maxAttachmentBytes: 1000 })
    const updated = await updateCapture(repo, capture.id, { title: 'Edited note', html: '<p>new body</p>', attachments: [], maxAttachmentBytes: 1000 })
    expect(updated.id).toBe(capture.id)
    expect(updated.relativePath).toBe(capture.relativePath)
    const markdown = await fs.readFile(path.join(tmp, capture.relativePath), 'utf8')
    expect(markdown).toContain('title: "Edited note"')
    expect(markdown).toContain('new body')
    expect(markdown).not.toContain('old body')
  })

  it('seeds example inbox maps idempotently', async () => {
    await initialiseVault(tmp)
    const repo = new LocalVaultRepository(tmp)
    const first = await seedExampleCaptures(repo, 1000)
    const second = await seedExampleCaptures(repo, 1000)
    expect(first.created.length).toBeGreaterThan(2)
    expect(second.created).toHaveLength(0)
    expect(second.skipped).toContain('Example Map: Constraint Design Loop')
  })

  it('copies attachments into the capture attachment folder', async () => {
    await initialiseVault(tmp)
    const repo = new LocalVaultRepository(tmp)
    const capture = await createCapture(repo, { title: 'Attachment note', html: '<p>body text</p>', attachments: [{ filename: '../paper.pdf', type: 'application/pdf', data: Buffer.from('pdf') }], maxAttachmentBytes: 1000 })
    const markdown = await fs.readFile(path.join(tmp, capture.relativePath), 'utf8')
    expect(markdown).toContain('00-inbox/attachments/')
    expect(markdown).not.toContain('..')
  })

  it('reindexes from Markdown and records malformed front matter warnings', async () => {
    await initialiseVault(tmp)
    const repo = new LocalVaultRepository(tmp)
    await createCapture(repo, { title: 'Indexed note', html: '<p>body text</p>', attachments: [], maxAttachmentBytes: 1000 })
    await fs.mkdir(path.join(tmp, '00-inbox/ready/bad'), { recursive: true })
    await fs.writeFile(path.join(tmp, '00-inbox/ready/bad/bad.md'), '---\n: bad yaml\n---\nBody')
    const state = await rebuildIndex(repo)
    expect(state.captures.some(capture => capture.title === 'Indexed note')).toBe(true)
    expect(state.warnings.length).toBeGreaterThan(0)
  })

  it('surfaces local filesystem errors', async () => {
    await initialiseVault(tmp)
    const repo = new LocalVaultRepository(tmp)
    await expect(repo.writeFileExclusive('../escape.md', 'nope')).rejects.toThrow()
  })
})
