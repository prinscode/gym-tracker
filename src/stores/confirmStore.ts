import { defineStore } from 'pinia'
import { ref } from 'vue'

interface ConfirmRequest {
  title: string
  message: string
  confirmLabel: string
  destructive: boolean
  resolve: (value: boolean) => void
}

export const useConfirmStore = defineStore('confirm', () => {
  const request = ref<ConfirmRequest | null>(null)

  function ask(options: Omit<ConfirmRequest, 'resolve'>): Promise<boolean> {
    return new Promise((resolve) => {
      request.value = { ...options, resolve }
    })
  }

  function settle(value: boolean): void {
    request.value?.resolve(value)
    request.value = null
  }

  return { request, ask, settle }
})
