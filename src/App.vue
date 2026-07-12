<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import BaseSpinner from '@/components/base/BaseSpinner.vue'
import BaseToast from '@/components/base/BaseToast.vue'
import BaseConfirmDialog from '@/components/base/BaseConfirmDialog.vue'
import { useTheme } from '@/composables/useTheme'
import { initializeDatabase } from '@/db/initialize'
import { useActiveWorkoutStore } from '@/stores/activeWorkoutStore'

const { applyTheme } = useTheme()
const activeWorkoutStore = useActiveWorkoutStore()
const ready = ref(false)
const startupError = ref('')

onMounted(async () => {
  applyTheme()
  try {
    await initializeDatabase()
    await activeWorkoutStore.loadActive()
    ready.value = true
  } catch (error: unknown) {
    if (import.meta.env.DEV) console.error(error)
    startupError.value =
      'De lokale database kon niet worden geopend. Controleer de browseropslag en probeer opnieuw.'
  }
})
</script>

<template>
  <AppShell v-if="ready" />
  <BaseSpinner v-else-if="!startupError" label="Je trainingsdata klaarmaken…" />
  <main v-else class="fatal-error" role="alert">
    <h1>Opstarten mislukt</h1>
    <p>{{ startupError }}</p>
  </main>
  <BaseToast />
  <BaseConfirmDialog />
</template>

<style scoped>
.fatal-error {
  max-width: 580px;
  margin: 10vh auto;
  padding: 1.5rem;
}
</style>
