import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ActiveWorkoutRecoveryCard from '@/features/dashboard/ActiveWorkoutRecoveryCard.vue'
import type { Workout } from '@/types/domain'
import { asId } from '@/utils/id'

const workout: Workout = {
  id: asId<'WorkoutId'>('active'),
  programId: null,
  templateId: null,
  name: 'Full Body A',
  status: 'active',
  startedAt: new Date(Date.now() - 600_000).toISOString(),
  completedAt: null,
  durationSeconds: null,
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
          id: asId<'WorkoutSetId'>('set'),
          setNumber: 1,
          type: 'working',
          weightKg: 100,
          reps: 5,
          rpe: 8,
          completed: true,
          completedAt: new Date().toISOString(),
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

describe('ActiveWorkoutRecoveryCard', () => {
  it('shows recovery details and emits resume', async () => {
    const wrapper = mount(ActiveWorkoutRecoveryCard, { props: { workout } })
    expect(wrapper.text()).toContain('Full Body A')
    expect(wrapper.text()).toContain('1 sets voltooid')
    await wrapper.findAll('button')[0]!.trigger('click')
    expect(wrapper.emitted('resume')).toHaveLength(1)
  })
})
