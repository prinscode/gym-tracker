<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { format, subDays, subMonths, subYears } from 'date-fns'
import { nl } from 'date-fns/locale'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Bar, Line } from 'vue-chartjs'
import { ChartNoAxesCombined, Dumbbell, Gauge, Layers3, Trophy } from '@lucide/vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseSpinner from '@/components/base/BaseSpinner.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import { useExerciseStore } from '@/stores/exerciseStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useWeightUnit } from '@/composables/useWeightUnit'
import { aggregateExerciseProgress } from '@/services/statisticsService'
import { formatRecordValue, recordLabels } from '@/utils/formatters'
import { asId } from '@/utils/id'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
)
const exercises = useExerciseStore()
const history = useHistoryStore()
const settings = useSettingsStore()
const weight = useWeightUnit()
const selectedId = ref('exercise-back-squat')
const period = ref('3m')
onMounted(() => Promise.all([exercises.load(), history.load(), settings.load()]))
const fromDate = computed(() => {
  const now = new Date()
  if (period.value === '4w') return subDays(now, 28)
  if (period.value === '3m') return subMonths(now, 3)
  if (period.value === '6m') return subMonths(now, 6)
  if (period.value === '1y') return subYears(now, 1)
  return undefined
})
const points = computed(() =>
  selectedId.value
    ? aggregateExerciseProgress(
        history.workouts,
        asId<'ExerciseId'>(selectedId.value),
        fromDate.value,
      )
    : [],
)
const labels = computed(() =>
  points.value.map((point) => format(new Date(point.date), 'd MMM', { locale: nl })),
)
const lineData = computed<ChartData<'line'>>(() => ({
  labels: labels.value,
  datasets: [
    {
      label: `Geschatte 1RM (${weight.unit.value})`,
      data: points.value.map((point) =>
        point.estimated1RM === null ? null : weight.fromKilograms(point.estimated1RM),
      ),
      borderColor: '#1b6d43',
      backgroundColor: 'rgba(27,109,67,.12)',
      pointBackgroundColor: '#e9f859',
      pointBorderColor: '#1b6d43',
      pointRadius: 4,
      tension: 0.28,
      fill: true,
      spanGaps: true,
    },
    {
      label: `Zwaarste gewicht (${weight.unit.value})`,
      data: points.value.map((point) => weight.fromKilograms(point.maxWeightKg)),
      borderColor: '#829188',
      backgroundColor: 'transparent',
      pointRadius: 3,
      borderDash: [5, 5],
      tension: 0.2,
    },
  ],
}))
const volumeData = computed<ChartData<'bar'>>(() => ({
  labels: labels.value,
  datasets: [
    {
      label: `Volume (${weight.unit.value})`,
      data: points.value.map((point) => weight.fromKilograms(point.volumeKg)),
      backgroundColor: '#1b6d43',
      borderRadius: 6,
    },
  ],
}))
const effortData = computed<ChartData<'line'>>(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'Werksets',
      data: points.value.map((point) => point.workingSets),
      borderColor: '#4d8bd6',
      backgroundColor: '#4d8bd6',
      pointRadius: 4,
      tension: 0.2,
      yAxisID: 'y',
    },
    {
      label: 'Gemiddelde RPE',
      data: points.value.map((point) => point.averageRpe),
      borderColor: '#d19d2b',
      backgroundColor: '#d19d2b',
      pointRadius: 4,
      tension: 0.2,
      spanGaps: true,
      yAxisID: 'rpe',
    },
  ],
}))
const lineOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: { legend: { position: 'bottom' }, tooltip: { enabled: true } },
  scales: { y: { beginAtZero: false } },
}
const effortOptions: ChartOptions<'line'> = {
  ...lineOptions,
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } },
    rpe: { position: 'right', min: 1, max: 10, grid: { drawOnChartArea: false } },
  },
}
const volumeOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
  scales: { y: { beginAtZero: true } },
}
const recentRecords = computed(() =>
  history.records.filter((record) => record.exerciseId === selectedId.value).slice(0, 5),
)
const latest = computed(() => points.value.at(-1))
const bestE1rm = computed(() =>
  Math.max(0, ...points.value.map((point) => point.estimated1RM ?? 0)),
)
</script>

