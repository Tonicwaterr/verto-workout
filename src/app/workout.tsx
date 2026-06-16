import { router } from "expo-router";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { EXERCISE_IMAGES } from "../data/exerciseImages";
import { EXERCISES } from "../data/exercises";
import { useWorkoutStore } from "../store/workoutStore";
import { getPassNote } from "../utils/workoutLogic";

export default function WorkoutScreen() {
  const {
    appState,
    selectedExercise,
    startRestTimer,
    abortWorkout,
  } = useWorkoutStore();

  const workout = appState.workout;
  const currentPass = workout.currentPass;
  const currentValue = workout.plan[currentPass - 1] ?? 0;

  const exercise = EXERCISES.find((item) => item.key === selectedExercise);
  const isTimedWorkout = workout.workoutMode === "timed";
  const isBulgarianExercise = exercise?.mode === "bulgarian";

  function getTimedNote() {
    if (selectedExercise === "Plank") {
      return currentPass % 2 === 0 ? "Side plank" : "Front plank";
    }

    if (selectedExercise === "Superman") {
      return "Superman hold";
    }

    if (selectedExercise === "Mountain Climbers") {
      return "Mountain climbers";
    }

    return "Timed set";
  }

  function handleDone() {
    if (currentPass >= 5) {
      if (isTimedWorkout) {
        router.push("/finish");
        return;
      }

      router.push("/result");
      return;
    }

    startRestTimer();
    router.push("/rest");
  }

  function handleAbort() {
    abortWorkout();
    router.replace("/");
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.topRow}>
            <Text style={styles.passTitle}>Set {currentPass}</Text>
            <Text style={styles.dots}>
              {"●".repeat(currentPass)}
              {"○".repeat(5 - currentPass)}
            </Text>
          </View>

          <View style={styles.center}>
            <Text style={styles.exerciseName}>{selectedExercise}</Text>
              {exercise ? (
                <Image
                  source={EXERCISE_IMAGES[exercise.key]}
                  style={styles.exerciseImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.exerciseIcon}>•</Text>
              )}

            {isBulgarianExercise ? (
              <View style={styles.bulgarianBlock}>
                <View style={styles.legRow}>
                  <Text style={styles.legLabel}>LEFT LEG</Text>
                  <Text style={styles.legValue}>{currentValue}</Text>
                </View>

                <View style={styles.legDivider} />

                <View style={styles.legRow}>
                  <Text style={styles.legLabel}>RIGHT LEG</Text>
                  <Text style={styles.legValue}>{currentValue}</Text>
                </View>

                <Text style={styles.label}>reps per leg</Text>
              </View>
            ) : (
              <>
                <Text style={styles.reps}>{currentValue}</Text>

                <Text style={styles.label}>
                  {isTimedWorkout ? "seconds" : "reps"}
                </Text>
              </>
            )}

            <Text style={styles.note}>
              {isTimedWorkout ? getTimedNote() : getPassNote(currentPass)}
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.doneButton} onPress={handleDone}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>

            <Pressable style={styles.abortButton} onPress={handleAbort}>
              <Text style={styles.abortButtonText}>Abort</Text>
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
  passTitle: {
    color: "#f8fafc",
    fontSize: 26,
    fontWeight: "900",
  },
  dots: {
    color: "#22d3ee",
    fontSize: 18,
    letterSpacing: 3,
  },
  center: {
    alignItems: "center",
  },
  exerciseName: {
    color: "#94a3b8",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 18,
  },
  exerciseIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  reps: {
    color: "#f8fafc",
    fontSize: 120,
    lineHeight: 128,
    fontWeight: "900",
  },
  bulgarianBlock: {
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  legRow: {
    width: "82%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  legLabel: {
    color: "#94a3b8",
    fontSize: 18,
    fontWeight: "800",
  },
  legValue: {
    color: "#f8fafc",
    fontSize: 54,
    lineHeight: 60,
    fontWeight: "900",
  },
  legDivider: {
    width: "82%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  label: {
    color: "#94a3b8",
    fontSize: 22,
    marginBottom: 20,
  },
  note: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
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
  exerciseImage: {
    width: "100%",
    height: 160,
    marginBottom: 20,
  },
});