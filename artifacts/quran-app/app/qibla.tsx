import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Line, Polygon, G, Text as SvgText } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useTheme } from "@/hooks/useTheme";
import { PageHeader } from "@/components/PageHeader";
import { useTranslation } from "react-i18next";

const KAABA_COORDS = {
  latitude: 21.4225,
  longitude: 39.8262,
};
const QIBLA_MATCH_THRESHOLD = 4;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function normalizeBearing(value: number) {
  return (value + 360) % 360;
}

function shortestAngleDifference(from: number, to: number) {
  let diff = normalizeBearing(to - from);
  if (diff > 180) diff -= 360;
  return diff;
}

function polarPoint(angleDegrees: number, radius: number) {
  const angle = (angleDegrees * Math.PI) / 180;
  return {
    x: 130 + radius * Math.sin(angle),
    y: 130 - radius * Math.cos(angle),
  };
}

function calculateQiblaBearing(latitude: number, longitude: number) {
  const userLat = toRadians(latitude);
  const kaabaLat = toRadians(KAABA_COORDS.latitude);
  const deltaLon = toRadians(KAABA_COORDS.longitude - longitude);

  const y = Math.sin(deltaLon);
  const x = Math.cos(userLat) * Math.tan(kaabaLat) - Math.sin(userLat) * Math.cos(deltaLon);

  return normalizeBearing(toDegrees(Math.atan2(y, x)));
}

