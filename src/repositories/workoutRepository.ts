import { db } from '@/db/database'
import type { PersonalRecord, Workout, WorkoutId } from '@/types/domain'

export const workoutRepository = {
  getAll: (): Promise<Workout[]> => db.workouts.orderBy('startedAt').reverse().toArray(),
  getCompleted: (): Promise<Workout[]> =>
    db.workouts.where('status').equals('completed').reverse().sortBy('startedAt'),
  getActive: (): Promise<Workout | undefined> =>
    db.workouts.where('status').equals('active').first(),
  getById: (id: WorkoutId): Promise<Workout | undefined> => db.workouts.get(id),
  save: (workout: Workout): Promise<WorkoutId> => db.workouts.put(workout),
  completeWithRecords: async (workout: Workout, records: PersonalRecord[]): Promise<void> => {
    await db.transaction('rw', db.workouts, db.personalRecords, async () => {
      await db.personalRecords.where('workoutId').equals(workout.id).delete()
      if (records.length) await db.personalRecords.bulkPut(records)
      await db.workouts.put(workout)
    })
  },
  remove: (id: WorkoutId): Promise<void> => db.workouts.delete(id),
  getLastForExercise: async (exerciseId: string, before?: string): Promise<Workout | undefined> => {
    const completed = await db.workouts.where('status').equals('completed').toArray()
    return completed
      .filter(
        (workout) =>
          workout.exercises.some((item) => item.exerciseId === exerciseId) &&
          (!before || workout.startedAt < before),
      )
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
  },
}
