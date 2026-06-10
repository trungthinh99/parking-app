import React, { useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Gallery, Camera } from "iconsax-react-native";
import { Text } from "@/src/components/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AvatarUploadBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onPickFromLibrary: () => void;
  onTakePhoto: () => void;
}

const ANIMATION_DURATION = 300;

/**
 * Bottom sheet for avatar upload options (photo library / take photo)
 * Features a blurred backdrop matching the Figma design
 */
export function AvatarUploadBottomSheet({
  visible,
  onClose,
  onPickFromLibrary,
  onTakePhoto,
}: AvatarUploadBottomSheetProps) {
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
    backdropOpacity.value = withTiming(0, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.ease),
    });

    setTimeout(() => {
      onClose();
    }, ANIMATION_DURATION);
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
          {/* Photo library option */}
          <Pressable
            style={styles.optionRow}
            onPress={() => {
              onPickFromLibrary();
              handleClose();
            }}
            android_ripple={{ color: "rgba(0,0,0,0.05)" }}
          >
            <Gallery size={20} color="#151515" variant="Linear" />
            <Text style={styles.optionText}>사진 보관함</Text>
          </Pressable>

          {/* Take photo option */}
          <Pressable
            style={styles.optionRow}
            onPress={() => {
              onTakePhoto();
              handleClose();
            }}
            android_ripple={{ color: "rgba(0,0,0,0.05)" }}
          >
            <Camera size={20} color="#151515" variant="Linear" />
            <Text style={styles.optionText}>사진 찍기</Text>
          </Pressable>
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
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
    letterSpacing: -0.308,
    lineHeight: 19.6,
  },
});
