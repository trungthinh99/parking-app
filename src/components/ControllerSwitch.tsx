import { Platform, Pressable, StyleSheet } from "react-native";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { useEffect } from "react";

const TRACK_WIDTH = 36;
const TRACK_HEIGHT = 20;
const THUMB_SIZE = 16;
const TRACK_PADDING = 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - TRACK_PADDING * 2;

const TRACK_OFF_COLOR = "#B8B8B8";
const TRACK_ON_COLOR = "#238AAF";
const THUMB_COLOR = "#FFFFFF";

type ControllerSwitchProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  disabled?: boolean;
};

// Custom cross-platform switch matching iOS-style design
export function CustomSwitch({
  value,
  onValueChange,
  disabled,
}: {
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 200 });
  }, [value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [TRACK_OFF_COLOR, TRACK_ON_COLOR]),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * THUMB_TRAVEL }],
  }));

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      style={[styles.pressable, disabled && styles.disabled]}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View
          style={[
            styles.thumb,
            thumbStyle,
            disabled && Platform.OS === "android" && styles.thumbDisabledAndroid,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

// React Hook Form wrapper for a Switch component
export function ControllerSwitch<T extends FieldValues>({
  control,
  name,
  disabled,
}: ControllerSwitchProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <CustomSwitch value={!!value} onValueChange={onChange} disabled={disabled} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  pressable: {
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: TRACK_PADDING,
    justifyContent: "center",
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: THUMB_COLOR,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  thumbDisabledAndroid: {
    elevation: 0,
  },
});
