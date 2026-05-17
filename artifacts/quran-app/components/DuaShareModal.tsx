import React, { useRef, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";

import { useTheme } from "@/hooks/useTheme";
import type { DuaItem, DuaCategory } from "@/data/duas";

function sanitizeFilePart(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

interface DuaShareModalProps {
  visible: boolean;
  onClose: () => void;
  dua: DuaItem | null;
  category: DuaCategory | null;
}

export function DuaShareModal({ visible, onClose, dua, category }: DuaShareModalProps) {
  const theme = useTheme();
  const shareCardRef = useRef<ViewShot | null>(null);
  const [loading, setLoading] = useState(false);

  const shareTextFallback = useCallback(async () => {
    if (!dua || !category) return;
    const message = `${dua.title}\n\n${dua.arabic}\n\n${dua.english}\n\nSource: ${dua.source}\nShared from QuranSathi`;
    await Share.share({ message });
  }, [dua, category]);

  const handleShareImage = useCallback(async (target?: "whatsapp" | "instagram") => {
    if (!dua) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS === "web") {
      await shareTextFallback();
      return;
    }

    try {
      setLoading(true);
      const captureUri = await shareCardRef.current?.capture?.();
      const sharingAvailable = await Sharing.isAvailableAsync();

      if (!sharingAvailable || !captureUri) {
        await shareTextFallback();
        return;
      }

      const safeTitle = sanitizeFilePart(dua.title) || "dua";
      const shareUri = `${FileSystem.cacheDirectory}QuranSathi-Dua-${safeTitle}.png`;
      await FileSystem.copyAsync({ from: captureUri, to: shareUri });

      await Sharing.shareAsync(shareUri, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle: target ? `Share Dua to ${target}` : "Share Dua",
      });
    } catch (err) {
      console.warn("Share image failed:", err);
      await shareTextFallback();
    } finally {
      setLoading(false);
    }
  }, [dua, shareTextFallback]);

  if (!dua || !category) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => !loading && onClose()}
      />
      
      <View style={[styles.sheet, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
        
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Share Dua as Image</Text>
            <Text style={[styles.sub, { color: theme.textSecondary }]}>
              Create a beautiful reminder for statuses and stories.
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={loading}>
            <Feather name="x" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ViewShot
            ref={shareCardRef}
            options={{ format: "png", quality: 1, result: "tmpfile" }}
            style={styles.captureWrap}
          >
            <LinearGradient
              colors={theme.isDark 
                ? [theme.gradientStartDark, theme.gradientStart, theme.gradientEndDark] 
                : [theme.gradientStart, theme.gradientEnd, theme.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              {/* Decorative elements */}
              <View style={styles.glowLarge} />
              <View style={styles.glowSmall} />

              <View style={styles.cardHeader}>
                <View style={styles.brandChip}>
                  <Text style={styles.brandText}>QuranSathi</Text>
                </View>
                <Text style={styles.categoryBadge}>{category.title}</Text>
              </View>

              <View style={styles.mainContent}>
                <Text style={styles.duaTitle}>{dua.title}</Text>
                <Text style={styles.arabic}>{dua.arabic}</Text>
                
                <View style={styles.dividerRow}>
                  <View style={styles.divider} />
                  <Feather name="heart" size={12} color="rgba(255,255,255,0.6)" />
                  <View style={styles.divider} />
                </View>

                <Text style={styles.translation}>{dua.english}</Text>
                {dua.source ? (
                   <Text style={styles.source}>Source: {dua.source}</Text>
                ) : null}
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>QuranSathi — Your Quran Companion</Text>
                <Text style={styles.footerSub}>Read. Pray. Share khair with our free app.</Text>
              </View>
            </LinearGradient>
          </ViewShot>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => handleShareImage()}
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.primaryForeground} />
              ) : (
                <>
                  <Feather name="image" size={18} color={theme.primaryForeground} />
                  <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>Share Image</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={shareTextFallback}
              style={[styles.secondaryBtn, { borderColor: theme.border }]}
              disabled={loading}
            >
              <Feather name="type" size={16} color={theme.textPrimary} />
              <Text style={[styles.secondaryBtnText, { color: theme.textPrimary }]}>Share as Text</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "90%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4, lineHeight: 18 },
  closeBtn: { padding: 4 },
  content: { paddingBottom: 40 },
  captureWrap: {
    borderRadius: 24,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  card: {
    padding: 24,
    minHeight: 450,
    justifyContent: "space-between",
  },
  glowLarge: {
    position: "absolute", top: -40, right: -40, width: 200, height: 200,
    borderRadius: 100, backgroundColor: "rgba(255,255,255,0.08)",
  },
  glowSmall: {
    position: "absolute", bottom: 60, left: -20, width: 120, height: 120,
    borderRadius: 60, backgroundColor: "rgba(255,255,255,0.05)",
  },
  cardHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  brandChip: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  brandText: { color: "#FFF", fontSize: 11, fontFamily: "Inter_700Bold" },
  categoryBadge: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  mainContent: { flex: 1, justifyContent: "center", marginVertical: 30, gap: 16 },
  duaTitle: { color: "#FFF", fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  arabic: { 
    color: "#FFF", fontSize: 28, fontFamily: "Inter_400Regular", 
    textAlign: "right", lineHeight: 46, writingDirection: "rtl",
  },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 },
  divider: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.2)" },
  translation: { color: "#FFF", fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 24, textAlign: "center" },
  source: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", fontStyle: "italic" },
  footer: { 
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)", 
    paddingTop: 16, alignItems: "center", gap: 4,
  },
  footerText: { color: "#FFF", fontSize: 14, fontFamily: "Inter_700Bold" },
  footerSub: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: "Inter_500Medium" },
  actions: { marginTop: 20, gap: 12 },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 56, borderRadius: 16,
  },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  secondaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 52, borderRadius: 16, borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
