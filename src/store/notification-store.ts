import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { isNotificationPermissionGranted } from "@/src/lib/notification";

const NOTIFICATION_ENABLED_KEY = "parking_notification_enabled";

interface NotificationState {
  /** Whether app notifications are enabled / 앱 공지 알림 활성화 여부 */
  isEnabled: boolean;
  /** Whether initial state has been loaded from storage */
  isHydrated: boolean;
}

interface NotificationActions {
  /** Load notification preference from SecureStore, synced with OS permission */
  hydrate: () => Promise<void>;
  /** Update notification preference and persist to SecureStore */
  setEnabled: (enabled: boolean) => Promise<void>;
}

export const useNotificationStore = create<NotificationState & NotificationActions>((set) => ({
  isEnabled: true,
  isHydrated: false,

  hydrate: async () => {
    const [stored, osGranted] = await Promise.all([
      SecureStore.getItemAsync(NOTIFICATION_ENABLED_KEY),
      isNotificationPermissionGranted(),
    ]);

    // User preference from storage (default true if first launch)
    const userPreference = stored === null ? true : stored === "true";

    // Final state: only enabled if both user wants it AND OS allows it
    const enabled = userPreference && osGranted;

    // Persist the synced value back so it stays consistent
    if (stored !== null && userPreference !== enabled) {
      await SecureStore.setItemAsync(NOTIFICATION_ENABLED_KEY, String(enabled));
    }

    set({ isEnabled: enabled, isHydrated: true });
  },

  setEnabled: async (enabled: boolean) => {
    await SecureStore.setItemAsync(NOTIFICATION_ENABLED_KEY, String(enabled));
    set({ isEnabled: enabled });
  },
}));
