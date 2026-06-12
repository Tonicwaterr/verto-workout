import AsyncStorage from "@react-native-async-storage/async-storage";

import { AppState } from "../types/workout";

const STORAGE_KEY = "verto_workout_state_v1";

export async function loadAppState(): Promise<AppState | null> {
  try {
    const rawState = await AsyncStorage.getItem(STORAGE_KEY);

    if (!rawState) {
      return null;
    }

    return JSON.parse(rawState) as AppState;
  } catch (error) {
    console.log("Failed to load app state:", error);
    return null;
  }
}

export async function saveAppState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.log("Failed to save app state:", error);
  }
}

export async function clearAppState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.log("Failed to clear app state:", error);
  }
}