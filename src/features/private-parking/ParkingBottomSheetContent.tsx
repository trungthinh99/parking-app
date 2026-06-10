import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ClipboardText, FormatSquare, Coin1, ShieldTick, Call } from "iconsax-react-native";
import type { Icon as IconsaxIcon } from "iconsax-react-native";
import { Control, useWatch } from "react-hook-form";
import { Text } from "@/src/components/Text";
import { RequiredDot } from "@/src/components/RequiredDot";
import { ControllerTextInput } from "@/src/components/ControllerTextInput";
import { ControllerDateField } from "@/src/components/ControllerDateField";
import { ControllerDropdownField } from "@/src/components/ControllerDropdownField";
import { PhotoSection, type PendingPhoto } from "@/src/components/PhotoSection";
import type { ParkingLotPhotoDto } from "@/src/api-contracts";

// Tab definitions for the bottom sheet
export type TabId = "basic" | "facility" | "operation" | "safety";

export interface TabItem {
  id: TabId;
  label: string;
  icon: IconsaxIcon;
}

export const TABS: TabItem[] = [
  { id: "basic", label: "기본정보", icon: ClipboardText },
  { id: "facility", label: "시설규모", icon: FormatSquare },
  { id: "operation", label: "운영/요금", icon: Coin1 },
  { id: "safety", label: "설비/안전", icon: ShieldTick },
];

// Form values for BasicInfoContent
export type BasicInfoFormValues = {
  uniqueNumber1: string;
  uniqueNumber2: string;
  uniqueNumber3: string;
  address: string;
  buildingName: string;
  parkingName: string;
  permitDate: string;
  mainUse: string;
  landArea: string;
  floorArea: string;
  basement: string;
  aboveGround: string;
  totalRegistered: string;
  contact: string;
};

// Default values for the basic info form (populated from API detail response)
export const BASIC_INFO_DEFAULT_VALUES: BasicInfoFormValues = {
  uniqueNumber1: "",
  uniqueNumber2: "",
  uniqueNumber3: "",
  address: "",
  buildingName: "",
  parkingName: "",
  permitDate: "",
  mainUse: "",
  landArea: "",
  floorArea: "",
  basement: "",
  aboveGround: "",
  totalRegistered: "",
  contact: "",
};

