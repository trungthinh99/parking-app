import { ReactNode } from "react";
import { View, ViewStyle, StyleSheet, Platform } from "react-native";

interface PaperProps {
  children: ReactNode;
  /**
   * Additional style for the paper container
   */
  style?: ViewStyle;
}

/**
 * A card component with shadow styling
 * Used for elevated content containers
 */
export function Paper({ children, style }: PaperProps) {
  return <View style={[styles.paper, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    // iOS shadow
    shadowColor: "#000000",
    shadowOpacity: 0.09,
    shadowRadius: 7,
    shadowOffset: { width: 1, height: 1 },
    // Android shadow - use border to create uniform shadow effect on all sides
    ...Platform.select({
      android: {
        borderWidth: 1,
        borderColor: "rgba(241, 234, 234, 0.01)",
        boxShadow: "0px 0px 16px 0px rgba(21, 21, 21, 0.08)",
        // elevation: 0.8,
      },
    }),
  },
});
