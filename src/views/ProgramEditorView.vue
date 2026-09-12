<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, ArrowLeft, ArrowUp, GripVertical, Plus, Trash2 } from '@lucide/vue'
import { z } from 'zod'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseNumberInput from '@/components/base/BaseNumberInput.vue'
import BaseSpinner from '@/components/base/BaseSpinner.vue'
import { useProgramStore } from '@/stores/programStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { useConfirm } from '@/composables/useConfirm'
import { useNotifications } from '@/composables/useNotifications'
import { asId, createId } from '@/utils/id'
import { cloneRaw } from '@/utils/clone'
import type { Program, WorkoutTemplate, WorkoutTemplateExercise } from '@/types/domain'

const route = useRoute()
const router = useRouter()
const programStore = useProgramStore()
const exerciseStore = useExerciseStore()
const { confirm } = useConfirm()
const notifications = useNotifications()
const saving = ref(false)
const ready = ref(false)
const errors = reactive<Record<string, string>>({})
const dragged = ref<{ templateId: string; index: number } | null>(null)
const now = new Date().toISOString()
const program = reactive<Program>({
  id: createId<'ProgramId'>(),
  name: '',
  description: '',
  trainingDays: 1,
  templateIds: [],
  status: 'inactive',
  createdAt: now,
  updatedAt: now,
})
const templates = ref<WorkoutTemplate[]>([])
const isNew = computed(() => route.name === 'program-new')
const schema = z.object({
  name: z.string().trim().min(1, 'Geef het programma een naam.'),
  description: z.string().trim().max(500, 'Houd de omschrijving onder 500 tekens.'),
  days: z.number().min(1, 'Voeg minimaal één trainingsdag toe.'),
})

function blankTemplate(order: number): WorkoutTemplate {
  return {
    id: createId<'WorkoutTemplateId'>(),
    programId: program.id,
    name: `Trainingsdag ${order + 1}`,
    description: '',
    order,
    exercises: [],
    createdAt: now,
    updatedAt: now,
  }
}
onMounted(async () => {
  await Promise.all([programStore.load(), exerciseStore.load()])
  if (isNew.value) templates.value = [blankTemplate(0)]
  else {
    const existing = programStore.programs.find(
      (item) => item.id === asId<'ProgramId'>(String(route.params.programId)),
    )
    if (existing) {
      Object.assign(program, cloneRaw(existing))
      templates.value = cloneRaw(programStore.templatesFor(existing.id))
    }
  }
  ready.value = true
})

function addDay(): void {
  templates.value.push(blankTemplate(templates.value.length))
}
async function removeDay(index: number): Promise<void> {
  const day = templates.value[index]
  if (!day) return
  const accepted =
    !day.exercises.length ||
    (await confirm({
      title: `${day.name} verwijderen?`,
      message: 'Alle oefeningen en ingestelde waarden van deze trainingsdag gaan verloren.',
      confirmLabel: 'Dag verwijderen',
      destructive: true,
    }))
  if (accepted) templates.value.splice(index, 1)
}
function addExercise(template: WorkoutTemplate, rawId: string): void {
  const exercise = exerciseStore.available.find((item) => item.id === rawId)
  if (!exercise || template.exercises.some((item) => item.exerciseId === exercise.id)) return
  template.exercises.push({
    id: crypto.randomUUID(),
    exerciseId: exercise.id,
    order: template.exercises.length,
    defaultSets: 3,
    minReps: 6,
    maxReps: 10,
    defaultRpe: 8,
    restSeconds: 120,
    notes: '',
  })
}
function removeExercise(template: WorkoutTemplate, index: number): void {
  template.exercises.splice(index, 1)
  normalizeOrder(template)
}
function move(template: WorkoutTemplate, index: number, delta: number): void {
  const target = index + delta
  if (target < 0 || target >= template.exercises.length) return
  const item = template.exercises[index]
  if (!item) return
  template.exercises.splice(index, 1)
  template.exercises.splice(target, 0, item)
  normalizeOrder(template)
}
function normalizeOrder(template: WorkoutTemplate): void {
  template.exercises.forEach((item, index) => {
    item.order = index
  })
}
function drop(template: WorkoutTemplate, target: number): void {
  if (!dragged.value || dragged.value.templateId !== template.id) return
  const [item] = template.exercises.splice(dragged.value.index, 1)
  if (item) template.exercises.splice(target, 0, item)
  normalizeOrder(template)
  dragged.value = null
}
function exerciseName(item: WorkoutTemplateExercise): string {
  return (
    exerciseStore.exercises.find((exercise) => exercise.id === item.exerciseId)?.name ??
    'Onbekende oefening'
  )
}

