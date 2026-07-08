import { router } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useWorkoutStore } from "../store/workoutStore";
import {
  calculateTimedProgressionUpdate,
  getTimedMovement,
  isProgressionEnabled,
  isTimedSettings,
  roundToNearestFive,
  TIMED_PROGRESS_EXTRA_LIMIT_SECONDS,
} from "../utils/workoutLogic";

export default function FinishScreen() {
  const {
    appState,
    selectedExercise,
    getCurrentSettings,
    setResultValue,
    saveTimedWorkoutResult,
    abortWorkout,
  } = useWorkoutStore();

  const workout = appState.workout;
  const settings = getCurrentSettings();

  const isTimedWorkout =
    workout.workoutMode === "timed" &&
    isTimedSettings(settings);

  const plannedFinalSet =
    workout.plan[4] ?? 0;

  const actualFinalSet =
    workout.resultValue;

  const performanceDifference =
    actualFinalSet - plannedFinalSet;

  const targetReferenceText =
    performanceDifference > 0
      ? `Target: ${plannedFinalSet} sec  •  Extra: +${performanceDifference} sec`
      : performanceDifference < 0
        ? `Target: ${plannedFinalSet} sec  •  ${Math.abs(
            performanceDifference
          )} sec below target`
        : `Target: ${plannedFinalSet} sec  •  Target completed`;
  
    const maxAdjustableSeconds =
    plannedFinalSet + TIMED_PROGRESS_EXTRA_LIMIT_SECONDS;

  const movement = isTimedWorkout
    ? getTimedMovement(
        plannedFinalSet,
        actualFinalSet
      )
    : 0;

  const currentEstimatedMax =
    isTimedWorkout
      ? roundToNearestFive(
          Number(
            settings.estimatedMaxSeconds
          ) || 5
        )
      : 0;

  const progressionEnabled =
    isTimedWorkout
      ? isProgressionEnabled(settings.level)
      : false;

  const progressionPreview =
    isTimedWorkout &&
    progressionEnabled
      ? calculateTimedProgressionUpdate(
          currentEstimatedMax,
          settings.progressPoints ?? 0,
          movement
        )
      : {
          nextMaxSeconds:
            currentEstimatedMax,
          nextProgressPoints:
            isTimedWorkout
              ? settings.progressPoints ?? 0
              : 0,
          maxSecondsChange: 0,
        };

  function getFeedbackText() {
    if (!isTimedWorkout) {
      return "Workout complete.";
    }

    if (!progressionEnabled) {
      return "Light workouts support recovery and do not affect your progression.";
    }

    if (progressionPreview.maxSecondsChange > 0) {
      return `Great result. Your estimated max will increase from ${currentEstimatedMax} to ${progressionPreview.nextMaxSeconds} seconds.`;
    }

    if (progressionPreview.maxSecondsChange < 0) {
      return `Verto will adjust your estimated max from ${currentEstimatedMax} to ${progressionPreview.nextMaxSeconds} seconds.`;
    }

    if (movement > 0) {
      return "Better than planned. This moves you closer to a higher estimated max.";
    }

    if (movement < 0) {
      return "Lower than planned. Verto only reduces your estimate after repeated lower results.";
    }

    return "Close to planned. Your estimated max stays the same.";
  }

  function handleMinus() {
    setResultValue(actualFinalSet - 1);
  }

  function handlePlus() {
    setResultValue(
      Math.min(
        actualFinalSet + 1,
        maxAdjustableSeconds
      )
    );
  }

  function handleFinish() {
    if (isTimedWorkout) {
      saveTimedWorkoutResult();
    } else {
      abortWorkout();
    }

    router.replace("/");
  }

  if (!isTimedWorkout) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.container}>
          <View style={styles.card}>
            <View>
              <Text style={styles.title}>
                Done!
              </Text>

              <Text style={styles.subtitle}>
                Workout complete.
              </Text>

              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackText}>
                  {getFeedbackText()}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.doneButton}
              onPress={handleFinish}
            >
              <Text style={styles.doneButtonText}>
                Back to Home
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View>
            <Text style={styles.title}>Set 5</Text>
            <Text style={styles.subtitle}>{selectedExercise}</Text>

            <View style={styles.adjustBlock}>
              <View style={styles.adjustRow}>
                <Pressable style={styles.adjustButton} onPress={handleMinus}>
                  <Text style={styles.adjustButtonText}>−</Text>
                </Pressable>

                <View style={styles.resultBox}>
                  <Text style={styles.resultValue}>
                    {actualFinalSet}
                  </Text>

                  <Text style={styles.resultLabel}>
                    seconds
                  </Text>
                </View>

                <Pressable style={styles.adjustButton} onPress={handlePlus}>
                  <Text style={styles.adjustButtonText}>+</Text>
                </Pressable>
              </View>

              <Text style={styles.targetReference}>
                {targetReferenceText}
              </Text>
            </View>

            <Text style={styles.helperText}>
              Adjust the time you completed in the last set.
            </Text>

            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackText}>
                {getFeedbackText()}
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.doneButton}
            onPress={handleFinish}
          >
            <Text style={styles.doneButtonText}>
              Done
            </Text>
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
  },
  title: {
    color: "#f8fafc",
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
  },
  adjustBlock: {
    alignItems: "center",
    marginBottom: 18,
  },
  adjustRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  adjustButton: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  adjustButtonText: {
    color: "#f8fafc",
    fontSize: 34,
    fontWeight: "900",
  },
  resultBox: {
    width: 130,
    alignItems: "center",
  },
  resultValue: {
    color: "#f8fafc",
    fontSize: 86,
    lineHeight: 96,
    fontWeight: "900",
  },
  resultLabel: {
    color: "#94a3b8",
    fontSize: 18,
  },
  helperText: {
    color: "#94a3b8",
    fontSize: 17,
    textAlign: "center",
    marginBottom: 18,
  },
  feedbackBox: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 16,
    minHeight: 62,
    justifyContent: "center",
  },
  feedbackText: {
    color: "#e2e8f0",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  targetReference: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
    minHeight: 20,
    paddingHorizontal: 8,
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
});