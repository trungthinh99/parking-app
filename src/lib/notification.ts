import Constants from "expo-constants";
import { Alert, Linking, Platform } from "react-native";

/**
 * Check if running inside Expo Go (where expo-notifications is limited).
 */
function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

/**
 * Lazily import expo-notifications to avoid crash on Expo Go Android.
 * Returns null when running in Expo Go.
 */
async function getNotificationsModule() {
  if (isExpoGo()) {
    return null;
  }
  return await import("expo-notifications");
}

/**
 * Request notification permission from the OS.
 * Returns true if permission was granted.
 * Always returns true in Expo Go (graceful fallback).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    // Expo Go: skip permission request, treat as granted
    return true;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === "granted") {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Check if notification permission is currently granted.
 */
export async function isNotificationPermissionGranted(): Promise<boolean> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return true;
  }

  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

/**
 * Show an alert guiding the user to system settings when permission was denied.
 */
export function showPermissionDeniedAlert(): void {
  Alert.alert("알림 권한 필요", "알림을 받으려면 설정에서 알림 권한을 허용해 주세요.", [
    { text: "취소", style: "cancel" },
    {
      text: "설정으로 이동",
      onPress: () => {
        if (Platform.OS === "ios") {
          Linking.openURL("app-settings:");
        } else {
          Linking.openSettings();
        }
      },
    },
  ]);
}

/**
 * Configure default notification behavior (show alert, sound, badge when app is foreground).
 * No-op in Expo Go.
 */
export async function configureNotificationHandler(): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
