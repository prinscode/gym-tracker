<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Download, Moon, RefreshCcw, Sun, Trash2, Upload, Wifi, WifiOff } from '@lucide/vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseNumberInput from '@/components/base/BaseNumberInput.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { useConfirm } from '@/composables/useConfirm'
import { useNotifications } from '@/composables/useNotifications'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import {
  clearAllData,
  createExportPayload,
  importData,
  parseImportJson,
} from '@/services/importExportService'
import { seedDatabase } from '@/db/seedData'
import type { ExportPayload, ThemePreference, WeightUnit } from '@/types/domain'
import type { ImportMode } from '@/services/importExportService'

const store = useSettingsStore()
const { confirm } = useConfirm()
const notifications = useNotifications()
const { isOnline } = useOnlineStatus()
const importing = ref(false)
const importOpen = ref(false)
const pendingImport = ref<ExportPayload>()
const importErrors = ref<string[]>([])
const isDevelopment = import.meta.env.DEV
onMounted(store.load)

async function setTheme(theme: ThemePreference): Promise<void> {
  await store.update({ theme })
}
async function setUnit(weightUnit: WeightUnit): Promise<void> {
  await store.update({ weightUnit })
}
async function exportAll(): Promise<void> {
  try {
    const payload = await createExportPayload()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `gba-workout-tracker-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    notifications.success('Exportbestand aangemaakt.')
  } catch (error: unknown) {
    if (import.meta.env.DEV) console.error(error)
    notifications.error('Exporteren is niet gelukt.')
  }
}
async function chooseFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  importErrors.value = []
  const result = parseImportJson(await file.text())
  input.value = ''
  if (!result.success) {
    importErrors.value = result.errors
    return
  }
  pendingImport.value = result.data
  importOpen.value = true
}
async function applyImport(mode: ImportMode): Promise<void> {
  if (!pendingImport.value) return
  importing.value = true
  try {
    await importData(pendingImport.value, mode)
    importOpen.value = false
    notifications.success(
      mode === 'replace' ? 'Alle data is vervangen.' : 'Data is succesvol samengevoegd.',
    )
    window.setTimeout(() => window.location.reload(), 500)
  } catch (error: unknown) {
    if (import.meta.env.DEV) console.error(error)
    notifications.error('Importeren is mislukt; de bestaande data is ongewijzigd.')
  } finally {
    importing.value = false
  }
}
async function deleteEverything(): Promise<void> {
  const accepted = await confirm({
    title: 'Alle lokale data verwijderen?',
    message:
      'Programma’s, workouts, oefeningen en records worden definitief uit deze browser verwijderd. Exporteer eerst een backup als je de data wilt bewaren.',
    confirmLabel: 'Alles verwijderen',
    destructive: true,
  })
  if (!accepted) return
  await clearAllData()
  window.location.reload()
}
async function resetDemo(): Promise<void> {
  const accepted = await confirm({
    title: 'Demo-data opnieuw laden?',
    message: 'Alle huidige lokale data wordt vervangen door de oorspronkelijke demo-inhoud.',
    confirmLabel: 'Demo herstellen',
    destructive: true,
  })
  if (!accepted) return
  await seedDatabase(true)
  window.location.assign('/')
}
</script>

<template>
  <div class="page-header">
    <div>
      <h1>Instellingen</h1>
      <p>Maak de tracker passend bij jouw training en beheer je lokale data.</p>
    </div>
    <BaseBadge :tone="isOnline ? 'success' : 'warning'"
      ><component :is="isOnline ? Wifi : WifiOff" :size="13" />{{
        isOnline ? 'Online' : 'Offline beschikbaar'
      }}</BaseBadge
    >
  </div>
  <div class="settings-layout">
    <section>
      <h2>Weergave</h2>
      <BaseCard
        ><div class="setting-row">
          <div>
            <strong>Thema</strong>
            <p>Kies licht, donker of volg je systeeminstelling.</p>
          </div>
          <div class="segmented">
            <button
              v-for="option in [
                { value: 'light', label: 'Licht', icon: Sun },
                { value: 'dark', label: 'Donker', icon: Moon },
                { value: 'system', label: 'Systeem', icon: RefreshCcw },
              ]"
              :key="option.value"
              type="button"
              :class="{ active: store.settings.theme === option.value }"
              :aria-pressed="store.settings.theme === option.value"
              @click="setTheme(option.value as ThemePreference)"
            >
              <component :is="option.icon" :size="15" />{{ option.label }}
            </button>
          </div>
        </div>
        <div class="setting-row">
          <div>
            <strong>Gewichtseenheid</strong>
            <p>Gewichten blijven intern veilig in kilogram opgeslagen.</p>
          </div>
          <div class="segmented">
            <button
              v-for="unit in ['kg', 'lb'] as WeightUnit[]"
              :key="unit"
              type="button"
              :class="{ active: store.settings.weightUnit === unit }"
              :aria-pressed="store.settings.weightUnit === unit"
              @click="setUnit(unit)"
            >
              {{ unit === 'kg' ? 'Kilogram' : 'Pound' }}
            </button>
          </div>
        </div></BaseCard
      >
    </section>
    <section>
      <h2>Workout</h2>
      <BaseCard
        ><div class="setting-row">
          <div>
            <strong>Standaard rusttijd</strong>
            <p>Wordt gebruikt voor vrij toegevoegde oefeningen.</p>
          </div>
          <BaseNumberInput
            id="default-rest"
            :model-value="store.settings.defaultRestSeconds"
            label="Seconden"
            :min="0"
            :max="900"
            :step="15"
            @update:model-value="store.update({ defaultRestSeconds: $event })"
          />
        </div>
        <label class="toggle-row"
          ><div>
            <strong>Rusttimer automatisch starten</strong>
            <p>Start na het voltooien van een set.</p>
          </div>
          <input
            :checked="store.settings.autoStartRestTimer"
            type="checkbox"
            role="switch"
            @change="
              store.update({ autoStartRestTimer: ($event.target as HTMLInputElement).checked })
            " /></label
        ><label class="toggle-row"
          ><div>
            <strong>Warm-upsets meetellen</strong>
            <p>Neem warming-upvolume op in totaalcijfers.</p>
          </div>
          <input
            :checked="store.settings.includeWarmupsInVolume"
            type="checkbox"
            role="switch"
            @change="
              store.update({ includeWarmupsInVolume: ($event.target as HTMLInputElement).checked })
            " /></label
        ><label class="toggle-row"
          ><div>
            <strong>Bevestigen bij set verwijderen</strong>
            <p>Voorkomt onbedoeld verwijderen tijdens je training.</p>
          </div>
          <input
            :checked="store.settings.confirmSetDeletion"
            type="checkbox"
            role="switch"
            @change="
              store.update({ confirmSetDeletion: ($event.target as HTMLInputElement).checked })
            " /></label
      ></BaseCard>
    </section>
    <section>
      <h2>Data & privacy</h2>
      <BaseCard
        ><div class="data-row">
          <div>
            <strong>Exporteren</strong>
            <p>Download alle data als één versieerbaar JSON-bestand.</p>
          </div>
          <BaseButton variant="secondary" :icon="Download" @click="exportAll"
            >Exporteren</BaseButton
          >
        </div>
        <div class="data-row">
          <div>
            <strong>Importeren</strong>
            <p>Valideer een eerdere export en kies daarna vervangen of samenvoegen.</p>
          </div>
          <label class="file-button button button--secondary"
            ><Upload :size="18" />JSON kiezen<input
              type="file"
              accept="application/json,.json"
              @change="chooseFile"
          /></label>
        </div>
        <div v-if="importErrors.length" class="import-errors" role="alert">
          <strong>Dit bestand kan niet worden geïmporteerd:</strong>
          <ul>
            <li v-for="error in importErrors" :key="error">{{ error }}</li>
          </ul>
        </div>
        <div class="data-row danger-zone">
          <div>
            <strong>Alle lokale data wissen</strong>
            <p>Verwijder alles uit IndexedDB op dit apparaat.</p>
          </div>
          <BaseButton variant="danger" :icon="Trash2" @click="deleteEverything"
            >Alles wissen</BaseButton
          >
        </div>
        <div v-if="isDevelopment" class="data-row">
          <div>
            <strong>Demo-data herstellen</strong>
            <p>Vervang alles door de portfolio-demo.</p>
          </div>
          <BaseButton variant="ghost" :icon="RefreshCcw" @click="resetDemo"
            >Demo resetten</BaseButton
          >
        </div></BaseCard
      >
    </section>
  </div>
  <BaseModal
    :open="importOpen"
    title="Hoe wil je importeren?"
    description="De import is volledig gevalideerd. De bewerking vindt in één transactie plaats; bij een fout blijft de huidige data intact."
    @close="importOpen = false"
    ><div class="import-choices">
      <button type="button" :disabled="importing" @click="applyImport('merge')">
        <strong>Samenvoegen</strong
        ><span>Bestaande data behouden; items met hetzelfde ID bijwerken.</span></button
      ><button type="button" :disabled="importing" @click="applyImport('replace')">
        <strong>Alles vervangen</strong
        ><span>Huidige data wissen en alleen het importbestand gebruiken.</span></button
      ><BaseButton variant="ghost" :disabled="importing" @click="importOpen = false"
        >Annuleren</BaseButton
      >
    </div></BaseModal
  >
</template>

<style scoped>
.settings-layout {
  display: grid;
  gap: 1.4rem;
  max-width: 900px;
}
.settings-layout section > h2 {
  margin-bottom: 0.6rem;
}
.setting-row,
.toggle-row,
.data-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border);
}
.setting-row:first-child,
.data-row:first-child {
  padding-top: 0;
}
.setting-row:last-child,
.toggle-row:last-child,
.data-row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}
.setting-row strong,
.toggle-row strong,
.data-row strong {
  display: block;
}
.setting-row p,
.toggle-row p,
.data-row p {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
}
.segmented {
  display: flex;
  padding: 0.2rem;
  background: var(--surface-2);
  border-radius: 10px;
}
.segmented button {
  display: flex;
  min-height: 36px;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.6rem;
  color: var(--muted);
  background: transparent;
  border: 0;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
}
.segmented button.active {
  color: var(--text);
  background: var(--surface);
  box-shadow: 0 1px 5px rgb(0 0 0 / 0.1);
}
.toggle-row {
  cursor: pointer;
}
.toggle-row input {
  position: relative;
  width: 44px;
  height: 25px;
  flex: none;
  background: var(--border);
  border-radius: 99px;
  appearance: none;
  transition: 150ms ease;
}
.toggle-row input::after {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 19px;
  height: 19px;
  content: '';
  background: white;
  border-radius: 50%;
  transition: 150ms ease;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
}
.toggle-row input:checked {
  background: var(--primary);
}
.toggle-row input:checked::after {
  transform: translateX(19px);
}
.file-button {
  cursor: pointer;
}
.file-button input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.danger-zone {
  margin-top: 0.4rem;
}
.import-errors {
  margin: 0.8rem 0;
  padding: 0.8rem;
  color: var(--danger);
  background: var(--danger-soft);
  border-radius: 10px;
  font-size: 0.8rem;
}
.import-errors ul {
  margin-bottom: 0;
}
.import-choices {
  display: grid;
  gap: 0.7rem;
}
.import-choices > button:not(.button) {
  display: grid;
  gap: 0.25rem;
  padding: 1rem;
  color: var(--text);
  text-align: left;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.import-choices > button:not(.button):hover {
  border-color: var(--primary);
}
.import-choices span {
  color: var(--muted);
  font-size: 0.8rem;
}
@media (max-width: 650px) {
  .setting-row,
  .data-row {
    align-items: flex-start;
    flex-direction: column;
  }
  .segmented {
    width: 100%;
  }
  .segmented button {
    flex: 1;
    justify-content: center;
  }
}
</style>
