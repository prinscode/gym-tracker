import { db } from '@/db/database'
import type { ExerciseId, PersonalRecord, PersonalRecordId, WorkoutId } from '@/types/domain'

export const personalRecordRepository = {
  getAll: (): Promise<PersonalRecord[]> =>
    db.personalRecords.orderBy('achievedAt').reverse().toArray(),
  getForExercise: (exerciseId: ExerciseId): Promise<PersonalRecord[]> =>
    db.personalRecords.where('exerciseId').equals(exerciseId).reverse().sortBy('achievedAt'),
  replaceForWorkout: async (workoutId: WorkoutId, records: PersonalRecord[]): Promise<void> => {
    await db.transaction('rw', db.personalRecords, async () => {
      await db.personalRecords.where('workoutId').equals(workoutId).delete()
      if (records.length) await db.personalRecords.bulkPut(records)
    })
  },
  saveMany: (records: PersonalRecord[]): Promise<PersonalRecordId> =>
    db.personalRecords.bulkPut(records),
}
