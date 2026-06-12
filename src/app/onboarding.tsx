import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useWorkoutStore } from "../store/workoutStore";

const ONBOARDING_STEPS = [
  {
    title: "Welcome to Verto Workout",
    text: "Choose an exercise and enter the maximum number of reps you can do.",
    example: "Example: Push-ups → max reps = 20",
  },
  {
    title: "Difficulty",
    text: "Difficulty controls how hard the workout feels. You can change it anytime.",
    example: "Level 1 = easier · Level 3 = normal · Level 5 = harder",
  },
  {
    title: "Progress System",
    text: "The app builds five sets from your max reps. After the last set, enter how many reps you actually completed.",
    example:
      "If you do more than planned, the next workout becomes harder. If you do less, it becomes easier.",
  },
  {
    title: "Ready?",
    text: "Pick an exercise, adjust the settings if needed, and tap Continue.",
    example: "You can open History from the home screen.",
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useWorkoutStore();
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = ONBOARDING_STEPS[stepIndex];
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;

  function handleNext() {
    if (!isLastStep) {
      setStepIndex((current) => current + 1);
      return;
    }

    completeOnboarding();
    router.replace("/");
  }

  function handleSkip() {
    completeOnboarding();
    router.replace("/");
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View>
            <Text style={styles.stepText}>
              Step {stepIndex + 1} of {ONBOARDING_STEPS.length}
            </Text>

            <Text style={styles.title}>{currentStep.title}</Text>
            <Text style={styles.body}>{currentStep.text}</Text>

            <View style={styles.exampleBox}>
              <Text style={styles.exampleText}>{currentStep.example}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {isLastStep ? "Start training" : "Next"}
              </Text>
            </Pressable>

            {!isLastStep && (
              <Pressable style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </Pressable>
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
    minHeight: 430,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 22,
    justifyContent: "space-between",
  },
  stepText: {
    color: "#22d3ee",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 12,
  },
  body: {
    color: "#94a3b8",
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 18,
  },
  exampleBox: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 14,
  },
  exampleText: {
    color: "#f8fafc",
    fontSize: 16,
    lineHeight: 23,
  },
  actions: {
    gap: 10,
  },
  nextButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: "#22d3ee",
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    color: "#082f49",
    fontSize: 18,
    fontWeight: "900",
  },
  skipButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  skipButtonText: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "800",
  },
});