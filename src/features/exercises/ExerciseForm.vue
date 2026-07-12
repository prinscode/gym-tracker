<script setup lang="ts">
import { reactive, watch } from 'vue'
import { z } from 'zod'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import type { Exercise } from '@/types/domain'
import type { ExerciseDraft } from '@/stores/exerciseStore'

const props = defineProps<{ exercise?: Exercise }>()
const emit = defineEmits<{ save: [draft: ExerciseDraft]; cancel: [] }>()
const muscleOptions = [
  'quadriceps',
  'hamstrings',
  'glutes',
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'calves',
  'core',
].map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))
const categoryOptions = [
  { value: 'compound', label: 'Compound' },
  { value: 'accessory', label: 'Accessoire' },
  { value: 'bodyweight', label: 'Lichaamsgewicht' },
  { value: 'machine', label: 'Machine' },
  { value: 'isolation', label: 'Isolatie' },
]
const schema = z.object({
  name: z.string().trim().min(1, 'Vul een naam in.'),
  category: z.enum(['compound', 'accessory', 'bodyweight', 'machine', 'isolation']),
  primaryMuscle: z.enum([
    'quadriceps',
    'hamstrings',
    'glutes',
    'chest',
    'back',
    'shoulders',
    'biceps',
    'triceps',
    'calves',
    'core',
  ]),
  equipment: z.string().trim().min(1, 'Vul het materiaal in.'),
  instructions: z.string().trim().min(10, 'Geef een korte instructie van minimaal 10 tekens.'),
})
const draft = reactive({
  name: '',
  category: 'compound',
  primaryMuscle: 'quadriceps',
  equipment: '',
  instructions: '',
})
const errors = reactive<Record<string, string>>({})

watch(
  () => props.exercise,
  (exercise) =>
    Object.assign(
      draft,
      exercise
        ? {
            name: exercise.name,
            category: exercise.category,
            primaryMuscle: exercise.primaryMuscle,
            equipment: exercise.equipment,
            instructions: exercise.instructions,
          }
        : {
            name: '',
            category: 'compound',
            primaryMuscle: 'quadriceps',
            equipment: '',
            instructions: '',
          },
    ),
  { immediate: true },
)

function submit(): void {
  Object.keys(errors).forEach((key) => delete errors[key])
  const result = schema.safeParse(draft)
  if (!result.success) {
    result.error.issues.forEach((issue) => {
      errors[String(issue.path[0])] = issue.message
    })
    return
  }
  emit('save', { ...result.data, secondaryMuscles: [] })
}
</script>

<template>
  <form class="form-grid" novalidate @submit.prevent="submit">
    <BaseInput id="exercise-name" v-model="draft.name" label="Naam" :error="errors.name" required />
    <div class="grid grid--2">
      <BaseSelect
        id="exercise-category"
        v-model="draft.category"
        label="Categorie"
        :options="categoryOptions"
        :error="errors.category"
      />
      <BaseSelect
        id="exercise-muscle"
        v-model="draft.primaryMuscle"
        label="Primaire spiergroep"
        :options="muscleOptions"
        :error="errors.primaryMuscle"
      />
    </div>
    <BaseInput
      id="exercise-equipment"
      v-model="draft.equipment"
      label="Materiaal"
      :error="errors.equipment"
      required
    />
    <div class="field">
      <label for="exercise-instructions">Instructies</label
      ><textarea
        id="exercise-instructions"
        v-model="draft.instructions"
        rows="4"
        :aria-invalid="Boolean(errors.instructions)"
      /><small v-if="errors.instructions" class="field-error">{{ errors.instructions }}</small>
    </div>
    <div class="form-actions">
      <BaseButton variant="secondary" @click="emit('cancel')">Annuleren</BaseButton
      ><BaseButton type="submit">Oefening opslaan</BaseButton>
    </div>
  </form>
</template>

<style scoped>
.form-grid {
  display: grid;
  gap: 1rem;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  margin-top: 0.5rem;
}
</style>
