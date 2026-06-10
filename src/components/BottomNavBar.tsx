import React from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Home2, Buliding, Driving, Setting2 } from "iconsax-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/src/components/Text";
import { PATHS } from "@/constants/Paths";
import { ParkingSignIcon } from "@/src/components/icons/ParkingSignIcon";
import { saveLastTab } from "@/src/lib/auth-storage";

const COLORS = {
  active: "#238AAF",
  inactive: "#454545",
  background: "#FFFFFF",
};

export const TAB_BAR_CONTENT_HEIGHT = 50;

/**
 * Hook to calculate the total height of the bottom nav bar (content + safe area padding)
 */
export function useBottomNavBarHeight() {
  const insets = useSafeAreaInsets();
  const totalBottom = Platform.OS === "ios" ? insets.bottom * 0.6 + 4 : insets.bottom + 6;
  return TAB_BAR_CONTENT_HEIGHT + totalBottom;
}

interface TabItem {
  name: string;
  label: string;
  icon: "home" | "building" | "car" | "parking-sign" | "setting";
  route: string;
}

const TABS: TabItem[] = [
  {
    name: "control-board",
    label: "대시보드",
    icon: "home",
    route: PATHS.TABS.CONTROL_BOARD,
  },
  {
    name: "private-parking",
    label: "부설 주차장",
    icon: "building",
    route: PATHS.TABS.PRIVATE_PARKING,
  },
  {
    name: "road-parking",
    label: "노외 주차장",
    icon: "car",
    route: PATHS.TABS.STREET_PARKING,
  },
  {
    name: "on-street-parking",
    label: "노상 주차장",
    icon: "parking-sign",
    route: PATHS.TABS.ON_STREET_PARKING,
  },
  {
    name: "settings",
    label: "환경설정",
    icon: "setting",
    route: PATHS.TABS.SETTINGS,
  },
];

/**
 * Renders the correct icon based on name and focus state
 */
function TabIcon({ name, focused }: { name: TabItem["icon"]; focused: boolean }) {
  const color = focused ? COLORS.active : COLORS.inactive;
  const variant = focused ? "Bold" : "Linear";
  const size = 24;

  switch (name) {
    case "home":
      return <Home2 size={size} color={color} variant={variant} />;
    case "building":
      return <Buliding size={size} color={color} variant={variant} />;
    case "car":
      return <Driving size={size} color={color} variant={variant} />;
    case "parking-sign":
      return <ParkingSignIcon size={size} variant={variant} />;
    case "setting":
      return <Setting2 size={size} color={color} variant={variant} />;
    default:
      return null;
  }
}

/**
 * Standalone bottom navigation bar component
 * Can be included or excluded from any screen within tabs
 */
export function BottomNavBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  const totalBottom = Platform.OS === "ios" ? insets.bottom * 0.6 + 4 : insets.bottom + 6;

  return (
    <View
      style={[
        styles.container,
        {
          height: TAB_BAR_CONTENT_HEIGHT + totalBottom,
          paddingBottom: totalBottom,
          paddingTop: 6,
        },
      ]}
    >
      {TABS.map((tab) => {
        const routeSegment = tab.route.split("/").pop();
        const isFocused = routeSegment === pathname.split("/").pop();

        return (
          <Pressable
            key={tab.name}
            style={styles.tabItem}
            onPress={() => {
              if (isFocused) return;
              saveLastTab(tab.route);
              router.replace(tab.route as any);
            }}
          >
            <TabIcon name={tab.icon} focused={isFocused} />
            <Text style={[styles.tabLabel, { color: isFocused ? COLORS.active : COLORS.inactive }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    paddingTop: 2,
    zIndex: 10,
    // Paper-like shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
        borderWidth: 1,
        borderColor: "rgba(241, 234, 234, 0.01)",
        boxShadow: "0px 0px 16px 0px rgba(21, 21, 21, 0.08)",
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
});
