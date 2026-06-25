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
import {
  playFinishFeedback,
  playTimerFeedback,
} from "../services/feedback";
import { useWorkoutStore } from "../store/workoutStore";
import {
  formatTime,
  getTimedSetName,
} from "../utils/workoutLogic";

export default function TimerScreen() {
  const {
    appState,
    selectedExercise,
    tickTimer,
    startRestTimer,
    startNextTimedPass,
    enterTimedProgressMode,
    stopTimedFinalSet,
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

  const isLastRound =
    workout.currentPass >= totalRounds;

  const isProgressMode =
    isTimedWorkout &&
    isWorkPhase &&
    workout.progressModeActive;

  const tickTimerRef = useRef(tickTimer);

  useEffect(() => {
    tickTimerRef.current = tickTimer;
  }, [tickTimer]);

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
    }, 1000);

    return () => clearInterval(intervalId);
  }, [
    workout.active,
    workout.timerRunning,
  ]);

  /*
   * Handles the transition when a countdown reaches zero.
   */
  useEffect(() => {
    if (
      !workout.active ||
      !workout.timerRunning
    ) {
      return;
    }

    /*
     * Progress Mode counts upward and must not trigger another
     * zero-time transition.
     */
    if (isProgressMode) {
      return;
    }

    if (workout.timerLeft > 0) {
      if (workout.timerLeft <= 3) {
        void playTimerFeedback(
          appState.globalSettings
        );
      }

      return;
    }

    if (isWorkPhase) {
      /*
       * The standalone Interval Timer keeps its existing behavior.
       */
      if (
        isIntervalWorkout &&
        isLastRound
      ) {
        void playFinishFeedback(
          appState.globalSettings
        );

        router.replace("/finish");
        return;
      }

      /*
       * The fifth timed exercise set enters Progress Mode instead
       * of ending automatically.
       */
      if (
        isTimedWorkout &&
        isLastRound
      ) {
        void playFinishFeedback(
          appState.globalSettings
        );

        enterTimedProgressMode();
        return;
      }

      void playTimerFeedback(
        appState.globalSettings
      );

      startRestTimer();
      return;
    }

    void playTimerFeedback(
      appState.globalSettings
    );

    startNextTimedPass();
  }, [
    workout.active,
    workout.timerRunning,
    workout.timerLeft,
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
    abortWorkout();
    router.replace("/");
  }

  function handleTimedDone() {
    stopTimedFinalSet();
    router.replace("/finish");
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
    ? "Keep going, then press Done"
    : isIntervalWorkout
      ? isWorkPhase
        ? "Interval work"
        : "Next round starts soon"
      : isWorkPhase
        ? isLastRound
          ? "Press Done whenever you stop"
          : "Hold until the timer reaches zero"
        : `Next exercise: ${nextMovementName}`;

  const timerDisplay = isProgressMode
    ? `+${workout.overtimeSeconds}`
    : formatTime(workout.timerLeft);

  const showTimedDoneButton =
    isTimedWorkout &&
    isWorkPhase &&
    isLastRound;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.exerciseName}>
              {isIntervalWorkout
                ? "Interval Timer"
                : selectedExercise}
            </Text>

            <Text style={styles.phaseText}>
              {title}
            </Text>

            <Text style={styles.setText}>
              {setText}
            </Text>
          </View>

          {isTimedWorkout && (
            <Image
              source={
                EXERCISE_IMAGES[selectedExercise]
              }
              style={[
                styles.exerciseImage,
                !isWorkPhase &&
                  styles.exerciseImageRest,
              ]}
              resizeMode="contain"
            />
          )}

          <View style={styles.timerSection}>
            {isProgressMode && (
              <View style={styles.progressBadge}>
                <Text
                  style={styles.progressBadgeText}
                >
                  TARGET COMPLETE
                </Text>
              </View>
            )}

            <Text
              style={[
                styles.timerValue,
                isProgressMode &&
                  styles.progressTimerValue,
              ]}
            >
              {timerDisplay}
            </Text>

            {isProgressMode && (
              <Text style={styles.secondsText}>
                seconds beyond target
              </Text>
            )}

            <Text style={styles.timerHint}>
              {hint}
            </Text>
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
    padding: 14,
    justifyContent: "center",
  },
  card: {
    flex: 1,
    maxHeight: 760,
    borderRadius: 24,
    backgroundColor:
      "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.12)",
    padding: 18,
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    width: "100%",
    alignItems: "center",
  },
  exerciseName: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 5,
  },
  phaseText: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 7,
  },
  setText: {
    color: "#94a3b8",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  exerciseImage: {
    width: "100%",
    height: 260,
  },
  exerciseImageRest: {
    opacity: 0.5,
  },
  timerSection: {
    alignItems: "center",
  },
  progressBadge: {
    borderRadius: 999,
    backgroundColor:
      "rgba(52,211,153,0.18)",
    borderWidth: 1,
    borderColor: "#34d399",
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 8,
  },
  progressBadgeText: {
    color: "#34d399",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  timerValue: {
    color: "#f8fafc",
    fontSize: 78,
    lineHeight: 88,
    fontWeight: "900",
    textAlign: "center",
  },
  progressTimerValue: {
    color: "#34d399",
  },
  secondsText: {
    color: "#34d399",
    fontSize: 14,
    fontWeight: "800",
    marginTop: -4,
  },
  timerHint: {
    color: "#94a3b8",
    fontSize: 17,
    marginTop: 10,
    textAlign: "center",
  },
  actions: {
    width: "100%",
    gap: 10,
  },
  doneButton: {
    width: "100%",
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: "#22d3ee",
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    color: "#082f49",
    fontSize: 19,
    fontWeight: "900",
  },
  abortButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 16,
    backgroundColor:
      "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  abortButtonText: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "800",
  },
});