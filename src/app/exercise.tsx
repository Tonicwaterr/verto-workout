import { router } from "expo-router";
import { useMemo } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { EXERCISES } from "../data/exercises";
import { EXERCISE_IMAGES } from "../data/exerciseImages";
import { useWorkoutStore } from "../store/workoutStore";
import {
  DEFAULT_REPS_REST,
  DEFAULT_TIMED_REST,
  DEFAULT_TIMED_WORK,
  buildPlan,
  isRepsSettings,
} from "../utils/workoutLogic";

export default function ExerciseScreen() {

  const {
    selectedExercise,
    getCurrentSettings,
    updateCurrentSettings,
    startRepsWorkout,
    startTimedWorkout,
    startIntervalWorkout,
    resetCurrentExercise,
  } = useWorkoutStore();


  const exercise = useMemo(() => {
    return EXERCISES.find((item) => item.key === selectedExercise) ?? EXERCISES[0];
  }, [selectedExercise]);

  const settings = getCurrentSettings();

  const isRepsExercise =
    exercise.mode === "reps" || exercise.mode === "bulgarian";

  const isCustomTimer = exercise.mode === "custom_timer";

  const previewPlan = useMemo(() => {
    if (!isRepsSettings(settings)) {
      return [0, 0, 0, 0, 0];
    }

    const parsedMaxReps = Number(settings.maxReps);

    if (!parsedMaxReps) {
      return [0, 0, 0, 0, 0];
    }

    return buildPlan(parsedMaxReps, settings.level, settings.progressStage);
  }, [settings]);

  const maxRepsValue = isRepsSettings(settings) ? settings.maxReps : "";
  const levelValue = isRepsSettings(settings) ? settings.level : 3;

  const restTimeValue = "restTime" in settings ? settings.restTime : "";
  const workTimeValue = "workTime" in settings ? settings.workTime : "";
  const roundsValue = "rounds" in settings ? settings.rounds : "";

  function handleContinue() {
    if (isRepsExercise && isRepsSettings(settings)) {
      const parsedMaxReps = Number(settings.maxReps);

      if (!parsedMaxReps || parsedMaxReps < 1) {
        return;
      }

      const parsedRestTime = Number(settings.restTime) || DEFAULT_REPS_REST;
      const plan = buildPlan(parsedMaxReps, settings.level, settings.progressStage);

      startRepsWorkout(plan, parsedRestTime);
      router.push("/workout");
      return;
    }

    if (isCustomTimer && "workTime" in settings && "restTime" in settings && "rounds" in settings) {
      const parsedWorkTime = Number(settings.workTime) || DEFAULT_TIMED_WORK;
      const parsedRestTime = Number(settings.restTime) || DEFAULT_TIMED_REST;
      const parsedRounds = Number(settings.rounds) || 8;

      startIntervalWorkout(parsedWorkTime, parsedRestTime, parsedRounds);
      router.push("/timer");
      return;
    }

    if (!isCustomTimer && "workTime" in settings && "restTime" in settings) {
      const parsedWorkTime = Number(settings.workTime) || DEFAULT_TIMED_WORK;
      const parsedRestTime = Number(settings.restTime) || DEFAULT_TIMED_REST;

      startTimedWorkout(parsedWorkTime, parsedRestTime);
      router.push("/timer");
    }
  }

  function handleResetExercise() {
    Alert.alert(
      "Reset exercise?",
      `This will reset saved settings and progression for ${selectedExercise}. History will be kept.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: resetCurrentExercise,
        },
      ]
    );
  }
  
  return (
   <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
   <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.title}>{exercise.key}</Text>

            <Pressable style={styles.closeButton} onPress={() => router.back()}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <Image
            source={EXERCISE_IMAGES[exercise.key]}
            style={styles.exerciseImage}
            resizeMode="contain"
          />

          {isRepsExercise ? (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Max reps test</Text>
                <TextInput
                  value={maxRepsValue}
                  onChangeText={(value) =>
                    updateCurrentSettings({ maxReps: value })
                  }
                  keyboardType="number-pad"
                  placeholder="For example 20"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Rest time seconds</Text>
                <TextInput
                  value={restTimeValue}
                  onChangeText={(value) =>
                    updateCurrentSettings({
                        restTime: value,
                    })
                    }
                  keyboardType="number-pad"
                  placeholder="90"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Difficulty</Text>

                <View style={styles.levelRow}>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <Pressable
                      key={item}
                      style={[
                        styles.levelButton,
                        levelValue === item && styles.levelButtonSelected,
                      ]}
                      onPress={() => updateCurrentSettings({ level: item })}
                    >
                      <Text
                        style={[
                          styles.levelButtonText,
                          levelValue === item && styles.levelButtonTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>Next exercise</Text>
                <Text style={styles.previewValue}>
                  {previewPlan.join(" / ")}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Work time seconds</Text>
                <TextInput
                  value={workTimeValue}
                  onChangeText={(value) =>
                    updateCurrentSettings({
                        workTime: value,
                    })
                    }
                  keyboardType="number-pad"
                  placeholder="30"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Rest time seconds</Text>
                <TextInput
                  value={restTimeValue}
                  onChangeText={(value) =>
                    updateCurrentSettings({
                        restTime: value,
                    })
                    }
                  keyboardType="number-pad"
                  placeholder="20"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                />
              </View>

              {isCustomTimer && (
                <View style={styles.field}>
                  <Text style={styles.label}>Rounds</Text>
                  <TextInput
                    value={roundsValue}
                    onChangeText={(value) =>
                        updateCurrentSettings({
                            rounds: value,
                        })
                        }
                    keyboardType="number-pad"
                    placeholder="8"
                    placeholderTextColor="#64748b"
                    style={styles.input}
                  />
                </View>
              )}
            </>
          )}

          <Pressable style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleResetExercise}>
            <Text style={styles.secondaryButtonText}>Reset Exercise</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
    </TouchableWithoutFeedback>
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
  title: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "800",
  },
  card: {
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "#f8fafc",
    paddingHorizontal: 14,
    fontSize: 17,
  },
  levelRow: {
    flexDirection: "row",
    gap: 8,
  },
  levelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  levelButtonSelected: {
    backgroundColor: "#22d3ee",
    borderColor: "#22d3ee",
  },
  levelButtonText: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "800",
  },
  levelButtonTextSelected: {
    color: "#082f49",
  },
  previewBox: {
    borderRadius: 18,
    backgroundColor: "rgba(34,211,238,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  previewLabel: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 8,
  },
  previewValue: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  continueButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#34d399",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  continueButtonText: {
    color: "#052e16",
    fontSize: 18,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  secondaryButtonText: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "800",
  },
  exerciseImage: {
    width: "100%",
    height: 220,
  },
});