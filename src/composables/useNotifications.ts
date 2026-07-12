import { useNotificationStore, type NotificationTone } from '@/stores/notificationStore'

export function useNotifications() {
  const store = useNotificationStore()
  return {
    notify: (message: string, tone?: NotificationTone) => store.show(message, tone),
    success: (message: string) => store.show(message, 'success'),
    error: (message: string) => store.show(message, 'error'),
  }
}
