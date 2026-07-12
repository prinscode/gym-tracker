import { subDays, subMinutes } from 'date-fns'
import { db } from './database'
import { asId, createId } from '@/utils/id'
import { estimatedOneRepMax, workoutVolume } from '@/utils/calculations'
import type {
  Exercise,
  ExerciseId,
  MuscleGroup,
  PersonalRecord,
  Program,
  ProgramId,
  UserSettings,
  Workout,
  WorkoutExercise,
  WorkoutTemplate,
  WorkoutTemplateId,
} from '@/types/domain'

const createdAt = '2025-01-01T09:00:00.000Z'

type ExerciseSeed = [
  name: string,
  category: Exercise['category'],
  primary: MuscleGroup,
  secondary: MuscleGroup[],
  equipment: string,
  instructions: string,
]

const exerciseSeeds: ExerciseSeed[] = [
  [
    'Back Squat',
    'compound',
    'quadriceps',
    ['glutes', 'hamstrings'],
    'Barbell',
    'Zet de stang stevig op je bovenrug, breng je heupen gecontroleerd omlaag en duw de vloer weg.',
  ],
  [
    'Front Squat',
    'compound',
    'quadriceps',
    ['glutes', 'core'],
    'Barbell',
    'Houd de ellebogen hoog, zak recht tussen je heupen en behoud spanning in je romp.',
  ],
  [
    'Bench Press',
    'compound',
    'chest',
    ['triceps', 'shoulders'],
    'Barbell',
    'Plant je voeten, trek de schouderbladen samen en laat de stang beheerst naar de borst zakken.',
  ],
  [
    'Incline Bench Press',
    'compound',
    'chest',
    ['shoulders', 'triceps'],
    'Barbell',
    'Gebruik een lichte hellingshoek en druk de stang vanuit de bovenborst omhoog.',
  ],
  [
    'Overhead Press',
    'compound',
    'shoulders',
    ['triceps', 'core'],
    'Barbell',
    'Span billen en buik aan en druk de stang in een rechte lijn boven het hoofd.',
  ],
  [
    'Deadlift',
    'compound',
    'hamstrings',
    ['glutes', 'back'],
    'Barbell',
    'Zet de stang boven de middenvoet, bouw spanning op en strek heupen en knieën tegelijk.',
  ],
  [
    'Romanian Deadlift',
    'compound',
    'hamstrings',
    ['glutes', 'back'],
    'Barbell',
    'Duw de heupen naar achteren met zachte knieën en houd de stang dicht langs de benen.',
  ],
  [
    'Barbell Row',
    'compound',
    'back',
    ['biceps', 'hamstrings'],
    'Barbell',
    'Scharnier voorover en trek de stang richting onderribben zonder je romp op te richten.',
  ],
  [
    'Dumbbell Row',
    'accessory',
    'back',
    ['biceps'],
    'Dumbbell',
    'Steun stabiel af en trek de dumbbell richting je heup met een neutrale rug.',
  ],
  [
    'Pull-up',
    'bodyweight',
    'back',
    ['biceps'],
    'Pull-up bar',
    'Start vanuit een actieve hang en trek je borst richting de stang.',
  ],
  [
    'Chin-up',
    'bodyweight',
    'back',
    ['biceps'],
    'Pull-up bar',
    'Gebruik een onderhandse greep en trek gecontroleerd op zonder te zwaaien.',
  ],
  [
    'Lat Pulldown',
    'machine',
    'back',
    ['biceps'],
    'Cable machine',
    'Trek de stang naar de bovenborst en houd de ribben laag.',
  ],
  [
    'Cable Row',
    'machine',
    'back',
    ['biceps'],
    'Cable machine',
    'Trek de handgreep naar je buik en pauzeer kort met samengeknepen schouderbladen.',
  ],
  [
    'Dip',
    'bodyweight',
    'triceps',
    ['chest', 'shoulders'],
    'Dip bars',
    'Zak met controle tot de bovenarmen ongeveer horizontaal zijn en druk krachtig uit.',
  ],
  [
    'Leg Press',
    'machine',
    'quadriceps',
    ['glutes'],
    'Leg press',
    'Plaats de voeten stabiel en laat het platform zakken zolang je onderrug contact houdt.',
  ],
  [
    'Leg Curl',
    'isolation',
    'hamstrings',
    [],
    'Machine',
    'Buig de knieën volledig en laat het gewicht langzaam terugzakken.',
  ],
  [
    'Leg Extension',
    'isolation',
    'quadriceps',
    [],
    'Machine',
    'Strek de knieën gecontroleerd en houd bovenin kort spanning.',
  ],
  [
    'Biceps Curl',
    'isolation',
    'biceps',
    [],
    'Dumbbell',
    'Houd de bovenarmen stil en buig de ellebogen zonder momentum.',
  ],
  [
    'Triceps Pushdown',
    'isolation',
    'triceps',
    [],
    'Cable machine',
    'Houd de ellebogen langs je zij en strek volledig uit.',
  ],
  [
    'Calf Raise',
    'isolation',
    'calves',
    [],
    'Machine',
    'Zak diep in de rek en kom gecontroleerd zo hoog mogelijk op de voorvoet.',
  ],
  [
    'Bulgarian Split Squat',
    'accessory',
    'quadriceps',
    ['glutes'],
    'Dumbbell',
    'Plaats één voet achter je op een bank en zak recht omlaag op het standbeen.',
  ],
  [
    'Plank',
    'bodyweight',
    'core',
    ['shoulders'],
    'Bodyweight',
    'Houd een rechte lijn van hoofd tot hak en span buik en billen actief aan.',
  ],
]

