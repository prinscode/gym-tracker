<script setup lang="ts">
import { onMounted } from 'vue'
import { Archive, Copy, Plus, Star } from 'lucide-vue-next'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseSpinner from '@/components/base/BaseSpinner.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import { useProgramStore } from '@/stores/programStore'
import { useConfirm } from '@/composables/useConfirm'
import { useNotifications } from '@/composables/useNotifications'
import type { Program } from '@/types/domain'

const store = useProgramStore()
const { confirm } = useConfirm()
const notifications = useNotifications()
onMounted(store.load)

async function duplicate(program: Program): Promise<void> {
  await store.duplicate(program)
  notifications.success('Programma gedupliceerd.')
}
async function archive(program: Program): Promise<void> {
  const accepted = await confirm({
    title: `${program.name} archiveren?`,
    message:
      'Het programma blijft zichtbaar in je trainingsgeschiedenis, maar is niet meer te starten.',
    confirmLabel: 'Archiveren',
    destructive: true,
  })
  if (accepted) {
    await store.archive(program)
    notifications.success('Programma gearchiveerd.')
  }
}
async function activate(program: Program): Promise<void> {
  await store.setActive(program.id)
  notifications.success(`${program.name} is nu je actieve programma.`)
}
</script>

<template>
  <div class="page-header">
    <div>
      <h1>Trainingsschema’s</h1>
      <p>Plan je trainingen en houd progressieve overload overzichtelijk.</p>
    </div>
    <RouterLink to="/programs/new"
      ><BaseButton :icon="Plus">Nieuw programma</BaseButton></RouterLink
    >
  </div>
  <BaseSpinner v-if="store.loading" />
  <p v-else-if="store.error" class="error-banner" role="alert">{{ store.error }}</p>
  <BaseEmptyState
    v-else-if="!store.programs.length"
    title="Nog geen programma’s"
    description="Maak je eerste trainingsprogramma en voeg je vaste trainingsdagen toe."
    ><RouterLink to="/programs/new"
      ><BaseButton>Programma maken</BaseButton></RouterLink
    ></BaseEmptyState
  >
  <div v-else class="program-grid">
    <BaseCard
      v-for="program in store.programs"
      :key="program.id"
      :class="{ archived: program.status === 'archived' }"
      ><div class="program-heading">
        <div class="inline-actions">
          <BaseBadge v-if="program.status === 'active'" tone="success"
            ><Star :size="12" /> Actief</BaseBadge
          ><BaseBadge v-if="program.status === 'archived'" tone="warning">Gearchiveerd</BaseBadge>
        </div>
        <h2>{{ program.name }}</h2>
        <p>{{ program.description }}</p>
      </div>
      <div class="day-summary">
        <strong>{{ program.trainingDays }}</strong
        ><span>trainingsdagen</span>
        <div class="day-dots"><i v-for="day in program.trainingDays" :key="day" /></div>
      </div>
      <div class="program-actions">
        <RouterLink :to="`/programs/${program.id}`"
          ><BaseButton variant="secondary">Bekijken</BaseButton></RouterLink
        ><BaseButton
          v-if="program.status !== 'active' && program.status !== 'archived'"
          variant="ghost"
          :icon="Star"
          aria-label="Actief maken"
          @click="activate(program)"
        /><BaseButton
          variant="ghost"
          :icon="Copy"
          aria-label="Dupliceren"
          @click="duplicate(program)"
        /><BaseButton
          v-if="program.status !== 'archived'"
          variant="ghost"
          :icon="Archive"
          aria-label="Archiveren"
          @click="archive(program)"
        /></div
    ></BaseCard>
  </div>
</template>

<style scoped>
.program-grid {
  display: grid;
  gap: 1rem;
}
.program-heading h2 {
  margin: 0.6rem 0 0.35rem;
}
.program-heading p {
  min-height: 3rem;
  margin-bottom: 1rem;
}
.day-summary {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: baseline;
  gap: 0.45rem;
  padding: 0.8rem;
  background: var(--surface-2);
  border-radius: 12px;
}
.day-summary strong {
  font:
    800 1.5rem 'Manrope',
    sans-serif;
}
.day-summary span {
  color: var(--muted);
}
.day-dots {
  display: flex;
  gap: 0.3rem;
}
.day-dots i {
  width: 7px;
  height: 7px;
  background: var(--primary);
  border-radius: 50%;
}
.program-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 1rem;
}
.program-actions a {
  margin-right: auto;
}
.archived {
  opacity: 0.68;
}
.error-banner {
  padding: 1rem;
  color: var(--danger);
  background: var(--danger-soft);
  border-radius: 12px;
}
@media (min-width: 700px) {
  .program-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
