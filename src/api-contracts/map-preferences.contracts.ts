/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/map-preferences.contracts.ts
 * Generated at: 2026-06-08T06:02:53.091Z
 *
 * To regenerate, run: npm run sync:contracts
 */

/**
 * Map Preferences Contracts
 *
 * Per-user, free-form preferences for map display toggles (polygon visibility,
 * zone-number labels, etc.). Stored as JSONB on TBL_USER_APP so new flags can
 * be added without schema migrations.
 */

/** User-specific map display preferences. All fields optional — server fills defaults. */
export interface MapPreferences {
  /** Show marker polygons overlay on the map (default: true) */
  showPolygon?: boolean;
  /** Show zone number labels on the map (default: false) */
  showAreaNumber?: boolean;
}

/** Server-resolved defaults applied whenever a field is missing from the stored value. */
export const MAP_PREFERENCES_DEFAULTS: Required<MapPreferences> = {
  showPolygon: true,
  showAreaNumber: false,
};

export interface GetMapPreferencesResponse {
  data: Required<MapPreferences>;
}

export interface UpdateMapPreferencesRequest extends MapPreferences {}

export interface UpdateMapPreferencesResponse {
  data: Required<MapPreferences>;
}
