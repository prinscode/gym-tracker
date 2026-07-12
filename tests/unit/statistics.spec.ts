import { describe, expect, it } from 'vitest'
import { aggregateExerciseProgress } from '@/services/statisticsService'
import type { Workout } from '@/types/domain'
import { asId } from '@/utils/id'

const workout: Workout = {
  id: asId<'WorkoutId'>('w'),
  programId: null,
  templateId: null,
  name: 'A',
  status: 'completed',
  startedAt: '2026-01-02T10:00:00.000Z',
  completedAt: '2026-01-02T11:00:00.000Z',
  durationSeconds: 3600,
  notes: '',
  exercises: [
    {
      id: asId<'WorkoutExerciseId'>('we'),
      exerciseId: asId<'ExerciseId'>('squat'),
      exerciseName: 'Squat',
      order: 0,
      restSeconds: 120,
      notes: '',
      skipped: false,
      sets: [
        {
          id: asId<'WorkoutSetId'>('s1'),
          setNumber: 1,
          type: 'working',
          weightKg: 100,
          reps: 5,
          rpe: 8,
          completed: true,
          completedAt: '2026-01-02T10:10:00.000Z',
          notes: '',
        },
        {
          id: asId<'WorkoutSetId'>('s2'),
          setNumber: 2,
          type: 'working',
          weightKg: 90,
          reps: 8,
          rpe: 9,
          completed: true,
          completedAt: '2026-01-02T10:15:00.000Z',
          notes: '',
        },
      ],
    },
  ],
  totalVolumeKg: 1220,
  personalRecordIds: [],
  createdAt: '2026-01-02T10:00:00.000Z',
  updatedAt: '2026-01-02T11:00:00.000Z',
}

describe('statistics aggregation', () => {
  it('aggregates e1RM, volume, working sets and RPE', () => {
    const [point] = aggregateExerciseProgress([workout], asId<'ExerciseId'>('squat'))
    expect(point?.maxWeightKg).toBe(100)
    expect(point?.volumeKg).toBe(1220)
    expect(point?.workingSets).toBe(2)
    expect(point?.averageRpe).toBe(8.5)
    expect(point?.estimated1RM).toBeCloseTo(116.67, 1)
  })
  it('filters data before the requested period', () => {
    expect(
      aggregateExerciseProgress([workout], asId<'ExerciseId'>('squat'), new Date('2026-02-01')),
    ).toHaveLength(0)
  })
})
