import { router } from "expo-router";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { EXERCISES } from "../data/exercises";
import { useWorkoutStore } from "../store/workoutStore";

export default function HistoryScreen() {
  const { appState } = useWorkoutStore();

  const historyItems = EXERCISES.flatMap((exercise) => {
    const settings = appState.settings[exercise.key];

    return settings.history.map((item, index) => ({
      ...item,
      id: `${exercise.key}-${index}`,
    }));
  });

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.topbar}>
          <Text style={styles.title}>History</Text>

          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          {historyItems.length === 0 ? (
            <Text style={styles.emptyText}>No history yet.</Text>
          ) : (
            <FlatList
              data={historyItems}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => {
                const pillStyle =
                  item.movement > 0
                    ? styles.pillUp
                    : item.movement < 0
                      ? styles.pillDown
                      : styles.pillFlat;

                return (
                  <View style={styles.historyItem}>
                    <View style={styles.historyText}>
                      <Text style={styles.historyTitle}>
                        {item.date} · {item.exercise}
                      </Text>
                      <Text style={styles.historySubtitle}>
                        {item.subtitle}
                      </Text>
                    </View>

                    <View style={[styles.pill, pillStyle]}>
                      <Text style={styles.pillText}>{item.label}</Text>
                    </View>
                  </View>
                );
              }}
            />
          )}
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
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    color: "#94a3b8",
    fontSize: 22,
    fontWeight: "800",
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
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
    flex: 1,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 14,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 17,
  },
  list: {
    gap: 10,
  },
  historyItem: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  historyText: {
    flex: 1,
  },
  historyTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  historySubtitle: {
    color: "#94a3b8",
    fontSize: 14,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pillUp: {
    backgroundColor: "rgba(52,211,153,0.18)",
  },
  pillDown: {
    backgroundColor: "rgba(245,158,11,0.18)",
  },
  pillFlat: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  pillText: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "800",
  },
});