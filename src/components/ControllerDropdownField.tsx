import { View, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, Keyboard } from "react-native";
import { ArrowDown2 } from "iconsax-react-native";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import { Text } from "./Text";

export type ControllerDropdownFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  editable?: boolean;
  onPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
};

// React Hook Form wrapper for a dropdown field
export function ControllerDropdownField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  editable = true,
  onPress,
  containerStyle,
}: ControllerDropdownFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value } }) => (
        <View style={[styles.container, containerStyle]}>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          <TouchableOpacity
            style={[styles.input, !editable && styles.disabledInput]}
            onPress={() => {
              Keyboard.dismiss();
              onPress?.();
            }}
            activeOpacity={0.7}
            disabled={!editable || !onPress}
          >
            <Text style={[styles.value, !value && placeholder && styles.placeholder]}>
              {value || placeholder}
            </Text>
            <ArrowDown2 size={14} color="#BDBDBD" variant="Linear" />
          </TouchableOpacity>
        </View>
      )}
    />
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
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F8F8F8",
    backgroundColor: "#F8F8F8",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 4,
  },
  disabledInput: {
    borderColor: "#E9E9E9",
    backgroundColor: "#FFFFFF",
    color: "#151515",
  },
  value: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
    flex: 1,
  },
  placeholder: {
    color: "#BDBDBD",
  },
});
