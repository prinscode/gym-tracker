import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { exerciseRepository } from '@/repositories/exerciseRepository'
import { createId } from '@/utils/id'
import type { Exercise, ExerciseId } from '@/types/domain'

export type ExerciseDraft = Omit<Exercise, 'id' | 'custom' | 'archived' | 'createdAt' | 'updatedAt'>

export const useExerciseStore = defineStore('exercises', () => {
  const exercises = ref<Exercise[]>([])
  const loading = ref(false)
  const error = ref('')
  const available = computed(() => exercises.value.filter((exercise) => !exercise.archived))

  async function load(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      exercises.value = await exerciseRepository.getAll()
    } catch (cause: unknown) {
      if (import.meta.env.DEV) console.error(cause)
      error.value = 'De oefeningen konden niet worden geladen.'
    } finally {
      loading.value = false
    }
  }

  async function save(draft: ExerciseDraft, id?: ExerciseId): Promise<Exercise> {
    const existing = id ? exercises.value.find((exercise) => exercise.id === id) : undefined
    const now = new Date().toISOString()
    const exercise: Exercise = {
      ...draft,
      id: id ?? createId<'ExerciseId'>(),
      custom: existing?.custom ?? true,
      archived: existing?.archived ?? false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    await exerciseRepository.save(exercise)
    await load()
    return exercise
  }

  async function archive(id: ExerciseId): Promise<void> {
    const used = await exerciseRepository.isUsed(id)
    if (used) await exerciseRepository.archive(id)
    else await exerciseRepository.remove(id)
    await load()
  }

  return { exercises, available, loading, error, load, save, archive }
})
