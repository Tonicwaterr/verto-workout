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
import { EXERCISES } from "../data/exercises";
import {
  playRepTickFeedback,
  playTargetReachedFeedback,
} from "../services/feedback";
import { useWorkoutStore } from "../store/workoutStore";
import { getPassNote } from "../utils/workoutLogic";

export default function WorkoutScreen() {
  const {
    appState,
    selectedExercise,
    startRestTimer,
    abortWorkout,
    tickAutoCounter,
    toggleAutoCounterPause,
    stopAutoCounterFinalSet,
  } = useWorkoutStore();

  const workout = appState.workout;
  
  const currentPass = workout.currentPass;
  const currentValue = workout.plan[currentPass - 1] ?? 0;

  const isFinalPass = currentPass >= 5;

  const isAutoCounter =
    workout.autoCounterEnabled &&
    workout.workoutMode === "reps";

  const autoCounterValue =
    workout.autoCounterValue;

  const autoCounterTarget =
    workout.autoCounterTarget || currentValue;

  const hasReachedAutoCounterTarget =
    autoCounterValue >= autoCounterTarget;

  const pauseButtonText =
    workout.autoCounterRunning
      ? "Pause"
      : "Resume";

  const exercise = EXERCISES.find((item) => item.key === selectedExercise);
  const isBulgarianExercise = exercise?.mode === "bulgarian";

  const tickAutoCounterRef = useRef(tickAutoCounter);
  const autoRestKeyRef = useRef<string | null>(null);
  const repTickFeedbackValueRef = useRef(0);
  const targetFeedbackKeyRef = useRef<string | null>(null);

  useEffect(() => {
    tickAutoCounterRef.current = tickAutoCounter;
  }, [tickAutoCounter]);

  useEffect(() => {
    if (
      !isAutoCounter ||
      !workout.autoCounterRunning ||
      workout.timerPhase !== "work"
    ) {
      return;
    }

    const intervalId = setInterval(() => {
      tickAutoCounterRef.current();
    }, 100);

    return () => clearInterval(intervalId);
  }, [
    isAutoCounter,
    workout.autoCounterRunning,
    workout.timerPhase,
  ]);

  useEffect(() => {
    if (
      !isAutoCounter ||
      isFinalPass ||
      workout.timerPhase !== "work" ||
      !hasReachedAutoCounterTarget
    ) {
      return;
    }

    const autoRestKey =
      `${currentPass}-${autoCounterTarget}`;

    if (autoRestKeyRef.current === autoRestKey) {
      return;
    }

    autoRestKeyRef.current = autoRestKey;

    startRestTimer();
    router.replace("/rest");
  }, [
    isAutoCounter,
    isFinalPass,
    workout.timerPhase,
    hasReachedAutoCounterTarget,
    currentPass,
    autoCounterTarget,
    startRestTimer,
  ]);

  useEffect(() => {
    if (
      !isAutoCounter ||
      workout.timerPhase !== "work" ||
      autoCounterValue <= 0
    ) {
      return;
    }

    if (
      repTickFeedbackValueRef.current ===
      autoCounterValue
    ) {
      return;
    }

    repTickFeedbackValueRef.current =
      autoCounterValue;

    /*
    * Do not play the soft tick on the exact target rep.
    * The target rep gets the stronger target feedback instead.
    * After the target, soft ticks continue again.
    */
    if (autoCounterValue === autoCounterTarget) {
      return;
    }

    playRepTickFeedback(appState.globalSettings);
  }, [
    isAutoCounter,
    workout.timerPhase,
    autoCounterValue,
    autoCounterTarget,
    appState.globalSettings,
  ]);

  useEffect(() => {
    if (
      !isAutoCounter ||
      workout.timerPhase !== "work" ||
      !hasReachedAutoCounterTarget
    ) {
      return;
    }

    const targetFeedbackKey =
      `${currentPass}-${autoCounterTarget}`;

    if (
      targetFeedbackKeyRef.current ===
      targetFeedbackKey
    ) {
      return;
    }

    targetFeedbackKeyRef.current =
      targetFeedbackKey;

    playTargetReachedFeedback(appState.globalSettings);
  }, [
    isAutoCounter,
    workout.timerPhase,
    hasReachedAutoCounterTarget,
    currentPass,
    autoCounterTarget,
    appState.globalSettings,
  ]);

  useEffect(() => {
    repTickFeedbackValueRef.current = 0;
  }, [currentPass]);

  function handleDone() {
    if (isAutoCounter && isFinalPass) {
      stopAutoCounterFinalSet();
      router.push("/result");
      return;
    }

    if (currentPass >= 5) {
      router.push("/result");
      return;
    }

    startRestTimer();
    router.push("/rest");
  }

  function handlePauseAutoCounter() {
    toggleAutoCounterPause();
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
            <Text style={styles.exerciseName}>{selectedExercise}</Text>
            <Text style={styles.dots}>
              {"●".repeat(currentPass)}
              {"○".repeat(5 - currentPass)}
            </Text>
          </View>

          <View style={styles.center}>          
            <Text style={styles.note}>
              {getPassNote(currentPass)}
            </Text>  
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
                <Text style={styles.reps}>
                  {isAutoCounter
                    ? autoCounterValue
                    : currentValue}
                </Text>

                {isAutoCounter ? (
                  <>
                    <Text style={styles.label}>
                      of {autoCounterTarget} reps
                    </Text>

                    {hasReachedAutoCounterTarget && isFinalPass && (
                      <Text style={styles.autoCounterMessage}>
                        Target complete. Keep going or press Done.
                      </Text>
                    )}

                    {workout.autoCounterLimitReached && (
                      <Text style={styles.autoCounterMessage}>
                        Counter limit reached. Press Done to adjust result.
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.label}>
                    reps
                  </Text>
                )}
              </>
            )}
           
          </View>

          <View style={styles.actions}>
            {isAutoCounter ? (
              <>
                {isFinalPass && (
                  <Pressable
                    style={styles.doneButton}
                    onPress={handleDone}
                  >
                    <Text style={styles.doneButtonText}>
                      Done
                    </Text>
                  </Pressable>
                )}

                {!workout.autoCounterLimitReached && (
                  <Pressable
                    style={styles.pauseButton}
                    onPress={handlePauseAutoCounter}
                  >
                    <Text style={styles.pauseButtonText}>
                      {pauseButtonText}
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
              </>
            ) : (
              <>
                <Pressable
                  style={styles.doneButton}
                  onPress={handleDone}
                >
                  <Text style={styles.doneButtonText}>
                    Done
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.abortButton}
                  onPress={handleAbort}
                >
                  <Text style={styles.abortButtonText}>
                    Abort
                  </Text>
                </Pressable>
              </>
            )}
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
  dots: {
    color: "#22d3ee",
    fontSize: 18,
    letterSpacing: 3,
  },
  center: {
    alignItems: "center",
  },
  exerciseName: {
    color: "#f8fafc",
    fontSize: 26,
    fontWeight: "900",
  },
  exerciseIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  reps: {
    color: "#f8fafc",
    fontSize: 100,
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
    color: "#94a3b8",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 18,
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
    height: 200,
  },
  autoCounterMessage: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: -8,
    marginBottom: 14,
  },
  pauseButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "rgba(34,211,238,0.14)",
    borderWidth: 1,
    borderColor: "#22d3ee",
    alignItems: "center",
    justifyContent: "center",
  },
  pauseButtonText: {
    color: "#22d3ee",
    fontSize: 17,
    fontWeight: "900",
  },
});