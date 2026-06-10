import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Call } from "iconsax-react-native";
import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { Text } from "@/src/components/Text";
import { ControllerTextInput } from "@/src/components/ControllerTextInput";
import { ControllerDateField } from "@/src/components/ControllerDateField";
import { ControllerRadioGroup } from "@/src/components/ControllerRadioGroup";
import { SectionHeader } from "../StreetParkingBottomSheetContent";
import { RequiredDot } from "@/src/components/RequiredDot";
import type { StreetBasicInfoFormValues } from "../StreetParkingBottomSheetContent";
import { PhotoSection, type PendingPhoto } from "@/src/components/PhotoSection";
import type { ParkingLotPhotoDto } from "@/src/api-contracts";

// Ownership radio options
const OWNERSHIP_OPTIONS = ["시", "구", "민간"];

// Operation entity radio options
const OPERATION_OPTIONS = ["자치구", "공단", "민간", "민간위탁"];

const EMPTY_DELETION_IDS: Set<number> = new Set();

/**
 * Basic info tab content (기본정보)
 * Contains: unique number, address, parking management info, ownership & operation, contact, photos
 */
interface StreetBasicInfoContentProps {
  control: Control<StreetBasicInfoFormValues>;
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

export function StreetBasicInfoContent({
  control,
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
}: StreetBasicInfoContentProps) {
  const ownership = useWatch({ control, name: "ownership" });
  const operationEntity = useWatch({ control, name: "operationEntity" });
  const contact = useWatch({ control, name: "contact" });

  return (
    <View>
      {/* Section: Unique number (고유번호) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <RequiredDot />
          <Text style={styles.sectionTitleBold}>고유번호</Text>
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

      {/* Section: Address (주소) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <RequiredDot />
          <Text style={styles.sectionTitleBold}>주소</Text>
        </View>
        {isEditing ? (
          <TouchableOpacity activeOpacity={0.7} onPress={onAddressSearchPress}>
            <View pointerEvents="none">
              <ControllerTextInput
                control={control}
                name="address"
                placeholder="주소를 검색하세요"
                editable={false}
                style={styles.addressEditableInput}
              />
            </View>
          </TouchableOpacity>
        ) : (
          <ControllerTextInput
            control={control}
            name="address"
            placeholder="주소를 검색하세요"
            editable={false}
          />
        )}
        {latitude != null && longitude != null && (
          <Text style={styles.gpsText}>
            (GPS : {latitude}, {longitude})
          </Text>
        )}
      </View>

      {/* Section: Parking management info (노외주차장 관리정보) */}
      <View style={styles.section}>
        <SectionHeader title="노외주차장 관리정보" />
        <View style={styles.fieldRow}>
          <ControllerTextInput
            control={control}
            name="parkingName"
            label="주차장명"
            placeholder="주차장명을 입력하세요"
            editable={isEditing}
          />
          <ControllerDateField
            control={control}
            name="installDate"
            label="설치일"
            placeholder="설치일을"
            editable={isEditing}
          />
        </View>

        {/* Total registered spaces */}
        <ControllerTextInput
          control={control}
          name="totalSpaces"
          label="총 등록주차면"
          placeholder="총 등록주차면수 입력 (면)"
          editable={isEditing}
          keyboardType="number-pad"
        />
      </View>

      {/* Section: Ownership & operation entity (소유 및 운영주체) */}
      <View style={styles.section}>
        <SectionHeader title="소유 및 운영주체" />

        {/* Ownership */}
        <Text style={styles.subLabel}>소유</Text>
        <ControllerRadioGroup
          control={control}
          name="ownership"
          options={OWNERSHIP_OPTIONS}
          disabled={!isEditing}
        />

        {/* Show company name input when 민간 is selected */}
        {ownership === "민간" && (
          <View style={styles.companyNameWrapper}>
            <ControllerTextInput
              control={control}
              name="ownershipCompanyName"
              placeholder="업체명"
              editable={isEditing}
              containerStyle={styles.fullWidth}
            />
          </View>
        )}

        {/* Operation entity */}
        <Text style={[styles.subLabel, { marginTop: 12 }]}>운영</Text>
        <ControllerRadioGroup
          control={control}
          name="operationEntity"
          options={OPERATION_OPTIONS}
          disabled={!isEditing}
        />

        {/* Show company name input when 민간위탁 is selected */}
        {operationEntity === "민간위탁" && (
          <View style={styles.companyNameWrapper}>
            <ControllerTextInput
              control={control}
              name="operationCompanyName"
              placeholder="업체명"
              editable={isEditing}
              containerStyle={styles.fullWidth}
            />
          </View>
        )}
      </View>

      {/* Section: Contact (연락처) */}
      <View style={styles.section}>
        <View style={styles.contactRow}>
          <RequiredDot />
          <Text style={styles.contactTitle}>연락처</Text>
          <Call size={16} color="#151515" variant="Linear" />
          <Text style={styles.phoneText}>{contact || "02 -1234-5678"}</Text>
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

const styles = StyleSheet.create({
  section: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9E9E9",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#454545",
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitleBold: {
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
    width: "auto",
  },
  uniqueNumberLabel: {
    color: "#383838",
    fontWeight: "600",
  },

  // Override disabled style so the address input keeps its editable appearance
  addressEditableInput: {
    borderColor: "#F8F8F8",
    backgroundColor: "#F8F8F8",
    color: "#151515",
  },
  gpsText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#454545",
    marginTop: 4,
  },

  // Fields
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  // Radio
  subLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#454545",
    marginBottom: 8,
  },

  // Company name wrapper (shown when 민간 / 민간위탁 selected)
  companyNameWrapper: {
    width: "48.5%",
    marginTop: 8,
  },
  fullWidth: {
    width: "100%",
  },

  // Contact
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#151515",
  },
  phoneText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
  },
});
