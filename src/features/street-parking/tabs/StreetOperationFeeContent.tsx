import React from "react";
import { View, StyleSheet } from "react-native";
import type { Control, UseFormSetValue } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { Text } from "@/src/components/Text";
import { ControllerTextInput } from "@/src/components/ControllerTextInput";
import { ControllerCheckbox } from "@/src/components/ControllerCheckbox";
import { ControllerRadioGroup } from "@/src/components/ControllerRadioGroup";

import { ControllerDropdownField } from "@/src/components/ControllerDropdownField";
import { SectionHeader } from "../StreetParkingBottomSheetContent";
import type { StreetOperationFeeFormValues } from "../StreetParkingBottomSheetContent";

// Payment method options
const PAYMENT_METHOD_OPTIONS = ["카드", "현금", "카드·현금"];

// Fee collector options
const FEE_COLLECTOR_OPTIONS = ["무", "유"];

// Fee type options
const FEE_TYPE_OPTIONS = ["유료", "무료"];

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
  control: Control<StreetOperationFeeFormValues>;
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

/**
 * Operation & fee tab content for street parking (운영/요금)
 * Sections: public access, operating hours, payment method, fee collector,
 *           parking fees, discount criteria
 */
interface StreetOperationFeeContentProps {
  control: Control<StreetOperationFeeFormValues>;
  setValue: UseFormSetValue<StreetOperationFeeFormValues>;
  onParkingZonePress?: () => void;
  isEditing?: boolean;
}

