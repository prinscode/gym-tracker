import type { PersonalRecordType } from '@/types/domain'

export const recordLabels: Record<PersonalRecordType, string> = {
  maxWeight: 'Zwaarste gewicht',
  maxRepsAtWeight: 'Meeste reps op gewicht',
  estimated1RM: 'Hoogste geschatte 1RM',
  setVolume: 'Hoogste setvolume',
  exerciseWorkoutVolume: 'Hoogste oefeningsvolume',
}

export function formatRecordValue(type: PersonalRecordType, value: number): string {
  if (type === 'maxRepsAtWeight') return `${Math.round(value)} reps`
  return `${value.toLocaleString('nl-NL', { maximumFractionDigits: 1 })} kg`
}
