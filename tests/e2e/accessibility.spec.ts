import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const routes = [
  { path: '/', heading: 'Klaar om sterker te worden?' },
  { path: '/history', heading: 'Geschiedenis' },
  { path: '/progress', heading: 'Progressie' },
  { path: '/settings', heading: 'Instellingen' },
]

async function expectNoAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
}

test.describe('accessibility smoke tests', () => {
  for (const route of routes) {
    test(`${route.path} has no automatically detectable WCAG A/AA violations`, async ({ page }) => {
      await page.goto(route.path)
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible()
      await expectNoAccessibilityViolations(page)
    })
  }

  test('active workout and confirmation dialog remain accessible', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Workout starten' }).click()
    await page.getByRole('button', { name: 'Start deze workout' }).click()
    await expect(page.getByText('Actieve workout').first()).toBeVisible()
    await expectNoAccessibilityViolations(page)

    await page.getByRole('button', { name: 'Set 1 voltooien' }).first().click()
    await page.getByRole('button', { name: 'Afronden' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expectNoAccessibilityViolations(page)
  })
})
