import { useRef } from "react";
import { View, TextInput, Pressable, StyleSheet, StyleProp, TextStyle, ViewStyle } from "react-native";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import { Text } from "./Text";

type ControllerTextInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  editable?: boolean;
  placeholder?: string;
  keyboardType?: "default" | "number-pad" | "phone-pad";
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

// React Hook Form wrapper for a TextInput with optional label
export function ControllerTextInput<T extends FieldValues>({
  control,
  name,
  label,
  editable = true,
  placeholder,
  keyboardType,
  style,
  containerStyle,
  labelStyle,
}: ControllerTextInputProps<T>) {
  const inputRef = useRef<TextInput>(null);

  const input = (
    <Pressable onPress={() => inputRef.current?.focus()} hitSlop={16}>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput
            ref={inputRef}
            style={[styles.input, !editable && styles.disabledInput, style]}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor="#BDBDBD"
            editable={editable}
            keyboardType={keyboardType}
          />
        )}
      />
    </Pressable>
  );

  if (!label) {
    if (containerStyle) {
      return <View style={containerStyle}>{input}</View>;
    }
    return input;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      {input}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "48.5%",
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#454545",
    marginBottom: 4,
    lineHeight: 18,
  },
  input: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F8F8F8",
    backgroundColor: "#F8F8F8",
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 14,
    fontWeight: "400" as const,
    color: "#151515",
  },
  disabledInput: {
    borderColor: "#E9E9E9",
    backgroundColor: "#FFFFFF",
    color: "#151515",
  },
});
