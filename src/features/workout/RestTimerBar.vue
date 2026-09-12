<script setup lang="ts">
import { BellRing, Pause, Play, Plus, SkipForward, Timer } from '@lucide/vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useRestTimer } from '@/composables/useRestTimer'

const rest = useRestTimer()
defineExpose({ start: rest.start, skip: rest.skip })
</script>

<template>
  <aside
    v-if="rest.running.value || rest.paused.value || rest.justFinished.value"
    :class="['rest-bar', { finished: rest.justFinished.value }]"
    aria-live="polite"
  >
    <component :is="rest.justFinished.value ? BellRing : Timer" :size="21" aria-hidden="true" />
    <div>
      <small>{{
        rest.justFinished.value
          ? 'Rust voorbij'
          : rest.paused.value
            ? 'Rust gepauzeerd'
            : 'Rusttimer'
      }}</small
      ><strong>{{
        rest.justFinished.value ? 'Klaar voor je volgende set' : rest.formatted.value
      }}</strong>
    </div>
    <div class="timer-actions">
      <BaseButton
        v-if="!rest.justFinished.value"
        variant="ghost"
        size="small"
        :icon="Plus"
        aria-label="30 seconden toevoegen"
        @click="rest.add(30)"
        >30s</BaseButton
      ><BaseButton
        v-if="rest.running.value"
        variant="secondary"
        size="small"
        :icon="Pause"
        aria-label="Timer pauzeren"
        @click="rest.pause"
      /><BaseButton
        v-else-if="rest.paused.value"
        variant="secondary"
        size="small"
        :icon="Play"
        aria-label="Timer hervatten"
        @click="rest.resume"
      /><BaseButton variant="ghost" size="small" :icon="SkipForward" @click="rest.skip"
        >Sluiten</BaseButton
      >
    </div>
  </aside>
</template>

<style scoped>
.rest-bar {
  position: fixed;
  z-index: 50;
  right: 1rem;
  bottom: 1rem;
  left: 1rem;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1rem;
  color: white;
  background: #173d2a;
  border: 1px solid #3f7657;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.3);
}
.rest-bar > svg {
  color: var(--accent);
}
.rest-bar small,
.rest-bar strong {
  display: block;
}
.rest-bar small {
  color: #a9c7b5;
}
.rest-bar strong {
  font:
    700 1rem 'Manrope Variable',
    sans-serif;
}
.timer-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 0.35rem;
}
.finished {
  color: #17200d;
  background: var(--accent);
  border-color: var(--accent);
}
.finished > svg,
.finished small {
  color: #39440c;
}
@media (min-width: 700px) {
  .rest-bar {
    right: 1.5rem;
    bottom: 1.5rem;
    left: auto;
    width: 480px;
    grid-template-columns: auto 1fr auto;
  }
  .timer-actions {
    grid-column: auto;
  }
}
</style>
