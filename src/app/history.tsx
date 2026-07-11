import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { EXERCISES } from "../data/exercises";
import { useWorkoutStore } from "../store/workoutStore";

type HistoryListItem = {
  id: string;
  date: string;
  completedAt?: string;
  exercise: string;
  subtitle: string;
  label: string;
  movement: number;
  dailyChargePoints?: number;
  originalIndex: number;
};

type HistorySection = {
  title: string;
  dateKey: string;
  dailyCharge: number;
  data: HistoryListItem[];
};

export default function HistoryScreen() {
  const { appState } = useWorkoutStore();

  const allHistoryItems: HistoryListItem[] = EXERCISES.flatMap(
    (exercise) => {
      const settings = appState.settings[exercise.key];

      return settings.history.map((item, index) => ({
        ...item,
        id: `${exercise.key}-${item.completedAt ?? item.date}-${index}`,
        originalIndex: index,
      }));
    }
  );

  const sections = buildHistorySections(allHistoryItems);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.topbar}>
          <Text style={styles.title}>History</Text>
          

          <Pressable
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <Text style={styles.daysStored}>Last 14 days</Text>

        {sections.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={34}
              color="#22d3ee"
            />

            <Text style={styles.emptyTitle}>
              No recent history
            </Text>

            <Text style={styles.emptyText}>
              Completed workouts from the last 14 days will appear here.
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            renderSectionHeader={({ section }) => (
              <View style={styles.dayHeaderWrapper}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>
                    {section.title}
                  </Text>

                  {section.dailyCharge > 0 ? (
                    <View style={styles.dayCharge}>
                      <MaterialCommunityIcons
                        name="arm-flex"
                        size={17}
                        color="#22d3ee"
                      />

                      <Text style={styles.dayChargeText}>
                        {section.dailyCharge}%
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )}
            renderItem={({ item, index, section }) => {
              const isLastItemInDay =
                index === section.data.length - 1;

              const pillStyle =
                item.movement > 0
                  ? styles.pillUp
                  : item.movement < 0
                    ? styles.pillDown
                    : styles.pillFlat;

              return (
                <View style={styles.timelineRow}>
                  <View style={styles.timelineMarker}>
                    <View style={styles.timelineDot} />

                    {!isLastItemInDay ? (
                      <View style={styles.timelineLine} />
                    ) : null}
                  </View>

                  <View style={styles.historyItem}>
                    <View style={styles.historyTitleRow}>
                      <Text style={styles.historyTitle}>
                        {item.exercise}
                      </Text>

                      <View style={[styles.pill, pillStyle]}>
                        <Text style={styles.pillText}>
                          {item.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.historySubtitle}>
                      {item.subtitle}
                    </Text>

                    {item.dailyChargePoints ? (
                      <View style={styles.itemCharge}>
                        <MaterialCommunityIcons
                          name="arm-flex"
                          size={15}
                          color="#22d3ee"
                        />

                        <Text style={styles.itemChargeText}>
                          +{item.dailyChargePoints}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function buildHistorySections(
  historyItems: HistoryListItem[]
): HistorySection[] {
  const today = getStartOfDay(new Date());
  const oldestVisibleDate = addDays(today, -13);

  const visibleItems = historyItems.filter((item) => {
    const itemDate = parseDateKey(item.date);

    return (
      itemDate >= oldestVisibleDate &&
      itemDate <= today
    );
  });

  const groupedByDate = visibleItems.reduce<
    Record<string, HistoryListItem[]>
  >((groups, item) => {
    if (!groups[item.date]) {
      groups[item.date] = [];
    }

    groups[item.date].push(item);
    return groups;
  }, {});

  return Object.entries(groupedByDate)
    .sort(([dateA], [dateB]) => {
      return (
        parseDateKey(dateB).getTime() -
        parseDateKey(dateA).getTime()
      );
    })
    .map(([dateKey, items]) => {
      const sortedItems = [...items].sort(sortHistoryItemsByTime);

      const dailyCharge = Math.min(
        100,
        sortedItems.reduce(
          (total, item) =>
            total + (item.dailyChargePoints ?? 0),
          0
        )
      );

      return {
        dateKey,
        title: formatDayTitle(dateKey),
        dailyCharge,
        data: sortedItems,
      };
    });
}

function sortHistoryItemsByTime(
  itemA: HistoryListItem,
  itemB: HistoryListItem
) {
  const timeA = itemA.completedAt
    ? new Date(itemA.completedAt).getTime()
    : 0;

  const timeB = itemB.completedAt
    ? new Date(itemB.completedAt).getTime()
    : 0;

  if (timeA !== timeB) {
    return timeB - timeA;
  }

  return itemA.originalIndex - itemB.originalIndex;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

function getStartOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatDayTitle(dateKey: string) {
  const date = parseDateKey(dateKey);

  const weekday = date.toLocaleDateString("en-US", {
    weekday: "long",
  });

  const month = date.toLocaleDateString("en-US", {
    month: "long",
  });

  const day = date.getDate();

  return `${weekday}, ${month} ${day}${getOrdinalSuffix(day)}`;
}

function getOrdinalSuffix(day: number) {
  if (day >= 11 && day <= 13) {
    return "th";
  }

  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    color: "#94a3b8",
    fontSize: 22,
    fontWeight: "800",
  },
  daysStored: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "400",
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
  list: {
    paddingBottom: 28,
  },
  dayHeaderWrapper: {
    backgroundColor: "#0f172a",
    paddingTop: 14,
    paddingBottom: 10,
  },
  dayHeader: {
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.96)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.28)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  dayTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "900",
  },
  dayCharge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  dayChargeText: {
    color: "#22d3ee",
    fontSize: 14,
    fontWeight: "900",
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  timelineMarker: {
    width: 24,
    alignItems: "center",
  },
  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: "#22d3ee",
    marginTop: 22,
    shadowColor: "#22d3ee",
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  timelineLine: {
    flex: 1,
    width: 1,
    backgroundColor: "rgba(34,211,238,0.22)",
    marginTop: 6,
  },
  historyItem: {
    flex: 1,
    paddingVertical: 16,
    paddingLeft: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  historyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 6,
  },
  historyTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "900",
    flex: 1,
  },
  historySubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 20,
  },
  itemCharge: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 3,
  },
  itemChargeText: {
    color: "#22d3ee",
    fontSize: 13,
    fontWeight: "900",
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 26,
  },
  emptyTitle: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 14,
    marginBottom: 6,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
});