import { ref } from 'vue'
import { defineStore } from 'pinia'
import { settingsRepository } from '@/repositories/settingsRepository'
import { defaultSettings } from '@/db/seedData'
import { useTheme } from '@/composables/useTheme'
import type { UserSettings } from '@/types/domain'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>({ ...defaultSettings })
  const loading = ref(false)

  async function load(): Promise<void> {
    loading.value = true
    settings.value = (await settingsRepository.get()) ?? { ...defaultSettings }
    useTheme().setTheme(settings.value.theme)
    loading.value = false
  }

  async function update(patch: Partial<UserSettings>): Promise<void> {
    settings.value = { ...settings.value, ...patch, updatedAt: new Date().toISOString() }
    await settingsRepository.save(settings.value)
    if (patch.theme) useTheme().setTheme(patch.theme)
  }

  return { settings, loading, load, update }
})
