import { db } from '@/db/database'
import type { UserSettings } from '@/types/domain'

export const settingsRepository = {
  get: (): Promise<UserSettings | undefined> => db.settings.get('user-settings'),
  save: async (settings: UserSettings): Promise<void> => {
    await db.settings.put(settings)
  },
}
