<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'small' | 'medium' | 'large'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    icon?: Component
  }>(),
  { variant: 'primary', size: 'medium', type: 'button' },
)
</script>

<template>
  <button
    :class="['button', `button--${variant}`, `button--${size}`]"
    :type
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="spinner spinner--small" aria-hidden="true" />
    <component :is="icon" v-else-if="icon" :size="18" aria-hidden="true" />
    <slot />
  </button>
</template>
