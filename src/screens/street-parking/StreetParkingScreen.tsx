import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Add, Gps } from "iconsax-react-native";
import IconCloseRed from "@/src/assets/images/icons/icon-close-red-28.svg";

import { PARKING_LOT_DISPLAY_TYPE_LABELS, SCREEN_IDS } from "@/src/api-contracts";
import { PATHS } from "@/constants/Paths";
import { useAppStore } from "@/src/store/app-store";
import { BottomNavBar } from "@/src/components/BottomNavBar";
import { LoadingOverlay } from "@/src/components/LoadingOverlay";
import { Text } from "@/src/components/Text";
import { HeaderIconButton } from "@/src/features/private-parking/HeaderIconButton";
import { useAppModal } from "@/src/hooks/useAppModal";
import { useAppToast } from "@/src/hooks/useAppToast";
import {
  StreetKakaoMap,
  StreetKakaoMapRef,
  StreetParkingMarker,
  MapBounds,
} from "@/src/features/street-parking/StreetKakaoMap";
import {
  LegendBottomSheet,
  LEGEND_DEFAULT_FILTERS,
} from "@/src/features/private-parking/LegendBottomSheet";
import { ZonePickerSheet } from "@/src/components/ZonePickerSheet";
import type { LegendKey } from "@/src/features/private-parking/LegendBottomSheet";
import { StreetParkingBottomSheet } from "@/src/features/street-parking/StreetParkingBottomSheet";
import { SearchBar } from "@/src/features/private-parking/SearchBar";
import { SearchOverlay } from "@/src/features/private-parking/SearchOverlay";
import type { KakaoSearchResult } from "@/src/hooks/useKakaoAddressSearch";
import { useCurrentLocation } from "@/src/hooks/useCurrentLocation";
import { useLocationPermission } from "@/src/hooks/useLocationPermission";
import { useLocationTracking } from "@/src/hooks/useLocationTracking";
import { LocationPermissionOverlay } from "@/src/components/LocationPermissionOverlay";
import { useTabBarHeight } from "@/src/hooks/useTabBarHeight";
import { findZoneCodeForPoint, isPointInZoneBoundaries } from "@/src/lib/geo";
import type { SurveyZone } from "@/src/api-contracts";
import { useParkingLotMapData } from "@/src/query/hooks/use-parking-lot-queries";
import { useSurveyorZoneBoundaries, useSurveyorZones } from "@/src/query/hooks/use-surveyor-queries";

const KAKAO_MAP_APP_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_APP_KEY ?? "";

/**
 * Street parking survey page (노외주차장 조사)
 * Displays a map with triangle markers and bottom sheet detail view
 */
