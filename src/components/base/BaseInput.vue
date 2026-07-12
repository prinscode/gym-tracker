<script setup lang="ts">
defineProps<{
  modelValue: string
  label: string
  id: string
  type?: string
  placeholder?: string
  error?: string
  help?: string
  required?: boolean
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }} <span v-if="required" aria-hidden="true">*</span></label>
    <input
      :id
      :value="modelValue"
      :type="type ?? 'text'"
      :placeholder
      :required
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${id}-error` : help ? `${id}-help` : undefined"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <small v-if="error" :id="`${id}-error`" class="field-error">{{ error }}</small>
    <small v-else-if="help" :id="`${id}-help`" class="field-help">{{ help }}</small>
  </div>
</template>
