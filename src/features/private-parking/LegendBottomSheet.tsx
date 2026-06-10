import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { ArrowDown2 } from "iconsax-react-native";
import { Text } from "@/src/components/Text";
import { LegendIndicator } from "./LegendIndicator";
import { InlineButton } from "@/src/components/InlineButton";
import { Checkbox } from "@/src/components/Checkbox";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SurveyZone } from "@/src/api-contracts";

// Parking tab types for per-tab legend colors
type ParkingTab = "private" | "onStreet" | "street";

// Legend color sets per tab
const LEGEND_COLORS: Record<ParkingTab, { existing: string; updated: string; new: string }> = {
  private: { existing: "#072AC8", updated: "#072AC8", new: "#10A571" },
  onStreet: { existing: "#10A671", updated: "#0D8A5E", new: "#086B48" },
  street: { existing: "#D00000", updated: "#D00000", new: "#10A571" },
};

// Legend item definition (colors filled dynamically based on tab)
export type LegendKey = "existing" | "updated" | "new";

const LEGEND_LABELS: { key: LegendKey; label: string }[] = [
  { key: "existing", label: "기존 데이터" },
  { key: "updated", label: "업데이트된 데이터" },
  { key: "new", label: "새로 등록된 데이터" },
];

// Default checked state — all visible by default
export const LEGEND_DEFAULT_FILTERS: Record<LegendKey, boolean> = {
  existing: true,
  updated: true,
  new: true,
};

// On-street sub-type filter keys (one per sub-type, no updated/new distinction)
export type OnStreetLegendKey =
  | "on_street_legal_day"
  | "on_street_illegal_day"
  | "on_street_legal_night"
  | "on_street_illegal_night";

export const ON_STREET_LEGEND_DEFAULT_FILTERS: Record<OnStreetLegendKey, boolean> = {
  on_street_legal_day: true,
  on_street_illegal_day: true,
  on_street_legal_night: true,
  on_street_illegal_night: true,
};

// On-street specific legend items — each sub-type has its own checkbox
const ON_STREET_LEGEND_ITEMS: {
  key: OnStreetLegendKey;
  label: string;
  color: string;
  hasX: boolean;
}[] = [
  { key: "on_street_legal_day", label: "노상합법(주간)", color: "#FFDA09", hasX: false },
  { key: "on_street_illegal_day", label: "노상불법(주간)", color: "#FFDA09", hasX: true },
  { key: "on_street_legal_night", label: "노상합법(야간)", color: "#2D2D2D", hasX: false },
  { key: "on_street_illegal_night", label: "노상불법(야간)", color: "#2D2D2D", hasX: true },
];

interface LegendBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSearch?: (filters: Record<LegendKey, boolean>) => void;
  /** Callback for on-street sub-type filters (used when parkingTab is "onStreet") */
  onSearchOnStreet?: (filters: Record<OnStreetLegendKey, boolean>) => void;
  /** Which parking tab this legend belongs to — determines the color set */
  parkingTab?: ParkingTab;
  /** Whether zone number labels are currently visible */
  showAreaNumber?: boolean;
  /** Callback when zone number visibility changes */
  onShowAreaNumberChange?: (value: boolean) => void;
  /** Whether marker polygons are currently visible */
  showPolygon?: boolean;
  /** Callback when polygon visibility changes */
  onShowPolygonChange?: (value: boolean) => void;
  /** Assigned survey zones for the dropdown */
  surveyZones?: SurveyZone[];
  /** Currently selected zone featureId */
  selectedZoneId?: string;
  /** Callback when a zone is selected and search is pressed */
  onZoneSelect?: (zone: SurveyZone | null) => void;
  /** Callback to open the zone picker sheet (rendered outside at screen level) */
  onOpenZonePicker?: () => void;
}

const ANIMATION_DURATION = 300;

/**
 * Bottom sheet for map legend (범례)
 * Shows data type filters with colored indicators and checkboxes
 */
