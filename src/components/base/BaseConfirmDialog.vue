<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import BaseButton from './BaseButton.vue'
import { useConfirmStore } from '@/stores/confirmStore'

const store = useConfirmStore()
const dialog = ref<HTMLDialogElement | null>(null)
const cancelButton = ref<HTMLButtonElement | null>(null)
let previousFocus: HTMLElement | null = null

watch(
  () => store.request,
  async (request) => {
    if (request) {
      previousFocus = document.activeElement as HTMLElement | null
      dialog.value?.showModal()
      await nextTick()
      cancelButton.value?.focus()
    } else if (dialog.value?.open) {
      dialog.value.close()
      previousFocus?.focus()
    }
  },
)

function cancel(): void {
  store.settle(false)
}
</script>

<template>
  <dialog ref="dialog" class="dialog" aria-labelledby="confirm-title" @cancel.prevent="cancel">
    <div v-if="store.request" class="dialog-panel">
      <h2 id="confirm-title">{{ store.request.title }}</h2>
      <p>{{ store.request.message }}</p>
      <div class="dialog-actions">
        <button ref="cancelButton" class="button button--secondary" type="button" @click="cancel">
          Annuleren
        </button>
        <BaseButton
          :variant="store.request.destructive ? 'danger' : 'primary'"
          @click="store.settle(true)"
        >
          {{ store.request.confirmLabel }}
        </BaseButton>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(460px, calc(100% - 2rem));
  padding: 0;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: var(--shadow);
}
.dialog::backdrop {
  background: rgb(5 10 7 / 0.64);
  backdrop-filter: blur(3px);
}
.dialog-panel {
  padding: 1.4rem;
}
.dialog-panel p {
  margin-bottom: 1.5rem;
}
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
}
</style>
