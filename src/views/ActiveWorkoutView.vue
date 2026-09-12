<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CirclePlus, Cloud, CloudAlert, CheckCircle2, Dumbbell, Flag } from '@lucide/vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSpinner from '@/components/base/BaseSpinner.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import WorkoutExerciseCard from '@/features/workout/WorkoutExerciseCard.vue'
import RestTimerBar from '@/features/workout/RestTimerBar.vue'
import { useActiveWorkoutStore } from '@/stores/activeWorkoutStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useWorkoutDuration } from '@/composables/useWorkoutDuration'
import { useExerciseHistory } from '@/composables/useExerciseHistory'
import { asId } from '@/utils/id'
import { useConfirm } from '@/composables/useConfirm'
import { useNotifications } from '@/composables/useNotifications'

const route = useRoute()
const router = useRouter()
const store = useActiveWorkoutStore()
const exercises = useExerciseStore()
const settings = useSettingsStore()
const history = useExerciseHistory()
const restTimer = ref<InstanceType<typeof RestTimerBar>>()
const finishing = ref(false)
const { confirm } = useConfirm()
const notifications = useNotifications()
const startedAt = computed(() => store.workout?.startedAt)
const duration = useWorkoutDuration(startedAt)
const saveIcons = { idle: Cloud, saving: Cloud, saved: CheckCircle2, error: CloudAlert }
const saveLabels = {
  idle: 'Wijzigingen in wachtrij',
  saving: 'Opslaan…',
  saved: 'Opgeslagen',
  error: 'Opslaan mislukt',
}
const availableToAdd = computed(() =>
  exercises.available.filter(
    (exercise) => !store.workout?.exercises.some((item) => item.exerciseId === exercise.id),
  ),
)
const unfinishedCount = computed(
  () =>
    store.workout?.exercises
      .filter((exercise) => !exercise.skipped)
      .reduce(
        (total, exercise) => total + exercise.sets.filter((set) => !set.completed).length,
        0,
      ) ?? 0,
)

onMounted(async () => {
  await Promise.all([
    settings.load(),
    exercises.load(),
    store.loadById(asId<'WorkoutId'>(String(route.params.workoutId))),
  ])
  if (store.workout)
    await history.load(store.workout.exercises.map((exercise) => exercise.exerciseId))
  window.addEventListener('keydown', handleShortcut)
})
onBeforeUnmount(() => window.removeEventListener('keydown', handleShortcut))
async function addExercise(rawId: string, select: HTMLSelectElement): Promise<void> {
  const exercise = exercises.available.find((item) => item.id === rawId)
  if (exercise) {
    await store.addExercise(exercise, settings.settings.defaultRestSeconds)
    await history.load(store.workout?.exercises.map((item) => item.exerciseId) ?? [])
  }
  select.value = ''
}
function startRest(seconds: number): void {
  void restTimer.value?.start(seconds)
}
function handleShortcut(event: KeyboardEvent): void {
  const target = event.target
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
    return
  if (event.key.toLowerCase() === 'n') {
    const exercise = store.workout?.exercises.at(-1)
    if (exercise) store.addSet(exercise.id)
  }
  if (event.key.toLowerCase() === 'r') startRest(settings.settings.defaultRestSeconds)
}
async function finishWorkout(): Promise<void> {
  if (!store.workout || store.completedSetCount === 0) return
  if (unfinishedCount.value > 0) {
    const accepted = await confirm({
      title: 'Workout afronden?',
      message: `Er ${unfinishedCount.value === 1 ? 'staat' : 'staan'} nog ${unfinishedCount.value} onafgeronde ${unfinishedCount.value === 1 ? 'set' : 'sets'} open. Deze worden niet meegenomen.`,
      confirmLabel: 'Toch afronden',
    })
    if (!accepted) return
  }
  finishing.value = true
  try {
    const completed = await store.finish(settings.settings.includeWarmupsInVolume)
    await restTimer.value?.skip()
    await router.push({ path: `/history/${completed.id}`, query: { summary: '1' } })
  } catch (error: unknown) {
    if (import.meta.env.DEV) console.error(error)
    notifications.error('De workout kon niet worden afgerond. Je voortgang is niet verloren.')
  } finally {
    finishing.value = false
  }
}
</script>

