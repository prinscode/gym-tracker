import { ref } from 'vue'
import { defineStore } from 'pinia'
import { workoutRepository } from '@/repositories/workoutRepository'
import { personalRecordRepository } from '@/repositories/personalRecordRepository'
import type { PersonalRecord, Workout } from '@/types/domain'

export const useHistoryStore = defineStore('history', () => {
  const workouts = ref<Workout[]>([])
  const records = ref<PersonalRecord[]>([])
  const loading = ref(false)
  const error = ref('')

  async function load(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      ;[workouts.value, records.value] = await Promise.all([
        workoutRepository.getCompleted(),
        personalRecordRepository.getAll(),
      ])
      workouts.value.sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    } catch (cause: unknown) {
      if (import.meta.env.DEV) console.error(cause)
      error.value = 'De trainingsgeschiedenis kon niet worden geladen.'
    } finally {
      loading.value = false
    }
  }

  return { workouts, records, loading, error, load }
})
