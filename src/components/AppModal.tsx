import React, { useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, View, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Text } from "@/src/components/Text";

/** Button configuration for modal actions */
export interface AppModalButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

/** Props for the AppModal component */
export interface AppModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AppModalButton[];
  onClose: () => void;
}

const ANIMATION_DURATION = 250;

/**
 * Custom modal component with blur backdrop and scale animation.
 * Replaces native Alert.alert with consistent design across platforms.
 */
export function AppModal({ visible, title, message, buttons, onClose }: AppModalProps) {
  const backdropOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.85);
  const modalOpacity = useSharedValue(0);
  const isClosingRef = useRef(false);

  // Default single button if none provided
  const resolvedButtons: AppModalButton[] =
    buttons && buttons.length > 0 ? buttons : [{ text: "확인" }];

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    backdropOpacity.value = withTiming(0, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.ease),
    });
    modalScale.value = withTiming(0.85, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.ease),
    });
    modalOpacity.value = withTiming(
      0,
      {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
      },
      () => {
        runOnJS(onClose)();
      }
    );
  }, [onClose, backdropOpacity, modalScale, modalOpacity]);

  const handleButtonPress = useCallback(
    (button: AppModalButton) => {
      if (isClosingRef.current) return;
      isClosingRef.current = true;

      backdropOpacity.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
      });
      modalScale.value = withTiming(0.85, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
      });
      modalOpacity.value = withTiming(
        0,
        {
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.ease),
        },
        () => {
          if (button.onPress) {
            runOnJS(button.onPress)();
          }
          runOnJS(onClose)();
        }
      );
    },
    [onClose, backdropOpacity, modalScale, modalOpacity]
  );

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      backdropOpacity.value = withTiming(1, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
      });
      modalOpacity.value = withTiming(1, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
      });
      modalScale.value = withSpring(1, {
        damping: 18,
        stiffness: 300,
        mass: 0.8,
      });
    }
  }, [visible, backdropOpacity, modalScale, modalOpacity]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
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

      {/* Modal box */}
      <View style={styles.modalCentering} pointerEvents="box-none">
        <Animated.View style={[styles.modalBox, modalAnimatedStyle]}>
          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View
            style={[
              styles.buttonContainer,
              resolvedButtons.length === 1 && styles.buttonContainerSingle,
            ]}
          >
            {resolvedButtons.map((button, index) => {
              const isCancel = button.style === "cancel";
              const isDestructive = button.style === "destructive";

              return (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.button,
                    resolvedButtons.length > 1 && styles.buttonMultiple,
                    isCancel && styles.buttonCancel,
                    !isCancel && !isDestructive && styles.buttonDefault,
                    isDestructive && styles.buttonDestructive,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => handleButtonPress(button)}
                  android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel && styles.buttonTextCancel,
                      !isCancel && !isDestructive && styles.buttonTextDefault,
                      isDestructive && styles.buttonTextDestructive,
                    ]}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },

  // Backdrop with blur
  backdropContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropDimming: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(21, 21, 21, 0.25)",
  },

  // Modal centering
  modalCentering: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },

  // Modal box
  modalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    width: "100%",
    maxWidth: 320,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },

  // Title
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#151515",
    textAlign: "center",
    letterSpacing: -0.352,
    marginBottom: 8,
  },

  // Message
  message: {
    fontSize: 14,
    fontWeight: "400",
    color: "#454545",
    textAlign: "center",
    letterSpacing: -0.308,
    lineHeight: 20,
    marginBottom: 20,
  },

  // Buttons
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  buttonContainerSingle: {
    justifyContent: "center",
  },
  button: {
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonMultiple: {
    flex: 1,
  },
  buttonDefault: {
    backgroundColor: "#238AAF",
  },
  buttonCancel: {
    backgroundColor: "#F4F4F4",
  },
  buttonDestructive: {
    backgroundColor: "#FF3337",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.308,
  },
  buttonTextDefault: {
    color: "#FFFFFF",
  },
  buttonTextCancel: {
    color: "#454545",
  },
  buttonTextDestructive: {
    color: "#FFFFFF",
  },
});
