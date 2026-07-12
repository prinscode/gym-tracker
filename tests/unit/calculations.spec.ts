import { describe, expect, it } from 'vitest'
import {
  durationInSeconds,
  estimatedOneRepMax,
  kilogramsToPounds,
  poundsToKilograms,
  setVolume,
  timerRemainingSeconds,
  workoutVolume,
} from '@/utils/calculations'
import type { Workout, WorkoutSet } from '@/types/domain'
import { asId } from '@/utils/id'

function set(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: asId<'WorkoutSetId'>('set-1'),
    setNumber: 1,
    type: 'working',
    weightKg: 100,
    reps: 5,
    rpe: 8,
    completed: true,
    completedAt: '2026-01-01T10:00:00.000Z',
    notes: '',
    ...overrides,
  }
}

function workout(sets: WorkoutSet[]): Workout {
  return {
    id: asId<'WorkoutId'>('workout-1'),
    programId: null,
    templateId: null,
    name: 'Test',
    status: 'completed',
    startedAt: '2026-01-01T09:00:00.000Z',
    completedAt: '2026-01-01T10:00:00.000Z',
    durationSeconds: 3600,
    notes: '',
    exercises: [
      {
        id: asId<'WorkoutExerciseId'>('we-1'),
        exerciseId: asId<'ExerciseId'>('ex-1'),
        exerciseName: 'Squat',
        order: 0,
        restSeconds: 120,
        notes: '',
        skipped: false,
        sets,
      },
    ],
    totalVolumeKg: 0,
    personalRecordIds: [],
    createdAt: '2026-01-01T09:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  }
}

describe('training calculations', () => {
  it('calculates set and workout volume and excludes warmups by default', () => {
    const working = set()
    const warmup = set({
      id: asId<'WorkoutSetId'>('set-2'),
      type: 'warmup',
      weightKg: 40,
      reps: 10,
    })
    expect(setVolume(working)).toBe(500)
    expect(workoutVolume(workout([working, warmup]))).toBe(500)
    expect(workoutVolume(workout([working, warmup]), true)).toBe(900)
  })
  it('uses Epley only for one through twelve reps', () => {
    expect(estimatedOneRepMax(100, 5)).toBeCloseTo(116.667, 2)
    expect(estimatedOneRepMax(100, 0)).toBeNull()
    expect(estimatedOneRepMax(100, 13)).toBeNull()
  })
  it('converts kilograms and pounds reversibly', () => {
    expect(kilogramsToPounds(100)).toBeCloseTo(220.462, 3)
    expect(poundsToKilograms(kilogramsToPounds(87.5))).toBeCloseTo(87.5, 8)
  })
  it('calculates duration and timestamp-based timer remaining', () => {
    expect(durationInSeconds('2026-01-01T09:00:00Z', '2026-01-01T10:02:03Z')).toBe(3723)
    expect(timerRemainingSeconds('2026-01-01T10:02:00Z', Date.parse('2026-01-01T10:00:30Z'))).toBe(
      90,
    )
    expect(timerRemainingSeconds('2026-01-01T09:00:00Z', Date.parse('2026-01-01T10:00:00Z'))).toBe(
      0,
    )
  })
})
