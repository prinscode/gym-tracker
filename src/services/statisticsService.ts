import { estimatedOneRepMax, setVolume } from '@/utils/calculations'
import type { ExerciseId, Workout } from '@/types/domain'

export interface ExerciseDataPoint {
  workoutId: Workout['id']
  date: string
  estimated1RM: number | null
  maxWeightKg: number
  volumeKg: number
  workingSets: number
  averageRpe: number | null
}

export function aggregateExerciseProgress(
  workouts: Workout[],
  exerciseId: ExerciseId,
  from?: Date,
): ExerciseDataPoint[] {
  return workouts
    .filter(
      (workout) => workout.status === 'completed' && (!from || new Date(workout.startedAt) >= from),
    )
    .map((workout) => {
      const exercise = workout.exercises.find((item) => item.exerciseId === exerciseId)
      if (!exercise || exercise.skipped) return null
      const sets = exercise.sets.filter((set) => set.completed && set.type !== 'warmup')
      if (!sets.length) return null
      const rpes = sets.map((set) => set.rpe).filter((rpe): rpe is number => rpe !== null)
      const estimates = sets
        .map((set) => estimatedOneRepMax(set.weightKg, set.reps))
        .filter((value): value is number => value !== null)
      return {
        workoutId: workout.id,
        date: workout.startedAt,
        estimated1RM: estimates.length ? Math.max(...estimates) : null,
        maxWeightKg: Math.max(...sets.map((set) => set.weightKg)),
        volumeKg: sets.reduce((total, set) => total + setVolume(set), 0),
        workingSets: sets.length,
        averageRpe: rpes.length ? rpes.reduce((sum, value) => sum + value, 0) / rpes.length : null,
      }
    })
    .filter((point): point is ExerciseDataPoint => point !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
}
