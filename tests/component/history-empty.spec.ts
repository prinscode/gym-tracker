import { describe, expect, it } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HistoryView from '@/views/HistoryView.vue'
import { db } from '@/db/database'

describe('HistoryView empty state', () => {
  it('offers a useful call to action when history is empty', async () => {
    await db.delete()
    await db.open()
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(HistoryView, {
      global: { plugins: [pinia], stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Geen workouts gevonden')
    expect(wrapper.text()).toContain('Workout starten')
    db.close()
  })
})
