import {
  AppState,
  DifficultyLevel,
  ExerciseSettings,
  RepsExerciseSettings,
  TimedExerciseSettings,
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
        estimatedMaxSeconds: "",
        level: 3,
        restTime: "",
        history: [],
        progressPoints: 0,
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
    estimatedMaxSeconds: "",
    level: 3,
    restTime: "",
    history: [],
    progressPoints: 0,
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
      progressModeActive: false,
      overtimeSeconds: 0,
      timerEndsAt: null,
      progressStartedAt: null,
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

  for (const [exerciseKey, rawSettings] of Object.entries(
    savedState.settings ?? {}
  )) {
    const settings = rawSettings as ExerciseSettings &
      Record<string, unknown>;

    // Reps-based exercises, including older saved versions.
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
          -(PROGRESSION_THRESHOLD - 1),
          Math.min(
            PROGRESSION_THRESHOLD - 1,
            Math.trunc(storedProgressPoints)
          )
        ),
      };

      continue;
    }

    // Custom Interval Timer must keep its own settings structure.
    if ("rounds" in settings) {
      migratedSettings[exerciseKey] = {
        workTime:
          typeof settings.workTime === "string"
            ? settings.workTime
            : "",
        restTime:
          typeof settings.restTime === "string"
            ? settings.restTime
            : "",
        rounds:
          typeof settings.rounds === "string"
            ? settings.rounds
            : "",
        history: Array.isArray(settings.history)
          ? settings.history
          : [],
      };

      continue;
    }

    // Timed exercises:
    // Supports both old "workTime" data and new
    // "estimatedMaxSeconds" data.
    if (
      "estimatedMaxSeconds" in settings ||
      "workTime" in settings
    ) {
      const estimatedMaxSeconds =
        typeof settings.estimatedMaxSeconds === "string"
          ? settings.estimatedMaxSeconds
          : typeof settings.workTime === "string"
            ? settings.workTime
            : "";

      const storedProgressPoints =
        typeof settings.progressPoints === "number" &&
        Number.isFinite(settings.progressPoints)
          ? settings.progressPoints
          : 0;

      migratedSettings[exerciseKey] = {
        estimatedMaxSeconds,
        level: normalizeDifficultyLevel(
          Number(settings.level ?? 3)
        ),
        restTime:
          typeof settings.restTime === "string"
            ? settings.restTime
            : "",
        history: Array.isArray(settings.history)
          ? settings.history
          : [],
        progressPoints: Math.max(
          -(PROGRESSION_THRESHOLD - 1),
          Math.min(
            PROGRESSION_THRESHOLD - 1,
            Math.trunc(storedProgressPoints)
          )
        ),
      };

      continue;
    }
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

export function isTimedSettings(
  settings: ExerciseSettings
): settings is TimedExerciseSettings {
  return "estimatedMaxSeconds" in settings;
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

export function roundToNearestFive(
  value: number
): number {
  return Math.max(
    5,
    Math.round(value / 5) * 5
  );
}

export function buildTimedPlan(
  estimatedMaxSeconds: number,
  level: number
): number[] {
  const normalizedLevel =
    normalizeDifficultyLevel(level);

  const adjustment =
    LEVEL_ADJUSTMENTS[normalizedLevel];

  const normalizedMax =
    roundToNearestFive(estimatedMaxSeconds);

  return BASE_PERCENTS.map((percent) => {
    const adjustedPercent =
      percent + adjustment;

    const rawSeconds =
      (normalizedMax * adjustedPercent) / 100;

    return roundToNearestFive(rawSeconds);
  });
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

export type TimedProgressionUpdate = {
  nextMaxSeconds: number;
  nextProgressPoints: number;
  maxSecondsChange: number;
};

export function calculateTimedProgressionUpdate(
  estimatedMaxSeconds: number,
  progressPoints: number,
  movement: number
): TimedProgressionUpdate {
  let nextMaxSeconds =
    roundToNearestFive(estimatedMaxSeconds);

  let nextProgressPoints =
    Math.trunc(progressPoints) +
    Math.trunc(movement);

  let maxSecondsChange = 0;

  while (
    nextProgressPoints >=
    PROGRESSION_THRESHOLD
  ) {
    nextMaxSeconds += 5;
    nextProgressPoints -=
      PROGRESSION_THRESHOLD;
    maxSecondsChange += 5;
  }

  while (
    nextProgressPoints <=
    -PROGRESSION_THRESHOLD
  ) {
    if (nextMaxSeconds <= 5) {
      nextProgressPoints =
        -(PROGRESSION_THRESHOLD - 1);
      break;
    }

    nextMaxSeconds -= 5;
    nextProgressPoints +=
      PROGRESSION_THRESHOLD;
    maxSecondsChange -= 5;
  }

  return {
    nextMaxSeconds,
    nextProgressPoints,
    maxSecondsChange,
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

export function getTimedMovement(
  plannedSeconds: number,
  actualSeconds: number
): number {
  const difference =
    actualSeconds - plannedSeconds;

  if (difference >= 10) return 2;
  if (difference >= 5) return 1;

  if (difference <= -10) return -2;
  if (difference <= -5) return -1;

  return 0;
}

export function getPassNote(passNumber: number): string {
  if (passNumber === 1) return "Warm-up";
  if (passNumber === 2) return "First harder set";
  if (passNumber === 3) return "Middle set";
  if (passNumber === 4) return "Reduced load";

  return "Key set for progression";
}

export function getTimedSetName(
  exerciseKey: string,
  passNumber: number
): string {
  if (exerciseKey === "Plank") {
    if (passNumber === 2) {
      return "Left side plank";
    }

    if (passNumber === 4) {
      return "Right side plank";
    }

    return "Front plank";
  }

  if (exerciseKey === "Superman") {
    return "Superman hold";
  }

  if (exerciseKey === "Mountain Climbers") {
    return "Mountain climbers";
  }

  return exerciseKey;
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}