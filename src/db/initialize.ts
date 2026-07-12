import { db } from './database'
import { seedDatabase } from './seedData'

export async function initializeDatabase(): Promise<void> {
  await db.open()
  await seedDatabase()
}
