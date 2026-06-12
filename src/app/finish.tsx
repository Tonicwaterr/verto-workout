import { router } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useWorkoutStore } from "../store/workoutStore";

export default function FinishScreen() {
  const { selectedExercise, abortWorkout } = useWorkoutStore();

  function handleBackHome() {
    abortWorkout();
    router.replace("/");
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View>
            <Text style={styles.title}>Done!</Text>
            <Text style={styles.subtitle}>{selectedExercise} complete.</Text>
          </View>

          <Pressable style={styles.doneButton} onPress={handleBackHome}>
            <Text style={styles.doneButtonText}>Back to Home</Text>
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
    minHeight: 360,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
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
  doneButton: {
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "#34d399",
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    color: "#052e16",
    fontSize: 20,
    fontWeight: "900",
  },
});