export function StreetOperationFeeContent({
  control,
  setValue,
  onParkingZonePress,
  isEditing = false,
}: StreetOperationFeeContentProps) {
  const feeType = useWatch({ control, name: "feeType" });

  // When free is selected, disable all fee inputs regardless of editing state
  const isFree = feeType === "무료";
  const feeEditable = isEditing && !isFree;

  return (
    <View>
      {/* Section 1: Public access & odd-even system (일반인 개방 및 부제 시행) */}
      <View style={styles.section}>
        <SectionHeader title="일반인 개방 및 부제 시행" />

        {/* Open/closed */}
        <Text style={styles.subSectionLabel}>개방여부</Text>
        <ControllerRadioGroup
          control={control}
          name="isOpen"
          options={["개방", "미개방"]}
          disabled={!isEditing}
        />

        {/* Odd-even system */}
        <Text style={{ ...styles.subSectionLabel, marginTop: 10 }}>부제시행</Text>
        <ControllerRadioGroup
          control={control}
          name="alternatingType"
          options={["미시행", "5부제", "10부제"]}
          disabled={!isEditing}
        />
      </View>

      {/* Section 2: Parking operation types (주차장 운영방식) */}
      <View style={styles.section}>
        <SectionHeader title="주차장 운영방식" />
        <View style={styles.opTypeGrid}>
          <View style={styles.opTypeItem}>
            <ControllerCheckbox
              control={control}
              name="opTimeParking"
              label="시간제 주차장"
              disabled={!isEditing}
            />
          </View>
          <View style={styles.opTypeItem}>
            <ControllerCheckbox
              control={control}
              name="opResidentParking"
              label="거주자우선주차장"
              disabled={!isEditing}
            />
          </View>
          <View style={styles.opTypeItem}>
            <ControllerCheckbox
              control={control}
              name="opTourBusParking"
              label="관광버스 주차장"
              disabled={!isEditing}
            />
          </View>
          <View style={styles.opTypeItem}>
            <ControllerCheckbox
              control={control}
              name="opMotorcycleParking"
              label="이륜차주차장"
              disabled={!isEditing}
            />
          </View>
        </View>
      </View>

      {/* Section 3: Operating hours (운영시간) */}
      <View style={styles.section}>
        <SectionHeader title="운영시간" />

        {/* Hourly parking hours */}
        <Text style={styles.subSectionLabel}>시간제 주차</Text>
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

        {/* Resident priority parking hours */}
        <Text style={[styles.subSectionLabel, { marginTop: 16 }]}>거주자우선주차</Text>
        <ControllerRadioGroup
          control={control}
          name="residentOperating"
          options={["평일 / 토요일 / 공휴일 [00시~00시]", "미운영"]}
          disabled={!isEditing}
        />
      </View>

      {/* Section 3: Payment method (주차요금 지불방식) */}
      <View style={styles.section}>
        <SectionHeader title="주차요금 지불방식" />
        <ControllerRadioGroup
          control={control}
          name="paymentMethod"
          options={PAYMENT_METHOD_OPTIONS}
          disabled={!isEditing}
        />
      </View>

      {/* Section 4: Fee collector (주차요금 징수원) */}
      <View style={styles.section}>
        <SectionHeader title="주차요금 징수원" />
        <ControllerRadioGroup
          control={control}
          name="hasCollector"
          options={FEE_COLLECTOR_OPTIONS}
          disabled={!isEditing}
        />
      </View>

      {/* Section 5: Parking fees (주차요금) */}
      <View style={styles.section}>
        <SectionHeader title="주차요금" />

        {/* Paid/Free radio */}
        <ControllerRadioGroup
          control={control}
          name="feeType"
          options={FEE_TYPE_OPTIONS}
          disabled={!isEditing}
        />

        {/* Parking zone dropdown */}
        <View style={styles.feeSubSection}>
          <Text style={styles.subSectionLabel}>주차 급지</Text>
          <ControllerDropdownField
            control={control}
            name="parkingZone"
            placeholder="선택하세요"
            onPress={onParkingZonePress}
            editable={feeEditable}
            containerStyle={styles.fullWidthContainer}
          />
        </View>

        {/* Resident priority parking fees */}
        <View style={styles.feeSubSection}>
          <Text style={styles.subSectionLabel}>거주자우선주차장</Text>
          <View style={styles.feeGrid}>
            <ControllerTextInput
              control={control}
              name="residentDay"
              label="주간"
              placeholder="0원"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
            <ControllerTextInput
              control={control}
              name="residentNight"
              label="야간"
              placeholder="0원"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
            <ControllerTextInput
              control={control}
              name="residentAllDay"
              label="전일"
              placeholder="0원"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
          </View>
        </View>

        {/* Vehicle fee sections: 승용차 */}
        <View style={styles.vehicleFeeSection}>
          <Text style={styles.subSectionLabel}>승용차</Text>
          <View style={styles.feeGrid}>
            <ControllerTextInput
              control={control}
              name="carBaseTime"
              label="기본시간"
              placeholder="0분"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
            <ControllerTextInput
              control={control}
              name="carExtraTime"
              label="추가시간"
              placeholder="0분"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
            <ControllerTextInput
              control={control}
              name="carBaseFee"
              label="기본요금"
              placeholder="0원"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
          </View>
          <View style={styles.feeGrid}>
            <ControllerTextInput
              control={control}
              name="carExtraFee"
              label="추가요금"
              placeholder="0원"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
            <ControllerTextInput
              control={control}
              name="carAllDay"
              label="전일"
              placeholder="0원"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
            <ControllerTextInput
              control={control}
              name="carMonthly"
              label="월정기권"
              placeholder="0원"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
          </View>
        </View>

        {/* Vehicle fee sections: 대형(관광)버스 */}
        <View style={styles.vehicleFeeSection}>
          <Text style={styles.subSectionLabel}>대형(관광)버스</Text>
          <View style={styles.feeGrid}>
            <ControllerTextInput
              control={control}
              name="busBaseTime"
              label="기본시간"
              placeholder="0분"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
            <ControllerTextInput
              control={control}
              name="busExtraTime"
              label="추가시간"
              placeholder="0분"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
            <ControllerTextInput
              control={control}
              name="busBaseFee"
              label="기본요금"
              placeholder="0원"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
          </View>
          <View style={styles.feeGrid}>
            <ControllerTextInput
              control={control}
              name="busExtraFee"
              label="추가요금"
              placeholder="0원"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
            <ControllerTextInput
              control={control}
              name="busAllDay"
              label="전일"
              placeholder="0원"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
            <ControllerTextInput
              control={control}
              name="busMonthly"
              label="월정기권"
              placeholder="0원"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
          </View>
        </View>

        {/* Vehicle fee sections: 이륜차 */}
        <View style={styles.vehicleFeeSection}>
          <Text style={styles.subSectionLabel}>이륜차</Text>
          <View style={styles.feeGrid}>
            <ControllerTextInput
              control={control}
              name="bikeBaseTime"
              label="기본시간"
              placeholder="0분"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
            <ControllerTextInput
              control={control}
              name="bikeExtraTime"
              label="추가시간"
              placeholder="0분"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
            <ControllerTextInput
              control={control}
              name="bikeBaseFee"
              label="기본요금"
              placeholder="0원"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
          </View>
          <View style={styles.feeGrid}>
            <ControllerTextInput
              control={control}
              name="bikeExtraFee"
              label="추가요금"
              placeholder="0원"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
            <ControllerTextInput
              control={control}
              name="bikeAllDay"
              label="전일"
              placeholder="0원"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
            <ControllerTextInput
              control={control}
              name="bikeMonthly"
              label="월정기권"
              placeholder="0원"
              keyboardType="number-pad"
              editable={feeEditable}
              containerStyle={styles.feeField}
            />
          </View>
        </View>
      </View>

      {/* Section 6: Discount criteria (주차요금 할인기준) */}
      <View style={[styles.section, { borderBottomWidth: 0 }]}>
        <SectionHeader title="주차요금 할인기준" />
        <View style={styles.feeGrid}>
          <ControllerTextInput
            control={control}
            name="discountDisabled"
            label="장애인"
            placeholder="0%"
            keyboardType="number-pad"
            editable={feeEditable}
            containerStyle={styles.feeField}
          />
          <ControllerTextInput
            control={control}
            name="discountVeteran"
            label="국가유공자등"
            placeholder="0%"
            keyboardType="number-pad"
            editable={feeEditable}
            containerStyle={styles.feeField}
          />
          <ControllerTextInput
            control={control}
            name="discountMultiChild"
            label="다자녀"
            placeholder="0%"
            keyboardType="number-pad"
            editable={feeEditable}
            containerStyle={styles.feeField}
          />
        </View>
        <View style={styles.feeGrid}>
          <ControllerTextInput
            control={control}
            name="discountEco"
            label="경차/저공해차량"
            placeholder="0%"
            keyboardType="number-pad"
            editable={feeEditable}
            containerStyle={styles.feeField}
          />
          <ControllerTextInput
            control={control}
            name="discountDayOff"
            label="요일제"
            placeholder="0%"
            keyboardType="number-pad"
            editable={feeEditable}
            containerStyle={styles.feeField}
          />
          <ControllerTextInput
            control={control}
            name="discountTenDay"
            label="10부제"
            placeholder="0%"
            keyboardType="number-pad"
            editable={feeEditable}
            containerStyle={styles.feeField}
          />
        </View>
        <View style={styles.feeGrid}>
          <ControllerTextInput
            control={control}
            name="discountOther"
            label="기타"
            placeholder="0%"
            keyboardType="number-pad"
            editable={feeEditable}
            containerStyle={styles.feeField}
          />
          <View style={styles.feeField} />
          <View style={styles.feeField} />
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

  // Sub-section label
  subSectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#454545",
    marginBottom: 8,
  },

  // Parking operation type checkboxes (2x2 grid)
  opTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    rowGap: 8,
  },
  opTypeItem: {
    flexBasis: "48%",
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

  // Fee sub section
  feeSubSection: {
    marginTop: 16,
  },

  // Dropdown container (full width override)
  fullWidthContainer: {
    width: "100%",
  },

  // Fee grid (3 columns)
  feeGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  feeField: {
    flex: 1,
    width: "auto",
  },

  // Vehicle fee section
  vehicleFeeSection: {
    marginTop: 16,
  },
});
