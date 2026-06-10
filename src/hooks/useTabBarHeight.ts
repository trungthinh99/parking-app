import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_CONTENT_HEIGHT = 50;

/**
 * Hook to calculate the total height of the bottom tab bar (content + safe area padding)
 * Used by components that need to account for the tab bar height (e.g. bottom sheets, maps)
 */
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  const totalBottom = Platform.OS === "ios" ? insets.bottom * 0.6 + 4 : insets.bottom + 6;
  return TAB_BAR_CONTENT_HEIGHT + totalBottom;
}
