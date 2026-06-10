import React, { useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Text } from "@/src/components/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Available parking zone options
const PARKING_ZONE_OPTIONS = ["1급지", "2급지", "3급지", "4급지", "5급지"] as const;
export type ParkingZoneOption = (typeof PARKING_ZONE_OPTIONS)[number];

interface ParkingZoneBottomSheetProps {
  visible: boolean;
  selectedValue: ParkingZoneOption;
  onClose: () => void;
  onSelect: (value: ParkingZoneOption) => void;
}

const ANIMATION_DURATION = 300;

/**
 * Bottom sheet for selecting parking zone (주차 급지)
 * Uses the same blur backdrop pattern as MainUseBottomSheet
 */
export function ParkingZoneBottomSheet({
  visible,
  selectedValue,
  onClose,
  onSelect,
}: ParkingZoneBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(200);
  const backdropOpacity = useSharedValue(0);
  const isClosingRef = useRef(false);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    translateY.value = withTiming(200, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.ease),
    });
    backdropOpacity.value = withTiming(
      0,
      {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
      },
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
      <Animated.View style={[styles.sheet, sheetAnimatedStyle, { paddingBottom: insets.bottom }]}>
        {/* Drag handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {PARKING_ZONE_OPTIONS.map((option) => (
            <Pressable
              key={option}
              style={styles.optionRow}
              onPress={() => {
                onSelect(option);
                handleClose();
              }}
              android_ripple={{ color: "rgba(0,0,0,0.05)" }}
            >
              <Text
                style={[styles.optionText, selectedValue === option && styles.optionTextSelected]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
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
    backgroundColor: "rgba(21, 21, 21, 0.6)",
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
    marginBottom: 8,
  },
  handle: {
    width: 50,
    height: 6,
    borderRadius: 100,
    backgroundColor: "#E9E9E9",
  },

  // Options
  optionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
    alignItems: "center",
  },
  optionRow: {
    alignItems: "center",
    width: "100%",
  },
  optionText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
    letterSpacing: -0.308,
    lineHeight: 19.6,
  },
  optionTextSelected: {
    color: "#238AAF",
    fontWeight: "600",
  },
});