// Form values for FacilitySizeContent
export type FacilitySizeFormValues = {
  unauthorizedUse: boolean;
  functionNotMaintained: boolean;
  selfIndoor: string;
  selfOutdoor: string;
  selfOther: string;
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

// Default values for the facility size form (populated from API detail response)
export const FACILITY_SIZE_DEFAULT_VALUES: FacilitySizeFormValues = {
  unauthorizedUse: false,
  functionNotMaintained: false,
  selfIndoor: "",
  selfOutdoor: "",
  selfOther: "",
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

// Form values for OperationFeeContent
export type OperationFeeFormValues = {
  isOpen: string;
  alternatingEnabled: boolean;
  alternatingType: string;
  weekdayNotOp: boolean;
  saturdayNotOp: boolean;
  holidayNotOp: boolean;
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

// Default values for the operation fee form (populated from API detail response)
export const OPERATION_FEE_DEFAULT_VALUES: OperationFeeFormValues = {
  isOpen: "",
  alternatingEnabled: false,
  alternatingType: "",
  weekdayNotOp: false,
  saturdayNotOp: false,
  holidayNotOp: false,
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

// Form values for EquipmentSafetyContent
export type EquipmentSafetyFormValues = {
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

// Default values for the equipment safety form (populated from API detail response)
export const EQUIPMENT_SAFETY_DEFAULT_VALUES: EquipmentSafetyFormValues = {
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

// Form values for NewBasicInfoContent (create mode)
export type NewBasicInfoFormValues = {
  newUniqueNumber1: string;
  newUniqueNumber2: string;
  newUniqueNumber3: string;
  newAddress: string;
  newParkingName: string;
  newInstallDate: string;
  newTotalRegistered: string;
  newOwnership: string;
  newOwnerCompany: string;
  newOperation: string;
  newOperationCompany: string;
};

// Default values for the new basic info form
export const NEW_BASIC_INFO_DEFAULT_VALUES: NewBasicInfoFormValues = {
  newUniqueNumber1: "",
  newUniqueNumber2: "",
  newUniqueNumber3: "",
  newAddress: "",
  newParkingName: "",
  newInstallDate: "",
  newTotalRegistered: "",
  newOwnership: "구",
  newOwnerCompany: "",
  newOperation: "공단",
  newOperationCompany: "",
};

// Form values for NewFacilitySizeContent (create mode)
export type NewFacilitySizeFormValues = {
  unauthorizedUse: boolean;
  functionNotMaintained: boolean;
  flatIndoor: string;
  flatOutdoor: string;
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

// Default values for the new facility size form
export const NEW_FACILITY_SIZE_DEFAULT_VALUES: NewFacilitySizeFormValues = {
  unauthorizedUse: false,
  functionNotMaintained: false,
  flatIndoor: "",
  flatOutdoor: "",
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

// Form values for NewOperationFeeContent (create mode)
export type NewOperationFeeFormValues = {
  isOpen: string;
  alternatingEnabled: boolean;
  alternatingType: string;
  // Parking operation types
  opTimeParking: boolean;
  opResidentParking: boolean;
  opTourBusParking: boolean;
  opMotorcycleParking: boolean;
  // Operating hours - hourly parking
  weekdayNotOp: boolean;
  saturdayNotOp: boolean;
  holidayNotOp: boolean;
  // Operating hours - resident parking
  residentOperating: string;
  // Payment & collector
  paymentMethod: string;
  hasCollector: string;
  // Fee
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
  // Discounts
  discountDisabled: string;
  discountVeteran: string;
  discountMultiChild: string;
  discountEco: string;
  discountDayOff: string;
  discountTenDay: string;
  discountOther: string;
};

// Default values for the new operation fee form
export const NEW_OPERATION_FEE_DEFAULT_VALUES: NewOperationFeeFormValues = {
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

// Basic information tab content
interface BasicInfoContentProps {
  control: Control<BasicInfoFormValues>;
  onMainUsePress?: () => void;
  onAddressSearchPress?: () => void;
  isEditing?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  uploadedPhotos?: ParkingLotPhotoDto[];
  pendingPhotos?: PendingPhoto[];
  pendingDeletionIds?: Set<number>;
  onAddPendingPhoto?: (photo: PendingPhoto) => void;
  onRemovePendingPhoto?: (localId: string) => void;
  onMarkUploadedPhotoForDeletion?: (photoId: number) => void;
}

const EMPTY_DELETION_IDS: Set<number> = new Set();

export function BasicInfoContent({
  control,
  onMainUsePress,
  onAddressSearchPress,
  isEditing = false,
  latitude,
  longitude,
  uploadedPhotos = [],
  pendingPhotos = [],
  pendingDeletionIds = EMPTY_DELETION_IDS,
  onAddPendingPhoto,
  onRemovePendingPhoto,
  onMarkUploadedPhotoForDeletion,
}: BasicInfoContentProps) {
  const contactValue = useWatch({ control, name: "contact" });
  const gpsText = latitude != null && longitude != null
    ? `(GPS : ${latitude}, ${longitude})`
    : "";
  return (
    <View>
      {/* Unique number section - editable inputs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <RequiredDot />
          <Text style={styles.sectionLabelRequired}>고유번호</Text>
        </View>
        <View style={styles.uniqueNumberRow}>
          <ControllerTextInput
            control={control}
            name="uniqueNumber1"
            label="조사구역"
            labelStyle={styles.uniqueNumberLabel}
            editable={isEditing}
            containerStyle={styles.uniqueNumberCol}
          />
          <ControllerTextInput
            control={control}
            name="uniqueNumber2"
            label="주차장종류"
            labelStyle={styles.uniqueNumberLabel}
            editable={false}
            containerStyle={styles.uniqueNumberCol}
          />
          <ControllerTextInput
            control={control}
            name="uniqueNumber3"
            label="연번"
            labelStyle={styles.uniqueNumberLabel}
            editable={false}
            containerStyle={styles.uniqueNumberCol}
          />
        </View>
      </View>

      {/* Address section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <RequiredDot />
          <Text style={styles.sectionLabelRequired}>주소</Text>
        </View>
        {isEditing ? (
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
          <ControllerTextInput
            control={control}
            name="address"
            editable={false}
          />
        )}
        {gpsText ? <Text style={styles.gpsText}>{gpsText}</Text> : null}
      </View>

      {/* Building information section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <RequiredDot />
          <Text style={styles.sectionLabelRequired}>건축물정보</Text>
        </View>
        <View style={styles.formGrid}>
          <ControllerTextInput
            control={control}
            name="buildingName"
            label="건 물 명"
            placeholder="내용을 입력해세요"
            editable={isEditing}
          />
          <ControllerTextInput
            control={control}
            name="parkingName"
            label="주차장명"
            placeholder="종로센트럴 주차장"
            editable={isEditing}
          />
          <ControllerDateField
            control={control}
            name="permitDate"
            label="허가일"
            placeholder="yyyy.mm.dd"
            editable={isEditing}
          />
          <ControllerDropdownField
            control={control}
            name="mainUse"
            label="주용도"
            placeholder="주용도 선택"
            onPress={onMainUsePress}
            editable={isEditing}
          />
          <ControllerTextInput
            control={control}
            name="landArea"
            label="대지면적"
            placeholder="0㎡"
            keyboardType="number-pad"
            editable={isEditing}
          />
          <ControllerTextInput
            control={control}
            name="floorArea"
            label="연면적"
            placeholder="0㎡"
            keyboardType="number-pad"
            editable={isEditing}
          />
          <ControllerTextInput
            control={control}
            name="basement"
            label="지하"
            placeholder="0층"
            keyboardType="number-pad"
            editable={isEditing}
          />
          <ControllerTextInput
            control={control}
            name="aboveGround"
            label="지상"
            placeholder="0층"
            keyboardType="number-pad"
            editable={isEditing}
          />
        </View>
        <View style={styles.fullWidthField}>
          <ControllerTextInput
            control={control}
            name="totalRegistered"
            label="건축물대장 총등록주차면"
            placeholder="0면"
            keyboardType="number-pad"
            editable={isEditing}
            containerStyle={{ width: "100%" }}
          />
        </View>
      </View>

      {/* Contact section */}
      <View style={styles.section}>
        <View style={styles.contactSectionRow}>
          <View style={styles.contactHeader}>
            <RequiredDot />
            <Text style={styles.sectionLabelRequired}>연락처</Text>
          </View>
          <View style={styles.contactRow}>
            <Call size={16} color="#151515" variant="Linear" />
            <Text style={styles.contactText}>{contactValue || "02 -1234-5678"}</Text>
          </View>
        </View>
      </View>

      {/* Photo section — adds/removes are queued locally and flushed on save */}
      <PhotoSection
        uploadedPhotos={uploadedPhotos}
        pendingPhotos={pendingPhotos}
        pendingDeletionIds={pendingDeletionIds}
        onAddPending={(p) => onAddPendingPhoto?.(p)}
        onRemovePending={(id) => onRemovePendingPhoto?.(id)}
        onMarkUploadedForDeletion={(id) => onMarkUploadedPhotoForDeletion?.(id)}
        isEditing={isEditing}
      />
    </View>
  );
}

// Placeholder content for other tabs
export function PlaceholderContent({ label }: { label: string }) {
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderText}>{label} 탭 내용은 추후 구현됩니다.</Text>
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
    color: "#383838",
    fontWeight: "600",
  },

  // Form grid (2 columns)
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  fullWidthField: {
    marginTop: 8,
    width: "48.5%",
  },

  // Override disabled style so the address input keeps its editable appearance
  addressEditableInput: {
    borderColor: "#F8F8F8",
    backgroundColor: "#F8F8F8",
    color: "#151515",
  },

  // GPS text
  gpsText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#454545",
    marginTop: 4,
  },

  // Contact
  contactSectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
  },

  // Placeholder
  placeholderContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#8D8D8D",
  },

});
