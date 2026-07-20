import { useKeepAwake } from "expo-keep-awake";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { EXERCISE_IMAGES } from "../data/exerciseImages";
import { playTimerFeedback } from "../services/feedback";
import { useWorkoutStore } from "../store/workoutStore";
import {
  TIMED_PROGRESS_EXTRA_LIMIT_SECONDS,
  formatTime,
  getTimedSetName,
} from "../utils/workoutLogic";

const ZERO_HOLD_MS = 1000;

export default function TimerScreen() {
  useKeepAwake();
  
  const {
    appState,
    selectedExercise,
    tickTimer,
    startRestTimer,
    startNextTimedPass,
    enterTimedProgressMode,
    stopTimedFinalSet,
    toggleTimerPause,
    abortWorkout,
  } = useWorkoutStore();

  const workout = appState.workout;

  const isWorkPhase =
    workout.timerPhase === "work";

  const isTimedWorkout =
    workout.workoutMode === "timed";

  const isIntervalWorkout =
    workout.workoutMode === "interval";

  const totalRounds = workout.plan.length;

  const currentPass = workout.currentPass;

  const isLastRound =
    workout.currentPass >= totalRounds;

  const isProgressMode =
    isTimedWorkout &&
    isWorkPhase &&
    workout.progressModeActive;

  const hasReachedTimedProgressLimit =
    isProgressMode &&
    workout.overtimeSeconds >=
      TIMED_PROGRESS_EXTRA_LIMIT_SECONDS;
  
  const timerKey = `${workout.workoutMode}-${workout.currentPass}-${workout.timerPhase}-${workout.timerEndsAt ?? "none"}`;  

  const tickTimerRef = useRef(tickTimer);
  const warningFeedbackKey = useRef<string | null>(null);
  const completionFeedbackKey = useRef<string | null>(null);
  const zeroHoldTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

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

  /*
   * Keeping the interval independent from normal state updates prevents
   * it from being recreated every time the timer changes.
   */
  useEffect(() => {
    if (
      !workout.active ||
      !workout.timerRunning
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
  ]);

  /*
  * Handles warning feedback and the transition when a countdown reaches zero.
  */
  useEffect(() => {
    if (!workout.active || !workout.timerRunning) {
      return;
    }

    /*
    * Progress Mode counts upward and must not trigger countdown feedback.
    */
    if (isProgressMode) {
      return;
    }

    /*
    * One warning beep/vibration at 5 seconds left.
    */
    if (workout.timerLeft === 5) {
      if (warningFeedbackKey.current !== timerKey) {
        warningFeedbackKey.current = timerKey;

        void playTimerFeedback(appState.globalSettings);
      }

      return;
    }

    if (workout.timerLeft > 0) {
      return;
    }

    /*
    * Prevent duplicate zero-time transitions if React renders again
    * before navigation/state transition finishes.
    */
    if (completionFeedbackKey.current === timerKey) {
      return;
    }

    completionFeedbackKey.current = timerKey;

    void playTimerFeedback(appState.globalSettings);

    if (isWorkPhase && isTimedWorkout && isLastRound) {
      enterTimedProgressMode();
      return;
    }

    zeroHoldTimeoutRef.current = setTimeout(() => {
      zeroHoldTimeoutRef.current = null;

      if (isWorkPhase) {
        /*
        * The standalone Interval Timer finishes normally.
        */
        if (isIntervalWorkout && isLastRound) {
          router.replace("/finish");
          return;
        }

        startRestTimer();
        router.replace("/rest");
        return;
      }

      startNextTimedPass();
    }, ZERO_HOLD_MS);
  }, [
    workout.active,
    workout.timerRunning,
    workout.timerLeft,
    timerKey,
    isWorkPhase,
    isLastRound,
    isTimedWorkout,
    isIntervalWorkout,
    isProgressMode,
    enterTimedProgressMode,
    startRestTimer,
    startNextTimedPass,
    appState.globalSettings,
  ]);

  function handleAbort() {
    clearZeroHoldTimeout();
    abortWorkout();
    router.replace("/");
  }

  function handleTimedDone() {
    clearZeroHoldTimeout();
    stopTimedFinalSet();
    router.replace("/finish");
  }

  function handlePause() {
    toggleTimerPause();
  }

  function handleSkipRest() {
    clearZeroHoldTimeout();
    startNextTimedPass();
  }

  const currentMovementName =
    getTimedSetName(
      selectedExercise,
      workout.currentPass
    );

  const nextMovementName =
    getTimedSetName(
      selectedExercise,
      Math.min(
        workout.currentPass + 1,
        totalRounds
      )
    );

  const title = isIntervalWorkout
    ? isWorkPhase
      ? "Work"
      : "Rest"
    : isWorkPhase
      ? currentMovementName
      : "Rest";

  const setText = isIntervalWorkout
    ? `Round ${workout.currentPass} / ${totalRounds}`
    : isWorkPhase
      ? `Set ${workout.currentPass} / ${totalRounds}`
      : `Next: Set ${Math.min(
          workout.currentPass + 1,
          totalRounds
        )} / ${totalRounds}`;

  const hint = isProgressMode
    ? hasReachedTimedProgressLimit
      ? "Time limit reached. Press Done to adjust result."
      : "Keep going, then press Done"
    : isIntervalWorkout
      ? isWorkPhase
        ? "Interval work"
        : "Next round starts soon"
      : isWorkPhase
        ? isLastRound
          ? "Press Done whenever you stop"
          : ""
        : `Next: ${nextMovementName}`;

  const timerDisplay = isProgressMode
    ? `+${workout.overtimeSeconds}`
    : formatTime(workout.timerLeft);

  const dots =
    "●".repeat(currentPass) +
    "○".repeat(Math.max(0, totalRounds - currentPass));

  const pauseButtonText =
    workout.timerRunning ? "Pause" : "Resume";  

  const showTimedDoneButton =
    isTimedWorkout &&
    isWorkPhase &&
    isLastRound;
  
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.topRow}>
            <Text style={styles.exerciseName}>
              {isIntervalWorkout
                ? "Interval Timer"
                : selectedExercise}
            </Text>

            <Text style={styles.dots}>
              {dots}
            </Text>
          </View>

          <View style={styles.center}>
            <Text style={styles.note}>
              {isProgressMode
                ? "Target complete"
                : isWorkPhase
                  ? title
                  : `Rest`}
            </Text>

            {isTimedWorkout && (
              <Image
                source={EXERCISE_IMAGES[selectedExercise]}
                style={[
                  styles.exerciseImage,
                  !isWorkPhase && styles.exerciseImageRest,
                ]}
                resizeMode="contain"
              />
            )}

            <Text
              style={[
                styles.timer,
                isProgressMode && styles.progressTimer,
              ]}
            >
              {timerDisplay}
            </Text>

            {isProgressMode ? (
              <Text style={styles.label}>
                seconds beyond target
              </Text>
            ) : null}

            {hint ? (
              <Text style={styles.message}>
                {hint}
              </Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            {showTimedDoneButton && (
              <Pressable
                style={styles.doneButton}
                onPress={handleTimedDone}
              >
                <Text style={styles.doneButtonText}>
                  Done
                </Text>
              </Pressable>
            )}

            <Pressable
              style={styles.pauseButton}
              onPress={handlePause}
            >
              <Text style={styles.pauseButtonText}>
                {pauseButtonText}
              </Text>
            </Pressable>

            <Pressable
              style={styles.abortButton}
              onPress={handleAbort}
            >
              <Text style={styles.abortButtonText}>
                Abort
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  container: {
    flex: 1,
    padding: 18,
    justifyContent: "center",
  },
  card: {
    minHeight: 520,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 18,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseName: {
    color: "#f8fafc",
    fontSize: 26,
    fontWeight: "900",
    flex: 1,
    marginRight: 12,
  },
  dots: {
    color: "#22d3ee",
    fontSize: 18,
    letterSpacing: 3,
  },
  center: {
    alignItems: "center",
  },
  note: {
    color: "#94a3b8",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 18,
    marginBottom: 12,
  },
  exerciseImage: {
    width: "100%",
    height: 200,
  },
  exerciseImageRest: {
    opacity: 0.45,
  },
  timer: {
    color: "#f8fafc",
    fontSize: 86,
    lineHeight: 96,
    fontWeight: "900",
    textAlign: "center",
  },
  progressTimer: {
    color: "#34d399",
  },
  label: {
    color: "#94a3b8",
    fontSize: 22,
    marginBottom: 14,
    textAlign: "center",
  },
  message: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  actions: {
    gap: 10,
  },
  doneButton: {
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "#22d3ee",
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    color: "#082f49",
    fontSize: 20,
    fontWeight: "900",
  },
  pauseButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "rgba(34,211,238,0.14)",
    borderWidth: 1,
    borderColor: "#22d3ee",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  pauseButtonText: {
    color: "#22d3ee",
    fontSize: 17,
    fontWeight: "900",
  },
  abortButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  abortButtonText: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "800",
  },
});