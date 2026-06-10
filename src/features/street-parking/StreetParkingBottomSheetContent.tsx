import React from "react";
import { View, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { ClipboardText, FormatSquare, Coin1, ShieldTick } from "iconsax-react-native";
import type { Icon as IconsaxIcon } from "iconsax-react-native";
import { Text } from "@/src/components/Text";
import { RequiredDot } from "@/src/components/RequiredDot";

// Tab definitions for street parking bottom sheet
export type StreetTabId = "basic" | "facility" | "operation" | "safety";

export interface StreetTabItem {
  id: StreetTabId;
  label: string;
  icon: IconsaxIcon;
}

export const STREET_TABS: StreetTabItem[] = [
  { id: "basic", label: "기본정보", icon: ClipboardText },
  { id: "facility", label: "시설규모", icon: FormatSquare },
  { id: "operation", label: "운영/요금", icon: Coin1 },
  { id: "safety", label: "설비/안전", icon: ShieldTick },
];

// Section header with required dot
export function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <RequiredDot />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// Radio button component
export function RadioButton({
  selected,
  onPress,
  label,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <TouchableOpacity style={styles.radioRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// Editable text input field
export function EditableField({
  label,
  value,
  placeholder,
}: {
  label: string;
  value?: string;
  placeholder?: string;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.editableTextInput}
        defaultValue={value}
        placeholder={placeholder || "내용을 입력하세요"}
        placeholderTextColor="#BDBDBD"
      />
    </View>
  );
}

// Basic info form values for street parking (노외주차장)
export type StreetBasicInfoFormValues = {
  uniqueNumber1: string; // survey area (조사구역)
  uniqueNumber2: string; // parking type label (주차장종류)
  uniqueNumber3: string; // serial number (연번)
  address: string;
  parkingName: string;
  installDate: string; // install date (설치일)
  totalSpaces: string; // total registered spaces (총 등록주차면)
  ownership: string; // 소유: 시 / 구 / 민간
  ownershipCompanyName: string; // company name when 민간
  operationEntity: string; // 운영: 자치구 / 공단 / 민간 / 민간위탁
  operationCompanyName: string; // company name when 민간위탁
  contact: string; // phone number (연락처)
};

export const STREET_BASIC_INFO_DEFAULT_VALUES: StreetBasicInfoFormValues = {
  uniqueNumber1: "",
  uniqueNumber2: "",
  uniqueNumber3: "",
  address: "",
  parkingName: "",
  installDate: "",
  totalSpaces: "",
  ownership: "",
  ownershipCompanyName: "",
  operationEntity: "",
  operationCompanyName: "",
  contact: "",
};

// Facility size form values for street parking (노외주차장)
export type StreetFacilitySizeFormValues = {
  unauthorizedUse: boolean;
  functionNotMaintained: boolean;
  flatCount: string; // 평면식
  multiStoryCount: string; // 입체식
  mechType: string;
  mechCount: string;
  dedicatedDisabled: string;
  dedicatedCompact: string;
  dedicatedFamily: string;
  dedicatedElectric: string;
  dedicatedSharing: string;
  dedicatedOther: string;
  peakDaytimeCount: string;
  peakNighttimeCount: string;
};

export const STREET_FACILITY_SIZE_DEFAULT_VALUES: StreetFacilitySizeFormValues = {
  unauthorizedUse: false,
  functionNotMaintained: false,
  flatCount: "",
  multiStoryCount: "",
  mechType: "",
  mechCount: "",
  dedicatedDisabled: "",
  dedicatedCompact: "",
  dedicatedFamily: "",
  dedicatedElectric: "",
  dedicatedSharing: "",
  dedicatedOther: "",
  peakDaytimeCount: "",
  peakNighttimeCount: "",
};

// Operation & fee form values for street parking (노외주차장)
export type StreetOperationFeeFormValues = {
  isOpen: string;
  alternatingEnabled: boolean;
  alternatingType: string;
  // Parking operation types (주차장 운영방식)
  opTimeParking: boolean;
  opResidentParking: boolean;
  opTourBusParking: boolean;
  opMotorcycleParking: boolean;
  // Operating hours - hourly parking (시간제 주차)
  weekdayNotOp: boolean;
  saturdayNotOp: boolean;
  holidayNotOp: boolean;
  // Operating hours - resident parking (거주자우선주차)
  residentOperating: string;
  paymentMethod: string;
  hasCollector: string;
  feeType: string;
  parkingZone: string;
  residentDay: string;
  residentNight: string;
  residentAllDay: string;
  carBaseTime: string;
  carExtraTime: string;
  carBaseFee: string;
  carExtraFee: string;
  carAllDay: string;
  carMonthly: string;
  busBaseTime: string;
  busExtraTime: string;
  busBaseFee: string;
  busExtraFee: string;
  busAllDay: string;
  busMonthly: string;
  bikeBaseTime: string;
  bikeExtraTime: string;
  bikeBaseFee: string;
  bikeExtraFee: string;
  bikeAllDay: string;
  bikeMonthly: string;
  discountDisabled: string;
  discountVeteran: string;
  discountMultiChild: string;
  discountEco: string;
  discountDayOff: string;
  discountTenDay: string;
  discountOther: string;
};

export const STREET_OPERATION_FEE_DEFAULT_VALUES: StreetOperationFeeFormValues = {
  isOpen: "",
  alternatingEnabled: false,
  alternatingType: "",
  opTimeParking: false,
  opResidentParking: false,
  opTourBusParking: false,
  opMotorcycleParking: false,
  weekdayNotOp: false,
  saturdayNotOp: false,
  holidayNotOp: false,
  residentOperating: "",
  paymentMethod: "",
  hasCollector: "",
  feeType: "",
  parkingZone: "",
  residentDay: "",
  residentNight: "",
  residentAllDay: "",
  carBaseTime: "",
  carExtraTime: "",
  carBaseFee: "",
  carExtraFee: "",
  carAllDay: "",
  carMonthly: "",
  busBaseTime: "",
  busExtraTime: "",
  busBaseFee: "",
  busExtraFee: "",
  busAllDay: "",
  busMonthly: "",
  bikeBaseTime: "",
  bikeExtraTime: "",
  bikeBaseFee: "",
  bikeExtraFee: "",
  bikeAllDay: "",
  bikeMonthly: "",
  discountDisabled: "",
  discountVeteran: "",
  discountMultiChild: "",
  discountEco: "",
  discountDayOff: "",
  discountTenDay: "",
  discountOther: "",
};

// Safety status form values for street parking (노외주차장)
export type StreetSafetyFormValues = {
  barrier: string;
  plateRecognition: string;
  exitAlarm: string;
  alarmSound: string;
  cctv: string;
  videoStorage: string;
  fallPrevention: string;
  mechParkingStaff: string;
  mechParkingOperation: string;
  mechParkingInspection: string;
  inspectionCert: string;
};

export const STREET_SAFETY_DEFAULT_VALUES: StreetSafetyFormValues = {
  barrier: "",
  plateRecognition: "",
  exitAlarm: "",
  alarmSound: "",
  cctv: "",
  videoStorage: "",
  fallPrevention: "",
  mechParkingStaff: "",
  mechParkingOperation: "",
  mechParkingInspection: "",
  inspectionCert: "",
};

const styles = StyleSheet.create({
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

  // Radio
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#BDBDBD",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: "#238AAF",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#238AAF",
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
  },

  // Editable field
  fieldContainer: {
    width: "48.5%",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#454545",
    marginBottom: 4,
  },
  editableTextInput: {
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9E9E9",
    backgroundColor: "#F8F8F8",
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 14,
    fontWeight: "400" as const,
    color: "#151515",
  },

  editButton: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F4F4F4",
    justifyContent: "center",
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#151515",
  },
  sendButton: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#238AAF",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
