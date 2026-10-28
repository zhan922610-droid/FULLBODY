import { useState, useRef } from 'react';
import { Settings as SettingsType } from '../types';
import { exportData, importData, getSettings } from '../db';

interface Props {
  settings: SettingsType;
  onSave: (settings: SettingsType) => void;
  onBack: () => void;
  onDataRefresh: () => void;
}

export default function SettingsView({ settings, onSave, onDataRefresh }: Props) {
  const [localSettings, setLocalSettings] = useState<SettingsType>({ ...settings });
  const [showExport, setShowExport] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (partial: Partial<SettingsType>) => {
    const updated = { ...localSettings, ...partial };
    setLocalSettings(updated);
    onSave(updated);
  };

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fullbody-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.settings && !data.history) {
        setImportStatus('❌ Неверный формат файла');
        return;
      }

      if (confirm('Импорт заменит все текущие данные. Продолжить?')) {
        await importData(text);
        setImportStatus('✅ Данные успешно импортированы');
        onDataRefresh();
        // Reload settings
        const newSettings = await getSettings();
        setLocalSettings(newSettings);
      }
    } catch (err) {
      setImportStatus('❌ Ошибка при чтении файла');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto pb-24">
      <h2 className="text-2xl font-bold mb-6">⚙️ Настройки</h2>

      {/* Theme */}
      <div className="bg-[#252547] rounded-xl p-4 mb-4">
        <h3 className="font-semibold mb-3">🎨 Тема</h3>
        <div className="flex gap-2">
          <button
            onClick={() => update({ theme: 'dark' })}
            className={`flex-1 py-3 rounded-xl font-semibold ${localSettings.theme === 'dark' ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Тёмная
          </button>
          <button
            onClick={() => update({ theme: 'light' })}
            className={`flex-1 py-3 rounded-xl font-semibold ${localSettings.theme === 'light' ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Светлая
          </button>
        </div>
      </div>

      {/* Weight step */}
      <div className="bg-[#252547] rounded-xl p-4 mb-4">
        <h3 className="font-semibold mb-3">⚖️ Шаг изменения веса</h3>
        <div className="flex gap-2">
          {[1, 2.5, 5].map(step => (
            <button
              key={step}
              onClick={() => update({ weightStep: step })}
              className={`flex-1 py-3 rounded-xl font-semibold ${localSettings.weightStep === step ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              {step} кг
            </button>
          ))}
        </div>
      </div>

      {/* Rest time */}
      <div className="bg-[#252547] rounded-xl p-4 mb-4">
        <h3 className="font-semibold mb-3">⏱ Время отдыха</h3>
        <div className="flex flex-wrap gap-2">
          {[30, 60, 90, 120, 180].map(time => (
            <button
              key={time}
              onClick={() => update({ restTime: time })}
              className={`px-4 py-3 rounded-xl font-semibold ${localSettings.restTime === time ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              {time}с
            </button>
          ))}
        </div>
      </div>

      {/* Sound & Vibration */}
      <div className="bg-[#252547] rounded-xl p-4 mb-4">
        <h3 className="font-semibold mb-3">🔔 Уведомления</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Звук по окончании отдыха</span>
            <button
              onClick={() => update({ soundEnabled: !localSettings.soundEnabled })}
              className={`w-12 h-7 rounded-full transition-colors ${localSettings.soundEnabled ? 'bg-emerald-500' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transform transition-transform mx-1 ${localSettings.soundEnabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span>Вибрация</span>
            <button
              onClick={() => update({ vibrationEnabled: !localSettings.vibrationEnabled })}
              className={`w-12 h-7 rounded-full transition-colors ${localSettings.vibrationEnabled ? 'bg-emerald-500' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transform transition-transform mx-1 ${localSettings.vibrationEnabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* MyoReps config */}
      <div className="bg-[#252547] rounded-xl p-4 mb-4">
        <h3 className="font-semibold mb-3">🔥 Параметры миорепсов</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Активационные повторения</span>
            <input
              type="number"
              value={localSettings.myoRepsConfig.activationReps}
              onChange={e => update({ myoRepsConfig: { ...localSettings.myoRepsConfig, activationReps: parseInt(e.target.value) || 15 } })}
              className="w-16 text-center bg-gray-800 text-white py-1 rounded-lg"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Количество мини-подходов</span>
            <input
              type="number"
              value={localSettings.myoRepsConfig.miniSets}
              onChange={e => update({ myoRepsConfig: { ...localSettings.myoRepsConfig, miniSets: parseInt(e.target.value) || 4 } })}
              className="w-16 text-center bg-gray-800 text-white py-1 rounded-lg"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Отдых между мини-подходами (сек)</span>
            <input
              type="number"
              value={localSettings.myoRepsConfig.restBetweenMiniSets}
              onChange={e => update({ myoRepsConfig: { ...localSettings.myoRepsConfig, restBetweenMiniSets: parseInt(e.target.value) || 5 } })}
              className="w-16 text-center bg-gray-800 text-white py-1 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Backup */}
      <div className="bg-[#252547] rounded-xl p-4 mb-4">
        <h3 className="font-semibold mb-3">💾 Резервные копии</h3>
        <div className="space-y-2">
          <button onClick={handleExport} className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl active:bg-emerald-600">
            📤 Экспорт данных
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-gray-700 text-white font-semibold rounded-xl active:bg-gray-600">
            📥 Импорт данных
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          {importStatus && <p className="text-sm text-center mt-2">{importStatus}</p>}
        </div>
      </div>

      {/* Info */}
      <div className="bg-[#252547] rounded-xl p-4 mb-4">
        <h3 className="font-semibold mb-2">ℹ️ О приложении</h3>
        <p className="text-sm text-gray-400 mb-2">
          Full Body Tracker — трекер силовых тренировок. Все данные хранятся локально на вашем устройстве.
        </p>
        <p className="text-sm text-red-400">
          ⚠️ Очистка данных браузера или потеря устройства приведёт к утрате данных. Регулярно делайте резервные копии.
        </p>
      </div>

      {/* Install PWA hint */}
      <div className="bg-[#252547] rounded-xl p-4">
        <h3 className="font-semibold mb-2">📱 Установка на главный экран</h3>
        <p className="text-sm text-gray-400">
          <strong>Android:</strong> Откройте меню браузера → «Добавить на главный экран»<br />
          <strong>iPhone:</strong> Кнопка «Поделиться» → «На экран Домой»
        </p>
      </div>
    </div>
  );
}
