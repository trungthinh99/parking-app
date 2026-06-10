import { ActivityIndicator, Pressable, ViewStyle } from "react-native";
import { Text } from "./Text";

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ title, onPress, disabled, loading, style }: PrimaryButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: 44,
          borderRadius: 22,
          backgroundColor: "#238AAF",
          alignItems: "center",
          justifyContent: "center",
          opacity: isDisabled ? 0.5 : pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>{title}</Text>
      )}
    </Pressable>
  );
}
