import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { EXERCISE_IMAGES } from "../data/exerciseImages";
import { EXERCISES } from "../data/exercises";
import { useWorkoutStore } from "../store/workoutStore";
import {
  DEFAULT_REPS_REST,
  DEFAULT_TIMED_REST,
  DEFAULT_TIMED_WORK,
  DIFFICULTY_OPTIONS,
  buildPlan,
  isRepsSettings,
  normalizeDifficultyLevel,
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

  const [isSettingsModalVisible, setIsSettingsModalVisible] =
    useState(false);

  const [settingsModalStep, setSettingsModalStep] =
    useState<1 | 2>(1);

  const [draftMaxReps, setDraftMaxReps] = useState("");
  const [draftRestTime, setDraftRestTime] = useState("");

  const isRepsExercise =
    exercise.mode === "reps" || exercise.mode === "bulgarian";

  const isBulgarianExercise = exercise.mode === "bulgarian";
  
    const isCustomTimer = exercise.mode === "custom_timer";

  const previewPlan = useMemo(() => {
    if (!isRepsSettings(settings)) {
      return [0, 0, 0, 0, 0];
    }

    const parsedMaxReps = Number(settings.maxReps);

    if (!parsedMaxReps) {
      return [0, 0, 0, 0, 0];
    }

    const normalizedLevel = normalizeDifficultyLevel(settings.level);

    return buildPlan(
      parsedMaxReps,
      normalizedLevel
    );
  }, [settings]);

  const maxRepsValue = isRepsSettings(settings) ? settings.maxReps : "";
  const levelValue = isRepsSettings(settings)
    ? normalizeDifficultyLevel(settings.level)
    : 3;

  const restTimeValue = "restTime" in settings ? settings.restTime : "";
  const workTimeValue = "workTime" in settings ? settings.workTime : "";
  const roundsValue = "rounds" in settings ? settings.rounds : "";

  const hasConfiguredExercise =
    !isRepsExercise || maxRepsValue.trim().length > 0;
  
  useEffect(() => {
    if (!isRepsExercise || maxRepsValue.trim().length > 0) {
      return;
    }

    setDraftMaxReps(maxRepsValue);
    setDraftRestTime(restTimeValue);
    setSettingsModalStep(1);
    setIsSettingsModalVisible(true);
  }, [
    selectedExercise,
    isRepsExercise,
    maxRepsValue,
    restTimeValue,
  ]);
  
  function openSettingsModal() {
    if (!isRepsExercise || !isRepsSettings(settings)) {
      return;
    }

    setDraftMaxReps(settings.maxReps);
    setDraftRestTime(settings.restTime);
    setSettingsModalStep(1);
    setIsSettingsModalVisible(true);
  }

  function closeSettingsModal() {
    if (!hasConfiguredExercise) {
      return;
    }

    setIsSettingsModalVisible(false);
    setSettingsModalStep(1);
    Keyboard.dismiss();
  }

  function saveExerciseSettings() {
    const parsedMaxReps = Number(draftMaxReps);
    const parsedRestTime =
      Number(draftRestTime) || DEFAULT_REPS_REST;

    if (!Number.isFinite(parsedMaxReps) || parsedMaxReps < 1) {
      Alert.alert(
        "Enter estimated max reps",
        "Estimated max reps must be at least 1."
      );
      return;
    }

    if (!Number.isFinite(parsedRestTime) || parsedRestTime < 1) {
      Alert.alert(
        "Enter rest time",
        "Rest time must be at least 1 second."
      );
      return;
    }

    if (!isRepsSettings(settings)) {
      return;
    }

    const nextMaxReps = String(
      Math.round(parsedMaxReps)
    );

    const estimatedMaxChanged =
      nextMaxReps !== settings.maxReps;

    updateCurrentSettings({
      maxReps: nextMaxReps,
      restTime: String(Math.round(parsedRestTime)),
      progressPoints: estimatedMaxChanged
        ? 0
        : settings.progressPoints,
    });

    setIsSettingsModalVisible(false);
    setSettingsModalStep(1);
    Keyboard.dismiss();
  }

  function handleContinue() {
    if (isRepsExercise && isRepsSettings(settings)) {
      const parsedMaxReps = Number(settings.maxReps);

      if (!parsedMaxReps || parsedMaxReps < 1) {
        return;
      }

      const parsedRestTime =
        Number(settings.restTime) || DEFAULT_REPS_REST;

      const normalizedLevel =
        normalizeDifficultyLevel(settings.level);

      const plan = buildPlan(
        parsedMaxReps,
        normalizedLevel
      );

      updateCurrentSettings({
        level: normalizedLevel,
      });

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
                <View style={styles.settingsSummary}>
                  <View style={styles.settingsSummaryText}>
                    <Text style={styles.settingsSummaryTitle}>
                      Exercise settings
                    </Text>

                    <Text style={styles.settingsSummaryValue}>
                      {hasConfiguredExercise
                        ? `Estimated max: ${maxRepsValue}${
                            isBulgarianExercise ? " per leg" : " reps"
                          }  •  Rest: ${
                            restTimeValue || DEFAULT_REPS_REST
                          } sec`
                        : "Setup required"}
                    </Text>
                  </View>

                  <Pressable
                    style={styles.editSettingsButton}
                    onPress={openSettingsModal}
                  >
                    <Text style={styles.editSettingsButtonText}>Edit</Text>
                  </Pressable>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Difficulty</Text>

                  <View style={styles.levelRow}>
                    {DIFFICULTY_OPTIONS.map((option) => {
                      const isSelected = levelValue === option.value;

                      return (
                        <Pressable
                          key={option.value}
                          style={[
                            styles.levelButton,
                            isSelected && styles.levelButtonSelected,
                          ]}
                          onPress={() =>
                            updateCurrentSettings({
                              level: option.value,
                            })
                          }
                        >
                          <Text
                            style={[
                              styles.levelButtonText,
                              isSelected && styles.levelButtonTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>                        
                        </Pressable>
                      );
                    })}
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

        <Modal
          visible={isSettingsModalVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={closeSettingsModal}
        >
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalStep}>
                    Step {settingsModalStep} of 2
                  </Text>

                  {hasConfiguredExercise && (
                    <Pressable
                      style={styles.modalCloseButton}
                      onPress={closeSettingsModal}
                    >
                      <Text style={styles.modalCloseButtonText}>✕</Text>
                    </Pressable>
                  )}
                </View>

                {settingsModalStep === 1 ? (
                  <>
                    <View style={styles.modalIntroduction}>
                      <Text style={styles.modalExerciseTitle}>
                        {exercise.key}
                      </Text>
                    </View>

                    <Pressable
                      style={styles.modalPrimaryButton}
                      onPress={() => setSettingsModalStep(2)}
                    >
                      <Text style={styles.modalPrimaryButtonText}>
                        Next
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>
                        Exercise Settings
                      </Text>

                      <View style={styles.modalField}>
                        <Text style={styles.label}>
                          {isBulgarianExercise
                            ? "Estimated max reps per leg"
                            : "Estimated max reps"}
                        </Text>

                        <TextInput
                          value={draftMaxReps}
                          onChangeText={setDraftMaxReps}
                          keyboardType="number-pad"
                          placeholder="For example 20"
                          placeholderTextColor="#64748b"
                          style={styles.input}
                        />
                      </View>

                      <View style={styles.modalField}>
                        <Text style={styles.label}>
                          Rest between sets
                        </Text>

                        <TextInput
                          value={draftRestTime}
                          onChangeText={setDraftRestTime}
                          keyboardType="number-pad"
                          placeholder="90 seconds"
                          placeholderTextColor="#64748b"
                          style={styles.input}
                        />
                      </View>
                    </View>

                    <View style={styles.modalActions}>
                      <Pressable
                        style={styles.modalBackButton}
                        onPress={() => setSettingsModalStep(1)}
                      >
                        <Text style={styles.modalBackButtonText}>
                          Back
                        </Text>
                      </Pressable>

                      <Pressable
                        style={styles.modalSaveButton}
                        onPress={saveExerciseSettings}
                      >
                        <Text style={styles.modalSaveButtonText}>
                          Save
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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
    minHeight: 64,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  levelButtonSelected: {
    backgroundColor: "rgba(34,211,238,0.16)",
    borderColor: "#22d3ee",
  },
  levelButtonText: {
    color: "#cbd5e1",
    fontSize: 15,
    fontWeight: "800",
  },
  levelButtonTextSelected: {
    color: "#22d3ee",
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
  settingsSummary: {
    minHeight: 64,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  settingsSummaryText: {
    flex: 1,
  },
  settingsSummaryTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "800",
  },
  settingsSummaryValue: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4,
  },
  editSettingsButton: {
    minWidth: 58,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#22d3ee",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  editSettingsButtonText: {
    color: "#22d3ee",
    fontSize: 14,
    fontWeight: "800",
  },

  /* Settings modal */
  
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.82)",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "100%",
    maxWidth: 460,
    minHeight: 360,
    borderRadius: 24,
    backgroundColor: "#172033",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 20,
    justifyContent: "space-between",
  },
  modalHeader: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalStep: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
  },
  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseButtonText: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900",
  },
  modalIntroduction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  modalExerciseTitle: {
    color: "#f8fafc",
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
  },
  modalContent: {
    flex: 1,
  },
  modalTitle: {
    color: "#f8fafc",
    fontSize: 25,
    fontWeight: "900",
    marginBottom: 22,
  },
  modalField: {
    marginBottom: 16,
  },
  modalPrimaryButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#22d3ee",
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryButtonText: {
    color: "#082f49",
    fontSize: 18,
    fontWeight: "900",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  modalBackButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackButtonText: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "800",
  },
  modalSaveButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#22d3ee",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveButtonText: {
    color: "#082f49",
    fontSize: 17,
    fontWeight: "900",
  },
});