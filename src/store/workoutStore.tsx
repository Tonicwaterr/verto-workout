import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { clearAppState, loadAppState, saveAppState } from "../services/storage";

import {
  AppState,
  ExerciseSettings,
  RepsExerciseSettings,
} from "../types/workout";

import {
  buildInitialSettingsForExercise,
  buildInitialState,
  getMovement,
  isRepsSettings,
} from "../utils/workoutLogic";

type WorkoutStore = {
  appState: AppState;
  selectedExercise: string;
  setSelectedExercise: (exerciseKey: string) => void;
  getCurrentSettings: () => ExerciseSettings;
  updateCurrentSettings: (updates: Partial<ExerciseSettings>) => void;
  startRepsWorkout: (plan: number[], restTime: number) => void;
  startTimedWorkout: (workTime: number, restTime: number) => void;
  startIntervalWorkout: (
    workTime: number,
    restTime: number,
    rounds: number
  ) => void;
  goToNextPass: () => void;
  tickTimer: () => void;
  startRestTimer: () => void;
  startNextTimedPass: () => void;
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
    async function loadSavedState() {
      const savedState = await loadAppState();

      if (savedState) {
        setAppState(savedState);
      }

      setHasLoadedStorage(true);
    }

    loadSavedState();
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
        timerPhase: "rest",
        resultValue: plan[4] ?? 0,
        lastFeedback: "Ready to save.",
        plan,
        restTime,
      },
    }));
  }

  function startTimedWorkout(workTime: number, restTime: number) {
    const plan = [workTime, workTime, workTime, workTime, workTime];

    setAppState((currentState) => ({
      ...currentState,
      workout: {
        ...currentState.workout,
        active: true,
        workoutMode: "timed",
        currentPass: 1,
        timerLeft: workTime,
        timerRunning: false,
        timerPhase: "work",
        resultValue: 0,
        lastFeedback: "Ready to save.",
        plan,
        restTime,
      },
    }));
  }

  function startIntervalWorkout(
    workTime: number,
    restTime: number,
    rounds: number
  ) {
    const plan = Array.from({ length: rounds }, () => workTime);

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
      },
    }));
  }

  function goToNextPass() {
    setAppState((currentState) => ({
        ...currentState,
        workout: {
        ...currentState.workout,
        currentPass: Math.min(currentState.workout.currentPass + 1, 5),
        },
    }));
  }

  function tickTimer() {
    setAppState((currentState) => {
      if (!currentState.workout.active) {
        return currentState;
      }

      if (currentState.workout.timerLeft <= 0) {
        return currentState;
      }

      return {
        ...currentState,
        workout: {
          ...currentState.workout,
          timerLeft: currentState.workout.timerLeft - 1,
        },
      };
    });
  }

  function startRestTimer() {
    setAppState((currentState) => ({
      ...currentState,
      workout: {
        ...currentState.workout,
        timerPhase: "rest",
        timerLeft: currentState.workout.restTime,
      },
    }));
  }

  function startNextTimedPass() {
    setAppState((currentState) => {
      const nextPass = currentState.workout.currentPass + 1;
      const nextWorkTime = currentState.workout.plan[nextPass - 1] ?? 0;

      return {
        ...currentState,
        workout: {
          ...currentState.workout,
          currentPass: nextPass,
          timerPhase: "work",
          timerLeft: nextWorkTime,
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
      const selectedExercise = currentState.selectedExercise;
      const currentSettings = currentState.settings[selectedExercise];

      if (!isRepsSettings(currentSettings)) {
        return currentState;
      }

      const workout = currentState.workout;
      const plannedFinalSet = workout.plan[4] ?? 0;
      const actualFinalSet = workout.resultValue;
      const movement = getMovement(plannedFinalSet, actualFinalSet);

      const nextProgressStage = Math.max(
        0,
        currentSettings.progressStage + movement
      );

      const historyLabel =
        movement > 0 ? "Improved" : movement < 0 ? "Reduced" : "Unchanged";

      const historyItem = {
        date: new Date().toLocaleDateString("sv-SE"),
        exercise: selectedExercise,
        subtitle: `Planned ${plannedFinalSet}, completed ${actualFinalSet}`,
        label: historyLabel,
        movement,
      };

      const updatedSettings: RepsExerciseSettings = {
        ...currentSettings,
        progressStage: nextProgressStage,
        history: [historyItem, ...currentSettings.history],
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
          plan: [],
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
        },
      };
    });
  }

  async function resetAllData() {
    await clearAppState();
    setAppState(buildInitialState());
  }

  if (!hasLoadedStorage) {
    return null;
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