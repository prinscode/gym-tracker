import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { programRepository } from '@/repositories/programRepository'
import { createId } from '@/utils/id'
import { cloneRaw } from '@/utils/clone'
import type { Program, ProgramId, WorkoutTemplate } from '@/types/domain'

export const useProgramStore = defineStore('programs', () => {
  const programs = ref<Program[]>([])
  const templates = ref<WorkoutTemplate[]>([])
  const loading = ref(false)
  const error = ref('')
  const activeProgram = computed(() =>
    programs.value.find((program) => program.status === 'active'),
  )

  async function load(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      programs.value = await programRepository.getAll()
      const allTemplates = await Promise.all(
        programs.value.map((program) => programRepository.getTemplates(program.id)),
      )
      templates.value = allTemplates.flat()
    } catch (cause: unknown) {
      if (import.meta.env.DEV) console.error(cause)
      error.value = 'De trainingsschema’s konden niet worden geladen.'
    } finally {
      loading.value = false
    }
  }

  function templatesFor(programId: ProgramId): WorkoutTemplate[] {
    return templates.value
      .filter((template) => template.programId === programId)
      .sort((a, b) => a.order - b.order)
  }

  async function save(program: Program, programTemplates: WorkoutTemplate[]): Promise<void> {
    const now = new Date().toISOString()
    const normalizedTemplates = programTemplates.map((template, order) => ({
      ...template,
      programId: program.id,
      order,
      updatedAt: now,
    }))
    await programRepository.saveWithTemplates(
      {
        ...program,
        trainingDays: normalizedTemplates.length,
        templateIds: normalizedTemplates.map((template) => template.id),
        updatedAt: now,
      },
      normalizedTemplates,
    )
    await load()
  }

  async function duplicate(source: Program): Promise<ProgramId> {
    const now = new Date().toISOString()
    const id = createId<'ProgramId'>()
    const sourceTemplates = templatesFor(source.id)
    const copies = sourceTemplates.map((template) => ({
      ...cloneRaw(template),
      id: createId<'WorkoutTemplateId'>(),
      programId: id,
      exercises: template.exercises.map((item) => ({ ...item, id: crypto.randomUUID() })),
      createdAt: now,
      updatedAt: now,
    }))
    await save(
      {
        ...source,
        id,
        name: `${source.name} (kopie)`,
        status: 'inactive',
        templateIds: copies.map((template) => template.id),
        createdAt: now,
        updatedAt: now,
      },
      copies,
    )
    return id
  }

  async function archive(program: Program): Promise<void> {
    await programRepository.save({
      ...program,
      status: 'archived',
      updatedAt: new Date().toISOString(),
    })
    await load()
  }

  async function setActive(id: ProgramId): Promise<void> {
    await programRepository.setActive(id)
    await load()
  }

  return {
    programs,
    templates,
    activeProgram,
    loading,
    error,
    load,
    templatesFor,
    save,
    duplicate,
    archive,
    setActive,
  }
})
