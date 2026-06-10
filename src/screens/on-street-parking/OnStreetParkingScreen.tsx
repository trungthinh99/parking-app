import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import { InlineButton } from "@/src/components/InlineButton";

import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Gps } from "iconsax-react-native";

import { PARKING_LOT_DISPLAY_TYPE_LABELS, SCREEN_IDS, type OnStreetSubType, type PolygonCoordinates } from "@/src/api-contracts";
import { PATHS } from "@/constants/Paths";
import { useAppStore } from "@/src/store/app-store";
import { BottomNavBar } from "@/src/components/BottomNavBar";
import { LoadingOverlay } from "@/src/components/LoadingOverlay";
import { Text } from "@/src/components/Text";
import { HeaderIconButton } from "@/src/features/private-parking/HeaderIconButton";
import {
  OnStreetKakaoMap,
  OnStreetKakaoMapRef,
  OnStreetParkingMarker,
  MapBounds,
} from "@/src/features/on-street-parking/OnStreetKakaoMap";
import {
  LegendBottomSheet,
  ON_STREET_LEGEND_DEFAULT_FILTERS,
} from "@/src/features/private-parking/LegendBottomSheet";
import { ZonePickerSheet } from "@/src/components/ZonePickerSheet";
import type { OnStreetLegendKey } from "@/src/features/private-parking/LegendBottomSheet";
import { OnStreetParkingBottomSheet } from "@/src/features/on-street-parking/OnStreetParkingBottomSheet";
import { SearchBar } from "@/src/features/private-parking/SearchBar";
import { SearchOverlay } from "@/src/features/private-parking/SearchOverlay";
import type { KakaoSearchResult } from "@/src/hooks/useKakaoAddressSearch";
import { useCurrentLocation } from "@/src/hooks/useCurrentLocation";
import { useLocationPermission } from "@/src/hooks/useLocationPermission";
import { useLocationTracking } from "@/src/hooks/useLocationTracking";
import { LocationPermissionOverlay } from "@/src/components/LocationPermissionOverlay";
import { useTabBarHeight } from "@/src/hooks/useTabBarHeight";
import { isPointInZoneBoundaries } from "@/src/lib/geo";
import type { SurveyZone } from "@/src/api-contracts";
import { useParkingLotMapData, useUpdateParkingLot } from "@/src/query/hooks/use-parking-lot-queries";
import { useAppToast } from "@/src/hooks/useAppToast";
import { useAppModal } from "@/src/hooks/useAppModal";
import { useSurveyorZoneBoundaries, useSurveyorZones } from "@/src/query/hooks/use-surveyor-queries";
import { useMapPreferences, useUpdateMapPreferences } from "@/src/query/hooks/use-map-preferences-queries";

const KAKAO_MAP_APP_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_APP_KEY ?? "";

/**
 * On-street parking survey page (노상 주차조사)
 * Displays a map with circle markers differentiated by on-street sub-type:
 * - on_street_legal_day: yellow circle (노상합법 주간)
 * - on_street_illegal_day: yellow circle with X (노상불법 주간)
 * - on_street_legal_night: black circle (노상합법 야간)
 * - on_street_illegal_night: black circle with X (노상불법 야간)
 */
