<script setup lang="ts">
withDefaults(defineProps<{ padded?: boolean; interactive?: boolean }>(), { padded: true })
</script>

<template>
  <section :class="['card', { 'card--padded': padded, 'card--interactive': interactive }]">
    <slot />
  </section>
</template>
