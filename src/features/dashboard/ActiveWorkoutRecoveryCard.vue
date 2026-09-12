<script setup lang="ts">
import { computed } from 'vue'
import { differenceInMinutes, formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Play, Trash2 } from '@lucide/vue'
import BaseButton from '@/components/base/BaseButton.vue'
import type { Workout } from '@/types/domain'

const props = defineProps<{ workout: Workout }>()
defineEmits<{ resume: []; discard: [] }>()
const completed = computed(() =>
  props.workout.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.completed).length,
    0,
  ),
)
</script>

<template>
  <section class="recovery-card" aria-labelledby="recovery-title">
    <div class="pulse" aria-hidden="true"><i /></div>
    <div class="recovery-copy">
      <span
        >Workout actief ·
        {{ formatDistanceToNow(new Date(workout.startedAt), { locale: nl }) }}</span
      >
      <h2 id="recovery-title">{{ workout.name }}</h2>
      <p>
        {{ completed }} sets voltooid ·
        {{ differenceInMinutes(new Date(), new Date(workout.startedAt)) }} min bezig
      </p>
    </div>
    <div class="recovery-actions">
      <BaseButton :icon="Play" @click="$emit('resume')">Hervatten</BaseButton
      ><BaseButton
        variant="ghost"
        :icon="Trash2"
        aria-label="Actieve workout verwijderen"
        @click="$emit('discard')"
      />
    </div>
  </section>
</template>

<style scoped>
.recovery-card {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
  padding: 1rem;
  color: white;
  background: linear-gradient(120deg, #153c28, #1d5a3a);
  border: 1px solid #34714e;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.pulse {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  background: rgb(255 255 255 / 0.1);
  border-radius: 50%;
}
.pulse i {
  width: 11px;
  height: 11px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 0 6px rgb(233 248 89 / 0.15);
}
.recovery-copy span {
  color: #b4d8c1;
  font-size: 0.72rem;
  font-weight: 700;
}
.recovery-copy h2 {
  margin: 0.15rem 0;
}
.recovery-copy p {
  margin: 0;
  color: #c8dfd0;
  font-size: 0.8rem;
}
.recovery-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 0.5rem;
}
.recovery-actions .button:first-child {
  flex: 1;
}
@media (min-width: 700px) {
  .recovery-card {
    grid-template-columns: auto 1fr auto;
    padding: 1.1rem 1.25rem;
  }
  .recovery-actions {
    grid-column: auto;
  }
}
</style>