export function LegendBottomSheet({
  visible,
  onClose,
  onSearch,
  onSearchOnStreet,
  parkingTab = "private",
  showAreaNumber = false,
  onShowAreaNumberChange,
  showPolygon = true,
  onShowPolygonChange,
  surveyZones = [],
  selectedZoneId = "",
  onZoneSelect,
  onOpenZonePicker,
}: LegendBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const sheetHeight = useSharedValue(0);
  const translateY = useSharedValue(1000);
  const backdropOpacity = useSharedValue(0);
  const isClosingRef = useRef(false);

  const [filters, setFilters] = useState<Record<LegendKey, boolean>>({
    ...LEGEND_DEFAULT_FILTERS,
  });

  // Separate filter state for on-street sub-types
  const [onStreetFilters, setOnStreetFilters] = useState<Record<OnStreetLegendKey, boolean>>({
    ...ON_STREET_LEGEND_DEFAULT_FILTERS,
  });

  // Local state for area number checkbox (applied on search, not immediately)
  const [localShowAreaNumber, setLocalShowAreaNumber] = useState(showAreaNumber);

  // Local state for polygon visibility checkbox (applied on search, not immediately)
  const [localShowPolygon, setLocalShowPolygon] = useState(showPolygon);

  // Local state for zone selection
  const [localSelectedZoneId, setLocalSelectedZoneId] = useState(selectedZoneId);

  const selectedZone = surveyZones.find((z) => z.featureId === localSelectedZoneId) ?? null;

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    // Use measured height so the sheet slides fully off-screen
    const dismissDistance = sheetHeight.value > 0 ? sheetHeight.value : 1000;
    translateY.value = withTiming(dismissDistance, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.ease),
    });
    backdropOpacity.value = withTiming(0, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.ease),
    });
    setTimeout(onClose, ANIMATION_DURATION);
  }, [onClose, translateY, backdropOpacity]);

  // Sync local state when sheet opens (reset to parent values)
  const prevVisibleRef = useRef(false);
  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      // Sheet just opened — sync from props
      setLocalShowAreaNumber(showAreaNumber);
      setLocalShowPolygon(showPolygon);
      setLocalSelectedZoneId(selectedZoneId);
    }
    prevVisibleRef.current = visible;
  }, [visible, showAreaNumber, showPolygon, selectedZoneId]);

  // Sync zone selection when picker changes while sheet is open
  useEffect(() => {
    if (visible) {
      setLocalSelectedZoneId(selectedZoneId);
    }
  }, [selectedZoneId]);

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      // Start off-screen then animate in
      const startDistance = sheetHeight.value > 0 ? sheetHeight.value : 1000;
      translateY.value = startDistance;
      backdropOpacity.value = withTiming(1, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [visible, backdropOpacity, translateY, sheetHeight]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Reset all filters to default
  const handleReset = () => {
    setLocalShowAreaNumber(false);
    setLocalShowPolygon(true);
    setLocalSelectedZoneId("");
    if (parkingTab === "onStreet") {
      setOnStreetFilters({ ...ON_STREET_LEGEND_DEFAULT_FILTERS });
    } else {
      setFilters({ ...LEGEND_DEFAULT_FILTERS });
    }
  };

  // Search with current filters
  const handleSearch = () => {
    onShowAreaNumberChange?.(localShowAreaNumber);
    onShowPolygonChange?.(localShowPolygon);
    onZoneSelect?.(selectedZone);
    if (parkingTab === "onStreet") {
      onSearchOnStreet?.(onStreetFilters);
    } else {
      onSearch?.(filters);
    }
    handleClose();
  };

  // Toggle individual filter
  const toggleFilter = (key: LegendKey) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle on-street sub-type filter
  const toggleOnStreetFilter = (key: OnStreetLegendKey) => {
    setOnStreetFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* Blurred backdrop — use simple dimming on Android to avoid GPU-heavy blur over complex WebView canvas */}
      <Animated.View style={[styles.backdropContainer, backdropAnimatedStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          {Platform.OS === "ios" ? (
            <BlurView
              intensity={14}
              tint="dark"
              style={StyleSheet.absoluteFill}
              experimentalBlurMethod="dimezisBlurView"
            />
          ) : null}
          <View style={styles.backdropDimming} />
        </Pressable>
      </Animated.View>

      {/* Bottom sheet */}
      <Animated.View
        style={[styles.sheet, sheetAnimatedStyle, { paddingBottom: insets.bottom }]}
        onLayout={(e) => {
          sheetHeight.value = e.nativeEvent.layout.height;
        }}
      >
        {/* Drag handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Title */}
        <Text style={styles.title}>필터</Text>

        {/* Zone selector */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>조사구역 - 조사구역번호</Text>
        </View>
        <View style={{ paddingHorizontal: 16, marginBottom: 0 }}>
          <TouchableOpacity
            style={styles.zoneDropdown}
            onPress={() => onOpenZonePicker?.()}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.zoneDropdownText, !selectedZone && styles.zoneDropdownPlaceholder]}
              numberOfLines={1}
            >
              {selectedZone ? selectedZone.displayName : "선택하세요"}
            </Text>
            <ArrowDown2 size={16} color="#151515" variant="Linear" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionDivider} />

        {/* Area number section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>구역번호</Text>
        </View>
        <View style={{ ...styles.legendList, marginBottom: 0 }}>
          <View style={styles.legendRow}>
            <View style={styles.legendLabelRow}>
              <View style={styles.areaNumberBadge}>
                <Text style={styles.areaNumberBadgeText}>01</Text>
              </View>
              <Text style={styles.legendLabel}>구역번호 표시</Text>
            </View>
            <Checkbox
              label=""
              value={localShowAreaNumber}
              onChange={() => setLocalShowAreaNumber(!localShowAreaNumber)}
              size={20}
            />
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {/* Polygon visibility section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>폴리곤</Text>
        </View>
        <View style={{ ...styles.legendList, marginBottom: 0 }}>
          <View style={styles.legendRow}>
            <View style={styles.legendLabelRow}>
              <View style={styles.polygonIcon} />
              <Text style={styles.legendLabel}>폴리곤 표시</Text>
            </View>
            <Checkbox
              label=""
              value={localShowPolygon}
              onChange={() => setLocalShowPolygon(!localShowPolygon)}
              size={20}
            />
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {/* Parking type section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>주차 유형</Text>
        </View>
        <View style={styles.legendList}>
          {parkingTab === "onStreet" ? (
            <>
              {/* On-street sub-type indicators — each has its own checkbox */}
              {ON_STREET_LEGEND_ITEMS.map((item) => (
                <View key={item.key} style={styles.legendRow}>
                  <View style={styles.legendLabelRow}>
                    <LegendIndicator color={item.color} shape="circle" hasX={item.hasX} />
                    <Text style={styles.legendLabel}>{item.label}</Text>
                  </View>
                  <Checkbox
                    label=""
                    value={onStreetFilters[item.key]}
                    onChange={() => toggleOnStreetFilter(item.key)}
                    size={20}
                  />
                </View>
              ))}
            </>
          ) : (
            LEGEND_LABELS.map((item) => (
              <View key={item.key} style={styles.legendRow}>
                <View style={styles.legendLabelRow}>
                  <LegendIndicator
                    color={LEGEND_COLORS[parkingTab][item.key]}
                    outline={item.key === "existing"}
                    shape={parkingTab === "street" ? "triangle" : "square"}
                  />
                  <Text style={styles.legendLabel}>{item.label}</Text>
                </View>
                <Checkbox
                  label=""
                  value={filters[item.key]}
                  onChange={() => toggleFilter(item.key)}
                  size={20}
                />
              </View>
            ))
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <InlineButton
            title="초기화"
            variant="secondary"
            size="lg"
            onPress={handleReset}
            style={styles.legendActionButton}
          />
          <InlineButton
            title="검색"
            variant="primary"
            size="lg"
            onPress={handleSearch}
            style={styles.legendActionButton}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },

  // Backdrop with blur
  backdropContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropDimming: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === "ios" ? "rgba(21, 21, 21, 0.6)" : "rgba(21, 21, 21, 0.82)",
  },

  // Bottom sheet
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
  },

  // Drag handle
  handleContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  handle: {
    width: 50,
    height: 6,
    borderRadius: 100,
    backgroundColor: "#E9E9E9",
  },

  // Title
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#151515",
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  // Section
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#151515",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 16,
    marginVertical: 16,
  },
  areaNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  areaNumberBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EF4444",
  },
  polygonIcon: {
    width: 18,
    height: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#238AAF",
    borderRadius: 0,
  },

  // Legend items
  legendList: {
    paddingHorizontal: 16,
    gap: 13,
    marginBottom: 24,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  legendLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
  },

  // Action buttons
  buttonRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
  },
  resetButton: {
    flex: 2,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9E9E9",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#151515",
  },
  searchButton: {
    flex: 2,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#238AAF",
    justifyContent: "center",
    alignItems: "center",
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  legendActionButton: {
    flex: 2,
    height: 44,
  },

  // Zone dropdown
  zoneDropdown: {
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F4F4F4",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  zoneDropdownText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
    flex: 1,
  },
  zoneDropdownPlaceholder: {
    color: "#BDBDBD",
  },
});
