import { StyleSheet, View } from "react-native";

import { LoadingSpinner } from "./LoadingSpinner";

interface LoadingOverlayProps {
  visible: boolean;
  spinnerSize?: number;
}

export function LoadingOverlay({ visible, spinnerSize = 50 }: LoadingOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <LoadingSpinner size={spinnerSize} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(236, 236, 236, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
});
