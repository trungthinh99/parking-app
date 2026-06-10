import React from "react";
import { View, StyleSheet } from "react-native";
import { Control, useWatch } from "react-hook-form";
import { InfoCircle } from "iconsax-react-native";
import { RequiredDot } from "@/src/components/RequiredDot";
import { Text } from "@/src/components/Text";
import { ControllerCheckbox } from "@/src/components/ControllerCheckbox";
import { ControllerTextInput } from "@/src/components/ControllerTextInput";
import { ControllerDropdownField } from "@/src/components/ControllerDropdownField";
import type { FacilitySizeFormValues } from "../ParkingBottomSheetContent";

interface FacilitySizeContentProps {
  control: Control<FacilitySizeFormValues>;
  onMechTypePress?: () => void;
  isEditing?: boolean;
}

// Section header with required dot and title
function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <RequiredDot />
      <Text style={styles.sectionTitleText}>{title}</Text>
    </View>
  );
}

// Blue badge for peak time display
function PeakTimeBadge({ value }: { value: string }) {
  return (
    <View style={styles.peakTimeBadge}>
      <Text style={styles.peakTimeBadgeText}>{value}</Text>
    </View>
  );
}

// Sub-section title (e.g., 자주식, 기계식, 주간, 야간)
function SubSectionTitle({ title }: { title: string }) {
  return <Text style={styles.subSectionTitle}>{title}</Text>;
}

// Static peak time ranges (not form fields)
const PEAK_DAYTIME_RANGE = "00시~00시";
const PEAK_NIGHTTIME_RANGE = "00시~00시";

/**
 * Facility size tab content (시설규모)
 * Contains parking space counts, dedicated zones, and peak hour data
 */
