<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { format, isAfter, startOfWeek } from 'date-fns'
import { nl } from 'date-fns/locale'
import { ArrowRight, ChartNoAxesCombined, Dumbbell, Play, Plus, Trophy } from '@lucide/vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import ActiveWorkoutRecoveryCard from '@/features/dashboard/ActiveWorkoutRecoveryCard.vue'
import DashboardSkeleton from '@/features/dashboard/DashboardSkeleton.vue'
import { useProgramStore } from '@/stores/programStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useActiveWorkoutStore } from '@/stores/activeWorkoutStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useConfirm } from '@/composables/useConfirm'
import { useNotifications } from '@/composables/useNotifications'
import { useWeightUnit } from '@/composables/useWeightUnit'
import { formatDuration } from '@/utils/calculations'
import { formatRecordValue, recordLabels } from '@/utils/formatters'

const router = useRouter()
const programs = useProgramStore()
const history = useHistoryStore()
const active = useActiveWorkoutStore()
const exercises = useExerciseStore()
const settings = useSettingsStore()
const { confirm } = useConfirm()
const notifications = useNotifications()
const weight = useWeightUnit()
const loading = computed(() => programs.loading || history.loading || active.loading)
const activeTemplates = computed(() =>
  programs.activeProgram ? programs.templatesFor(programs.activeProgram.id) : [],
)
const nextTemplate = computed(() => {
  const lastTemplate = history.workouts.find(
    (workout) => workout.programId === programs.activeProgram?.id,
  )?.templateId
  const lastIndex = activeTemplates.value.findIndex((template) => template.id === lastTemplate)
  return activeTemplates.value[(lastIndex + 1) % Math.max(activeTemplates.value.length, 1)]
})
const weekVolume = computed(() =>
  history.workouts
    .filter((workout) =>
      isAfter(new Date(workout.startedAt), startOfWeek(new Date(), { weekStartsOn: 1 })),
    )
    .reduce((total, workout) => total + workout.totalVolumeKg, 0),
)
const recentRecords = computed(() => history.records.slice(0, 4))
const exerciseName = (id: string) =>
  exercises.exercises.find((exercise) => exercise.id === id)?.name ?? 'Oefening'

onMounted(() =>
  Promise.all([
    programs.load(),
    history.load(),
    active.loadActive(),
    exercises.load(),
    settings.load(),
  ]),
)
async function discardActive(): Promise<void> {
  if (!active.workout) return
  const accepted = await confirm({
    title: 'Actieve workout verwijderen?',
    message: 'Alle ingevulde sets van deze nog niet afgeronde workout gaan verloren.',
    confirmLabel: 'Workout verwijderen',
    destructive: true,
  })
  if (accepted) {
    await active.discard()
    notifications.success('Actieve workout verwijderd.')
  }
}
</script>

<template>
  <div class="page-header">
    <div>
      <span class="date-label">{{ format(new Date(), 'EEEE d MMMM', { locale: nl }) }}</span>
      <h1>Klaar om sterker te worden?</h1>
      <p>Je volgende training staat voor je klaar.</p>
    </div>
    <RouterLink to="/workout"
      ><BaseButton variant="secondary" :icon="Plus">Vrije workout</BaseButton></RouterLink
    >
  </div>
  <DashboardSkeleton v-if="loading" />
  <template v-else>
    <ActiveWorkoutRecoveryCard
      v-if="active.workout"
      :workout="active.workout"
      @resume="router.push(`/workout/${active.workout?.id}`)"
      @discard="discardActive"
    />
    <div class="dashboard-grid">
      <section class="next-section">
        <BaseCard class="next-card"
          ><div class="next-top">
            <div>
              <span class="eyebrow">Volgende workout</span>
              <h2>{{ nextTemplate?.name ?? 'Plan je volgende workout' }}</h2>
              <p>{{ programs.activeProgram?.name ?? 'Je hebt nog geen actief programma.' }}</p>
            </div>
            <span class="workout-icon"><Dumbbell :size="25" /></span>
          </div>
          <div v-if="nextTemplate" class="exercise-preview">
            <span v-for="item in nextTemplate.exercises.slice(0, 4)" :key="item.id">{{
              exerciseName(item.exerciseId)
            }}</span
            ><span v-if="nextTemplate.exercises.length > 4"
              >+{{ nextTemplate.exercises.length - 4 }}</span
            >
          </div>
          <RouterLink
            v-if="nextTemplate"
            :to="{ path: '/workout', query: { template: nextTemplate.id } }"
            ><BaseButton size="large" :icon="Play">Workout starten</BaseButton></RouterLink
          ><RouterLink v-else to="/programs"
            ><BaseButton>Programma kiezen</BaseButton></RouterLink
          ></BaseCard
        >
        <div class="quick-stats">
          <BaseCard
            ><ChartNoAxesCombined :size="19" />
            <div>
              <span>Deze week</span><strong>{{ weight.formatWeight(weekVolume, 0) }}</strong>
            </div></BaseCard
          ><BaseCard
            ><Trophy :size="19" />
            <div>
              <span>Recente PR’s</span><strong>{{ recentRecords.length }}</strong>
            </div></BaseCard
          >
        </div>
      </section>
      <section class="recent-section">
        <div class="section-heading">
          <h2>Recente workouts</h2>
          <RouterLink to="/history">Alles bekijken <ArrowRight :size="15" /></RouterLink>
        </div>
        <div class="recent-list">
          <RouterLink
            v-for="workout in history.workouts.slice(0, 3)"
            :key="workout.id"
            :to="`/history/${workout.id}`"
            ><BaseCard interactive
              ><time :datetime="workout.startedAt"
                ><strong>{{ format(new Date(workout.startedAt), 'd') }}</strong
                ><span>{{ format(new Date(workout.startedAt), 'MMM', { locale: nl }) }}</span></time
              >
              <div>
                <h3>{{ workout.name }}</h3>
                <p>
                  {{ formatDuration(workout.durationSeconds ?? 0) }} ·
                  {{ workout.exercises.length }} oefeningen
                </p>
              </div>
              <BaseBadge v-if="workout.personalRecordIds.length" tone="accent"
                ><Trophy :size="11" /> {{ workout.personalRecordIds.length }}</BaseBadge
              ></BaseCard
            ></RouterLink
          >
        </div>
      </section>
      <section class="records-section">
        <div class="section-heading">
          <h2>Persoonlijke records</h2>
          <RouterLink to="/progress">Progressie <ArrowRight :size="15" /></RouterLink>
        </div>
        <BaseCard
          ><div v-for="record in recentRecords" :key="record.id" class="record-row">
            <span class="record-icon"><Trophy :size="16" /></span>
            <div>
              <strong>{{ exerciseName(record.exerciseId) }}</strong
              ><small>{{ recordLabels[record.recordType] }}</small>
            </div>
            <b>{{ formatRecordValue(record.recordType, record.value) }}</b>
          </div>
          <p v-if="!recentRecords.length">
            Je eerste record verschijnt zodra je een workout afrondt.
          </p></BaseCard
        >
      </section>
    </div>
  </template>
