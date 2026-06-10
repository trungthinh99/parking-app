import { ReactNode, useRef } from "react";
import { Pressable, TextInput, View } from "react-native";

type TextInputBoxProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "number-pad" | "phone-pad";
  right?: ReactNode;
  size?: "sm" | "md" | "lg";
};

const SIZE_CONFIG = {
  sm: { height: 28, fontSize: 12, paddingHorizontal: 10 },
  md: { height: 32, fontSize: 14, paddingHorizontal: 12 },
  lg: { height: 40, fontSize: 16, paddingHorizontal: 14 },
};

export function TextInputBox({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  right,
  size = "md",
}: TextInputBoxProps) {
  const sizeStyle = SIZE_CONFIG[size];
  const inputRef = useRef<TextInput>(null);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} hitSlop={16}>
      <View
        style={{
          height: sizeStyle.height,
          borderRadius: 10,
          backgroundColor: "#F8F8F8",
          paddingHorizontal: sizeStyle.paddingHorizontal,
          flexDirection: "row",
          alignItems: "center",
          columnGap: 8,
        }}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#BDBDBD"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          style={{
            flex: 1,
            fontSize: sizeStyle.fontSize,
            color: "#151515",
            fontFamily: "Pretendard-Regular",
            paddingVertical: 0,
            includeFontPadding: false,
          }}
        />
        {right}
      </View>
    </Pressable>
  );
}
