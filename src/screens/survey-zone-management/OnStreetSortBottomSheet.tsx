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
import Svg, { Circle, Line } from "react-native-svg";

import { Text } from "@/src/components/Text";
import { InlineButton } from "@/src/components/InlineButton";

import IconChecked from "@/src/assets/images/icons/icon-checkbox-checked-16.svg";
import IconUnchecked from "@/src/assets/images/icons/icon-checkbox-unchecked-16.svg";

// On-street only has original + updated (no app-created markers)
export type OnStreetStatusKey = "original" | "updated";

// On-street parking sub-type filter keys (4 types matching map markers)
export type OnStreetSubTypeKey =
  | "on_street_legal_day"
  | "on_street_illegal_day"
  | "on_street_legal_night"
  | "on_street_illegal_night";

export const ON_STREET_STATUS_DEFAULT: Record<OnStreetStatusKey, boolean> = {
  original: true,
  updated: true,
};

export const ON_STREET_SUB_TYPE_DEFAULT: Record<OnStreetSubTypeKey, boolean> = {
  on_street_legal_day: true,
  on_street_illegal_day: true,
  on_street_legal_night: true,
  on_street_illegal_night: true,
};

const STATUS_BADGES: {
  key: OnStreetStatusKey;
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}[] = [
  { key: "original", label: "원본", bgColor: "#E9E9E9", borderColor: "#454545", textColor: "#454545" },
  { key: "updated", label: "업데이트됨", bgColor: "#FFEAD2", borderColor: "#EA8445", textColor: "#EA8445" },
];

const SUB_TYPE_OPTIONS: {
  key: OnStreetSubTypeKey;
  label: string;
  fill: string;
  hasX: boolean;
}[] = [
  { key: "on_street_legal_day", label: "합법 주간", fill: "#FFDA09", hasX: false },
  { key: "on_street_illegal_day", label: "불법 주간", fill: "#FFDA09", hasX: true },
  { key: "on_street_legal_night", label: "합법 야간", fill: "#2D2D2D", hasX: false },
  { key: "on_street_illegal_night", label: "불법 야간", fill: "#2D2D2D", hasX: true },
];

export interface OnStreetFilterResult {
  status: Record<OnStreetStatusKey, boolean>;
  subType: Record<OnStreetSubTypeKey, boolean>;
}

export interface OnStreetCompletedFilterResult {
  subType: Record<OnStreetSubTypeKey, boolean>;
}

// Small circle indicator matching the map marker style
function CircleIndicatorSmall({ fill, hasX }: { fill: string; hasX: boolean }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12">
      <Circle cx={6} cy={6} r={6} fill={fill} />
      {hasX && (
        <>
          <Line x1={4} y1={4} x2={8} y2={8} stroke="#FF4040" strokeWidth={1.5} strokeLinecap="round" />
          <Line x1={8} y1={4} x2={4} y2={8} stroke="#FF4040" strokeWidth={1.5} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

interface OnStreetSortBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (filters: OnStreetFilterResult) => void;
}

const ANIMATION_DURATION = 300;

/**
 * Sort/filter bottom sheet for On-Street (노상) survey zone screen.
 * Includes 상태 filter (원본/업데이트됨) + 주차 유형 filter (4 sub-types)
 */
export function OnStreetSortBottomSheet({ visible, onClose, onSearch }: OnStreetSortBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(300);
  const backdropOpacity = useSharedValue(0);
  const isClosingRef = useRef(false);

  const [statusFilters, setStatusFilters] = useState<Record<OnStreetStatusKey, boolean>>({
    ...ON_STREET_STATUS_DEFAULT,
  });
  const [subTypeFilters, setSubTypeFilters] = useState<Record<OnStreetSubTypeKey, boolean>>({
    ...ON_STREET_SUB_TYPE_DEFAULT,
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

  const toggleStatus = (key: OnStreetStatusKey) => {
    setStatusFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSubType = (key: OnStreetSubTypeKey) => {
    setSubTypeFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReset = () => {
    setStatusFilters({ ...ON_STREET_STATUS_DEFAULT });
    setSubTypeFilters({ ...ON_STREET_SUB_TYPE_DEFAULT });
    onSearch({ status: { ...ON_STREET_STATUS_DEFAULT }, subType: { ...ON_STREET_SUB_TYPE_DEFAULT } });
    handleClose();
  };

  const handleSearch = () => {
    onSearch({ status: statusFilters, subType: subTypeFilters });
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

        {/* Parking sub-type section */}
        <View style={styles.divider} />
        <View style={styles.titleRow}>
          <Text style={styles.title}>주차 유형</Text>
        </View>
        <View style={styles.parkingTypeSection}>
          {SUB_TYPE_OPTIONS.map((option) => {
            const checked = subTypeFilters[option.key];
            return (
              <Pressable
                key={option.key}
                style={styles.parkingTypeRow}
                onPress={() => toggleSubType(option.key)}
                hitSlop={{ top: 4, bottom: 4 }}
              >
                <View style={styles.parkingTypeLabelRow}>
                  <CircleIndicatorSmall fill={option.fill} hasX={option.hasX} />
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

interface OnStreetCompletedSortBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (filters: OnStreetCompletedFilterResult) => void;
}

/**
 * Sort/filter bottom sheet for On-Street (노상) completed tab.
 * Only includes 주차 유형 filter (4 on-street sub-types)
 */
export function OnStreetCompletedSortBottomSheet({ visible, onClose, onSearch }: OnStreetCompletedSortBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(300);
  const backdropOpacity = useSharedValue(0);
  const isClosingRef = useRef(false);

  const [subTypeFilters, setSubTypeFilters] = useState<Record<OnStreetSubTypeKey, boolean>>({
    ...ON_STREET_SUB_TYPE_DEFAULT,
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

  const toggleSubType = (key: OnStreetSubTypeKey) => {
    setSubTypeFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReset = () => {
    setSubTypeFilters({ ...ON_STREET_SUB_TYPE_DEFAULT });
    onSearch({ subType: { ...ON_STREET_SUB_TYPE_DEFAULT } });
    handleClose();
  };

  const handleSearch = () => {
    onSearch({ subType: subTypeFilters });
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

        {/* Parking sub-type section */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>주차 유형</Text>
        </View>
        <View style={styles.parkingTypeSection}>
          {SUB_TYPE_OPTIONS.map((option) => {
            const checked = subTypeFilters[option.key];
            return (
              <Pressable
                key={option.key}
                style={styles.parkingTypeRow}
                onPress={() => toggleSubType(option.key)}
                hitSlop={{ top: 4, bottom: 4 }}
              >
                <View style={styles.parkingTypeLabelRow}>
                  <CircleIndicatorSmall fill={option.fill} hasX={option.hasX} />
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
