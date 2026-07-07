import { expect, test } from '@playwright/test'

async function barWidth(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const el = document.querySelector('[data-testid="momentum-bar-fill"]') as HTMLElement | null
    return el ? Number.parseFloat(el.style.width) || 0 : -1
  })
}

test('typing fills the goal bar and /send wipes the page', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('.tiptap')

  // Ghost prompts greet the empty page.
  await expect(page.locator('.tv-ghost-line').first()).toBeVisible()
  expect(await barWidth(page)).toBe(0)

  const editor = page.locator('.tiptap')
  await editor.click()
  for (let i = 0; i < 6; i++) {
    await page.keyboard.type(`anxious thought ${i}`)
    await page.keyboard.press('Enter')
  }

  // Adding lines fills the momentum bar; ghost prompts step aside.
  expect(await barWidth(page)).toBeGreaterThan(0)
  await expect(page.locator('.tv-ghost-line')).toHaveCount(0)

  // /send (typed at the start of a fresh line) purges everything.
  await page.keyboard.type('/send')
  await page.keyboard.press('Enter')

  await expect(editor).toHaveText('')
  expect(await barWidth(page)).toBe(0)
  await expect(page.locator('.tv-ghost-line').first()).toBeVisible()
})
