import { computed } from 'vue'

export type Theme = 'light' | 'dark' | 'system'
const STORAGE_KEY = 'gba-theme'

export function useTheme() {
  const storedTheme = computed<Theme>(() => {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  })

  function applyTheme(theme: Theme = storedTheme.value): void {
    const dark =
      theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  }

  function setTheme(theme: Theme): void {
    localStorage.setItem(STORAGE_KEY, theme)
    applyTheme(theme)
  }

  return { storedTheme, applyTheme, setTheme }
}
