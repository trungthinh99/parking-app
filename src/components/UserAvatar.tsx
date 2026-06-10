import React from "react";
import { View, Image, StyleSheet, type ViewStyle } from "react-native";
import IconUser from "@/src/assets/images/icons/icon-user-24.svg";

interface UserAvatarProps {
  /** Full URL of the avatar image, or null/undefined for fallback icon */
  uri: string | null | undefined;
  /** Diameter of the avatar circle (default: 44) */
  size?: number;
  /** Icon color for fallback (default: "#FFFFFF") */
  iconColor?: string;
  /** Background color for fallback circle (default: "rgba(255, 255, 255, 0.2)") */
  fallbackBackground?: string;
  /** Additional style for the outer container */
  style?: ViewStyle;
}

/**
 * Reusable avatar component that shows the user's uploaded photo
 * or falls back to a default user icon.
 */
export function UserAvatar({
  uri,
  size = 44,
  iconColor = "#FFFFFF",
  fallbackBackground = "rgba(255, 255, 255, 0.2)",
  style,
}: UserAvatarProps) {
  const borderRadius = size / 2;
  const iconSize = Math.round(size * 0.55);

  if (uri) {
    return (
      <View
        style={[
          styles.imageContainer,
          { width: size, height: size, borderRadius },
          style,
        ]}
      >
        <Image source={{ uri }} style={styles.image} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius, backgroundColor: fallbackBackground },
        style,
      ]}
    >
      <IconUser width={iconSize} height={iconSize} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});
