import { db } from '@/db/database'
import type { Program, ProgramId, WorkoutTemplate, WorkoutTemplateId } from '@/types/domain'

export const programRepository = {
  getAll: (): Promise<Program[]> => db.programs.orderBy('updatedAt').reverse().toArray(),
  getActive: (): Promise<Program | undefined> =>
    db.programs.where('status').equals('active').first(),
  getById: (id: ProgramId): Promise<Program | undefined> => db.programs.get(id),
  getTemplates: (programId: ProgramId): Promise<WorkoutTemplate[]> =>
    db.workoutTemplates.where('programId').equals(programId).sortBy('order'),
  getTemplate: (id: WorkoutTemplateId): Promise<WorkoutTemplate | undefined> =>
    db.workoutTemplates.get(id),
  save: (program: Program): Promise<ProgramId> => db.programs.put(program),
  saveTemplate: (template: WorkoutTemplate): Promise<WorkoutTemplateId> =>
    db.workoutTemplates.put(template),
  saveWithTemplates: async (program: Program, templates: WorkoutTemplate[]): Promise<void> => {
    await db.transaction('rw', db.programs, db.workoutTemplates, async () => {
      await db.programs.put(program)
      await db.workoutTemplates.where('programId').equals(program.id).delete()
      await db.workoutTemplates.bulkPut(templates)
    })
  },
  setActive: async (id: ProgramId): Promise<void> => {
    await db.transaction('rw', db.programs, async () => {
      const active = await db.programs.where('status').equals('active').toArray()
      await Promise.all(
        active.map((program) => db.programs.update(program.id, { status: 'inactive' })),
      )
      await db.programs.update(id, { status: 'active', updatedAt: new Date().toISOString() })
    })
  },
}
