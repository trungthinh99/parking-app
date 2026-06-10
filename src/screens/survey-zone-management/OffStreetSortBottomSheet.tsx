import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Polygon } from "react-native-svg";

import { Text } from "@/src/components/Text";
import { InlineButton } from "@/src/components/InlineButton";

import IconChecked from "@/src/assets/images/icons/icon-checkbox-checked-16.svg";
import IconUnchecked from "@/src/assets/images/icons/icon-checkbox-unchecked-16.svg";

// Status filter keys
export type OffStreetStatusKey = "original" | "updated" | "new";

// Parking data type filter keys (data tab)
export type OffStreetParkingDataTypeKey = "existing" | "newlyRegistered";

// Completed tab parking type filter keys
export type OffStreetCompletedParkingTypeKey = "existingData" | "updatedData" | "newlyRegistered";

export const OFF_STREET_STATUS_DEFAULT: Record<OffStreetStatusKey, boolean> = {
  original: true,
  updated: true,
  new: true,
};

export const OFF_STREET_PARKING_TYPE_DEFAULT: Record<OffStreetParkingDataTypeKey, boolean> = {
  existing: true,
  newlyRegistered: true,
};

export const OFF_STREET_COMPLETED_PARKING_TYPE_DEFAULT: Record<OffStreetCompletedParkingTypeKey, boolean> = {
  existingData: true,
  updatedData: true,
  newlyRegistered: true,
};

const STATUS_BADGES: {
  key: OffStreetStatusKey;
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}[] = [
  { key: "original", label: "원본", bgColor: "#E9E9E9", borderColor: "#454545", textColor: "#454545" },
  { key: "updated", label: "업데이트됨", bgColor: "#FFEAD2", borderColor: "#EA8445", textColor: "#EA8445" },
  { key: "new", label: "신규", bgColor: "#D8D5FF", borderColor: "#884CFF", textColor: "#884CFF" },
];

const PARKING_TYPE_OPTIONS: {
  key: OffStreetParkingDataTypeKey;
  label: string;
  indicatorStyle: "existing" | "new";
}[] = [
  { key: "existing", label: "기존 데이터", indicatorStyle: "existing" },
  { key: "newlyRegistered", label: "새로 등록 데이터", indicatorStyle: "new" },
];

const COMPLETED_PARKING_TYPE_OPTIONS: {
  key: OffStreetCompletedParkingTypeKey;
  label: string;
  indicatorStyle: "existing" | "completed" | "new";
}[] = [
  { key: "existingData", label: "기존 데이터", indicatorStyle: "existing" },
  { key: "updatedData", label: "업데이트된 데이터", indicatorStyle: "completed" },
  { key: "newlyRegistered", label: "새로 등록된 데이터", indicatorStyle: "new" },
];

export interface OffStreetFilterResult {
  status: Record<OffStreetStatusKey, boolean>;
  parkingDataType: Record<OffStreetParkingDataTypeKey, boolean>;
}

export interface OffStreetCompletedFilterResult {
  parkingDataType: Record<OffStreetCompletedParkingTypeKey, boolean>;
}

// Small triangle indicator for the parking type rows
function TriangleIndicatorSmall({ fill, stroke }: { fill: string; stroke?: string }) {
  const pts = stroke ? "6,1.5 1,11 11,11" : "6,0 0,12 12,12";
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12">
      <Polygon
        points={pts}
        fill={fill}
        stroke={stroke || "none"}
        strokeWidth={stroke ? 2 : 0}
        strokeLinejoin="miter"
        strokeMiterlimit={10}
      />
    </Svg>
  );
}

interface OffStreetSortBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (filters: OffStreetFilterResult) => void;
}

const ANIMATION_DURATION = 300;

/**
 * Sort/filter bottom sheet for Off-Street (노외) survey zone screen.
 * Includes 상태 filter (원본/업데이트됨/신규) + 주차 유형 filter (기존/새로 등록)
 */
