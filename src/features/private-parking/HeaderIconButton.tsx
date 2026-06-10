import React from "react";
import { TouchableOpacity, StyleSheet, View, ViewStyle } from "react-native";
import { ClipboardText, Gps, Notification, Task } from "iconsax-react-native";
import { Text } from "@/src/components/Text";

type IconType = "gps" | "notification" | "filter" | "clipboard";

interface HeaderIconButtonProps {
  icon: IconType;
  onPress: () => void;
  style?: ViewStyle;
  /** Badge count displayed on the icon (e.g. clipboard unread count) */
  badgeCount?: number;
}

const iconComponents: Record<IconType, React.FC> = {
  gps: () => <Gps size={20} color="#151515" variant="Linear" />,
  notification: () => (
    <View>
      <Notification size={20} color="#151515" variant="Linear" />
      <View style={styles.notificationDot} />
    </View>
  ),
  filter: () => <Task size={20} color="#151515" variant="Linear" />,
  clipboard: () => <ClipboardText size={20} color="#151515" variant="Linear" />,
};

/**
 * Header icon button for notification, filter, and clipboard actions
 */
export function HeaderIconButton({ icon, onPress, style, badgeCount }: HeaderIconButtonProps) {
  const IconComponent = iconComponents[icon];

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={onPress} activeOpacity={0.7}>
      <IconComponent />
      {badgeCount != null && badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount > 99 ? "99+" : badgeCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3337",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#238aaf",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    lineHeight: 12,
  },
});
