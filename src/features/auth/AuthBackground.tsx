import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AuthBackgroundProps = {
  children: React.ReactNode;
};

export function AuthBackground({ children }: AuthBackgroundProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="light" backgroundColor="#238AAF" />
      <View
        style={{
          height: 300,
          backgroundColor: "#238AAF",
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 40,
          overflow: "hidden",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 0,
          paddingTop: insets.top,
        }}
      />
      {children}
    </View>
  );
}
