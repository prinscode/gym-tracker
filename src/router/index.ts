import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
    { path: '/programs', name: 'programs', component: () => import('@/views/ProgramsView.vue') },
    {
      path: '/programs/new',
      name: 'program-new',
      component: () => import('@/views/ProgramEditorView.vue'),
    },
    {
      path: '/programs/:programId',
      name: 'program-detail',
      component: () => import('@/views/ProgramDetailView.vue'),
    },
    {
      path: '/programs/:programId/edit',
      name: 'program-edit',
      component: () => import('@/views/ProgramEditorView.vue'),
    },
    {
      path: '/workout',
      name: 'workout-new',
      component: () => import('@/views/WorkoutStartView.vue'),
    },
    {
      path: '/workout/:workoutId',
      name: 'active-workout',
      component: () => import('@/views/ActiveWorkoutView.vue'),
    },
    { path: '/history', name: 'history', component: () => import('@/views/HistoryView.vue') },
    {
      path: '/history/:workoutId',
      name: 'history-detail',
      component: () => import('@/views/HistoryDetailView.vue'),
    },
    { path: '/progress', name: 'progress', component: () => import('@/views/ProgressView.vue') },
    { path: '/exercises', name: 'exercises', component: () => import('@/views/ExercisesView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
