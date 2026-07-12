<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Clock3, Pencil, Play } from 'lucide-vue-next'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseSpinner from '@/components/base/BaseSpinner.vue'
import { useProgramStore } from '@/stores/programStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { asId } from '@/utils/id'

const route = useRoute()
const store = useProgramStore()
const exercises = useExerciseStore()
const programId = asId<'ProgramId'>(String(route.params.programId))
const program = computed(() => store.programs.find((item) => item.id === programId))
const templates = computed(() => store.templatesFor(programId))
const nameFor = (id: string) =>
  exercises.exercises.find((exercise) => exercise.id === id)?.name ?? 'Onbekende oefening'
onMounted(async () => {
  await Promise.all([store.load(), exercises.load()])
})
</script>

<template>
  <BaseSpinner v-if="store.loading || exercises.loading" />
  <template v-else-if="program">
    <RouterLink to="/programs" class="back-link"
      ><ArrowLeft :size="17" /> Alle programma’s</RouterLink
    >
    <div class="page-header">
      <div>
        <div class="inline-actions">
          <BaseBadge v-if="program.status === 'active'" tone="success">Actief programma</BaseBadge
          ><BaseBadge v-if="program.status === 'archived'" tone="warning">Gearchiveerd</BaseBadge>
        </div>
        <h1>{{ program.name }}</h1>
        <p>{{ program.description }}</p>
      </div>
      <RouterLink v-if="program.status !== 'archived'" :to="`/programs/${program.id}/edit`"
        ><BaseButton variant="secondary" :icon="Pencil">Bewerken</BaseButton></RouterLink
      >
    </div>
    <div class="day-list">
      <BaseCard v-for="template in templates" :key="template.id"
        ><div class="day-header">
          <div>
            <span class="eyebrow">Dag {{ template.order + 1 }}</span>
            <h2>{{ template.name }}</h2>
            <p>{{ template.description }}</p>
          </div>
          <RouterLink
            v-if="program.status !== 'archived'"
            :to="{ path: '/workout', query: { template: template.id } }"
            ><BaseButton :icon="Play">Start</BaseButton></RouterLink
          >
        </div>
        <ol class="template-exercises">
          <li v-for="item in template.exercises" :key="item.id">
            <span class="exercise-order">{{ item.order + 1 }}</span>
            <div>
              <strong>{{ nameFor(item.exerciseId) }}</strong
              ><small
                >{{ item.defaultSets }} × {{ item.minReps }}–{{ item.maxReps }} reps
                <template v-if="item.defaultRpe">· RPE {{ item.defaultRpe }}</template></small
              >
            </div>
            <span v-if="item.restSeconds" class="rest"
              ><Clock3 :size="14" /> {{ item.restSeconds }}s</span
            >
          </li>
        </ol></BaseCard
      >
    </div>
  </template>
  <BaseCard v-else
    ><h1>Programma niet gevonden</h1>
    <p>Dit programma bestaat niet meer of is verwijderd.</p>
    <RouterLink to="/programs"
      ><BaseButton>Terug naar programma’s</BaseButton></RouterLink
    ></BaseCard
  >
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 1.2rem;
  color: var(--muted);
  font-weight: 700;
}
.day-list {
  display: grid;
  gap: 1rem;
}
.day-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}
.day-header h2 {
  margin: 0.25rem 0;
}
.eyebrow {
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.template-exercises {
  padding: 0;
  margin: 1rem 0 0;
  list-style: none;
  border-top: 1px solid var(--border);
}
.template-exercises li {
  display: grid;
  grid-template-columns: 30px 1fr auto;
  align-items: center;
  gap: 0.7rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid var(--border);
}
.template-exercises li:last-child {
  border-bottom: 0;
}
.exercise-order {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  color: var(--muted);
  background: var(--surface-2);
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 800;
}
.template-exercises strong,
.template-exercises small {
  display: block;
}
.template-exercises small {
  margin-top: 0.15rem;
  color: var(--muted);
}
.rest {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--muted);
  font-size: 0.8rem;
}
</style>
