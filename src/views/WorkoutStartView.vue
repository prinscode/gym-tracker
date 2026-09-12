<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Dumbbell, Play, RotateCcw, Trash2 } from '@lucide/vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseSpinner from '@/components/base/BaseSpinner.vue'
import { useProgramStore } from '@/stores/programStore'
import { useActiveWorkoutStore } from '@/stores/activeWorkoutStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import type { WorkoutTemplate } from '@/types/domain'

const route = useRoute()
const router = useRouter()
const programs = useProgramStore()
const activeStore = useActiveWorkoutStore()
const exercises = useExerciseStore()
const loading = ref(true)
const conflictOpen = ref(false)
const pendingStart = ref<(() => Promise<void>) | null>(null)
const activeProgram = computed(() => programs.activeProgram)
const templates = computed(() =>
  activeProgram.value ? programs.templatesFor(activeProgram.value.id) : [],
)
const selectedTemplate = computed(() =>
  templates.value.find((template) => template.id === route.query.template),
)
const nameFor = (id: string) =>
  exercises.exercises.find((exercise) => exercise.id === id)?.name ?? 'Oefening'

onMounted(async () => {
  await Promise.all([programs.load(), activeStore.loadActive(), exercises.load()])
  loading.value = false
})
async function runStart(action: () => Promise<void>): Promise<void> {
  if (activeStore.workout) {
    pendingStart.value = action
    conflictOpen.value = true
    return
  }
  await action()
}
async function startTemplate(template: WorkoutTemplate): Promise<void> {
  if (!activeProgram.value) return
  await runStart(async () => {
    const workout = await activeStore.startFromTemplate(template, activeProgram.value!)
    await router.push(`/workout/${workout.id}`)
  })
}
async function startFree(): Promise<void> {
  await runStart(async () => {
    const workout = await activeStore.startFree()
    await router.push(`/workout/${workout.id}`)
  })
}
async function replaceActive(): Promise<void> {
  await activeStore.discard()
  conflictOpen.value = false
  const action = pendingStart.value
  pendingStart.value = null
  if (action) await action()
}
function resume(): void {
  conflictOpen.value = false
  if (activeStore.workout) void router.push(`/workout/${activeStore.workout.id}`)
}
</script>

<template>
  <BaseSpinner v-if="loading" label="Workout voorbereiden…" />
  <template v-else>
    <RouterLink
      :to="selectedTemplate && activeProgram ? `/programs/${activeProgram.id}` : '/'"
      class="back-link"
      ><ArrowLeft :size="17" /> Terug</RouterLink
    >
    <div class="page-header">
      <div>
        <h1>{{ selectedTemplate ? selectedTemplate.name : 'Workout starten' }}</h1>
        <p>
          {{
            selectedTemplate?.description ??
            'Kies een trainingsdag uit je actieve programma of start zonder schema.'
          }}
        </p>
      </div>
    </div>
    <BaseCard v-if="selectedTemplate" class="selected-workout"
      ><div class="workout-symbol"><Dumbbell :size="28" /></div>
      <div>
        <span class="eyebrow">{{ activeProgram?.name }}</span>
        <h2>{{ selectedTemplate.name }}</h2>
        <p>{{ selectedTemplate.exercises.length }} oefeningen · ongeveer 60 minuten</p>
      </div>
      <ol>
        <li v-for="item in selectedTemplate.exercises" :key="item.id">
          <span>{{ item.order + 1 }}</span
          ><strong>{{ nameFor(item.exerciseId) }}</strong
          ><small>{{ item.defaultSets }} × {{ item.minReps }}–{{ item.maxReps }}</small>
        </li>
      </ol>
      <BaseButton size="large" :icon="Play" @click="startTemplate(selectedTemplate)"
        >Start deze workout</BaseButton
      ></BaseCard
    >
    <template v-else
      ><section v-if="activeProgram">
        <div class="section-heading">
          <div>
            <span class="eyebrow">Actief programma</span>
            <h2>{{ activeProgram.name }}</h2>
          </div>
        </div>
        <div class="template-grid">
          <BaseCard v-for="template in templates" :key="template.id" interactive
            ><span class="day-number">Dag {{ template.order + 1 }}</span>
            <h2>{{ template.name }}</h2>
            <p>
              {{
                template.exercises
                  .map((item) => nameFor(item.exerciseId))
                  .slice(0, 3)
                  .join(' · ')
              }}<template v-if="template.exercises.length > 3">
                +{{ template.exercises.length - 3 }}</template
              >
            </p>
            <BaseButton :icon="Play" @click="startTemplate(template)"
              >Start workout</BaseButton
            ></BaseCard
          >
        </div>
      </section>
      <section class="free-workout">
        <BaseCard
          ><div>
            <Dumbbell :size="24" />
            <h2>Vrije workout</h2>
            <p>Start met een leeg canvas en voeg tijdens de training oefeningen toe.</p>
          </div>
          <BaseButton variant="secondary" @click="startFree">Vrij starten</BaseButton></BaseCard
        >
      </section></template
    >
  </template>
  <BaseModal
    :open="conflictOpen"
    title="Er staat al een workout open"
    description="Je voortgang is veilig opgeslagen. Kies wat je met de huidige workout wilt doen."
    @close="conflictOpen = false"
    ><div class="conflict-actions">
      <BaseButton :icon="RotateCcw" @click="resume">Huidige workout hervatten</BaseButton
      ><BaseButton variant="danger" :icon="Trash2" @click="replaceActive"
        >Verwijderen en nieuw starten</BaseButton
      ><BaseButton variant="ghost" @click="conflictOpen = false">Annuleren</BaseButton>
    </div></BaseModal
  >
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
.selected-workout {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
}
.workout-symbol {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  color: #1a240e;
  background: var(--accent);
  border-radius: 14px;
}
.selected-workout h2 {
  margin: 0.15rem 0;
}
.eyebrow,
.day-number {
  color: var(--primary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.selected-workout ol {
  grid-column: 1 / -1;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--border);
}
.selected-workout li {
  display: grid;
  grid-template-columns: 30px 1fr auto;
  gap: 0.6rem;
  align-items: center;
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--border);
}
.selected-workout li span {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  background: var(--surface-2);
  border-radius: 7px;
  font-size: 0.72rem;
}
.selected-workout li small {
  color: var(--muted);
}
.selected-workout > .button {
  grid-column: 1 / -1;
}
.template-grid {
  display: grid;
  gap: 0.8rem;
}
.template-grid h2 {
  margin: 0.35rem 0;
}
.template-grid .button {
  width: 100%;
}
.free-workout {
  margin-top: 1.5rem;
}
.free-workout .card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.free-workout h2 {
  margin: 0.5rem 0 0.25rem;
}
.free-workout p {
  margin-bottom: 0;
}
.conflict-actions {
  display: grid;
  gap: 0.65rem;
}
@media (min-width: 700px) {
  .selected-workout {
    max-width: 700px;
    margin: 0 auto;
    padding: 1.5rem;
  }
  .template-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
