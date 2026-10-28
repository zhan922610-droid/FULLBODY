import { useState, useEffect, useCallback } from 'react';
import { ActiveWorkout, Settings, ExerciseResult, SetResult, MyoRepsResult, DropSetResult, WorkoutSession } from '../types';
import { getDayById } from '../program';
import { getLastExerciseResult } from '../db';
import RestTimer from './RestTimer';

interface Props {
  activeWorkout: ActiveWorkout;
  settings: Settings;
  onComplete: (session: WorkoutSession) => void;
  onAbandon: () => void;
  onUpdate: (workout: ActiveWorkout) => void;
  onGoHome: () => void;
}

export default function WorkoutExercise({ activeWorkout, settings, onComplete, onAbandon, onUpdate, onGoHome }: Props) {
  const day = getDayById(activeWorkout.dayId);
  const [currentIdx, setCurrentIdx] = useState(activeWorkout.currentExerciseIndex);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [lastResults, setLastResults] = useState<{ sets: { weight: number; reps: number }[] } | null>(null);
  const [workoutNote, setWorkoutNote] = useState(activeWorkout.note || '');

  const exercise = day?.exercises[currentIdx];
  const totalExercises = day?.exercises.length || 0;
  const isDark = settings.theme === 'dark';

  // Get or create exercise result
  const getExerciseResult = useCallback((): ExerciseResult => {
    const existing = activeWorkout.exercises[currentIdx];
    if (existing) return existing;

    if (!exercise) return { exerciseId: '', exerciseName: '', muscleGroup: '', sets: [], skipped: false, completed: false };

    const sets: SetResult[] = [];
    if (exercise.specialType === 'normal') {
      for (let i = 0; i < exercise.sets; i++) {
        sets.push({ weight: 0, reps: 0, completed: false });
      }
    }

    const result: ExerciseResult = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets,
      skipped: false,
      completed: false,
    };

    if (exercise.specialType === 'myoreps') {
      result.myoReps = {
        activationWeight: 0,
        activationReps: exercise.myoRepsConfig?.activationReps || 15,
        miniSets: Array.from({ length: exercise.myoRepsConfig?.miniSets || 4 }, () => ({ reps: 0, completed: false })),
        completed: false,
      };
    }

    if (exercise.specialType === 'dropset') {
      result.dropSet = {
        stages: Array.from({ length: exercise.dropSetConfig?.stages || 4 }, () => ({ weight: 0, reps: 0, completed: false })),
        completed: false,
      };
    }

    return result;
  }, [activeWorkout.exercises, currentIdx, exercise]);

  const [exerciseResult, setExerciseResult] = useState<ExerciseResult>(() => {
    const existing = activeWorkout.exercises[activeWorkout.currentExerciseIndex];
    if (existing) return existing;
    const ex = day?.exercises[activeWorkout.currentExerciseIndex];
    if (!ex) return { exerciseId: '', exerciseName: '', muscleGroup: '', sets: [], skipped: false, completed: false };
    
    const sets: SetResult[] = ex.specialType === 'normal' 
      ? Array.from({ length: ex.sets }, () => ({ weight: 0, reps: 0, completed: false }))
      : [];
    
    const r: ExerciseResult = { exerciseId: ex.id, exerciseName: ex.name, muscleGroup: ex.muscleGroup, sets, skipped: false, completed: false };
    if (ex.specialType === 'myoreps') {
      r.myoReps = { activationWeight: 0, activationReps: ex.myoRepsConfig?.activationReps || 15, miniSets: Array.from({ length: ex.myoRepsConfig?.miniSets || 4 }, () => ({ reps: 0, completed: false })), completed: false };
    }
    if (ex.specialType === 'dropset') {
      r.dropSet = { stages: Array.from({ length: ex.dropSetConfig?.stages || 4 }, () => ({ weight: 0, reps: 0, completed: false })), completed: false };
    }
    return r;
  });

  

  // Load exercise data when index changes
  useEffect(() => {
    if (!exercise) return;
    
    const existing = activeWorkout.exercises[currentIdx];
    if (existing) {
      setExerciseResult(existing);
    } else {
      const newResult = getExerciseResult();
      setExerciseResult(newResult);
    }

    // Load last results for auto-fill (only for new exercises)
    if (!existing && exercise.specialType === 'normal') {
      getLastExerciseResult(exercise.id).then(r => {
        setLastResults(r);
        if (r) {
          setExerciseResult(prev => {
            const newSets = [...prev.sets];
            r.sets.forEach((lr, i) => {
              if (i < newSets.length) {
                newSets[i] = { ...newSets[i], weight: lr.weight, reps: lr.reps };
              }
            });
            return { ...prev, sets: newSets };
          });
        }
      });
    } else if (!existing) {
      setLastResults(null);
    } else {
      // Load last results for display
      getLastExerciseResult(exercise.id).then(r => setLastResults(r));
    }
  }, [currentIdx]);

  // Save progress to parent
  const saveProgress = useCallback((result: ExerciseResult) => {
    const newExercises = [...activeWorkout.exercises];
    newExercises[currentIdx] = result;
    const updated = { ...activeWorkout, currentExerciseIndex: currentIdx, exercises: newExercises, note: workoutNote };
    onUpdate(updated);
  }, [activeWorkout, currentIdx, onUpdate, workoutNote]);

  const updateSet = (setIndex: number, field: 'weight' | 'reps', value: number) => {
    const newSets = [...exerciseResult.sets];
    newSets[setIndex] = { ...newSets[setIndex], [field]: Math.max(0, value) };
    const updated = { ...exerciseResult, sets: newSets };
    setExerciseResult(updated);
    saveProgress(updated);
  };

  const completeSet = (setIndex: number) => {
    const newSets = [...exerciseResult.sets];
    newSets[setIndex] = { ...newSets[setIndex], completed: true };
    const updated = { ...exerciseResult, sets: newSets };
    setExerciseResult(updated);
    saveProgress(updated);
    setShowRestTimer(true);
  };

  const skipExercise = () => {
    const updated = { ...exerciseResult, skipped: true, completed: true };
    setExerciseResult(updated);
    saveProgress(updated);
    goToNext();
  };

  const goToNext = () => {
    if (currentIdx < totalExercises - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setShowSummary(true);
    }
  };

  const goToPrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const finishWorkout = () => {
    const allExercises: ExerciseResult[] = [];
    
    if (day) {
      for (let i = 0; i < day.exercises.length; i++) {
        const exResult = i === currentIdx 
          ? { ...exerciseResult, completed: true }
          : activeWorkout.exercises[i];
        
        if (exResult) {
          allExercises.push(exResult);
        } else {
          const ex = day.exercises[i];
          allExercises.push({
            exerciseId: ex.id,
            exerciseName: ex.name,
            muscleGroup: ex.muscleGroup,
            sets: ex.specialType === 'normal' ? Array.from({ length: ex.sets }, () => ({ weight: 0, reps: 0, completed: false })) : [],
            skipped: true,
            completed: false,
          });
        }
      }
    }

    const session: WorkoutSession = {
      id: `session_${Date.now()}`,
      dayId: activeWorkout.dayId,
      dayName: activeWorkout.dayName,
      startTime: activeWorkout.startTime,
      endTime: Date.now(),
      duration: Date.now() - activeWorkout.startTime,
      exercises: allExercises,
      completed: true,
      note: workoutNote,
    };
    onComplete(session);
  };

  if (!exercise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Упражнение не найдено</p>
        <button onClick={onGoHome} className="ml-4 text-emerald-400">Назад</button>
      </div>
    );
  }

  const progress = ((currentIdx + 1) / totalExercises) * 100;

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#1a1a2e]' : 'bg-gray-50'} safe-top`}>
      {/* Rest Timer Modal */}
      {showRestTimer && (
        <RestTimer
          duration={settings.restTime}
          onComplete={() => setShowRestTimer(false)}
          settings={settings}
        />
      )}

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className={`${isDark ? 'bg-[#252547]' : 'bg-white'} rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto`}>
            <h2 className="text-xl font-bold mb-4 text-emerald-400">🏆 Итог тренировки</h2>
            <div className="space-y-2 mb-4">
              {day?.exercises.map((ex, i) => {
                const res = i === currentIdx ? { ...exerciseResult, completed: true } : activeWorkout.exercises[i];
                return (
                  <div key={ex.id} className={`text-sm ${res?.skipped ? 'text-gray-500 line-through' : res?.completed ? 'text-emerald-400' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {ex.name}: {res?.skipped ? 'пропущено' : res?.completed ? '✓' : '—'}
                  </div>
                );
              })}
            </div>
            <textarea
              value={workoutNote}
              onChange={e => setWorkoutNote(e.target.value)}
              placeholder="Заметка к тренировке (необязательно)"
              className={`w-full p-3 rounded-xl mb-4 ${isDark ? 'bg-[#1a1a2e] text-white' : 'bg-gray-100 text-gray-900'} text-sm`}
              rows={2}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowSummary(false)} className={`flex-1 py-3 rounded-xl border ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-600'} font-semibold`}>
                Назад
              </button>
              <button onClick={finishWorkout} className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl active:bg-emerald-600">
                Завершить ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className={`px-4 pt-4 pb-2 ${isDark ? 'bg-[#16162a]' : 'bg-white'} safe-top shrink-0`}>
        <div className="flex items-center justify-between mb-2">
          <button onClick={onGoHome} className="text-gray-400 p-2 -ml-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="text-center">
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{activeWorkout.dayName}</div>
            <div className={`text-sm font-semibold`}>Упражнение {currentIdx + 1} из {totalExercises}</div>
          </div>
          <button onClick={() => { if (confirm('Прервать тренировку? Несохранённые данные будут потеряны.')) onAbandon(); }} className="text-red-400 p-2 -mr-2 text-sm font-bold">
            ✕
          </button>
        </div>
        {/* Progress bar */}
        <div className={`h-1.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Exercise content */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Exercise name */}
        <h2 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{exercise.name}</h2>
        <p className="text-emerald-400 text-sm mb-1">{exercise.muscleGroup}</p>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          План: {exercise.sets} × {exercise.reps} повторений
          {exercise.specialType === 'myoreps' && ' • Миорепс'}
          {exercise.specialType === 'dropset' && ' • Дроп-сет'}
        </p>

        {/* Last results */}
        {lastResults && lastResults.sets.length > 0 && (
          <div className={`${isDark ? 'bg-[#252547]/70' : 'bg-blue-50'} rounded-xl p-3 mb-4`}>
            <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-blue-600'}`}>Прошлый раз:</p>
            <div className="flex flex-wrap gap-2">
              {lastResults.sets.map((s, i) => (
                <span key={i} className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-blue-700'}`}>
                  {s.weight}кг × {s.reps}{i < lastResults.sets.length - 1 ? ',' : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Normal sets */}
        {exercise.specialType === 'normal' && (
          <div className="space-y-3">
            {exerciseResult.sets.map((set, i) => (
              <div key={i} className={`${isDark ? 'bg-[#252547]' : 'bg-white shadow-sm'} rounded-xl p-4 ${set.completed ? 'border border-emerald-500/30' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${set.completed ? 'bg-emerald-500 text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                    {set.completed ? '✓' : i + 1}
                  </div>
                  
                  {/* Weight */}
                  <div className="flex-1">
                    <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Вес (кг)</label>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateSet(i, 'weight', set.weight - settings.weightStep)} className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${isDark ? 'bg-gray-700 active:bg-gray-600' : 'bg-gray-100 active:bg-gray-200'}`}>−</button>
                      <input
                        type="number"
                        value={set.weight || ''}
                        onChange={e => updateSet(i, 'weight', parseFloat(e.target.value) || 0)}
                        className={`w-16 text-center text-lg font-bold py-2 rounded-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} border-0`}
                        step={settings.weightStep}
                        inputMode="decimal"
                      />
                      <button onClick={() => updateSet(i, 'weight', set.weight + settings.weightStep)} className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${isDark ? 'bg-gray-700 active:bg-gray-600' : 'bg-gray-100 active:bg-gray-200'}`}>+</button>
                    </div>
                  </div>

                  {/* Reps */}
                  <div className="flex-1">
                    <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Повторы</label>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateSet(i, 'reps', set.reps - 1)} className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${isDark ? 'bg-gray-700 active:bg-gray-600' : 'bg-gray-100 active:bg-gray-200'}`}>−</button>
                      <input
                        type="number"
                        value={set.reps || ''}
                        onChange={e => updateSet(i, 'reps', parseInt(e.target.value) || 0)}
                        className={`w-14 text-center text-lg font-bold py-2 rounded-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} border-0`}
                        inputMode="numeric"
                      />
                      <button onClick={() => updateSet(i, 'reps', set.reps + 1)} className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${isDark ? 'bg-gray-700 active:bg-gray-600' : 'bg-gray-100 active:bg-gray-200'}`}>+</button>
                    </div>
                  </div>
                </div>

                {/* Complete button */}
                {!set.completed && (
                  <button
                    onClick={() => completeSet(i)}
                    disabled={set.weight === 0 && set.reps === 0}
                    className="w-full mt-3 bg-emerald-500 text-white font-semibold py-3 rounded-xl active:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Подход выполнен ✓
                  </button>
                )}
                {set.completed && (
                  <div className="w-full mt-3 text-center text-emerald-400 font-semibold py-2">
                    ✓ Выполнен
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* MyoReps */}
        {exercise.specialType === 'myoreps' && exerciseResult.myoReps && (
          <MyoRepsView
            result={exerciseResult.myoReps}
            config={exercise.myoRepsConfig || settings.myoRepsConfig}
            isDark={isDark}
            weightStep={settings.weightStep}
            onUpdate={(updated) => {
              const newResult = { ...exerciseResult, myoReps: updated };
              setExerciseResult(newResult);
              saveProgress(newResult);
            }}
            onComplete={() => {
              const updated = { ...exerciseResult.myoReps!, completed: true };
              const newResult = { ...exerciseResult, myoReps: updated, completed: true };
              setExerciseResult(newResult);
              saveProgress(newResult);
              setShowRestTimer(true);
            }}
          />
        )}

        {/* DropSet */}
        {exercise.specialType === 'dropset' && exerciseResult.dropSet && (
          <DropSetView
            result={exerciseResult.dropSet}
            config={exercise.dropSetConfig!}
            isDark={isDark}
            weightStep={settings.weightStep}
            onUpdate={(updated) => {
              const newResult = { ...exerciseResult, dropSet: updated };
              setExerciseResult(newResult);
              saveProgress(newResult);
            }}
            onComplete={() => {
              const updated = { ...exerciseResult.dropSet!, completed: true };
              const newResult = { ...exerciseResult, dropSet: updated, completed: true };
              setExerciseResult(newResult);
              saveProgress(newResult);
            }}
          />
        )}

        {/* Exercise note */}
        <div className="mt-4">
          <input
            type="text"
            value={exerciseResult.note || ''}
            onChange={e => {
              const updated = { ...exerciseResult, note: e.target.value };
              setExerciseResult(updated);
              saveProgress(updated);
            }}
            placeholder="Заметка к упражнению..."
            className={`w-full p-3 rounded-xl text-sm ${isDark ? 'bg-[#252547] text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400 shadow-sm'}`}
          />
        </div>
      </div>

      {/* Bottom navigation */}
      <div className={`px-4 py-3 ${isDark ? 'bg-[#16162a]' : 'bg-white border-t border-gray-200'} safe-bottom shrink-0`}>
        <div className="flex gap-2">
          <button onClick={goToPrev} disabled={currentIdx === 0} className={`px-4 py-3 rounded-xl font-semibold ${currentIdx === 0 ? 'opacity-30' : ''} ${isDark ? 'bg-gray-700 active:bg-gray-600' : 'bg-gray-100 active:bg-gray-200'}`}>
            ←
          </button>
          <button onClick={skipExercise} className={`px-4 py-3 rounded-xl font-semibold ${isDark ? 'bg-gray-700 active:bg-gray-600 text-gray-300' : 'bg-gray-100 active:bg-gray-200 text-gray-600'}`}>
            Пропустить
          </button>
          <button
            onClick={goToNext}
            className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl active:bg-emerald-600"
          >
            {currentIdx < totalExercises - 1 ? 'Далее →' : 'Завершить ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}

// MyoReps sub-component
function MyoRepsView({ result, config, isDark, weightStep, onUpdate, onComplete }: {
  result: MyoRepsResult;
  config: { activationReps: number; miniSets: number; restBetweenMiniSets: number };
  isDark: boolean;
  weightStep: number;
  onUpdate: (r: MyoRepsResult) => void;
  onComplete: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className={`${isDark ? 'bg-[#252547]' : 'bg-white shadow-sm'} rounded-xl p-4 border border-amber-500/30`}>
        <p className="text-amber-400 text-xs font-semibold mb-2">🔥 МИОРЕПС</p>
        <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Активационный подход: {config.activationReps} повт. → Отдых {config.restBetweenMiniSets}с → {config.miniSets} мини-подхода
        </p>
        
        {/* Activation set */}
        <div className="mb-3">
          <label className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Активация</label>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <button onClick={() => onUpdate({ ...result, activationWeight: Math.max(0, result.activationWeight - weightStep) })} className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${isDark ? 'bg-gray-700 active:bg-gray-600' : 'bg-gray-100'}`}>−</button>
              <input type="number" value={result.activationWeight || ''} onChange={e => onUpdate({ ...result, activationWeight: parseFloat(e.target.value) || 0 })} className={`w-16 text-center text-lg font-bold py-1 rounded-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} inputMode="decimal" />
              <button onClick={() => onUpdate({ ...result, activationWeight: result.activationWeight + weightStep })} className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${isDark ? 'bg-gray-700 active:bg-gray-600' : 'bg-gray-100'}`}>+</button>
            </div>
            <span className="text-gray-400">×</span>
            <input type="number" value={result.activationReps || ''} onChange={e => onUpdate({ ...result, activationReps: parseInt(e.target.value) || 0 })} className={`w-14 text-center text-lg font-bold py-1 rounded-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} inputMode="numeric" />
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>повт.</span>
          </div>
        </div>

        {/* Mini sets */}
        <div className="space-y-2">
          {result.miniSets.map((ms, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`text-xs w-14 shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Мини {i + 1}</span>
              <input type="number" value={ms.reps || ''} onChange={e => {
                const newMini = [...result.miniSets];
                newMini[i] = { ...newMini[i], reps: parseInt(e.target.value) || 0 };
                onUpdate({ ...result, miniSets: newMini });
              }} className={`w-14 text-center font-bold py-1 rounded-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} inputMode="numeric" />
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>повт.</span>
              <button onClick={() => {
                const newMini = [...result.miniSets];
                newMini[i] = { ...newMini[i], completed: true };
                onUpdate({ ...result, miniSets: newMini });
              }} className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold ${ms.completed ? 'bg-emerald-500 text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                {ms.completed ? '✓' : 'Готов'}
              </button>
            </div>
          ))}
        </div>

        {!result.completed && (
          <button onClick={onComplete} className="w-full mt-4 bg-amber-500 text-white font-semibold py-3 rounded-xl active:bg-amber-600">
            Миорепс выполнен ✓
          </button>
        )}
      </div>
    </div>
  );
}

// DropSet sub-component
function DropSetView({ result, config, isDark, weightStep, onUpdate, onComplete }: {
  result: DropSetResult;
  config: { stages: number; weightDropPercent: number };
  isDark: boolean;
  weightStep: number;
  onUpdate: (r: DropSetResult) => void;
  onComplete: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className={`${isDark ? 'bg-[#252547]' : 'bg-white shadow-sm'} rounded-xl p-4 border border-purple-500/30`}>
        <p className="text-purple-400 text-xs font-semibold mb-2">💥 ДРОП-СЕТ</p>
        <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {config.stages} этапов, сброс веса {config.weightDropPercent}% каждый этап
        </p>

        <div className="space-y-3">
          {result.stages.map((stage, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`text-xs w-14 shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Этап {i + 1}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => {
                  const newStages = [...result.stages];
                  newStages[i] = { ...newStages[i], weight: Math.max(0, newStages[i].weight - weightStep) };
                  onUpdate({ ...result, stages: newStages });
                }} className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isDark ? 'bg-gray-700 active:bg-gray-600' : 'bg-gray-100'}`}>−</button>
                <input type="number" value={stage.weight || ''} onChange={e => {
                  const newStages = [...result.stages];
                  newStages[i] = { ...newStages[i], weight: parseFloat(e.target.value) || 0 };
                  onUpdate({ ...result, stages: newStages });
                }} className={`w-14 text-center font-bold py-1 rounded-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} inputMode="decimal" />
                <button onClick={() => {
                  const newStages = [...result.stages];
                  newStages[i] = { ...newStages[i], weight: newStages[i].weight + weightStep };
                  onUpdate({ ...result, stages: newStages });
                }} className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isDark ? 'bg-gray-700 active:bg-gray-600' : 'bg-gray-100'}`}>+</button>
              </div>
              <span className="text-gray-400">×</span>
              <input type="number" value={stage.reps || ''} onChange={e => {
                const newStages = [...result.stages];
                newStages[i] = { ...newStages[i], reps: parseInt(e.target.value) || 0 };
                onUpdate({ ...result, stages: newStages });
              }} className={`w-12 text-center font-bold py-1 rounded-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} inputMode="numeric" />
              <button onClick={() => {
                const newStages = [...result.stages];
                newStages[i] = { ...newStages[i], completed: true };
                onUpdate({ ...result, stages: newStages });
              }} className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold ${stage.completed ? 'bg-emerald-500 text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                {stage.completed ? '✓' : 'Готов'}
              </button>
            </div>
          ))}
        </div>

        {!result.completed && (
          <button onClick={onComplete} className="w-full mt-4 bg-purple-500 text-white font-semibold py-3 rounded-xl active:bg-purple-600">
            Дроп-сет выполнен ✓
          </button>
        )}
      </div>
    </div>
  );
}
