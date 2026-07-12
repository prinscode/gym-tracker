import type { Workout, WorkoutSet } from '@/types/domain'

export const KG_TO_LB = 2.2046226218

export function kilogramsToPounds(kilograms: number): number {
  return kilograms * KG_TO_LB
}

export function poundsToKilograms(pounds: number): number {
  return pounds / KG_TO_LB
}

export function estimatedOneRepMax(weightKg: number, reps: number): number | null {
  if (weightKg < 0 || reps < 1 || reps > 12) return null
  return weightKg * (1 + reps / 30)
}

export function setVolume(set: WorkoutSet): number {
  if (!set.completed || set.weightKg < 0 || set.reps < 0) return 0
  return set.weightKg * set.reps
}

export function workoutVolume(workout: Workout, includeWarmups = false): number {
  return workout.exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets
        .filter((set) => includeWarmups || set.type !== 'warmup')
        .reduce((sum, set) => sum + setVolume(set), 0),
    0,
  )
}

export function durationInSeconds(startedAt: string, completedAt: string): number {
  return Math.max(0, Math.round((Date.parse(completedAt) - Date.parse(startedAt)) / 1000))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours > 0 ? `${hours}u ${minutes}m` : `${minutes} min`
}

export function timerRemainingSeconds(endsAt: string | null, now = Date.now()): number {
  if (!endsAt) return 0
  return Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 1000))
}
