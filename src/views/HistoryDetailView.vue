<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { ArrowLeft, Check, Clock3, Dumbbell, Pencil, Save, Trophy, X } from '@lucide/vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseSpinner from '@/components/base/BaseSpinner.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import { workoutRepository } from '@/repositories/workoutRepository'
import { personalRecordRepository } from '@/repositories/personalRecordRepository'
import { rebuildAllPersonalRecords } from '@/services/personalRecordService'
import { useSettingsStore } from '@/stores/settingsStore'
import { useWeightUnit } from '@/composables/useWeightUnit'
import { useNotifications } from '@/composables/useNotifications'
import { asId } from '@/utils/id'
import { formatDuration, workoutVolume } from '@/utils/calculations'
import { formatRecordValue, recordLabels } from '@/utils/formatters'
import { cloneRaw } from '@/utils/clone'
import type { PersonalRecord, Workout, WorkoutSet } from '@/types/domain'

const route = useRoute()
const settings = useSettingsStore()
const weight = useWeightUnit()
const notifications = useNotifications()
const workout = ref<Workout>()
const editing = ref<Workout>()
const records = ref<PersonalRecord[]>([])
const loading = ref(true)
const editMode = ref(false)
const saving = ref(false)
const completedSets = computed(
  () =>
    workout.value?.exercises.reduce(
      (total, exercise) => total + exercise.sets.filter((set) => set.completed).length,
      0,
    ) ?? 0,
)
const comparison = ref<number | null>(null)