export function OffStreetSortBottomSheet({ visible, onClose, onSearch }: OffStreetSortBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(300);
  const backdropOpacity = useSharedValue(0);
  const isClosingRef = useRef(false);

  const [statusFilters, setStatusFilters] = useState<Record<OffStreetStatusKey, boolean>>({
    ...OFF_STREET_STATUS_DEFAULT,
  });
  const [parkingTypeFilters, setParkingTypeFilters] = useState<Record<OffStreetParkingDataTypeKey, boolean>>({
    ...OFF_STREET_PARKING_TYPE_DEFAULT,
  });

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    translateY.value = withTiming(300, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.ease),
    });
    backdropOpacity.value = withTiming(
      0,
      { duration: ANIMATION_DURATION, easing: Easing.out(Easing.ease) },
      () => {
        runOnJS(onClose)();
      }
    );
  }, [onClose, translateY, backdropOpacity]);

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      backdropOpacity.value = withTiming(1, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [visible, backdropOpacity, translateY]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const toggleStatus = (key: OffStreetStatusKey) => {
    setStatusFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleParkingType = (key: OffStreetParkingDataTypeKey) => {
    setParkingTypeFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReset = () => {
    setStatusFilters({ ...OFF_STREET_STATUS_DEFAULT });
    setParkingTypeFilters({ ...OFF_STREET_PARKING_TYPE_DEFAULT });
    onSearch({ status: { ...OFF_STREET_STATUS_DEFAULT }, parkingDataType: { ...OFF_STREET_PARKING_TYPE_DEFAULT } });
    handleClose();
  };

  const handleSearch = () => {
    onSearch({ status: statusFilters, parkingDataType: parkingTypeFilters });
    handleClose();
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* Blurred backdrop */}
      <Animated.View style={[styles.backdropContainer, backdropAnimatedStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          <BlurView
            intensity={14}
            tint="dark"
            style={StyleSheet.absoluteFill}
            experimentalBlurMethod="dimezisBlurView"
          />
          <View style={styles.backdropDimming} />
        </Pressable>
      </Animated.View>

      {/* Bottom sheet */}
      <Animated.View
        style={[styles.sheet, sheetAnimatedStyle, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        {/* Drag handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Status section */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>상태</Text>
        </View>
        <View style={styles.badgeRow}>
          {STATUS_BADGES.map((badge) => {
            const active = statusFilters[badge.key];
            return (
              <Pressable
                key={badge.key}
                onPress={() => toggleStatus(badge.key)}
                style={[
                  styles.badge,
                  {
                    backgroundColor: active ? badge.bgColor : "#F4F4F4",
                    borderColor: active ? badge.borderColor : "#BDBDBD",
                  },
                  active && styles.badgeShadow,
                ]}
              >
                <Text style={[styles.badgeText, { color: active ? badge.textColor : "#8D8D8D" }]}>
                  {badge.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Parking data type section */}
        <View style={styles.divider} />
        <View style={styles.titleRow}>
          <Text style={styles.title}>주차 유형</Text>
        </View>
        <View style={styles.parkingTypeSection}>
          {PARKING_TYPE_OPTIONS.map((option) => {
            const checked = parkingTypeFilters[option.key];
            return (
              <Pressable
                key={option.key}
                style={styles.parkingTypeRow}
                onPress={() => toggleParkingType(option.key)}
                hitSlop={{ top: 4, bottom: 4 }}
              >
                <View style={styles.parkingTypeLabelRow}>
                  <TriangleIndicatorSmall
                    {...(option.indicatorStyle === "existing"
                      ? { fill: "#FFFFFF", stroke: "#D00000" }
                      : { fill: "#10A671" }
                    )}
                  />
                  <Text style={styles.parkingTypeLabel}>{option.label}</Text>
                </View>
                {checked ? (
                  <IconChecked width={16} height={16} />
                ) : (
                  <IconUnchecked width={16} height={16} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <InlineButton
            title="초기화"
            variant="secondary"
            size="lg"
            onPress={handleReset}
            style={styles.actionButton}
          />
          <InlineButton
            title="검색"
            variant="primary"
            size="lg"
            onPress={handleSearch}
            style={styles.actionButton}
          />
        </View>
      </Animated.View>
    </View>
  );
}

interface OffStreetCompletedSortBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (filters: OffStreetCompletedFilterResult) => void;
}

/**
 * Sort/filter bottom sheet for Off-Street (노외) completed tab.
 * Only includes 주차 유형 filter (업데이트된 데이터 / 새로 등록된 데이터)
 */
export function OffStreetCompletedSortBottomSheet({ visible, onClose, onSearch }: OffStreetCompletedSortBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(300);
  const backdropOpacity = useSharedValue(0);
  const isClosingRef = useRef(false);

  const [parkingTypeFilters, setParkingTypeFilters] = useState<Record<OffStreetCompletedParkingTypeKey, boolean>>({
    ...OFF_STREET_COMPLETED_PARKING_TYPE_DEFAULT,
  });

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    translateY.value = withTiming(300, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.ease),
    });
    backdropOpacity.value = withTiming(
      0,
      { duration: ANIMATION_DURATION, easing: Easing.out(Easing.ease) },
      () => {
        runOnJS(onClose)();
      }
    );
  }, [onClose, translateY, backdropOpacity]);

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      backdropOpacity.value = withTiming(1, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [visible, backdropOpacity, translateY]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const toggleParkingType = (key: OffStreetCompletedParkingTypeKey) => {
    setParkingTypeFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReset = () => {
    setParkingTypeFilters({ ...OFF_STREET_COMPLETED_PARKING_TYPE_DEFAULT });
    onSearch({ parkingDataType: { ...OFF_STREET_COMPLETED_PARKING_TYPE_DEFAULT } });
    handleClose();
  };

  const handleSearch = () => {
    onSearch({ parkingDataType: parkingTypeFilters });
    handleClose();
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* Blurred backdrop */}
      <Animated.View style={[styles.backdropContainer, backdropAnimatedStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          <BlurView
            intensity={14}
            tint="dark"
            style={StyleSheet.absoluteFill}
            experimentalBlurMethod="dimezisBlurView"
          />
          <View style={styles.backdropDimming} />
        </Pressable>
      </Animated.View>

      {/* Bottom sheet */}
      <Animated.View
        style={[styles.sheet, sheetAnimatedStyle, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        {/* Drag handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Parking data type section */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>주차 유형</Text>
        </View>
        <View style={styles.parkingTypeSection}>
          {COMPLETED_PARKING_TYPE_OPTIONS.map((option) => {
            const checked = parkingTypeFilters[option.key];
            return (
              <Pressable
                key={option.key}
                style={styles.parkingTypeRow}
                onPress={() => toggleParkingType(option.key)}
                hitSlop={{ top: 4, bottom: 4 }}
              >
                <View style={styles.parkingTypeLabelRow}>
                  <TriangleIndicatorSmall
                    {...(option.indicatorStyle === "existing"
                      ? { fill: "#FFFFFF", stroke: "#D00000" }
                      : option.indicatorStyle === "completed"
                        ? { fill: "#D00000" }
                        : { fill: "#10A671" }
                    )}
                  />
                  <Text style={styles.parkingTypeLabel}>{option.label}</Text>
                </View>
                {checked ? (
                  <IconChecked width={16} height={16} />
                ) : (
                  <IconUnchecked width={16} height={16} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <InlineButton
            title="초기화"
            variant="secondary"
            size="lg"
            onPress={handleReset}
            style={styles.actionButton}
          />
          <InlineButton
            title="검색"
            variant="primary"
            size="lg"
            onPress={handleSearch}
            style={styles.actionButton}
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
  backdropContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropDimming: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(21, 21, 21, 0.6)",
  },
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
  handleContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  handle: {
    width: 50,
    height: 6,
    borderRadius: 100,
    backgroundColor: "#E9E9E9",
  },
  titleRow: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#151515",
    letterSpacing: -0.396,
  },
  badgeRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  badgeShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#151515",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        boxShadow: "0px 0px 4px 0px rgba(21, 21, 21, 0.32)",
      },
    }),
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: -0.308,
  },
  divider: {
    height: 1,
    backgroundColor: "#E9E9E9",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  parkingTypeSection: {
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 16,
  },
  parkingTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  parkingTypeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  parkingTypeLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
    letterSpacing: -0.308,
  },
  buttonRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});
