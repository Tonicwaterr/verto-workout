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

type OnboardingDetail = {
  label: string;
  text: string;
};

type OnboardingStep = {
  title: string;
  text: string;
  supportingText?: string;
  details?: OnboardingDetail[];
  example?: string;
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Welcome to Verto Workout",
    text:
      "Verto creates structured five-set workouts based on your current ability.",
    supportingText:
      "Choose an exercise, set your starting point, and let Verto guide the session.",
  },
  {
    title: "Set your starting point",
    text:
      "The first time you open an exercise, enter your estimated max and preferred rest time.",
    details: [
      {
        label: "Estimated max",
        text:
          "The most clean repetitions or seconds you believe you could currently perform in one set.",
      },
      {
        label: "Rest time",
        text:
          "How long you want to recover between each set.",
      },
    ],
    example: "Example: 20 reps  •  90 seconds",
  },
  {
    title: "Choose today's intensity",
    text:
      "Pick the session that best matches how your body feels today.",
    details: [
      {
        label: "Light",
        text:
          "Recovery-focused. Your workout is saved, but progression is paused.",
      },
      {
        label: "Moderate",
        text:
          "A balanced workout with progression enabled.",
      },
      {
        label: "Heavy",
        text:
          "A more demanding workout with progression enabled.",
      },
    ],
  },
  {
    title: "Train and adjust",
    text:
      "Complete the five sets and use the automatic rest timer between them.",
    details: [
      {
        label: "Final set",
        text:
          "After set five, adjust the result if needed before saving.",
      },
      {
        label: "Progression",
        text:
          "Moderate and Heavy workouts can raise or lower your estimated max over time.",
      },
      {
        label: "Auto-counter",
        text:
          "Some repetition exercises can count automatically if you enable it in the exercise settings.",
      },
    ],
  },
  {
    title: "Daily Charge",
    text:
      "Daily Charge shows how much training you have completed today.",
    details: [
      {
        label: "Light",
        text:
          "Adds 10% Daily Charge.",
      },
      {
        label: "Moderate",
        text:
          "Adds 15% Daily Charge.",
      },
      {
        label: "Heavy",
        text:
          "Adds 20% Daily Charge.",
      },
    ],
    supportingText:
      "Daily Charge resets each day and caps at 100%.",
  },
  {
    title: "Streak and rest days",
    text:
      "Your streak rewards consistency, not just hard training.",
    details: [
      {
        label: "Workout day",
        text:
          "Completing a workout keeps your streak alive.",
      },
      {
        label: "Rest day",
        text:
          "If your body needs recovery, log a Rest day from the Daily Charge panel.",
      },
    ],
    supportingText:
      "Recovery is part of training. Rest days keep your streak alive without adding Daily Charge.",
  },
  {
    title: "History and settings",
    text:
      "Use History to review your recent training and Settings to adjust the app.",
    details: [
      {
        label: "History",
        text:
          "Shows your workouts from the last 14 days, grouped by day.",
      },
      {
        label: "App guide",
        text:
          "You can reopen this guide later from Settings.",
      },
      {
        label: "Privacy",
        text:
          "Your workout data is stored locally on this device.",
      },
    ],
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useWorkoutStore();
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = ONBOARDING_STEPS[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep =
    stepIndex === ONBOARDING_STEPS.length - 1;

  function finishOnboarding() {
    completeOnboarding();
    router.replace("/");
  }

  function handleNext() {
    if (isLastStep) {
      finishOnboarding();
      return;
    }

    setStepIndex((current) => current + 1);
  }

  function handleBack() {
    if (isFirstStep) {
      return;
    }

    setStepIndex((current) => current - 1);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>
            VERTO{" "}
            <Text style={styles.brandAccent}>
              WORKOUT
            </Text>
          </Text>

          {!isLastStep && (
            <Pressable
              hitSlop={12}
              onPress={finishOnboarding}
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.progressSection}>
          <Text style={styles.stepText}>
            Step {stepIndex + 1} of{" "}
            {ONBOARDING_STEPS.length}
          </Text>

          <View style={styles.progressDots}>
            {ONBOARDING_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === stepIndex &&
                    styles.progressDotActive,
                  index < stepIndex &&
                    styles.progressDotCompleted,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>
            {currentStep.title}
          </Text>

          <Text style={styles.body}>
            {currentStep.text}
          </Text>

          {currentStep.details && (
            <View style={styles.detailList}>
              {currentStep.details.map(
                (detail, index) => (
                  <View
                    key={detail.label}
                    style={[
                      styles.detailRow,
                      index <
                        currentStep.details!.length - 1 &&
                        styles.detailRowBorder,
                    ]}
                  >
                    <View style={styles.detailMarker} />

                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>
                        {detail.label}
                      </Text>

                      <Text style={styles.detailDescription}>
                        {detail.text}
                      </Text>
                    </View>
                  </View>
                )
              )}
            </View>
          )}

          {currentStep.example && (
            <Text style={styles.exampleText}>
              {currentStep.example}
            </Text>
          )}

          {currentStep.supportingText && (
            <Text style={styles.supportingText}>
              {currentStep.supportingText}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          {!isFirstStep && (
            <Pressable
              style={styles.backButton}
              onPress={handleBack}
            >
              <Text style={styles.backButtonText}>
                Back
              </Text>
            </Pressable>
          )}

          <Pressable
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {isLastStep
                ? "Start training"
                : "Continue"}
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
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 18,
  },

  header: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brand: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  brandAccent: {
    color: "#22d3ee",
  },

  skipText: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "700",
  },

  progressSection: {
    marginTop: 22,
  },

  stepText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  progressDots: {
    flexDirection: "row",
    gap: 7,
  },

  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  progressDotActive: {
    width: 28,
    backgroundColor: "#22d3ee",
  },

  progressDotCompleted: {
    backgroundColor: "rgba(34,211,238,0.45)",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 24,
  },

  title: {
    color: "#f8fafc",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginBottom: 16,
  },

  body: {
    color: "#cbd5e1",
    fontSize: 18,
    lineHeight: 27,
  },

  detailList: {
    marginTop: 28,
  },

  detailRow: {
    flexDirection: "row",
    paddingVertical: 16,
  },

  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.09)",
  },

  detailMarker: {
    width: 4,
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: "#22d3ee",
    marginRight: 14,
  },

  detailText: {
    flex: 1,
  },

  detailLabel: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 4,
  },

  detailDescription: {
    color: "#94a3b8",
    fontSize: 15,
    lineHeight: 22,
  },

  exampleText: {
    color: "#22d3ee",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 22,
  },

  supportingText: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 22,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
  },

  backButton: {
    minWidth: 92,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  backButtonText: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "800",
  },

  nextButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: "#22d3ee",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  nextButtonText: {
    color: "#082f49",
    fontSize: 18,
    fontWeight: "900",
  },
});
