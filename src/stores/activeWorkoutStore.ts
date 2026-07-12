import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { workoutRepository } from '@/repositories/workoutRepository'
import {
  createAddedWorkoutExercise,
  createFreeWorkout,
  createWorkoutFromTemplate,
} from '@/services/workoutService'
import { createId } from '@/utils/id'
import { detectPersonalRecords } from '@/services/personalRecordService'
import { durationInSeconds, workoutVolume } from '@/utils/calculations'
import { cloneRaw } from '@/utils/clone'
import type {
  Exercise,
  Program,
  Workout,
  WorkoutExerciseId,
  WorkoutSet,
  WorkoutSetId,
  WorkoutTemplate,
} from '@/types/domain'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export const useActiveWorkoutStore = defineStore('active-workout', () => {
  const workout = ref<Workout | null>(null)
  const loading = ref(false)
  const saveState = ref<SaveState>('idle')
  const error = ref('')
  let saveTimer: number | undefined
  let saveQueue = Promise.resolve()
  let pendingSaves = 0

  const completedSetCount = computed(
    () =>
      workout.value?.exercises.reduce(
        (total, exercise) => total + exercise.sets.filter((set) => set.completed).length,
        0,
      ) ?? 0,
  )
  const totalSetCount = computed(
    () =>
      workout.value?.exercises.reduce((total, exercise) => total + exercise.sets.length, 0) ?? 0,
  )

  async function loadActive(): Promise<void> {
    loading.value = true
    try {
      workout.value = (await workoutRepository.getActive()) ?? null
    } catch (cause: unknown) {
      if (import.meta.env.DEV) console.error(cause)
      error.value = 'De actieve workout kon niet worden hersteld.'
    } finally {
      loading.value = false
    }
  }

  async function loadById(id: Workout['id']): Promise<void> {
    loading.value = true
    try {
      const found = await workoutRepository.getById(id)
      workout.value = found?.status === 'active' ? found : null
    } catch (cause: unknown) {
      if (import.meta.env.DEV) console.error(cause)
      error.value = 'De workout kon niet worden geladen.'
    } finally {
      loading.value = false
    }
  }

  async function startFromTemplate(template: WorkoutTemplate, program: Program): Promise<Workout> {
    const created = await createWorkoutFromTemplate(template, program)
    await workoutRepository.save(created)
    workout.value = created
    return created
  }

  async function startFree(): Promise<Workout> {
    const created = createFreeWorkout()
    await workoutRepository.save(created)
    workout.value = created
    return created
  }

  function queueSave(immediate = false): Promise<void> {
    if (!workout.value) return Promise.resolve()
    if (saveTimer) {
      window.clearTimeout(saveTimer)
      saveTimer = undefined
    }
    if (!immediate) {
      saveState.value = 'idle'
      return new Promise((resolve) => {
        saveTimer = window.setTimeout(() => {
          void persist().then(resolve)
        }, 450)
      })
    }
    return persist()
  }

  function persist(): Promise<void> {
    if (!workout.value) return Promise.resolve()
    const snapshot = { ...cloneRaw(workout.value), updatedAt: new Date().toISOString() }
    pendingSaves += 1
    saveState.value = 'saving'
    saveQueue = saveQueue.then(async () => {
      try {
        await workoutRepository.save(snapshot)
        pendingSaves -= 1
        saveState.value = pendingSaves === 0 ? 'saved' : 'saving'
      } catch (cause: unknown) {
        pendingSaves -= 1
        if (import.meta.env.DEV) console.error(cause)
        saveState.value = 'error'
      }
    })
    return saveQueue
  }

  function findSet(exerciseId: WorkoutExerciseId, setId: WorkoutSetId): WorkoutSet | undefined {
    return workout.value?.exercises
      .find((exercise) => exercise.id === exerciseId)
      ?.sets.find((set) => set.id === setId)
  }

  function updateSet(
    exerciseId: WorkoutExerciseId,
    setId: WorkoutSetId,
    patch: Partial<WorkoutSet>,
  ): void {
    const set = findSet(exerciseId, setId)
    if (!set) return
    Object.assign(set, patch)
    void queueSave()
  }

  async function toggleSet(
    exerciseId: WorkoutExerciseId,
    setId: WorkoutSetId,
  ): Promise<WorkoutSet | undefined> {
    const set = findSet(exerciseId, setId)
    if (!set) return undefined
    set.completed = !set.completed
    set.completedAt = set.completed ? new Date().toISOString() : null
    await queueSave(true)
    return set
  }

  function addSet(exerciseId: WorkoutExerciseId): void {
    const exercise = workout.value?.exercises.find((item) => item.id === exerciseId)
    if (!exercise) return
    const previous = exercise.sets.at(-1)
    exercise.sets.push({
      id: createId<'WorkoutSetId'>(),
      setNumber: exercise.sets.length + 1,
      type: previous?.type ?? 'working',
      weightKg: previous?.weightKg ?? 0,
      reps: previous?.reps ?? 8,
      rpe: previous?.rpe ?? 8,
      completed: false,
      completedAt: null,
      notes: '',
    })
    void queueSave(true)
  }

  function duplicateSet(exerciseId: WorkoutExerciseId, setId: WorkoutSetId): void {
    const exercise = workout.value?.exercises.find((item) => item.id === exerciseId)
    const source = exercise?.sets.find((set) => set.id === setId)
    if (!exercise || !source) return
    exercise.sets.push({
      ...cloneRaw(source),
      id: createId<'WorkoutSetId'>(),
      setNumber: exercise.sets.length + 1,
      completed: false,
      completedAt: null,
    })
    void queueSave(true)
  }

  function removeSet(
    exerciseId: WorkoutExerciseId,
    setId: WorkoutSetId,
  ): { set: WorkoutSet; index: number } | null {
    const exercise = workout.value?.exercises.find((item) => item.id === exerciseId)
    const index = exercise?.sets.findIndex((set) => set.id === setId) ?? -1
    if (!exercise || index < 0) return null
    const [set] = exercise.sets.splice(index, 1)
    exercise.sets.forEach((item, position) => {
      item.setNumber = position + 1
    })
    void queueSave(true)
    return set ? { set, index } : null
  }

  function restoreSet(
    exerciseId: WorkoutExerciseId,
    removed: { set: WorkoutSet; index: number },
  ): void {
    const exercise = workout.value?.exercises.find((item) => item.id === exerciseId)
    if (!exercise) return
    exercise.sets.splice(removed.index, 0, removed.set)
    exercise.sets.forEach((item, position) => {
      item.setNumber = position + 1
    })
    void queueSave(true)
  }

  async function addExercise(exercise: Exercise, defaultRestSeconds: number): Promise<void> {
    if (!workout.value || workout.value.exercises.some((item) => item.exerciseId === exercise.id))
      return
    workout.value.exercises.push(
      await createAddedWorkoutExercise(
        exercise,
        workout.value.exercises.length,
        defaultRestSeconds,
      ),
    )
    await queueSave(true)
  }

  function moveExercise(exerciseId: WorkoutExerciseId, delta: number): void {
    if (!workout.value) return
    const index = workout.value.exercises.findIndex((item) => item.id === exerciseId)
    const target = index + delta
    if (index < 0 || target < 0 || target >= workout.value.exercises.length) return
    const [exercise] = workout.value.exercises.splice(index, 1)
    if (exercise) workout.value.exercises.splice(target, 0, exercise)
    workout.value.exercises.forEach((item, order) => {
      item.order = order
    })
    void queueSave(true)
  }

  function skipExercise(exerciseId: WorkoutExerciseId): void {
    const exercise = workout.value?.exercises.find((item) => item.id === exerciseId)
    if (!exercise) return
    exercise.skipped = !exercise.skipped
    void queueSave(true)
  }

  function updateExerciseNotes(exerciseId: WorkoutExerciseId, notes: string): void {
    const exercise = workout.value?.exercises.find((item) => item.id === exerciseId)
    if (!exercise) return
    exercise.notes = notes
    void queueSave()
  }

  function updateNotes(notes: string): void {
    if (workout.value) {
      workout.value.notes = notes
      void queueSave()
    }
  }
  async function discard(): Promise<void> {
    if (!workout.value) return
    const id = workout.value.id
    workout.value = null
    await workoutRepository.remove(id)
  }

  async function finish(includeWarmups: boolean): Promise<Workout> {
    if (!workout.value || completedSetCount.value === 0)
      throw new Error('At least one completed set is required')
    if (saveTimer) window.clearTimeout(saveTimer)
    await saveQueue
    const completedAt = new Date().toISOString()
    const completed: Workout = {
      ...cloneRaw(workout.value),
      status: 'completed',
      completedAt,
      durationSeconds: durationInSeconds(workout.value.startedAt, completedAt),
      updatedAt: completedAt,
      totalVolumeKg: workoutVolume(workout.value, includeWarmups),
    }
    const history = await workoutRepository.getCompleted()
    const records = detectPersonalRecords(completed, history)
    completed.personalRecordIds = records.map((record) => record.id)
    await workoutRepository.completeWithRecords(completed, records)
    workout.value = null
    return completed
  }

  return {
    workout,
    loading,
    saveState,
    error,
    completedSetCount,
    totalSetCount,
    loadActive,
    loadById,
    startFromTemplate,
    startFree,
    queueSave,
    updateSet,
    toggleSet,
    addSet,
    duplicateSet,
    removeSet,
    restoreSet,
    addExercise,
    moveExercise,
    skipExercise,
    updateExerciseNotes,
    updateNotes,
    discard,
    finish,
  }
})
