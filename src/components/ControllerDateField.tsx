import { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Keyboard } from "react-native";
import { Calendar } from "iconsax-react-native";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import dayjs from "@/src/lib/dayjs";
import { Text } from "./Text";
import { CalendarBottomSheet } from "./CalendarBottomSheet";

type ControllerDateFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  editable?: boolean;
  /** Date display format (default: "YYYY.MM.DD") */
  format?: string;
};

// React Hook Form wrapper for a date picker field with built-in calendar
export function ControllerDateField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  editable = true,
  format = "YYYY.MM.DD",
}: ControllerDateFieldProps<T>) {
  const [calendarVisible, setCalendarVisible] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => {
        const selectedDate = value ? dayjs(value, format) : null;

        return (
          <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
              style={[styles.input, !editable && styles.disabledInput]}
              onPress={() => {
                Keyboard.dismiss();
                setCalendarVisible(true);
              }}
              activeOpacity={0.7}
              disabled={!editable}
            >
              <Text style={[styles.value, !value && placeholder && styles.placeholder]}>
                {value || placeholder}
              </Text>
              <Calendar size={14} color="#BDBDBD" variant="Linear" />
            </TouchableOpacity>

            <CalendarBottomSheet
              visible={calendarVisible}
              selectedDate={selectedDate?.isValid() ? selectedDate : null}
              onClose={() => setCalendarVisible(false)}
              onConfirm={(date) => {
                onChange(date.format(format));
              }}
            />
          </View>
        );
      }}
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
