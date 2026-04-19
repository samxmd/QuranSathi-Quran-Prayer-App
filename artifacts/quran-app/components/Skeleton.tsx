import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, View, StyleSheet, AccessibilityInfo, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";

interface SkeletonProps {
  width?: any;
  height: number;
  radius?: number;
  style?: any;
}

/**
 * A premium shimmering skeleton placeholder.
 * Respects 'prefers-reduced-motion' accessibility settings.
 */
export function Skeleton({ width = "100%", height, radius, style }: SkeletonProps) {
  const theme = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkMotion = async () => {
      const isEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      setReduceMotion(isEnabled);
    };
    checkMotion();
    
    // Subscribe to changes if possible (optional for most use cases but premium)
    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", (isEnabled) => {
      setReduceMotion(isEnabled);
    });

    return () => {
      listener.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    const shimmer = Animated.sequence([
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1800,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(shimmerValue, {
        toValue: 0,
        duration: 0,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]);

    Animated.loop(shimmer).start();
  }, [reduceMotion]);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: radius ?? 16,
          backgroundColor: theme.isDark ? "#122a1f" : "#f1f5f9",
          overflow: "hidden",
        },
        style,
      ]}
    >
      {!reduceMotion && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ translateX }] },
          ]}
        >
          <LinearGradient
            colors={[
              "transparent", 
              theme.isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.4)", 
              "transparent"
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    position: "relative",
  },
});
