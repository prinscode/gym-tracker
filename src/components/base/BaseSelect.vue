<script setup lang="ts">
defineProps<{
  modelValue: string
  label: string
  id: string
  options: Array<{ value: string; label: string }>
  error?: string
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <select
      :id
      :value="modelValue"
      :aria-invalid="Boolean(error)"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <small v-if="error" class="field-error">{{ error }}</small>
  </div>
</template>
