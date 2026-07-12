import { db } from '@/db/database'
import type { Exercise, ExerciseId } from '@/types/domain'

export const exerciseRepository = {
  getAll: (): Promise<Exercise[]> => db.exercises.orderBy('name').toArray(),
  getAvailable: (): Promise<Exercise[]> =>
    db.exercises.filter((item) => !item.archived).sortBy('name'),
  getById: (id: ExerciseId): Promise<Exercise | undefined> => db.exercises.get(id),
  save: (exercise: Exercise): Promise<ExerciseId> => db.exercises.put(exercise),
  saveMany: (exercises: Exercise[]): Promise<ExerciseId> => db.exercises.bulkPut(exercises),
  archive: async (id: ExerciseId): Promise<void> => {
    await db.exercises.update(id, { archived: true, updatedAt: new Date().toISOString() })
  },
  isUsed: async (id: ExerciseId): Promise<boolean> =>
    (await db.workouts
      .filter((workout) => workout.exercises.some((item) => item.exerciseId === id))
      .count()) > 0,
  remove: (id: ExerciseId): Promise<void> => db.exercises.delete(id),
}
