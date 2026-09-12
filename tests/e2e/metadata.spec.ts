import { expect, test } from '@playwright/test'

test('publishes valid crawler and browser metadata', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Static metadata only needs one browser check')

  const robotsResponse = await request.get('/robots.txt')
  expect(robotsResponse.ok()).toBe(true)
  expect(robotsResponse.headers()['content-type']).toContain('text/plain')
  expect(await robotsResponse.text()).toContain('Allow: /')

  const faviconResponse = await request.get('/favicon.svg')
  expect(faviconResponse.ok()).toBe(true)
  expect(faviconResponse.headers()['content-type']).toContain('image/svg+xml')

  await page.goto('/')
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg')
})
