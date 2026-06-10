import { useRef, useState } from "react";
import {
  Platform,
  Pressable,
  TextInput,
  type TextInput as TextInputType,
  View,
} from "react-native";
import { Eye, EyeSlash } from "iconsax-react-native";
import { Text } from "./Text";

type PasswordInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  label?: string;
  labelBold?: boolean;
  required?: boolean;
  maxLength?: number;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  onFocus?: () => void;
  error?: string;
  hideError?: boolean;
};

const SIZE_CONFIG = {
  sm: { height: 28, fontSize: 12, paddingHorizontal: 10, borderRadius: 6 },
  md: { height: 32, fontSize: 14, paddingHorizontal: 12, borderRadius: 8 },
  lg: { height: 40, fontSize: 16, paddingHorizontal: 14, borderRadius: 8 },
};

const MASK_CHAR = "\u2022"; // bullet character

export function PasswordInput({
  value,
  onChangeText,
  placeholder,
  label,
  labelBold = true,
  required,
  maxLength,
  size = "md",
  editable = true,
  onFocus,
  error,
  hideError,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  // Track whether secureTextEntry was ever toggled (show then hide)
  const [hasToggled, setHasToggled] = useState(false);
  const inputRef = useRef<TextInputType>(null);
  const sizeStyle = SIZE_CONFIG[size];
  const disabled = !editable;
  const hasError = !!error && !hideError;

  // On iOS, once user has toggled visibility, we use manual masking
  // to avoid the native UITextField clear-on-edit bug
  const useManualMask = Platform.OS === "ios" && hasToggled && !visible;

  const handleToggle = () => {
    setVisible((v) => {
      if (v) {
        // Switching from show to hide — mark as toggled
        setHasToggled(true);
      }
      return !v;
    });
  };

  const handleChangeText = (text: string) => {
    if (!useManualMask) {
      onChangeText(text);
      return;
    }

    // Manual mask mode: the displayed text is masked bullets.
    // We need to figure out what the user actually typed/deleted.
    const maskedLen = value.length;
    const newLen = text.length;

    if (newLen < maskedLen) {
      // User deleted characters — remove from the end of real value
      onChangeText(value.slice(0, newLen));
    } else if (newLen > maskedLen) {
      // User typed new characters — appended after masked portion
      const added = text.slice(maskedLen);
      onChangeText(value + added);
    }
    // If same length, it's likely a no-op or replacement with mask chars — ignore
  };

  const displayValue = useManualMask ? MASK_CHAR.repeat(value.length) : value;

  const inputElement = (
    <Pressable onPress={() => inputRef.current?.focus()} hitSlop={16}>
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
          value={displayValue}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={disabled ? "#8D8D8D" : "#BDBDBD"}
          secureTextEntry={!visible && !useManualMask}
          maxLength={maxLength}
          onFocus={onFocus}
          editable={editable}
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          style={{
            flex: 1,
            fontSize: sizeStyle.fontSize,
            color: disabled ? "#8D8D8D" : value ? "#151515" : "#BDBDBD",
            fontFamily: "Pretendard-Regular",
            paddingVertical: 0,
            includeFontPadding: false,
          }}
        />
        <Pressable
          accessibilityRole="button"
          onPress={handleToggle}
          hitSlop={10}
        >
          {visible ? (
            <Eye size={16} color="#BDBDBD" variant="Linear" />
          ) : (
            <EyeSlash size={16} color="#BDBDBD" variant="Linear" />
          )}
        </Pressable>
      </View>
    </Pressable>
  );

  const errorElement =
    error && !hideError ? (
      <Text style={{ fontSize: 12, color: "#FF3337" }}>{error}</Text>
    ) : null;

  if (!label) {
    if (!errorElement) {
      return inputElement;
    }
    return (
      <View style={{ rowGap: 4 }}>
        {inputElement}
        {errorElement}
      </View>
    );
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
      {errorElement}
    </View>
  );
}
