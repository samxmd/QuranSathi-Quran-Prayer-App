import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useQuran } from "@/context/QuranContext";
import {
  POPULAR_TRANSLATIONS,
  getLanguageDisplayName,
  type TranslationEdition,
} from "@/services/availableTranslations";
import { translationDownloadService } from "@/services/translationDownloadService";

interface TranslationDownloadModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TranslationDownloadModal({ visible, onClose }: TranslationDownloadModalProps) {
  const theme = useTheme();
  const { downloadedLanguageCodes, registerDownloadedLanguage, toggleLanguage } = useQuran();
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [availableTranslations, setAvailableTranslations] = useState<TranslationEdition[]>(POPULAR_TRANSLATIONS);
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);
  const [hasLoadedRemoteTranslations, setHasLoadedRemoteTranslations] = useState(false);

  const sortTranslations = useCallback((editions: TranslationEdition[]) => {
    return [...editions].sort((a, b) => {
      const languageCompare = getLanguageDisplayName(a.language).localeCompare(
        getLanguageDisplayName(b.language)
      );
      if (languageCompare !== 0) return languageCompare;
      return a.englishName.localeCompare(b.englishName);
    });
  }, []);

  const loadFullCatalog = useCallback(async () => {
    setIsLoadingTranslations(true);
    const editions = await translationDownloadService.fetchAvailableEditions();

    if (editions.length > 0) {
      setAvailableTranslations(sortTranslations(editions));
      setHasLoadedRemoteTranslations(true);
    } else {
      setAvailableTranslations(POPULAR_TRANSLATIONS);
      setHasLoadedRemoteTranslations(false);
    }

    setIsLoadingTranslations(false);
  }, [sortTranslations]);

  useEffect(() => {
    if (!visible) return;

    let isActive = true;

    const loadCachedTranslations = async () => {
      const editions = await translationDownloadService.fetchAvailableEditions({ allowNetwork: false });
      if (!isActive) return;

      if (editions.length > 0) {
        setAvailableTranslations(sortTranslations(editions));
        setHasLoadedRemoteTranslations(true);
      } else {
        setAvailableTranslations(POPULAR_TRANSLATIONS);
        setHasLoadedRemoteTranslations(false);
      }
    };

    loadCachedTranslations().catch(() => {
      if (isActive) {
        setAvailableTranslations(POPULAR_TRANSLATIONS);
        setHasLoadedRemoteTranslations(false);
      }
    });

    return () => {
      isActive = false;
    };
  }, [sortTranslations, visible]);

  const filteredTranslations = useMemo(() => {
    const searchLower = search.toLowerCase();
    return availableTranslations.filter((item) => {
      const languageName = getLanguageDisplayName(item.language);
      return (
        item.englishName.toLowerCase().includes(searchLower) ||
        item.language.toLowerCase().includes(searchLower) ||
        languageName.toLowerCase().includes(searchLower)
      );
    });
  }, [availableTranslations, search]);

  const handleDownload = async (edition: TranslationEdition) => {
    if (downloadedLanguageCodes.includes(edition.identifier)) {
      toggleLanguage(edition.identifier);
      onClose();
      return;
    }

    setDownloadingId(edition.identifier);
    setProgress(0);

    const result = await translationDownloadService.downloadEdition(
      edition.identifier,
      (p) => setProgress(p)
    );

    if (result.success) {
      await registerDownloadedLanguage(edition.identifier);
      await toggleLanguage(edition.identifier);
      setDownloadingId(null);
      Alert.alert("Success", `${getLanguageDisplayName(edition.language)} has been downloaded and enabled.`);
      onClose();
    } else {
      setDownloadingId(null);
      Alert.alert("Download failed", result.errorMessage ?? "Failed to download translation. Please try again.");
    }
  };

  const renderItem = ({ item }: { item: TranslationEdition }) => {
    const isDownloaded = downloadedLanguageCodes.includes(item.identifier);
    const isDownloading = downloadingId === item.identifier;

    return (
      <TouchableOpacity
        style={[styles.item, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
        onPress={() => !isDownloading && handleDownload(item)}
        disabled={isDownloading}
      >
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: theme.textPrimary }]}>
            {getLanguageDisplayName(item.language)}
          </Text>
          <Text style={[styles.itemSub, { color: theme.textSecondary }]}>
            {item.englishName}
          </Text>
        </View>
        
        {isDownloading ? (
          <View style={styles.progressContainer}>
             <ActivityIndicator size="small" color={theme.primary} />
             <Text style={[styles.progressText, { color: theme.primary }]}>{Math.round(progress * 100)}%</Text>
          </View>
        ) : (
          <View style={[styles.actionBtn, { backgroundColor: isDownloaded ? theme.primary + "15" : theme.primary }]}>
            <Feather 
              name={isDownloaded ? "check" : "download"} 
              size={16} 
              color={isDownloaded ? theme.primary : "#FFF"} 
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>More Translations</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Feather name="search" size={18} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search languages..."
              placeholderTextColor={theme.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {isLoadingTranslations ? (
            <View style={[styles.inlineStatus, { backgroundColor: theme.primary + "10", borderColor: theme.primary + "20" }]}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.inlineStatusText, { color: theme.textSecondary }]}>
                Loading the full translation catalog...
              </Text>
            </View>
          ) : !hasLoadedRemoteTranslations ? (
            <View style={[styles.inlineStatus, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <Text style={[styles.inlineStatusText, { color: theme.textSecondary }]}>
                Showing a quick starter list.
              </Text>
              <TouchableOpacity
                style={[styles.catalogButton, { backgroundColor: theme.primary }]}
                onPress={loadFullCatalog}
                activeOpacity={0.85}
              >
                <Text style={styles.catalogButtonText}>Full catalog</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <FlatList
            data={filteredTranslations}
            renderItem={renderItem}
            keyExtractor={(item) => item.identifier}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ color: theme.textSecondary }}>No translations found.</Text>
              </View>
            }
          />
          
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
             <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                Translations are sourced from AlQuran.cloud API and stored offline.
             </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  container: { height: "85%", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  closeBtn: { padding: 4 },
  searchBar: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    height: 50, 
    borderRadius: 16, 
    borderWidth: 1,
    marginBottom: 20 
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, fontFamily: "Inter_400Regular" },
  list: { paddingBottom: 40 },
  item: { 
    flexDirection: "row", 
    padding: 16, 
    borderRadius: 20, 
    borderWidth: 1, 
    marginBottom: 12,
    alignItems: "center"
  },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  itemSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  progressContainer: { alignItems: "center", gap: 4 },
  progressText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  inlineStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  inlineStatusText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  catalogButton: {
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  catalogButtonText: { color: "#FFF", fontSize: 12, fontFamily: "Inter_700Bold" },
  empty: { paddingTop: 40, alignItems: "center" },
  footer: { paddingTop: 20, borderTopWidth: 1 },
  footerText: { fontSize: 12, textAlign: "center", lineHeight: 18 }
});
