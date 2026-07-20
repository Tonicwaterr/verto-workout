import { useKeepAwake } from "expo-keep-awake";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RestTimerCard } from "../components/RestTimerCard";
import { playTimerFeedback } from "../services/feedback";
import { useWorkoutStore } from "../store/workoutStore";
import {
  formatTime,
  getTimedSetName,
} from "../utils/workoutLogic";

const ZERO_HOLD_MS = 1000;

export default function RestScreen() {
  useKeepAwake();
  
  const {
    appState,
    selectedExercise,
    tickTimer,
    goToNextPass,
    startNextTimedPass,
    toggleTimerPause,
    abortWorkout,
  } = useWorkoutStore();

  const workout = appState.workout;

  const tickTimerRef = useRef(tickTimer);
  const hasCompletedRest = useRef(false);
  const warningFeedbackKey = useRef<string | null>(null);
  const completionFeedbackKey = useRef<string | null>(null);
  const zeroHoldTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTimedRest =
    workout.workoutMode === "timed";

  const totalRounds =
    workout.plan.length || 5;

  const nextPass =
    Math.min(workout.currentPass + 1, totalRounds);

  const nextText = isTimedRest
    ? `Next: ${getTimedSetName(selectedExercise, nextPass)}`
    : `Next: Set ${nextPass} of 5`;

  const pauseButtonText =
    workout.timerRunning ? "Pause" : "Resume";

  const timerKey = `${workout.workoutMode}-${workout.currentPass}-${workout.timerPhase}-${workout.timerEndsAt ?? "none"}`;

  function clearZeroHoldTimeout() {
    if (zeroHoldTimeoutRef.current) {
      clearTimeout(zeroHoldTimeoutRef.current);
      zeroHoldTimeoutRef.current = null;
    }
  }
  
  useEffect(() => {
    tickTimerRef.current = tickTimer;
  }, [tickTimer]);

  useEffect(() => {
    return () => {
      clearZeroHoldTimeout();
    };
  }, []);

  useEffect(() => {
    if (
      !workout.active ||
      !workout.timerRunning ||
      workout.timerPhase !== "rest"
    ) {
      return;
    }

    const intervalId = setInterval(() => {
      tickTimerRef.current();
    }, 250);

    return () => clearInterval(intervalId);
  }, [
    workout.active,
    workout.timerRunning,
    workout.timerPhase,
  ]);

  useEffect(() => {
    if (
      !workout.active ||
      !workout.timerRunning ||
      workout.timerPhase !== "rest"
    ) {
      return;
    }

    if (workout.timerLeft !== 5) {
      return;
    }

    if (warningFeedbackKey.current === timerKey) {
      return;
    }

    warningFeedbackKey.current = timerKey;

    void playTimerFeedback(appState.globalSettings);
  }, [
    workout.active,
    workout.timerRunning,
    workout.timerPhase,
    workout.timerLeft,
    timerKey,
    appState.globalSettings,
  ]);

  useEffect(() => {
    if (
      !workout.active ||
      !workout.timerRunning ||
      workout.timerPhase !== "rest"
    ) {
      return;
    }

    if (workout.timerLeft > 0 || hasCompletedRest.current) {
      return;
    }

    if (completionFeedbackKey.current === timerKey) {
      return;
    }

    completionFeedbackKey.current = timerKey;
    hasCompletedRest.current = true;

    void playTimerFeedback(appState.globalSettings);

    zeroHoldTimeoutRef.current = setTimeout(() => {
      zeroHoldTimeoutRef.current = null;

      if (isTimedRest) {
        startNextTimedPass();
        router.replace("/timer");
        return;
      }

      goToNextPass();
      router.replace("/workout");
    }, ZERO_HOLD_MS);
  }, [
    workout.active,
    workout.timerRunning,
    workout.timerPhase,
    workout.timerLeft,
    timerKey,
    appState.globalSettings,
    isTimedRest,
    startNextTimedPass,
    goToNextPass,
  ]);

  function handleSkipRest() {
    if (hasCompletedRest.current) {
      return;
    }

    clearZeroHoldTimeout();
    hasCompletedRest.current = true;

    if (isTimedRest) {
      startNextTimedPass();
      router.replace("/timer");
      return;
    }

    goToNextPass();
    router.replace("/workout");
  }

  function handleAbort() {
    clearZeroHoldTimeout();
    abortWorkout();
    router.replace("/");
  }

  function handlePause() {
    toggleTimerPause();
  }

  return (
    <SafeAreaView style={styles.screen}>
      <RestTimerCard
        nextText={nextText}
        timerText={formatTime(workout.timerLeft)}
        pauseText={pauseButtonText}
        onSkip={handleSkipRest}
        onPause={handlePause}
        onAbort={handleAbort}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
});