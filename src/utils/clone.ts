import { toRaw } from 'vue'

export function cloneRaw<T extends object>(value: T): T {
  return structuredClone(toRaw(value))
}
