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
  calculateProgressionUpdate,
  getMovement,
  isProgressionEnabled,
  isRepsSettings,
} from "../utils/workoutLogic";

export default function ResultScreen() {
  const {
    appState,
    selectedExercise,
    getCurrentSettings,
    setResultValue,
    saveRepsWorkoutResult,
  } = useWorkoutStore();

  const workout = appState.workout;
  const isBulgarianExercise =
    selectedExercise === "Bulgarian Squats";
  
  const plannedFinalSet = workout.plan[4] ?? 0;
  const actualFinalSet = workout.resultValue;

  const performanceDifference =
    actualFinalSet - plannedFinalSet;

  const repsUnit =
    isBulgarianExercise ? "reps per leg" : "reps";

  const targetReferenceText =
    performanceDifference > 0
      ? `Target: ${plannedFinalSet} ${repsUnit}  •  Extra: +${performanceDifference} ${repsUnit}`
      : performanceDifference < 0
        ? `Target: ${plannedFinalSet} ${repsUnit}  •  ${Math.abs(
            performanceDifference
          )} ${repsUnit} below target`
        : `Target: ${plannedFinalSet} ${repsUnit}  •  Target completed`;
  

  const movement = getMovement(plannedFinalSet, actualFinalSet);

  const currentSettings = getCurrentSettings();

  const progressionEnabled =
    isRepsSettings(currentSettings)
      ? isProgressionEnabled(currentSettings.level)
      : false;

  const currentEstimatedMax =
    isRepsSettings(currentSettings)
      ? Math.max(
          1,
          Math.round(Number(currentSettings.maxReps) || 1)
        )
      : 1;

  const currentProgressPoints =
    isRepsSettings(currentSettings)
      ? currentSettings.progressPoints ?? 0
      : 0;

  const progressionPreview = progressionEnabled
    ? calculateProgressionUpdate(
        currentEstimatedMax,
        currentProgressPoints,
        movement
      )
    : {
        nextMaxReps: currentEstimatedMax,
        nextProgressPoints: currentProgressPoints,
        maxRepsChange: 0,
      };

  function getFeedbackText() {
    if (!progressionEnabled) {
      return "Light workouts support recovery and do not affect your progression.";
    }
    
    if (progressionPreview.maxRepsChange > 0) {
      return isBulgarianExercise
        ? `Great result. Your estimated max will increase from ${currentEstimatedMax} to ${progressionPreview.nextMaxReps} reps per leg.`
        : `Great result. Your estimated max will increase from ${currentEstimatedMax} to ${progressionPreview.nextMaxReps} reps.`;
    }

    if (progressionPreview.maxRepsChange < 0) {
      return isBulgarianExercise
        ? `Verto will adjust your estimated max from ${currentEstimatedMax} to ${progressionPreview.nextMaxReps} reps per leg.`
        : `Verto will adjust your estimated max from ${currentEstimatedMax} to ${progressionPreview.nextMaxReps} reps.`;
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
    setResultValue(actualFinalSet + 1);
  }

  function handleSave() {
    saveRepsWorkoutResult();
    router.replace("/");
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
                    {repsUnit}
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
              Adjust the reps you completed in the last set.
            </Text>

            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackText}>{getFeedbackText()}</Text>
            </View>
          </View>

          <Pressable style={styles.doneButton} onPress={handleSave}>
            <Text style={styles.doneButtonText}>Done</Text>
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