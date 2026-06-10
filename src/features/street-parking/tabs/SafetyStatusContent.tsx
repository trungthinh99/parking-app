import React from "react";
import { View, StyleSheet } from "react-native";
import type { Control } from "react-hook-form";
import { Text } from "@/src/components/Text";
import { ControllerRadioGroup } from "@/src/components/ControllerRadioGroup";
import { RequiredDot } from "@/src/components/RequiredDot";
import type { StreetSafetyFormValues } from "../StreetParkingBottomSheetContent";

// Section header with required dot and title
function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <RequiredDot />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// Radio form item with label and Controller-backed radio group
function RadioFormItem<T extends string>({
  label,
  control,
  name,
  options,
  disabled,
}: {
  label: string;
  control: Control<StreetSafetyFormValues>;
  name: keyof StreetSafetyFormValues & string;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <View style={styles.formItem}>
      <Text style={styles.formItemLabel}>{label}</Text>
      <ControllerRadioGroup
        control={control}
        name={name}
        options={options}
        disabled={disabled}
      />
    </View>
  );
}

/**
 * Equipment & Safety tab content (설비/안전)
 * Contains two sections:
 * 1. Control & Security Equipment (관제 및 방범 설비)
 * 2. Safety Facilities & Mechanical Parking (안전시설 및 기계식주차)
 */
interface SafetyStatusContentProps {
  control: Control<StreetSafetyFormValues>;
  isEditing?: boolean;
}

export function SafetyStatusContent({
  control,
  isEditing = false,
}: SafetyStatusContentProps) {
  return (
    <View>
      {/* Section 1: Control & Security Equipment */}
      <View style={styles.section}>
        <SectionTitle title="관제 및 방범 설비" />

        <View style={styles.formItems}>
          <RadioFormItem
            label="차단기 설치"
            control={control}
            name="barrier"
            options={["유", "무"]}
            disabled={!isEditing}
          />
          <RadioFormItem
            label="차량번호인식시스템"
            control={control}
            name="plateRecognition"
            options={["유", "무"]}
            disabled={!isEditing}
          />
          <RadioFormItem
            label="출차경보장치"
            control={control}
            name="exitAlarm"
            options={["유", "무"]}
            disabled={!isEditing}
          />
          <RadioFormItem
            label="경보음작동"
            control={control}
            name="alarmSound"
            options={["작동", "미작동"]}
            disabled={!isEditing}
          />
          <RadioFormItem
            label="CCTV 설치"
            control={control}
            name="cctv"
            options={["유", "무"]}
            disabled={!isEditing}
          />
          <RadioFormItem
            label="영상 1개월 이상 보관"
            control={control}
            name="videoStorage"
            options={["보관", "미보관"]}
            disabled={!isEditing}
          />
        </View>
      </View>

      {/* Section 2: Safety Facilities & Mechanical Parking */}
      <View style={[styles.section, { borderBottomWidth: 0 }]}>
        <SectionTitle title="안전시설 및 기계식주차" />

        <View style={styles.formItems}>
          <RadioFormItem
            label="추락방지 시설"
            control={control}
            name="fallPrevention"
            options={["유", "무"]}
            disabled={!isEditing}
          />
          <RadioFormItem
            label="기계식주차 관리인 상주"
            control={control}
            name="mechParkingStaff"
            options={["상주", "비상주"]}
            disabled={!isEditing}
          />
          <RadioFormItem
            label="기계식주차장 정상작동"
            control={control}
            name="mechParkingOperation"
            options={["작동", "미작동"]}
            disabled={!isEditing}
          />
          <RadioFormItem
            label="기계식주차 정기검사, 정밀안전검사"
            control={control}
            name="mechParkingInspection"
            options={["유", "무"]}
            disabled={!isEditing}
          />
          <RadioFormItem
            label="검사확인증, 안내문 부착 여부 등"
            control={control}
            name="inspectionCert"
            options={["유", "무"]}
            disabled={!isEditing}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Section container
  section: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9E9E9",
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#151515",
  },

  // Form items list
  formItems: {
    gap: 16,
  },

  // Individual form item
  formItem: {
    gap: 8,
  },
  formItemLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#151515",
  },
});
