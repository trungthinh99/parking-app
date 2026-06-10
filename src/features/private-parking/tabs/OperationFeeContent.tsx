import React from "react";
import { View, StyleSheet } from "react-native";
import { Control, useWatch } from "react-hook-form";
import { Text } from "@/src/components/Text";
import { RequiredDot } from "@/src/components/RequiredDot";
import { ControllerCheckbox } from "@/src/components/ControllerCheckbox";
import { ControllerTextInput } from "@/src/components/ControllerTextInput";
import { ControllerDropdownField } from "@/src/components/ControllerDropdownField";
import { ControllerRadioGroup } from "@/src/components/ControllerRadioGroup";

import type { OperationFeeFormValues } from "../ParkingBottomSheetContent";

interface OperationFeeContentProps {
  control: Control<OperationFeeFormValues>;
  onParkingZonePress?: () => void;
  isEditing?: boolean;
}

// Section header with required dot and title
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <RequiredDot />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// Operating time row (e.g., 평일 [00:00 ~ 00:00])
function OperatingTimeRow({
  label,
  timeValue,
  control,
  name,
  disabled = false,
}: {
  label: string;
  timeValue: string;
  control: Control<OperationFeeFormValues>;
  name: "weekdayNotOp" | "saturdayNotOp" | "holidayNotOp";
  disabled?: boolean;
}) {
  return (
    <View style={styles.operatingTimeRow}>
      <View style={styles.operatingTimeLeft}>
        <Text style={styles.operatingTimeText}>
          {label} [{timeValue}]
        </Text>
      </View>
      <ControllerCheckbox control={control} name={name} label="미운영" disabled={disabled} />
    </View>
  );
}

// Vehicle fee section (승용차, 대형버스, 이륜차)
function VehicleFeeSection({
  title,
  control,
  prefix,
  isEditing = true,
}: {
  title: string;
  control: Control<OperationFeeFormValues>;
  prefix: "car" | "bus" | "bike";
  isEditing?: boolean;
}) {
  return (
    <View style={styles.vehicleFeeSection}>
      <Text style={styles.vehicleFeeSectionTitle}>{title}</Text>
      <View style={styles.vehicleFeeGrid}>
        <ControllerTextInput
          control={control}
          name={`${prefix}BaseTime` as keyof OperationFeeFormValues & string}
          label="기본시간"
          placeholder="0분"
          keyboardType="number-pad"
          editable={isEditing}
          containerStyle={styles.smallField}
        />
        <ControllerTextInput
          control={control}
          name={`${prefix}ExtraTime` as keyof OperationFeeFormValues & string}
          label="추가시간"
          placeholder="0분"
          keyboardType="number-pad"
          editable={isEditing}
          containerStyle={styles.smallField}
        />
        <ControllerTextInput
          control={control}
          name={`${prefix}BaseFee` as keyof OperationFeeFormValues & string}
          label="기본요금"
          placeholder="0원"
          keyboardType="number-pad"
          editable={isEditing}
          containerStyle={styles.smallField}
        />
        <ControllerTextInput
          control={control}
          name={`${prefix}ExtraFee` as keyof OperationFeeFormValues & string}
          label="추가요금"
          placeholder="0원"
          keyboardType="number-pad"
          editable={isEditing}
          containerStyle={styles.smallField}
        />
        <ControllerTextInput
          control={control}
          name={`${prefix}AllDay` as keyof OperationFeeFormValues & string}
          label="전일"
          placeholder="0원"
          keyboardType="number-pad"
          editable={isEditing}
          containerStyle={styles.smallField}
        />
        <ControllerTextInput
          control={control}
          name={`${prefix}Monthly` as keyof OperationFeeFormValues & string}
          label="월정기권"
          placeholder="0원"
          keyboardType="number-pad"
          editable={isEditing}
          containerStyle={styles.smallField}
        />
      </View>
    </View>
  );
}

