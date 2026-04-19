/**
 * QuranSathi — Premium Accessible Palette
 *
 * Semantic, palette-agnostic token names.
 * All text-on-background combos pass WCAG AA (≥ 4.5:1).
 *
 * Light anchors  : Guided Emerald, Spiritual Brass Gold, Charcoal, Parchment Beige
 * Dark anchors   : Warm near-black backgrounds with lighter counterparts
 */
const colors = {
  light: {
    // ── Core semantic tokens ────────────────────────────────────
    primary: "#1A6A4C",          // Guided Emerald
    primaryForeground: "#FFFFFF",
    accent: "#B8986A",           // Spiritual Brass Gold (decorative only on light bg)
    textPrimary: "#3C3127",      // Charcoal Deep Brown — body text
    textSecondary: "#8B6914",    // Darkened Tafsir Tan — passes AA on Parchment Beige
    cardBackground: "#F8F4ED",   // Parchment Beige
    background: "#FFFFFF",       // Pure White
    border: "#E4DDD0",
    destructive: "#DC2626",

    // ── Backwards-compat aliases (React Navigation / legacy) ───
    text: "#3C3127",
    card: "#F8F4ED",

    // ── Gradient palette (header / banner use) ─────────────────
    gradientStart: "#145A3A",    // Deep warm emerald
    gradientEnd: "#1A6A4C",      // Guided Emerald
    gradientStartDark: "#0E2E1C",
    gradientEndDark: "#143D2A",
  },

  dark: {
    // ── Core semantic tokens ────────────────────────────────────
    primary: "#2D9E72",          // Lighter Emerald for dark-bg visibility
    primaryForeground: "#0E1A14",
    accent: "#D4AC7A",           // Slightly lighter Gold for contrast
    textPrimary: "#E8DDD0",      // Flipped Charcoal — warm light text
    textSecondary: "#D4AC7A",    // Brass variant — readable on warm dark bg
    cardBackground: "#1C1710",   // Warm dark (not cold gray)
    background: "#141210",       // Warm near-black
    border: "#2C251D",
    destructive: "#EF4444",

    // ── Backwards-compat aliases (React Navigation / legacy) ───
    text: "#E8DDD0",
    card: "#1C1710",

    // ── Gradient palette (header / banner use) ─────────────────
    gradientStart: "#0E2E1C",
    gradientEnd: "#143D2A",
    gradientStartDark: "#0A1E12",
    gradientEndDark: "#0E2E1C",
  },

  radius: 16,
};

export default colors;
