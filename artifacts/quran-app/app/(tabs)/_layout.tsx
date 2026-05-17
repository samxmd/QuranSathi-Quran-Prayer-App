import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : theme.cardBackground,
          borderTopWidth: 0,
          elevation: 0,
          height: isWeb ? 84 : isIOS ? 90 : 80,
          paddingBottom: isIOS ? 34 : 16,
          paddingTop: 8,
          ...(isWeb ? {} : {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
          }),
        },
        tabBarItemStyle: {
          borderRadius: 20,
          marginHorizontal: 10,
          height: 52,
        },
        tabBarActiveBackgroundColor: theme.isDark ? `${theme.primary}22` : theme.cardBackground,
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : !isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { 
                  backgroundColor: theme.cardBackground,
                  borderTopWidth: 1,
                  borderTopColor: theme.border + "40",
                },
              ]}
            />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Inter_600SemiBold",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabHome"),
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="surahs"
        options={{
          title: t("tabQuran"),
          tabBarIcon: ({ color }) => (
            <Feather name="book-open" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="audio"
        options={{
          title: t("tabAudio"),
          tabBarIcon: ({ color }) => (
            <Feather name="headphones" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: t("tabPrayer"),
          tabBarIcon: ({ color }) => (
            <Feather name="clock" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="utilities"
        options={{
          title: t("tabUtilities"),
          tabBarIcon: ({ color }) => (
            <Feather name="grid" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
