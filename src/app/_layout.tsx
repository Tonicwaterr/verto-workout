import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WorkoutProvider } from "../store/workoutStore";

const MIN_SPLASH_TIME_MS = 2500;

void SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

export default function RootLayout() {

  const [hasShownSplash, setHasShownSplash] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setHasShownSplash(true);
    }, MIN_SPLASH_TIME_MS);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (hasShownSplash) {
      void SplashScreen.hideAsync();
    }
  }, [hasShownSplash]);

  if (!hasShownSplash) {
    return null;
  }

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
