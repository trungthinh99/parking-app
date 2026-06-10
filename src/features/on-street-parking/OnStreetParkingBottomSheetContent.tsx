import React from "react";
import { View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Alarm, ClipboardText, ClipboardTick, Coin1 } from "iconsax-react-native";
import type { Icon as IconsaxIcon } from "iconsax-react-native";
import { Control, Controller, useWatch } from "react-hook-form";
import { Text } from "@/src/components/Text";
import { ControllerRadioGroup } from "@/src/components/ControllerRadioGroup";
import { ControllerTextInput } from "@/src/components/ControllerTextInput";
import { RequiredDot } from "@/src/components/RequiredDot";

// Tab definitions for the bottom sheet
export type TabId = "usage" | "safety" | "basic" | "operation";

export interface TabItem {
  id: TabId;
  label: string;
  icon: IconsaxIcon;
}

export const TABS: TabItem[] = [
  { id: "usage", label: "이용실태", icon: ClipboardTick },
  { id: "safety", label: "안전실태", icon: Alarm },
  { id: "basic", label: "기본정보", icon: ClipboardText },
  { id: "operation", label: "운영요금", icon: Coin1 },
];

// Form values for the usage status tab
export type UsageStatusFormValues = {
  uniqueNumber1: string;
  uniqueNumber2: string;
  uniqueNumber3: string;
  address: string;
  parkingSection: string;
  dedicatedSection: string;
  dedicatedOtherText: string;
  vehicleType: string;
  parkingForm: string;
};

export const USAGE_STATUS_DEFAULT_VALUES: UsageStatusFormValues = {
  uniqueNumber1: "",
  uniqueNumber2: "",
  uniqueNumber3: "",
  address: "",
  parkingSection: "유",
  dedicatedSection: "",
  dedicatedOtherText: "",
  vehicleType: "승용차",
  parkingForm: "합법",
};

// Usage status tab content (이용실태)
interface UsageStatusContentProps {
  control: Control<UsageStatusFormValues>;
  isEditing?: boolean;
  onAddressSearchPress?: () => void;
  latitude?: number | null;
  longitude?: number | null;
}

const DEDICATED_SECTION_OPTIONS = [
  "장애인",
  "경차",
  "가족배려",
  "전기차",
  "나눔카",
  "임산부",
  "기타",
];

const VEHICLE_TYPE_OPTIONS = [
  "승용차",
  "승합차",
  "화물차",
  "이륜차",
  "관광(대)",
  "관광(중)",
  "관광(소)",
  "기타",
  "주차차량 없음",
];

export function UsageStatusContent({
  control,
  isEditing = false,
  onAddressSearchPress,
  latitude,
  longitude,
}: UsageStatusContentProps) {
  const dedicatedSection = useWatch({ control, name: "dedicatedSection" });
  const gpsText =
    latitude != null && longitude != null ? `(GPS : ${latitude}, ${longitude})` : "";

  return (
    <View>
      {/* Unique number section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <RequiredDot />
          <Text style={styles.sectionLabelRequired}>고유번호</Text>
        </View>
        <View style={styles.uniqueNumberRow}>
          <View style={styles.uniqueNumberCol}>
            <Text style={styles.uniqueNumberLabel}>조사구역</Text>
            <Controller
              control={control}
              name="uniqueNumber1"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.uniqueNumberInput, !isEditing && styles.disabledInput]}
                  value={value}
                  onChangeText={onChange}
                  placeholderTextColor="#BDBDBD"
                  editable={isEditing}
                />
              )}
            />
          </View>
          <View style={styles.uniqueNumberCol}>
            <Text style={styles.uniqueNumberLabel}>부설</Text>
            <Controller
              control={control}
              name="uniqueNumber2"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.uniqueNumberInput, styles.disabledInput]}
                  value={value}
                  onChangeText={onChange}
                  placeholderTextColor="#BDBDBD"
                  editable={false}
                />
              )}
            />
          </View>
          <View style={styles.uniqueNumberCol}>
            <Text style={styles.uniqueNumberLabel}>연번</Text>
            <Controller
              control={control}
              name="uniqueNumber3"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.uniqueNumberInput, styles.disabledInput]}
                  value={value}
                  onChangeText={onChange}
                  placeholderTextColor="#BDBDBD"
                  editable={false}
                />
              )}
            />
          </View>
        </View>
      </View>

      {/* Address section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <RequiredDot />
          <Text style={styles.sectionLabelRequired}>주소</Text>
        </View>
        {isEditing && onAddressSearchPress ? (
          <TouchableOpacity activeOpacity={0.7} onPress={onAddressSearchPress}>
            <View pointerEvents="none">
              <ControllerTextInput
                control={control}
                name="address"
                editable={false}
                style={styles.addressEditableInput}
              />
            </View>
          </TouchableOpacity>
        ) : (
          <ControllerTextInput control={control} name="address" editable={false} />
        )}
        {gpsText ? <Text style={styles.gpsText}>{gpsText}</Text> : null}
      </View>

      {/* Parking section (주차구획) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <RequiredDot />
          <Text style={styles.sectionLabelRequired}>주차구획</Text>
        </View>
        <ControllerRadioGroup
          control={control}
          name="parkingSection"
          options={["유", "무"]}
          disabled={!isEditing}
        />
      </View>

      {/* Dedicated parking section (전용 주차구획) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <RequiredDot />
          <Text style={styles.sectionLabelRequired}>전용 주차구획</Text>
        </View>
        <ControllerRadioGroup
          control={control}
          name="dedicatedSection"
          options={DEDICATED_SECTION_OPTIONS}
          disabled={!isEditing}
        />
        {dedicatedSection === "기타" && (
          <Controller
            control={control}
            name="dedicatedOtherText"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.otherTextInput, !isEditing && styles.disabledInput]}
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

      {/* Vehicle type (차량종류) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <RequiredDot />
          <Text style={styles.sectionLabelRequired}>차량종류</Text>
        </View>
        <ControllerRadioGroup
          control={control}
          name="vehicleType"
          options={VEHICLE_TYPE_OPTIONS}
          disabled={!isEditing}
        />
      </View>

      {/* Parking form (주차형태) */}
      <View style={[styles.section, { borderBottomWidth: 0 }]}>
        <View style={styles.sectionHeader}>
          <RequiredDot />
          <Text style={styles.sectionLabelRequired}>주차형태</Text>
        </View>
        <ControllerRadioGroup
          control={control}
          name="parkingForm"
          options={["합법", "불법"]}
          disabled={!isEditing}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Section
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#454545",
    marginBottom: 8,
  },
  sectionLabelRequired: {
    fontSize: 14,
    fontWeight: "700",
    color: "#151515",
  },

  // Unique number
  uniqueNumberRow: {
    flexDirection: "row",
    gap: 4,
  },
  uniqueNumberCol: {
    flex: 1,
  },
  uniqueNumberLabel: {
    fontSize: 14,
    color: "#383838",
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: 18,
  },
  uniqueNumberInput: {
    width: "100%",
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
  },

  // Text input for "기타" option (half width)
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

  // Address field — keep editable appearance while disabled (since it opens search overlay)
  addressEditableInput: {
    borderColor: "#F8F8F8",
    backgroundColor: "#F8F8F8",
    color: "#151515",
  },

  // GPS coordinate text shown below the address field
  gpsText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#454545",
    marginTop: 4,
  },
});
