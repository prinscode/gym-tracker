export type Brand<T, Name extends string> = T & { readonly __brand: Name }
export type ExerciseId = Brand<string, 'ExerciseId'>
export type ProgramId = Brand<string, 'ProgramId'>
export type WorkoutTemplateId = Brand<string, 'WorkoutTemplateId'>
export type WorkoutId = Brand<string, 'WorkoutId'>
export type WorkoutExerciseId = Brand<string, 'WorkoutExerciseId'>
export type WorkoutSetId = Brand<string, 'WorkoutSetId'>
export type PersonalRecordId = Brand<string, 'PersonalRecordId'>

export type ExerciseCategory = 'compound' | 'accessory' | 'bodyweight' | 'machine' | 'isolation'
export type MuscleGroup =
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'calves'
  | 'core'

export interface Exercise {
  id: ExerciseId
  name: string
  category: ExerciseCategory
  primaryMuscle: MuscleGroup
  secondaryMuscles: MuscleGroup[]
  equipment: string
  instructions: string
  custom: boolean
  archived: boolean
  createdAt: string
  updatedAt: string
}

export interface WorkoutTemplateExercise {
  id: string
  exerciseId: ExerciseId
  order: number
  defaultSets: number
  minReps: number
  maxReps: number
  defaultRpe?: number
  restSeconds?: number
  notes: string
}

export interface WorkoutTemplate {
  id: WorkoutTemplateId
  programId: ProgramId
  name: string
  description: string
  order: number
  exercises: WorkoutTemplateExercise[]
  createdAt: string
  updatedAt: string
}

export interface Program {
  id: ProgramId
  name: string
  description: string
  trainingDays: number
  templateIds: WorkoutTemplateId[]
  status: 'active' | 'inactive' | 'archived'
  createdAt: string
  updatedAt: string
}

export type WorkoutSetType = 'warmup' | 'working' | 'drop' | 'failure'

export interface WorkoutSet {
  id: WorkoutSetId
  setNumber: number
  type: WorkoutSetType
  weightKg: number
  reps: number
  rpe: number | null
  completed: boolean
  completedAt: string | null
  notes: string
}

export interface WorkoutExercise {
  id: WorkoutExerciseId
  exerciseId: ExerciseId
  exerciseName: string
  order: number
  restSeconds: number
  notes: string
  skipped: boolean
  sets: WorkoutSet[]
}

export interface Workout {
  id: WorkoutId
  programId: ProgramId | null
  templateId: WorkoutTemplateId | null
  name: string
  status: 'active' | 'completed'
  startedAt: string
  completedAt: string | null
  durationSeconds: number | null
  notes: string
  exercises: WorkoutExercise[]
  totalVolumeKg: number
  personalRecordIds: PersonalRecordId[]
  createdAt: string
  updatedAt: string
}

export type PersonalRecordType =
  'maxWeight' | 'maxRepsAtWeight' | 'estimated1RM' | 'setVolume' | 'exerciseWorkoutVolume'

export interface PersonalRecord {
  id: PersonalRecordId
  exerciseId: ExerciseId
  workoutId: WorkoutId
  workoutSetId: WorkoutSetId | null
  recordType: PersonalRecordType
  value: number
  previousValue: number | null
  achievedAt: string
}

export type ThemePreference = 'light' | 'dark' | 'system'
export type WeightUnit = 'kg' | 'lb'

export interface UserSettings {
  id: 'user-settings'
  theme: ThemePreference
  weightUnit: WeightUnit
  defaultRestSeconds: number
  autoStartRestTimer: boolean
  includeWarmupsInVolume: boolean
  confirmSetDeletion: boolean
  restTimerEndsAt: string | null
  restTimerPausedRemaining: number | null
  updatedAt: string
}

export interface ExportPayload {
  schemaVersion: 1
  exportedAt: string
  exercises: Exercise[]
  programs: Program[]
  workoutTemplates: WorkoutTemplate[]
  workouts: Workout[]
  records: PersonalRecord[]
  settings: UserSettings
}
