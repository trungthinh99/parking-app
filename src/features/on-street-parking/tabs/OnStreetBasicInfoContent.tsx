import React from "react";
import { View, StyleSheet } from "react-native";
import { Call } from "iconsax-react-native";
import { Control, useWatch } from "react-hook-form";
import { Text } from "@/src/components/Text";
import { ControllerTextInput } from "@/src/components/ControllerTextInput";
import { ControllerDateField } from "@/src/components/ControllerDateField";
import { ControllerRadioGroup } from "@/src/components/ControllerRadioGroup";
import { PhotoSection, type PendingPhoto } from "@/src/components/PhotoSection";
import { RequiredDot } from "@/src/components/RequiredDot";
import type { ParkingLotPhotoDto } from "@/src/api-contracts";

const EMPTY_DELETION_IDS: Set<number> = new Set();

// Form values for on-street basic info
export type OnStreetBasicInfoFormValues = {
  parkingName: string;
  sectionNumber: string;
  zoneNumber: string;
  groupNumber: string;
  installDate: string;
  ownership: string;
  operation: string;
  consignmentName: string;
  contact: string;
};

// Default values for the on-street basic info form
export const ON_STREET_BASIC_INFO_DEFAULT_VALUES: OnStreetBasicInfoFormValues = {
  parkingName: "",
  sectionNumber: "",
  zoneNumber: "",
  groupNumber: "",
  installDate: "",
  ownership: "구",
  operation: "자치구",
  consignmentName: "",
  contact: "",
};

// On-street basic info tab content (기본정보)
interface OnStreetBasicInfoContentProps {
  control: Control<OnStreetBasicInfoFormValues>;
  isEditing?: boolean;
  uploadedPhotos?: ParkingLotPhotoDto[];
  pendingPhotos?: PendingPhoto[];
  pendingDeletionIds?: Set<number>;
  onAddPendingPhoto?: (photo: PendingPhoto) => void;
  onRemovePendingPhoto?: (localId: string) => void;
  onMarkUploadedPhotoForDeletion?: (photoId: number) => void;
}

export function OnStreetBasicInfoContent({
  control,
  isEditing = false,
  uploadedPhotos = [],
  pendingPhotos = [],
  pendingDeletionIds = EMPTY_DELETION_IDS,
  onAddPendingPhoto,
  onRemovePendingPhoto,
  onMarkUploadedPhotoForDeletion,
}: OnStreetBasicInfoContentProps) {
  const contactValue = useWatch({ control, name: "contact" });
  const operationValue = useWatch({ control, name: "operation" });

  return (
    <View>
      {/* Parking management info section (노상주차장 관리정보) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <RequiredDot />
          <Text style={styles.sectionLabelRequired}>노상주차장 관리정보</Text>
        </View>
        <View style={styles.formGrid}>
          <ControllerTextInput
            control={control}
            name="parkingName"
            label="주차장명"
            placeholder="주차장명을 입력하세요"
            editable={isEditing}
          />
          <ControllerTextInput
            control={control}
            name="sectionNumber"
            label="주차구간번호"
            placeholder="A-01"
            editable={isEditing}
          />
          <ControllerTextInput
            control={control}
            name="zoneNumber"
            label="주차구획번호"
            placeholder="A-01-05"
            editable={isEditing}
          />
          <ControllerTextInput
            control={control}
            name="groupNumber"
            label="그룹관리번호"
            placeholder="GRP-001"
            editable={isEditing}
          />
        </View>
        <View style={styles.dateFieldRow}>
          <ControllerDateField
            control={control}
            name="installDate"
            label="주차구획 설치일"
            placeholder="yyyy.mm.dd"
            editable={isEditing}
          />
        </View>
      </View>

      {/* Ownership and operation section (소유 및 운영주체) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <RequiredDot />
          <Text style={styles.sectionLabelRequired}>소유 및 운영주체</Text>
        </View>

        {/* Ownership (소유) */}
        <View style={styles.radioSection}>
          <Text style={styles.radioSectionLabel}>소유</Text>
          <ControllerRadioGroup
            control={control}
            name="ownership"
            options={["시", "구"]}
            disabled={!isEditing}
          />
        </View>

        {/* Operation (운영) */}
        <View style={styles.radioSection}>
          <Text style={styles.radioSectionLabel}>운영</Text>
          <ControllerRadioGroup
            control={control}
            name="operation"
            options={["자치구", "공단", "민간"]}
            disabled={!isEditing}
          />
          {(operationValue === "공단" || operationValue === "민간") && (
            <View style={styles.consignmentRow}>
              <Text style={styles.radioSectionLabel}>위탁</Text>
              <ControllerTextInput
                control={control}
                name="consignmentName"
                placeholder="주차장명을 입력하세요"
                editable={isEditing}
                containerStyle={styles.consignmentInput}
              />
            </View>
          )}
        </View>
      </View>

      {/* Contact section (연락처) */}
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
  sectionLabelRequired: {
    fontSize: 14,
    fontWeight: "700",
    color: "#151515",
  },

  // Form grid (2 columns)
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  // Date field row
  dateFieldRow: {
    marginTop: 8,
  },

  // Radio sections
  radioSection: {
    marginBottom: 12,
  },
  radioSectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#454545",
    marginBottom: 8,
  },

  // Consignment input (위탁)
  consignmentRow: {
    marginTop: 12,
  },
  consignmentInput: {
    width: "50%",
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
});
