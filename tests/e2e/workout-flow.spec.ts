import { expect, test } from '@playwright/test'

test.describe.serial('complete workout journey', () => {
  test('starts, restores and completes a workout with a new progress point', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Klaar om sterker te worden?' })).toBeVisible()
    await expect(page.getByText('Full Body Fundamentals').first()).toBeVisible()

    await page.getByRole('button', { name: 'Workout starten' }).click()
    await expect(page.getByRole('heading', { level: 1, name: /Full Body/ })).toBeVisible()
    await page.getByRole('button', { name: 'Start deze workout' }).click()
    await expect(page.getByText('Actieve workout').first()).toBeVisible()

    await page.locator('input[id^="weight-"]').first().fill('200')
    await page.locator('input[id^="reps-"]').first().fill('5')
    await page.getByRole('button', { name: 'Set 1 voltooien' }).first().click()
    await page.getByRole('button', { name: 'Set 2 voltooien' }).first().click()
    await expect(page.locator('.progress-strip strong')).toHaveText(/^2\//)
    await expect(page.getByText('Opgeslagen')).toBeVisible()

    await page.reload()
    await expect(page.getByText('Actieve workout').first()).toBeVisible()
    await expect(page.locator('.progress-strip strong')).toHaveText(/^2\//)

    await page.getByRole('button', { name: 'Afronden' }).click()
    await page.getByRole('button', { name: 'Toch afronden' }).click()
    await expect(page.getByText('Workout voltooid')).toBeVisible()
    await expect(page.getByText(/persoonlijke records?/)).toBeVisible()

    await page.goto('/history')
    await expect(page.getByRole('heading', { name: 'Geschiedenis' })).toBeVisible()
    await expect(page.locator('.history-main h2').first()).toContainText('Full Body')

    await page.goto('/progress')
    await expect(
      page.getByRole('img', {
        name: 'Lijngrafiek van geschatte 1RM en zwaarste gewicht door de tijd',
      }),
    ).toBeVisible()
  })

  test('exports, clears and imports all local data', async ({ page }) => {
    await page.goto('/settings')
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Exporteren' }).click()
    const download = await downloadPromise
    const exportPath = await download.path()
    expect(exportPath).toBeTruthy()

    await page.getByRole('button', { name: 'Alles wissen' }).click()
    await page.getByRole('button', { name: 'Alles verwijderen' }).click()
    await page.waitForLoadState('domcontentloaded')
    await page.goto('/settings')

    await page.locator('input[type="file"]').setInputFiles(exportPath!)
    await expect(page.getByRole('heading', { name: 'Hoe wil je importeren?' })).toBeVisible()
    await page.getByRole('button', { name: /Alles vervangen/ }).click()
    const importStatus = page.getByText(/Alle data is vervangen|Importeren is mislukt/)
    await expect(importStatus).toBeVisible()
    await expect(importStatus).toContainText('Alle data is vervangen')
    await page.waitForEvent('load')
    await page.goto('/')
    await expect(page.getByText('Full Body Fundamentals').first()).toBeVisible()
  })
})
