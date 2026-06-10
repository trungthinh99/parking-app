import React from "react";
import { View, StyleSheet, TextInput } from "react-native";
import { Control, Controller, useWatch } from "react-hook-form";
import { Text } from "@/src/components/Text";
import { ControllerRadioGroup } from "@/src/components/ControllerRadioGroup";
import { RequiredDot } from "@/src/components/RequiredDot";

// Form values for the on-street safety tab
export type OnStreetSafetyFormValues = {
  slopedParking: string;
  safetyFacility: string;
  safetyFacilityOtherText: string;
};

export const ON_STREET_SAFETY_DEFAULT_VALUES: OnStreetSafetyFormValues = {
  slopedParking: "",
  safetyFacility: "",
  safetyFacilityOtherText: "",
};

const SAFETY_FACILITY_OPTIONS = [
  "고인목(스토퍼)",
  "미끄럼주의 안내표지판",
  "기타",
];

interface OnStreetSafetyContentProps {
  control: Control<OnStreetSafetyFormValues>;
  isEditing?: boolean;
}

export function OnStreetSafetyContent({
  control,
  isEditing = false,
}: OnStreetSafetyContentProps) {
  const safetyFacility = useWatch({ control, name: "safetyFacility" });

  return (
    <View>
      {/* Sloped parking section (경사진 주차장) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <RequiredDot />
          <Text style={styles.sectionLabelRequired}>경사진 주차장</Text>
        </View>
        <ControllerRadioGroup
          control={control}
          name="slopedParking"
          options={["유", "무"]}
          disabled={!isEditing}
        />
      </View>

      {/* Safety management facilities (안전관리시설) */}
      <View style={[styles.section, { borderBottomWidth: 0 }]}>
        <View style={styles.sectionHeader}>
          <RequiredDot />
          <Text style={styles.sectionLabelRequired}>안전관리시설</Text>
        </View>
        <ControllerRadioGroup
          control={control}
          name="safetyFacility"
          options={SAFETY_FACILITY_OPTIONS}
          disabled={!isEditing}
        />
        {safetyFacility === "기타" && (
          <Controller
            control={control}
            name="safetyFacilityOtherText"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  styles.otherTextInput,
                  !isEditing && styles.disabledInput,
                ]}
                value={value}
                onChangeText={onChange}
                placeholder="내용을 입력하세요"
                placeholderTextColor="#BDBDBD"
                editable={isEditing}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9E9E9",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  sectionLabelRequired: {
    fontSize: 14,
    fontWeight: "700",
    color: "#151515",
  },
  otherTextInput: {
    width: "50%",
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
    marginTop: 12,
  },
  disabledInput: {
    borderColor: "#E9E9E9",
    backgroundColor: "#FFFFFF",
    color: "#151515",
  },
});