function exerciseId(name: string): ExerciseId {
  return asId<'ExerciseId'>(`exercise-${name.toLowerCase().replaceAll(' ', '-')}`)
}

export function createSeedExercises(): Exercise[] {
  return exerciseSeeds.map(
    ([name, category, primaryMuscle, secondaryMuscles, equipment, instructions]) => ({
      id: exerciseId(name),
      name,
      category,
      primaryMuscle,
      secondaryMuscles,
      equipment,
      instructions,
      custom: false,
      archived: false,
      createdAt,
      updatedAt: createdAt,
    }),
  )
}

const programId = asId<'ProgramId'>('program-full-body') as ProgramId

function makeTemplate(slug: string, name: string, order: number, names: string[]): WorkoutTemplate {
  const id = asId<'WorkoutTemplateId'>(`template-${slug}`) as WorkoutTemplateId
  return {
    id,
    programId,
    name,
    description: `Gebalanceerde full-bodytraining ${order + 1} met focus op techniek en progressieve overload.`,
    order,
    exercises: names.map((exerciseName, exerciseOrder) => ({
      id: `${id}-exercise-${exerciseOrder}`,
      exerciseId: exerciseId(exerciseName),
      order: exerciseOrder,
      defaultSets: exerciseOrder < 2 ? 3 : 2,
      minReps: exerciseName === 'Deadlift' ? 3 : exerciseOrder < 2 ? 5 : 8,
      maxReps: exerciseName === 'Deadlift' ? 5 : exerciseOrder < 2 ? 8 : 12,
      defaultRpe: 8,
      restSeconds: exerciseOrder < 2 ? 180 : 90,
      notes: exerciseOrder === 0 ? 'Bouw rustig op met twee warming-upsets.' : '',
    })),
    createdAt,
    updatedAt: createdAt,
  }
}

export const seedTemplates: WorkoutTemplate[] = [
  makeTemplate('day-a', 'Full Body A', 0, [
    'Back Squat',
    'Bench Press',
    'Pull-up',
    'Romanian Deadlift',
    'Dip',
  ]),
  makeTemplate('day-b', 'Full Body B', 1, [
    'Deadlift',
    'Overhead Press',
    'Barbell Row',
    'Front Squat',
    'Pull-up',
  ]),
  makeTemplate('day-c', 'Full Body C', 2, [
    'Back Squat',
    'Incline Bench Press',
    'Lat Pulldown',
    'Romanian Deadlift',
    'Dip',
  ]),
]

export const seedProgram: Program = {
  id: programId,
  name: 'Full Body Fundamentals',
  description:
    'Drie sterke full-bodydagen met een slimme balans tussen kracht, spieropbouw en herstel.',
  trainingDays: 3,
  templateIds: seedTemplates.map((template) => template.id),
  status: 'active',
  createdAt,
  updatedAt: createdAt,
}

function baseWeight(name: string): number {
  return (
    {
      'Back Squat': 75,
      'Front Squat': 58,
      'Bench Press': 62.5,
      'Incline Bench Press': 50,
      'Overhead Press': 37.5,
      Deadlift: 100,
      'Romanian Deadlift': 72.5,
      'Barbell Row': 55,
      'Lat Pulldown': 52.5,
      'Pull-up': 0,
      Dip: 0,
    }[name] ?? 30
  )
}

function makeWorkoutExercise(
  templateExercise: WorkoutTemplate['exercises'][number],
  name: string,
  progression: number,
  completedAt: string,
): WorkoutExercise {
  return {
    id: createId<'WorkoutExerciseId'>(),
    exerciseId: templateExercise.exerciseId,
    exerciseName: name,
    order: templateExercise.order,
    restSeconds: templateExercise.restSeconds ?? 90,
    notes: '',
    skipped: false,
    sets: Array.from({ length: templateExercise.defaultSets }, (_, index) => ({
      id: createId<'WorkoutSetId'>(),
      setNumber: index + 1,
      type: 'working' as const,
      weightKg: Math.max(0, baseWeight(name) + progression * (name === 'Deadlift' ? 2.5 : 1.25)),
      reps: Math.max(templateExercise.minReps, templateExercise.maxReps - (index % 2)),
      rpe: Math.min(9.5, 7.5 + index * 0.5 + progression * 0.1),
      completed: true,
      completedAt,
      notes: '',
    })),
  }
}

