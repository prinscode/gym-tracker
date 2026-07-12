import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import BaseConfirmDialog from '@/components/base/BaseConfirmDialog.vue'
import { useConfirmStore } from '@/stores/confirmStore'

describe('BaseConfirmDialog', () => {
  it('resolves a confirmed destructive action', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useConfirmStore()
    const wrapper = mount(BaseConfirmDialog, {
      global: { plugins: [pinia] },
      attachTo: document.body,
    })
    const result = store.ask({
      title: 'Set verwijderen?',
      message: 'Dit kan ongedaan worden gemaakt.',
      confirmLabel: 'Verwijderen',
      destructive: true,
    })
    await nextTick()
    expect(wrapper.get('dialog').attributes('open')).toBeDefined()
    const confirm = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Verwijderen'))
    await confirm!.trigger('click')
    await expect(result).resolves.toBe(true)
  })
})
