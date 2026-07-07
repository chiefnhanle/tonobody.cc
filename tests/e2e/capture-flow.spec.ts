import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { expect, test } from '@playwright/test'

test('capture appears in inbox and opens read-only viewer', async ({ page, request }) => {
  const vault = await fs.mkdtemp(path.join(os.tmpdir(), 'thought-vault-e2e-'))
  await request.post('/api/vault/initialise', { data: { path: vault } })

  await page.goto('/')
  await expect(page.locator('.tiptap')).toBeVisible()
  await page.locator('.tiptap').click()
  await page.keyboard.type('/title')
  await page.keyboard.press('Enter')
  await page.keyboard.type('E2E candidate vector')
  await page.keyboard.press('Enter')
  await page.keyboard.type('This is an end to end raw thought body.')
  await page.keyboard.press('Enter')
  await page.keyboard.type('/send')
  await page.keyboard.press('Enter')
  await expect(page.getByText(/saved cap_/)).toBeVisible()

  await page.locator('.tiptap').click()
  await page.keyboard.type('/inbox')
  await page.keyboard.press('Enter')
  await expect(page.getByText('E2E candidate vector')).toBeVisible()
  await page.getByText('E2E candidate vector').click()
  await expect(page.getByText('This is an end to end raw thought body.')).toBeVisible()

  await fs.rm(vault, { recursive: true, force: true })
})
