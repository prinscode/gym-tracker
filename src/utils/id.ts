import type { Brand } from '@/types/domain'

export function createId<Name extends string>(): Brand<string, Name> {
  return crypto.randomUUID() as Brand<string, Name>
}

export function asId<Name extends string>(value: string): Brand<string, Name> {
  return value as Brand<string, Name>
}
