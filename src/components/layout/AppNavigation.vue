<script setup lang="ts">
import { Activity, CalendarDays, ChartNoAxesCombined, Dumbbell, House, Settings } from '@lucide/vue'

defineProps<{ mobile?: boolean }>()
const items = [
  { to: '/', label: 'Vandaag', icon: House },
  { to: '/programs', label: "Schema's", icon: CalendarDays },
  { to: '/history', label: 'Historie', icon: Activity },
  { to: '/progress', label: 'Progressie', icon: ChartNoAxesCombined },
  { to: '/exercises', label: 'Oefeningen', icon: Dumbbell, desktopOnly: true },
  { to: '/settings', label: 'Instellingen', icon: Settings, desktopOnly: true },
]
</script>

<template>
  <nav
    :class="mobile ? 'bottom-nav' : 'side-nav'"
    :aria-label="mobile ? 'Mobiele navigatie' : undefined"
  >
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      :class="{ 'desktop-only': mobile && item.desktopOnly }"
    >
      <component :is="item.icon" :size="mobile ? 20 : 19" aria-hidden="true" />
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>
