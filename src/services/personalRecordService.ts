import { db } from '@/db/database'
import { createId } from '@/utils/id'
import { estimatedOneRepMax, setVolume } from '@/utils/calculations'
import type {
  PersonalRecord,
  PersonalRecordType,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from '@/types/domain'

interface Candidate {
  type: PersonalRecordType
  value: number
  set: WorkoutSet | null
  previousValue: number | null
}

function validSets(exercise: WorkoutExercise): WorkoutSet[] {
  return exercise.skipped
    ? []
    : exercise.sets.filter((set) => set.completed && set.type !== 'warmup')
}

function maximum(values: number[]): number | null {
  return values.length ? Math.max(...values) : null
}

function bestSet(
  sets: WorkoutSet[],
  score: (set: WorkoutSet) => number | null,
): { set: WorkoutSet; value: number } | null {
  return sets.reduce<{ set: WorkoutSet; value: number } | null>((best, set) => {
    const value = score(set)
    return value !== null && (!best || value > best.value) ? { set, value } : best
  }, null)
}

function buildCandidates(current: WorkoutExercise, previous: WorkoutExercise[]): Candidate[] {
  const currentSets = validSets(current)
  const historicalSets = previous.flatMap(validSets)
  if (!currentSets.length) return []
  const candidates: Candidate[] = []
  const metrics: Array<{ type: PersonalRecordType; score: (set: WorkoutSet) => number | null }> = [
    { type: 'maxWeight', score: (set) => set.weightKg },
    { type: 'estimated1RM', score: (set) => estimatedOneRepMax(set.weightKg, set.reps) },
    { type: 'setVolume', score: setVolume },
  ]
  for (const metric of metrics) {
    const currentBest = bestSet(currentSets, metric.score)
    const previousBest = maximum(
      historicalSets.map(metric.score).filter((value): value is number => value !== null),
    )
    if (currentBest && (previousBest === null || currentBest.value > previousBest)) {
      candidates.push({
        type: metric.type,
        value: currentBest.value,
        set: currentBest.set,
        previousValue: previousBest,
      })
    }
  }

  const improvedReps = currentSets
    .map((set) => {
      const previousAtWeight = maximum(
        historicalSets
          .filter((oldSet) => Math.abs(oldSet.weightKg - set.weightKg) < 0.001)
          .map((oldSet) => oldSet.reps),
      )
      return { set, previous: previousAtWeight, improvement: set.reps - (previousAtWeight ?? 0) }
    })
    .filter((item) => item.previous === null || item.improvement > 0)
    .sort((a, b) => b.improvement - a.improvement)[0]
  if (improvedReps)
    candidates.push({
      type: 'maxRepsAtWeight',
      value: improvedReps.set.reps,
      set: improvedReps.set,
      previousValue: improvedReps.previous,
    })

  const currentVolume = currentSets.reduce((total, set) => total + setVolume(set), 0)
  const previousVolumes = previous.map((exercise) =>
    validSets(exercise).reduce((total, set) => total + setVolume(set), 0),
  )
  const previousVolume = maximum(previousVolumes)
  if (previousVolume === null || currentVolume > previousVolume)
    candidates.push({
      type: 'exerciseWorkoutVolume',
      value: currentVolume,
      set: null,
      previousValue: previousVolume,
    })
  return candidates
}

export function detectPersonalRecords(
  workout: Workout,
  previousWorkouts: Workout[],
): PersonalRecord[] {
  return workout.exercises.flatMap((exercise) => {
    const previousExercises = previousWorkouts
      .filter((item) => item.id !== workout.id && item.startedAt < workout.startedAt)
      .flatMap((item) => item.exercises.filter((entry) => entry.exerciseId === exercise.exerciseId))
    return buildCandidates(exercise, previousExercises).map((candidate) => ({
      id: createId<'PersonalRecordId'>(),
      exerciseId: exercise.exerciseId,
      workoutId: workout.id,
      workoutSetId: candidate.set?.id ?? null,
      recordType: candidate.type,
      value: candidate.value,
      previousValue: candidate.previousValue,
      achievedAt: workout.completedAt ?? new Date().toISOString(),
    }))
  })
}

export async function rebuildAllPersonalRecords(): Promise<void> {
  const workouts = (await db.workouts.where('status').equals('completed').toArray()).sort((a, b) =>
    a.startedAt.localeCompare(b.startedAt),
  )
  const processed: Workout[] = []
  const allRecords: PersonalRecord[] = []
  for (const workout of workouts) {
    const records = detectPersonalRecords(workout, processed)
    workout.personalRecordIds = records.map((record) => record.id)
    allRecords.push(...records)
    processed.push(workout)
  }
  await db.transaction('rw', db.workouts, db.personalRecords, async () => {
    await db.personalRecords.clear()
    if (allRecords.length) await db.personalRecords.bulkPut(allRecords)
    await db.workouts.bulkPut(workouts)
  })
}
