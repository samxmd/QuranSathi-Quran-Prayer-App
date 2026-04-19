import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import Feather from "@expo/vector-icons/Feather";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QuranProvider, useQuran } from "@/context/QuranContext";
import { trackError } from "@/services/telemetry";
import { LoadingScreen } from "@/components/LoadingScreen";
import { OnboardingScreen } from "@/components/OnboardingScreen";

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const { isLoading, hasSetLanguage } = useQuran();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!hasSetLanguage) {
    return <OnboardingScreen />;
  }

  return (
    <Stack screenOptions={{ 
      headerBackTitle: "Back",
      animation: Platform.OS === "web" ? "fade" : "default"
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="duas" options={{ headerShown: false }} />
      <Stack.Screen name="dhikr" options={{ headerShown: false }} />
      <Stack.Screen name="hijri" options={{ headerShown: false }} />
      <Stack.Screen name="tafsir" options={{ headerShown: false }} />
      <Stack.Screen name="reader/[id]" />
      <Stack.Screen name="bookmarks" />
      <Stack.Screen name="juz" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="qibla" options={{ headerShown: false }} />
      <Stack.Screen name="favorites" options={{ headerShown: false }} />
      <Stack.Screen name="search" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...Feather.font,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ErrorBoundary onError={(error, stackTrace) => {
        trackError("app.render_error", error, { stackTrace }).catch(() => {});
      }}>
        <GestureHandlerRootView>
          <QuranProvider>
            <RootLayoutNav />
          </QuranProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
