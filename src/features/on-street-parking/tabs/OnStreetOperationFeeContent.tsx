import React, { useCallback } from "react";
import { Linking, StyleSheet, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "iconsax-react-native";
import { Control, useWatch } from "react-hook-form";
import { Text } from "@/src/components/Text";
import { ControllerCheckbox } from "@/src/components/ControllerCheckbox";
import { ControllerTextInput } from "@/src/components/ControllerTextInput";
import { ControllerDropdownField } from "@/src/components/ControllerDropdownField";
import { ControllerRadioGroup } from "@/src/components/ControllerRadioGroup";
import { RequiredDot } from "@/src/components/RequiredDot";
import { useAppModal } from "@/src/hooks/useAppModal";
import type { CapturedPhotoData } from "@/src/features/street-parking/CapturedPhotoInfo";

// Form values for on-street operation fee
export type OnStreetOperationFeeFormValues = {
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
  residentWeekdayNotOp: boolean;
  residentSaturdayNotOp: boolean;
  residentHolidayNotOp: boolean;
  // Payment & fee
  paymentMethod: string;
  feeType: string;
  parkingZone: string;
  // Resident parking fees
  residentDay: string;
  residentNight: string;
  residentAllDay: string;
  // Vehicle fees (car/bus/bike)
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

export const ON_STREET_OPERATION_FEE_DEFAULT_VALUES: OnStreetOperationFeeFormValues = {
  opTimeParking: false,
  opResidentParking: false,
  opTourBusParking: false,
  opMotorcycleParking: false,
  weekdayNotOp: false,
  saturdayNotOp: false,
  holidayNotOp: false,
  residentWeekdayNotOp: false,
  residentSaturdayNotOp: false,
  residentHolidayNotOp: false,
  paymentMethod: "",
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

// Section header with required dot and title
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <RequiredDot />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// Operating time row (e.g., 평일 [00:00 ~ 00:00] □ 미운영)
function OperatingTimeRow({
  label,
  timeValue,
  control,
  name,
  disabled = false,
}: {
  label: string;
  timeValue: string;
  control: Control<OnStreetOperationFeeFormValues>;
  name: keyof OnStreetOperationFeeFormValues;
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

// Vehicle fee section (승용차, 대형(관광)버스, 이륜차)
function VehicleFeeSection({
  title,
  control,
  prefix,
  isEditing = true,
}: {
  title: string;
  control: Control<OnStreetOperationFeeFormValues>;
  prefix: "car" | "bus" | "bike";
  isEditing?: boolean;
}) {
  return (
    <View style={styles.vehicleFeeSection}>
      <Text style={styles.subSectionTitle}>{title}</Text>
      <View style={styles.feeGrid}>
        <ControllerTextInput
          control={control}
          name={`${prefix}BaseTime`}
          label="기본시간"
          placeholder="0분"
          keyboardType="number-pad"
          editable={isEditing}
          containerStyle={styles.smallField}
        />
        <ControllerTextInput
          control={control}
          name={`${prefix}ExtraTime`}
          label="추가시간"
          placeholder="0분"
          keyboardType="number-pad"
          editable={isEditing}
          containerStyle={styles.smallField}
        />
        <ControllerTextInput
          control={control}
          name={`${prefix}BaseFee`}
          label="기본요금"
          placeholder="0원"
          keyboardType="number-pad"
          editable={isEditing}
          containerStyle={styles.smallField}
        />
        <ControllerTextInput
          control={control}
          name={`${prefix}ExtraFee`}
          label="추가요금"
          placeholder="0원"
          keyboardType="number-pad"
          editable={isEditing}
          containerStyle={styles.smallField}
        />
        <ControllerTextInput
          control={control}
          name={`${prefix}AllDay`}
          label="전일"
          placeholder="0원"
          keyboardType="number-pad"
          editable={isEditing}
          containerStyle={styles.smallField}
        />
        <ControllerTextInput
          control={control}
          name={`${prefix}Monthly`}
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

// On-street operation & fee tab content
interface OnStreetOperationFeeContentProps {
  control: Control<OnStreetOperationFeeFormValues>;
  onParkingZonePress?: () => void;
  isEditing?: boolean;
  /** When true, hide the camera trigger (e.g. a captured photo is already shown below) */
  hideCameraButton?: boolean;
  /** Called with captured/selected photo data — only invoked once per selection */
  onCapturePhoto?: (photo: CapturedPhotoData) => void;
}

export function OnStreetOperationFeeContent({
  control,
  onParkingZonePress,
  isEditing = false,
  hideCameraButton = false,
  onCapturePhoto,
}: OnStreetOperationFeeContentProps) {
  const feeType = useWatch({ control, name: "feeType" });
  const isFree = feeType === "무료";
  const feeEditable = isEditing && !isFree;
  const { showModal } = useAppModal();

  // Open OS settings if permission was previously denied
  const openSettings = useCallback(() => {
    Linking.openSettings().catch(() => {});
  }, []);

  // Capture a single photo via the device camera
  const handlePickFromCamera = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showModal({
        title: "권한 필요",
        message: "카메라 사용 권한이 필요합니다. 설정에서 권한을 허용해주세요.",
        buttons: [
          { text: "취소", style: "cancel" },
          { text: "설정 열기", onPress: openSettings },
        ],
      });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      exif: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const exif = asset.exif as { GPSLatitude?: number; GPSLongitude?: number } | undefined;
    onCapturePhoto?.({
      uri: asset.uri,
      timestamp: new Date().toISOString(),
      gpsLatitude: exif?.GPSLatitude ?? 0,
      gpsLongitude: exif?.GPSLongitude ?? 0,
    });
  }, [showModal, openSettings, onCapturePhoto]);

  // Pick a single photo from the device library
  const handlePickFromLibrary = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showModal({
        title: "권한 필요",
        message: "사진첩 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.",
        buttons: [
          { text: "취소", style: "cancel" },
          { text: "설정 열기", onPress: openSettings },
        ],
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      exif: true,
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const exif = asset.exif as { GPSLatitude?: number; GPSLongitude?: number } | undefined;
    onCapturePhoto?.({
      uri: asset.uri,
      timestamp: new Date().toISOString(),
      gpsLatitude: exif?.GPSLatitude ?? 0,
      gpsLongitude: exif?.GPSLongitude ?? 0,
    });
  }, [showModal, openSettings, onCapturePhoto]);

  // Use the global app modal so the chooser looks identical on iOS and Android
  const handleCameraButtonPress = useCallback(() => {
    showModal({
      title: "주차장 사진",
      message: "사진을 추가하는 방법을 선택해주세요.",
      buttons: [
        { text: "취소", style: "cancel" },
        { text: "사진첩", onPress: handlePickFromLibrary },
        { text: "촬영", onPress: handlePickFromCamera },
      ],
    });
  }, [handlePickFromCamera, handlePickFromLibrary, showModal]);

  return (
    <View>
      {/* Section 1: Parking operation types (주차장 운영방식) */}
      <View style={styles.section}>
        <SectionHeader title="주차장 운영방식" />
        <View style={styles.checkboxGrid}>
          <View style={styles.checkboxHalf}>
            <ControllerCheckbox
              control={control}
              name="opTimeParking"
              label="시간제 주차장"
              disabled={!isEditing}
            />
          </View>
          <View style={styles.checkboxHalf}>
            <ControllerCheckbox
              control={control}
              name="opResidentParking"
              label="거주자우선주차장"
              disabled={!isEditing}
            />
          </View>
          <View style={styles.checkboxHalf}>
            <ControllerCheckbox
              control={control}
              name="opTourBusParking"
              label="관광버스 주차장"
              disabled={!isEditing}
            />
          </View>
          <View style={styles.checkboxHalf}>
            <ControllerCheckbox
              control={control}
              name="opMotorcycleParking"
              label="이륜차주차장"
              disabled={!isEditing}
            />
          </View>
        </View>
      </View>

      {/* Section 2: Operating hours (운영시간) */}
      <View style={styles.section}>
        <SectionHeader title="운영시간" />

        {/* Hourly parking operating hours */}
        <View style={styles.subSection}>
          <Text style={styles.subSectionTitle}>시간제 주차</Text>
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

        {/* Resident parking operating hours */}
        <View style={styles.subSection}>
          <Text style={styles.subSectionTitle}>거주자우선주차</Text>
          <View style={styles.operatingTimeList}>
            <OperatingTimeRow
              label="평일"
              timeValue="00:00 ~ 00:00"
              control={control}
              name="residentWeekdayNotOp"
              disabled={!isEditing}
            />
            <OperatingTimeRow
              label="토요일"
              timeValue="00:00 ~ 00:00"
              control={control}
              name="residentSaturdayNotOp"
              disabled={!isEditing}
            />
            <OperatingTimeRow
              label="공휴일"
              timeValue="00:00 ~ 00:00"
              control={control}
              name="residentHolidayNotOp"
              disabled={!isEditing}
            />
          </View>
        </View>
      </View>

      {/* Section 3: Payment method (주차요금 지불방식) */}
      <View style={styles.section}>
        <SectionHeader title="주차요금 지불방식" />
        <ControllerRadioGroup
          control={control}
          name="paymentMethod"
          options={["카드", "현금", "카드·현금"]}
          disabled={!isEditing}
        />
      </View>

      {/* Section 4: Parking fee (주차요금) */}
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
            placeholder="선택하세요"
            onPress={onParkingZonePress}
            editable={feeEditable}
            containerStyle={styles.fullWidth}
          />
        </View>

        {/* Resident priority parking fees */}
        <View style={styles.feeSubSection}>
          <Text style={styles.subSectionTitle}>거주자우선주차장</Text>
          <View style={styles.feeGrid}>
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

      {/* Section 5: Discount criteria (주차요금 할인기준) */}
      <View style={[styles.section, { borderBottomWidth: 0 }]}>
        <SectionHeader title="주차요금 할인기준" />
        <View style={styles.feeGrid}>
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

      {/* Photo capture section — single photo flow.
          Mirrors PhotoSection visual style but limited to one shot/pick.
          When a photo is already shown below, keep the "사진" label but hide
          the caption + camera tile so only the label remains as a header. */}
      {isEditing && (
        <View style={[styles.photoSection, hideCameraButton && styles.photoSectionCompact]}>
          <View
            style={[
              styles.photoSectionHeader,
              hideCameraButton && styles.photoSectionHeaderCompact,
            ]}
          >
            <RequiredDot />
            <Text style={styles.photoSectionLabel}>사진</Text>
          </View>
          {!hideCameraButton && (
            <>
              <Text style={styles.photoCaption}>주차장 사진</Text>
              <TouchableOpacity
                style={styles.photoCameraButton}
                onPress={handleCameraButtonPress}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Camera size={28} color="#454545" variant="Linear" />
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
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

  // Checkbox grid (2 columns)
  checkboxGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
  },
  checkboxHalf: {
    width: "50%",
  },

  // Sub section
  subSection: {
    marginTop: 12,
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

  // Small field (grid item, 3 columns)
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

  // Fee grid (3 columns)
  feeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  // Vehicle fee section
  vehicleFeeSection: {
    marginTop: 16,
  },

  // Photo capture (single-photo) — mirrors PhotoSection layout but with one trigger only
  photoSection: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E9E9E9",
  },
  // Tighter spacing when only the label remains (camera tile is hidden)
  photoSectionCompact: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  photoSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  photoSectionHeaderCompact: {
    marginBottom: 4,
  },
  photoSectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#151515",
  },
  photoCaption: {
    fontSize: 13,
    fontWeight: "500",
    color: "#454545",
    marginBottom: 8,
  },
  photoCameraButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F4F4F4",
    borderWidth: 1,
    borderColor: "#E9E9E9",
    justifyContent: "center",
    alignItems: "center",
  },
});
