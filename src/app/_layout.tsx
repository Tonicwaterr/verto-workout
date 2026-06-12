import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { WorkoutProvider } from "../store/workoutStore";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <WorkoutProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </WorkoutProvider>
    </SafeAreaProvider>
  );
}