<template>
  <BaseSpinner v-if="store.loading" label="Workout herstellen…" />
  <template v-else-if="store.workout">
    <header class="workout-header">
      <RouterLink to="/" class="exit-button" aria-label="Workout verlaten; voortgang blijft bewaard"
        ><ArrowLeft :size="19"
      /></RouterLink>
      <div class="workout-title">
        <small>Actieve workout</small><strong>{{ store.workout.name }}</strong>
      </div>
      <div class="duration">
        <small>Verstreken</small><strong>{{ duration.formatted.value }}</strong>
      </div>
      <div class="save-status" :class="store.saveState">
        <component :is="saveIcons[store.saveState]" :size="16" /><span>{{
          saveLabels[store.saveState]
        }}</span>
      </div>
      <BaseButton
        :icon="Flag"
        :disabled="store.completedSetCount === 0"
        :loading="finishing"
        @click="finishWorkout"
        >Afronden</BaseButton
      >
    </header>
    <main class="workout-body">
      <div class="progress-strip">
        <div>
          <strong>{{ store.completedSetCount }}/{{ store.totalSetCount }}</strong
          ><span>sets voltooid</span>
        </div>
        <span class="shortcut-hint" title="Sneltoetsen: N voegt een set toe, R start rust"
          >N set · R rust</span
        >
        <div class="progress-track">
          <i
            :style="{
              width: `${store.totalSetCount ? (store.completedSetCount / store.totalSetCount) * 100 : 0}%`,
            }"
          />
        </div>
      </div>
      <div class="exercise-stack">
        <WorkoutExerciseCard
          v-for="(exercise, index) in store.workout.exercises"
          :key="exercise.id"
          :exercise="exercise"
          :index="index"
          :total="store.workout.exercises.length"
          :history="history.histories.value.get(exercise.exerciseId)"
          @start-rest="startRest"
        />
      </div>
      <BaseEmptyState
        v-if="!store.workout.exercises.length"
        title="Begin met je eerste oefening"
        description="Voeg een oefening toe en je kunt direct sets registreren."
        :icon="Dumbbell"
      /><label class="add-workout-exercise"
        ><CirclePlus :size="20" /><span>Oefening toevoegen</span
        ><select
          :value="''"
          @change="
            addExercise(
              ($event.target as HTMLSelectElement).value,
              $event.target as HTMLSelectElement,
            )
          "
        >
          <option value="" disabled>Zoek of kies een oefening…</option>
          <option v-for="exercise in availableToAdd" :key="exercise.id" :value="exercise.id">
            {{ exercise.name }} · {{ exercise.primaryMuscle }}
          </option>
        </select></label
      ><label class="workout-notes"
        ><span>Workoutnotitie</span
        ><textarea
          :value="store.workout.notes"
          rows="3"
          placeholder="Hoe voelde de training? Wat wil je onthouden?"
          @input="store.updateNotes(($event.target as HTMLTextAreaElement).value)"
        />
      </label>
    </main>
    <RestTimerBar ref="restTimer" />
  </template>
  <BaseEmptyState
    v-else
    title="Geen actieve workout gevonden"
    description="Deze workout is mogelijk al afgerond of verwijderd."
    :icon="Dumbbell"
    ><RouterLink to="/workout"
      ><BaseButton>Nieuwe workout starten</BaseButton></RouterLink
    ></BaseEmptyState
  >
</template>

<style scoped>
.workout-header {
  position: sticky;
  z-index: 25;
  top: 0;
  display: grid;
  grid-template-columns: 42px 1fr auto auto;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 1rem;
  background: color-mix(in srgb, var(--surface), transparent 4%);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow);
  backdrop-filter: blur(12px);
}
.exit-button {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  color: var(--muted);
  background: var(--surface-2);
  border-radius: 10px;
}
.workout-title small,
.workout-title strong,
.duration small,
.duration strong {
  display: block;
}
.workout-title small,
.duration small {
  color: var(--muted);
  font-size: 0.67rem;
}
.workout-title strong {
  font:
    700 0.95rem 'Manrope Variable',
    sans-serif;
}
.duration {
  text-align: right;
}
.duration strong {
  font-variant-numeric: tabular-nums;
}
.save-status {
  grid-column: 2 / -1;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--muted);
  font-size: 0.7rem;
}
.save-status.error {
  color: var(--danger);
}
.shortcut-hint {
  display: none;
  color: var(--muted);
  font-size: 0.66rem;
}
.workout-header > .button {
  grid-column: 4;
  grid-row: 1;
}
.workout-body {
  display: grid;
  gap: 1rem;
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
}
.progress-strip {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 1rem;
}
.progress-strip strong,
.progress-strip span {
  display: block;
}
.progress-strip span {
  color: var(--muted);
  font-size: 0.75rem;
}
.progress-track {
  overflow: hidden;
  height: 7px;
  background: var(--border);
  border-radius: 99px;
}
.progress-track i {
  display: block;
  height: 100%;
  background: var(--primary);
  border-radius: inherit;
  transition: width 200ms ease;
}
.exercise-stack {
  display: grid;
  gap: 1rem;
}
.add-workout-exercise {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.2rem 0.5rem;
  padding: 1rem;
  color: var(--primary);
  background: var(--primary-soft);
  border: 1px dashed var(--primary);
  border-radius: 14px;
  font-weight: 800;
}
.add-workout-exercise select {
  grid-column: 1 / -1;
  min-height: 46px;
  margin-top: 0.5rem;
  padding: 0.6rem;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.workout-notes {
  display: grid;
  gap: 0.4rem;
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 700;
}
@media (min-width: 700px) {
  .workout-header {
    grid-template-columns: 42px 1fr auto auto auto;
  }
  .save-status {
    grid-column: auto;
    grid-row: 1;
  }
  .workout-header > .button {
    grid-column: auto;
  }
  .shortcut-hint {
    display: inline;
  }
}
</style>
