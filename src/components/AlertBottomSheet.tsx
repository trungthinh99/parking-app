import React, { useCallback, useEffect, useRef } from "react";
import { Image, ImageSourcePropType, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Warning2 } from "iconsax-react-native";
import { Text } from "@/src/components/Text";
import { InlineButton } from "@/src/components/InlineButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Single button configuration for AlertBottomSheet
 */
interface AlertButton {
  /** Button label */
  label: string;
  /** Called when button is pressed */
  onPress: () => void;
  /** Visual style: secondary (outlined) or primary (filled) */
  variant?: "primary" | "secondary" | "outline";
  /** Show loading spinner on this button */
  loading?: boolean;
}

interface AlertBottomSheetProps {
  /** Controls visibility */
  visible: boolean;
  /** Alert message displayed in the center of the sheet */
  message: string;
  /** Optional icon image rendered above the message */
  icon?: ImageSourcePropType;
  /**
   * Button configuration.
   * - 1 button: renders full-width
   * - 2 buttons (default): cancel on left, confirm on right
   */
  buttons?: [AlertButton] | [AlertButton, AlertButton];
  /** Called after close animation completes */
  onClose: () => void;
}

const ANIMATION_DURATION = 300;

const DEFAULT_CANCEL_BUTTON: AlertButton = {
  label: "취소",
  onPress: () => {},
  variant: "secondary",
};

const DEFAULT_CONFIRM_BUTTON: AlertButton = {
  label: "확인",
  onPress: () => {},
  variant: "primary",
};

/**
 * Reusable bottom sheet alert with optional icon, configurable message,
 * and 1 or 2 action buttons (defaults to 취소 / 확인).
 */
export function AlertBottomSheet({
  visible,
  message,
  icon,
  buttons,
  onClose,
}: AlertBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(300);
  const backdropOpacity = useSharedValue(0);
  const isClosingRef = useRef(false);

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

  if (!visible) return null;

  // Resolve button list: use provided buttons or fall back to default two-button layout
  const resolvedButtons: [AlertButton] | [AlertButton, AlertButton] =
    buttons ??
    [
      { ...DEFAULT_CANCEL_BUTTON, onPress: handleClose },
      DEFAULT_CONFIRM_BUTTON,
    ];

  const isSingleButton = resolvedButtons.length === 1;

  const makeButtonPressHandler = (btn: AlertButton) => () => {
    btn.onPress();
    handleClose();
  };

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
        style={[
          styles.sheet,
          sheetAnimatedStyle,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {icon ? (
            <Image source={icon} style={styles.icon} resizeMode="contain" />
          ) : (
            <Warning2 size={44} color="#F59E0B" variant="Bold" />
          )}
          <Text style={styles.message}>{message}</Text>
        </View>

        {/* Footer buttons */}
        <View style={[styles.footer, isSingleButton && styles.footerSingle]}>
          {resolvedButtons.map((btn, index) => (
            <InlineButton
              key={index}
              title={btn.label}
              variant={btn.variant ?? (index === 0 && !isSingleButton ? "secondary" : "primary")}
              onPress={makeButtonPressHandler(btn)}
              loading={btn.loading}
              style={styles.footerButton}
              size="lg"
            />
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

  // Content
  content: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
    gap: 16,
  },
  icon: {
    width: 44,
    height: 44,
  },
  message: {
    fontSize: 18,
    fontWeight: "600",
    color: "#151515",
    letterSpacing: -0.396,
    textAlign: "center",
  },

  // Footer
  footer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
  },
  footerSingle: {
    justifyContent: "center",
  },
  footerButton: {
    flex: 1,
  },
});
