import React from "react";
import { View, StyleSheet } from "react-native";
import { InfoCircle } from "iconsax-react-native";

import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { Text } from "@/src/components/Text";
import { ControllerTextInput } from "@/src/components/ControllerTextInput";
import { ControllerCheckbox } from "@/src/components/ControllerCheckbox";
import { ControllerDropdownField } from "@/src/components/ControllerDropdownField";
import { RequiredDot } from "@/src/components/RequiredDot";
import type { StreetFacilitySizeFormValues } from "../StreetParkingBottomSheetContent";

// Section header with required dot and title
function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <RequiredDot />
      <Text style={styles.sectionTitleText}>{title}</Text>
    </View>
  );
}

// Sub-section title
function SubSectionTitle({ title }: { title: string }) {
  return <Text style={styles.subSectionTitle}>{title}</Text>;
}

// Blue badge for peak time display
function PeakTimeBadge({ value }: { value: string }) {
  return (
    <View style={styles.peakTimeBadge}>
      <Text style={styles.peakTimeBadgeText}>{value}</Text>
    </View>
  );
}

// Static peak time ranges
const PEAK_DAYTIME_RANGE = "00시~00시";
const PEAK_NIGHTTIME_RANGE = "00시~00시";

/**
 * Facility size tab content (시설규모)
 * Contains: checkboxes, parking space counts, dedicated zones, peak hour data
 */
interface StreetFacilitySizeContentProps {
  control: Control<StreetFacilitySizeFormValues>;
  onMechTypePress: () => void;
  isEditing?: boolean;
}

