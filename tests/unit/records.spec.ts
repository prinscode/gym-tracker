import { describe, expect, it } from 'vitest'
import { detectPersonalRecords } from '@/services/personalRecordService'
import type { Workout } from '@/types/domain'
import { asId } from '@/utils/id'

function makeWorkout(id: string, date: string, weight: number, reps: number): Workout {
  return {
    id: asId<'WorkoutId'>(id),
    programId: null,
    templateId: null,
    name: 'Test',
    status: 'completed',
    startedAt: date,
    completedAt: date,
    durationSeconds: 3600,
    notes: '',
    exercises: [
      {
        id: asId<'WorkoutExerciseId'>(`${id}-exercise`),
        exerciseId: asId<'ExerciseId'>('squat'),
        exerciseName: 'Back Squat',
        order: 0,
        restSeconds: 120,
        notes: '',
        skipped: false,
        sets: [
          {
            id: asId<'WorkoutSetId'>(`${id}-set`),
            setNumber: 1,
            type: 'working',
            weightKg: weight,
            reps,
            rpe: 8,
            completed: true,
            completedAt: date,
            notes: '',
          },
        ],
      },
    ],
    totalVolumeKg: weight * reps,
    personalRecordIds: [],
    createdAt: date,
    updatedAt: date,
  }
}

describe('personal record detection', () => {
  it('detects improved metrics and ignores a lower performance', () => {
    const previous = makeWorkout('old', '2026-01-01T10:00:00.000Z', 100, 5)
    const improved = makeWorkout('new', '2026-02-01T10:00:00.000Z', 105, 5)
    const records = detectPersonalRecords(improved, [previous])
    expect(records.map((record) => record.recordType)).toContain('maxWeight')
    expect(records.find((record) => record.recordType === 'maxWeight')?.previousValue).toBe(100)
    const lower = makeWorkout('lower', '2026-03-01T10:00:00.000Z', 105, 4)
    expect(detectPersonalRecords(lower, [previous, improved])).toHaveLength(0)
  })
  it('does not emit duplicate ids when recalculated', () => {
    const workout = makeWorkout('new', '2026-02-01T10:00:00.000Z', 105, 5)
    const first = detectPersonalRecords(workout, [])
    const second = detectPersonalRecords(workout, [])
    expect(new Set(first.map((record) => record.id)).size).toBe(first.length)
    expect(first[0]?.id).not.toBe(second[0]?.id)
  })
})
