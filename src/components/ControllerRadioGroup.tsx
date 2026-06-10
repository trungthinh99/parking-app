import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import { Text } from "./Text";

type ControllerRadioGroupProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  options: string[];
  disabled?: boolean;
};

// React Hook Form wrapper for a radio button group
export function ControllerRadioGroup<T extends FieldValues>({
  control,
  name,
  options,
  disabled,
}: ControllerRadioGroupProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <View style={styles.radioGroup}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.radioRow}
              onPress={() => onChange(option)}
              activeOpacity={0.7}
              disabled={disabled}
              hitSlop={12}
            >
              <View
                style={[
                  styles.radioOuter,
                  value === option && styles.radioOuterSelected,
                  disabled && value !== option && styles.radioOuterDisabled,
                ]}
              >
                {value === option && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  radioGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: "#454545",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: "#238AAF",
  },
  radioOuterDisabled: {
    borderColor: "#BDBDBD",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#238AAF",
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
  },
});
