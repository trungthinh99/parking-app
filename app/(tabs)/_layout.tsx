import React from "react";
import { Tabs } from "expo-router";
import { useAuthStore } from "@/src/store/auth-store";
import { useRealtimeNotification } from "@/src/hooks/useRealtimeNotification";

/**
 * Tabs layout using Expo Router Tabs navigator
 * Tab bar is hidden globally; each screen renders its own BottomNavBar as needed
 * Auth guard: returns null if user is not authenticated (navigation handled by caller)
 */
export default function TabsLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Connect WebSocket for real-time message notifications
  useRealtimeNotification();

  // Don't render tabs until auth state is loaded from SecureStore
  if (!isHydrated || !isAuthenticated) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="control-board" />
      <Tabs.Screen name="private-parking" />
      <Tabs.Screen name="on-street-parking" />
      <Tabs.Screen name="street-parking" />
      {/* Messages moved to root stack for slide animation */}
      <Tabs.Screen name="settings" />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
