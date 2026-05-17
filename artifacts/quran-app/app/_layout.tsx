import "@/services/i18n";
import {
  Inter_400Regular,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";

import { Merriweather_400Regular, Merriweather_700Bold } from "@expo-google-fonts/merriweather";
import { ScheherazadeNew_400Regular, ScheherazadeNew_700Bold } from "@expo-google-fonts/scheherazade-new";
import Feather from "@expo/vector-icons/Feather";
import * as Sentry from "@sentry/react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, View, UIManager } from "react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QuranProvider, useQuran } from "@/context/QuranContext";
import { AudioProvider } from "@/context/AudioContext";
import { ensureDailyAyahNotificationScheduled, requestNotificationPermissions } from "@/services/notificationService";
import { trackError } from "@/services/telemetry";
import { LoadingScreen } from "@/components/LoadingScreen";
import { OnboardingScreen } from "@/components/OnboardingScreen";

SplashScreen.preventAutoHideAsync().catch(() => {});

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

Sentry.init({
  dsn: "https://11be6307a73e48ff27cac7a4be52aa2a@o4511250700500992.ingest.de.sentry.io/4511250702073936",
  debug: false, // Set to true to see internal Sentry logs
  beforeSend(event) {
    const exception = event.exception?.values?.[0];
    if (exception?.type === "TypeError" && exception.value === "Network request failed") {
      return null;
    }

    return event;
  },
});

function RootLayoutNav() {
  const { isLoading, hasSetLanguage } = useQuran();

  useEffect(() => {
    if (isLoading) return;
    
    // Request permissions on boot so the user gets prompted if they haven't been
    requestNotificationPermissions().then((granted) => {
      if (granted) {
        ensureDailyAyahNotificationScheduled().catch(() => {});
      }
    });
  }, [isLoading]);

  return (
    <View style={{ flex: 1 }}>
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
        <Stack.Screen name="planner" options={{ headerShown: false }} />
        <Stack.Screen name="stats" options={{ headerShown: false }} />
        <Stack.Screen name="spiritual-hub" options={{ headerShown: false }} />
      </Stack>

      {(isLoading) && (
        <View style={StyleSheet.absoluteFill}>
          <LoadingScreen />
        </View>
      )}

      {(!isLoading && !hasSetLanguage) && (
        <View style={StyleSheet.absoluteFill}>
          <OnboardingScreen />
        </View>
      )}
    </View>
  );
}

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...Feather.font,
    ...MaterialCommunityIcons.font,
    ...FontAwesome5.font,
    Inter_400Regular,
    Inter_700Bold,

    ScheherazadeNew_400Regular,
    ScheherazadeNew_700Bold,
    Merriweather_400Regular,
    Merriweather_700Bold,
  });

  useEffect(() => {
    // Hide native splash screen as soon as fonts are loaded so our custom LoadingScreen can take over
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
        <GestureHandlerRootView>
          <AudioProvider>
            <QuranProvider>
              <ErrorBoundary onError={(error, stackTrace) => {
                trackError("app.render_error", error, { stackTrace }).catch(() => {});
              }}>
                <RootLayoutNav />
              </ErrorBoundary>
            </QuranProvider>
          </AudioProvider>
        </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
