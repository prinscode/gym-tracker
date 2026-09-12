<script setup lang="ts">
import { computed } from 'vue'
import { Check, Copy, Trash2 } from '@lucide/vue'
import BaseNumberInput from '@/components/base/BaseNumberInput.vue'
import type { WorkoutSet } from '@/types/domain'
import { useWeightUnit } from '@/composables/useWeightUnit'

const props = defineProps<{ set: WorkoutSet }>()
const emit = defineEmits<{
  update: [patch: Partial<WorkoutSet>]
  toggle: []
  duplicate: []
  remove: []
}>()
const weight = useWeightUnit()
const displayWeight = computed({
  get: () => Number(weight.fromKilograms(props.set.weightKg).toFixed(2)),
  set: (value: number) => emit('update', { weightKg: weight.toKilograms(value) }),
})
</script>

<template>
  <div :class="['set-row', { completed: set.completed }]">
    <div class="set-label">
      <span>{{ set.setNumber }}</span
      ><select
        :value="set.type"
        :aria-label="`Type set ${set.setNumber}`"
        @change="
          emit('update', { type: ($event.target as HTMLSelectElement).value as WorkoutSet['type'] })
        "
      >
        <option value="warmup">Warm-up</option>
        <option value="working">Werkset</option>
        <option value="drop">Dropset</option>
        <option value="failure">Tot falen</option>
      </select>
    </div>
    <BaseNumberInput
      :id="`weight-${set.id}`"
      v-model="displayWeight"
      :label="`Gewicht (${weight.unit.value})`"
      :min="0"
      :step="weight.unit.value === 'kg' ? 2.5 : 5"
      compact
    />
    <BaseNumberInput
      :id="`reps-${set.id}`"
      :model-value="set.reps"
      label="Reps"
      :min="0"
      :max="100"
      compact
      @update:model-value="emit('update', { reps: Math.round($event) })"
    />
    <BaseNumberInput
      :id="`rpe-${set.id}`"
      :model-value="set.rpe"
      label="RPE"
      :min="1"
      :max="10"
      :step="0.5"
      compact
      @update:model-value="emit('update', { rpe: $event })"
    />
    <button
      type="button"
      :class="['complete-button', { checked: set.completed }]"
      :aria-label="
        set.completed
          ? `Set ${set.setNumber} als niet voltooid markeren`
          : `Set ${set.setNumber} voltooien`
      "
      :aria-pressed="set.completed"
      @click="emit('toggle')"
    >
      <Check :size="21" />
    </button>
    <div class="set-actions">
      <button
        type="button"
        :aria-label="`Set ${set.setNumber} dupliceren`"
        @click="emit('duplicate')"
      >
        <Copy :size="15" /></button
      ><button
        type="button"
        :aria-label="`Set ${set.setNumber} verwijderen`"
        @click="emit('remove')"
      >
        <Trash2 :size="15" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.set-row {
  display: grid;
  grid-template-columns: 42px repeat(3, minmax(0, 1fr)) 46px;
  gap: 0.45rem;
  align-items: end;
  padding: 0.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 13px;
  transition: 150ms ease;
}
.set-row.completed {
  background: var(--primary-soft);
  border-color: color-mix(in srgb, var(--primary), transparent 60%);
}
.set-label {
  align-self: center;
  text-align: center;
}
.set-label > span {
  display: block;
  font-weight: 800;
}
.set-label select {
  width: 100%;
  padding: 0;
  color: var(--muted);
  background: transparent;
  border: 0;
  font-size: 0.62rem;
  text-align: center;
}
.complete-button {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  color: var(--muted);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.complete-button.checked {
  color: white;
  background: var(--primary);
  border-color: var(--primary);
}
.set-actions {
  grid-column: 2 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 0.35rem;
}
.set-actions button {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  color: var(--muted);
  background: transparent;
  border: 0;
  border-radius: 7px;
}
@media (max-width: 600px) {
  .set-row {
    grid-template-columns: 38px repeat(3, minmax(0, 1fr));
  }
  .complete-button {
    grid-column: 1;
    grid-row: 2;
    width: 38px;
    height: 38px;
  }
  .set-actions {
    grid-column: 2 / -1;
    grid-row: 2;
  }
  :deep(.number-input) {
    grid-template-columns: 1fr;
  }
  :deep(.number-input button) {
    display: none;
  }
  :deep(.field label) {
    font-size: 0.66rem;
  }
  :deep(.field input) {
    min-height: 42px;
    padding: 0.4rem 0.15rem;
  }
}
</style>