<template>
  <div class="page-header">
    <div>
      <h1>Progressie</h1>
      <p>Bekijk hoe je kracht, volume en trainingsbelasting zich ontwikkelen.</p>
    </div>
  </div>
  <div class="progress-controls card">
    <label
      ><span>Oefening</span
      ><select v-model="selectedId">
        <option v-for="exercise in exercises.available" :key="exercise.id" :value="exercise.id">
          {{ exercise.name }}
        </option>
      </select></label
    ><label
      ><span>Periode</span
      ><select v-model="period">
        <option value="4w">4 weken</option>
        <option value="3m">3 maanden</option>
        <option value="6m">6 maanden</option>
        <option value="1y">1 jaar</option>
        <option value="all">Alles</option>
      </select></label
    >
  </div>
  <BaseSpinner v-if="history.loading || exercises.loading" label="Progressiedata analyseren…" />
  <BaseEmptyState
    v-else-if="!points.length"
    title="Nog onvoldoende data"
    description="Voltooi minimaal één workout met deze oefening binnen de gekozen periode."
    :icon="ChartNoAxesCombined"
  />
  <template v-else
    ><div class="metric-grid">
      <BaseCard
        ><Gauge :size="19" /><span>Beste geschatte 1RM</span
        ><strong>{{ weight.formatWeight(bestE1rm) }}</strong></BaseCard
      ><BaseCard
        ><Dumbbell :size="19" /><span>Laatste zwaarste set</span
        ><strong>{{ weight.formatWeight(latest?.maxWeightKg ?? 0) }}</strong></BaseCard
      ><BaseCard
        ><Layers3 :size="19" /><span>Laatste werksets</span
        ><strong>{{ latest?.workingSets }}</strong></BaseCard
      ><BaseCard
        ><Trophy :size="19" /><span>Records in periode</span
        ><strong>{{ recentRecords.length }}</strong></BaseCard
      >
    </div>
    <div class="chart-grid">
      <BaseCard class="chart-card wide"
        ><div>
          <h2>Krachtontwikkeling</h2>
          <p>Geschatte 1RM en zwaarste gewicht per workout.</p>
        </div>
        <div class="chart-wrap">
          <Line
            :data="lineData"
            :options="lineOptions"
            role="img"
            aria-label="Lijngrafiek van geschatte 1RM en zwaarste gewicht door de tijd"
          /></div></BaseCard
      ><BaseCard class="chart-card"
        ><div>
          <h2>Trainingsvolume</h2>
          <p>Totaal werksetvolume per workout.</p>
        </div>
        <div class="chart-wrap">
          <Bar
            :data="volumeData"
            :options="volumeOptions"
            role="img"
            aria-label="Staafgrafiek van trainingsvolume per workout"
          /></div></BaseCard
      ><BaseCard class="chart-card"
        ><div>
          <h2>Belasting</h2>
          <p>Aantal werksets en gemiddelde RPE.</p>
        </div>
        <div class="chart-wrap">
          <Line
            :data="effortData"
            :options="effortOptions"
            role="img"
            aria-label="Lijngrafiek van werksets en gemiddelde RPE per workout"
          /></div
      ></BaseCard>
    </div>
    <section class="recent-prs">
      <h2>Recente persoonlijke records</h2>
      <BaseCard
        ><div v-for="record in recentRecords" :key="record.id" class="pr-row">
          <BaseBadge tone="accent">PR</BaseBadge>
          <div>
            <strong>{{ recordLabels[record.recordType] }}</strong
            ><small>{{ format(new Date(record.achievedAt), 'd MMMM yyyy', { locale: nl }) }}</small>
          </div>
          <b>{{ formatRecordValue(record.recordType, record.value) }}</b>
        </div>
        <p v-if="!recentRecords.length">Nog geen records voor deze oefening.</p></BaseCard
      >
    </section></template
  >
</template>

<style scoped>
.progress-controls {
  display: grid;
  gap: 0.7rem;
  margin-bottom: 1rem;
  padding: 0.8rem;
}
.progress-controls label {
  display: grid;
  gap: 0.3rem;
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 700;
}
.progress-controls select {
  min-height: 44px;
  padding: 0.55rem;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 9px;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.7rem;
  margin-bottom: 1rem;
}
.metric-grid .card {
  display: grid;
  gap: 0.25rem;
}
.metric-grid svg {
  color: var(--primary);
}
.metric-grid span {
  color: var(--muted);
  font-size: 0.7rem;
}
.metric-grid strong {
  font:
    800 1.15rem 'Manrope Variable',
    sans-serif;
}
.chart-grid {
  display: grid;
  gap: 1rem;
}
.chart-card > div:first-child h2,
.chart-card > div:first-child p {
  margin-bottom: 0.25rem;
}
.chart-card > div:first-child p {
  font-size: 0.8rem;
}
.chart-wrap {
  position: relative;
  height: 270px;
  margin-top: 0.8rem;
}
.recent-prs {
  margin-top: 1rem;
}
.pr-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.7rem;
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--border);
}
.pr-row:last-child {
  border-bottom: 0;
}
.pr-row strong,
.pr-row small {
  display: block;
}
.pr-row small {
  color: var(--muted);
}
@media (min-width: 700px) {
  .progress-controls {
    grid-template-columns: 2fr 1fr;
  }
  .metric-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  .chart-grid {
    grid-template-columns: 1fr 1fr;
  }
  .chart-card.wide {
    grid-column: 1 / -1;
  }
}
</style>
