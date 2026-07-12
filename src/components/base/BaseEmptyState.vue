<script setup lang="ts">
import type { Component } from 'vue'
defineProps<{ title: string; description: string; icon?: Component }>()
</script>

<template>
  <div class="empty-state">
    <component :is="icon" v-if="icon" :size="30" aria-hidden="true" />
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <slot />
  </div>
</template>
