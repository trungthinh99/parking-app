import React from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Text } from "@/src/components/Text";

export type SurveyFilterType = "pending" | "completed";

interface SurveyFilterToggleProps {
  value: SurveyFilterType;
  onChange: (value: SurveyFilterType) => void;
  style?: ViewStyle;
}

/**
 * Toggle component for filtering survey status
 * Shows "조사예정" (pending) and "조사완료" (completed) options
 */
export function SurveyFilterToggle({ value, onChange, style }: SurveyFilterToggleProps) {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.option, value === "pending" && styles.optionActive]}
        onPress={() => onChange("pending")}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, value === "pending" && styles.textActive]}>조사예정</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.option, value === "completed" && styles.optionActive]}
        onPress={() => onChange("completed")}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, value === "completed" && styles.textActive]}>조사완료</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#454545",
    borderRadius: 16,
    padding: 2,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  optionActive: {
    backgroundColor: "#238AAF",
  },
  text: {
    fontSize: 14,
    fontFamily: "Pretendard-Medium",
    color: "#8D8D8D",
  },
  textActive: {
    color: "#FFFFFF",
  },
});
