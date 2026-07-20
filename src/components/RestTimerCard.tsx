import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

type RestTimerCardProps = {
  nextText: string;
  timerText: string;
  message?: string;
  skipText?: string;
  pauseText?: string;
  abortText?: string;
  onSkip: () => void;
  onPause?: () => void;
  onAbort: () => void;
};

export function RestTimerCard({
  nextText,
  timerText,
  message = "Get ready for the next set",
  skipText = "Skip Rest",
  pauseText = "Pause",
  abortText = "Abort Workout",
  onSkip,
  onPause,
  onAbort,
}: RestTimerCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.heading}>
          <Text style={styles.title}>Rest</Text>

          <Text style={styles.nextSet}>
            {nextText}
          </Text>
        </View>

        <View style={styles.timerSection}>
          <Text style={styles.timer}>
            {timerText}
          </Text>

          <Text style={styles.message}>
            {message}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.skipButton}
            onPress={onSkip}
          >
            <Text style={styles.skipButtonText}>
              {skipText}
            </Text>
          </Pressable>

          {onPause ? (
            <Pressable
              style={styles.pauseButton}
              onPress={onPause}
            >
              <Text style={styles.pauseButtonText}>
                {pauseText}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            style={styles.abortButton}
            onPress={onAbort}
          >
            <Text style={styles.abortButtonText}>
              {abortText}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  heading: {
    alignItems: "center",
  },
  title: {
    color: "#22d3ee",
    fontSize: 34,
    fontWeight: "900",
  },
  nextSet: {
    color: "#94a3b8",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  timerSection: {
    alignItems: "center",
  },
  timer: {
    color: "#f8fafc",
    fontSize: 86,
    lineHeight: 96,
    fontWeight: "900",
    textAlign: "center",
  },
  message: {
    color: "#f8fafc",
    fontSize: 21,
    fontWeight: "700",
    textAlign: "center",
  },
  actions: {
    gap: 10,
  },
  skipButton: {
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "#22d3ee",
    alignItems: "center",
    justifyContent: "center",
  },
  skipButtonText: {
    color: "#082f49",
    fontSize: 19,
    fontWeight: "900",
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
});