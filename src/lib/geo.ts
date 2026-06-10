import type { ZoneBoundaryPolygon } from "@/src/api-contracts";

/**
 * Ray-casting point-in-polygon test.
 * Coordinates use [lng, lat] format (GeoJSON standard).
 */
function pointInPolygon(lng: number, lat: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Check if a point (lat, lng) falls within any of the given zone boundary polygons.
 * Uses bounding box pre-check for performance before running ray-casting.
 */
export function isPointInZoneBoundaries(
  lat: number,
  lng: number,
  polygons: ZoneBoundaryPolygon[],
): boolean {
  for (const polygon of polygons) {
    // Quick bounding box check
    if (
      lat < polygon.bbox.minLat ||
      lat > polygon.bbox.maxLat ||
      lng < polygon.bbox.minLng ||
      lng > polygon.bbox.maxLng
    ) {
      continue;
    }
    // Precise point-in-polygon test
    if (pointInPolygon(lng, lat, polygon.coords)) {
      return true;
    }
  }
  return false;
}

/**
 * Find the zone code (조사구역 number, e.g. "13") for a point that falls inside one of the
 * surveyor's assigned zone polygons. Mirrors the backend's deriveSurveyAreaFromPoint logic
 * so the UI can pre-fill `uniqueNumber1` before the lot is saved.
 *
 * Polygons carry `displayName` like "금천구 13" — the trailing token is the zone code that
 * the backend persists in `parking_lot.SURVEY_AREA`. When a point hits multiple overlapping
 * polygons, the smallest one wins (most specific match).
 */
export function findZoneCodeForPoint(
  lat: number,
  lng: number,
  polygons: ZoneBoundaryPolygon[],
): string | null {
  let bestDisplayName: string | undefined;
  let bestArea = Infinity;

  for (const polygon of polygons) {
    if (
      lat < polygon.bbox.minLat ||
      lat > polygon.bbox.maxLat ||
      lng < polygon.bbox.minLng ||
      lng > polygon.bbox.maxLng
    ) {
      continue;
    }
    if (!pointInPolygon(lng, lat, polygon.coords)) continue;

    // Use bbox area as a cheap proxy for polygon size — picks the most specific zone
    const area =
      (polygon.bbox.maxLat - polygon.bbox.minLat) *
      (polygon.bbox.maxLng - polygon.bbox.minLng);
    if (area < bestArea) {
      bestArea = area;
      bestDisplayName = polygon.displayName;
    }
  }

  if (!bestDisplayName) return null;
  // displayName format: "{region} {zoneCode}" — backend stores only the zoneCode
  const lastSpace = bestDisplayName.lastIndexOf(" ");
  return lastSpace >= 0 ? bestDisplayName.slice(lastSpace + 1) : bestDisplayName;
}
