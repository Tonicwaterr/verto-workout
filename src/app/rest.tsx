import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { playTimerFeedback } from "../services/feedback";

import { useWorkoutStore } from "../store/workoutStore";

export default function RestScreen() {
  const {
    appState,
    tickTimer,
    goToNextPass,
    abortWorkout,
  } = useWorkoutStore();

  const workout = appState.workout;
  const hasCompletedRest = useRef(false);

  const nextSet = Math.min(workout.currentPass + 1, 5);

  // Count down one second at a time.
  useEffect(() => {
    if (workout.timerLeft <= 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      tickTimer();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [workout.timerLeft, tickTimer]);


  useEffect(() => {
    if (workout.timerLeft > 0 || hasCompletedRest.current) {
        return;
    }

    hasCompletedRest.current = true;

    playTimerFeedback(appState.globalSettings);
    goToNextPass();
    router.replace("/workout");
    }, [
    workout.timerLeft,
    appState.globalSettings,
    goToNextPass,
    ]);

  function handleSkipRest() {
    if (hasCompletedRest.current) {
      return;
    }

    hasCompletedRest.current = true;
    goToNextPass();
    router.replace("/workout");
  }

  function handleAbort() {
    abortWorkout();
    router.replace("/");
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.heading}>
            <Text style={styles.title}>Rest</Text>
            <Text style={styles.nextSet}>Next: Set {nextSet} of 5</Text>
          </View>

          <View style={styles.timerSection}>
            <Text style={styles.timer}>{workout.timerLeft}</Text>
            <Text style={styles.secondsLabel}>seconds</Text>
            <Text style={styles.message}>Get ready for the next set</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={styles.skipButton}
              onPress={handleSkipRest}
            >
              <Text style={styles.skipButtonText}>Skip Rest</Text>
            </Pressable>

            <Pressable
              style={styles.abortButton}
              onPress={handleAbort}
            >
              <Text style={styles.abortButtonText}>Abort Workout</Text>
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

  heading: {
    alignItems: "center",
  },

  title: {
    color: "#22d3ee",
    fontSize: 34,
    fontWeight: "900",
  },

  nextSet: {
    color: "#94a3b8",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 6,
  },

  timerSection: {
    alignItems: "center",
  },

  timer: {
    color: "#f8fafc",
    fontSize: 130,
    lineHeight: 140,
    fontWeight: "900",
  },

  secondsLabel: {
    color: "#94a3b8",
    fontSize: 22,
    marginBottom: 24,
  },

  message: {
    color: "#f8fafc",
    fontSize: 21,
    fontWeight: "700",
    textAlign: "center",
  },

  actions: {
    gap: 10,
  },

  skipButton: {
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "#22d3ee",
    alignItems: "center",
    justifyContent: "center",
  },

  skipButtonText: {
    color: "#082f49",
    fontSize: 19,
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