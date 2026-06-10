import { Stack } from "expo-router";

/**
 * Stack navigator for settings and its sub-screens
 * Sub-screens use slide animation for navigation
 */
export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#238AAF" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="edit-profile" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="security-settings" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}
