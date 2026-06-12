import {
  AppState,
  ExerciseSettings,
  RepsExerciseSettings,
} from "../types/workout";
import { EXERCISES } from "../data/exercises";

export const DEFAULT_REPS_REST = 90;
export const DEFAULT_TIMED_WORK = 30;
export const DEFAULT_TIMED_REST = 20;

export const BASE_PERCENTS = [40, 60, 50, 50, 60];

export const LEVEL_ADJUSTMENTS: Record<number, number> = {
  1: -10,
  2: -5,
  3: 0,
  4: 5,
  5: 10,
};

export const PROGRESSION_MAP: Record<number, number[][]> = {
  1: [[4], [3, 4], [2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4, 5]],
  2: [[3, 4], [2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4, 5]],
  3: [[3, 4, 5], [2, 3, 4, 5], [1, 2, 3, 4, 5]],
  4: [[2, 3, 4, 5], [1, 2, 3, 4, 5]],
  5: [[1, 2, 3, 4, 5]],
};

export function buildInitialSettings(): AppState["settings"] {
  const settings: AppState["settings"] = {};

  for (const exercise of EXERCISES) {
    if (exercise.mode === "reps" || exercise.mode === "bulgarian") {
      settings[exercise.key] = {
        maxReps: "",
        level: 3,
        restTime: "",
        history: [],
        progressStage: 0,
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

export function buildInitialSettingsForExercise(exerciseKey: string) {
  const exercise = EXERCISES.find((item) => item.key === exerciseKey);

  if (!exercise) {
    return null;
  }

  if (exercise.mode === "reps" || exercise.mode === "bulgarian") {
    return {
      maxReps: "",
      level: 3,
      restTime: "",
      history: [],
      progressStage: 0,
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

export function isRepsSettings(
  settings: ExerciseSettings
): settings is RepsExerciseSettings {
  return "maxReps" in settings;
}

export function getBasePlan(maxReps: number, level: number): number[] {
  const adjustment = LEVEL_ADJUSTMENTS[level] ?? 0;

  return BASE_PERCENTS.map((percent) => {
    const adjustedPercent = percent + adjustment;
    return Math.max(1, Math.round((maxReps * adjustedPercent) / 100));
  });
}

export function buildPlan(
  maxReps: number,
  level: number,
  progressStage: number
): number[] {
  const plan = getBasePlan(maxReps, level);
  const progressionStages = PROGRESSION_MAP[level] ?? [];
  const stagesToApply = Math.min(progressStage, progressionStages.length);

  for (let i = 0; i < stagesToApply; i++) {
    for (const setNumber of progressionStages[i]) {
      plan[setNumber - 1] += 1;
    }
  }

  if (progressStage > progressionStages.length) {
    const extra = progressStage - progressionStages.length;

    for (let i = 0; i < plan.length; i++) {
      plan[i] += extra;
    }
  }

  return plan.map((value) => Math.max(1, value));
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