import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

import { Text } from "@/src/components/Text";

interface LocationPermissionOverlayProps {
  visible: boolean;
}

/**
 * Full-screen overlay shown on parking map screens when the location permission
 * is denied (or location services are off). Covers the entire map and search bar,
 * prompting the user to grant access so the map can be displayed.
 */
export function LocationPermissionOverlay({ visible }: LocationPermissionOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      {/* Force dark status bar text so the clock / battery % stay readable on the
          white overlay background (some screens may have set it to light). */}
      <StatusBar style="dark" />
      <Text style={styles.message}>
        지도를 표시하려면 앱의 위치 접근을 허용하고 위치 서비스가 켜져 있는지 확인해주세요.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    zIndex: 1000,
  },
  message: {
    color: "#333333",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    textAlign: "center",
  },
});
