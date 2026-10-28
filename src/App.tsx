import { useState, useEffect, useCallback } from 'react';
import { Settings, ActiveWorkout, WorkoutSession } from './types';
import { getSettings, saveSettings, getActiveWorkout, saveActiveWorkout, getHistory, saveWorkoutSession } from './db';
import Home from './components/Home';
import WorkoutExercise from './components/WorkoutExercise';
import HistoryView from './components/History';
import ProgressView from './components/Progress';
import SettingsView from './components/Settings';

type Page = 'home' | 'workout' | 'history' | 'progress' | 'settings';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [s, aw, h] = await Promise.all([getSettings(), getActiveWorkout(), getHistory()]);
    setSettings(s);
    setActiveWorkout(aw);
    setHistory(h.sort((a, b) => b.startTime - a.startTime));
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateSettings = async (newSettings: Settings) => {
    await saveSettings(newSettings);
    setSettings(newSettings);
    document.documentElement.classList.toggle('light', newSettings.theme === 'light');
  };

  const refreshData = async () => {
    const [aw, h] = await Promise.all([getActiveWorkout(), getHistory()]);
    setActiveWorkout(aw);
    setHistory(h.sort((a, b) => b.startTime - a.startTime));
  };

  useEffect(() => {
    if (settings) {
      document.documentElement.classList.toggle('light', settings.theme === 'light');
    }
  }, [settings]);

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Загрузка...</div>
      </div>
    );
  }

  const isDark = settings.theme === 'dark';
  const bgClass = isDark ? 'bg-[#1a1a2e]' : 'bg-gray-50';
  const textClass = isDark ? 'text-white' : 'text-gray-900';

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} pb-20`}>
      {page === 'home' && (
        <Home
          settings={settings}
          activeWorkout={activeWorkout}
          history={history}
          onStartWorkout={(dayId: number) => {
            const workout: ActiveWorkout = {
              dayId,
              dayName: `День ${dayId}`,
              startTime: Date.now(),
              currentExerciseIndex: 0,
              exercises: []
            };
            setActiveWorkout(workout);
            saveActiveWorkout(workout);
            setPage('workout');
          }}
          onResumeWorkout={() => setPage('workout')}
          onClearActiveWorkout={async () => {
            setActiveWorkout(null);
            await saveActiveWorkout(null);
          }}
          onNavigate={setPage}
        />
      )}
      {page === 'workout' && activeWorkout && (
        <WorkoutExercise
          activeWorkout={activeWorkout}
          settings={settings}
          onComplete={async (session: WorkoutSession) => {
            await saveWorkoutSession(session);
            await saveActiveWorkout(null);
            setActiveWorkout(null);
            await refreshData();
            setPage('home');
          }}
          onAbandon={async () => {
            await saveActiveWorkout(null);
            setActiveWorkout(null);
            setPage('home');
          }}
          onUpdate={async (workout: ActiveWorkout) => {
            setActiveWorkout(workout);
            await saveActiveWorkout(workout);
          }}
          onGoHome={() => setPage('home')}
        />
      )}
      {page === 'history' && (
        <HistoryView history={history} onBack={() => setPage('home')} />
      )}
      {page === 'progress' && (
        <ProgressView history={history} onBack={() => setPage('home')} />
      )}
      {page === 'settings' && (
        <SettingsView
          settings={settings}
          onSave={updateSettings}
          onBack={() => setPage('home')}
          onDataRefresh={refreshData}
        />
      )}

      {/* Bottom Navigation */}
      {page !== 'workout' && (
        <nav className={`fixed bottom-0 left-0 right-0 ${isDark ? 'bg-[#16162a] border-gray-800' : 'bg-white border-gray-200'} border-t flex justify-around py-2 safe-bottom z-50`}>
          <button onClick={() => setPage('home')} className={`flex flex-col items-center px-4 py-2 ${page === 'home' ? 'text-emerald-400' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="text-xs mt-1">Главная</span>
          </button>
          <button onClick={() => setPage('history')} className={`flex flex-col items-center px-4 py-2 ${page === 'history' ? 'text-emerald-400' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-xs mt-1">История</span>
          </button>
          <button onClick={() => setPage('progress')} className={`flex flex-col items-center px-4 py-2 ${page === 'progress' ? 'text-emerald-400' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span className="text-xs mt-1">Прогресс</span>
          </button>
          <button onClick={() => setPage('settings')} className={`flex flex-col items-center px-4 py-2 ${page === 'settings' ? 'text-emerald-400' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-xs mt-1">Настройки</span>
          </button>
        </nav>
      )}
    </div>
  );
}
