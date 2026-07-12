import { ref } from 'vue'
import { workoutRepository } from '@/repositories/workoutRepository'
import type { ExerciseId, WorkoutExercise } from '@/types/domain'

export function useExerciseHistory() {
  const histories = ref(new Map<ExerciseId, { date: string; exercise: WorkoutExercise }>())

  async function load(exerciseIds: ExerciseId[]): Promise<void> {
    const entries = await Promise.all(
      exerciseIds.map(async (exerciseId) => {
        const workout = await workoutRepository.getLastForExercise(exerciseId)
        const exercise = workout?.exercises.find((item) => item.exerciseId === exerciseId)
        return workout && exercise
          ? ([exerciseId, { date: workout.startedAt, exercise }] as const)
          : null
      }),
    )
    histories.value = new Map(
      entries.filter((entry): entry is NonNullable<typeof entry> => entry !== null),
    )
  }

  return { histories, load }
}
