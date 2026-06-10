import { View } from "react-native";
import { Control, Controller, FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { Checkbox } from "./Checkbox";
import { Text } from "./Text";

type ControllerCheckboxProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
  rules?: Omit<
    RegisterOptions<T, FieldPath<T>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
};

// React Hook Form wrapper for the Checkbox component
export function ControllerCheckbox<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  rules,
}: ControllerCheckboxProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={{ rowGap: 4 }}>
          <Checkbox label={label} value={!!value} onChange={onChange} disabled={disabled} />
          {error?.message ? (
            <Text style={{ fontSize: 12, color: "#FF3337" }}>{error.message}</Text>
          ) : null}
        </View>
      )}
    />
  );
}
