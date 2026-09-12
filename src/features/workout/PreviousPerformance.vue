<script setup lang="ts">
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { History } from '@lucide/vue'
import type { WorkoutExercise } from '@/types/domain'
import { useWeightUnit } from '@/composables/useWeightUnit'

defineProps<{ history?: { date: string; exercise: WorkoutExercise } }>()
const weight = useWeightUnit()
</script>

<template>
  <aside class="previous" aria-label="Vorige prestaties">
    <div class="previous-title">
      <History :size="15" /><strong>Vorige keer</strong
      ><span v-if="history">{{ format(new Date(history.date), 'd MMM', { locale: nl }) }}</span>
    </div>
    <div v-if="history" class="previous-sets">
      <span v-for="set in history.exercise.sets.filter((item) => item.completed)" :key="set.id"
        >{{ weight.formatWeight(set.weightKg) }} × {{ set.reps
        }}<small v-if="set.rpe"> @{{ set.rpe }}</small></span
      >
    </div>
    <p v-else>Nog geen eerdere prestaties voor deze oefening.</p>
  </aside>
</template>

<style scoped>
.previous {
  padding: 0.7rem 0.8rem;
  background: var(--surface-2);
  border-radius: 11px;
}
.previous-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--muted);
  font-size: 0.77rem;
}
.previous-title strong {
  color: var(--text);
}
.previous-title span {
  margin-left: auto;
}
.previous-sets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
}
.previous-sets > span {
  padding: 0.25rem 0.45rem;
  color: var(--muted);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 7px;
  font-size: 0.75rem;
}
.previous p {
  margin: 0.45rem 0 0;
  font-size: 0.78rem;
}
</style>
