import { router } from "expo-router";
import { useEffect } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { EXERCISES } from "../data/exercises";
import { HOME_EXERCISE_IMAGES } from "../data/exerciseImages";
import { useWorkoutStore } from "../store/workoutStore";

export default function HomeScreen() {
  const { appState, setSelectedExercise } = useWorkoutStore();

  useEffect(() => {
    if (!appState.globalSettings.hasSeenOnboarding) {
      router.replace("/onboarding");
    }
  }, [appState.globalSettings.hasSeenOnboarding]);
  
  const allHistoryItems = Object.values(appState.settings).flatMap(
    (settings) => settings.history
  );

  const workoutCount = allHistoryItems.length;

  const personalBestCount = allHistoryItems.filter(
    (item) => item.movement > 0
  ).length;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.brand}>
              VERTO <Text style={styles.brandAccent}>WORKOUT</Text>
            </Text>

            <Text style={styles.subtitle}>
              Choose your workout type to get started
            </Text>
          </View>

          <Pressable
            style={styles.infoButton}
            onPress={() => router.push("/onboarding")}
          >
            <Text style={styles.infoButtonText}>i</Text>
          </Pressable>
        </View>

        <FlatList
          data={EXERCISES}
          keyExtractor={(item) => item.key}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.exerciseList}
          renderItem={({ item }) => {
            
            return (
              <Pressable
                style={styles.exerciseTile}
                onPress={() => {
                  setSelectedExercise(item.key);
                  router.push(`/exercise?exercise=${encodeURIComponent(item.key)}`);
                }}
              >
                <Image
                  source={HOME_EXERCISE_IMAGES[item.key]}
                  style={styles.exerciseImage}
                  resizeMode="cover"
                />
                
              </Pressable>
            );
          }}
        />


        <View style={styles.menu}>
          <Pressable
            style={styles.menuButton}
            onPress={() => router.push("/history")}
          >
            <Text style={styles.menuText}>History</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          <Pressable
            style={styles.menuButton}
            onPress={() => router.push("/settings")}
          >
            <Text style={styles.menuText}>Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
        </View>

        <View style={styles.statsBox}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🔥</Text>
            <View>
              <Text style={styles.statNumber}>{workoutCount}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🏆</Text>
            <View>
              <Text style={styles.statNumber}>{personalBestCount}</Text>
              <Text style={styles.statLabel}>Personal Bests</Text>
            </View>
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
  },
  header: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  brand: {
    fontSize: 34,
    fontWeight: "900",
    color: "#f8fafc",
    letterSpacing: -1,
  },
  brandAccent: {
    color: "#22d3ee",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 17,
    color: "#94a3b8",
  },
  headerText: {
    flex: 1,
  },
  infoButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#22d3ee",
    backgroundColor: "rgba(34,211,238,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoButtonText: {
    color: "#22d3ee",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 28,
  },
  exerciseList: {
    paddingBottom: 20,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
  },
  exerciseTile: {
    flex: 1,
    height: 150,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
  },
  menu: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  menuButton: {
    flex: 1,
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuText: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
  },
  menuArrow: {
    color: "#cbd5e1",
    fontSize: 32,
  },
  statsBox: {
    marginTop: 14,
    minHeight: 96,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    overflow: "hidden",
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 14,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  statIcon: {
    fontSize: 34,
  },
  statNumber: {
    color: "#f8fafc",
    fontSize: 30,
    fontWeight: "900",
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 2,
  },
});