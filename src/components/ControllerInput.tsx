import { ReactNode, useEffect } from "react";
import { Control, Controller, FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { TextInputProps } from "react-native";
import { Input } from "./Input";

type ControllerInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  placeholder: string;
  label?: string;
  labelBold?: boolean;
  required?: boolean;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  keyboardType?: "default" | "number-pad" | "phone-pad";
  maxLength?: number;
  right?: ReactNode;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  onFocus?: () => void;
  hideError?: boolean;
  onErrorChange?: (error: string | undefined) => void;
  /** Transform the raw input value before storing it in form state */
  formatValue?: (value: string) => string;
  rules?: Omit<
    RegisterOptions<T, FieldPath<T>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
};

function ControllerInputInner({
  value,
  onChange,
  errorMessage,
  placeholder,
  label,
  labelBold,
  required,
  autoCapitalize,
  keyboardType,
  maxLength,
  right,
  size,
  editable,
  onFocus,
  hideError,
  onErrorChange,
}: {
  value: string;
  onChange: (text: string) => void;
  errorMessage: string | undefined;
  placeholder: string;
  label?: string;
  labelBold?: boolean;
  required?: boolean;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  keyboardType?: "default" | "number-pad" | "phone-pad";
  maxLength?: number;
  right?: ReactNode;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  onFocus?: () => void;
  hideError?: boolean;
  onErrorChange?: (error: string | undefined) => void;
}) {
  useEffect(() => {
    onErrorChange?.(errorMessage);
  }, [errorMessage, onErrorChange]);

  return (
    <Input
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      label={label}
      labelBold={labelBold}
      required={required}
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
      maxLength={maxLength}
      right={right}
      size={size}
      editable={editable}
      onFocus={onFocus}
      error={errorMessage}
      hideError={hideError}
    />
  );
}

export function ControllerInput<T extends FieldValues>({
  control,
  name,
  placeholder,
  label,
  labelBold,
  required,
  autoCapitalize,
  keyboardType,
  maxLength,
  right,
  size,
  editable,
  onFocus,
  hideError,
  onErrorChange,
  formatValue,
  rules,
}: ControllerInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <ControllerInputInner
          value={value}
          onChange={(text) => {
            onChange(formatValue ? formatValue(text) : text);
          }}
          errorMessage={error?.message}
          placeholder={placeholder}
          label={label}
          labelBold={labelBold}
          required={required}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          maxLength={maxLength}
          right={right}
          size={size}
          editable={editable}
          onFocus={onFocus}
          hideError={hideError}
          onErrorChange={onErrorChange}
        />
      )}
    />
  );
}
