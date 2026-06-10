import { Stack } from "expo-router";

export const unstable_settings = {
  initialRouteName: "login",
};

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Login is the initial route - no swipe back needed */}
      <Stack.Screen name="login" options={{ gestureEnabled: false }} />
      <Stack.Screen name="find-password" options={{ animation: "none" }} />
      <Stack.Screen name="find-error" options={{ gestureEnabled: false }} />
      <Stack.Screen name="find-password-success" options={{ gestureEnabled: false }} />
      <Stack.Screen name="signup" />
      <Stack.Screen name="receive-invite" />
    </Stack>
  );
}
