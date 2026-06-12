export type ExerciseMode =
  | "reps"
  | "bulgarian"
  | "timed_plank"
  | "timed_superman"
  | "timed_mountain"
  | "custom_timer";

export type Exercise = {
  key: string;
  mode: ExerciseMode;
  icon: string;
  fallback: string;
};

export type WorkoutHistoryItem = {
  date: string;
  exercise: string;
  subtitle: string;
  label: string;
  movement: number;
};

export type RepsExerciseSettings = {
  maxReps: string;
  level: number;
  restTime: string;
  history: WorkoutHistoryItem[];
  progressStage: number;
};

export type TimedExerciseSettings = {
  workTime: string;
  restTime: string;
  history: WorkoutHistoryItem[];
};

export type CustomTimerSettings = {
  workTime: string;
  restTime: string;
  rounds: string;
  history: WorkoutHistoryItem[];
};

export type ExerciseSettings =
  | RepsExerciseSettings
  | TimedExerciseSettings
  | CustomTimerSettings;

export type GlobalSettings = {
  language: "en";
  beepEnabled: boolean;
  soundVolume: number;
  vibrationEnabled: boolean;
  hasSeenOnboarding: boolean;
};

export type WorkoutMode = "reps" | "timed" | "interval";

export type WorkoutState = {
  active: boolean;
  workoutMode: WorkoutMode;
  currentPass: number;
  timerLeft: number;
  timerRunning: boolean;
  timerPhase: "work" | "rest";
  resultValue: number;
  lastFeedback: string;
  plan: number[];
  restTime: number;
};

export type AppState = {
  screen: string;
  selectedExercise: string;
  settings: Record<string, ExerciseSettings>;
  globalSettings: GlobalSettings;
  workout: WorkoutState;
};