import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ExerciseForm from '@/features/exercises/ExerciseForm.vue'

describe('ExerciseForm', () => {
  it('shows inline validation errors', async () => {
    const wrapper = mount(ExerciseForm)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('Vul een naam in.')
    expect(wrapper.text()).toContain('Vul het materiaal in.')
    expect(wrapper.emitted('save')).toBeUndefined()
  })
})
