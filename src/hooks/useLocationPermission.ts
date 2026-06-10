import { useCallback } from "react";
import * as Location from "expo-location";

/**
 * Hook that checks whether the app has foreground location permission AND
 * location services are enabled on the device.
 *
 * Unlike useCurrentLocation, this does NOT show any modal — the caller decides
 * how to surface a denied state (e.g. a full-screen overlay on the map screens).
 *
 * ensureLocationAccess() requests the permission if it hasn't been determined yet,
 * then returns true only when access is fully usable for showing the user's position.
 */
export function useLocationPermission() {
  const ensureLocationAccess = useCallback(async (): Promise<boolean> => {
    // Request permission if not yet determined (no-op if already granted/denied)
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status === "undetermined") {
      ({ status } = await Location.requestForegroundPermissionsAsync());
    }
    if (status !== "granted") {
      return false;
    }

    // Permission granted, but the device location services may still be off
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    return servicesEnabled;
  }, []);

  return { ensureLocationAccess };
}