export default function OnStreetParkingScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const router = useRouter();
  const mapRef = useRef<OnStreetKakaoMapRef>(null);
  const { getCurrentLocation } = useCurrentLocation();
  const { ensureLocationAccess } = useLocationPermission();

  // Track surveyor GPS location every 30s while this screen is focused
  useLocationTracking({ screenId: SCREEN_IDS.APP_ON_STREET_PARKING });

  const { showToast } = useAppToast();
  const { showModal } = useAppModal();
  const updateParkingLotMutation = useUpdateParkingLot(SCREEN_IDS.APP_ON_STREET_PARKING);

  const [isMapReady, setIsMapReady] = useState(false);
  // Guard so we auto-center on the user's GPS location only once, on first map ready
  const didAutoLocateRef = useRef(false);
  // True when location permission is denied or location services are off —
  // shows a full-screen overlay covering the map and search bar
  const [locationDenied, setLocationDenied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarker, setSelectedMarker] = useState<OnStreetParkingMarker | null>(null);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Address search mode: when true, SearchOverlay fills the form address field instead of moving the map
  const [isAddressSearchMode, setIsAddressSearchMode] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const addressSetterRef = useRef<((address: string, lat: number, lng: number) => void) | null>(
    null
  );

  // Legend filter state — determines which on-street sub-type markers are visible
  const [legendFilters, setLegendFilters] = useState<Record<OnStreetLegendKey, boolean>>({
    ...ON_STREET_LEGEND_DEFAULT_FILTERS,
  });

  // Load persisted map preferences (per-user, server-side).
  // Server seeds defaults: showPolygon=true, showAreaNumber=false.
  const { data: mapPrefs } = useMapPreferences(SCREEN_IDS.APP_ON_STREET_PARKING);
  const updateMapPrefs = useUpdateMapPreferences(SCREEN_IDS.APP_ON_STREET_PARKING);

  // Zone number labels visibility
  const [showAreaNumber, setShowAreaNumber] = useState(false);

  // Marker polygon visibility (toggled from filter bottom sheet)
  const [showPolygon, setShowPolygon] = useState(true);

  // Hydrate local state + canvas from server-side preferences on first load.
  // Run once when mapPrefs arrives so later local toggles aren't overwritten.
  const prefsHydratedRef = useRef(false);
  useEffect(() => {
    if (!mapPrefs?.data || prefsHydratedRef.current) return;
    prefsHydratedRef.current = true;
    setShowAreaNumber(mapPrefs.data.showAreaNumber);
    setShowPolygon(mapPrefs.data.showPolygon);
    if (isMapReady) {
      mapRef.current?.setZoneLabelsVisible(mapPrefs.data.showAreaNumber);
      mapRef.current?.setPolygonsVisible(mapPrefs.data.showPolygon);
    }
  }, [mapPrefs, isMapReady]);

  // Zone filter selection
  const [selectedZoneId, setSelectedZoneId] = useState("");

  // Fetch parking lot data via viewport-based loading (on_street type)
  const { data: parkingLotData, isLoading } = useParkingLotMapData(
    "on_street",
    bounds,
    SCREEN_IDS.APP_ON_STREET_PARKING
  );

  // Fetch zone boundary polygons for validating new marker placement
  const { data: zoneBoundariesData } = useSurveyorZoneBoundaries(SCREEN_IDS.APP_ON_STREET_PARKING);

  // Fetch assigned survey zones for zone filter dropdown
  const { data: surveyZonesData } = useSurveyorZones(SCREEN_IDS.APP_ON_STREET_PARKING);

  // Track locally updated sub-types so marker style changes are reflected immediately (draft + final)
  const [localUpdatedSubTypes, setLocalUpdatedSubTypes] = useState<
    Map<string, OnStreetSubType>
  >(new Map());

  // Track markers that have been finalized (저장 및 완료) — these become read-only
  const [localCompletedIds, setLocalCompletedIds] = useState<Set<string>>(new Set());

  // Track locally markers created via app, keyed by ID with full marker data
  const [localCreatedMarkers, setLocalCreatedMarkers] = useState<
    Map<string, OnStreetParkingMarker>
  >(new Map());

  // Track polygon edits made locally so API refetch (viewport change, 30s interval) cannot
  // momentarily wipe a polygon that was just saved/deleted before the API has confirmed it.
  // Value `null` means "deleted locally" — suppress any polygon the API still returns for that id.
  const [localMarkerPolygons, setLocalMarkerPolygons] = useState<
    Map<string, PolygonCoordinates | null>
  >(new Map());

  // Remove locally created markers once they appear in API response
  useEffect(() => {
    if (!parkingLotData?.data || localCreatedMarkers.size === 0) return;
    const apiIds = new Set(parkingLotData.data.map((lot) => String(lot.id)));
    const idsToRemove = Array.from(localCreatedMarkers.keys()).filter((id) => apiIds.has(id));
    if (idsToRemove.length > 0) {
      setLocalCreatedMarkers((prev) => {
        const next = new Map(prev);
        for (const id of idsToRemove) next.delete(id);
        return next;
      });
    }
  }, [parkingLotData, localCreatedMarkers]);

  // Drop local polygon overrides once API response agrees (save) or confirms deletion.
  useEffect(() => {
    if (!parkingLotData?.data || localMarkerPolygons.size === 0) return;
    const byId = new Map<string, PolygonCoordinates | null>();
    for (const lot of parkingLotData.data) {
      byId.set(String(lot.id), lot.polygonCoordinates ?? null);
    }
    const idsToClear: string[] = [];
    for (const [id, local] of localMarkerPolygons) {
      if (!byId.has(id)) continue; // lot not in current viewport — keep override
      const remote = byId.get(id) ?? null;
      if (local === null && remote === null) idsToClear.push(id);
      else if (local && remote && JSON.stringify(local) === JSON.stringify(remote)) idsToClear.push(id);
    }
    if (idsToClear.length > 0) {
      setLocalMarkerPolygons((prev) => {
        const next = new Map(prev);
        for (const id of idsToClear) next.delete(id);
        return next;
      });
    }
  }, [parkingLotData, localMarkerPolygons]);

  // Convert API data to map markers — apply local sub-type overrides for immediate style changes
  const markers = useMemo<OnStreetParkingMarker[]>(() => {
    const apiMarkers: OnStreetParkingMarker[] = (parkingLotData?.data ?? []).map((lot) => {
      const subType = localUpdatedSubTypes.get(String(lot.id)) ?? (lot.parkingType as OnStreetSubType);
      return {
        id: String(lot.id),
        lat: lot.lat,
        lng: lot.lng,
        type: "completed" as const,
        label: PARKING_LOT_DISPLAY_TYPE_LABELS[subType],
        mode: "existing" as const,
        onStreetSubType: subType,
        isUpdated: lot.isUpdated || localCompletedIds.has(String(lot.id)),
        isConfirmed: lot.isConfirmed || localCompletedIds.has(String(lot.id)),
      };
    });

    // Append locally created markers not yet present in API response
    const apiIds = new Set(apiMarkers.map((m) => m.id));
    const polygons = zoneBoundariesData?.data ?? [];
    const pendingMarkers = Array.from(localCreatedMarkers.values()).filter(
      (m) =>
        !apiIds.has(m.id) &&
        (polygons.length === 0 || isPointInZoneBoundaries(m.lat, m.lng, polygons))
    );

    return [...apiMarkers, ...pendingMarkers];
  }, [parkingLotData, localCreatedMarkers, zoneBoundariesData, localUpdatedSubTypes, localCompletedIds]);

  // Apply legend filters by on-street sub-type
  const filteredMarkers = useMemo<OnStreetParkingMarker[]>(() => {
    return markers.filter((m) => {
      const subType = (m.onStreetSubType || "on_street_legal_day") as OnStreetLegendKey;
      return legendFilters[subType] ?? true;
    });
  }, [markers, legendFilters]);

  // Push zone boundary polygons to WebView when data or map readiness changes.
  // Shorten displayName to just the trailing number (e.g. "서울특별시 강동구 3" → "3")
  const zonePolygons = useMemo(() => {
    return (zoneBoundariesData?.data ?? []).map((p) => {
      const numMatch = p.displayName?.match(/(\d+)\s*$/);
      return { ...p, displayName: numMatch ? numMatch[1] : (p.displayName ?? "") };
    });
  }, [zoneBoundariesData]);
  useEffect(() => {
    if (isMapReady) {
      mapRef.current?.setZonePolygons(zonePolygons);
    }
  }, [isMapReady, zonePolygons]);

  // Push filtered markers to WebView when data or map readiness changes
  useEffect(() => {
    if (isMapReady) {
      mapRef.current?.setMarkers(filteredMarkers);
    }
  }, [isMapReady, filteredMarkers]);

  // Re-push markers and zone polygons when screen regains focus
  useFocusEffect(
    useCallback(() => {
      if (isMapReady) {
        mapRef.current?.setZonePolygons(zonePolygons);
        mapRef.current?.setMarkers(filteredMarkers);
      }
    }, [isMapReady, filteredMarkers, zonePolygons])
  );

  // Consume pending focus marker (set by survey zone management screen)
  const pendingFocusMarker = useAppStore((s) => s.pendingFocusMarker);
  const setPendingFocusMarker = useAppStore((s) => s.setPendingFocusMarker);
  useFocusEffect(
    useCallback(() => {
      if (!isMapReady || !pendingFocusMarker) return;
      const { id, lat, lng, onStreetSubType, isCompleted } = pendingFocusMarker;
      setPendingFocusMarker(null);
      const screenH = Dimensions.get("window").height;
      mapRef.current?.moveToLocationWithOffset(lat, lng, Math.round(screenH * 0.2));
      mapRef.current?.selectMarkerAt(String(id), lat, lng, onStreetSubType);
      const marker: OnStreetParkingMarker = {
        id: String(id),
        lat,
        lng,
        type: "completed",
        mode: "existing",
        onStreetSubType,
        isUpdated: isCompleted,
        isConfirmed: isCompleted,
      };
      setSelectedMarker(marker);
    }, [isMapReady, pendingFocusMarker, setPendingFocusMarker])
  );

  // Re-check location access whenever the screen regains focus while the denied
  // overlay is showing — so it auto-dismisses after the user grants permission
  // (e.g. returning from the device Settings) and then centers on their location.
  useFocusEffect(
    useCallback(() => {
      if (!locationDenied) return;
      void (async () => {
        const granted = await ensureLocationAccess();
        if (!granted) return;
        setLocationDenied(false);
        const location = await getCurrentLocation();
        if (location) {
          mapRef.current?.moveToLocationWithOffset(location.lat, location.lng, 0);
        }
      })();
    }, [locationDenied, ensureLocationAccess, getCurrentLocation])
  );

  // Handle viewport bounds change from map
  const handleBoundsChanged = useCallback((newBounds: MapBounds) => {
    setBounds(newBounds);
  }, []);

  // Open search overlay when tapping search bar
  const handleSearchBarPress = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  // Close search overlay and return to map (or form if in address search mode)
  const handleSearchBack = useCallback(() => {
    setIsSearchOpen(false);
    setIsAddressSearchMode(false);
    setAddressSearchQuery("");
  }, []);

  // Handle search result selection - move map to selected location and place search marker
  // Uses moveToLocationWithOffset (offset 0) so the map auto-zooms in when zoomed out too far
  const handleSelectResult = useCallback((result: KakaoSearchResult) => {
    const address = result.roadAddress || result.jibunAddress;
    setSearchQuery(address);
    setIsSearchOpen(false);
    mapRef.current?.moveToLocationWithOffset(result.lat, result.lng, 0);
    mapRef.current?.setSearchMarker(result.lat, result.lng, address);
  }, []);

  // Handle search marker close button press
  const handleSearchMarkerClose = useCallback(() => {
    setSearchQuery("");
  }, []);

  // Open address search overlay from the form's address field
  const handleAddressSearchPress = useCallback(() => {
    setAddressSearchQuery("");
    setIsAddressSearchMode(true);
    setIsSearchOpen(true);
  }, []);

  // Handle address search result - validate zone + duplicate, fill form address + GPS, and return to bottom sheet
  const handleAddressSelectResult = useCallback(
    (result: KakaoSearchResult) => {
      setIsSearchOpen(false);
      setIsAddressSearchMode(false);
      setAddressSearchQuery("");

      // Check if address already exists in survey list (~30m radius)
      const THRESHOLD = 0.0003; // ~30m in degrees
      const isDuplicate = markers.some(
        (m) =>
          m.id !== selectedMarker?.id &&
          Math.abs(m.lat - result.lat) < THRESHOLD &&
          Math.abs(m.lng - result.lng) < THRESHOLD
      );
      if (isDuplicate) {
        showToast({ message: "이 주소는 이미 조사 목록에 있습니다", type: "error" });
        return;
      }

      const polygons = zoneBoundariesData?.data ?? [];
      if (polygons.length === 0 || !isPointInZoneBoundaries(result.lat, result.lng, polygons)) {
        showToast({ message: "선택하신 주소는 담당 조사 구역을 벗어납니다", type: "error" });
        return;
      }
      const address = result.roadAddress || result.jibunAddress;
      addressSetterRef.current?.(address, result.lat, result.lng);
    },
    [zoneBoundariesData, showToast, markers, selectedMarker?.id]
  );

  // Handle marker location change after save (address was changed via search)
  // Moves the marker on the map and pans the camera to the new location
  const handleMarkerLocationChange = useCallback((_markerId: string, lat: number, lng: number) => {
    setSelectedMarker((prev) => (prev ? { ...prev, lat, lng } : prev));
    mapRef.current?.moveToLocation(lat, lng);
  }, []);

  // Handle successful save — update marker sub-type locally if it changed (day/night or legal/illegal)
  const handleSaveSuccess = useCallback((markerId: string, hasChanges: boolean, newSubType?: OnStreetSubType, isDraft?: boolean) => {
    if (newSubType) {
      setLocalUpdatedSubTypes((prev) => {
        const next = new Map(prev);
        next.set(markerId, newSubType);
        return next;
      });
      // Update the active marker visual on the canvas immediately
      mapRef.current?.updateSelectedMarkerSubType(newSubType);
    }
    if (!isDraft) {
      // Final save: mark as confirmed (read-only), only set isUpdated if data actually changed
      setLocalCompletedIds((prev) => new Set(prev).add(markerId));
      setSelectedMarker((prev) =>
        prev ? { ...prev, onStreetSubType: newSubType ?? prev.onStreetSubType, isConfirmed: true, isUpdated: hasChanges || prev.isUpdated } : prev
      );
    } else if (newSubType) {
      // Draft save: only update sub-type visual, keep editable
      setSelectedMarker((prev) =>
        prev ? { ...prev, onStreetSubType: newSubType } : prev
      );
    }
  }, []);

  // Handle marker press — center marker in top half of screen (same as navigating from survey list)
  const handleMarkerPress = useCallback(
    (marker: OnStreetParkingMarker) => {
      const screenH = Dimensions.get("window").height;
      mapRef.current?.moveToLocationWithOffset(marker.lat, marker.lng, Math.round(screenH * 0.2));
      mapRef.current?.selectMarkerAt(String(marker.id), marker.lat, marker.lng, marker.onStreetSubType);
      setSelectedMarker(marker);
    },
    []
  );

  // Handle bottom sheet close - deselect marker, reset, and re-push markers to force redraw
  const handleBottomSheetClose = useCallback(() => {
    mapRef.current?.deselectMarker();
    mapRef.current?.clearNewMarker();
    setSelectedMarker(null);
    // Force redraw: canvas may have been skipped while bottom sheet was covering the map
    mapRef.current?.setMarkers(filteredMarkers);
  }, [filteredMarkers]);

  // ── Polygon drawing mode ──
  const [isPolygonDrawingMode, setIsPolygonDrawingMode] = useState(false);
  const [polygonDrawingMarkerId, setPolygonDrawingMarkerId] = useState<string | null>(null);

  // Build polygon map from API data, overlaying local polygon edits so a freshly saved/deleted
  // polygon survives viewport refetches that haven't yet observed the mutation. Declared
  // before the polygon-save handler so the handler can re-push it when rejecting a draw.
  const markerPolygonMap = useMemo(() => {
    const map: Record<string, PolygonCoordinates> = {};
    for (const lot of parkingLotData?.data ?? []) {
      if (lot.polygonCoordinates) {
        map[String(lot.id)] = lot.polygonCoordinates;
      }
    }
    for (const [id, poly] of localMarkerPolygons) {
      if (poly === null) delete map[id];
      else map[id] = poly;
    }
    return map;
  }, [parkingLotData, localMarkerPolygons]);

  const handlePolygonDrawingStarted = useCallback((markerId: string) => {
    setIsPolygonDrawingMode(true);
    setPolygonDrawingMarkerId(markerId);
  }, []);

  const handlePolygonDrawingCancelled = useCallback(() => {
    setIsPolygonDrawingMode(false);
    setPolygonDrawingMarkerId(null);
  }, []);

  const handlePolygonDelete = useCallback((markerId: string) => {
    setIsPolygonDrawingMode(false);
    setPolygonDrawingMarkerId(null);
    // Remember the delete locally so an in-flight viewport refetch cannot re-render the
    // stale polygon while the mutation is round-tripping.
    setLocalMarkerPolygons((prev) => {
      const next = new Map(prev);
      next.set(markerId, null);
      return next;
    });
    updateParkingLotMutation.mutate(
      { id: Number(markerId), data: { polygonCoordinates: null, isDraft: true, skipStatusFlags: true } },
      {
        onSuccess: () => {
          showToast({ message: "폴리곤이 삭제되었습니다.", type: "success" });
        },
        onError: () => {
          showToast({ message: "폴리곤 삭제에 실패했습니다.", type: "error" });
          // Roll back the local suppression on failure so UI matches server state.
          setLocalMarkerPolygons((prev) => {
            const next = new Map(prev);
            next.delete(markerId);
            return next;
          });
        },
      }
    );
  }, [updateParkingLotMutation, showToast]);

  const handlePolygonSave = useCallback((markerId: string, polygonData: PolygonCoordinates) => {
    // Reject polygons whose centroid falls outside the surveyor's assigned zone boundaries.
    // Mirrors the marker-creation rule used by the private/off-street maps so polygons cannot
    // be drawn around areas the surveyor is not allowed to cover.
    const polygons = zoneBoundariesData?.data ?? [];
    const corners = polygonData.corners;
    const centerLat = corners.reduce((sum, [lat]) => sum + lat, 0) / corners.length;
    const centerLng = corners.reduce((sum, [, lng]) => sum + lng, 0) / corners.length;
    if (polygons.length === 0 || !isPointInZoneBoundaries(centerLat, centerLng, polygons)) {
      // The WebView already cleared its drawing state and stashed the new polygon into its
      // local map before posting `polygonSave`. Re-push the authoritative polygon map so the
      // rejected polygon is wiped from the canvas, and re-enter drawing mode so the user can
      // adjust without having to tap the draw button again.
      mapRef.current?.setMarkerPolygons(markerPolygonMap);
      mapRef.current?.startPolygonDrawing(markerId);
      showModal({
        title: "알림",
        message: "이 지역에서는 조작할 수 없습니다.",
        buttons: [{ text: "확인" }],
      });
      return;
    }

    setIsPolygonDrawingMode(false);
    // Persist the just-saved polygon locally so viewport refetches (which may not yet include
    // the new coordinates from the API) cannot flash/erase it off the canvas.
    setLocalMarkerPolygons((prev) => {
      const next = new Map(prev);
      next.set(markerId, polygonData);
      return next;
    });
    updateParkingLotMutation.mutate(
      { id: Number(markerId), data: { polygonCoordinates: polygonData, isDraft: true, skipStatusFlags: true } },
      {
        onSuccess: () => {
          showToast({ message: "폴리곤이 저장되었습니다.", type: "success" });
        },
        onError: () => {
          showToast({ message: "폴리곤 저장에 실패했습니다.", type: "error" });
          setLocalMarkerPolygons((prev) => {
            const next = new Map(prev);
            next.delete(markerId);
            return next;
          });
        },
      }
    );
  }, [updateParkingLotMutation, showToast, zoneBoundariesData, markerPolygonMap, showModal]);

  useEffect(() => {
    if (!isMapReady) return;
    // Don't push an empty/placeholder polygon map while the viewport query has no data yet —
    // that would momentarily wipe polygons off the canvas between refetches.
    if (!parkingLotData?.data && localMarkerPolygons.size === 0) return;
    mapRef.current?.setMarkerPolygons(markerPolygonMap);
  }, [isMapReady, markerPolygonMap, parkingLotData, localMarkerPolygons]);

  // Handle GPS button press - get location via expo-location and move map
  const handleGpsPress = useCallback(async () => {
    const location = await getCurrentLocation();
    if (location) {
      mapRef.current?.moveToLocation(location.lat, location.lng);
    }
  }, [getCurrentLocation]);

  // Handle map ready - hide loading overlay and auto-center on the user's GPS location once.
  // If location permission is denied (or services are off), show a full-screen overlay
  // instead of the map; otherwise center+zoom on the user's current position.
  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
    if (didAutoLocateRef.current) return;
    didAutoLocateRef.current = true;
    void (async () => {
      const granted = await ensureLocationAccess();
      if (!granted) {
        setLocationDenied(true);
        return;
      }
      setLocationDenied(false);
      const location = await getCurrentLocation();
      if (location) {
        // Use offset variant (offset 0) so the map auto-zooms in from the far
        // initial zoom level instead of just panning while still zoomed out.
        mapRef.current?.moveToLocationWithOffset(location.lat, location.lng, 0);
      }
    })();
  }, [ensureLocationAccess, getCurrentLocation]);

  // Handle location received from map
  const handleLocationReceived = useCallback((lat: number, lng: number) => {
    mapRef.current?.moveToLocation(lat, lng);
  }, []);

  // Navigate to survey zone management screen
  const handleClipboardPress = useCallback(() => {
    router.push(PATHS.TABS.ON_STREET_SURVEY_ZONE as never);
  }, [router]);

  // Legend bottom sheet state
  const [legendSheetVisible, setLegendSheetVisible] = useState(false);

  // Zone picker sheet state (rendered at screen level to avoid overlay conflicts)
  const [zonePickerVisible, setZonePickerVisible] = useState(false);
  const [pendingZoneId, setPendingZoneId] = useState(selectedZoneId);

  // Handle filter button press
  const handleFilterPress = useCallback(() => {
    setPendingZoneId(selectedZoneId);
    setLegendSheetVisible(true);
  }, [selectedZoneId]);

  // Handle on-street legend search - apply sub-type filters to markers
  const handleLegendSearch = useCallback((filters: Record<OnStreetLegendKey, boolean>) => {
    setLegendFilters(filters);
  }, []);

  // Handle zone number label toggle
  // Persist to server only when the value actually changed vs current cache —
  // avoids an unnecessary PATCH every time the user presses 검색 without touching it.
  const handleShowAreaNumberChange = useCallback((value: boolean) => {
    setShowAreaNumber(value);
    mapRef.current?.setZoneLabelsVisible(value);
    if (mapPrefs?.data.showAreaNumber !== value) {
      updateMapPrefs.mutate({ showAreaNumber: value });
    }
  }, [mapPrefs, updateMapPrefs]);

  // Handle marker polygon visibility toggle
  const handleShowPolygonChange = useCallback((value: boolean) => {
    setShowPolygon(value);
    mapRef.current?.setPolygonsVisible(value);
    if (mapPrefs?.data.showPolygon !== value) {
      updateMapPrefs.mutate({ showPolygon: value });
    }
  }, [mapPrefs, updateMapPrefs]);

  // Handle zone selection from legend filter
  const handleZoneSelect = useCallback((zone: SurveyZone | null) => {
    setSelectedZoneId(zone?.featureId ?? "");
    if (!zone) return;
    const match = zoneBoundariesData?.data?.find(
      (p) => p.displayName === zone.displayName
    );
    if (match?.bbox) {
      mapRef.current?.fitBounds(match.bbox.minLat, match.bbox.minLng, match.bbox.maxLat, match.bbox.maxLng);
    }
  }, [zoneBoundariesData]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Map layer with circle markers */}
      <OnStreetKakaoMap
        ref={mapRef}
        appKey={KAKAO_MAP_APP_KEY}
        initialLat={37.5665}
        initialLng={126.978}
        initialZoom={4}
        markers={[]}
        onMarkerPress={handleMarkerPress}
        onMapReady={handleMapReady}
        onLocationReceived={handleLocationReceived}
        onBoundsChanged={handleBoundsChanged}
        onSearchMarkerClose={handleSearchMarkerClose}
        onPolygonDrawingStarted={handlePolygonDrawingStarted}
        onPolygonDrawingCancelled={handlePolygonDrawingCancelled}
        onPolygonSave={handlePolygonSave}
        onPolygonDelete={handlePolygonDelete}
        style={styles.map}
      />

      {/* Loading overlay - shown until map is ready, while data is loading,
          or while a polygon save/delete mutation is in flight */}
      {(!isMapReady || (isLoading && !parkingLotData) || updateParkingLotMutation.isPending) && (
        <View style={[StyleSheet.absoluteFillObject, { bottom: tabBarHeight, zIndex: 999 }]}>
          <LoadingOverlay visible />
        </View>
      )}

      {/* Default header overlay (visible when no bottom sheet and search is closed) */}
      {!selectedMarker && !isSearchOpen && (
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.searchRow}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmit={handleSearchBarPress}
              onPress={handleSearchBarPress}
              style={styles.searchBar}
            />
            <HeaderIconButton icon="clipboard" onPress={handleClipboardPress} />
            <HeaderIconButton icon="filter" onPress={handleFilterPress} />
            <HeaderIconButton icon="notification" onPress={() => {}} />
          </View>
        </View>
      )}

      {/* GPS button - floating */}
      {!isSearchOpen && !selectedMarker && (
        <TouchableOpacity
          style={[styles.gpsBtn, { bottom: tabBarHeight + 16 }]}
          onPress={handleGpsPress}
          activeOpacity={0.85}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Gps size={22} color="#151515" variant="Linear" />
        </TouchableOpacity>
      )}

      {/* Polygon drawing mode hint - shown at top center (below header) */}
      {isPolygonDrawingMode && (
        <View style={[styles.polygonHintCenter, { top: insets.top + 16 }]} pointerEvents="none">
          <View style={styles.polygonHintToast}>
            <Text style={styles.polygonHintText}>이 위치의 주차 구역을 그리세요.</Text>
          </View>
        </View>
      )}

      {/* Action buttons — shown at bottom center during polygon drawing mode, above nav bar.
          - When a saved polygon already exists for the marker: show 저장 + 삭제.
          - When no polygon exists yet: show 저장 + 취소 so the user can back out of an
            accidental tooltip tap without persisting anything. */}
      {isPolygonDrawingMode && (
        <View style={[styles.polygonActionBtnWrapper, { bottom: tabBarHeight + 20 }]}>
          {polygonDrawingMarkerId && markerPolygonMap[polygonDrawingMarkerId] ? (
            <>
              <InlineButton
                title="삭제"
                size="md"
                style={{ ...styles.polygonDeleteBtn, ...styles.polygonSaveBtn }}
                onPress={() => mapRef.current?.deletePolygonDrawing()}
              />
              <InlineButton
                title="저장"
                variant="primary"
                size="md"
                style={styles.polygonSaveBtn}
                onPress={() => mapRef.current?.savePolygonDrawing()}
              />
            </>
          ) : (
            <>
              <InlineButton
                title="취소"
                variant="secondary"
                size="md"
                style={styles.polygonSaveBtn}
                onPress={() => mapRef.current?.cancelPolygonDrawing()}
              />
              <InlineButton
                title="저장"
                variant="primary"
                size="md"
                style={styles.polygonSaveBtn}
                onPress={() => mapRef.current?.savePolygonDrawing()}
              />
            </>
          )}
        </View>
      )}

      {/* Bottom sheet with integrated header — hidden during polygon drawing */}
      {!isPolygonDrawingMode && <OnStreetParkingBottomSheet
        marker={selectedMarker}
        onClose={handleBottomSheetClose}
        onSaveSuccess={handleSaveSuccess}
        onCreateSuccess={(newId: string, lat: number, lng: number, onStreetSubType?: string) => {
          mapRef.current?.clearNewMarker();
          setLocalCreatedMarkers((prev) => {
            const next = new Map(prev);
            next.set(newId, {
              id: newId,
              lat,
              lng,
              type: "completed",
              mode: "existing",
              onStreetSubType,
            });
            return next;
          });
          setSelectedMarker(null);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchBarPress={handleSearchBarPress}
        onFilterPress={handleFilterPress}
        onClipboardPress={handleClipboardPress}
        onDrawPolygonPress={
          selectedMarker
            ? () => mapRef.current?.startPolygonDrawing(selectedMarker.id)
            : undefined
        }
        onAddressSearchPress={handleAddressSearchPress}
        onAddressSearchRef={(setter) => {
          addressSetterRef.current = setter;
        }}
        onMarkerLocationChange={handleMarkerLocationChange}
        screenId={SCREEN_IDS.APP_ON_STREET_PARKING}
      />}

      {/* Lift the nav bar above the permission overlay so its top shadow stays
          visible (and it remains tappable) while the overlay covers the map. */}
      <View style={[styles.navBarWrapper, locationDenied && { zIndex: 1001 }]}>
        <BottomNavBar />
      </View>

      {/* Legend bottom sheet - on-street parking tab */}
      <LegendBottomSheet
        visible={legendSheetVisible}
        onClose={() => setLegendSheetVisible(false)}
        onSearchOnStreet={handleLegendSearch}
        parkingTab="onStreet"
        showAreaNumber={showAreaNumber}
        onShowAreaNumberChange={handleShowAreaNumberChange}
        showPolygon={showPolygon}
        onShowPolygonChange={handleShowPolygonChange}
        surveyZones={surveyZonesData?.data ?? []}
        selectedZoneId={pendingZoneId}
        onZoneSelect={handleZoneSelect}
        onOpenZonePicker={() => setZonePickerVisible(true)}
      />

      {/* Zone picker sheet - rendered at screen level so its overlay covers everything */}
      <ZonePickerSheet
        visible={zonePickerVisible}
        zones={surveyZonesData?.data ?? []}
        selectedId={pendingZoneId}
        onSelect={(id) => {
          setPendingZoneId(id);
          setZonePickerVisible(false);
        }}
        onClose={() => setZonePickerVisible(false)}
      />

      {/* Search overlay - fullscreen search with animated transition */}
      <SearchOverlay
        visible={isSearchOpen}
        searchQuery={isAddressSearchMode ? addressSearchQuery : searchQuery}
        onSearchChange={isAddressSearchMode ? setAddressSearchQuery : setSearchQuery}
        onBack={handleSearchBack}
        onGpsPress={handleGpsPress}
        onSelectResult={isAddressSearchMode ? handleAddressSelectResult : handleSelectResult}
      />

      {/* Location permission overlay - covers the whole map and search bar when
          location access is denied (keeps the bottom nav bar usable) */}
      {locationDenied && (
        <View style={[StyleSheet.absoluteFillObject, { bottom: tabBarHeight, zIndex: 1000 }]}>
          <LocationPermissionOverlay visible />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navBarWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchBar: {
    flex: 1,
  },
  gpsBtn: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 20,
  },
  polygonActionBtnWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    zIndex: 30,
  },
  polygonSaveBtn: {
    minWidth: 120,
  },
  polygonDeleteBtn: {
    backgroundColor: "#E53935",
    borderColor: "#E53935",
    borderWidth: 1.5,
  },
  polygonHintCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 30,
  },
  polygonHintToast: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  polygonHintText: {
    color: "#333333",
    fontSize: 14,
    fontWeight: "500",
  },
});
