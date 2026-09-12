<script setup lang="ts">
import { Minus, Plus } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    modelValue: number | null
    label: string
    id: string
    min?: number
    max?: number
    step?: number
    error?: string
    compact?: boolean
  }>(),
  { step: 1 },
)
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

function update(raw: string): void {
  const value = Number(raw)
  if (Number.isFinite(value)) emit('update:modelValue', value)
}
function bump(delta: number): void {
  const next = (props.modelValue ?? 0) + delta * props.step
  emit('update:modelValue', Math.min(props.max ?? Infinity, Math.max(props.min ?? -Infinity, next)))
}
</script>

<template>
  <div :class="['field', { 'field--compact': compact }]">
    <label :for="id">{{ label }}</label>
    <div class="number-input">
      <button type="button" :aria-label="`${label} verlagen`" @click="bump(-1)">
        <Minus :size="16" />
      </button>
      <input
        :id
        :value="modelValue ?? ''"
        type="number"
        inputmode="decimal"
        :min
        :max
        :step
        :aria-invalid="Boolean(error)"
        @input="update(($event.target as HTMLInputElement).value)"
      />
      <button type="button" :aria-label="`${label} verhogen`" @click="bump(1)">
        <Plus :size="16" />
      </button>
    </div>
    <small v-if="error" class="field-error">{{ error }}</small>
  </div>
</template>
