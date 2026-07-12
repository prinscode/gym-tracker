import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NotificationTone = 'success' | 'error' | 'info'
export interface Notification {
  id: string
  message: string
  tone: NotificationTone
  actionLabel?: string
  action?: () => void
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])

  function show(
    message: string,
    tone: NotificationTone = 'info',
    options?: Pick<Notification, 'actionLabel' | 'action'>,
  ): string {
    const id = crypto.randomUUID()
    notifications.value.push({ id, message, tone, ...options })
    window.setTimeout(() => dismiss(id), 5000)
    return id
  }

  function dismiss(id: string): void {
    notifications.value = notifications.value.filter((item) => item.id !== id)
  }

  return { notifications, show, dismiss }
})
