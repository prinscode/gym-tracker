<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Dumbbell } from '@lucide/vue'
import AppNavigation from './AppNavigation.vue'
import { useActiveWorkoutStore } from '@/stores/activeWorkoutStore'

const route = useRoute()
const activeWorkoutStore = useActiveWorkoutStore()
const workoutMode = computed(() => route.name === 'active-workout')
const showResume = computed(
  () => activeWorkoutStore.workout && route.name !== 'dashboard' && route.name !== 'active-workout',
)
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">Naar hoofdinhoud</a>
    <aside v-if="!workoutMode" class="sidebar" aria-label="Hoofdnavigatie">
      <RouterLink to="/" class="brand">
        <span class="brand-mark"><Dumbbell :size="22" /></span>
        <span><strong>GBA</strong><small>Workout Tracker</small></span>
      </RouterLink>
      <AppNavigation />
      <p class="sidebar-foot">Lokaal opgeslagen · Offline klaar</p>
    </aside>
    <main id="main-content" :class="['main-content', { 'main-content--workout': workoutMode }]">
      <RouterLink
        v-if="showResume && activeWorkoutStore.workout"
        :to="`/workout/${activeWorkoutStore.workout.id}`"
        class="global-resume"
      >
        <span><i /> Workout actief</span>
        <strong>{{ activeWorkoutStore.workout.name }}</strong>
        <small>Hervatten →</small>
      </RouterLink>
      <RouterView />
    </main>
    <AppNavigation v-if="!workoutMode" mobile />
  </div>
</template>

<style scoped>
.global-resume {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 1rem;
  padding: 0.65rem 0.8rem;
  color: white;
  background: #173d2a;
  border: 1px solid #3f7657;
  border-radius: 11px;
}
.global-resume span {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #b8d6c3;
  font-size: 0.72rem;
}
.global-resume i {
  width: 7px;
  height: 7px;
  background: var(--accent);
  border-radius: 50%;
}
.global-resume strong {
  overflow: hidden;
  flex: 1;
  font-size: 0.82rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.global-resume small {
  color: var(--accent);
  font-weight: 700;
}
</style>
