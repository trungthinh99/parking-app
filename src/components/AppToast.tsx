import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TickCircle, CloseCircle, InfoCircle } from "iconsax-react-native";

import { Text } from "@/src/components/Text";

export type ToastType = "success" | "error" | "info";

export interface ToastConfig {
  message: string;
  type?: ToastType;
  /** Duration in milliseconds before auto-dismiss (default: 3000) */
  duration?: number;
}

interface AppToastProps {
  config: ToastConfig | null;
  onDismiss: () => void;
}

const SLIDE_DURATION = 300;
const DEFAULT_DISPLAY_DURATION = 3000;
const HIDDEN_TRANSLATE_Y = -120;
// Distance the user must drag up to trigger dismiss
const SWIPE_DISMISS_THRESHOLD = 20;

// Color presets per toast type
const TOAST_COLORS: Record<ToastType, { bg: string; icon: string; text: string }> = {
  success: { bg: "#FFFFFF", icon: "#10A571", text: "#10A571" },
  error: { bg: "#FFFFFF", icon: "#D32F2F", text: "#D32F2F" },
  info: { bg: "#FFFFFF", icon: "#238AAF", text: "#238AAF" },
};

/**
 * Global toast notification component.
 * Renders as an absolute-positioned overlay. The container is non-interactive
 * (pointerEvents="box-none") so taps pass through, but the toast pill itself
 * captures swipe-up gestures so the user can dismiss it instantly.
 * Slides in from the top and auto-dismisses after a configurable duration.
 */
export function AppToast({ config, onDismiss }: AppToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(HIDDEN_TRANSLATE_Y);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!config) {
      translateY.value = HIDDEN_TRANSLATE_Y;
      opacity.value = 0;
      return;
    }

    const displayDuration = config.duration ?? DEFAULT_DISPLAY_DURATION;
    const totalDuration = SLIDE_DURATION + displayDuration + SLIDE_DURATION;

    // Slide in → hold → slide out (sequential)
    translateY.value = withSequence(
      withTiming(0, { duration: SLIDE_DURATION, easing: Easing.out(Easing.cubic) }),
      withDelay(
        displayDuration,
        withTiming(HIDDEN_TRANSLATE_Y, { duration: SLIDE_DURATION, easing: Easing.in(Easing.cubic) })
      )
    );

    opacity.value = withSequence(
      withTiming(1, { duration: SLIDE_DURATION }),
      withDelay(displayDuration, withTiming(0, { duration: SLIDE_DURATION }))
    );

    // Dismiss from JS side after the full animation completes
    const timer = setTimeout(onDismiss, totalDuration);
    return () => clearTimeout(timer);
  }, [config, translateY, opacity, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  // Swipe-up-to-dismiss gesture. Cancels the running auto-dismiss animation,
  // tracks the finger upward, and on release either snaps back or animates out.
  const panGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .onStart(() => {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
    })
    .onUpdate((event) => {
      // Only respond to upward drags; clamp downward drags to 0
      const next = Math.min(0, event.translationY);
      translateY.value = next;
      // Fade out proportionally as the toast moves up
      const progress = Math.min(1, Math.abs(next) / Math.abs(HIDDEN_TRANSLATE_Y));
      opacity.value = 1 - progress;
    })
    .onEnd((event) => {
      const movedFarEnough = event.translationY < -SWIPE_DISMISS_THRESHOLD;
      const flickedUp = event.velocityY < -300;
      if (movedFarEnough || flickedUp) {
        translateY.value = withTiming(HIDDEN_TRANSLATE_Y, {
          duration: SLIDE_DURATION / 2,
          easing: Easing.in(Easing.cubic),
        });
        opacity.value = withTiming(0, { duration: SLIDE_DURATION / 2 }, (finished) => {
          if (finished) scheduleOnRN(onDismiss);
        });
      } else {
        translateY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
        opacity.value = withTiming(1, { duration: 200 });
      }
    });

  if (!config) return null;

  const colors = TOAST_COLORS[config.type ?? "success"];
  const toastType = config.type ?? "success";

  const IconComponent =
    toastType === "success" ? TickCircle : toastType === "error" ? CloseCircle : InfoCircle;

  return (
    <Animated.View
      style={[styles.container, { paddingTop: insets.top + 8 }, animatedStyle]}
      pointerEvents="box-none"
    >
      <GestureDetector gesture={panGesture}>
        <View style={[styles.toast, { backgroundColor: colors.bg }]}>
          <IconComponent size={20} color={colors.icon} variant="Linear" />
          <Text style={[styles.message, { color: colors.text }]}>{config.message}</Text>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: "#151515",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  message: {
    fontSize: 16,
    fontWeight: "400",
    letterSpacing: -0.352,
    lineHeight: 22.4,
  },
});
