import { ReactNode, useRef } from "react";
import { Pressable, TextInput, TextInputProps, View } from "react-native";
import { Text } from "./Text";

type InputVariant = "default" | "dropdown";

type InputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  label?: string;
  labelBold?: boolean;
  required?: boolean;
  keyboardType?: "default" | "number-pad" | "phone-pad";
  maxLength?: number;
  right?: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: InputVariant;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  editable?: boolean;
  onPress?: () => void;
  onFocus?: () => void;
  error?: string;
  hideError?: boolean;
};

const SIZE_CONFIG = {
  sm: { height: 28, fontSize: 12, paddingHorizontal: 10, borderRadius: 6 },
  md: { height: 32, fontSize: 14, paddingHorizontal: 12, borderRadius: 8 },
  lg: { height: 40, fontSize: 16, paddingHorizontal: 14, borderRadius: 8 },
};

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  labelBold = true,
  required,
  keyboardType,
  maxLength,
  right,
  autoCapitalize,
  size = "md",
  variant = "default",
  editable = true,
  onPress,
  onFocus,
  error,
  hideError,
}: InputProps) {
  const sizeStyle = SIZE_CONFIG[size];
  const inputRef = useRef<TextInput>(null);
  const disabled = !editable && !onPress;
  const hasError = !!error;

  const inputElement = (
    <Pressable onPress={() => (onPress ? onPress() : inputRef.current?.focus())} hitSlop={16}>
      <View
        style={{
          height: sizeStyle.height,
          borderRadius: sizeStyle.borderRadius,
          backgroundColor: disabled ? "#E9E9E9" : "#F8F8F8",
          paddingHorizontal: sizeStyle.paddingHorizontal,
          flexDirection: "row",
          alignItems: "center",
          columnGap: 8,
          borderWidth: hasError ? 1 : 0,
          borderColor: hasError ? "#FF3337" : undefined,
        }}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={disabled ? "#8D8D8D" : "#BDBDBD"}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          maxLength={maxLength}
          onFocus={onFocus}
          editable={editable && !onPress}
          style={{
            flex: 1,
            fontSize: sizeStyle.fontSize,
            color: disabled ? "#8D8D8D" : value ? "#151515" : "#BDBDBD",
            fontFamily: "Pretendard-Regular",
            paddingVertical: 0,
            includeFontPadding: false,
          }}
        />
        {right}
      </View>
    </Pressable>
  );

  if (!label) {
    return inputElement;
  }

  return (
    <View style={{ rowGap: 4 }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: labelBold ? "600" : "400",
          color: "#151515",
        }}
      >
        {label}
        {required ? <Text style={{ color: "#FF3337" }}> *</Text> : null}
      </Text>
      {inputElement}
      {error && !hideError ? <Text style={{ fontSize: 12, color: "#FF3337" }}>{error}</Text> : null}
    </View>
  );
}
