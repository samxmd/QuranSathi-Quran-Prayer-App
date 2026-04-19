import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Image,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";

const { width } = Dimensions.get("window");

export function LoadingScreen() {
  const theme = useTheme();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Shimmer loop
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false, // width/position animation
      })
    ).start();

    // Pulsing dots loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotsAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(dotsAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width * 0.4, width * 0.4],
  });

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../assets/images/pattern.png")}
        style={styles.bg}
        imageStyle={styles.bgImage}
      >
        <LinearGradient
          colors={["rgba(14, 46, 28, 0.95)", "rgba(10, 30, 20, 0.98)"]}
          style={styles.overlay}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Top Bismillah */}
            <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>

            <View style={styles.centerContainer}>
              {/* Central Logo Badge */}
              <View style={styles.logoRing}>
                <View style={[styles.logoCircle, { borderColor: theme.accent }]}>
                  <Image
                    source={require("../assets/images/icon.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Branding */}
              <View style={styles.branding}>
                <Text style={styles.brandTitle}>QuranSathi</Text>
                <Text style={[styles.brandTagline, { color: theme.accent }]}>YOUR QURAN COMPANION</Text>
              </View>

              {/* Shimmer Loader */}
              <View style={styles.loaderWrap}>
                <View style={[styles.loaderTrack, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
                  <Animated.View
                    style={[
                      styles.shimmer,
                      {
                        backgroundColor: theme.accent,
                        transform: [{ translateX: shimmerTranslate }],
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Pulsing Dots */}
              <View style={styles.dotsRow}>
                {[0, 1, 2].map((i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: theme.accent,
                        opacity: dotsAnim,
                        transform: [{ scale: dotsAnim }],
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Version Footer */}
            <Text style={styles.version}>v1.0.0</Text>
          </Animated.View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0E2E1C" },
  bg: { flex: 1 },
  bgImage: { opacity: 0.15, resizeMode: "repeat" },
  overlay: { flex: 1, alignItems: "center", justifyContent: "space-between", paddingVertical: 60 },
  content: { flex: 1, alignItems: "center", justifyContent: "space-between", width: "100%" },
  bismillah: {
    fontSize: 24,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  centerContainer: { alignItems: "center", width: "100%", gap: 40 },
  logoRing: {
    padding: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  logoImage: { width: 80, height: 80 },
  branding: { alignItems: "center", gap: 8 },
  brandTitle: {
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
    opacity: 0.9,
  },
  loaderWrap: { width: width * 0.4, height: 2, marginTop: 10 },
  loaderTrack: { flex: 1, borderRadius: 1, overflow: "hidden" },
  shimmer: { width: "60%", height: "100%", borderRadius: 1 },
  dotsRow: { flexDirection: "row", gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  version: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    fontFamily: "Inter_400Regular",
    letterSpacing: 2,
  },
});
