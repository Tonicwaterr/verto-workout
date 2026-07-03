import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { ActivityIndicator, StyleSheet, View } from "react-native";

import { clearAppState, loadAppState, saveAppState } from "../services/storage";

import {
  AppState,
  ExerciseSettings,
  RepsExerciseSettings,
  TimedExerciseSettings,
} from "../types/workout";

import {
  buildInitialSettingsForExercise,
  buildInitialState,
  calculateProgressionUpdate,
  calculateTimedProgressionUpdate,
  getMovement,
  getTimedMovement,
  isProgressionEnabled,
  isRepsSettings,
  isTimedSettings,
  migrateAppState,
  roundToNearestFive,
} from "../utils/workoutLogic";

type WorkoutStore = {
  appState: AppState;
  selectedExercise: string;
  setSelectedExercise: (exerciseKey: string) => void;
  getCurrentSettings: () => ExerciseSettings;
  updateCurrentSettings: (updates: Partial<ExerciseSettings>) => void;
  startRepsWorkout: (plan: number[], restTime: number) => void;
  startTimedWorkout: (
    planOrWorkTime: number[] | number,
    restTime: number
  ) => void;
  startIntervalWorkout: (
    workTime: number,
    restTime: number,
    rounds: number
  ) => void;
  goToNextPass: () => void;
  tickTimer: () => void;
  startRestTimer: () => void;
  startNextTimedPass: () => void;
  enterTimedProgressMode: () => void;
  stopTimedFinalSet: () => void;
  toggleTimerPause: () => void;
  saveTimedWorkoutResult: () => void;
  setResultValue: (value: number) => void;
  saveRepsWorkoutResult: () => void;
  abortWorkout: () => void;
  resetCurrentExercise: () => void;
  resetAllData: () => Promise<void>;
  toggleBeep: () => void;
  toggleVibration: () => void;
  completeOnboarding: () => void;
};

