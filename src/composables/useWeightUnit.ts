import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { kilogramsToPounds, poundsToKilograms } from '@/utils/calculations'

export function useWeightUnit() {
  const settingsStore = useSettingsStore()
  const unit = computed(() => settingsStore.settings.weightUnit)

  function fromKilograms(value: number): number {
    return unit.value === 'lb' ? kilogramsToPounds(value) : value
  }

  function toKilograms(value: number): number {
    return unit.value === 'lb' ? poundsToKilograms(value) : value
  }

  function formatWeight(valueKg: number, digits = 1): string {
    const shown = fromKilograms(valueKg)
    return `${shown.toLocaleString('nl-NL', { maximumFractionDigits: digits })} ${unit.value}`
  }

  return { unit, fromKilograms, toKilograms, formatWeight }
}
