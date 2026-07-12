<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{ open: boolean; title: string; description?: string }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
let previousFocus: HTMLElement | null = null

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previousFocus = document.activeElement as HTMLElement | null
      dialog.value?.showModal()
      await nextTick()
      dialog.value?.querySelector<HTMLElement>('input, select, textarea, button')?.focus()
    } else if (dialog.value?.open) {
      dialog.value.close()
      previousFocus?.focus()
    }
  },
)
</script>

<template>
  <dialog ref="dialog" class="modal" @cancel.prevent="emit('close')" @click.self="emit('close')">
    <section class="modal-panel" :aria-label="title">
      <header>
        <div>
          <h2>{{ title }}</h2>
          <p v-if="description">{{ description }}</p>
        </div>
        <button
          type="button"
          class="icon-button"
          aria-label="Venster sluiten"
          @click="emit('close')"
        >
          <X :size="20" />
        </button>
      </header>
      <slot />
    </section>
  </dialog>
</template>

<style scoped>
.modal {
  width: min(620px, calc(100% - 1.5rem));
  max-height: calc(100vh - 2rem);
  padding: 0;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: var(--shadow);
}
.modal::backdrop {
  background: rgb(5 10 7 / 0.68);
  backdrop-filter: blur(3px);
}
.modal-panel {
  padding: 1.25rem;
}
header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
header h2 {
  margin-bottom: 0.25rem;
}
header p {
  margin: 0;
}
.icon-button {
  display: grid;
  min-width: 40px;
  height: 40px;
  place-items: center;
  color: var(--muted);
  background: var(--surface-2);
  border: 0;
  border-radius: 10px;
}
</style>
