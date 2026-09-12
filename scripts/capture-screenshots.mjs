import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { chromium } from '@playwright/test'

const baseUrl = process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:4173'
const outputDirectory = resolve('docs/screenshots')
const screenshotTime = new Date('2026-09-12T09:00:00+02:00')
await mkdir(outputDirectory, { recursive: true })

const browser = await chromium.launch()

async function createPage(options = {}) {
  const context = await browser.newContext({
    colorScheme: 'light',
    locale: 'nl-NL',
    reducedMotion: 'reduce',
    ...options,
  })
  const page = await context.newPage()
  await page.clock.setFixedTime(screenshotTime)
  await page.addStyleTag({
    content: '*, *::before, *::after { animation: none !important; transition: none !important; }',
  })
  return { context, page }
}

async function waitForStableTypography(page) {
  await page.evaluate(() => document.fonts.ready)
}

try {
  const desktop = await createPage({ viewport: { width: 1440, height: 1000 } })
  await desktop.page.goto(baseUrl)
  await desktop.page.getByRole('heading', { name: 'Klaar om sterker te worden?' }).waitFor()
  await waitForStableTypography(desktop.page)
  await desktop.page.screenshot({
    path: resolve(outputDirectory, 'dashboard.png'),
    fullPage: true,
  })

  await desktop.page.getByRole('button', { name: 'Workout starten' }).click()
  await desktop.page.getByRole('button', { name: 'Start deze workout' }).click()
  await desktop.page.getByText('Actieve workout').first().waitFor()
  await waitForStableTypography(desktop.page)
  await desktop.page.screenshot({
    path: resolve(outputDirectory, 'active-workout.png'),
  })

  await desktop.page.goto(`${baseUrl}/progress`)
  await desktop.page
    .getByRole('img', {
      name: 'Lijngrafiek van geschatte 1RM en zwaarste gewicht door de tijd',
    })
    .waitFor()
  await waitForStableTypography(desktop.page)
  await desktop.page.screenshot({
    path: resolve(outputDirectory, 'progress.png'),
    fullPage: true,
  })
  await desktop.context.close()

  const mobile = await createPage({
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 1,
  })
  await mobile.page.goto(baseUrl)
  await mobile.page.getByRole('heading', { name: 'Klaar om sterker te worden?' }).waitFor()
  await waitForStableTypography(mobile.page)
  await mobile.page.screenshot({
    path: resolve(outputDirectory, 'mobile.png'),
  })
  await mobile.context.close()
} finally {
  await browser.close()
}
