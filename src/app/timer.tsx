import { router } from "expo-router";
import { useEffect } from "react";
import { playFinishFeedback, playTimerFeedback } from "../services/feedback";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useWorkoutStore } from "../store/workoutStore";
import { formatTime } from "../utils/workoutLogic";

export default function TimerScreen() {
  const {
    appState,
    selectedExercise,
    tickTimer,
    startRestTimer,
    startNextTimedPass,
    abortWorkout,
  } = useWorkoutStore();

  const workout = appState.workout;
  const isWorkPhase = workout.timerPhase === "work";
  const totalRounds = workout.plan.length;
  const isLastRound = workout.currentPass >= totalRounds;
  const isIntervalWorkout = workout.workoutMode === "interval";

  useEffect(() => {
    const intervalId = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [tickTimer]);

  useEffect(() => {
    if (workout.timerLeft > 0) {
      if (workout.timerLeft <= 3) {
        playTimerFeedback(appState.globalSettings);
      }

      return;
    }

    if (isWorkPhase) {
      if (isLastRound) {
        playFinishFeedback(appState.globalSettings);
        router.replace("/finish");
        return;
      }

      playTimerFeedback(appState.globalSettings);
      startRestTimer();
      return;
    }

    playTimerFeedback(appState.globalSettings);
    startNextTimedPass();
  }, [
    workout.timerLeft,
    isWorkPhase,
    isLastRound,
    startRestTimer,
    startNextTimedPass,
    appState.globalSettings,
  ]);

  function handleAbort() {
    abortWorkout();
    router.replace("/");
  }

  const title = isIntervalWorkout
    ? isWorkPhase
      ? "Work"
      : "Rest"
    : isWorkPhase
      ? selectedExercise
      : "Rest";

  const hint = isIntervalWorkout
    ? isWorkPhase
      ? "Interval work"
      : "Next round starts soon"
    : isWorkPhase
      ? "Work"
      : "Next set starts soon";

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View>
            <Text style={styles.phaseText}>{title}</Text>

            <Text style={styles.setText}>
              {isIntervalWorkout ? "Round" : "Set"} {workout.currentPass} /{" "}
              {totalRounds}
            </Text>
          </View>

          <View style={styles.timerBox}>
            <Text style={styles.timerValue}>{formatTime(workout.timerLeft)}</Text>
            <Text style={styles.timerHint}>{hint}</Text>
          </View>

          <Pressable style={styles.abortButton} onPress={handleAbort}>
            <Text style={styles.abortButtonText}>Abort</Text>
          </Pressable>
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
    alignItems: "center",
  },
  phaseText: {
    color: "#f8fafc",
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  setText: {
    color: "#94a3b8",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  timerBox: {
    alignItems: "center",
  },
  timerValue: {
    color: "#f8fafc",
    fontSize: 86,
    lineHeight: 96,
    fontWeight: "900",
  },
  timerHint: {
    color: "#94a3b8",
    fontSize: 18,
    marginTop: 10,
    textAlign: "center",
  },
  abortButton: {
    width: "100%",
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