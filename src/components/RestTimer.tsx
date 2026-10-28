import { useState, useEffect, useRef } from 'react';
import { Settings } from '../types';

interface Props {
  duration: number;
  onComplete: () => void;
  settings: Settings;
}

export default function RestTimer({ duration, onComplete, settings }: Props) {
  const [remaining, setRemaining] = useState(duration);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          // Vibrate and sound
          if (settings.vibrationEnabled && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
          if (settings.soundEnabled) {
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 800;
              gain.gain.value = 0.3;
              osc.start();
              osc.stop(ctx.currentTime + 0.3);
            } catch (e) {}
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, settings]);

  const addTime = (seconds: number) => {
    setRemaining(prev => prev + seconds);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = remaining > 0 ? ((duration - remaining) / duration) * 100 : 100;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
      <div className="bg-[#252547] rounded-3xl p-8 max-w-xs w-full text-center">
        <p className="text-gray-400 text-sm mb-4">⏱ Отдых</p>
        
        {/* Timer circle */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#374151" strokeWidth="6" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-bold text-white">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center mb-4">
          <button onClick={() => setPaused(!paused)} className="px-5 py-3 bg-gray-700 rounded-xl font-semibold text-white active:bg-gray-600">
            {paused ? '▶ Продолжить' : '⏸ Пауза'}
          </button>
          <button onClick={() => addTime(30)} className="px-5 py-3 bg-gray-700 rounded-xl font-semibold text-white active:bg-gray-600">
            +30с
          </button>
        </div>

        <button onClick={onComplete} className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl active:bg-emerald-600 text-lg">
          Пропустить отдых →
        </button>
      </div>
    </div>
  );
}
