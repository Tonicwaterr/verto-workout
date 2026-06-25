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
} from "../utils/workoutLogic";

export default function FinishScreen() {
  const {
    appState,
    selectedExercise,
    getCurrentSettings,
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

  const progressionUpdate =
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

  const performanceDifference =
    actualFinalSet - plannedFinalSet;

  const performanceText =
    performanceDifference > 0
      ? `Target exceeded by ${performanceDifference} ${
          performanceDifference === 1
            ? "second"
            : "seconds"
        }`
      : performanceDifference < 0
        ? `Stopped ${Math.abs(
            performanceDifference
          )} ${
            Math.abs(performanceDifference) === 1
              ? "second"
              : "seconds"
          } before target`
        : "Target completed";

  const estimateText =
    !progressionEnabled
      ? `Estimated max remains ${currentEstimatedMax} sec`
      : progressionUpdate.maxSecondsChange > 0
        ? `Estimated max: ${currentEstimatedMax} → ${progressionUpdate.nextMaxSeconds} sec`
        : progressionUpdate.maxSecondsChange < 0
          ? `Estimated max: ${currentEstimatedMax} → ${progressionUpdate.nextMaxSeconds} sec`
          : `Estimated max remains ${currentEstimatedMax} sec`;

  function handleFinish() {
    if (isTimedWorkout) {
      saveTimedWorkoutResult();
    } else {
      abortWorkout();
    }

    router.replace("/");
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View>
            <Text style={styles.title}>
              Done!
            </Text>

            <Text style={styles.subtitle}>
              {selectedExercise} complete.
            </Text>
          </View>

          {isTimedWorkout && (
            <View style={styles.resultSection}>
              <View style={styles.resultRow}>
                <View style={styles.resultColumn}>
                  <Text style={styles.resultLabel}>
                    Target
                  </Text>

                  <Text style={styles.resultValue}>
                    {plannedFinalSet}
                  </Text>

                  <Text style={styles.resultUnit}>
                    seconds
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.resultColumn}>
                  <Text style={styles.resultLabel}>
                    Completed
                  </Text>

                  <Text style={styles.resultValue}>
                    {actualFinalSet}
                  </Text>

                  <Text style={styles.resultUnit}>
                    seconds
                  </Text>
                </View>
              </View>

              <View style={styles.progressSummary}>
                <Text
                  style={[
                    styles.progressText,
                    performanceDifference > 0 &&
                      styles.progressPositive,
                    performanceDifference < 0 &&
                      styles.progressNegative,
                  ]}
                >
                  {performanceText}
                </Text>

                <Text style={styles.estimateText}>
                  {estimateText}
                </Text>
              </View>
            </View>
          )}

          <Pressable
            style={styles.doneButton}
            onPress={handleFinish}
          >
            <Text style={styles.doneButtonText}>
              {isTimedWorkout
                ? "Save and Finish"
                : "Back to Home"}
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
    minHeight: 460,
    borderRadius: 24,
    backgroundColor:
      "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.12)",
    padding: 18,
    justifyContent: "space-between",
  },
  title: {
    color: "#f8fafc",
    fontSize: 52,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 20,
    textAlign: "center",
  },
  resultSection: {
    gap: 18,
  },
  resultRow: {
    minHeight: 150,
    borderRadius: 20,
    backgroundColor:
      "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  resultColumn: {
    flex: 1,
    alignItems: "center",
  },
  resultLabel: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 5,
  },
  resultValue: {
    color: "#f8fafc",
    fontSize: 44,
    fontWeight: "900",
  },
  resultUnit: {
    color: "#94a3b8",
    fontSize: 13,
  },
  divider: {
    width: 1,
    height: 80,
    backgroundColor:
      "rgba(255,255,255,0.14)",
  },
  progressSummary: {
    alignItems: "center",
  },
  progressText: {
    color: "#f8fafc",
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
  },
  progressPositive: {
    color: "#34d399",
  },
  progressNegative: {
    color: "#f59e0b",
  },
  estimateText: {
    color: "#94a3b8",
    fontSize: 15,
    textAlign: "center",
    marginTop: 7,
  },
  doneButton: {
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "#22d3ee",
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    color: "#052e16",
    fontSize: 20,
    fontWeight: "900",
  },
});