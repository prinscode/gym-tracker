<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { format, subDays, subMonths, subYears } from 'date-fns'
import { nl } from 'date-fns/locale'
import { CalendarDays, ChevronRight, Dumbbell, Search, Trophy } from '@lucide/vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseSpinner from '@/components/base/BaseSpinner.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useHistoryStore } from '@/stores/historyStore'
import { useProgramStore } from '@/stores/programStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { useWeightUnit } from '@/composables/useWeightUnit'
import { formatDuration } from '@/utils/calculations'

const history = useHistoryStore()
const programs = useProgramStore()
const exercises = useExerciseStore()
const weight = useWeightUnit()
const query = ref('')
const period = ref('all')
const programId = ref('all')
const templateId = ref('all')
const exerciseId = ref('all')
const onlyRecords = ref(false)
onMounted(() => Promise.all([history.load(), programs.load(), exercises.load()]))

const periodStart = computed(() => {
  const now = new Date()
  return {
    '4w': subDays(now, 28),
    '3m': subMonths(now, 3),
    '6m': subMonths(now, 6),
    '1y': subYears(now, 1),
  }[period.value]
})
const filtered = computed(() =>
  history.workouts.filter(
    (workout) =>
      (!periodStart.value || new Date(workout.startedAt) >= periodStart.value) &&
      (programId.value === 'all' || workout.programId === programId.value) &&
      (templateId.value === 'all' || workout.templateId === templateId.value) &&
      (exerciseId.value === 'all' ||
        workout.exercises.some((item) => item.exerciseId === exerciseId.value)) &&
      (!onlyRecords.value || workout.personalRecordIds.length > 0) &&
      `${workout.name} ${workout.notes} ${workout.exercises.map((item) => item.exerciseName).join(' ')}`
        .toLowerCase()
        .includes(query.value.toLowerCase()),
  ),
)
const completedSets = (index: number) =>
  filtered.value[index]?.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.completed).length,
    0,
  ) ?? 0
</script>

<template>
  <div class="page-header">
    <div>
      <h1>Geschiedenis</h1>
      <p>{{ history.workouts.length }} voltooide workouts en alle prestaties die daarbij horen.</p>
    </div>
  </div>
  <div class="history-filters card">
    <label class="search"
      ><Search :size="18" /><span class="sr-only">Geschiedenis doorzoeken</span
      ><input v-model="query" type="search" placeholder="Zoek workout of oefening…" /></label
    ><label
      ><span>Periode</span
      ><select v-model="period">
        <option value="all">Alles</option>
        <option value="4w">4 weken</option>
        <option value="3m">3 maanden</option>
        <option value="6m">6 maanden</option>
        <option value="1y">1 jaar</option>
      </select></label
    ><label
      ><span>Programma</span
      ><select v-model="programId">
        <option value="all">Alle programma’s</option>
        <option v-for="program in programs.programs" :key="program.id" :value="program.id">
          {{ program.name }}
        </option>
      </select></label
    ><label
      ><span>Trainingsdag</span
      ><select v-model="templateId">
        <option value="all">Alle dagen</option>
        <option v-for="template in programs.templates" :key="template.id" :value="template.id">
          {{ template.name }}
        </option>
      </select></label
    ><label
      ><span>Oefening</span
      ><select v-model="exerciseId">
        <option value="all">Alle oefeningen</option>
        <option v-for="exercise in exercises.available" :key="exercise.id" :value="exercise.id">
          {{ exercise.name }}
        </option>
      </select></label
    ><label class="record-check"
      ><input v-model="onlyRecords" type="checkbox" /> Alleen met records</label
    >
  </div>
  <BaseSpinner v-if="history.loading" />
  <BaseEmptyState
    v-else-if="!filtered.length"
    title="Geen workouts gevonden"
    description="Pas je filters aan of start een nieuwe workout om je geschiedenis op te bouwen."
    :icon="CalendarDays"
    ><RouterLink to="/workout"><BaseButton>Workout starten</BaseButton></RouterLink></BaseEmptyState
  >
  <div v-else class="history-list">
    <RouterLink
      v-for="(workout, index) in filtered"
      :key="workout.id"
      :to="`/history/${workout.id}`"
      ><BaseCard interactive class="history-item"
        ><time :datetime="workout.startedAt"
          ><strong>{{ format(new Date(workout.startedAt), 'd', { locale: nl }) }}</strong
          ><span>{{ format(new Date(workout.startedAt), 'MMM', { locale: nl }) }}</span></time
        >
        <div class="history-main">
          <div class="inline-actions">
            <h2>{{ workout.name }}</h2>
            <BaseBadge v-if="workout.personalRecordIds.length" tone="accent"
              ><Trophy :size="12" /> {{ workout.personalRecordIds.length }} PR</BaseBadge
            >
          </div>
          <p>
            {{ formatDuration(workout.durationSeconds ?? 0) }} ·
            {{ workout.exercises.length }} oefeningen · {{ completedSets(index) }} sets
          </p>
        </div>
        <div class="history-volume">
          <Dumbbell :size="15" /><strong>{{ weight.formatWeight(workout.totalVolumeKg, 0) }}</strong
          ><small>volume</small>
        </div>
        <ChevronRight :size="20" class="chevron" /></BaseCard
    ></RouterLink>
  </div>
</template>

<style scoped>
.history-filters {
  display: grid;
  gap: 0.65rem;
  margin-bottom: 1rem;
  padding: 0.8rem;
}
.history-filters label:not(.search):not(.record-check) {
  display: grid;
  gap: 0.25rem;
  color: var(--muted);
  font-size: 0.7rem;
  font-weight: 700;
}
.history-filters select {
  min-height: 40px;
  padding: 0.4rem;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 9px;
}
.search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.65rem;
  color: var(--muted);
  background: var(--surface-2);
  border-radius: 9px;
}
.search input {
  width: 100%;
  min-height: 42px;
  color: var(--text);
  background: transparent;
  border: 0;
  outline: 0;
}
.record-check {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 700;
}
.history-list {
  display: grid;
  gap: 0.7rem;
}
.history-item {
  display: grid;
  grid-template-columns: 46px 1fr auto;
  align-items: center;
  gap: 0.8rem;
}
.history-item time {
  display: grid;
  width: 44px;
  height: 50px;
  place-items: center;
  align-content: center;
  color: var(--primary);
  background: var(--primary-soft);
  border-radius: 10px;
  text-align: center;
}
.history-item time strong,
.history-item time span {
  line-height: 1;
}
.history-item time strong {
  font-size: 1.1rem;
}
.history-item time span {
  margin-top: 0.2rem;
  font-size: 0.65rem;
  text-transform: uppercase;
}
.history-main h2 {
  margin: 0;
  font-size: 1rem;
}
.history-main p {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
}
.history-volume {
  display: none;
  text-align: right;
}
.history-volume strong,
.history-volume small {
  display: block;
}
.history-volume small {
  color: var(--muted);
}
.chevron {
  color: var(--muted);
}
@media (min-width: 700px) {
  .history-filters {
    grid-template-columns: 2fr repeat(4, 1fr);
    align-items: end;
  }
  .record-check {
    grid-column: 1 / -1;
  }
  .history-item {
    grid-template-columns: 54px 1fr auto auto;
  }
  .history-volume {
    display: block;
  }
}
</style>
