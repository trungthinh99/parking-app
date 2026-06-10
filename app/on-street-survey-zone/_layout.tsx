import { Stack } from "expo-router";

import { useAuthGuard } from "@/src/hooks/useAuthGuard";

export default function OnStreetSurveyZoneLayout() {
  const canRender = useAuthGuard();
  if (!canRender) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );
}
