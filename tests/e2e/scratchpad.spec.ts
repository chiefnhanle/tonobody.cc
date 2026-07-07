import { expect, test } from '@playwright/test'

async function barFill(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const el = document.querySelector('[data-testid="momentum-bar-fill"]') as HTMLElement | null
    // Default placement is the horizontal top dock, so fill grows via width.
    return el ? Number.parseFloat(el.style.width) || 0 : -1
  })
}

test('typing fills the goal bar and /scrap wipes the page', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('.tiptap')

  // Ghost prompts greet the empty page.
  await expect(page.locator('.tv-ghost-line').first()).toBeVisible()
  expect(await barFill(page)).toBe(0)

  const editor = page.locator('.tiptap')
  await editor.click()
  for (let i = 0; i < 6; i++) {
    await page.keyboard.type(`anxious thought ${i}`)
    await page.keyboard.press('Enter')
  }

  // Adding lines fills the momentum bar; ghost prompts step aside.
  expect(await barFill(page)).toBeGreaterThan(0)
  await expect(page.locator('.tv-ghost-line')).toHaveCount(0)

  // /scrap (typed at the start of a fresh line) purges everything.
  await page.keyboard.type('/scrap')
  await page.keyboard.press('Enter')

  await expect(editor).toHaveText('')
  expect(await barFill(page)).toBe(0)
  await expect(page.locator('.tv-ghost-line').first()).toBeVisible()
})