async function submit(): Promise<void> {
  Object.keys(errors).forEach((key) => delete errors[key])
  const parsed = schema.safeParse({
    name: program.name,
    description: program.description,
    days: templates.value.length,
  })
  if (!parsed.success) {
    parsed.error.issues.forEach((issue) => {
      errors[String(issue.path[0])] = issue.message
    })
    return
  }
  saving.value = true
  try {
    await programStore.save(program, templates.value)
    notifications.success('Programma opgeslagen.')
    await router.push(`/programs/${program.id}`)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseSpinner v-if="!ready" />
  <form v-else class="editor" novalidate @submit.prevent="submit">
    <RouterLink to="/programs" class="back-link"><ArrowLeft :size="17" /> Annuleren</RouterLink>
    <div class="page-header">
      <div>
        <h1>{{ isNew ? 'Nieuw programma' : 'Programma bewerken' }}</h1>
        <p>Stel vaste dagen, oefeningen en standaard trainingswaarden in.</p>
      </div>
      <BaseButton type="submit" :loading="saving">Programma opslaan</BaseButton>
    </div>
    <BaseCard class="program-fields"
      ><BaseInput
        id="program-name"
        v-model="program.name"
        label="Programmanaam"
        :error="errors.name"
        required
      />
      <div class="field">
        <label for="program-description">Omschrijving</label
        ><textarea
          id="program-description"
          v-model="program.description"
          rows="3"
          placeholder="Wat is de focus van dit programma?"
          :aria-invalid="Boolean(errors.description)"
        /><small v-if="errors.description" class="field-error">{{ errors.description }}</small>
      </div></BaseCard
    >
    <div class="section-heading">
      <div>
        <h2>Trainingsdagen</h2>
        <p>Sleep oefeningen of gebruik de pijlen om de volgorde te wijzigen.</p>
      </div>
      <BaseButton variant="secondary" :icon="Plus" @click="addDay">Dag toevoegen</BaseButton>
    </div>
    <small v-if="errors.days" class="field-error">{{ errors.days }}</small>
    <div class="days">
      <BaseCard v-for="(template, dayIndex) in templates" :key="template.id" class="day-card"
        ><div class="day-title">
          <span>{{ dayIndex + 1 }}</span>
          <div class="day-name">
            <label :for="`day-${template.id}`">Naam trainingsdag</label
            ><input :id="`day-${template.id}`" v-model="template.name" required />
          </div>
          <button
            class="icon-button danger"
            type="button"
            :aria-label="`${template.name} verwijderen`"
            @click="removeDay(dayIndex)"
          >
            <Trash2 :size="18" />
          </button>
        </div>
        <div class="field">
          <label :for="`description-${template.id}`">Korte omschrijving</label
          ><input
            :id="`description-${template.id}`"
            v-model="template.description"
            placeholder="Bijvoorbeeld: focus op squat en horizontaal duwen"
          />
        </div>
        <div class="exercise-list">
          <article
            v-for="(item, index) in template.exercises"
            :key="item.id"
            class="editor-exercise"
            draggable="true"
            @dragstart="dragged = { templateId: template.id, index }"
            @dragover.prevent
            @drop="drop(template, index)"
          >
            <div class="drag">
              <GripVertical :size="18" /><strong>{{ exerciseName(item) }}</strong>
              <div class="order-buttons">
                <button
                  type="button"
                  :disabled="index === 0"
                  :aria-label="`${exerciseName(item)} omhoog`"
                  @click="move(template, index, -1)"
                >
                  <ArrowUp :size="15" /></button
                ><button
                  type="button"
                  :disabled="index === template.exercises.length - 1"
                  :aria-label="`${exerciseName(item)} omlaag`"
                  @click="move(template, index, 1)"
                >
                  <ArrowDown :size="15" />
                </button>
              </div>
              <button
                type="button"
                class="remove"
                :aria-label="`${exerciseName(item)} verwijderen`"
                @click="removeExercise(template, index)"
              >
                <Trash2 :size="16" />
              </button>
            </div>
            <div class="set-defaults">
              <BaseNumberInput
                :id="`sets-${item.id}`"
                v-model="item.defaultSets"
                label="Sets"
                :min="1"
                :max="12"
                compact
              /><BaseNumberInput
                :id="`min-reps-${item.id}`"
                v-model="item.minReps"
                label="Min. reps"
                :min="0"
                :max="50"
                compact
              /><BaseNumberInput
                :id="`max-reps-${item.id}`"
                v-model="item.maxReps"
                label="Max. reps"
                :min="item.minReps"
                :max="50"
                compact
              /><BaseNumberInput
                :id="`rpe-${item.id}`"
                v-model="item.defaultRpe!"
                label="RPE"
                :min="1"
                :max="10"
                :step="0.5"
                compact
              /><BaseNumberInput
                :id="`rest-${item.id}`"
                v-model="item.restSeconds!"
                label="Rust (sec)"
                :min="0"
                :max="900"
                :step="15"
                compact
              />
            </div>
          </article>
          <div v-if="!template.exercises.length" class="empty-day">
            Nog geen oefeningen in deze dag.
          </div>
        </div>
        <label class="add-exercise"
          ><span>Oefening toevoegen</span
          ><select
            :value="''"
            @change="
              addExercise(template, ($event.target as HTMLSelectElement).value)
              ;($event.target as HTMLSelectElement).value = ''
            "
          >
            <option value="" disabled>Zoek of kies een oefening…</option>
            <option
              v-for="exercise in exerciseStore.available"
              :key="exercise.id"
              :value="exercise.id"
              :disabled="template.exercises.some((item) => item.exerciseId === exercise.id)"
            >
              {{ exercise.name }} · {{ exercise.primaryMuscle }}
            </option>
          </select></label
        ></BaseCard
      >
    </div>
    <div class="save-footer">
      <BaseButton type="submit" size="large" :loading="saving">Programma opslaan</BaseButton>
    </div>
  </form>
</template>

<style scoped>
.editor {
  padding-bottom: 2rem;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 1.2rem;
  color: var(--muted);
  font-weight: 700;
}
.program-fields {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.8rem;
}
.section-heading h2,
.section-heading p {
  margin-bottom: 0.25rem;
}
.days {
  display: grid;
  gap: 1rem;
}
.day-title {
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 1rem;
}
.day-title > span {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  color: var(--primary);
  background: var(--primary-soft);
  border-radius: 10px;
  font-weight: 800;
}
.day-name label {
  display: block;
  color: var(--muted);
  font-size: 0.7rem;
  font-weight: 700;
}
.day-name input {
  width: 100%;
  padding: 0.2rem 0;
  color: var(--text);
  background: transparent;
  border: 0;
  border-bottom: 1px solid transparent;
  font:
    700 1.1rem 'Manrope Variable',
    sans-serif;
}
.exercise-list {
  display: grid;
  gap: 0.65rem;
  margin-top: 1rem;
}
.editor-exercise {
  padding: 0.8rem;
  background: var(--surface-2);
  border: 1px solid transparent;
  border-radius: 12px;
}
.editor-exercise:active {
  border-color: var(--primary);
}
.drag {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 0.5rem;
}
.drag > svg {
  color: var(--muted);
  cursor: grab;
}
.order-buttons {
  display: flex;
}
.order-buttons button,
.remove,
.icon-button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  color: var(--muted);
  background: var(--surface);
  border: 1px solid var(--border);
}
.order-buttons button:first-child {
  border-radius: 8px 0 0 8px;
}
.order-buttons button:last-child {
  border-radius: 0 8px 8px 0;
}
.remove,
.icon-button {
  border-radius: 8px;
}
.danger,
.remove {
  color: var(--danger);
}
.set-defaults {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
  margin-top: 0.8rem;
}
.empty-day {
  padding: 1rem;
  color: var(--muted);
  text-align: center;
  border: 1px dashed var(--border);
  border-radius: 10px;
}
.add-exercise {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.9rem;
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 700;
}
.add-exercise select {
  min-height: 46px;
  padding: 0.6rem;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.save-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.2rem;
}
@media (min-width: 700px) {
  .program-fields {
    grid-template-columns: 1fr 1.5fr;
  }
  .set-defaults {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>
