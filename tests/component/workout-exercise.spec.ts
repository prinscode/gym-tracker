import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WorkoutExerciseCard from '@/features/workout/WorkoutExerciseCard.vue'
import { useActiveWorkoutStore } from '@/stores/activeWorkoutStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { Workout } from '@/types/domain'
import { asId } from '@/utils/id'

function activeWorkout(): Workout {
  return {
    id: asId<'WorkoutId'>('workout'),
    programId: null,
    templateId: null,
    name: 'Test',
    status: 'active',
    startedAt: new Date().toISOString(),
    completedAt: null,
    durationSeconds: null,
    notes: '',
    exercises: [
      {
        id: asId<'WorkoutExerciseId'>('exercise'),
        exerciseId: asId<'ExerciseId'>('squat'),
        exerciseName: 'Back Squat',
        order: 0,
        restSeconds: 120,
        notes: '',
        skipped: false,
        sets: [
          {
            id: asId<'WorkoutSetId'>('set'),
            setNumber: 1,
            type: 'working',
            weightKg: 100,
            reps: 5,
            rpe: 8,
            completed: false,
            completedAt: null,
            notes: '',
          },
        ],
      },
    ],
    totalVolumeKg: 0,
    personalRecordIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

describe('WorkoutExerciseCard', () => {
  it('adds a prefilled set', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useActiveWorkoutStore()
    const settings = useSettingsStore()
    settings.settings.confirmSetDeletion = false
    store.workout = activeWorkout()
    const exercise = store.workout.exercises[0]!
    const wrapper = mount(WorkoutExerciseCard, {
      props: { exercise, index: 0, total: 1 },
      global: { plugins: [pinia] },
    })
    await wrapper.get('button:nth-of-type(1)')
    const add = wrapper.findAll('button').find((button) => button.text().includes('Set toevoegen'))
    expect(add).toBeDefined()
    await add!.trigger('click')
    expect(exercise.sets).toHaveLength(2)
    expect(exercise.sets[1]?.weightKg).toBe(100)
  })
})