async function load(): Promise<void> {
  loading.value = true
  const id = asId<'WorkoutId'>(String(route.params.workoutId))
  const [found, allRecords, allWorkouts] = await Promise.all([
    workoutRepository.getById(id),
    personalRecordRepository.getAll(),
    workoutRepository.getCompleted(),
    settings.load(),
  ])
  workout.value = found
  records.value = allRecords.filter((record) => record.workoutId === id)
  const previous = allWorkouts
    .filter(
      (item) =>
        item.id !== id &&
        item.templateId === found?.templateId &&
        item.startedAt < (found?.startedAt ?? ''),
    )
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
  comparison.value = found && previous ? found.totalVolumeKg - previous.totalVolumeKg : null
  loading.value = false
}
onMounted(load)
function beginEdit(): void {
  if (!workout.value) return
  editing.value = cloneRaw(workout.value)
  editMode.value = true
}
function displayed(set: WorkoutSet): number {
  return Number(weight.fromKilograms(set.weightKg).toFixed(2))
}
function setWeight(set: WorkoutSet, raw: string): void {
  const value = Number(raw)
  if (Number.isFinite(value) && value >= 0) set.weightKg = weight.toKilograms(value)
}
async function saveHistory(): Promise<void> {
  if (!editing.value) return
  saving.value = true
  try {
    editing.value.totalVolumeKg = workoutVolume(
      editing.value,
      settings.settings.includeWarmupsInVolume,
    )
    editing.value.updatedAt = new Date().toISOString()
    await workoutRepository.save(editing.value)
    await rebuildAllPersonalRecords()
    editMode.value = false
    notifications.success('Historische workout bijgewerkt en statistieken herberekend.')
    await load()
  } catch (error: unknown) {
    if (import.meta.env.DEV) console.error(error)
    notifications.error('De wijzigingen konden niet worden opgeslagen.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseSpinner v-if="loading" label="Workoutdetails laden…" />
  <template v-else-if="workout">
    <RouterLink to="/history" class="back-link"><ArrowLeft :size="17" /> Geschiedenis</RouterLink>
    <section v-if="route.query.summary === '1'" class="summary-hero">
      <span class="summary-check"><Check :size="26" /></span>
      <div>
        <span class="eyebrow">Workout voltooid</span>
        <h1>Sterk werk — {{ workout.name }} zit erop.</h1>
        <p>Alles is lokaal opgeslagen en je progressiestatistieken zijn bijgewerkt.</p>
      </div>
    </section>
    <div class="page-header">
      <div v-if="route.query.summary !== '1'">
        <span class="eyebrow">{{
          format(new Date(workout.startedAt), 'EEEE d MMMM yyyy', { locale: nl })
        }}</span>
        <h1>{{ workout.name }}</h1>
        <p>Gestart om {{ format(new Date(workout.startedAt), 'HH:mm') }}</p>
      </div>
      <div class="page-actions">
        <template v-if="editMode"
          ><BaseButton variant="ghost" :icon="X" @click="editMode = false">Annuleren</BaseButton
          ><BaseButton :icon="Save" :loading="saving" @click="saveHistory"
            >Wijzigingen opslaan</BaseButton
          ></template
        ><BaseButton v-else variant="secondary" :icon="Pencil" @click="beginEdit"
          >Historie bewerken</BaseButton
        >
      </div>
    </div>
    <p v-if="editMode" class="history-warning" role="status">
      <strong>Je bewerkt historische data.</strong> Volume, records en progressiegrafieken worden na
      opslaan volledig herberekend.
    </p>
    <div class="summary-stats">
      <BaseCard
        ><Clock3 :size="20" /><strong>{{ formatDuration(workout.durationSeconds ?? 0) }}</strong
        ><span>totale duur</span></BaseCard
      ><BaseCard
        ><Dumbbell :size="20" /><strong>{{ workout.exercises.length }}</strong
        ><span>oefeningen</span></BaseCard
      ><BaseCard
        ><Check :size="20" /><strong>{{ completedSets }}</strong
        ><span>voltooide sets</span></BaseCard
      ><BaseCard
        ><Dumbbell :size="20" /><strong>{{ weight.formatWeight(workout.totalVolumeKg, 0) }}</strong
        ><span>trainingsvolume</span></BaseCard
      >
    </div>
    <BaseCard v-if="records.length" class="records-card"
      ><div class="records-heading">
        <span class="trophy"><Trophy :size="22" /></span>
        <div>
          <h2>
            {{ records.length }} persoonlijke {{ records.length === 1 ? 'record' : 'records' }}
          </h2>
          <p>Nieuwe beste prestaties in deze workout.</p>
        </div>
      </div>
      <div class="records-grid">
        <div v-for="record in records" :key="record.id">
          <BaseBadge tone="accent">PR</BaseBadge
          ><strong>{{
            workout.exercises.find((item) => item.exerciseId === record.exerciseId)?.exerciseName
          }}</strong
          ><span>{{ recordLabels[record.recordType] }}</span
          ><b>{{ formatRecordValue(record.recordType, record.value) }}</b
          ><small v-if="record.previousValue !== null"
            >vorige: {{ formatRecordValue(record.recordType, record.previousValue) }}</small
          >
        </div>
      </div></BaseCard
    >
    <BaseCard v-if="comparison !== null" class="comparison"
      ><strong>{{ comparison >= 0 ? '+' : '' }}{{ weight.formatWeight(comparison, 0) }}</strong>
      <p>volume vergeleken met de vorige {{ workout.name }}</p></BaseCard
    >
    <div class="detail-exercises">
      <BaseCard
        v-for="(exercise, exerciseIndex) in editMode ? editing?.exercises : workout.exercises"
        :key="exercise.id"
        ><div class="exercise-heading">
          <span>{{ exerciseIndex + 1 }}</span>
          <div>
            <h2>{{ exercise.exerciseName }}</h2>
            <p v-if="exercise.notes">{{ exercise.notes }}</p>
          </div>
          <BaseBadge v-if="exercise.skipped" tone="warning">Overgeslagen</BaseBadge>
        </div>
        <div class="detail-set header-row">
          <span>Set</span><span>Type</span><span>Gewicht</span><span>Reps</span><span>RPE</span>
        </div>
        <div
          v-for="set in exercise.sets"
          :key="set.id"
          :class="['detail-set', { incomplete: !set.completed }]"
        >
          <strong>{{ set.setNumber }}</strong
          ><template v-if="editMode"
            ><select v-model="set.type" :aria-label="`Type set ${set.setNumber}`">
              <option value="warmup">Warm-up</option>
              <option value="working">Werkset</option>
              <option value="drop">Dropset</option>
              <option value="failure">Falen</option></select
            ><input
              :value="displayed(set)"
              type="number"
              min="0"
              step=".5"
              :aria-label="`Gewicht set ${set.setNumber}`"
              @input="setWeight(set, ($event.target as HTMLInputElement).value)" /><input
              v-model.number="set.reps"
              type="number"
              min="0"
              step="1"
              :aria-label="`Reps set ${set.setNumber}`" /><input
              v-model.number="set.rpe"
              type="number"
              min="1"
              max="10"
              step=".5"
              :aria-label="`RPE set ${set.setNumber}`" /></template
          ><template v-else
            ><span>{{ set.type }}</span
            ><strong>{{ weight.formatWeight(set.weightKg) }}</strong
            ><strong>{{ set.reps }}</strong
            ><span>{{ set.rpe ?? '—' }}</span></template
          >
        </div></BaseCard
      >
    </div>
    <BaseCard v-if="workout.notes" class="workout-note"
      ><h2>Workoutnotitie</h2>
      <p>{{ workout.notes }}</p></BaseCard
    >
  </template>
  <BaseEmptyState
    v-else
    title="Workout niet gevonden"
    description="Deze workout bestaat niet meer in de lokale geschiedenis."
  />
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 1rem;
  color: var(--muted);
  font-weight: 700;
}
.summary-hero {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1.2rem;
  color: white;
  background: linear-gradient(135deg, #154b30, #1b6d43);
  border-radius: 20px;
}
.summary-hero h1 {
  margin: 0.25rem 0;
}
.summary-hero p {
  margin: 0;
  color: #bfe0cc;
}
.summary-check {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  color: #1b3212;
  background: var(--accent);
  border-radius: 50%;
}
.eyebrow {
  color: var(--primary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.summary-hero .eyebrow {
  color: var(--accent);
}
.history-warning {
  padding: 0.85rem;
  color: var(--warning);
  background: color-mix(in srgb, var(--warning), transparent 88%);
  border: 1px solid color-mix(in srgb, var(--warning), transparent 70%);
  border-radius: 11px;
}
.summary-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.7rem;
  margin-bottom: 1rem;
}
.summary-stats .card {
  display: grid;
  gap: 0.15rem;
}
.summary-stats svg {
  color: var(--primary);
}
.summary-stats strong {
  font:
    800 1.25rem 'Manrope Variable',
    sans-serif;
}
.summary-stats span {
  color: var(--muted);
  font-size: 0.75rem;
}
.records-card {
  margin-bottom: 1rem;
  background: color-mix(in srgb, var(--accent), var(--surface) 90%);
}
.records-heading {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.records-heading h2,
.records-heading p {
  margin: 0;
}
.trophy {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  color: #313c09;
  background: var(--accent);
  border-radius: 12px;
}
.records-grid {
  display: grid;
  gap: 0.6rem;
  margin-top: 1rem;
}
.records-grid > div {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.2rem 0.6rem;
  padding: 0.7rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 11px;
}
.records-grid strong {
  grid-column: 2;
}
.records-grid span {
  grid-column: 2;
  color: var(--muted);
  font-size: 0.75rem;
}
.records-grid b {
  grid-column: 3;
  grid-row: 1 / span 2;
}
.records-grid small {
  grid-column: 2 / -1;
  color: var(--muted);
}
.comparison {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin-bottom: 1rem;
}
.comparison strong {
  color: var(--primary);
  font-size: 1.2rem;
}
.comparison p {
  margin: 0;
}
.detail-exercises {
  display: grid;
  gap: 1rem;
}
.exercise-heading {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.8rem;
}
.exercise-heading > span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  background: var(--surface-2);
  border-radius: 9px;
  font-weight: 800;
}
.exercise-heading h2,
.exercise-heading p {
  margin: 0;
}
.exercise-heading p {
  font-size: 0.8rem;
}
.detail-set {
  display: grid;
  grid-template-columns: 36px 1fr 1fr 0.7fr 0.7fr;
  align-items: center;
  gap: 0.4rem;
  min-height: 45px;
  padding: 0.35rem 0;
  border-top: 1px solid var(--border);
  font-size: 0.85rem;
}
.header-row {
  min-height: auto;
  color: var(--muted);
  border: 0;
  font-size: 0.68rem;
  font-weight: 700;
}
.detail-set input,
.detail-set select {
  min-width: 0;
  width: 100%;
  min-height: 36px;
  padding: 0.3rem;
  color: var(--text);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 7px;
}
.detail-set.incomplete {
  opacity: 0.45;
}
.workout-note {
  margin-top: 1rem;
}
.workout-note p {
  margin: 0;
}
@media (min-width: 700px) {
  .summary-stats {
    grid-template-columns: repeat(4, 1fr);
  }
  .records-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
