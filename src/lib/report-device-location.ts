import * as Location from "expo-location";
import { updateDeviceLocation } from "@/src/api/auth";

const KAKAO_REST_API_KEY =
  process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY ?? process.env.EXPO_PUBLIC_KAKAO_MAP_APP_KEY ?? "";

/**
 * Get current GPS position, reverse-geocode via Kakao, and report to server.
 * Runs silently — never throws. Safe to call fire-and-forget.
 */
export async function reportDeviceLocation(): Promise<void> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = loc.coords;

    const res = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${longitude}&y=${latitude}`,
      { headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` } }
    );
    const data = await res.json();

    const doc = data.documents?.[0];
    const address =
      doc?.road_address?.address_name ??
      doc?.address?.address_name ??
      "알 수 없는 위치";

    await updateDeviceLocation({ latitude, longitude, address });
  } catch {
    // Silently fail — location reporting is best-effort
  }
}
