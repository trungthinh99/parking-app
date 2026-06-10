import { useCallback, useRef } from "react";
import * as Location from "expo-location";

import { useAppModal } from "@/src/hooks/useAppModal";

/**
 * Hook that provides a function to get the device's current GPS location.
 * Handles permission requests via expo-location at the native layer.
 * Returns null if permission is denied or location unavailable.
 */
export function useCurrentLocation() {
  const { showModal } = useAppModal();
  const permissionGranted = useRef<boolean | null>(null);

  const getCurrentLocation = useCallback(async (): Promise<{
    lat: number;
    lng: number;
  } | null> => {
    // Request permission if not yet determined
    if (permissionGranted.current !== true) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      permissionGranted.current = status === "granted";
    }

    if (!permissionGranted.current) {
      showModal({
        title: "알림",
        message: "위치 권한이 필요합니다. 설정에서 위치 권한을 허용해주세요.",
        buttons: [{ text: "확인" }],
      });
      return null;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } catch {
      showModal({
        title: "알림",
        message: "현재 위치를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.",
        buttons: [{ text: "확인" }],
      });
      return null;
    }
  }, [showModal]);

  return { getCurrentLocation };
}