export function StreetFacilitySizeContent({
  control,
  onMechTypePress,
  isEditing = false,
}: StreetFacilitySizeContentProps) {
  const functionNotMaintained = useWatch({ control, name: "functionNotMaintained" });
  const flatCount = useWatch({ control, name: "flatCount" });
  const multiStoryCount = useWatch({ control, name: "multiStoryCount" });
  const mechType = useWatch({ control, name: "mechType" });
  const dedicatedDisabled = useWatch({ control, name: "dedicatedDisabled" });
  const dedicatedCompact = useWatch({ control, name: "dedicatedCompact" });
  const dedicatedFamily = useWatch({ control, name: "dedicatedFamily" });
  const dedicatedElectric = useWatch({ control, name: "dedicatedElectric" });
  const dedicatedSharing = useWatch({ control, name: "dedicatedSharing" });
  const dedicatedOther = useWatch({ control, name: "dedicatedOther" });

  // When "노외주차장 기능미유지" is checked, all fields below should be disabled
  const isFieldsDisabled = !isEditing || functionNotMaintained;

  // Calculate totals
  const totalSpaces =
    (parseInt(flatCount) || 0) + (parseInt(multiStoryCount) || 0);

  const dedicatedTotal =
    (parseInt(dedicatedDisabled) || 0) +
    (parseInt(dedicatedCompact) || 0) +
    (parseInt(dedicatedFamily) || 0) +
    (parseInt(dedicatedElectric) || 0) +
    (parseInt(dedicatedSharing) || 0) +
    (parseInt(dedicatedOther) || 0);

  // Check if dedicated total exceeds total spaces
  const isDedicatedOverflow = totalSpaces > 0 && dedicatedTotal > totalSpaces;

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
          label="노외주차장 기능미유지(진입불가 등)"
          disabled={!isEditing}
        />
      </View>

      {/* Section 1: Total parking space count */}
      <View style={styles.section}>
        <SectionTitle title={`총 조사 주차면수 [${totalSpaces}]면`} />

        {/* Flat / Multi-story (평면식 / 입체식) */}
        <View style={styles.twoColumnRow}>
          <ControllerTextInput
            control={control}
            name="flatCount"
            label="평면식"
            placeholder="평면식 (면)"
            keyboardType="number-pad"
            editable={!isFieldsDisabled}
            containerStyle={styles.fieldColumn}
          />
          <ControllerTextInput
            control={control}
            name="multiStoryCount"
            label="입체식"
            placeholder="입체식 (면)"
            keyboardType="number-pad"
            editable={!isFieldsDisabled}
            containerStyle={styles.fieldColumn}
          />
        </View>

        {/* Mechanical parking (기계식) */}
        <SubSectionTitle title="기계식" />
        <View style={styles.twoColumnRow}>
          <ControllerDropdownField
            control={control}
            name="mechType"
            placeholder="선택하세요"
            onPress={onMechTypePress}
            editable={!isFieldsDisabled}
            containerStyle={styles.fieldColumn}
          />
          {mechType === "기타" && (
            <ControllerTextInput
              control={control}
              name="mechCount"
              placeholder="(면)"
              keyboardType="number-pad"
              editable={!isFieldsDisabled}
              containerStyle={styles.fieldColumn}
            />
          )}
        </View>
      </View>

      {/* Section 2: Dedicated parking zones */}
      <View style={styles.section}>
        <SectionTitle title="전용 주차구획 (총 면수에 포함됨)" />

        {/* Row 1: 장애인 / 경차 / 가족배려 */}
        <View style={styles.threeColumnRow}>
          <ControllerTextInput
            control={control}
            name="dedicatedDisabled"
            label="장애인"
            placeholder="장애인 (면)"
            keyboardType="number-pad"
            editable={!isFieldsDisabled}
            containerStyle={styles.fieldColumn}
          />
          <ControllerTextInput
            control={control}
            name="dedicatedCompact"
            label="경차"
            placeholder="경차 (면)"
            keyboardType="number-pad"
            editable={!isFieldsDisabled}
            containerStyle={styles.fieldColumn}
          />
          <ControllerTextInput
            control={control}
            name="dedicatedFamily"
            label="가족배려"
            placeholder="가족배려 (면)"
            keyboardType="number-pad"
            editable={!isFieldsDisabled}
            containerStyle={styles.fieldColumn}
          />
        </View>

        {/* Row 2: 전기차 / 나눔카 / 기타 */}
        <View style={styles.threeColumnRow}>
          <ControllerTextInput
            control={control}
            name="dedicatedElectric"
            label="전기차"
            placeholder="전기차 (면)"
            keyboardType="number-pad"
            editable={!isFieldsDisabled}
            containerStyle={styles.fieldColumn}
          />
          <ControllerTextInput
            control={control}
            name="dedicatedSharing"
            label="나눔카"
            placeholder="나눔카 (면)"
            keyboardType="number-pad"
            editable={!isFieldsDisabled}
            containerStyle={styles.fieldColumn}
          />
          <ControllerTextInput
            control={control}
            name="dedicatedOther"
            label="기타"
            placeholder="기타 (면)"
            keyboardType="number-pad"
            editable={!isFieldsDisabled}
            containerStyle={styles.fieldColumn}
          />
        </View>

        {/* Overflow warning */}
        {isDedicatedOverflow && (
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
              placeholder="주차대수 (대)"
              keyboardType="number-pad"
              editable={!isFieldsDisabled}
              containerStyle={styles.fullWidth}
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
              placeholder="주차대수 (대)"
              keyboardType="number-pad"
              editable={!isFieldsDisabled}
              containerStyle={styles.fullWidth}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Top checkboxes
  checkboxSection: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9E9E9",
    gap: 8,
  },

  // Section
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

  // Column layouts
  twoColumnRow: {
    flexDirection: "row",
    gap: 8,
  },
  threeColumnRow: {
    flexDirection: "row",
    gap: 8,
  },
  fieldColumn: {
    flex: 1,
    width: "auto",
  },
  fullWidth: {
    width: "100%",
  },

  // Warning
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  warningText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#D00000",
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

  // Peak row
  peakRow: {
    flexDirection: "row",
    gap: 8,
  },
  peakInputContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
});
