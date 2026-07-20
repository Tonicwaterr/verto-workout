import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { EXERCISE_IMAGES } from "../data/exerciseImages";
import { EXERCISES } from "../data/exercises";
import { useWorkoutStore } from "../store/workoutStore";
import {
  AUTO_COUNTER_TEMPO_OPTIONS,
  DEFAULT_REPS_REST,
  DEFAULT_TIMED_REST,
  DEFAULT_TIMED_WORK,
  DIFFICULTY_OPTIONS,
  buildPlan,
  buildTimedPlan,
  getSecondsPerRep,
  isRepsSettings,
  isTimedSettings,
  normalizeDifficultyLevel,
  normalizeRepsTempo,
  roundToNearestFive,
} from "../utils/workoutLogic";

import type { RepsTempo } from "../types/workout";

function SwipeSafeTextInput(props: TextInputProps) {
  const inputRef = useRef<TextInput | null>(null);
  const [isEditable, setIsEditable] = useState(false);

  function handlePress() {
    setIsEditable(true);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  return (
    <Pressable onPress={handlePress}>
      <TextInput
        {...props}
        ref={inputRef}
        editable={isEditable}
        pointerEvents={isEditable ? "auto" : "none"}
        onBlur={(event) => {
          setIsEditable(false);
          props.onBlur?.(event);
        }}
      />
    </Pressable>
  );
}

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

  const [settingsModalPage, setSettingsModalPage] =
    useState<0 | 1>(0);

  const modalScrollRef = useRef<ScrollView | null>(null);

  const { width: windowWidth } = useWindowDimensions();

  const modalCardWidth = Math.min(windowWidth - 24, 520);
  const modalPageWidth = modalCardWidth - 32;

  const [draftMaxValue, setDraftMaxValue] = useState("");
  const [draftRestTime, setDraftRestTime] = useState("");

  const [draftAutoCounterEnabled, setDraftAutoCounterEnabled] =
    useState(false);
  const [draftAutoCounterTempo, setDraftAutoCounterTempo] =
    useState<RepsTempo>("medium");

  const isRepsExercise =
    exercise.mode === "reps" ||
    exercise.mode === "bulgarian";

  const isTimedExercise =
    exercise.mode === "timed_plank" ||
    exercise.mode === "timed_superman" ||
    exercise.mode === "timed_mountain";

  const isConfigurableExercise =
    isRepsExercise || isTimedExercise;

  const isBulgarianExercise =
    exercise.mode === "bulgarian";

  const supportsAutoCounter =
    exercise.mode === "reps";
  
  const isCustomTimer =
    exercise.mode === "custom_timer";

  const previewPlan = useMemo(() => {
    if (isRepsSettings(settings)) {
      const parsedMaxReps =
        Number(settings.maxReps);

      if (!parsedMaxReps) {
        return [0, 0, 0, 0, 0];
      }

      return buildPlan(
        parsedMaxReps,
        normalizeDifficultyLevel(settings.level)
      );
    }

    if (isTimedSettings(settings)) {
      const parsedMaxSeconds =
        Number(settings.estimatedMaxSeconds);

      if (!parsedMaxSeconds) {
        return [0, 0, 0, 0, 0];
      }

      return buildTimedPlan(
        parsedMaxSeconds,
        normalizeDifficultyLevel(settings.level)
      );
    }

    return [0, 0, 0, 0, 0];
  }, [settings]);

  const maxRepsValue =
    isRepsSettings(settings)
      ? settings.maxReps
      : "";

  const estimatedMaxSecondsValue =
    isTimedSettings(settings)
      ? settings.estimatedMaxSeconds
      : "";

  const levelValue =
    isRepsSettings(settings) ||
    isTimedSettings(settings)
      ? normalizeDifficultyLevel(settings.level)
      : 3;

  const restTimeValue =
    "restTime" in settings
      ? settings.restTime
      : "";

  const workTimeValue =
    isCustomTimer && "workTime" in settings
      ? settings.workTime
      : "";

  const roundsValue =
    "rounds" in settings
      ? settings.rounds
      : "";

  const configuredMaxValue =
    isRepsExercise
      ? maxRepsValue
      : isTimedExercise
        ? estimatedMaxSecondsValue
        : "";

  const hasConfiguredExercise =
    !isConfigurableExercise ||
    configuredMaxValue.trim().length > 0;
  
  function scrollToModalPage(page: 0 | 1, animated = true) {
    setSettingsModalPage(page);

    requestAnimationFrame(() => {
      modalScrollRef.current?.scrollTo({
        x: modalPageWidth * page,
        animated,
      });
    });
  }

  function handleModalScrollEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const nextPage = Math.round(
      event.nativeEvent.contentOffset.x / modalPageWidth
    ) as 0 | 1;

    setSettingsModalPage(nextPage);
  } 

  useEffect(() => {
    if (
      !isConfigurableExercise ||
      configuredMaxValue.trim().length > 0
    ) {
      return;
    }

    setDraftMaxValue(configuredMaxValue);
    setDraftRestTime(restTimeValue);
    if (isRepsSettings(settings)) {
      setDraftAutoCounterEnabled(
        settings.autoCounterEnabled
      );
      setDraftAutoCounterTempo(
        normalizeRepsTempo(settings.autoCounterTempo)
      );
    } else {
      setDraftAutoCounterEnabled(false);
      setDraftAutoCounterTempo("medium");
    }
    setSettingsModalPage(0);
    setIsSettingsModalVisible(true);
  }, [
    selectedExercise,
    isConfigurableExercise,
    configuredMaxValue,
    restTimeValue,
  ]);

  useEffect(() => {
    if (!isSettingsModalVisible) {
      return;
    }

    requestAnimationFrame(() => {
      modalScrollRef.current?.scrollTo({
        x: modalPageWidth * settingsModalPage,
        animated: false,
      });
    });
  }, [
    isSettingsModalVisible,
    modalPageWidth,
    settingsModalPage,
  ]);
  
  function openSettingsModal() {
    if (
      !isConfigurableExercise ||
      (!isRepsSettings(settings) &&
        !isTimedSettings(settings))
    ) {
      return;
    }

    setDraftMaxValue(
      isRepsSettings(settings)
        ? settings.maxReps
        : settings.estimatedMaxSeconds
    );

    setDraftRestTime(settings.restTime);

    if (isRepsSettings(settings)) {
      setDraftAutoCounterEnabled(
        settings.autoCounterEnabled
      );
      setDraftAutoCounterTempo(
        normalizeRepsTempo(settings.autoCounterTempo)
      );
    } else {
      setDraftAutoCounterEnabled(false);
      setDraftAutoCounterTempo("medium");
    }

    /*
    * If this is the first setup, show Info first.
    * Later, the Settings button should open Settings first.
    */
    const shouldShowInfoFirst =
      !hasConfiguredExercise ||
      !settings.hasSeenInfo;

    setSettingsModalPage(shouldShowInfoFirst ? 0 : 1);
    setIsSettingsModalVisible(true);
  }

  function closeSettingsModal() {
    if (!hasConfiguredExercise) {
      return;
    }

    setIsSettingsModalVisible(false);
    Keyboard.dismiss();
  }

  function saveExerciseSettings() {
    const parsedMaxValue =
      Number(draftMaxValue);

    const defaultRestTime =
      isTimedExercise
        ? DEFAULT_TIMED_REST
        : DEFAULT_REPS_REST;

    const parsedRestTime =
      Number(draftRestTime) ||
      defaultRestTime;

    const minimumMaxValue =
      isTimedExercise ? 5 : 1;

    if (
      !Number.isFinite(parsedMaxValue) ||
      parsedMaxValue < minimumMaxValue
    ) {
      Alert.alert(
        isTimedExercise
          ? "Enter estimated max time"
          : "Enter estimated max reps",
        isTimedExercise
          ? "Estimated max time must be at least 5 seconds."
          : "Estimated max reps must be at least 1."
      );

      return;
    }

    if (
      !Number.isFinite(parsedRestTime) ||
      parsedRestTime < 1
    ) {
      Alert.alert(
        "Enter rest time",
        "Rest time must be at least 1 second."
      );

      return;
    }

    if (isRepsSettings(settings)) {
      const nextMaxReps =
        String(Math.round(parsedMaxValue));

      const estimatedMaxChanged =
        nextMaxReps !== settings.maxReps;

      updateCurrentSettings({
        maxReps: nextMaxReps,
        restTime: String(
          Math.round(parsedRestTime)
        ),
        progressPoints: estimatedMaxChanged
          ? 0
          : settings.progressPoints,
        hasSeenInfo: true,
        autoCounterEnabled:
          supportsAutoCounter &&
          draftAutoCounterEnabled,
        autoCounterTempo: normalizeRepsTempo(
          draftAutoCounterTempo
        ),
      });
    } else if (isTimedSettings(settings)) {
      const nextMaxSeconds =
        String(
          roundToNearestFive(parsedMaxValue)
        );

      const estimatedMaxChanged =
        nextMaxSeconds !==
        settings.estimatedMaxSeconds;

      updateCurrentSettings({
        estimatedMaxSeconds:
          nextMaxSeconds,
        restTime: String(
          Math.round(parsedRestTime)
        ),
        progressPoints: estimatedMaxChanged
          ? 0
          : settings.progressPoints,
        hasSeenInfo: true,
      });
    } else {
      return;
    }

    setIsSettingsModalVisible(false);
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

      startRepsWorkout(
        plan,
        parsedRestTime,
        {
          enabled:
            supportsAutoCounter &&
            settings.autoCounterEnabled,
          tempoSeconds: getSecondsPerRep(
            settings.autoCounterTempo
          ),
        }
      );

      router.push("/workout");
      return;
    }

    if (
      isTimedExercise &&
      isTimedSettings(settings)
    ) {
      const parsedMaxSeconds =
        Number(settings.estimatedMaxSeconds);

      if (
        !parsedMaxSeconds ||
        parsedMaxSeconds < 5
      ) {
        return;
      }

      const parsedRestTime =
        Number(settings.restTime) ||
        DEFAULT_TIMED_REST;

      const normalizedLevel =
        normalizeDifficultyLevel(
          settings.level
        );

      const normalizedMaxSeconds =
        roundToNearestFive(
          parsedMaxSeconds
        );

      const plan = buildTimedPlan(
        normalizedMaxSeconds,
        normalizedLevel
      );

      updateCurrentSettings({
        estimatedMaxSeconds:
          String(normalizedMaxSeconds),
        level: normalizedLevel,
      });

      startTimedWorkout(
        plan,
        parsedRestTime
      );

      router.push("/timer");
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
          onPress: () => {
            resetCurrentExercise();
            setIsSettingsModalVisible(false);
            Keyboard.dismiss();
          },
        },
      ]
    );
  }
  
  return (
   <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <SafeAreaView style={styles.screen}>
        <View style={styles.container}>
          

            <View style={styles.cardHeader}>
              <Text style={styles.title}>{exercise.key}</Text>

              <Pressable style={styles.closeButton} onPress={() => router.back()}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            

            {isConfigurableExercise ? (
              <>               
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

                <View style={styles.previewSection}>
                  <Text style={styles.previewLabel}>Next workout</Text>

                  <Text style={styles.previewValue}>
                    {previewPlan.join(" / ")}
                    {isTimedExercise ? " sec" : ""}
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

            <Image
              source={EXERCISE_IMAGES[exercise.key]}
              style={styles.exerciseImage}
              resizeMode="contain"
            />

            <Pressable style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </Pressable>

            {isConfigurableExercise && (
              <Pressable
                style={styles.secondaryButton}
                onPress={openSettingsModal}
              >
                <Text style={styles.secondaryButtonText}>
                  Settings
                </Text>
              </Pressable>
            )}
          
        </View>

        <Modal
          visible={isSettingsModalVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={closeSettingsModal}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalCard,
                { width: modalCardWidth },
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalTabs}>
                  <Pressable
                    style={[
                      styles.modalTab,
                      settingsModalPage === 0 &&
                        styles.modalTabSelected,
                    ]}
                    onPress={() => scrollToModalPage(0)}
                  >
                    <Text
                      style={[
                        styles.modalTabText,
                        settingsModalPage === 0 &&
                          styles.modalTabTextSelected,
                      ]}
                    >
                      Info
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.modalTab,
                      settingsModalPage === 1 &&
                        styles.modalTabSelected,
                    ]}
                    onPress={() => scrollToModalPage(1)}
                  >
                    <Text
                      style={[
                        styles.modalTabText,
                        settingsModalPage === 1 &&
                          styles.modalTabTextSelected,
                      ]}
                    >
                      Settings
                    </Text>
                  </Pressable>
                </View>

                {hasConfiguredExercise && (
                  <Pressable
                    style={styles.modalCloseButton}
                    onPress={closeSettingsModal}
                  >
                    <Text style={styles.modalCloseButtonText}>
                      ✕
                    </Text>
                  </Pressable>
                )}
              </View>

              <ScrollView
                ref={modalScrollRef}
                horizontal
                pagingEnabled
                bounces
                alwaysBounceHorizontal
                canCancelContentTouches
                directionalLockEnabled
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                snapToInterval={modalPageWidth}
                decelerationRate="fast"
                disableIntervalMomentum
                onMomentumScrollEnd={handleModalScrollEnd}
                scrollEventThrottle={16}
                style={[
                  styles.modalPager,
                  { width: modalPageWidth },
                ]}
              >
                <View
                  style={[
                    styles.modalPage,
                    { width: modalPageWidth },
                  ]}
                >
                  <ScrollView
                    style={styles.modalPageScroll}
                    contentContainerStyle={styles.modalPageScrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalExerciseTitle}>
                        {exercise.key}
                      </Text>

                      <Text style={styles.modalInfoText}>
                        {getExerciseInfoText(exercise.key)}
                      </Text>

                      <Text style={styles.modalSwipeHint}>
                        Swipe to settings
                      </Text>
                    </View>

                    <Pressable
                      style={styles.modalSaveButton}
                      onPress={() => scrollToModalPage(1)}
                    >
                      <Text style={styles.modalSaveButtonText}>
                        Next
                      </Text>
                    </Pressable>
                  </ScrollView>
                </View>

                <View
                  style={[
                    styles.modalPage,
                    { width: modalPageWidth },
                  ]}
                >
                  <ScrollView
                    style={styles.modalPageScroll}
                    contentContainerStyle={styles.modalPageScrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    <View style={styles.modalContent}>                     

                      <View style={styles.modalField}>
                        <Text style={styles.label}>
                          {isTimedExercise
                            ? "Estimated max time"
                            : isBulgarianExercise
                              ? "Estimated max reps per leg"
                              : "Estimated max reps"}
                        </Text>

                        <SwipeSafeTextInput
                          value={draftMaxValue}
                          onChangeText={setDraftMaxValue}
                          keyboardType="number-pad"
                          placeholder={
                            isTimedExercise
                              ? "For example 60 seconds"
                              : "For example 20"
                          }
                          placeholderTextColor="#64748b"
                          style={styles.input}
                        />
                      </View>

                      <View style={styles.modalField}>
                        <Text style={styles.label}>
                          Rest between sets
                        </Text>

                        <SwipeSafeTextInput
                          value={draftRestTime}
                          onChangeText={setDraftRestTime}
                          keyboardType="number-pad"
                          placeholder={
                            isTimedExercise
                              ? "20 seconds"
                              : "90 seconds"
                          }
                          placeholderTextColor="#64748b"
                          style={styles.input}
                        />
                      </View>

                      {supportsAutoCounter && (
                        <View style={styles.modalField}>
                          
                            <View style={styles.autoCounterTopRow}>
                              <Text style={styles.autoCounterTitle}>
                                Auto-counter
                              </Text>

                              <Pressable
                                style={[
                                  styles.toggleButton,
                                  draftAutoCounterEnabled &&
                                    styles.toggleButtonSelected,
                                ]}
                                onPress={() =>
                                  setDraftAutoCounterEnabled(
                                    (currentValue) => !currentValue
                                  )
                                }
                              >
                                <Text
                                  style={[
                                    styles.toggleButtonText,
                                    draftAutoCounterEnabled &&
                                      styles.toggleButtonTextSelected,
                                  ]}
                                >
                                  {draftAutoCounterEnabled ? "On" : "Off"}
                                </Text>
                              </Pressable>
                            </View>

                            <Text style={styles.settingDescription}>
                              Count reps automatically using a steady tempo.
                            </Text>

                            {draftAutoCounterEnabled && (
                              <View style={styles.tempoSection}>
                                <Text style={styles.label}>
                                  Tempo
                                </Text>

                                <View style={styles.tempoRow}>
                                  {AUTO_COUNTER_TEMPO_OPTIONS.map((option) => {
                                    const isSelected =
                                      draftAutoCounterTempo === option.value;

                                    return (
                                      <Pressable
                                        key={option.value}
                                        style={[
                                          styles.tempoButton,
                                          isSelected &&
                                            styles.tempoButtonSelected,
                                        ]}
                                        onPress={() =>
                                          setDraftAutoCounterTempo(option.value)
                                        }
                                      >
                                        <Text
                                          style={[
                                            styles.tempoButtonText,
                                            isSelected &&
                                              styles.tempoButtonTextSelected,
                                          ]}
                                        >
                                          {option.label}
                                        </Text>

                                        <Text
                                          style={[
                                            styles.tempoButtonSubtext,
                                            isSelected &&
                                              styles.tempoButtonSubtextSelected,
                                          ]}
                                        >
                                          {option.secondsPerRep}s/rep
                                        </Text>
                                      </Pressable>
                                    );
                                  })}
                                </View>
                              </View>
                            )}
                          
                        </View>
                      )}

                      
                    </View>

                    {hasConfiguredExercise && (
                        <Pressable
                          style={styles.modalResetButton}
                          onPress={handleResetExercise}
                        >
                          <Text style={styles.modalResetButtonText}>
                            Reset Exercise
                          </Text>
                        </Pressable>
                      )}

                    <Pressable
                      style={styles.modalSaveButton}
                      onPress={saveExerciseSettings}
                    >
                      <Text style={styles.modalSaveButtonText}>
                        Done
                      </Text>
                    </Pressable>
                  </ScrollView>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

function getExerciseInfoText(exerciseKey: string) {
  if (exerciseKey === "Push-ups") {
    return "Build upper-body pushing strength. Keep your body straight, lower with control, and stop before your form breaks.";
  }

  if (exerciseKey === "Pull-ups") {
    return "Build pulling strength. Start from a controlled hang, pull until your chin clears the bar, and lower with control.";
  }

  if (exerciseKey === "Sit-ups") {
    return "Train your core with controlled repetitions. Avoid rushing and try to keep the movement smooth.";
  }

  if (exerciseKey === "Squats") {
    return "Build leg strength. Keep your chest up, control the descent, and press through your feet as you stand.";
  }

  if (exerciseKey === "Dumbbell Curls") {
    return "Train your arms with controlled curls. Keep your elbows stable and avoid swinging the weight.";
  }

  if (exerciseKey === "Bulgarian Squats") {
    return "Train one leg at a time. Keep the movement controlled and use the same target for both legs.";
  }

  if (exerciseKey === "Plank") {
    return "Build core endurance. This workout alternates front plank with left and right side plank variations.";
  }

  if (exerciseKey === "Superman") {
    return "Train your lower back and posterior chain. Lift with control and avoid forcing the movement.";
  }

  if (exerciseKey === "Mountain Climbers") {
    return "Train conditioning and core control. Keep a steady rhythm and avoid letting your hips rise too high.";
  }

  return "Review the exercise settings before starting your workout.";
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
    marginBottom: 20,
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
  previewSection: {
    alignItems: "center",
    marginTop: 2,
    marginBottom: -6,
  },
  previewLabel: {
    color: "#94a3b8",
    fontSize: 13,
    marginBottom: 8,
  },
  previewValue: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1,
  },
  continueButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#22d3ee",
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
    height: 300,
  },

  /* Settings modal */

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.82)",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    maxWidth: 520,
    minHeight: 600,
    maxHeight: "92%",
    borderRadius: 24,
    backgroundColor: "#172033",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 16,
    justifyContent: "space-between",
  },
  modalHeader: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTabs: {
    flexDirection: "row",
    gap: 8,
  },
  modalTab: {
    minHeight: 36,
    borderRadius: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  modalTabSelected: {
    backgroundColor: "rgba(34,211,238,0.16)",
    borderColor: "#22d3ee",
  },
  modalTabText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "800",
  },
  modalTabTextSelected: {
    color: "#22d3ee",
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
  modalPager: {
    flex: 1,
    alignSelf: "center",
  },
  modalPage: {
    flex: 1,
  },
  modalPageScroll: {
    flex: 1,
  },
  modalPageScrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingBottom: 2,
  },
  modalInfoContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  modalContent: {
    flex: 1,
  },
  modalExerciseTitle: {
    color: "#f8fafc",
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 18,
  },
  modalInfoText: {
    color: "#cbd5e1",
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
  },
  modalSwipeHint: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 22,
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
  modalResetButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "rgba(245,158,11,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  modalResetButtonText: {
    color: "#f59e0b",
    fontSize: 16,
    fontWeight: "900",
  },
  modalSaveButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#22d3ee",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  modalSaveButtonText: {
    color: "#082f49",
    fontSize: 17,
    fontWeight: "900",
  },
  autoCounterTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  autoCounterTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900",
  },
  settingDescription: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  toggleButton: {
    minWidth: 72,
    minHeight: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonSelected: {
    backgroundColor: "rgba(34,211,238,0.16)",
    borderColor: "#22d3ee",
  },
  toggleButtonText: {
    color: "#cbd5e1",
    fontSize: 15,
    fontWeight: "900",
  },
  toggleButtonTextSelected: {
    color: "#22d3ee",
  },
  tempoSection: {
    marginTop: 14,
  },
  tempoRow: {
    flexDirection: "row",
    gap: 8,
  },
  tempoButton: {
    flex: 1,
    minHeight: 60,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  tempoButtonSelected: {
    backgroundColor: "rgba(34,211,238,0.16)",
    borderColor: "#22d3ee",
  },
  tempoButtonText: {
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: "900",
  },
  tempoButtonTextSelected: {
    color: "#22d3ee",
  },
  tempoButtonSubtext: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  tempoButtonSubtextSelected: {
    color: "#94e8f5",
  },
});