// Main operation & fee tab content
export function OperationFeeContent({
  control,
  onParkingZonePress,
  isEditing = false,
}: OperationFeeContentProps) {
  const feeType = useWatch({ control, name: "feeType" });
  const isFree = feeType === "무료";

  // When free is selected, disable all fee inputs regardless of editing state
  const feeEditable = isEditing && !isFree;

  return (
    <View>
      {/* Section 1: Public access & alternating system */}
      <View style={styles.section}>
        <SectionHeader title="일반인 개방 및 부제 시행" />

        {/* Open/closed */}
        <View style={styles.subSection}>
          <Text style={styles.subSectionTitle}>개방여부</Text>
          <ControllerRadioGroup
            control={control}
            name="isOpen"
            options={["개방", "미개방"]}
            disabled={!isEditing}
          />
        </View>

        {/* Alternating system */}
        <View style={styles.subSection}>
          <Text style={styles.subSectionTitle}>부제시행</Text>
          <ControllerRadioGroup
            control={control}
            name="alternatingType"
            options={["미시행", "5부제", "10부제"]}
            disabled={!isEditing}
          />
        </View>
      </View>

      {/* Section 2: Operating hours */}
      <View style={styles.section}>
        <SectionHeader title="운영시간" />
        <View style={styles.operatingTimeList}>
          <OperatingTimeRow
            label="평일"
            timeValue="00:00 ~ 00:00"
            control={control}
            name="weekdayNotOp"
            disabled={!isEditing}
          />
          <OperatingTimeRow
            label="토요일"
            timeValue="00:00 ~ 00:00"
            control={control}
            name="saturdayNotOp"
            disabled={!isEditing}
          />
          <OperatingTimeRow
            label="공휴일"
            timeValue="00:00 ~ 00:00"
            control={control}
            name="holidayNotOp"
            disabled={!isEditing}
          />
        </View>
      </View>

      {/* Section 3: Payment method */}
      <View style={styles.section}>
        <SectionHeader title="주차요금 지불방식" />
        <ControllerRadioGroup
          control={control}
          name="paymentMethod"
          options={["카드", "현금", "카드/현금"]}
          disabled={!isEditing}
        />
      </View>

      {/* Section 4: Fee collector */}
      <View style={styles.section}>
        <SectionHeader title="주차요금 징수원" />
        <ControllerRadioGroup
          control={control}
          name="hasCollector"
          options={["무", "유"]}
          disabled={!isEditing}
        />
      </View>

      {/* Section 5: Parking fee */}
      <View style={styles.section}>
        <SectionHeader title="주차요금" />

        {/* Paid/Free toggle */}
        <ControllerRadioGroup
          control={control}
          name="feeType"
          options={["유료", "무료"]}
          disabled={!isEditing}
        />

        {/* Parking zone dropdown */}
        <View style={styles.feeSubSection}>
          <ControllerDropdownField
            control={control}
            name="parkingZone"
            label="주차 급지"
            placeholder="주차 급지 선택"
            onPress={onParkingZonePress}
            editable={feeEditable}
            containerStyle={styles.fullWidth}
          />
        </View>

        {/* Resident priority parking */}
        <View style={styles.feeSubSection}>
          <Text style={styles.vehicleFeeSectionTitle}>거주자우선주차장</Text>
          <View style={styles.residentGrid}>
            <ControllerTextInput
              control={control}
              name="residentDay"
              label="주간"
              placeholder="0원"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.smallField}
            />
            <ControllerTextInput
              control={control}
              name="residentNight"
              label="야간"
              placeholder="0원"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.smallField}
            />
            <ControllerTextInput
              control={control}
              name="residentAllDay"
              label="전일"
              placeholder="0원"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.smallField}
            />
          </View>
        </View>

        {/* Vehicle fee sections */}
        <VehicleFeeSection title="승용차" control={control} prefix="car" isEditing={feeEditable} />
        <VehicleFeeSection
          title="대형(관광)버스"
          control={control}
          prefix="bus"
          isEditing={feeEditable}
        />
        <VehicleFeeSection title="이륜차" control={control} prefix="bike" isEditing={feeEditable} />
      </View>

      {/* Section 6: Discount criteria */}
      <View style={[styles.section, { borderBottomWidth: 0 }]}>
        <SectionHeader title="주차요금 할인기준" />
        <View style={styles.discountGrid}>
          <ControllerTextInput
            control={control}
            name="discountDisabled"
            label="장애인"
            placeholder="0%"
            keyboardType="number-pad"
            editable={isEditing}
            containerStyle={styles.smallField}
          />
          <ControllerTextInput
            control={control}
            name="discountVeteran"
            label="국가유공자등"
            placeholder="0%"
            keyboardType="number-pad"
            editable={isEditing}
            containerStyle={styles.smallField}
          />
          <ControllerTextInput
            control={control}
            name="discountMultiChild"
            label="다자녀"
            placeholder="0%"
            keyboardType="number-pad"
            editable={isEditing}
            containerStyle={styles.smallField}
          />
          <ControllerTextInput
            control={control}
            name="discountEco"
            label="경차/저공해차량"
            placeholder="0%"
            keyboardType="number-pad"
            editable={isEditing}
            containerStyle={styles.smallField}
          />
          <ControllerTextInput
            control={control}
            name="discountDayOff"
            label="요일제"
            placeholder="0%"
            keyboardType="number-pad"
            editable={isEditing}
            containerStyle={styles.smallField}
          />
          <ControllerTextInput
            control={control}
            name="discountTenDay"
            label="10부제"
            placeholder="0%"
            keyboardType="number-pad"
            editable={isEditing}
            containerStyle={styles.smallField}
          />
          <ControllerTextInput
            control={control}
            name="discountOther"
            label="기타"
            placeholder="0%"
            keyboardType="number-pad"
            editable={isEditing}
            containerStyle={styles.smallField}
          />
        </View>
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

  // Sub section
  subSection: {
    marginTop: 8,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#151515",
    marginBottom: 8,
  },


  // Operating time
  operatingTimeList: {
    gap: 8,
  },
  operatingTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  operatingTimeLeft: {
    width: 145,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  operatingTimeText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
  },

  // Small field (grid item)
  smallField: {
    width: "31%",
  },

  // Full width container
  fullWidth: {
    width: "100%",
  },

  // Fee sub section
  feeSubSection: {
    marginTop: 16,
  },

  // Resident grid (3 columns)
  residentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  // Vehicle fee section
  vehicleFeeSection: {
    marginTop: 16,
  },
  vehicleFeeSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#151515",
    marginBottom: 8,
  },
  vehicleFeeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  // Discount grid
  discountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
