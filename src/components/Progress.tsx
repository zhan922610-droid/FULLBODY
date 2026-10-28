import { useState, useMemo } from 'react';
import { WorkoutSession } from '../types';
import { PROGRAM } from '../program';

interface Props {
  history: WorkoutSession[];
  onBack: () => void;
}

export default function ProgressView({ history }: Props) {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const completedHistory = history.filter(h => h.completed);

  // Get all exercises with their results over time
  const exerciseProgress = useMemo(() => {
    const map = new Map<string, { name: string; muscleGroup: string; data: { date: number; weight: number; reps: number; volume: number }[] }>();
    
    for (const session of completedHistory.sort((a, b) => a.startTime - b.startTime)) {
      for (const ex of session.exercises) {
        if (ex.skipped || !ex.sets || ex.sets.length === 0) continue;
        const completedSets = ex.sets.filter(s => s.completed);
        if (completedSets.length === 0) continue;

        const maxWeight = Math.max(...completedSets.map(s => s.weight));
        const totalReps = completedSets.reduce((sum, s) => sum + s.reps, 0);
        const volume = completedSets.reduce((sum, s) => sum + s.weight * s.reps, 0);

        if (!map.has(ex.exerciseId)) {
          map.set(ex.exerciseId, { name: ex.exerciseName, muscleGroup: ex.muscleGroup, data: [] });
        }
        map.get(ex.exerciseId)!.data.push({
          date: session.startTime,
          weight: maxWeight,
          reps: totalReps,
          volume
        });
      }
    }
    return map;
  }, [completedHistory]);

  // Weekly stats
  const weeklyStats = useMemo(() => {
    const now = Date.now();
    const weeks: { label: string; count: number; volume: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
      const weekEnd = now - i * 7 * 24 * 60 * 60 * 1000;
      const weekSessions = completedHistory.filter(s => s.startTime >= weekStart && s.startTime < weekEnd);
      const volume = weekSessions.reduce((sum, s) => {
        return sum + s.exercises.reduce((es, ex) => {
          if (ex.skipped) return es;
          return es + ex.sets.reduce((ss, set) => ss + (set.completed ? set.weight * set.reps : 0), 0);
        }, 0);
      }, 0);
      weeks.push({
        label: `Нед ${4 - i}`,
        count: weekSessions.length,
        volume
      });
    }
    return weeks;
  }, [completedHistory]);

  // Best results
  const bestResults = useMemo(() => {
    const bests: { exerciseId: string; name: string; maxWeight: number; maxVolume: number }[] = [];
    exerciseProgress.forEach((data, id) => {
      const maxWeight = Math.max(...data.data.map(d => d.weight));
      const maxVolume = Math.max(...data.data.map(d => d.volume));
      bests.push({ exerciseId: id, name: data.name, maxWeight, maxVolume });
    });
    return bests.sort((a, b) => b.maxVolume - a.maxVolume);
  }, [exerciseProgress]);

  const totalVolume = completedHistory.reduce((sum, s) => {
    return sum + s.exercises.reduce((es, ex) => {
      if (ex.skipped) return es;
      return es + ex.sets.reduce((ss, set) => ss + (set.completed ? set.weight * set.reps : 0), 0);
    }, 0);
  }, 0);

  if (completedHistory.length === 0) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto pb-24">
        <h2 className="text-2xl font-bold mb-4">📈 Прогресс</h2>
        <div className="text-center py-12">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-gray-400">Нет данных для анализа</p>
          <p className="text-sm text-gray-500 mt-1">Завершите несколько тренировок</p>
        </div>
      </div>
    );
  }

  // Exercise detail view
  if (selectedExercise && exerciseProgress.has(selectedExercise)) {
    const data = exerciseProgress.get(selectedExercise)!;
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto pb-24">
        <button onClick={() => setSelectedExercise(null)} className="text-emerald-400 mb-4 flex items-center gap-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Назад
        </button>
        <h2 className="text-xl font-bold mb-1">{data.name}</h2>
        <p className="text-sm text-gray-400 mb-4">{data.muscleGroup}</p>

        {/* Chart */}
        <div className="bg-[#252547] rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-400 mb-3">Динамика веса (макс.)</p>
          <div className="flex items-end gap-1 h-32">
            {data.data.map((d, i) => {
              const maxW = Math.max(...data.data.map(x => x.weight));
              const height = maxW > 0 ? (d.weight / maxW) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end">
                  <span className="text-xs text-gray-400 mb-1">{d.weight}</span>
                  <div className="w-full bg-emerald-500 rounded-t-sm" style={{ height: `${Math.max(height, 5)}%` }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Data table */}
        <div className="space-y-2">
          {data.data.slice().reverse().map((d, i) => (
            <div key={i} className="bg-[#252547] rounded-xl p-3 flex justify-between">
              <span className="text-sm text-gray-400">{new Date(d.date).toLocaleDateString('ru-RU')}</span>
              <div className="flex gap-4">
                <span className="text-sm font-semibold">{d.weight} кг</span>
                <span className="text-sm text-gray-400">{d.reps} повт.</span>
                <span className="text-sm text-emerald-400">{d.volume} кг</span>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison */}
        {data.data.length >= 2 && (
          <div className="bg-[#252547] rounded-xl p-4 mt-4">
            <p className="text-sm text-gray-400 mb-2">Сравнение последних двух</p>
            {(() => {
              const last = data.data[data.data.length - 1];
              const prev = data.data[data.data.length - 2];
              const weightDiff = last.weight - prev.weight;
              const volDiff = last.volume - prev.volume;
              return (
                <div className="flex justify-around">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Вес</p>
                    <p className={`font-bold ${weightDiff > 0 ? 'text-emerald-400' : weightDiff < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                      {weightDiff > 0 ? '+' : ''}{weightDiff} кг
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Объём</p>
                    <p className={`font-bold ${volDiff > 0 ? 'text-emerald-400' : volDiff < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                      {volDiff > 0 ? '+' : ''}{volDiff} кг
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto pb-24">
      <h2 className="text-2xl font-bold mb-4">📈 Прогресс</h2>

      {/* Overview stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#252547] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{completedHistory.length}</p>
          <p className="text-xs text-gray-400">Тренировок</p>
        </div>
        <div className="bg-[#252547] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{(totalVolume / 1000).toFixed(1)}т</p>
          <p className="text-xs text-gray-400">Общий тоннаж</p>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="bg-[#252547] rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-400 mb-3">Тренировки по неделям</p>
        <div className="flex items-end gap-3 h-24">
          {weeklyStats.map((w, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end">
              <span className="text-xs text-emerald-400 mb-1">{w.count}</span>
              <div className="w-full bg-emerald-500 rounded-t-sm" style={{ height: `${Math.max((w.count / 5) * 100, 8)}%` }} />
              <span className="text-xs text-gray-500 mt-1">{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Best results */}
      {bestResults.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">🏆 Лучшие результаты</h3>
          <div className="space-y-2">
            {bestResults.slice(0, 5).map(b => (
              <div key={b.exerciseId} className="bg-[#252547] rounded-xl p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{b.name}</p>
                  <p className="text-xs text-gray-400">Макс. объём: {b.maxVolume} кг</p>
                </div>
                <p className="text-lg font-bold text-emerald-400">{b.maxWeight} кг</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercise list for detail */}
      <div>
        <h3 className="font-semibold mb-3">📋 Упражнения</h3>
        <div className="space-y-2">
          {Array.from(exerciseProgress.entries()).map(([id, data]) => (
            <button
              key={id}
              onClick={() => setSelectedExercise(id)}
              className="w-full bg-[#252547] rounded-xl p-3 text-left active:bg-[#2d2d55]"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{data.name}</p>
                  <p className="text-xs text-gray-400">{data.data.length} записей</p>
                </div>
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
