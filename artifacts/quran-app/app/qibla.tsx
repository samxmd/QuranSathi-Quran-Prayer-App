import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

const KAABA_COORDS = {
  latitude: 21.4225,
  longitude: 39.8262,
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function normalizeBearing(value: number) {
  return (value + 360) % 360;
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
  const [refreshToken, setRefreshToken] = useState(0);

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
        setPermissionMessage("Location permission is needed to calculate your Qibla direction.");
        setLoading(false);
        return;
      }

      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
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
          setLocationName("Current position");
        }

        try {
          headingSubscription = await Location.watchHeadingAsync((value) => {
            setHeading(normalizeBearing(value.trueHeading || value.magHeading || 0));
          });
        } catch {
          setHeading(null);
        }
      } catch {
        setPermissionMessage("We could not determine your current location. Please try again.");
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader
        title="Qibla Finder"
        arabicTitle="القبلة"
        subtitle="Face Makkah with live compass direction toward the Kaaba."
        showBack
      />

      <View style={[styles.panel, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={theme.primary} size="large" />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Calculating your Qibla direction...
            </Text>
          </View>
        ) : permissionMessage ? (
          <View style={styles.emptyState}>
            <Feather name="map-pin" size={32} color={theme.primary} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Location needed</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{permissionMessage}</Text>
          </View>
        ) : (
          <>
            {/* Premium SVG Compass */}
            <View style={styles.compassWrap}>
              <Svg width={260} height={260} viewBox="0 0 260 260">
                {/* Outer decorative ring */}
                <Circle cx={130} cy={130} r={125} fill={theme.isDark ? "#0D1A0D" : "#F4F6F0"} stroke={theme.border} strokeWidth={1.5} />
                <Circle cx={130} cy={130} r={115} fill="none" stroke={theme.border} strokeWidth={0.5} opacity={0.5} />
                <Circle cx={130} cy={130} r={105} fill="none" stroke={theme.border} strokeWidth={0.5} opacity={0.3} />

                {/* Degree tick marks */}
                {Array.from({ length: 36 }).map((_, i) => {
                  const angle = (i * 10 * Math.PI) / 180;
                  const isCardinal = i % 9 === 0;
                  const outer = 122;
                  const inner = isCardinal ? 108 : 113;
                  const x1 = 130 + outer * Math.sin(angle);
                  const y1 = 130 - outer * Math.cos(angle);
                  const x2 = 130 + inner * Math.sin(angle);
                  const y2 = 130 - inner * Math.cos(angle);
                  return (
                    <Line
                      key={i}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={isCardinal ? theme.primary : theme.border}
                      strokeWidth={isCardinal ? 2 : 1}
                      opacity={isCardinal ? 0.9 : 0.6}
                    />
                  );
                })}

                {/* Cardinal labels */}
                {[
                  { label: "N", x: 130, y: 22 },
                  { label: "S", x: 130, y: 248 },
                  { label: "E", x: 248, y: 134 },
                  { label: "W", x: 12,  y: 134 },
                ].map(({ label, x, y }) => (
                  <SvgText
                    key={label}
                    x={x} y={y}
                    textAnchor="middle"
                    fontSize={label === "N" ? 15 : 12}
                    fontWeight={label === "N" ? "700" : "600"}
                    fill={label === "N" ? theme.primary : theme.textSecondary}
                  >
                    {label}
                  </SvgText>
                ))}

                {/* Rotating needle group */}
                <G
                  origin="130, 130"
                  rotation={relativeRotation}
                >
                  {/* Qibla tip (green) — diamond shape pointing up */}
                  <Polygon
                    points="130,28 138,120 130,108 122,120"
                    fill={theme.primary}
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
                    fill={theme.primary}
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
              Qibla bearing from true north
            </Text>

            <View style={styles.stats}>
              <View style={[styles.statCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Your heading</Text>
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                  {heading == null ? "Unavailable" : `${heading.toFixed(0)}°`}
                </Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Location</Text>
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                  {locationName || "Current position"}
                </Text>
              </View>
            </View>

            <Text style={[styles.tip, { color: theme.textSecondary }]}>
              Hold your phone flat and rotate until the arrow points straight up. If heading is unavailable,
              use the bearing value as a manual guide.
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
        <Text style={[styles.refreshText, { color: theme.primaryForeground }]}>Refresh Qibla</Text>
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
});
