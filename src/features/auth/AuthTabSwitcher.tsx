import { Pressable, View, ViewStyle } from "react-native";
import { Text } from "@/src/components/Text";

type Tab = {
  key: string;
  label: string;
};

type AuthTabSwitcherProps = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  style?: ViewStyle;
};

export function AuthTabSwitcher({ tabs, activeTab, onTabChange, style }: AuthTabSwitcherProps) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          padding: 4,
          columnGap: 8,
          // Shadow
          shadowColor: "#151515",
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
          elevation: 4,
        },
        style,
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onTabChange(tab.key)}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 10,
              backgroundColor: isActive ? "#238AAF" : "transparent",
              alignItems: "center",
              justifyContent: "center",
              // Active tab shadow
              ...(isActive && {
                shadowColor: "#128AAF",
                shadowOpacity: 0.4,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 0 },
                elevation: 2,
              }),
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: isActive ? "700" : "400",
                color: isActive ? "#FFFFFF" : "#151515",
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
