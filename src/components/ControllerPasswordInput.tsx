import { useEffect } from "react";
import { Control, Controller, FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { PasswordInput } from "./PasswordInput";

type ControllerPasswordInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  placeholder: string;
  label?: string;
  labelBold?: boolean;
  required?: boolean;
  maxLength?: number;
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

function ControllerPasswordInputInner({
  value,
  onChange,
  errorMessage,
  placeholder,
  label,
  labelBold,
  required,
  maxLength,
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
  maxLength?: number;
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
    <PasswordInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      label={label}
      labelBold={labelBold}
      required={required}
      maxLength={maxLength}
      size={size}
      editable={editable}
      onFocus={onFocus}
      error={errorMessage}
      hideError={hideError}
    />
  );
}

export function ControllerPasswordInput<T extends FieldValues>({
  control,
  name,
  placeholder,
  label,
  labelBold,
  required,
  maxLength,
  size,
  editable,
  onFocus,
  hideError,
  onErrorChange,
  formatValue,
  rules,
}: ControllerPasswordInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <ControllerPasswordInputInner
          value={value}
          onChange={(text) => {
            onChange(formatValue ? formatValue(text) : text);
          }}
          errorMessage={error?.message}
          placeholder={placeholder}
          label={label}
          labelBold={labelBold}
          required={required}
          maxLength={maxLength}
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
