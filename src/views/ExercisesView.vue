<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Archive, CirclePlus, Pencil, Search } from 'lucide-vue-next'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseSpinner from '@/components/base/BaseSpinner.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import ExerciseForm from '@/features/exercises/ExerciseForm.vue'
import { useExerciseStore, type ExerciseDraft } from '@/stores/exerciseStore'
import { useConfirm } from '@/composables/useConfirm'
import { useNotifications } from '@/composables/useNotifications'
import type { Exercise } from '@/types/domain'

const store = useExerciseStore()
const query = ref('')
const category = ref('all')
const showArchived = ref(false)
const modalOpen = ref(false)
const selected = ref<Exercise>()
const { confirm } = useConfirm()
const notifications = useNotifications()
const filtered = computed(() =>
  store.exercises.filter(
    (exercise) =>
      (showArchived.value || !exercise.archived) &&
      (category.value === 'all' || exercise.category === category.value) &&
      `${exercise.name} ${exercise.primaryMuscle} ${exercise.equipment}`
        .toLowerCase()
        .includes(query.value.toLowerCase()),
  ),
)

onMounted(store.load)
function openForm(exercise?: Exercise): void {
  selected.value = exercise
  modalOpen.value = true
}
async function save(draft: ExerciseDraft): Promise<void> {
  await store.save(draft, selected.value?.id)
  modalOpen.value = false
  notifications.success('Oefening opgeslagen.')
}
async function archive(exercise: Exercise): Promise<void> {
  const accepted = await confirm({
    title: `${exercise.name} archiveren?`,
    message:
      'De oefening verdwijnt uit nieuwe schema’s. Historische workoutdata blijft altijd bewaard.',
    confirmLabel: 'Archiveren',
    destructive: true,
  })
  if (!accepted) return
  await store.archive(exercise.id)
  notifications.success('Oefening gearchiveerd.')
}
</script>

<template>
  <div class="page-header">
    <div>
      <h1>Oefeningen</h1>
      <p>{{ store.available.length }} beschikbare oefeningen voor je trainingen.</p>
    </div>
    <BaseButton :icon="CirclePlus" @click="openForm()">Nieuwe oefening</BaseButton>
  </div>
  <div class="toolbar card">
    <label class="search"
      ><Search :size="18" /><span class="sr-only">Zoek oefeningen</span
      ><input
        v-model="query"
        type="search"
        placeholder="Zoek op naam, spiergroep of materiaal…" /></label
    ><select v-model="category" aria-label="Filter op categorie">
      <option value="all">Alle categorieën</option>
      <option value="compound">Compound</option>
      <option value="accessory">Accessoire</option>
      <option value="bodyweight">Lichaamsgewicht</option>
      <option value="machine">Machine</option>
      <option value="isolation">Isolatie</option></select
    ><label class="check"><input v-model="showArchived" type="checkbox" /> Gearchiveerd</label>
  </div>
  <BaseSpinner v-if="store.loading" />
  <p v-else-if="store.error" class="error-banner" role="alert">{{ store.error }}</p>
  <BaseEmptyState
    v-else-if="!filtered.length"
    title="Geen oefeningen gevonden"
    description="Pas je zoekopdracht aan of voeg een eigen oefening toe."
    :icon="Search"
    ><BaseButton variant="secondary" @click="openForm()"
      >Oefening toevoegen</BaseButton
    ></BaseEmptyState
  >
  <div v-else class="exercise-grid">
    <BaseCard v-for="exercise in filtered" :key="exercise.id"
      ><div class="exercise-top">
        <div>
          <div class="inline-actions">
            <h2>{{ exercise.name }}</h2>
            <BaseBadge v-if="exercise.custom" tone="accent">Eigen</BaseBadge
            ><BaseBadge v-if="exercise.archived" tone="warning">Gearchiveerd</BaseBadge>
          </div>
          <p>{{ exercise.primaryMuscle }} · {{ exercise.equipment }}</p>
        </div>
        <div class="inline-actions">
          <button
            v-if="exercise.custom && !exercise.archived"
            class="icon-button"
            type="button"
            :aria-label="`${exercise.name} bewerken`"
            @click="openForm(exercise)"
          >
            <Pencil :size="17" /></button
          ><button
            v-if="!exercise.archived"
            class="icon-button"
            type="button"
            :aria-label="`${exercise.name} archiveren`"
            @click="archive(exercise)"
          >
            <Archive :size="17" />
          </button>
        </div>
      </div>
      <p class="instructions">{{ exercise.instructions }}</p></BaseCard
    >
  </div>
  <BaseModal
    :open="modalOpen"
    :title="selected ? 'Oefening bewerken' : 'Nieuwe oefening'"
    description="Eigen oefeningen zijn direct beschikbaar in al je schema’s."
    @close="modalOpen = false"
    ><ExerciseForm :exercise="selected" @save="save" @cancel="modalOpen = false"
  /></BaseModal>
</template>

<style scoped>
.toolbar {
  display: grid;
  gap: 0.7rem;
  margin-bottom: 1rem;
  padding: 0.8rem;
}
.toolbar select {
  min-height: 44px;
  padding: 0.5rem;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.7rem;
  color: var(--muted);
  background: var(--surface-2);
  border-radius: 10px;
}
.search input {
  width: 100%;
  min-height: 44px;
  color: var(--text);
  background: transparent;
  border: 0;
  outline: 0;
}
.check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 600;
}
.exercise-grid {
  display: grid;
  gap: 0.8rem;
}
.exercise-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.exercise-top h2 {
  margin: 0;
}
.exercise-top p {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  text-transform: capitalize;
}
.instructions {
  margin: 0.85rem 0 0;
  font-size: 0.9rem;
}
.icon-button {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  color: var(--muted);
  background: var(--surface-2);
  border: 0;
  border-radius: 9px;
}
.error-banner {
  padding: 1rem;
  color: var(--danger);
  background: var(--danger-soft);
  border-radius: 12px;
}
@media (min-width: 700px) {
  .toolbar {
    grid-template-columns: 1fr 190px auto;
    align-items: center;
  }
  .exercise-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
