import { computed, onBeforeUnmount, ref } from 'vue'
import type { Ref } from 'vue'

export function useWorkoutDuration(startedAt: Ref<string | undefined>) {
  const now = ref(Date.now())
  const timer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
  onBeforeUnmount(() => window.clearInterval(timer))
  const elapsedSeconds = computed(() =>
    startedAt.value ? Math.max(0, Math.floor((now.value - Date.parse(startedAt.value)) / 1000)) : 0,
  )
  const formatted = computed(() => {
    const hours = Math.floor(elapsedSeconds.value / 3600)
    const minutes = Math.floor((elapsedSeconds.value % 3600) / 60)
    const seconds = elapsedSeconds.value % 60
    return `${hours ? `${String(hours).padStart(2, '0')}:` : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })
  return { elapsedSeconds, formatted }
}
