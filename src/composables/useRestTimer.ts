import { computed, onBeforeUnmount, ref } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { timerRemainingSeconds } from '@/utils/calculations'

export function useRestTimer() {
  const settingsStore = useSettingsStore()
  const now = ref(Date.now())
  const justFinished = ref(false)
  let previousRemaining = timerRemainingSeconds(settingsStore.settings.restTimerEndsAt)
  const timer = window.setInterval(() => {
    now.value = Date.now()
    const next = timerRemainingSeconds(settingsStore.settings.restTimerEndsAt, now.value)
    if (previousRemaining > 0 && next === 0) justFinished.value = true
    previousRemaining = next
  }, 500)
  onBeforeUnmount(() => window.clearInterval(timer))

  const remaining = computed(
    () =>
      settingsStore.settings.restTimerPausedRemaining ??
      timerRemainingSeconds(settingsStore.settings.restTimerEndsAt, now.value),
  )
  const running = computed(
    () => Boolean(settingsStore.settings.restTimerEndsAt) && remaining.value > 0,
  )
  const paused = computed(() => settingsStore.settings.restTimerPausedRemaining !== null)
  const formatted = computed(
    () => `${Math.floor(remaining.value / 60)}:${String(remaining.value % 60).padStart(2, '0')}`,
  )

  async function start(seconds: number): Promise<void> {
    justFinished.value = false
    previousRemaining = seconds
    await settingsStore.update({
      restTimerEndsAt: new Date(Date.now() + seconds * 1000).toISOString(),
      restTimerPausedRemaining: null,
    })
  }
  async function pause(): Promise<void> {
    const seconds = remaining.value
    await settingsStore.update({ restTimerEndsAt: null, restTimerPausedRemaining: seconds })
  }
  async function resume(): Promise<void> {
    const seconds = settingsStore.settings.restTimerPausedRemaining ?? 0
    await start(seconds)
  }
  async function skip(): Promise<void> {
    justFinished.value = false
    previousRemaining = 0
    await settingsStore.update({ restTimerEndsAt: null, restTimerPausedRemaining: null })
  }
  async function add(seconds: number): Promise<void> {
    await start(remaining.value + seconds)
  }

  return { remaining, running, paused, formatted, justFinished, start, pause, resume, skip, add }
}