export default function StreetParkingScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const router = useRouter();
  const mapRef = useRef<StreetKakaoMapRef>(null);
  const { showModal } = useAppModal();
  const { showToast } = useAppToast();
  const { getCurrentLocation } = useCurrentLocation();
  const { ensureLocationAccess } = useLocationPermission();

  // Track surveyor GPS location every 30s while this screen is focused
  useLocationTracking({ screenId: SCREEN_IDS.APP_STREET_PARKING });

  const [isMapReady, setIsMapReady] = useState(false);
  // Guard so we auto-center on the user's GPS location only once, on first map ready
  const didAutoLocateRef = useRef(false);
  // True when location permission is denied or location services are off —
  // shows a full-screen overlay covering the map and search bar
  const [locationDenied, setLocationDenied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarker, setSelectedMarker] = useState<StreetParkingMarker | null>(null);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Address search mode: when true, SearchOverlay fills the form address field instead of moving t he map
  const [isAddressSearchMode, setIsAddressSearchMode] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const addressSetterRef = useRef<((address: string, lat: number, lng: number) => void) | null>(null);

  // Legend filter state — determines which marker categories are visible on map
  const [legendFilters, setLegendFilters] = useState<Record<LegendKey, boolean>>({
    ...LEGEND_DEFAULT_FILTERS,
  });

  // Zone number labels visibility
  const [showAreaNumber, setShowAreaNumber] = useState(false);

  // Zone filter selection
  const [selectedZoneId, setSelectedZoneId] = useState("");

  // Adding mode: user taps map to place a new marker
  const [isAddingMode, setIsAddingMode] = useState(false);
  // Loading state while reverse geocoding is in progress
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  // Fetch parking lot data via viewport-based loading (off_street type)
  const { data: parkingLotData, isLoading } = useParkingLotMapData(
    "off_street",
    bounds,
    SCREEN_IDS.APP_STREET_PARKING
  );

  // Fetch zone boundary polygons for validating new marker placement
  const { data: zoneBoundariesData } = useSurveyorZoneBoundaries(
    SCREEN_IDS.APP_STREET_PARKING
  );

  // Fetch assigned survey zones for zone filter dropdown
  const { data: surveyZonesData } = useSurveyorZones(SCREEN_IDS.APP_STREET_PARKING);

  // Track locally which marker IDs have been updated in this session
  const [localUpdatedIds, setLocalUpdatedIds] = useState<Set<string>>(new Set());
  // Track locally which marker IDs have been confirmed (read-only) in this session
  const [localConfirmedIds, setLocalConfirmedIds] = useState<Set<string>>(new Set());
  // Track locally markers created via app, keyed by ID with full marker data
  const [localCreatedMarkers, setLocalCreatedMarkers] = useState<Map<string, StreetParkingMarker>>(
    new Map()
  );

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

  // Convert API data to map markers
  const markers = useMemo<StreetParkingMarker[]>(() => {
    const apiMarkers: StreetParkingMarker[] = (parkingLotData?.data ?? []).map((lot) => ({
      id: String(lot.id),
      lat: lot.lat,
      lng: lot.lng,
      type: "completed" as const,
      label: PARKING_LOT_DISPLAY_TYPE_LABELS[lot.parkingType],
      mode: "existing" as const,
      isUpdated: lot.isUpdated || localUpdatedIds.has(String(lot.id)),
      isCreatedByApp: lot.isCreatedByApp || localCreatedMarkers.has(String(lot.id)),
      isConfirmed: lot.isConfirmed || localConfirmedIds.has(String(lot.id)),
    }));

    // Append locally created markers not yet present in API response
    const apiIds = new Set(apiMarkers.map((m) => m.id));
    const polygons = zoneBoundariesData?.data ?? [];
    const pendingMarkers = Array.from(localCreatedMarkers.values()).filter(
      (m) =>
        !apiIds.has(m.id) &&
        polygons.length > 0 &&
        isPointInZoneBoundaries(m.lat, m.lng, polygons),
    );

    return [...apiMarkers, ...pendingMarkers];
  }, [parkingLotData, localUpdatedIds, localConfirmedIds, localCreatedMarkers, zoneBoundariesData]);

  // Apply legend filters to markers
  const filteredMarkers = useMemo<StreetParkingMarker[]>(() => {
    return markers.filter((m) => {
      if (m.isCreatedByApp) return legendFilters.new;
      if (m.isUpdated) return legendFilters.updated;
      return legendFilters.existing;
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
      const { id, lat, lng, markerType, isCompleted } = pendingFocusMarker;
      setPendingFocusMarker(null);
      const screenH = Dimensions.get("window").height;
      mapRef.current?.moveToLocationWithOffset(lat, lng, Math.round(screenH * 0.2));
      mapRef.current?.selectMarkerAt(String(id), lat, lng, markerType);
      const marker: StreetParkingMarker = {
        id: String(id),
        lat,
        lng,
        type: "completed",
        mode: "existing",
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

  // Handle address search result - validate zone, fill form address + GPS, and return to bottom sheet
  const handleAddressSelectResult = useCallback((result: KakaoSearchResult) => {
    setIsSearchOpen(false);
    setIsAddressSearchMode(false);
    setAddressSearchQuery("");

    // Check if address already exists in survey list (~10m radius)
    const THRESHOLD = 0.0001; // ~10m in degrees
    const isDuplicate = markers.some(
      (m) =>
        m.id !== selectedMarker?.id &&
        Math.abs(m.lat - result.lat) < THRESHOLD &&
        Math.abs(m.lng - result.lng) < THRESHOLD,
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
  }, [zoneBoundariesData, showToast, markers, selectedMarker?.id]);

  // Handle marker location change after save (address was changed via search)
  const handleMarkerLocationChange = useCallback((_markerId: string, lat: number, lng: number) => {
    setSelectedMarker((prev) => (prev ? { ...prev, lat, lng } : prev));
    mapRef.current?.moveToLocation(lat, lng);
  }, []);

  // Handle successful final save — always mark as confirmed (read-only),
  // only flip to solid blue if data actually changed
  const handleSaveSuccess = useCallback((markerId: string, hasChanges: boolean) => {
    if (hasChanges) {
      setLocalUpdatedIds((prev) => new Set(prev).add(markerId));
    }
    setLocalConfirmedIds((prev) => new Set(prev).add(markerId));
    setSelectedMarker((prev) => (prev ? { ...prev, isConfirmed: true, isUpdated: hasChanges || prev.isUpdated } : prev));
  }, []);

  // Handle marker press - only allowed when NOT in adding mode
  const handleMarkerPress = useCallback(
    (marker: StreetParkingMarker) => {
      if (isAddingMode) return;
      setSelectedMarker(marker);
      mapRef.current?.setBottomSheetVisible(true);
    },
    [isAddingMode]
  );

  // Handle bottom sheet close - deselect marker, reset, and re-push markers to force redraw
  const handleBottomSheetClose = useCallback(() => {
    mapRef.current?.deselectMarker();
    mapRef.current?.clearNewMarker();
    setSelectedMarker(null);
    mapRef.current?.setMarkers(filteredMarkers);
  }, [filteredMarkers]);

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

  // Toggle adding mode on FAB press
  const handleFabPress = useCallback(() => {
    const next = !isAddingMode;
    setIsAddingMode(next);
    mapRef.current?.setAddingMode(next);
    if (next) {
      // Entering adding mode: clear search marker to avoid overlap
      mapRef.current?.clearSearchMarker();
      setSearchQuery("");
    } else {
      mapRef.current?.clearNewMarker();
      setSelectedMarker(null);
      setIsGeocodingLoading(false);
    }
  }, [isAddingMode]);

  // Handle map tap start: show loading while reverse geocoding is in progress
  const handleMapTapStart = useCallback(() => {
    setIsGeocodingLoading(true);
  }, []);

  // Handle map tap in adding mode: place a temporary new marker and open bottom sheet
  const handleMapTap = useCallback(
    (lat: number, lng: number, address?: string) => {
      setIsGeocodingLoading(false);

      // Check if the tapped point is within allowed zone boundaries.
      // Block creation when the surveyor has no assigned zones at all.
      const polygons = zoneBoundariesData?.data ?? [];
      if (polygons.length === 0 || !isPointInZoneBoundaries(lat, lng, polygons)) {
        mapRef.current?.clearNewMarker();
        showModal({
          title: "알림",
          message: "이 지역에서는 조작할 수 없습니다.",
          buttons: [{ text: "확인" }],
        });
        return;
      }

      // TODO: Re-enable duplicate-tap blocking once the business rule is finalized.
      // Tapping near an existing marker (~10m) almost always resolves to the same
      // road address, but for now manual map-tap creation is intentionally NOT blocked.
      // const THRESHOLD = 0.0001; // ~10m in degrees
      // const isDuplicate = markers.some(
      //   (m) => Math.abs(m.lat - lat) < THRESHOLD && Math.abs(m.lng - lng) < THRESHOLD
      // );
      // if (isDuplicate) {
      //   mapRef.current?.clearNewMarker();
      //   showModal({
      //     title: "알림",
      //     message: "이 주소는 이미 조사 목록에 있습니다.",
      //     buttons: [{ text: "확인" }],
      //   });
      //   return;
      // }

      // Pre-derive surveyArea (조사구역 code) from zone polygons so the bottom sheet
      // can pre-fill uniqueNumber1 immediately, matching what the backend will store.
      const surveyArea = findZoneCodeForPoint(lat, lng, polygons);

      const newMarker: StreetParkingMarker = {
        id: `new_${Date.now()}`,
        lat,
        lng,
        type: "pending",
        mode: "new",
        address: address || null,
        surveyArea,
      };
      setSelectedMarker(newMarker);
    },
    [showModal, zoneBoundariesData],
  );

  // Navigate to survey zone management screen
  const handleClipboardPress = useCallback(() => {
    router.push(PATHS.TABS.OFF_STREET_SURVEY_ZONE as never);
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

  // Handle legend search - apply filters to markers
  const handleLegendSearch = useCallback((filters: Record<LegendKey, boolean>) => {
    setLegendFilters(filters);
  }, []);

  // Handle zone number label toggle
  const handleShowAreaNumberChange = useCallback((value: boolean) => {
    setShowAreaNumber(value);
    mapRef.current?.setZoneLabelsVisible(value);
  }, []);

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

      {/* Map layer with triangle markers */}
      <StreetKakaoMap
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
        onMapTapStart={handleMapTapStart}
        onMapTap={handleMapTap}
        onSearchMarkerClose={handleSearchMarkerClose}
        style={styles.map}
      />

      {/* Loading overlay - shown until map is ready or data is loading */}
      {(!isMapReady || (isLoading && !parkingLotData)) && (
        <View style={[StyleSheet.absoluteFillObject, { bottom: tabBarHeight, zIndex: 999 }]}>
          <LoadingOverlay visible />
        </View>
      )}

      {/* Loading overlay - shown while reverse geocoding address for new marker */}
      {isGeocodingLoading && (
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

      {/* Adding mode bottom bar - toast label (centered) + close button (right) */}
      {isAddingMode && !selectedMarker && (
        <>
          <View style={[styles.addingToastCenter, { bottom: tabBarHeight + 16 }]}>
            <View style={styles.addingToast}>
              <Text style={styles.addingToastText}>생성할 위치를 터치하세요.</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.addingCloseBtn, { bottom: tabBarHeight + 16 }]}
            onPress={handleFabPress}
            activeOpacity={0.85}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconCloseRed width={20} height={20} />
          </TouchableOpacity>
        </>
      )}

      {/* GPS button - floating, above FAB */}
      {!isSearchOpen && !selectedMarker && !isAddingMode && (
        <TouchableOpacity
          style={[styles.gpsBtn, { bottom: tabBarHeight + 16 + 44 + 10 }]}
          onPress={handleGpsPress}
          activeOpacity={0.85}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Gps size={22} color="#151515" variant="Linear" />
        </TouchableOpacity>
      )}

      {/* FAB button - shown when NOT in adding mode */}
      {!isSearchOpen && !selectedMarker && !isAddingMode && (
        <TouchableOpacity
          style={[styles.fab, { bottom: tabBarHeight + 16 }]}
          onPress={handleFabPress}
          activeOpacity={0.85}
        >
          <Add size={24} color="#238aaf" variant="Linear" />
        </TouchableOpacity>
      )}

      {/* Bottom sheet with integrated header */}
      <StreetParkingBottomSheet
        marker={selectedMarker}
        onClose={handleBottomSheetClose}
        onSaveSuccess={handleSaveSuccess}
        onCreateSuccess={(newId, lat, lng) => {
          setIsAddingMode(false);
          mapRef.current?.setAddingMode(false);
          mapRef.current?.clearNewMarker();
          setLocalCreatedMarkers((prev) => {
            const next = new Map(prev);
            next.set(newId, {
              id: newId,
              lat,
              lng,
              type: "completed",
              mode: "existing",
              isCreatedByApp: true,
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
        onAddressSearchPress={handleAddressSearchPress}
        onAddressSearchRef={(setter) => { addressSetterRef.current = setter; }}
        onMarkerLocationChange={handleMarkerLocationChange}
        screenId={SCREEN_IDS.APP_STREET_PARKING}
      />

      {/* Lift the nav bar above the permission overlay so its top shadow stays
          visible (and it remains tappable) while the overlay covers the map. */}
      <View style={[styles.navBarWrapper, locationDenied && { zIndex: 1001 }]}>
        <BottomNavBar />
      </View>

      {/* Legend bottom sheet - street parking tab */}
      <LegendBottomSheet
        visible={legendSheetVisible}
        onClose={() => setLegendSheetVisible(false)}
        onSearch={handleLegendSearch}
        parkingTab="street"
        showAreaNumber={showAreaNumber}
        onShowAreaNumberChange={handleShowAreaNumberChange}
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
  fab: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 20,
  },
  addingToastCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 30,
  },
  addingToast: {
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
  addingToastText: {
    color: "#333333",
    fontSize: 14,
    fontWeight: "500",
  },
  addingCloseBtn: {
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
    elevation: 4,
    zIndex: 31,
  },
});
