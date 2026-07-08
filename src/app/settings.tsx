import { router } from "expo-router";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import * as Application from "expo-application";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWorkoutStore } from "../store/workoutStore";

export default function SettingsScreen() {
  const { appState, resetAllData, toggleBeep, toggleVibration } =
    useWorkoutStore();

  const appVersion =
    Constants.appOwnership === "expo"
      ? Constants.expoConfig?.version ?? "Dev"
      : Application.nativeApplicationVersion ??
        Constants.expoConfig?.version ??
        "Dev";

  const buildVersion =
    Constants.appOwnership === "expo"
      ? Constants.expoConfig?.ios?.buildNumber
      : Application.nativeBuildVersion;

  const displayedVersion = appVersion;
  
    function handleResetAllData() {
    Alert.alert(
      "Reset all data?",
      "This will delete all saved workouts, settings, and progress.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetAllData();
            router.replace("/");
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.topbar}>
          <Text style={styles.title}>Settings</Text>

          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.settingsRow}>
            <View>
              <Text style={styles.settingsLabel}>Language</Text>
              <Text style={styles.settingsHelp}>More languages can be added later.</Text>
            </View>
            <Text style={styles.settingsValue}>English</Text>
          </View>

          <Pressable style={styles.settingsRow} onPress={toggleBeep}>
            <View>
              <Text style={styles.settingsLabel}>Beep</Text>
              <Text style={styles.settingsHelp}>Sound during timer changes.</Text>
            </View>
            <Text style={styles.settingsValue}>
              {appState.globalSettings.beepEnabled ? "On" : "Off"}
            </Text>
          </Pressable>

          <Pressable style={styles.settingsRow} onPress={toggleVibration}>
            <View>
              <Text style={styles.settingsLabel}>Vibration</Text>
              <Text style={styles.settingsHelp}>Haptic feedback during timer changes.</Text>
            </View>
            <Text style={styles.settingsValue}>
              {appState.globalSettings.vibrationEnabled ? "On" : "Off"}
            </Text>
          </Pressable>

          <View style={styles.settingsRow}>
            <View>
              <Text style={styles.settingsLabel}>App version</Text>
              <Text style={styles.settingsHelp}>Verto Workout</Text>
            </View>
            <Text style={styles.settingsValue}>
              {displayedVersion}
            </Text>
          </View>

          <View style={styles.divider} />

          <Pressable style={styles.resetButton} onPress={handleResetAllData}>
            <Text style={styles.resetButtonText}>Reset all data</Text>
          </Pressable>

          <Text style={styles.privacyText}>
            This app stores workout data only on this device.
          </Text>
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
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 18,
  },
  settingsRow: {
    minHeight: 72,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  settingsLabel: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "800",
  },
  settingsHelp: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 4,
    maxWidth: 220,
  },
  settingsValue: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "700",
  },
  divider: {
    height: 18,
  },
  resetButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: "rgba(239,68,68,0.16)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  resetButtonText: {
    color: "#fecaca",
    fontSize: 17,
    fontWeight: "900",
  },
  privacyText: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 16,
    textAlign: "center",
  },
});