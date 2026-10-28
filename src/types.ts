export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  reps: string;
  sets: number;
  specialType?: 'normal' | 'myoreps' | 'dropset';
  myoRepsConfig?: {
    activationReps: number;
    miniSets: number;
    restBetweenMiniSets: number;
  };
  dropSetConfig?: {
    stages: number;
    weightDropPercent: number;
  };
}

export interface DayProgram {
  id: number;
  name: string;
  exercises: Exercise[];
}

export interface SetResult {
  weight: number;
  reps: number;
  completed: boolean;
}

export interface MyoRepsResult {
  activationWeight: number;
  activationReps: number;
  miniSets: { reps: number; completed: boolean }[];
  completed: boolean;
}

export interface DropSetResult {
  stages: { weight: number; reps: number; completed: boolean }[];
  completed: boolean;
}

export interface ExerciseResult {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: SetResult[];
  myoReps?: MyoRepsResult;
  dropSet?: DropSetResult;
  skipped: boolean;
  note?: string;
  completed: boolean;
}

export interface WorkoutSession {
  id: string;
  dayId: number;
  dayName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  exercises: ExerciseResult[];
  completed: boolean;
  note?: string;
}

export interface ActiveWorkout {
  dayId: number;
  dayName: string;
  startTime: number;
  currentExerciseIndex: number;
  exercises: ExerciseResult[];
  note?: string;
}

export interface Settings {
  weightStep: number;
  restTime: number;
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  myoRepsConfig: {
    activationReps: number;
    miniSets: number;
    restBetweenMiniSets: number;
  };
}

export interface AppData {
  settings: Settings;
  activeWorkout: ActiveWorkout | null;
  history: WorkoutSession[];
  customExercises: Exercise[];
}
