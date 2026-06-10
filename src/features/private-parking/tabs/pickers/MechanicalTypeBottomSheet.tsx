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

// Available mechanical parking type options
const MECHANICAL_TYPE_OPTIONS = ["2단식", "다단식", "수평순환식", "수직순환식", "기타"] as const;
export type MechanicalTypeOption = (typeof MECHANICAL_TYPE_OPTIONS)[number];

// Map between mechanical type label and numeric code stored on backend.
// 1: 2단식, 2: 다단식, 3: 수평순환식, 4: 수직순환식, 5: 기타 (with free-text mechCount).
// Code 0 is reserved for "no selection" — loaded as an empty label so nothing is shown.
const MECH_TYPE_LABEL_TO_CODE: Record<MechanicalTypeOption, string> = {
  "2단식": "1",
  "다단식": "2",
  "수평순환식": "3",
  "수직순환식": "4",
  "기타": "5",
};
const MECH_TYPE_CODE_TO_LABEL: Record<string, MechanicalTypeOption> = {
  "1": "2단식",
  "2": "다단식",
  "3": "수평순환식",
  "4": "수직순환식",
  "5": "기타",
};

/**
 * Convert backend numeric code to UI label.
 * Returns "" for null/empty/"0" — code 0 means no selection, per product spec.
 */
export function mechTypeCodeToLabel(code: string | null | undefined): string {
  if (code == null) return "";
  const trimmed = String(code).trim();
  if (trimmed === "" || trimmed === "0") return "";
  return MECH_TYPE_CODE_TO_LABEL[trimmed] ?? "";
}

/**
 * Convert UI label to backend numeric code string.
 * Returns null for empty label so backend stores NULL.
 */
export function mechTypeLabelToCode(label: string | null | undefined): string | null {
  if (!label) return null;
  return MECH_TYPE_LABEL_TO_CODE[label as MechanicalTypeOption] ?? null;
}

interface MechanicalTypeBottomSheetProps {
  visible: boolean;
  selectedValue: MechanicalTypeOption;
  onClose: () => void;
  onSelect: (value: MechanicalTypeOption) => void;
}

const ANIMATION_DURATION = 300;

/**
 * Bottom sheet for selecting mechanical parking type (기계식 유형)
 * Uses the same blur backdrop pattern as MainUseBottomSheet
 */
export function MechanicalTypeBottomSheet({
  visible,
  selectedValue,
  onClose,
  onSelect,
}: MechanicalTypeBottomSheetProps) {
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
          {MECHANICAL_TYPE_OPTIONS.map((option) => (
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
