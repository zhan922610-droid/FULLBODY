import { DayProgram, Exercise } from './types';

export const PROGRAM: DayProgram[] = [
  {
    id: 1,
    name: 'День 1',
    exercises: [
      { id: 'd1e1', name: 'Тяга верхнего блока широким хватом', muscleGroup: 'Широчайшие мышцы спины', reps: '6–10', sets: 3, specialType: 'normal' },
      { id: 'd1e2', name: 'Махи с гантелями сидя', muscleGroup: 'Плечи', reps: '10–15', sets: 3, specialType: 'normal' },
      { id: 'd1e3', name: 'Жим гантелей на наклонной скамье', muscleGroup: 'Грудные мышцы', reps: '5–8', sets: 3, specialType: 'normal' },
      { id: 'd1e4', name: 'Тяга горизонтального блока одной рукой', muscleGroup: 'Широчайшие мышцы спины', reps: '6–10', sets: 3, specialType: 'normal' },
      { id: 'd1e5', name: 'Сгибание рук на наклонной скамье', muscleGroup: 'Бицепс', reps: '8–12', sets: 3, specialType: 'normal' },
      { id: 'd1e6', name: 'Разгибание рук на блоке одной рукой', muscleGroup: 'Трицепс', reps: '8–12', sets: 3, specialType: 'normal' },
      { id: 'd1e7', name: 'Болгарские выпады с гантелями', muscleGroup: 'Квадрицепсы и ягодичные мышцы', reps: '6–8', sets: 3, specialType: 'normal' },
      { id: 'd1e8', name: 'Скручивания на босу-болле', muscleGroup: 'Пресс', reps: '10–20', sets: 3, specialType: 'normal' },
      { id: 'd1e9', name: 'Икроножные стоя в Смите', muscleGroup: 'Икры', reps: '6–12', sets: 3, specialType: 'normal' },
      { id: 'd1e10', name: 'Сгибание кисти с гантелью', muscleGroup: 'Предплечья', reps: '8–12', sets: 3, specialType: 'normal' },
    ]
  },
  {
    id: 2,
    name: 'День 2',
    exercises: [
      { id: 'd2e1', name: 'Отжимания на брусьях', muscleGroup: 'Грудные мышцы', reps: '4–8', sets: 2, specialType: 'normal' },
      { id: 'd2e2', name: 'Тяга горизонтального блока', muscleGroup: 'Трапеции', reps: '6–10', sets: 3, specialType: 'normal' },
      { id: 'd2e3', name: 'Сгибание ног сидя', muscleGroup: 'Задняя поверхность бедра', reps: '8–12', sets: 3, specialType: 'normal' },
      { id: 'd2e4', name: 'Жим гантелей сидя', muscleGroup: 'Плечи', reps: '6–12', sets: 2, specialType: 'normal' },
      { id: 'd2e5', name: 'Пуловер в тренажёре', muscleGroup: 'Широчайшие мышцы спины', reps: '8–14', sets: 3, specialType: 'normal' },
      { id: 'd2e6', name: 'Молотки на блоке', muscleGroup: 'Бицепс', reps: '10–15', sets: 3, specialType: 'normal' },
      { id: 'd2e7', name: 'Разгибание рук над головой на блоке', muscleGroup: 'Трицепс', reps: '10–15', sets: 3, specialType: 'normal' },
      { id: 'd2e8', name: 'Икры в тренажёре', muscleGroup: 'Икроножные мышцы', reps: '6–15', sets: 1, specialType: 'myoreps',
        myoRepsConfig: { activationReps: 15, miniSets: 4, restBetweenMiniSets: 5 }
      },
    ]
  },
  {
    id: 3,
    name: 'День 3',
    exercises: [
      { id: 'd3e1', name: 'Тяга вертикального блока одной рукой', muscleGroup: 'Широчайшие мышцы спины', reps: '6–10', sets: 3, specialType: 'normal' },
      { id: 'd3e2', name: 'Разгибание кисти', muscleGroup: 'Предплечья', reps: '8–15', sets: 3, specialType: 'normal' },
      { id: 'd3e3', name: 'Разгибание ног сидя', muscleGroup: 'Квадрицепсы', reps: '6–10', sets: 3, specialType: 'normal' },
      { id: 'd3e4', name: 'Сведение рук в тренажёре-бабочке', muscleGroup: 'Грудные мышцы', reps: '10–15', sets: 2, specialType: 'normal' },
      { id: 'd3e5', name: 'Обратная бабочка', muscleGroup: 'Задние дельты', reps: '8–12', sets: 2, specialType: 'normal' },
      { id: 'd3e6', name: 'Румынская тяга со штангой', muscleGroup: 'Ягодичные мышцы и задняя поверхность бедра', reps: '5–8', sets: 2, specialType: 'normal' },
      { id: 'd3e7', name: 'Махи на блоке', muscleGroup: 'Плечи', reps: '10–15', sets: 3, specialType: 'normal' },
      { id: 'd3e8', name: 'Скручивания в тренажёре', muscleGroup: 'Пресс', reps: '8–20', sets: 1, specialType: 'dropset',
        dropSetConfig: { stages: 4, weightDropPercent: 20 }
      },
    ]
  }
];

export function getExerciseById(exerciseId: string): Exercise | undefined {
  for (const day of PROGRAM) {
    const ex = day.exercises.find(e => e.id === exerciseId);
    if (ex) return ex;
  }
  return undefined;
}

export function getDayById(dayId: number): DayProgram | undefined {
  return PROGRAM.find(d => d.id === dayId);
}
