import { ActivityIndicator, Pressable, ViewStyle } from "react-native";
import { Text } from "./Text";

type InlineButtonVariant = "primary" | "secondary" | "outline";

type InlineButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  size?: "sm" | "md" | "lg";
  variant?: InlineButtonVariant;
};

const SIZE_CONFIG = {
  sm: { height: 28, fontSize: 12, paddingHorizontal: 10, borderRadius: 6 },
  md: { height: 32, fontSize: 14, paddingHorizontal: 12, borderRadius: 8 },
  lg: { height: 40, fontSize: 16, paddingHorizontal: 14, borderRadius: 8 },
};

const VARIANT_CONFIG: Record<
  InlineButtonVariant,
  { backgroundColor: string; textColor: string; borderColor?: string; borderWidth?: number }
> = {
  primary: { backgroundColor: "#238AAF", textColor: "#FFFFFF" },
  secondary: { backgroundColor: "#f4f4f4", textColor: "#151515" },
  outline: {
    backgroundColor: "#FFFFFF",
    textColor: "#151515",
    borderColor: "#454545",
    borderWidth: 1,
  },
};

export function InlineButton({
  title,
  onPress,
  disabled,
  loading,
  style,
  size = "md",
  variant = "primary",
}: InlineButtonProps) {
  const isDisabled = disabled || loading;
  const sizeStyle = SIZE_CONFIG[size];
  const variantStyle = VARIANT_CONFIG[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: sizeStyle.height,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          borderRadius: sizeStyle.borderRadius,
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
          borderWidth: variantStyle.borderWidth ?? 0,
          alignItems: "center",
          justifyContent: "center",
          opacity: isDisabled ? 0.5 : pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.textColor} size="small" />
      ) : (
        <Text
          style={{
            color: variantStyle.textColor,
            fontSize: sizeStyle.fontSize,
            fontWeight: "600",
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
