import { afterEach, describe, expect, it } from 'vitest'
import { db } from '@/db/database'
import { seedDatabase } from '@/db/seedData'

describe('demo seed data', () => {
  afterEach(async () => {
    db.close()
    await db.delete()
  })

  it('uses stable personal-record identifiers for reproducible ordering', async () => {
    await db.delete()
    await db.open()
    await seedDatabase(true)

    const recordIds = (await db.personalRecords.toArray()).map(({ id }) => id).sort()

    expect(recordIds).toEqual([
      'seed-record-0-estimated-1rm',
      'seed-record-0-max-weight',
      'seed-record-1-estimated-1rm',
      'seed-record-1-max-weight',
      'seed-record-2-estimated-1rm',
      'seed-record-2-max-weight',
    ])
  })
})
