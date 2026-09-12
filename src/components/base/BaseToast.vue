<script setup lang="ts">
import { CheckCircle2, CircleAlert, Info, X } from '@lucide/vue'
import { useNotificationStore } from '@/stores/notificationStore'

const store = useNotificationStore()
const icons = { success: CheckCircle2, error: CircleAlert, info: Info }

function runAction(id: string, action: () => void): void {
  action()
  store.dismiss(id)
}
</script>

<template>
  <div class="toast-region" aria-live="polite" aria-atomic="false">
    <div
      v-for="item in store.notifications"
      :key="item.id"
      :class="['toast', `toast--${item.tone}`]"
    >
      <component :is="icons[item.tone]" :size="20" aria-hidden="true" />
      <span>{{ item.message }}</span>
      <button v-if="item.action" type="button" @click="runAction(item.id, item.action)">
        {{ item.actionLabel }}
      </button>
      <button type="button" aria-label="Melding sluiten" @click="store.dismiss(item.id)">
        <X :size="18" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.toast-region {
  position: fixed;
  z-index: 80;
  right: 1rem;
  bottom: 6rem;
  display: grid;
  width: min(390px, calc(100% - 2rem));
  gap: 0.6rem;
}
.toast {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 4px solid var(--primary);
  border-radius: 12px;
  box-shadow: var(--shadow);
}
.toast--error {
  border-left-color: var(--danger);
}
.toast button {
  padding: 0.25rem;
  color: var(--primary);
  background: none;
  border: 0;
  font-weight: 700;
}
@media (min-width: 1024px) {
  .toast-region {
    bottom: 1rem;
  }
}
</style>