const WorkoutContext = createContext<WorkoutStore | undefined>(undefined);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  
  const [appState, setAppState] = useState<AppState>(() => buildInitialState());
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateAppState() {
      try {
        const savedState = await loadAppState();

        if (savedState && isMounted) {
          setAppState(migrateAppState(savedState));
        }
      } catch (error) {
        console.error("Failed to load saved app state:", error);
      } finally {
        if (isMounted) {
          setHasLoadedStorage(true);
        }
      }
    }

    hydrateAppState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }

    saveAppState(appState);
  }, [appState, hasLoadedStorage]);
  
  function setSelectedExercise(exerciseKey: string) {
    setAppState((currentState) => {
      if (currentState.selectedExercise === exerciseKey) {
        return currentState;
      }

      return {
        ...currentState,
        selectedExercise: exerciseKey,
      };
    });
  }

  function getCurrentSettings() {
    return appState.settings[appState.selectedExercise];
  }

  function updateCurrentSettings(updates: Partial<ExerciseSettings>) {
    setAppState((currentState) => {
      const currentSettings = currentState.settings[currentState.selectedExercise];

      return {
        ...currentState,
        settings: {
          ...currentState.settings,
          [currentState.selectedExercise]: {
            ...currentSettings,
            ...updates,
          } as ExerciseSettings,
        },
      };
    });
  }

  function getTimerEndTime(seconds: number) {
    return Date.now() + Math.max(0, seconds) * 1000;
  }

  function startRepsWorkout(plan: number[], restTime: number) {
    setAppState((currentState) => ({
      ...currentState,
      workout: {
        ...currentState.workout,
        active: true,
        workoutMode: "reps",
        currentPass: 1,
        timerLeft: restTime,
        timerRunning: false,
        timerPhase: "work",
        resultValue: plan[4] ?? 0,
        lastFeedback: "Ready to save.",
        plan,
        restTime,
        progressModeActive: false,
        overtimeSeconds: 0,
        timerEndsAt: null,
        progressStartedAt: null,
      },
    }));
  }

  function startTimedWorkout(
    planOrWorkTime: number[] | number,
    restTime: number
  ) {
    const plan = Array.isArray(planOrWorkTime)
      ? planOrWorkTime
      : [
          planOrWorkTime,
          planOrWorkTime,
          planOrWorkTime,
          planOrWorkTime,
          planOrWorkTime,
        ];

    const firstSetTime = plan[0] ?? 0;

    setAppState((currentState) => ({
      ...currentState,
      workout: {
        ...currentState.workout,
        active: true,
        workoutMode: "timed",
        currentPass: 1,
        timerLeft: firstSetTime,
        timerRunning: true,
        timerPhase: "work",
        resultValue: 0,
        lastFeedback: "Ready to save.",
        plan,
        restTime,
        progressModeActive: false,
        overtimeSeconds: 0,
        timerEndsAt: getTimerEndTime(firstSetTime),
        progressStartedAt: null,
      },
    }));
  }

  function startIntervalWorkout(
    workTime: number,
    restTime: number,
    rounds: number
  ) {
    const plan = Array.from(
      { length: rounds },
      () => workTime
    );

    setAppState((currentState) => ({
      ...currentState,
      workout: {
        ...currentState.workout,
        active: true,
        workoutMode: "interval",
        currentPass: 1,
        timerLeft: workTime,
        timerRunning: true,
        timerPhase: "work",
        resultValue: 0,
        lastFeedback: "Ready to save.",
        plan,
        restTime,
        progressModeActive: false,
        overtimeSeconds: 0,
        timerEndsAt: getTimerEndTime(workTime),
        progressStartedAt: null,
      },
    }));
  }

  function goToNextPass() {
    setAppState((currentState) => ({
      ...currentState,
      workout: {
        ...currentState.workout,
        currentPass: Math.min(
          currentState.workout.currentPass + 1,
          5
        ),
        timerRunning: false,
        timerPhase: "work",
        timerEndsAt: null,
        progressStartedAt: null,
      },
    }));
  }

  function tickTimer() {
    setAppState((currentState) => {
      const workout = currentState.workout;

      if (!workout.active || !workout.timerRunning) {
        return currentState;
      }

      if (
        workout.workoutMode === "timed" &&
        workout.timerPhase === "work" &&
        workout.progressModeActive
      ) {
        if (!workout.progressStartedAt) {
          return currentState;
        }

        const nextOvertimeSeconds =
          Math.floor(
            (Date.now() - workout.progressStartedAt) /
              1000
          );

        if (
          nextOvertimeSeconds ===
          workout.overtimeSeconds
        ) {
          return currentState;
        }

        return {
          ...currentState,
          workout: {
            ...workout,
            overtimeSeconds:
              nextOvertimeSeconds,
          },
        };
      }

      if (!workout.timerEndsAt) {
        return currentState;
      }

      const nextTimerLeft = Math.max(
        0,
        Math.ceil(
          (workout.timerEndsAt - Date.now()) /
            1000
        )
      );

      if (nextTimerLeft === workout.timerLeft) {
        return currentState;
      }

      return {
        ...currentState,
        workout: {
          ...workout,
          timerLeft: nextTimerLeft,
        },
      };
    });
  }

  function startRestTimer() {
    setAppState((currentState) => {
      const restTime =
        currentState.workout.restTime;

      return {
        ...currentState,
        workout: {
          ...currentState.workout,
          timerPhase: "rest",
          timerLeft: restTime,
          timerRunning: true,
          timerEndsAt: getTimerEndTime(restTime),
          progressModeActive: false,
          overtimeSeconds: 0,
          progressStartedAt: null,
        },
      };
    });
  }

  function startNextTimedPass() {
    setAppState((currentState) => {
      const nextPass =
        currentState.workout.currentPass + 1;

      const nextWorkTime =
        currentState.workout.plan[nextPass - 1] ?? 0;

      return {
        ...currentState,
        workout: {
          ...currentState.workout,
          currentPass: nextPass,
          timerPhase: "work",
          timerLeft: nextWorkTime,
          timerRunning: true,
          timerEndsAt: getTimerEndTime(nextWorkTime),
          progressModeActive: false,
          overtimeSeconds: 0,
          progressStartedAt: null,
        },
      };
    });
  }

  function enterTimedProgressMode() {
    setAppState((currentState) => {
      const workout = currentState.workout;

      if (
        workout.workoutMode !== "timed" ||
        workout.timerPhase !== "work" ||
        workout.progressModeActive
      ) {
        return currentState;
      }

      return {
        ...currentState,
        workout: {
          ...workout,
          timerLeft: 0,
          timerRunning: true,
          timerEndsAt: null,
          progressModeActive: true,
          overtimeSeconds: 0,
          progressStartedAt: Date.now(),
        },
      };
    });
  }

  function stopTimedFinalSet() {
    setAppState((currentState) => {
      const workout = currentState.workout;
      const plannedFinalSet = workout.plan[4] ?? 0;

      const completedSeconds =
        workout.progressModeActive
          ? plannedFinalSet +
            workout.overtimeSeconds
          : Math.max(
              0,
              plannedFinalSet - workout.timerLeft
            );

      return {
        ...currentState,
        workout: {
          ...workout,
          resultValue: completedSeconds,
          timerRunning: false,
          timerEndsAt: null,
          progressStartedAt: null,
        },
      };
    });
  }

  function toggleTimerPause() {
    setAppState((currentState) => {
      const workout = currentState.workout;

      if (!workout.active) {
        return currentState;
      }

      if (
        workout.workoutMode !== "timed" &&
        workout.workoutMode !== "interval"
      ) {
        return currentState;
      }

      /*
      * Pause countdown or Progress Mode.
      */
      if (workout.timerRunning) {
        const currentOvertimeSeconds =
          workout.progressModeActive &&
          workout.progressStartedAt
            ? Math.max(
                0,
                Math.floor(
                  (Date.now() - workout.progressStartedAt) / 1000
                )
              )
            : workout.overtimeSeconds;

        return {
          ...currentState,
          workout: {
            ...workout,
            timerRunning: false,
            overtimeSeconds: currentOvertimeSeconds,
            timerEndsAt: null,
            progressStartedAt: null,
          },
        };
      }

      /*
      * Resume Progress Mode.
      */
      if (workout.progressModeActive) {
        return {
          ...currentState,
          workout: {
            ...workout,
            timerRunning: true,
            progressStartedAt:
              Date.now() - workout.overtimeSeconds * 1000,
            timerEndsAt: null,
          },
        };
      }

      /*
      * Resume normal countdown.
      */
      return {
        ...currentState,
        workout: {
          ...workout,
          timerRunning: true,
          timerEndsAt: getTimerEndTime(workout.timerLeft),
          progressStartedAt: null,
        },
      };
    });
  }

  function setResultValue(value: number) {
    setAppState((currentState) => ({
        ...currentState,
        workout: {
        ...currentState.workout,
        resultValue: Math.max(0, value),
        },
    }));
  }  
  
  function saveRepsWorkoutResult() {
    setAppState((currentState) => {
      const selectedExercise =
        currentState.selectedExercise;

      const currentSettings =
        currentState.settings[selectedExercise];

      if (!isRepsSettings(currentSettings)) {
        return currentState;
      }

      const workout = currentState.workout;

      const plannedFinalSet =
        workout.plan[4] ?? 0;

      const actualFinalSet =
        workout.resultValue;

      const movement = getMovement(
        plannedFinalSet,
        actualFinalSet
      );

      const isBulgarianExercise =
        selectedExercise === "Bulgarian Squats";

      const currentEstimatedMax = Math.max(
        1,
        Math.round(Number(currentSettings.maxReps) || 1)
      );

      const progressionEnabled =
        isProgressionEnabled(currentSettings.level);

      const progressionUpdate = progressionEnabled
        ? calculateProgressionUpdate(
            currentEstimatedMax,
            currentSettings.progressPoints ?? 0,
            movement
          )
        : {
            nextMaxReps: currentEstimatedMax,
            nextProgressPoints:
              currentSettings.progressPoints ?? 0,
            maxRepsChange: 0,
          };

      const {
        nextMaxReps,
        nextProgressPoints,
        maxRepsChange,
      } = progressionUpdate;

      const historyLabel =
        !progressionEnabled
          ? "Recovery"
          : maxRepsChange > 0
            ? "Max increased"
            : maxRepsChange < 0
              ? "Max reduced"
              : movement > 0
                ? "Improved"
                : movement < 0
                  ? "Reduced"
                  : "Unchanged";

      const performanceText = isBulgarianExercise
        ? `Planned ${plannedFinalSet} per leg, completed ${actualFinalSet} per leg`
        : `Planned ${plannedFinalSet}, completed ${actualFinalSet}`;

      const progressionText =
        !progressionEnabled
          ? " Light workout did not affect progression."
          : maxRepsChange > 0
            ? isBulgarianExercise
              ? ` Estimated max increased from ${currentEstimatedMax} to ${nextMaxReps} per leg.`
              : ` Estimated max increased from ${currentEstimatedMax} to ${nextMaxReps}.`
            : maxRepsChange < 0
              ? isBulgarianExercise
                ? ` Estimated max reduced from ${currentEstimatedMax} to ${nextMaxReps} per leg.`
                : ` Estimated max reduced from ${currentEstimatedMax} to ${nextMaxReps}.`
              : "";

      const historyItem = {
        date: new Date().toLocaleDateString("sv-SE"),
        exercise: selectedExercise,
        subtitle: `${performanceText}.${progressionText}`,
        label: historyLabel,
        movement,
      };

      const updatedSettings: RepsExerciseSettings = {
        ...currentSettings,
        maxReps: String(nextMaxReps),
        progressPoints: nextProgressPoints,
        history: [
          historyItem,
          ...currentSettings.history,
        ],
      };

      return {
        ...currentState,
        settings: {
          ...currentState.settings,
          [selectedExercise]: updatedSettings,
        },
        workout: {
          ...currentState.workout,
          active: false,
          currentPass: 1,
          resultValue: 0,
          timerRunning: false,
          timerEndsAt: null,
          progressStartedAt: null,
          progressModeActive: false,
          overtimeSeconds: 0,
          lastFeedback:
            !progressionEnabled
              ? "Light workout completed without affecting progression."
              : maxRepsChange > 0
                ? `Estimated max increased to ${nextMaxReps}.`
                : maxRepsChange < 0
                  ? `Estimated max reduced to ${nextMaxReps}.`
                  : "Estimated max unchanged.",
          plan: [],
        },
      };
    });
  }

  function saveTimedWorkoutResult() {
    setAppState((currentState) => {
      const selectedExercise =
        currentState.selectedExercise;

      const currentSettings =
        currentState.settings[selectedExercise];

      if (!isTimedSettings(currentSettings)) {
        return currentState;
      }

      const workout = currentState.workout;

      const plannedFinalSet =
        workout.plan[4] ?? 0;

      const actualFinalSet =
        workout.resultValue;

      const movement = getTimedMovement(
        plannedFinalSet,
        actualFinalSet
      );

      const currentEstimatedMax =
        roundToNearestFive(
          Number(
            currentSettings.estimatedMaxSeconds
          ) || 5
        );

      const progressionEnabled =
        isProgressionEnabled(currentSettings.level);

      const progressionUpdate = progressionEnabled
        ? calculateTimedProgressionUpdate(
            currentEstimatedMax,
            currentSettings.progressPoints ?? 0,
            movement
          )
        : {
            nextMaxSeconds: currentEstimatedMax,
            nextProgressPoints:
              currentSettings.progressPoints ?? 0,
            maxSecondsChange: 0,
          };

      const {
        nextMaxSeconds,
        nextProgressPoints,
        maxSecondsChange,
      } = progressionUpdate;

      const historyLabel =
        !progressionEnabled
          ? "Recovery"
          : maxSecondsChange > 0
            ? "Max increased"
            : maxSecondsChange < 0
              ? "Max reduced"
              : movement > 0
                ? "Improved"
                : movement < 0
                  ? "Reduced"
                  : "Unchanged";

      const performanceText =
        `Planned ${plannedFinalSet} sec, ` +
        `completed ${actualFinalSet} sec`;

      const progressionText =
        !progressionEnabled
          ? " Light workout did not affect progression."
          : maxSecondsChange > 0
            ? ` Estimated max increased from ${currentEstimatedMax} to ${nextMaxSeconds} sec.`
            : maxSecondsChange < 0
              ? ` Estimated max reduced from ${currentEstimatedMax} to ${nextMaxSeconds} sec.`
              : "";

      const historyItem = {
        date: new Date().toLocaleDateString("sv-SE"),
        exercise: selectedExercise,
        subtitle:
          `${performanceText}.${progressionText}`,
        label: historyLabel,
        movement,
      };

      const updatedSettings: TimedExerciseSettings = {
        ...currentSettings,
        estimatedMaxSeconds:
          String(nextMaxSeconds),
        progressPoints: nextProgressPoints,
        history: [
          historyItem,
          ...currentSettings.history,
        ],
      };

      return {
        ...currentState,
        settings: {
          ...currentState.settings,
          [selectedExercise]: updatedSettings,
        },
        workout: {
          ...currentState.workout,
          active: false,
          currentPass: 1,
          timerLeft:
            currentState.workout.restTime,
          timerRunning: false,
          timerPhase: "rest",
          resultValue: 0,
          lastFeedback:
            !progressionEnabled
              ? "Light workout completed without affecting progression."
              : maxSecondsChange > 0
                ? `Estimated max increased to ${nextMaxSeconds} seconds.`
                : maxSecondsChange < 0
                  ? `Estimated max reduced to ${nextMaxSeconds} seconds.`
                  : "Estimated max unchanged.",
          plan: [],
          progressModeActive: false,
          overtimeSeconds: 0,
          timerEndsAt: null,
          progressStartedAt: null,
        },
      };
    });
  }
  
  function abortWorkout() {
    setAppState((currentState) => ({
        ...currentState,
        workout: {
          ...currentState.workout,
          active: false,
          workoutMode: "reps",
          currentPass: 1,
          timerLeft: currentState.workout.restTime,
          timerRunning: false,
          timerPhase: "rest",
          resultValue: 0,
          lastFeedback: "Ready to save.",
          plan: [],
          progressModeActive: false,
          overtimeSeconds: 0,
          timerEndsAt: null,
          progressStartedAt: null,
        },
    }));
  }

  function resetCurrentExercise() {
    setAppState((currentState) => {
      const selectedExercise = currentState.selectedExercise;
      const currentSettings = currentState.settings[selectedExercise];
      const initialSettings = buildInitialSettingsForExercise(selectedExercise);

      if (!initialSettings) {
        return currentState;
      }

      return {
        ...currentState,
        settings: {
          ...currentState.settings,
          [selectedExercise]: {
            ...initialSettings,
            history: currentSettings.history,
          },
        },
        workout: {
          ...currentState.workout,
          active: false,
          currentPass: 1,
          timerLeft: currentState.workout.restTime,
          timerRunning: false,
          timerPhase: "rest",
          resultValue: 0,
          lastFeedback: "Ready to save.",
          plan: [],
          progressModeActive: false,
          overtimeSeconds: 0,
          timerEndsAt: null,
          progressStartedAt: null,
        },
      };
    });
  }

  async function resetAllData() {
    await clearAppState();
    setAppState(buildInitialState());
  }

  if (!hasLoadedStorage) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  function toggleBeep() {
    setAppState((currentState) => ({
      ...currentState,
      globalSettings: {
        ...currentState.globalSettings,
        beepEnabled: !currentState.globalSettings.beepEnabled,
      },
    }));
  }

  function toggleVibration() {
    setAppState((currentState) => ({
      ...currentState,
      globalSettings: {
        ...currentState.globalSettings,
        vibrationEnabled: !currentState.globalSettings.vibrationEnabled,
      },
    }));
  }

  function completeOnboarding() {
    setAppState((currentState) => ({
      ...currentState,
      globalSettings: {
        ...currentState.globalSettings,
        hasSeenOnboarding: true,
      },
    }));
  }

  return (
    <WorkoutContext.Provider
      value={{
        appState,
        selectedExercise: appState.selectedExercise,
        setSelectedExercise,
        getCurrentSettings,
        updateCurrentSettings,
        startRepsWorkout,
        startTimedWorkout,
        startIntervalWorkout,
        goToNextPass,
        tickTimer,
        startRestTimer,
        startNextTimedPass,
        enterTimedProgressMode,
        stopTimedFinalSet,
        toggleTimerPause,
        saveTimedWorkoutResult,
        setResultValue,
        saveRepsWorkoutResult,
        abortWorkout,
        resetCurrentExercise,
        resetAllData,
        toggleBeep,
        toggleVibration,
        completeOnboarding,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkoutStore() {
  const context = useContext(WorkoutContext);

  if (!context) {
    throw new Error("useWorkoutStore must be used inside WorkoutProvider");
  }

  return context;
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
});