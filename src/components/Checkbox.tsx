import { Pressable, View } from "react-native";
import { Text } from "./Text";

import IconChecked from "@/src/assets/images/icons/icon-checkbox-checked-16.svg";
import IconUnchecked from "@/src/assets/images/icons/icon-checkbox-unchecked-16.svg";

type CheckboxProps = {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** Icon size in pixels (default: 16) */
  size?: number;
};

export function Checkbox({ label, value, onChange, disabled = false, size = 16 }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      disabled={disabled}
      hitSlop={12}
      style={{
        flexDirection: "row",
        alignItems: "center",
        columnGap: 6,
      }}
    >
      <View style={{ opacity: disabled ? 0.5 : 1 }}>
        {value ? <IconChecked width={size} height={size} /> : <IconUnchecked width={size} height={size} />}
      </View>
      <Text style={{ color: "#151515", fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}
