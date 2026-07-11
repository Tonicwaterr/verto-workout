import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Feather,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import { HOME_EXERCISE_IMAGES } from "../data/exerciseImages";
import { EXERCISES } from "../data/exercises";
import { useWorkoutStore } from "../store/workoutStore";
import { DAILY_CHARGE_CAP } from "../utils/workoutLogic";

export default function HomeScreen() {
  const {
    appState,
    setSelectedExercise,
    logRestDay,
  } = useWorkoutStore();

  const [isChargeModalVisible, setIsChargeModalVisible] =
    useState(false);

  useEffect(() => {
    if (!appState.globalSettings.hasSeenOnboarding) {
      router.replace("/onboarding");
    }
  }, [appState.globalSettings.hasSeenOnboarding]);
  
  const allHistoryItems = Object.values(appState.settings).flatMap(
    (settings) => settings.history
  );

  const todayKey = getDateKey(new Date());

  const dailyCharge = getDailyChargeForToday(
    allHistoryItems,
    todayKey
  );

  const isRestDayLoggedToday =
    appState.restDays.includes(todayKey);

  const isRestOnlyDay =
    isRestDayLoggedToday && dailyCharge === 0;

  const currentStreak = getCurrentWorkoutStreak([
    ...allHistoryItems.map((item) => item.date),
    ...appState.restDays,
  ]);

  const todayActivity = getTodayActivity(
    allHistoryItems,
    todayKey
  );

  function handleRestDayPress() {
    Alert.alert(
      "Take a rest day?",
      "Recovery is part of training. This will keep your streak alive for today.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Rest today",
          onPress: () => {
            logRestDay();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.headerStats}
            onPress={() => setIsChargeModalVisible(true)}
            hitSlop={10}
          >
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

            {isRestOnlyDay ? (
              <View style={styles.chargeRow}>
                <MaterialCommunityIcons
                  name="bed"
                  size={27}
                  color="#22d3ee"
                />
              </View>
            ) : (
              <View style={styles.chargeRow}>
                <MaterialCommunityIcons
                  name="arm-flex"
                  size={27}
                  color="#22d3ee"
                />

                <Text style={styles.chargeNumber}>
                  {dailyCharge}%
                </Text>
              </View>
            )}
          </Pressable>

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

        <Modal
          visible={isChargeModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsChargeModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setIsChargeModalVisible(false)}
            />

            <View style={styles.modalCard}>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setIsChargeModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </Pressable>

              {isRestOnlyDay ? (
                <View style={styles.modalContent}>
                  <View style={styles.modalIconCircle}>
                    <MaterialCommunityIcons
                      name="bed"
                      size={42}
                      color="#22d3ee"
                    />
                  </View>

                  <Text style={styles.modalTitle}>
                    Rest day
                  </Text>

                  <Text style={styles.modalMessage}>
                    Recovery is part of training. Your streak is safe today.
                  </Text>
                </View>
              ) : (
                <View style={styles.modalContent}>
                  <View style={styles.modalIconCircle}>
                    <MaterialCommunityIcons
                      name="arm-flex"
                      size={42}
                      color="#22d3ee"
                    />
                  </View>

                  <Text style={styles.modalTitle}>
                    Daily Charge
                  </Text>

                  <Text
                    style={[
                      styles.modalChargeNumber,
                      { color: getChargeColor(dailyCharge) },
                    ]}
                  >
                    {dailyCharge}%
                  </Text>

                  <Text style={styles.modalMessage}>
                    {getChargeMessage(dailyCharge)}
                  </Text>

                  <View style={styles.modalDivider} />

                  <View style={styles.todayActivityBlock}>
                    <Text style={styles.todayActivityTitle}>
                      Today&apos;s activity
                    </Text>

                    {todayActivity.length > 0 ? (
                      <View style={styles.activityList}>
                        {todayActivity.map((exercise) => (
                          <View
                            key={exercise}
                            style={styles.activityPill}
                          >
                            <Text style={styles.activityPillText}>
                              {exercise}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.noActivityText}>
                        No workouts logged today.
                      </Text>
                    )}
                  </View>

                  {dailyCharge === 0 && !isRestDayLoggedToday ? (
                    <Pressable
                      style={styles.restDayButton}
                      onPress={handleRestDayPress}
                    >
                      <MaterialCommunityIcons
                        name="bed"
                        size={22}
                        color="#082f49"
                      />

                      <Text style={styles.restDayButtonText}>
                        Rest day
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              )}
            </View>
          </View>
        </Modal>

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

        <View style={styles.footerBrand}>
          <Text style={styles.footerBrandText}>
            VERTO{" "}
            <Text style={styles.footerBrandAccent}>
              WORKOUT
            </Text>
          </Text>
        </View>      
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

function getDailyChargeForToday(
  historyItems: Array<{
    date: string;
    dailyChargePoints?: number;
  }>,
  todayKey: string
) {
  const todayCharge = historyItems
    .filter((item) => item.date === todayKey)
    .reduce(
      (total, item) =>
        total + (item.dailyChargePoints ?? 0),
      0
    );

  return Math.min(
    DAILY_CHARGE_CAP,
    todayCharge
  );
}

function getTodayActivity(
  historyItems: Array<{
    date: string;
    completedAt?: string;
    exercise: string;
  }>,
  todayKey: string
) {
  const sortedTodayItems = historyItems
    .filter((item) => item.date === todayKey)
    .sort((itemA, itemB) => {
      const timeA = itemA.completedAt
        ? new Date(itemA.completedAt).getTime()
        : 0;

      const timeB = itemB.completedAt
        ? new Date(itemB.completedAt).getTime()
        : 0;

      return timeB - timeA;
    });

  const seenExercises = new Set<string>();

  return sortedTodayItems
    .map((item) => item.exercise)
    .filter((exercise) => {
      if (seenExercises.has(exercise)) {
        return false;
      }

      seenExercises.add(exercise);
      return true;
    });
}

function getChargeColor(dailyCharge: number) {
  if (dailyCharge <= 0) {
    return "#94a3b8";
  }

  if (dailyCharge < 40) {
    return "#f8fafc";
  }

  if (dailyCharge < 80) {
    return "#facc15";
  }

  if (dailyCharge < DAILY_CHARGE_CAP) {
    return "#34d399";
  }

  return "#22d3ee";
}

function getChargeMessage(dailyCharge: number) {
  if (dailyCharge <= 0) {
    return "Every strong day starts with showing up. Do one workout, or take a rest day if your body needs it.";
  }

  if (dailyCharge < 40) {
    return "Good start. You have already made today count — build on it if you have the energy.";
  }

  if (dailyCharge < 80) {
    return "Solid work. You are building momentum today.";
  }

  if (dailyCharge < DAILY_CHARGE_CAP) {
    return "Strong day. You are very close to completing today’s charge.";
  }

  return "Daily charge complete. Great work — you have done enough for today.";
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
  headerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  chargeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chargeNumber: {
    color: "#cbd5e1",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 28,
    marginTop: 2,
  },
  footerBrand: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 2,
  },
  footerBrandText: {
    color: "rgba(34,211,238,0.55)",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 1,
  },
  footerBrandAccent: {
    color: "rgba(208, 225, 227, 0.55)",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 28,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 20,
  },
  modalCloseButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  modalCloseButtonText: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  modalContent: {
    alignItems: "center",
    paddingTop: 18,
  },
  modalIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 999,
    backgroundColor: "rgba(34,211,238,0.10)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.28)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalTitle: {
    color: "#f8fafc",
    fontSize: 25,
    fontWeight: "900",
    marginBottom: 6,
  },
  modalChargeNumber: {
    fontSize: 54,
    lineHeight: 62,
    fontWeight: "900",
    marginBottom: 8,
  },
  modalMessage: {
    color: "#94a3b8",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: 6,
  },
  modalDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginVertical: 20,
  },
  todayActivityBlock: {
    width: "100%",
    alignItems: "flex-start",
  },
  todayActivityTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
  },
  activityList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  activityPill: {
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  activityPillText: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "800",
  },
  noActivityText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  restDayButton: {
    marginTop: 22,
    width: "100%",
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "#22d3ee",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  restDayButtonText: {
    color: "#082f49",
    fontSize: 17,
    fontWeight: "900",
  },
});