export default function QiblaScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [permissionMessage, setPermissionMessage] = useState("");
  const [locationName, setLocationName] = useState("");
  const [bearing, setBearing] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [lastValidHeading, setLastValidHeading] = useState(0);
  const [refreshToken, setRefreshToken] = useState(0);
  const { t } = useTranslation();
  const [accuracyLevel, setAccuracyLevel] = useState<string>(t("detecting"));
  const didTriggerAlignedRef = useRef(false);

  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    let headingSubscription: Location.LocationSubscription | null = null;

    async function loadQiblaData() {
      setLoading(true);
      setPermissionMessage("");
      setLocationName("");
      setBearing(null);
      setHeading(null);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setPermissionMessage(t("locationPermissionNeeded"));
        setLoading(false);
        return;
      }

      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        const nextBearing = calculateQiblaBearing(
          current.coords.latitude,
          current.coords.longitude
        );
        setBearing(nextBearing);

        try {
          const places = await Location.reverseGeocodeAsync({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          });
          const place = places[0];
          if (place) {
            const pieces = [place.city, place.region, place.country].filter(Boolean);
            setLocationName(pieces.join(", "));
          }
        } catch {
          setLocationName(t("current"));
        }

        try {
          headingSubscription = await Location.watchHeadingAsync((value) => {
            const rawHeading = value.trueHeading >= 0 ? value.trueHeading : value.magHeading;
            
            // Simple Low Pass Filter for smoothing
            setHeading((prev) => {
              if (prev === null) return rawHeading;
              const alpha = 0.15; // Smoothing factor (lower = smoother but slower)
              
              // Handle 359 to 0 wrap around smoothing
              let diff = rawHeading - prev;
              if (diff > 180) diff -= 360;
              if (diff < -180) diff += 360;
              
              return normalizeBearing(prev + alpha * diff);
            });

            if (value.accuracy !== undefined) {
              const levels = [t("accuracyLow"), t("accuracyLow"), t("accuracyMedium"), t("accuracyHigh")];
              setAccuracyLevel(levels[value.accuracy] || t("calibrating"));
            }
          });
        } catch (error) {
          console.warn("Heading watch failed:", error);
          setHeading(null);
        }
      } catch {
        setPermissionMessage(t("couldNotDetermineLocation"));
      } finally {
        setLoading(false);
      }
    }

    loadQiblaData();

    return () => {
      headingSubscription?.remove();
    };
  }, [refreshToken]);

  const relativeRotation = useMemo(() => {
    if (bearing == null) return 0;
    if (heading == null) return bearing;
    return normalizeBearing(bearing - heading);
  }, [bearing, heading]);

  const compassRoseRotation = useMemo(() => {
    if (heading == null) return 0;
    return -heading;
  }, [heading]);

  const qiblaOffset = useMemo(() => {
    if (bearing == null || heading == null) return null;
    return shortestAngleDifference(heading, bearing);
  }, [bearing, heading]);

  const isAligned = useMemo(() => {
    if (qiblaOffset == null) return false;
    return Math.abs(qiblaOffset) <= QIBLA_MATCH_THRESHOLD;
  }, [qiblaOffset]);

  const alignmentHint = useMemo(() => {
    if (qiblaOffset == null) return t("rotatePhoneStraight");
    if (isAligned) return t("alignedWithQibla");
    if (qiblaOffset > 0) return t("rotateRight").replace("{{degrees}}", String(Math.round(Math.abs(qiblaOffset))));
    return t("rotateLeft").replace("{{degrees}}", String(Math.round(Math.abs(qiblaOffset))));
  }, [isAligned, qiblaOffset, t]);

  useEffect(() => {
    if (Platform.OS === "web") return;

    if (isAligned && !didTriggerAlignedRef.current) {
      didTriggerAlignedRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      return;
    }

    if (!isAligned) {
      didTriggerAlignedRef.current = false;
    }
  }, [isAligned]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader
        title={t("qiblaFinderTitle")}
        arabicTitle="القبلة"
        subtitle={t("qiblaFinderSubtitle")}
        showBack
      />

      <View
        style={[
          styles.panel,
          {
            backgroundColor: isAligned ? theme.primary + "10" : theme.cardBackground,
            borderColor: isAligned ? theme.primary : theme.border,
          },
        ]}
      >
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={theme.primary} size="large" />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              {t("calculatingQibla")}
            </Text>
          </View>
        ) : permissionMessage ? (
          <View style={styles.emptyState}>
            <Feather name="map-pin" size={32} color={theme.primary} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{t("locationNeeded")}</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{permissionMessage}</Text>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.alignmentBanner,
                {
                  backgroundColor: isAligned ? theme.primary + "18" : theme.background,
                  borderColor: isAligned ? theme.primary + "55" : theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.alignmentDot,
                  { backgroundColor: isAligned ? "#4CAF50" : "#FFC107" },
                ]}
              />
              <View style={styles.alignmentTextWrap}>
                <Text
                  style={[
                    styles.alignmentTitle,
                    { color: isAligned ? theme.primary : theme.textPrimary },
                  ]}
                >
                  {isAligned ? t("qiblaMatched") : t("findingExactDirection")}
                </Text>
                <Text style={[styles.alignmentSub, { color: theme.textSecondary }]}>
                  {alignmentHint}
                </Text>
              </View>
            </View>

            {/* Premium SVG Compass */}
            <View
              style={[
                styles.compassWrap,
                isAligned && {
                  borderColor: theme.primary + "40",
                  backgroundColor: theme.primary + "08",
                },
              ]}
            >
              <Svg width={260} height={260} viewBox="0 0 260 260">
                {/* Outer decorative ring */}
                <Circle cx={130} cy={130} r={125} fill={theme.isDark ? "#0D1A0D" : "#F4F6F0"} stroke={theme.border} strokeWidth={1.5} />
                <Circle cx={130} cy={130} r={115} fill="none" stroke={theme.border} strokeWidth={0.5} opacity={0.5} />
                <Circle cx={130} cy={130} r={105} fill="none" stroke={theme.border} strokeWidth={0.5} opacity={0.3} />

                {/* Compass rose: elements calculate their position dynamically to keep text upright */}
                <G>
                  {/* Degree tick marks */}
                  {Array.from({ length: 36 }).map((_, i) => {
                    const angle = i * 10 + compassRoseRotation;
                    const isCardinal = i % 9 === 0;
                    const outerPoint = polarPoint(angle, 122);
                    const innerPoint = polarPoint(angle, isCardinal ? 108 : 113);
                    return (
                      <Line
                        key={i}
                        x1={outerPoint.x}
                        y1={outerPoint.y}
                        x2={innerPoint.x}
                        y2={innerPoint.y}
                        stroke={theme.border}
                        strokeWidth={1}
                        opacity={0.6}
                      />
                    );
                  })}

                  {/* Cardinal labels (Upright) */}
                  {[
                    { label: "N", angle: 0 },
                    { label: "E", angle: 90 },
                    { label: "S", angle: 180 },
                    { label: "W", angle: 270 },
                  ].map(({ label, angle }) => {
                    const adjustedAngle = angle + compassRoseRotation;
                    const point = polarPoint(adjustedAngle, 118);
                    return (
                      <SvgText
                        key={label}
                        x={point.x}
                        y={point.y + (label === "N" ? 5 : 4)}
                        textAnchor="middle"
                        fontSize={label === "N" ? 15 : 12}
                        fontWeight={label === "N" ? "700" : "600"}
                        fill={label === "N" ? theme.primary : theme.textSecondary}
                      >
                        {label}
                      </SvgText>
                    );
                  })}
                </G>

                {/* Rotating needle group */}
                <G
                  origin="130, 130"
                  rotation={relativeRotation}
                >
                  {/* Qibla tip (green) — diamond shape pointing up */}
                  <Polygon
                    points="130,28 138,120 130,108 122,120"
                    fill={isAligned ? "#4CAF50" : theme.primary}
                    opacity={0.95}
                  />
                  {/* South tail (red) — shorter diamond */}
                  <Polygon
                    points="130,232 136,148 130,158 124,148"
                    fill="#D94040"
                    opacity={0.85}
                  />
                  {/* Kaaba label at tip */}
                  <SvgText
                    x={130} y={24}
                    textAnchor="middle"
                    fontSize={11}
                    fill={isAligned ? "#4CAF50" : theme.primary}
                    fontWeight="700"
                  >
                    🕋
                  </SvgText>
                </G>

                {/* Center hub */}
                <Circle cx={130} cy={130} r={12} fill={theme.cardBackground} stroke={theme.primary} strokeWidth={2} />
                <Circle cx={130} cy={130} r={5} fill={theme.primary} />
              </Svg>
            </View>

            <Text style={[styles.bearingValue, { color: theme.textPrimary }]}>
              {bearing?.toFixed(0)}°
            </Text>
            <Text style={[styles.bearingLabel, { color: theme.textSecondary }]}>
              {t("qiblaBearingLabel")}
            </Text>

            <View style={styles.stats}>
              <View style={[styles.statCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{t("yourHeading")}</Text>
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                  {heading == null ? t("unavailable") : `${heading.toFixed(0)}°`}
                </Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{t("sensorAccuracy")}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accuracyLevel === t("accuracyHigh") ? "#4CAF50" : "#FFC107" }} />
                  <Text style={[styles.statValue, { color: theme.textPrimary }]}>{accuracyLevel}</Text>
                </View>
              </View>
            </View>

            {heading != null && bearing != null ? (
              <View
                style={[
                  styles.matchCard,
                  {
                    backgroundColor: isAligned ? "#4CAF5015" : theme.background,
                    borderColor: isAligned ? "#4CAF5060" : theme.border,
                  },
                ]}
              >
                <Feather
                  name={isAligned ? "check-circle" : "compass"}
                  size={18}
                  color={isAligned ? "#4CAF50" : theme.primary}
                />
                <Text
                  style={[
                    styles.matchCardText,
                    { color: isAligned ? "#2E7D32" : theme.textPrimary },
                  ]}
                >
                  {isAligned
                    ? t("withinDegreesOfQibla").replace("{{threshold}}", String(QIBLA_MATCH_THRESHOLD))
                    : t("degreesAwayFromAlignment").replace("{{degrees}}", String(Math.round(Math.abs(qiblaOffset ?? 0))))}
                </Text>
              </View>
            ) : null}

            <View style={[styles.calibrationBox, { backgroundColor: theme.primary + "10", borderColor: theme.primary + "30" }]}>
              <Feather name="info" size={16} color={theme.primary} />
              <Text style={[styles.calibrationText, { color: theme.textSecondary }]}>
                <Text style={{ fontFamily: "Inter_700Bold", color: theme.textPrimary }}>{t("tipLabel")}</Text>
                {t("calibrationTip")}
              </Text>
            </View>

            <Text style={[styles.tip, { color: theme.textSecondary }]}>
              {t("flatTip")}
            </Text>
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.refreshButton, { backgroundColor: theme.primary }]}
        onPress={() => setRefreshToken((value) => value + 1)}
        activeOpacity={0.85}
      >
        <Feather name="refresh-cw" size={16} color={theme.primaryForeground} />
        <Text style={[styles.refreshText, { color: theme.primaryForeground }]}>{t("refreshQibla")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  panel: {
    marginHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
  },
  alignmentBanner: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  alignmentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  alignmentTextWrap: {
    flex: 1,
  },
  alignmentTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  alignmentSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    lineHeight: 18,
  },
  loadingState: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  emptyState: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  compassWrap: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    ...Platform.select({
      web: { filter: "drop-shadow(0px 4px 16px rgba(0,0,0,0.10))" } as any,
      native: { shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
    }),
  },
  bearingValue: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
  },
  bearingLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    marginBottom: 18,
  },
  stats: {
    width: "100%",
    gap: 10,
  },
  statCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  statTitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  matchCard: {
    width: "100%",
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  matchCardText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
  },
  tip: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    marginTop: 16,
    textAlign: "center",
  },
  refreshButton: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  refreshText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  calibrationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
    gap: 10,
    width: "100%",
  },
  calibrationText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    flex: 1,
  },
});