export function createSeedWorkouts(): Workout[] {
  return Array.from({ length: 8 }, (_, historyIndex) => {
    const template = seedTemplates[(7 - historyIndex) % seedTemplates.length]!
    const end = subDays(new Date(), 3 + historyIndex * 5)
    end.setHours(18, 15, 0, 0)
    const start = subMinutes(end, 58 + (historyIndex % 3) * 5)
    const workout: Workout = {
      id: createId<'WorkoutId'>(),
      programId,
      templateId: template.id,
      name: template.name,
      status: 'completed',
      startedAt: start.toISOString(),
      completedAt: end.toISOString(),
      durationSeconds: Math.round((end.getTime() - start.getTime()) / 1000),
      notes:
        historyIndex === 0
          ? 'Sterke training. Volgende keer de laatste squatset met één extra rep proberen.'
          : '',
      exercises: template.exercises.map((item) =>
        makeWorkoutExercise(
          item,
          createSeedExercises().find((exercise) => exercise.id === item.exerciseId)?.name ??
            'Oefening',
          7 - historyIndex,
          end.toISOString(),
        ),
      ),
      totalVolumeKg: 0,
      personalRecordIds: [],
      createdAt: start.toISOString(),
      updatedAt: end.toISOString(),
    }
    workout.totalVolumeKg = workoutVolume(workout)
    return workout
  }).sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}

function createSeedRecords(workouts: Workout[]): PersonalRecord[] {
  const newest = workouts[0]!
  return newest.exercises.slice(0, 3).flatMap((exercise) => {
    const bestSet = [...exercise.sets].sort((a, b) => b.weightKg - a.weightKg)[0]!
    const estimated = estimatedOneRepMax(bestSet.weightKg, bestSet.reps) ?? bestSet.weightKg
    const maxWeightRecord: PersonalRecord = {
      id: createId<'PersonalRecordId'>(),
      exerciseId: exercise.exerciseId,
      workoutId: newest.id,
      workoutSetId: bestSet.id,
      recordType: 'maxWeight',
      value: bestSet.weightKg,
      previousValue: Math.max(0, bestSet.weightKg - 1.25),
      achievedAt: newest.completedAt!,
    }
    const e1rmRecord: PersonalRecord = {
      id: createId<'PersonalRecordId'>(),
      exerciseId: exercise.exerciseId,
      workoutId: newest.id,
      workoutSetId: bestSet.id,
      recordType: 'estimated1RM',
      value: estimated,
      previousValue: estimated * 0.98,
      achievedAt: newest.completedAt!,
    }
    return [maxWeightRecord, e1rmRecord]
  })
}

export const defaultSettings: UserSettings = {
  id: 'user-settings',
  theme: 'system',
  weightUnit: 'kg',
  defaultRestSeconds: 120,
  autoStartRestTimer: true,
  includeWarmupsInVolume: false,
  confirmSetDeletion: true,
  restTimerEndsAt: null,
  restTimerPausedRemaining: null,
  updatedAt: createdAt,
}

export async function seedDatabase(force = false): Promise<void> {
  if (!force && localStorage.getItem('gba-skip-seed') === 'true') return
  if (force) localStorage.removeItem('gba-skip-seed')
  if (!force && (await db.exercises.count()) > 0) return
  const workouts = createSeedWorkouts()
  const records = createSeedRecords(workouts)
  const newest = workouts[0]
  if (newest) newest.personalRecordIds = records.map((record) => record.id)

  await db.transaction(
    'rw',
    [db.exercises, db.programs, db.workoutTemplates, db.workouts, db.personalRecords, db.settings],
    async () => {
      if (force) {
        await Promise.all([
          db.exercises.clear(),
          db.programs.clear(),
          db.workoutTemplates.clear(),
          db.workouts.clear(),
          db.personalRecords.clear(),
          db.settings.clear(),
        ])
      }
      await db.exercises.bulkPut(createSeedExercises())
      await db.programs.put(seedProgram)
      await db.workoutTemplates.bulkPut(seedTemplates)
      await db.workouts.bulkPut(workouts)
      await db.personalRecords.bulkPut(records)
      await db.settings.put({ ...defaultSettings, updatedAt: new Date().toISOString() })
    },
  )
}
