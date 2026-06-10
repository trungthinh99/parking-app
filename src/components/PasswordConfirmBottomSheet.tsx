import React, { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";
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
import { PasswordInput } from "@/src/components/PasswordInput";
import { InlineButton } from "@/src/components/InlineButton";

interface PasswordConfirmModalProps {
  /** Controls visibility */
  visible: boolean;
  /** Called after close animation completes */
  onClose: () => void;
  /** Called when user confirms with password */
  onConfirm: (password: string) => void;
  /** Loading state for confirm button */
  loading?: boolean;
  /** Error message to display below the input */
  error?: string;
}

const ANIMATION_DURATION = 250;

/**
 * Modal dialog that prompts the user to enter their password for confirmation.
 * Used before destructive actions like account deletion.
 * Styled consistently with AppModal (centered, scale animation).
 */
export function PasswordConfirmBottomSheet({
  visible,
  onClose,
  onConfirm,
  loading,
  error,
}: PasswordConfirmModalProps) {
  const backdropOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.85);
  const modalOpacity = useSharedValue(0);
  const isClosingRef = useRef(false);
  const [password, setPassword] = useState("");

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
      { duration: ANIMATION_DURATION, easing: Easing.out(Easing.ease) },
      () => {
        runOnJS(onClose)();
      }
    );
  }, [onClose, backdropOpacity, modalScale, modalOpacity]);

  // Reset state when opening
  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      setPassword("");
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

  const handleConfirm = () => {
    if (!password.trim() || loading) return;
    onConfirm(password);
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

      {/* Modal box */}
      <KeyboardAvoidingView
        style={styles.modalCentering}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.modalBox, modalAnimatedStyle]} onStartShouldSetResponder={() => { Keyboard.dismiss(); return false; }}>
          {/* Title */}
          <Text style={styles.title}>비밀번호 확인</Text>

          {/* Description */}
          <Text style={styles.message}>
            프로세스를 완료하려면 비밀번호를 입력해 주세요
          </Text>

          {/* Password input */}
          <View style={styles.inputContainer}>
            <PasswordInput
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호를 입력해 주세요"
              size="md"
              error={error}
              hideError
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <InlineButton
              title="취소"
              variant="secondary"
              onPress={handleClose}
              style={styles.button}
            />
            <InlineButton
              title="확인"
              variant="primary"
              onPress={handleConfirm}
              disabled={!password.trim()}
              loading={loading}
              style={styles.button}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  backdropContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropDimming: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(21, 21, 21, 0.25)",
  },
  modalCentering: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    width: "100%",
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
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#151515",
    textAlign: "center",
    letterSpacing: -0.352,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: "400",
    color: "#454545",
    textAlign: "center",
    letterSpacing: -0.308,
    lineHeight: 20,
    marginBottom: 16,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#FF3337",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
  },
});
