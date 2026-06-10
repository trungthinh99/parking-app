import { ReactNode } from "react";
import { View } from "react-native";
import { Text } from "./Text";

type LabeledFieldProps = {
  label: string;
  required?: boolean;
  children: ReactNode;
};

export function LabeledField({ label, required, children }: LabeledFieldProps) {
  return (
    <View style={{ rowGap: 4 }}>
      <Text style={{ fontSize: 14, fontWeight: "600", color: "#151515" }}>
        {label}
        {required ? <Text style={{ color: "#FF3337" }}> *</Text> : null}
      </Text>
      {children}
    </View>
  );
}
