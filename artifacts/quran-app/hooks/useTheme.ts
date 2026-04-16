import { useColorScheme } from "react-native";
import colors from "@/constants/colors";
import { useQuran } from "@/context/QuranContext";

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const { darkMode } = useQuran();

  const isDark = darkMode || systemColorScheme === "dark";
  const theme = isDark ? colors.dark : colors.light;

  return { ...theme, isDark, radius: colors.radius };
}
