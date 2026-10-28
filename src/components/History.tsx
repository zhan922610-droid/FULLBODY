import { useState } from 'react';
import { WorkoutSession } from '../types';

interface Props {
  history: WorkoutSession[];
  onBack: () => void;
}

export default function HistoryView({ history, onBack }: Props) {
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const isDark = true; // Default dark

  if (selectedSession) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto pb-24">
        <button onClick={() => setSelectedSession(null)} className="text-emerald-400 mb-4 flex items-center gap-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Назад к истории
        </button>

        <h2 className="text-xl font-bold mb-1">{selectedSession.dayName}</h2>
        <p className="text-sm text-gray-400 mb-4">
          {new Date(selectedSession.startTime).toLocaleString('ru-RU')} •
          {selectedSession.duration ? ` ${Math.round(selectedSession.duration / 60000)} мин` : ''}
        </p>

        {selectedSession.note && (
          <div className="bg-[#252547] rounded-xl p-3 mb-4">
            <p className="text-sm text-gray-300">📝 {selectedSession.note}</p>
          </div>
        )}

        <div className="space-y-3">
          {selectedSession.exercises.map((ex, i) => (
            <div key={i} className={`bg-[#252547] rounded-xl p-4 ${ex.skipped ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{ex.exerciseName}</p>
                  <p className="text-xs text-gray-400">{ex.muscleGroup}</p>
                </div>
                {ex.skipped && <span className="text-xs text-red-400">Пропущено</span>}
                {ex.completed && !ex.skipped && <span className="text-xs text-emerald-400">✓</span>}
              </div>

              {/* Normal sets */}
              {ex.sets && ex.sets.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {ex.sets.map((s, j) => (
                    <span key={j} className={`text-xs px-2 py-1 rounded-lg ${s.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}>
                      {s.weight}кг × {s.reps}
                    </span>
                  ))}
                </div>
              )}

              {/* MyoReps */}
              {ex.myoReps && (
                <div className="mt-2">
                  <p className="text-xs text-amber-400">Миорепс: {ex.myoReps.activationWeight}кг × {ex.myoReps.activationReps}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ex.myoReps.miniSets.map((ms, j) => (
                      <span key={j} className="text-xs px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400">
                        {ms.reps} повт.
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* DropSet */}
              {ex.dropSet && (
                <div className="mt-2">
                  <p className="text-xs text-purple-400 mb-1">Дроп-сет:</p>
                  <div className="flex flex-wrap gap-1">
                    {ex.dropSet.stages.map((s, j) => (
                      <span key={j} className="text-xs px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400">
                        {s.weight}кг × {s.reps}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ex.note && <p className="text-xs text-gray-500 mt-2">📝 {ex.note}</p>}
            </div>
          ))}
        </div>

        {/* Volume */}
        {(() => {
          const volume = selectedSession.exercises.reduce((sum, ex) => {
            if (ex.skipped) return sum;
            return sum + ex.sets.reduce((s, set) => s + (set.completed ? set.weight * set.reps : 0), 0);
          }, 0);
          return volume > 0 ? (
            <div className="mt-4 bg-[#252547] rounded-xl p-4 text-center">
              <p className="text-sm text-gray-400">Общий объём</p>
              <p className="text-2xl font-bold text-emerald-400">{volume.toLocaleString()} кг</p>
            </div>
          ) : null;
        })()}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto pb-24">
      <h2 className="text-2xl font-bold mb-4">📋 История тренировок</h2>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">🏋️</p>
          <p className="text-gray-400">История пуста</p>
          <p className="text-sm text-gray-500 mt-1">Завершите первую тренировку</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(session => (
            <button
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className="w-full bg-[#252547] rounded-xl p-4 text-left active:bg-[#2d2d55] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{session.dayName}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(session.startTime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  {session.duration && (
                    <p className="text-sm text-emerald-400">{Math.round(session.duration / 60000)} мин</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {session.exercises.filter(e => e.completed && !e.skipped).length}/{session.exercises.length} упр.
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
