import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useOnlineStatus() {
  const isOnline = ref(navigator.onLine)
  const update = () => {
    isOnline.value = navigator.onLine
  }
  onMounted(() => {
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })
  return { isOnline }
}
