import { describe, expect, it } from 'vitest'
import {
  clearAllData,
  createExportPayload,
  importData,
  validateImport,
} from '@/services/importExportService'
import { defaultSettings, seedDatabase } from '@/db/seedData'
import { db } from '@/db/database'

describe('import validation', () => {
  it('accepts a valid version-one export', () => {
    const result = validateImport({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      exercises: [],
      programs: [],
      workoutTemplates: [],
      workouts: [],
      records: [],
      settings: { ...defaultSettings, updatedAt: new Date().toISOString() },
    })
    expect(result.success).toBe(true)
  })
  it('rejects unknown versions and malformed nested values', () => {
    const result = validateImport({
      schemaVersion: 2,
      exportedAt: 'yesterday',
      exercises: [{ name: 'Broken' }],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.length).toBeGreaterThan(0)
  })
  it('restores a complete export after all data is cleared', async () => {
    await db.delete()
    await db.open()
    await seedDatabase(true)
    const payload = await createExportPayload()
    await clearAllData()
    await importData(payload, 'replace')
    expect(await db.programs.count()).toBe(payload.programs.length)
    expect(await db.workouts.count()).toBe(payload.workouts.length)
    db.close()
  })
})
