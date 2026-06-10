import { ReactNode } from "react";
import { Platform, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AuthCardProps {
  children: ReactNode;
  /**
   * Custom top offset from the top of the screen.
   * Default: 47 for signup (scrollable), 164 for login (fixed)
   */
  topOffset?: number;
  /**
   * Enable scrolling for long content (signup).
   * Default: false
   */
  scrollable?: boolean;
  /**
   * Card fits content height instead of stretching to fill screen.
   * Default: false
   */
  fitContent?: boolean;
  /**
   * Additional style for the card container
   */
  style?: ViewStyle;
}

export function AuthCard({
  children,
  topOffset = 47,
  scrollable = false,
  fitContent = false,
  style,
}: AuthCardProps) {
  const insets = useSafeAreaInsets();

  const cardStyle: ViewStyle = {
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    // iOS shadow - prominent and clear
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 7,
    shadowOffset: { width: 1, height: 2 },
    // Android shadow - lighter
    ...Platform.select({
      android: {
        borderWidth: 1,
        borderColor: "rgba(241, 234, 234, 0.01)",
        boxShadow: "0px 0px 16px 0px rgba(21, 21, 21, 0.08)",
        // elevation: 0.8,
      },
    }),
  };

  // Calculate safe top offset (for iOS notch/Dynamic Island)
  const safeTopOffset = topOffset + insets.top;

  if (scrollable) {
    // Scrollable mode for signup (absolute positioning with KeyboardAwareScrollView)
    return (
      <View
        style={[
          {
            position: "absolute",
            left: 16,
            right: 16,
            top: safeTopOffset,
            bottom: insets.bottom + 24,
            zIndex: 2,
          },
          cardStyle,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  if (fitContent) {
    // Fit content mode - card height fits content (for find-id, find-password)
    return (
      <View
        style={{
          marginTop: safeTopOffset,
          paddingHorizontal: 16,
        }}
      >
        <View style={[cardStyle, { padding: 16 }, style]}>{children}</View>
      </View>
    );
  }

  // Fixed mode for login (flex layout)
  return (
    <View
      style={{
        flex: 1,
        marginTop: safeTopOffset,
        paddingHorizontal: 16,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <View style={[cardStyle, { flex: 1, padding: 16 }, style]}>{children}</View>
    </View>
  );
}
