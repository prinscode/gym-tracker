import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WorkoutSetRow from '@/features/workout/WorkoutSetRow.vue'
import type { WorkoutSet } from '@/types/domain'
import { asId } from '@/utils/id'

const set: WorkoutSet = {
  id: asId<'WorkoutSetId'>('set-1'),
  setNumber: 1,
  type: 'working',
  weightKg: 100,
  reps: 5,
  rpe: 8,
  completed: false,
  completedAt: null,
  notes: '',
}

describe('WorkoutSetRow', () => {
  it('emits entered values and completion', async () => {
    setActivePinia(createPinia())
    const wrapper = mount(WorkoutSetRow, { props: { set } })
    await wrapper.get('#weight-set-1').setValue('110')
    expect(wrapper.emitted('update')?.at(-1)).toEqual([{ weightKg: 110 }])
    await wrapper.get('.complete-button').trigger('click')
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })
})