export function FacilitySizeContent({
  control,
  onMechTypePress,
  isEditing = false,
}: FacilitySizeContentProps) {
  // Watch checkbox to disable all inputs below when checked
  const functionNotMaintained = useWatch({
    control,
    name: "functionNotMaintained",
  });

  const inputsDisabled = !isEditing || !!functionNotMaintained;

  // Watch mechType to conditionally show text input for "기타" only
  const mechType = useWatch({ control, name: "mechType" });
  const showMechCount = mechType === "기타";

  // Watch parking space fields to calculate total (mechCount is free text for "기타", excluded)
  const [
    selfIndoor, selfOutdoor, selfOther,
    dedicatedDisabled, dedicatedCompact, dedicatedFamily,
    dedicatedElectric, dedicatedSharing, dedicatedOther,
  ] = useWatch({
    control,
    name: [
      "selfIndoor", "selfOutdoor", "selfOther",
      "dedicatedDisabled", "dedicatedCompact", "dedicatedFamily",
      "dedicatedElectric", "dedicatedSharing", "dedicatedOther",
    ],
  });

  const totalSpaces =
    (parseInt(selfIndoor) || 0) +
    (parseInt(selfOutdoor) || 0) +
    (parseInt(selfOther) || 0);

  const totalDedicated =
    (parseInt(dedicatedDisabled) || 0) +
    (parseInt(dedicatedCompact) || 0) +
    (parseInt(dedicatedFamily) || 0) +
    (parseInt(dedicatedElectric) || 0) +
    (parseInt(dedicatedSharing) || 0) +
    (parseInt(dedicatedOther) || 0);

  const dedicatedExceeded = totalDedicated > totalSpaces;

  return (
    <View>
      {/* Top checkboxes */}
      <View style={styles.checkboxSection}>
        <ControllerCheckbox
          control={control}
          name="unauthorizedUse"
          label="주차장 일부 무단용도변경"
          disabled={!isEditing}
        />
        <ControllerCheckbox
          control={control}
          name="functionNotMaintained"
          label="부설주차장 기능미유지(진입불가 등)"
          disabled={!isEditing}
        />
      </View>

      {/* Section 1: Total parking space count */}
      <View style={styles.section}>
        <SectionTitle title={`총 조사 주차면수 [${totalSpaces}]면`} />

        {/* Self-parking (자주식) */}
        <SubSectionTitle title="자주식" />
        <View style={styles.threeColumnRow}>
          <ControllerTextInput
            control={control}
            name="selfIndoor"
            label="옥내"
            placeholder="0면"
            keyboardType="number-pad"
            editable={!inputsDisabled}
            containerStyle={styles.flexColumn}
          />
          <ControllerTextInput
            control={control}
            name="selfOutdoor"
            label="옥외"
            placeholder="0면"
            keyboardType="number-pad"
            editable={!inputsDisabled}
            containerStyle={styles.flexColumn}
          />
          <ControllerTextInput
            control={control}
            name="selfOther"
            label="기타"
            placeholder="0면"
            keyboardType="number-pad"
            editable={!inputsDisabled}
            containerStyle={styles.flexColumn}
          />
        </View>

        {/* Mechanical parking (기계식) */}
        <SubSectionTitle title="기계식" />
        <View style={styles.twoColumnRow}>
          <ControllerDropdownField
            control={control}
            name="mechType"
            placeholder="기계식 선택"
            onPress={onMechTypePress}
            editable={!inputsDisabled}
            containerStyle={styles.flexColumn}
          />
          {showMechCount && (
            <View style={styles.flexColumn}>
              <ControllerTextInput
                control={control}
                name="mechCount"
                placeholder="내용 입력"
                keyboardType="default"
                editable={!inputsDisabled}
              />
            </View>
          )}
        </View>
      </View>

      {/* Section 2: Dedicated parking zones */}
      <View style={styles.section}>
        <SectionTitle title="전용 주차구획(총 면수에 포함됨)" />

        {/* Row 1 */}
        <View style={styles.threeColumnRow}>
          <ControllerTextInput
            control={control}
            name="dedicatedDisabled"
            label="장애인"
            placeholder="0면"
            keyboardType="number-pad"
            editable={!inputsDisabled}
            containerStyle={styles.flexColumn}
          />
          <ControllerTextInput
            control={control}
            name="dedicatedCompact"
            label="경차"
            placeholder="0면"
            keyboardType="number-pad"
            editable={!inputsDisabled}
            containerStyle={styles.flexColumn}
          />
          <ControllerTextInput
            control={control}
            name="dedicatedFamily"
            label="가족배려"
            placeholder="0면"
            keyboardType="number-pad"
            editable={!inputsDisabled}
            containerStyle={styles.flexColumn}
          />
        </View>

        {/* Row 2 */}
        <View style={styles.threeColumnRow}>
          <ControllerTextInput
            control={control}
            name="dedicatedElectric"
            label="전기차"
            placeholder="0면"
            keyboardType="number-pad"
            editable={!inputsDisabled}
            containerStyle={styles.flexColumn}
          />
          <ControllerTextInput
            control={control}
            name="dedicatedSharing"
            label="나눔카"
            placeholder="0면"
            keyboardType="number-pad"
            editable={!inputsDisabled}
            containerStyle={styles.flexColumn}
          />
          <ControllerTextInput
            control={control}
            name="dedicatedOther"
            label="기타"
            placeholder="0면"
            keyboardType="number-pad"
            editable={!inputsDisabled}
            containerStyle={styles.flexColumn}
          />
        </View>

        {/* Warning when dedicated total exceeds total spaces */}
        {dedicatedExceeded && (
          <View style={styles.warningRow}>
            <InfoCircle size={16} color="#D00000" variant="Linear" />
            <Text style={styles.warningText}>
              입력한 총 면수가 전체 주차면수를 초과했습니다
            </Text>
          </View>
        )}
      </View>

      {/* Section 3: Peak parking counts */}
      <View style={[styles.section, { borderBottomWidth: 0 }]}>
        <SectionTitle title="첨두시 주차대수" />

        {/* Daytime (주간) */}
        <SubSectionTitle title="주간(07시~20시)" />
        <View style={styles.peakRow}>
          <PeakTimeBadge value={`첨두시간대\n[${PEAK_DAYTIME_RANGE}]`} />
          <View style={styles.peakInputContainer}>
            <ControllerTextInput
              control={control}
              name="peakDaytimeCount"
              label="주차대수"
              placeholder="0대"
              keyboardType="number-pad"
              editable={!inputsDisabled}
              containerStyle={styles.flexColumn}
            />
          </View>
        </View>

        {/* Nighttime (야간) */}
        <SubSectionTitle title="야간(20시~익일 07시)" />
        <View style={styles.peakRow}>
          <PeakTimeBadge value={`첨두시간대\n[${PEAK_NIGHTTIME_RANGE}]`} />
          <View style={styles.peakInputContainer}>
            <ControllerTextInput
              control={control}
              name="peakNighttimeCount"
              label="주차대수"
              placeholder="0대"
              keyboardType="number-pad"
              editable={!inputsDisabled}
              containerStyle={styles.flexColumn}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Top checkboxes section
  checkboxSection: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9E9E9",
    gap: 8,
  },

  // Section container
  section: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9E9E9",
    gap: 8,
  },

  // Section title with required dot
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#151515",
  },

  // Sub-section title
  subSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#151515",
  },

  // 3-column row layout
  threeColumnRow: {
    flexDirection: "row",
    gap: 8,
  },

  // 2-column row layout
  twoColumnRow: {
    flexDirection: "row",
    gap: 4,
  },

  // Flexible column for grid items
  flexColumn: {
    flex: 1,
    width: undefined,
  },

  // Peak time badge
  peakTimeBadge: {
    width: 168,
    borderRadius: 8,
    backgroundColor: "#EAF9FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  peakTimeBadgeText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
    textAlign: "center",
    lineHeight: 20,
  },

  // Peak row layout
  peakRow: {
    flexDirection: "row",
    gap: 8,
  },
  peakInputContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },

  // Warning message
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#D00000",
  },
});
