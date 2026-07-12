import { useConfirmStore } from '@/stores/confirmStore'

export function useConfirm() {
  const store = useConfirmStore()
  return {
    confirm: (options: {
      title: string
      message: string
      confirmLabel?: string
      destructive?: boolean
    }) => store.ask({ confirmLabel: 'Bevestigen', destructive: false, ...options }),
  }
}
