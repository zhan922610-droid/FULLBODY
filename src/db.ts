import { openDB, IDBPDatabase } from 'idb';
import { AppData, Settings, ActiveWorkout, WorkoutSession, Exercise } from './types';

const DB_NAME = 'fullbody-tracker';
const DB_VERSION = 1;

const DEFAULT_SETTINGS: Settings = {
  weightStep: 2.5,
  restTime: 90,
  theme: 'dark',
  soundEnabled: true,
  vibrationEnabled: true,
  myoRepsConfig: { activationReps: 15, miniSets: 4, restBetweenMiniSets: 5 }
};

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
      if (!db.objectStoreNames.contains('activeWorkout')) db.createObjectStore('activeWorkout');
      if (!db.objectStoreNames.contains('history')) db.createObjectStore('history', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('customExercises')) db.createObjectStore('customExercises', { keyPath: 'id' });
    }
  });
  return dbInstance;
}

export async function getSettings(): Promise<Settings> {
  const db = await getDB();
  const s = await db.get('settings', 'current');
  return s || DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'current');
}

export async function getActiveWorkout(): Promise<ActiveWorkout | null> {
  const db = await getDB();
  return (await db.get('activeWorkout', 'current')) || null;
}

export async function saveActiveWorkout(workout: ActiveWorkout | null): Promise<void> {
  const db = await getDB();
  if (workout) {
    await db.put('activeWorkout', workout, 'current');
  } else {
    await db.delete('activeWorkout', 'current');
  }
}

export async function getHistory(): Promise<WorkoutSession[]> {
  const db = await getDB();
  return await db.getAll('history');
}

export async function saveWorkoutSession(session: WorkoutSession): Promise<void> {
  const db = await getDB();
  await db.put('history', session);
}

export async function deleteWorkoutSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('history', id);
}

export async function getCustomExercises(): Promise<Exercise[]> {
  const db = await getDB();
  return await db.getAll('customExercises');
}

export async function saveCustomExercise(exercise: Exercise): Promise<void> {
  const db = await getDB();
  await db.put('customExercises', exercise);
}

export async function deleteCustomExercise(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('customExercises', id);
}

export async function exportData(): Promise<string> {
  const settings = await getSettings();
  const activeWorkout = await getActiveWorkout();
  const history = await getHistory();
  const customExercises = await getCustomExercises();
  const data: AppData = { settings, activeWorkout, history, customExercises };
  return JSON.stringify(data, null, 2);
}

export async function importData(json: string): Promise<void> {
  const data: AppData = JSON.parse(json);
  const db = await getDB();
  
  if (data.settings) await db.put('settings', data.settings, 'current');
  if (data.activeWorkout) {
    await db.put('activeWorkout', data.activeWorkout, 'current');
  } else {
    await db.delete('activeWorkout', 'current');
  }
  
  // Clear existing history
  const tx = db.transaction('history', 'readwrite');
  await tx.store.clear();
  if (data.history) {
    for (const session of data.history) {
      await tx.store.put(session);
    }
  }
  await tx.done;

  // Clear and import custom exercises
  const tx2 = db.transaction('customExercises', 'readwrite');
  await tx2.store.clear();
  if (data.customExercises) {
    for (const ex of data.customExercises) {
      await tx2.store.put(ex);
    }
  }
  await tx2.done;
}

export async function getLastExerciseResult(exerciseId: string): Promise<{ sets: { weight: number; reps: number }[] } | null> {
  const history = await getHistory();
  // Find the most recent completed workout that has this exercise
  const sorted = history
    .filter(h => h.completed)
    .sort((a, b) => b.startTime - a.startTime);
  
  for (const session of sorted) {
    const exResult = session.exercises.find(e => e.exerciseId === exerciseId && !e.skipped);
    if (exResult && exResult.sets && exResult.sets.length > 0) {
      return {
        sets: exResult.sets.filter(s => s.completed).map(s => ({ weight: s.weight, reps: s.reps }))
      };
    }
  }
  return null;
}