</template>

<style scoped>
.date-label,
.eyebrow {
  color: var(--primary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}
.dashboard-grid {
  display: grid;
  gap: 1.2rem;
}
.next-card {
  color: white;
  background: linear-gradient(135deg, #153f29, #1b6d43);
  border-color: #347851;
}
.next-top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}
.next-top h2 {
  margin: 0.25rem 0;
  font-size: 1.45rem;
}
.next-top p {
  color: #b9d6c4;
}
.next-card .eyebrow {
  color: var(--accent);
}
.workout-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  color: #26300b;
  background: var(--accent);
  border-radius: 13px;
}
.exercise-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.8rem 0 1rem;
}
.exercise-preview span {
  padding: 0.3rem 0.55rem;
  color: #d2e5d8;
  background: rgb(255 255 255 / 0.08);
  border-radius: 99px;
  font-size: 0.72rem;
}
.next-card a,
.next-card .button {
  width: 100%;
}
.quick-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
  margin-top: 0.7rem;
}
.quick-stats .card {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}
.quick-stats svg {
  color: var(--primary);
}
.quick-stats span,
.quick-stats strong {
  display: block;
}
.quick-stats span {
  color: var(--muted);
  font-size: 0.72rem;
}
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.65rem;
}
.section-heading h2 {
  margin: 0;
}
.section-heading a {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--primary);
  font-size: 0.78rem;
  font-weight: 700;
}
.recent-list {
  display: grid;
  gap: 0.6rem;
}
.recent-list .card {
  display: grid;
  grid-template-columns: 42px 1fr auto;
  align-items: center;
  gap: 0.7rem;
}
.recent-list time {
  display: grid;
  width: 40px;
  height: 46px;
  place-items: center;
  align-content: center;
  color: var(--primary);
  background: var(--primary-soft);
  border-radius: 9px;
}
.recent-list time strong,
.recent-list time span {
  line-height: 1;
}
.recent-list time span {
  margin-top: 0.2rem;
  font-size: 0.6rem;
  text-transform: uppercase;
}
.recent-list h3,
.recent-list p {
  margin: 0;
}
.recent-list p {
  margin-top: 0.2rem;
  font-size: 0.72rem;
}
.record-row {
  display: grid;
  grid-template-columns: 34px 1fr auto;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--border);
}
.record-row:last-child {
  border-bottom: 0;
}
.record-icon {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  color: #303909;
  background: var(--accent);
  border-radius: 8px;
}
.record-row strong,
.record-row small {
  display: block;
}
.record-row small {
  color: var(--muted);
}
.record-row b {
  font-size: 0.85rem;
}
@media (min-width: 900px) {
  .dashboard-grid {
    grid-template-columns: 1.25fr 1fr;
  }
  .records-section {
    grid-column: 2;
  }
  .next-section {
    grid-row: 1 / span 2;
  }
}
</style>
