import { z } from 'zod'
import { db } from '@/db/database'
import type { ExportPayload } from '@/types/domain'
import { cloneRaw } from '@/utils/clone'

const id = z.string().min(1)
const timestamp = z.string().datetime()
const exerciseSchema = z.object({
  id,
  name: z.string().min(1),
  category: z.enum(['compound', 'accessory', 'bodyweight', 'machine', 'isolation']),
  primaryMuscle: z.enum([
    'quadriceps',
    'hamstrings',
    'glutes',
    'chest',
    'back',
    'shoulders',
    'biceps',
    'triceps',
    'calves',
    'core',
  ]),
  secondaryMuscles: z.array(
    z.enum([
      'quadriceps',
      'hamstrings',
      'glutes',
      'chest',
      'back',
      'shoulders',
      'biceps',
      'triceps',
      'calves',
      'core',
    ]),
  ),
  equipment: z.string(),
  instructions: z.string(),
  custom: z.boolean(),
  archived: z.boolean(),
  createdAt: timestamp,
  updatedAt: timestamp,
})
const templateExerciseSchema = z.object({
  id,
  exerciseId: id,
  order: z.number().int().nonnegative(),
  defaultSets: z.number().int().positive(),
  minReps: z.number().int().nonnegative(),
  maxReps: z.number().int().nonnegative(),
  defaultRpe: z.number().min(1).max(10).optional(),
  restSeconds: z.number().int().nonnegative().optional(),
  notes: z.string(),
})
const templateSchema = z.object({
  id,
  programId: id,
  name: z.string().min(1),
  description: z.string(),
  order: z.number().int().nonnegative(),
  exercises: z.array(templateExerciseSchema),
  createdAt: timestamp,
  updatedAt: timestamp,
})
const programSchema = z.object({
  id,
  name: z.string().min(1),
  description: z.string(),
  trainingDays: z.number().int().nonnegative(),
  templateIds: z.array(id),
  status: z.enum(['active', 'inactive', 'archived']),
  createdAt: timestamp,
  updatedAt: timestamp,
})
const workoutSetSchema = z.object({
  id,
  setNumber: z.number().int().positive(),
  type: z.enum(['warmup', 'working', 'drop', 'failure']),
  weightKg: z.number().nonnegative(),
  reps: z.number().int().nonnegative(),
  rpe: z.number().min(1).max(10).nullable(),
  completed: z.boolean(),
  completedAt: timestamp.nullable(),
  notes: z.string(),
})
const workoutExerciseSchema = z.object({
  id,
  exerciseId: id,
  exerciseName: z.string().min(1),
  order: z.number().int().nonnegative(),
  restSeconds: z.number().int().nonnegative(),
  notes: z.string(),
  skipped: z.boolean(),
  sets: z.array(workoutSetSchema),
})
const workoutSchema = z.object({
  id,
  programId: id.nullable(),
  templateId: id.nullable(),
  name: z.string().min(1),
  status: z.enum(['active', 'completed']),
  startedAt: timestamp,
  completedAt: timestamp.nullable(),
  durationSeconds: z.number().int().nonnegative().nullable(),
  notes: z.string(),
  exercises: z.array(workoutExerciseSchema),
  totalVolumeKg: z.number().nonnegative(),
  personalRecordIds: z.array(id),
  createdAt: timestamp,
  updatedAt: timestamp,
})
const recordSchema = z.object({
  id,
  exerciseId: id,
  workoutId: id,
  workoutSetId: id.nullable(),
  recordType: z.enum([
    'maxWeight',
    'maxRepsAtWeight',
    'estimated1RM',
    'setVolume',
    'exerciseWorkoutVolume',
  ]),
  value: z.number().nonnegative(),
  previousValue: z.number().nonnegative().nullable(),
  achievedAt: timestamp,
})
const settingsSchema = z.object({
  id: z.literal('user-settings'),
  theme: z.enum(['light', 'dark', 'system']),
  weightUnit: z.enum(['kg', 'lb']),
  defaultRestSeconds: z.number().int().nonnegative(),
  autoStartRestTimer: z.boolean(),
  includeWarmupsInVolume: z.boolean(),
  confirmSetDeletion: z.boolean(),
  restTimerEndsAt: timestamp.nullable(),
  restTimerPausedRemaining: z.number().int().nonnegative().nullable(),
  updatedAt: timestamp,
})
const exportSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: timestamp,
  exercises: z.array(exerciseSchema),
  programs: z.array(programSchema),
  workoutTemplates: z.array(templateSchema),
  workouts: z.array(workoutSchema),
  records: z.array(recordSchema),
  settings: settingsSchema,
})

export type ImportMode = 'replace' | 'merge'
export type ImportValidation =
  { success: true; data: ExportPayload } | { success: false; errors: string[] }

export async function createExportPayload(): Promise<ExportPayload> {
  const [exercises, programs, workoutTemplates, workouts, records, settings] = await Promise.all([
    db.exercises.toArray(),
    db.programs.toArray(),
    db.workoutTemplates.toArray(),
    db.workouts.toArray(),
    db.personalRecords.toArray(),
    db.settings.get('user-settings'),
  ])
  if (!settings) throw new Error('Settings are missing')
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    exercises,
    programs,
    workoutTemplates,
    workouts,
    records,
    settings,
  }
}

export function validateImport(value: unknown): ImportValidation {
  const result = exportSchema.safeParse(value)
  if (result.success) return { success: true, data: result.data as ExportPayload }
  return {
    success: false,
    errors: result.error.issues
      .slice(0, 8)
      .map((issue) => `${issue.path.join('.') || 'bestand'}: ${issue.message}`),
  }
}

export function parseImportJson(contents: string): ImportValidation {
  try {
    return validateImport(JSON.parse(contents) as unknown)
  } catch {
    return { success: false, errors: ['Het gekozen bestand bevat geen geldige JSON.'] }
  }
}

export async function importData(payload: ExportPayload, mode: ImportMode): Promise<void> {
  const safePayload = cloneRaw(payload)
  if ((await db.settings.count()) > 0) await createExportPayload()
  await db.transaction(
    'rw',
    [db.exercises, db.programs, db.workoutTemplates, db.workouts, db.personalRecords, db.settings],
    async () => {
      if (mode === 'replace')
        await Promise.all([
          db.exercises.clear(),
          db.programs.clear(),
          db.workoutTemplates.clear(),
          db.workouts.clear(),
          db.personalRecords.clear(),
          db.settings.clear(),
        ])
      if (safePayload.exercises.length) await db.exercises.bulkPut(safePayload.exercises)
      if (safePayload.programs.length) await db.programs.bulkPut(safePayload.programs)
      if (safePayload.workoutTemplates.length)
        await db.workoutTemplates.bulkPut(safePayload.workoutTemplates)
      if (safePayload.workouts.length) await db.workouts.bulkPut(safePayload.workouts)
      if (safePayload.records.length) await db.personalRecords.bulkPut(safePayload.records)
      await db.settings.put(safePayload.settings)
    },
  )
  localStorage.removeItem('gba-skip-seed')
}

export async function clearAllData(): Promise<void> {
  await db.transaction(
    'rw',
    [db.exercises, db.programs, db.workoutTemplates, db.workouts, db.personalRecords, db.settings],
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.programs.clear(),
        db.workoutTemplates.clear(),
        db.workouts.clear(),
        db.personalRecords.clear(),
        db.settings.clear(),
      ])
    },
  )
  localStorage.setItem('gba-skip-seed', 'true')
}
