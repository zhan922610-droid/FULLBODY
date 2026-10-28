import { Settings, ActiveWorkout, WorkoutSession } from '../types';
import { PROGRAM } from '../program';

interface Props {
  settings: Settings;
  activeWorkout: ActiveWorkout | null;
  history: WorkoutSession[];
  onStartWorkout: (dayId: number) => void;
  onResumeWorkout: () => void;
  onClearActiveWorkout: () => void;
  onNavigate: (page: 'home' | 'workout' | 'history' | 'progress' | 'settings') => void;
}

export default function Home({ settings, activeWorkout, history, onStartWorkout, onResumeWorkout, onClearActiveWorkout }: Props) {
  const isDark = settings.theme === 'dark';
  const cardBg = isDark ? 'bg-[#252547]' : 'bg-white';
  const accentColor = 'text-emerald-400';
  
  const totalWorkouts = history.filter(h => h.completed).length;
  const lastWorkout = history.find(h => h.completed);
  const thisWeek = history.filter(h => {
    const d = new Date(h.startTime);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo && h.completed;
  }).length;

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${accentColor}`}>Full Body</h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Трекер силовых тренировок</p>
      </div>

      {/* Active workout banner */}
      {activeWorkout && (
        <div className={`${cardBg} rounded-2xl p-4 mb-4 border border-emerald-500/30`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-400 font-semibold">⚡ Незавершённая тренировка</span>
            <span className="text-xs text-gray-400">{activeWorkout.dayName}</span>
          </div>
          <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Упражнение {activeWorkout.currentExerciseIndex + 1} из {PROGRAM.find(d => d.id === activeWorkout.dayId)?.exercises.length || '?'}
          </p>
          <div className="flex gap-2">
            <button onClick={onResumeWorkout} className="flex-1 bg-emerald-500 text-white font-semibold py-3 rounded-xl active:bg-emerald-600">
              Продолжить
            </button>
            <button onClick={() => { if (confirm('Сбросить незавершённую тренировку? Данные будут потеряны.')) onClearActiveWorkout(); }} className="px-4 py-3 rounded-xl border border-red-500/50 text-red-400 font-semibold active:bg-red-500/10">
              Сбросить
            </button>
          </div>
        </div>
      )}

      {/* Start workout button */}
      {!activeWorkout && (
        <button
          onClick={() => {
            const dayId = prompt('Выберите день (1, 2 или 3):');
            const id = parseInt(dayId || '');
            if (id >= 1 && id <= 3) onStartWorkout(id);
          }}
          className="w-full bg-emerald-500 text-white font-bold text-lg py-5 rounded-2xl mb-6 active:bg-emerald-600 shadow-lg shadow-emerald-500/20"
        >
          🏋️ Начать тренировку
        </button>
      )}

      {/* Day cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {PROGRAM.map(day => {
          const lastForDay = history.find(h => h.dayId === day.id && h.completed);
          return (
            <button
              key={day.id}
              onClick={() => !activeWorkout && onStartWorkout(day.id)}
              className={`${cardBg} rounded-2xl p-3 text-center active:scale-95 transition-transform ${!activeWorkout ? '' : 'opacity-50'}`}
            >
              <div className={`text-lg font-bold ${accentColor}`}>День {day.id}</div>
              <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{day.exercises.length} упр.</div>
              {lastForDay && (
                <div className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {new Date(lastForDay.startTime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className={`${cardBg} rounded-2xl p-4 mb-4`}>
        <h3 className={`font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>📊 Статистика</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${accentColor}`}>{totalWorkouts}</div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Тренировок</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${accentColor}`}>{thisWeek}</div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>За неделю</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${accentColor}`}>{lastWorkout ? new Date(lastWorkout.startTime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—'}</div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Последняя</div>
          </div>
        </div>
      </div>

      {/* Last workout summary */}
      {lastWorkout && (
        <div className={`${cardBg} rounded-2xl p-4`}>
          <h3 className={`font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>🕐 Последняя тренировка</h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {lastWorkout.dayName} • {new Date(lastWorkout.startTime).toLocaleDateString('ru-RU')} • 
            {lastWorkout.duration ? ` ${Math.round(lastWorkout.duration / 60000)} мин` : ''}
          </p>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Выполнено: {lastWorkout.exercises.filter(e => e.completed && !e.skipped).length}/{lastWorkout.exercises.length} упражнений
          </p>
        </div>
      )}

      {/* Warning about data */}
      <p className={`text-xs text-center mt-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
        Данные хранятся на вашем устройстве. Регулярно делайте резервные копии в настройках.
      </p>
    </div>
  );
}
