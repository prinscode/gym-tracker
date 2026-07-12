import Dexie, { type EntityTable } from 'dexie'
import type {
  Exercise,
  PersonalRecord,
  Program,
  UserSettings,
  Workout,
  WorkoutTemplate,
} from '@/types/domain'

export class WorkoutTrackerDatabase extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  programs!: EntityTable<Program, 'id'>
  workoutTemplates!: EntityTable<WorkoutTemplate, 'id'>
  workouts!: EntityTable<Workout, 'id'>
  personalRecords!: EntityTable<PersonalRecord, 'id'>
  settings!: EntityTable<UserSettings, 'id'>

  constructor() {
    super('gba-workout-tracker')
    this.version(1).stores({
      exercises: 'id, name, category, primaryMuscle, custom, archived, updatedAt',
      programs: 'id, name, status, updatedAt',
      workoutTemplates: 'id, programId, order, [programId+order]',
      workouts: 'id, status, startedAt, completedAt, programId, templateId, [status+startedAt]',
      personalRecords: 'id, exerciseId, workoutId, recordType, achievedAt, [exerciseId+recordType]',
      settings: 'id',
    })
  }
}

export const db = new WorkoutTrackerDatabase()
