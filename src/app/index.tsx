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

import {
  Feather,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import { SafeAreaView } from "react-native-safe-area-context";
import { HOME_EXERCISE_IMAGES } from "../data/exerciseImages";
import { EXERCISES } from "../data/exercises";
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

  const currentStreak = getCurrentWorkoutStreak(
    allHistoryItems.map((item) => item.date)
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.streakRow}>
            <MaterialCommunityIcons
              name="fire"
              size={30}
              color="#22d3ee"
            />

            <Text style={styles.streakNumber}>
              {currentStreak}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerIconButton}
              onPress={() => router.push("/history")}
              hitSlop={12}
            >
              <Feather
                name="clock"
                size={25}
                color="#22d3ee"
              />
            </Pressable>

            <Pressable
              style={styles.headerIconButton}
              onPress={() => router.push("/settings")}
              hitSlop={12}
            >
              <Feather
                name="settings"
                size={25}
                color="#22d3ee"
              />
            </Pressable>
          </View>
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
      </View>
    </SafeAreaView>
  );
}

function getDateKey(date: Date) {
  return date.toLocaleDateString("sv-SE");
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getCurrentWorkoutStreak(dateKeys: string[]) {
  const completedDates = new Set(
    dateKeys.filter(Boolean)
  );

  const today = new Date();
  const todayKey = getDateKey(today);
  const yesterday = addDays(today, -1);
  const yesterdayKey = getDateKey(yesterday);

  let cursorDate: Date;

  if (completedDates.has(todayKey)) {
    cursorDate = today;
  } else if (completedDates.has(yesterdayKey)) {
    cursorDate = yesterday;
  } else {
    return 0;
  }

  let streak = 0;

  while (completedDates.has(getDateKey(cursorDate))) {
    streak += 1;
    cursorDate = addDays(cursorDate, -1);
  }

  return streak;
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
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  headerIconButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
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
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    
  },
  streakNumber: {
    color: "#cbd5e1",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 28,
    marginTop: 2,
  },
});