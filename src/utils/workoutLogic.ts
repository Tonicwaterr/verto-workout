import {
  AppState,
  DifficultyLevel,
  ExerciseSettings,
  RepsExerciseSettings,
} from "../types/workout";

import { EXERCISES } from "../data/exercises";

export const DEFAULT_REPS_REST = 90;
export const DEFAULT_TIMED_WORK = 30;
export const DEFAULT_TIMED_REST = 20;

export const BASE_PERCENTS = [40, 60, 50, 50, 60];

export const DIFFICULTY_OPTIONS: {
  value: DifficultyLevel;
  label: string;
}[] = [
  {
    value: 1,
    label: "Light",
  },
  {
    value: 3,
    label: "Moderate",
  },
  {
    value: 5,
    label: "Heavy",
  },
];

export const LEVEL_ADJUSTMENTS: Record<DifficultyLevel, number> = {
  1: -10,
  3: 0,
  5: 10,
};

export const PROGRESSION_THRESHOLD = 2;

export function buildInitialSettings(): AppState["settings"] {
  const settings: AppState["settings"] = {};

  for (const exercise of EXERCISES) {
    if (exercise.mode === "reps" || exercise.mode === "bulgarian") {
      settings[exercise.key] = {
        maxReps: "",
        level: 3,
        restTime: "",
        history: [],
        progressPoints: 0,
      };
    } else if (exercise.mode === "custom_timer") {
      settings[exercise.key] = {
        workTime: "",
        restTime: "",
        rounds: "",
        history: [],
      };
    } else {
      settings[exercise.key] = {
        workTime: "",
        restTime: "",
        history: [],
      };
    }
  }

  return settings;
}

export function buildInitialSettingsForExercise(
  exerciseKey: string
): ExerciseSettings | null {
  const exercise = EXERCISES.find(
    (item) => item.key === exerciseKey
  );

  if (!exercise) {
    return null;
  }

  if (
    exercise.mode === "reps" ||
    exercise.mode === "bulgarian"
  ) {
    return {
      maxReps: "",
      level: 3,
      restTime: "",
      history: [],
      progressPoints: 0,
    };
  }

  if (exercise.mode === "custom_timer") {
    return {
      workTime: "",
      restTime: "",
      rounds: "",
      history: [],
    };
  }

  return {
    workTime: "",
    restTime: "",
    history: [],
  };
}

export function buildInitialState(): AppState {
  return {
    screen: "home",
    selectedExercise: "Push-ups",
    settings: buildInitialSettings(),
    globalSettings: {
      language: "en",
      beepEnabled: true,
      soundVolume: 80,
      vibrationEnabled: false,
      hasSeenOnboarding: false,
    },
    workout: {
      active: false,
      workoutMode: "reps",
      currentPass: 1,
      timerLeft: DEFAULT_REPS_REST,
      timerRunning: false,
      timerPhase: "rest",
      resultValue: 0,
      lastFeedback: "Ready to save.",
      plan: [],
      restTime: DEFAULT_REPS_REST,
    },
  };
}

type LegacyRepsExerciseSettings = Omit<
  RepsExerciseSettings,
  "progressPoints"
> & {
  progressPoints?: number;
  progressStage?: number;
};

export function migrateAppState(
  savedState: AppState
): AppState {
  const defaults = buildInitialState();

  const migratedSettings: AppState["settings"] = {
    ...defaults.settings,
  };

  for (const [exerciseKey, settings] of Object.entries(
    savedState.settings ?? {}
  )) {
    if ("maxReps" in settings) {
      const legacySettings =
        settings as LegacyRepsExerciseSettings;

      const storedProgressPoints =
        typeof legacySettings.progressPoints === "number" &&
        Number.isFinite(legacySettings.progressPoints)
          ? legacySettings.progressPoints
          : 0;

      migratedSettings[exerciseKey] = {
        maxReps: legacySettings.maxReps ?? "",
        level: normalizeDifficultyLevel(
          Number(legacySettings.level ?? 3)
        ),
        restTime: legacySettings.restTime ?? "",
        history: Array.isArray(legacySettings.history)
          ? legacySettings.history
          : [],
        progressPoints: Math.max(
          -2,
          Math.min(2, Math.trunc(storedProgressPoints))
        ),
      };

      continue;
    }

    migratedSettings[exerciseKey] = settings;
  }

  return {
    ...defaults,
    ...savedState,
    settings: migratedSettings,
    globalSettings: {
      ...defaults.globalSettings,
      ...savedState.globalSettings,
    },
    workout: {
      ...defaults.workout,
      ...savedState.workout,
    },
  };
}

export function isRepsSettings(
  settings: ExerciseSettings
): settings is RepsExerciseSettings {
  return "maxReps" in settings;
}

export function normalizeDifficultyLevel(
  level: number
): DifficultyLevel {
  if (level <= 2) {
    return 1;
  }

  if (level >= 4) {
    return 5;
  }

  return 3;
}

export function isProgressionEnabled(
  level: DifficultyLevel
): boolean {
  return level === 3 || level === 5;
}

export function getBasePlan(maxReps: number, level: number): number[] {
  const normalizedLevel = normalizeDifficultyLevel(level);
  const adjustment = LEVEL_ADJUSTMENTS[normalizedLevel];

  return BASE_PERCENTS.map((percent) => {
    const adjustedPercent = percent + adjustment;

    return Math.max(
      1,
      Math.round((maxReps * adjustedPercent) / 100)
    );
  });
}

export function buildPlan(
  maxReps: number,
  level: number
): number[] {
  return getBasePlan(maxReps, level);
}

export type ProgressionUpdate = {
  nextMaxReps: number;
  nextProgressPoints: number;
  maxRepsChange: number;
};

export function calculateProgressionUpdate(
  maxReps: number,
  progressPoints: number,
  movement: number
): ProgressionUpdate {
  let nextMaxReps = Math.max(1, Math.round(maxReps));

  let nextProgressPoints =
    Math.trunc(progressPoints) + Math.trunc(movement);

  let maxRepsChange = 0;

  while (nextProgressPoints >= PROGRESSION_THRESHOLD) {
    nextMaxReps += 1;
    nextProgressPoints -= PROGRESSION_THRESHOLD;
    maxRepsChange += 1;
  }

  while (nextProgressPoints <= -PROGRESSION_THRESHOLD) {
    if (nextMaxReps <= 1) {
      nextProgressPoints = -(PROGRESSION_THRESHOLD - 1);
      break;
    }

    nextMaxReps -= 1;
    nextProgressPoints += PROGRESSION_THRESHOLD;
    maxRepsChange -= 1;
  }

  return {
    nextMaxReps,
    nextProgressPoints,
    maxRepsChange,
  };
}

export function getMovement(planned: number, actual: number): number {
  const difference = actual - planned;

  if (difference >= 4) return 2;
  if (difference >= 2) return 1;
  if (difference <= -4) return -2;
  if (difference <= -2) return -1;

  return 0;
}

export function getPassNote(passNumber: number): string {
  if (passNumber === 1) return "Warm-up / easy start";
  if (passNumber === 2) return "First harder set";
  if (passNumber === 3) return "Middle set";
  if (passNumber === 4) return "Reduced load";

  return "Key set for progression";
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}