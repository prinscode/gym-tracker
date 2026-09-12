<script setup lang="ts">
import { ArrowDown, ArrowUp, CirclePlus, Ellipsis, Play, SkipForward } from '@lucide/vue'
import BaseButton from '@/components/base/BaseButton.vue'
import WorkoutSetRow from './WorkoutSetRow.vue'
import PreviousPerformance from './PreviousPerformance.vue'
import { useActiveWorkoutStore } from '@/stores/activeWorkoutStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useConfirm } from '@/composables/useConfirm'
import { useNotificationStore } from '@/stores/notificationStore'
import type { WorkoutExercise, WorkoutSetId } from '@/types/domain'

const props = defineProps<{
  exercise: WorkoutExercise
  index: number
  total: number
  history?: { date: string; exercise: WorkoutExercise }
}>()
const emit = defineEmits<{ startRest: [seconds: number] }>()
const store = useActiveWorkoutStore()
const settings = useSettingsStore()
const { confirm } = useConfirm()
const notifications = useNotificationStore()

async function toggle(setId: WorkoutSetId): Promise<void> {
  const set = await store.toggleSet(props.exercise.id, setId)
  if (set?.completed && settings.settings.autoStartRestTimer)
    emit('startRest', props.exercise.restSeconds)
}
async function remove(setId: WorkoutSetId): Promise<void> {
  if (settings.settings.confirmSetDeletion) {
    const accepted = await confirm({
      title: 'Set verwijderen?',
      message: 'Je kunt deze set direct na verwijderen nog herstellen.',
      confirmLabel: 'Verwijderen',
      destructive: true,
    })
    if (!accepted) return
  }
  const removed = store.removeSet(props.exercise.id, setId)
  if (removed)
    notifications.show('Set verwijderd.', 'info', {
      actionLabel: 'Ongedaan maken',
      action: () => store.restoreSet(props.exercise.id, removed),
    })
}
</script>

<template>
  <article :class="['workout-exercise card', { skipped: exercise.skipped }]">
    <header>
      <div>
        <span class="eyebrow">Oefening {{ index + 1 }} van {{ total }}</span>
        <h2>{{ exercise.exerciseName }}</h2>
      </div>
      <div class="exercise-actions">
        <button
          type="button"
          :disabled="index === 0"
          :aria-label="`${exercise.exerciseName} omhoog`"
          @click="store.moveExercise(exercise.id, -1)"
        >
          <ArrowUp :size="17" /></button
        ><button
          type="button"
          :disabled="index === total - 1"
          :aria-label="`${exercise.exerciseName} omlaag`"
          @click="store.moveExercise(exercise.id, 1)"
        >
          <ArrowDown :size="17" /></button
        ><button
          type="button"
          :aria-label="
            exercise.skipped
              ? `${exercise.exerciseName} weer toevoegen`
              : `${exercise.exerciseName} overslaan`
          "
          @click="store.skipExercise(exercise.id)"
        >
          <SkipForward :size="17" /></button
        ><button type="button" aria-label="Meer opties"><Ellipsis :size="18" /></button>
      </div>
    </header>
    <template v-if="!exercise.skipped"
      ><PreviousPerformance :history="history" />
      <div class="sets">
        <WorkoutSetRow
          v-for="set in exercise.sets"
          :key="set.id"
          :set="set"
          @update="store.updateSet(exercise.id, set.id, $event)"
          @toggle="toggle(set.id)"
          @duplicate="store.duplicateSet(exercise.id, set.id)"
          @remove="remove(set.id)"
        />
      </div>
      <div class="below-sets">
        <BaseButton
          variant="secondary"
          size="small"
          :icon="CirclePlus"
          @click="store.addSet(exercise.id)"
          >Set toevoegen</BaseButton
        ><BaseButton
          variant="ghost"
          size="small"
          :icon="Play"
          @click="emit('startRest', exercise.restSeconds)"
          >Rust {{ exercise.restSeconds }}s</BaseButton
        >
      </div>
      <label class="exercise-notes"
        ><span>Notitie</span
        ><input
          :value="exercise.notes"
          placeholder="Cue of aandachtspunt…"
          @input="
            store.updateExerciseNotes(exercise.id, ($event.target as HTMLInputElement).value)
          " /></label
    ></template>
    <div v-else class="skipped-message">
      <p>
        Deze oefening is overgeslagen. Bestaande sets tellen niet mee zolang hij is overgeslagen.
      </p>
      <BaseButton variant="secondary" size="small" @click="store.skipExercise(exercise.id)"
        >Terugzetten</BaseButton
      >
    </div>
  </article>
</template>

<style scoped>
.workout-exercise {
  padding: 1rem;
}
.workout-exercise header {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
}
.workout-exercise h2 {
  margin: 0.15rem 0 0;
}
.eyebrow {
  color: var(--primary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.exercise-actions {
  display: flex;
}
.exercise-actions button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  color: var(--muted);
  background: var(--surface-2);
  border: 0;
  border-right: 1px solid var(--border);
}
.exercise-actions button:first-child {
  border-radius: 9px 0 0 9px;
}
.exercise-actions button:last-child {
  border-right: 0;
  border-radius: 0 9px 9px 0;
}
.sets {
  display: grid;
  gap: 0.55rem;
  margin-top: 0.8rem;
}
.below-sets {
  display: flex;
  justify-content: space-between;
  margin-top: 0.7rem;
}
.exercise-notes {
  display: grid;
  gap: 0.3rem;
  margin-top: 0.8rem;
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 700;
}
.exercise-notes input {
  min-height: 40px;
  padding: 0.55rem 0.7rem;
  color: var(--text);
  background: var(--surface-2);
  border: 1px solid transparent;
  border-radius: 9px;
}
.skipped {
  opacity: 0.7;
}
.skipped-message {
  padding: 0.8rem;
  background: var(--surface-2);
  border-radius: 10px;
}
.skipped-message p {
  margin-bottom: 0.65rem;
}
</style>
