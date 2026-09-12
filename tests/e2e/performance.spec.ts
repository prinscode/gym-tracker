import { expect, test } from '@playwright/test'

type PortfolioMetrics = {
  cls: number
  lcp: number
}

declare global {
  interface Window {
    __portfolioMetrics: PortfolioMetrics
  }
}

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Performance budgets run once on desktop Chromium',
  )

  await page.addInitScript(() => {
    window.__portfolioMetrics = { cls: 0, lcp: 0 }

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number }
        if (!layoutShift.hadRecentInput) window.__portfolioMetrics.cls += layoutShift.value
      }
    }).observe({ type: 'layout-shift', buffered: true })

    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries.at(-1)
      if (lastEntry) window.__portfolioMetrics.lcp = lastEntry.startTime
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  })
})

test('dashboard stays within experience and asset budgets', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Klaar om sterker te worden?' }),
  ).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(250)

  const metrics = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const scripts = resources.filter((resource) => resource.initiatorType === 'script')
    const styles = resources.filter(
      (resource) => resource.initiatorType === 'css' || resource.name.endsWith('.css'),
    )

    return {
      ...window.__portfolioMetrics,
      resourceCount: resources.length,
      scriptTransferBytes: scripts.reduce((total, resource) => total + resource.transferSize, 0),
      styleTransferBytes: styles.reduce((total, resource) => total + resource.transferSize, 0),
    }
  })

  expect(metrics.cls).toBeLessThanOrEqual(0.1)
  expect(metrics.lcp).toBeGreaterThan(0)
  expect(metrics.lcp).toBeLessThan(2_500)
  expect(metrics.resourceCount).toBeLessThanOrEqual(40)
  expect(metrics.scriptTransferBytes).toBeLessThanOrEqual(500_000)
  expect(metrics.styleTransferBytes).toBeLessThanOrEqual(100_000)
})
