import { exerciseRepository } from '@/repositories/exerciseRepository'
import { workoutRepository } from '@/repositories/workoutRepository'
import { createId } from '@/utils/id'
import type {
  Exercise,
  Program,
  Workout,
  WorkoutExercise,
  WorkoutSet,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from '@/types/domain'

function defaultWeight(exercise: Exercise): number {
  return exercise.category === 'bodyweight' ? 0 : 0
}

async function createExerciseSnapshot(
  item: WorkoutTemplateExercise,
  exercise: Exercise,
): Promise<WorkoutExercise> {
  const previousWorkout = await workoutRepository.getLastForExercise(exercise.id)
  const previousExercise = previousWorkout?.exercises.find(
    (entry) => entry.exerciseId === exercise.id,
  )
  const sets: WorkoutSet[] = Array.from({ length: item.defaultSets }, (_, index) => {
    const previousSet = previousExercise?.sets.filter((set) => set.completed)[index]
    return {
      id: createId<'WorkoutSetId'>(),
      setNumber: index + 1,
      type: 'working',
      weightKg: previousSet?.weightKg ?? defaultWeight(exercise),
      reps: previousSet?.reps ?? item.minReps,
      rpe: previousSet?.rpe ?? item.defaultRpe ?? null,
      completed: false,
      completedAt: null,
      notes: '',
    }
  })
  return {
    id: createId<'WorkoutExerciseId'>(),
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    order: item.order,
    restSeconds: item.restSeconds ?? 120,
    notes: item.notes,
    skipped: false,
    sets,
  }
}

export async function createWorkoutFromTemplate(
  template: WorkoutTemplate,
  program: Program,
): Promise<Workout> {
  const exercises = await exerciseRepository.getAvailable()
  const snapshots = await Promise.all(
    template.exercises.map(async (item) => {
      const exercise = exercises.find((entry) => entry.id === item.exerciseId)
      if (!exercise) throw new Error(`Exercise ${item.exerciseId} not found`)
      return createExerciseSnapshot(item, exercise)
    }),
  )
  return createWorkout(template.name, snapshots, program.id, template.id)
}

export function createFreeWorkout(name = 'Vrije workout'): Workout {
  return createWorkout(name, [], null, null)
}

function createWorkout(
  name: string,
  exercises: WorkoutExercise[],
  programId: Program['id'] | null,
  templateId: WorkoutTemplate['id'] | null,
): Workout {
  const now = new Date().toISOString()
  return {
    id: createId<'WorkoutId'>(),
    programId,
    templateId,
    name,
    status: 'active',
    startedAt: now,
    completedAt: null,
    durationSeconds: null,
    notes: '',
    exercises,
    totalVolumeKg: 0,
    personalRecordIds: [],
    createdAt: now,
    updatedAt: now,
  }
}

export async function createAddedWorkoutExercise(
  exercise: Exercise,
  order: number,
  restSeconds: number,
): Promise<WorkoutExercise> {
  const previous = await workoutRepository.getLastForExercise(exercise.id)
  const previousExercise = previous?.exercises.find((item) => item.exerciseId === exercise.id)
  const previousSet = previousExercise?.sets.find((set) => set.completed)
  return {
    id: createId<'WorkoutExerciseId'>(),
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    order,
    restSeconds,
    notes: '',
    skipped: false,
    sets: [
      {
        id: createId<'WorkoutSetId'>(),
        setNumber: 1,
        type: 'working',
        weightKg: previousSet?.weightKg ?? defaultWeight(exercise),
        reps: previousSet?.reps ?? 8,
        rpe: previousSet?.rpe ?? 8,
        completed: false,
        completedAt: null,
        notes: '',
      },
    ],
  }
}
